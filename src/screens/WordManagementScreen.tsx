import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  SafeAreaView,
  StatusBar,
  Keyboard,
  ScrollView,
  Modal,
  Pressable,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { Directory } from 'expo-file-system';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StorageService } from '../services/StorageService';
import { WordCard } from '../types';
import { RootStackParamList } from '../Navigation';
import Svg, { Path } from 'react-native-svg';

type Props = NativeStackScreenProps<RootStackParamList, 'WordManagement'>;

export const WordManagementScreen: React.FC<Props> = ({ navigation, route }) => {
  const [words, setWords] = useState<WordCard[]>([]);
  const [english, setEnglish] = useState('');
  const [chinese, setChinese] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingWord, setEditingWord] = useState<WordCard | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [wordToDelete, setWordToDelete] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const initialize = async () => {
      const loadedWords = await loadWords();

      // 检查是否从首页进入，触发导出
      if (route.params?.action === 'export') {
        handleExport(loadedWords);
      }
    };

    initialize();
  }, []);

  const loadWords = async () => {
    const loadedWords = await StorageService.getWords();
    setWords(loadedWords);
    return loadedWords;
  };

  const handleAddWord = async () => {
    if (!english.trim() || !chinese.trim()) {
      Alert.alert('提示', '请输入英语和汉语意思');
      return;
    }

    await StorageService.addWord({
      english: english.trim(),
      chinese: chinese.trim(),
    });

    setEnglish('');
    setChinese('');
    Keyboard.dismiss();
    await loadWords();
    Alert.alert('成功', '单词添加成功！');
  };

  const handleDeleteWord = (id: string) => {
    setWordToDelete(id);
    setDeleteModalVisible(true);
  };

  const confirmDeleteWord = async () => {
    if (wordToDelete) {
      await StorageService.deleteWord(wordToDelete);
      await loadWords();
      setDeleteModalVisible(false);
      setWordToDelete(null);
    }
  };

  const handleEditWord = (word: WordCard) => {
    setEditingWord(word);
    setEnglish(word.english);
    setChinese(word.chinese);
    setModalVisible(true);
  };

  const saveEditedWord = async () => {
    if (!editingWord || !english.trim() || !chinese.trim()) {
      Alert.alert('提示', '请输入英语和汉语意思');
      return;
    }

    // Remove the old word
    await StorageService.deleteWord(editingWord.id);
    
    // Add the updated word
    await StorageService.addWord({
      english: english.trim(),
      chinese: chinese.trim(),
    });

    setModalVisible(false);
    setEditingWord(null);
    setEnglish('');
    setChinese('');
    await loadWords();
    Alert.alert('成功', '单词修改成功！');
  };

  const handleExport = async (wordsToExport?: WordCard[]) => {
    const exportWords = wordsToExport || words;

    if (exportWords.length === 0) {
      Alert.alert('提示', '没有单词可以导出');
      return;
    }

    // 生成 CSV 内容
    const csvContent = exportWords.map(word => `${word.english},${word.chinese}`).join('\n');

    try {
      // 让用户选择保存目录
      const directory = await Directory.pickDirectoryAsync('选择保存位置');
      
      if (!directory) {
        return; // 用户取消了选择
      }
      
      console.log('选择的目录:', directory);
      
      // 使用 Directory 对象的 createFile 方法
      const dirObj = new Directory(directory.uri);
      console.log('Directory 对象:', dirObj);
      console.log('Directory 方法:', Object.getOwnPropertyNames(Object.getPrototypeOf(dirObj)));
      
      // 生成唯一的文件名
      let fileName = 'words.csv';
      try {
        // 使用 list() 而不是 listFiles()
        const items = await dirObj.list();
        console.log('目录中的文件/文件夹:', items);
        console.log('所有文件名:', items.map(i => i.name));
        
        // 提取现有的 words.csv 相关文件（匹配两种格式：words.csv, words(1).csv, words.csv (1)）
              const wordsItems = items.filter(item => {
                return (item as any).type === 'file' && (
                  item.name.match(/^words(\(\d+\))?\.csv$/i) || 
                  item.name.match(/^words\.csv\s*\(\d+\)$/i)
                );
              });        console.log('words 相关文件:', wordsItems);
        
        if (wordsItems.length > 0) {
          // 找到最大的编号
          let maxNum = 0;
          wordsItems.forEach(item => {
            // 匹配 words(数字).csv 格式
            let match = item.name.match(/^words\((\d+)\)\.csv$/i);
            if (!match) {
              // 匹配 words.csv (数字) 格式
              match = item.name.match(/^words\.csv\s*\((\d+)\)$/i);
            }
            if (match) {
              const num = parseInt(match[1], 10);
              if (num > maxNum) {
                maxNum = num;
              }
            }
          });
          
          // 生成新的文件名：words(数字).csv
          fileName = `words(${maxNum + 1}).csv`;
          console.log('使用新文件名:', fileName);
        }
      } catch (listError) {
        console.log('列出目录文件失败，可能目录为空:', listError);
      }
      
      // 尝试创建文件
      try {
        console.log('CSV 内容长度:', csvContent.length);
        console.log('CSV 内容前100个字符:', csvContent.substring(0, 100));
        console.log('创建文件:', fileName);
        
        // 使用 FS API 直接写入文件
        const fileUri = `${directory.uri}/${fileName}`;
        await FileSystem.writeAsStringAsync(fileUri, csvContent);
        console.log('文件内容已写入');
        
        Alert.alert(
          '导出成功',
          `已成功导出 ${exportWords.length} 个单词\n\n文件位置: ${directory.uri}/${fileName}`,
          [
            { text: '确定', onPress: () => {} }
          ]
        );
      } catch (createError) {
        console.error('创建文件失败:', createError);
        console.error('错误类型:', (createError as any)?.constructor?.name);
        console.error('错误消息:', (createError as any)?.message);
        console.error('错误堆栈:', (createError as any)?.stack);
        throw createError;
      }
    } catch (error) {
      console.error('导出失败:', error);
      console.error('错误类型:', (error as any)?.constructor?.name);
      console.error('错误消息:', (error as any)?.message);
      console.error('错误堆栈:', (error as any)?.stack);
      
      // 如果用户取消或失败，使用剪贴板作为备用方案
      try {
        await Clipboard.setStringAsync(csvContent);
        Alert.alert(
          '导出成功（备用方案）',
          `已成功导出 ${exportWords.length} 个单词\n\n由于无法保存到文件，内容已复制到剪贴板\n请粘贴到文本编辑器并保存为 words.csv 文件`,
          [
            { text: '确定', onPress: () => {} },
          ]
        );
      } catch (clipboardError) {
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        console.error('Export error:', error);
        Alert.alert(
          '导出失败',
          `复制到剪贴板时出错\n\n错误详情: ${errorMessage}`,
          [
            { text: '确定', onPress: () => {} },
          ]
        );
      }
    }
  };

  

  

  

  

  const renderWordItem = ({ item, index }: { item: WordCard, index: number }) => (
    <View style={index === words.length - 1 ? styles.tableRowLast : styles.tableRow}>
      <View style={styles.englishCell}>
        <Text style={styles.cellText}>{item.english}</Text>
      </View>
      <View style={styles.chineseCell}>
        <Text style={styles.cellText}>{item.chinese}</Text>
      </View>
      <View style={styles.editCell}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => handleEditWord(item)}
        >
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </Svg>
        </TouchableOpacity>
      </View>
      <View style={styles.deleteCell}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => handleDeleteWord(item.id)}
        >
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <Path d="M18 6 6 18" />
            <Path d="m6 6 12 12" />
          </Svg>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.content}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← 返回</Text>
          </TouchableOpacity>
          <Text style={styles.title}>管理单词</Text>
          <View style={{ width: 50 }} />
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="英语单词"
            value={english}
            onChangeText={setEnglish}
            placeholderTextColor="#999"
            textAlignVertical="center"
          />
          <TextInput
            style={styles.input}
            placeholder="汉语意思"
            value={chinese}
            onChangeText={setChinese}
            placeholderTextColor="#999"
            textAlignVertical="center"
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddWord}>
            <Text style={styles.addButtonText}>添加单词</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listContainer}>
          <Text style={styles.listTitle}>
            单词列表 ({words.length} 个)
          </Text>
          <View style={styles.tableContainer}>
            <FlatList
              data={words}
              renderItem={renderWordItem}
              keyExtractor={(item) => item.id}
              style={styles.list}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>还没有单词，快去添加吧！</Text>
                </View>
              }
            />
          </View>
        </View>
      </View>

      {/* Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>编辑单词</Text>
            </View>
            
            <TextInput
              style={styles.modalInput}
              placeholder="英语单词"
              value={english}
              onChangeText={setEnglish}
              placeholderTextColor="#999"
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder="汉语意思"
              value={chinese}
              onChangeText={setChinese}
              placeholderTextColor="#999"
            />
            
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setEditingWord(null);
                }}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveEditedWord}
              >
                <Text style={styles.modalButtonText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        animationType="none"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => {
          setDeleteModalVisible(false);
          setWordToDelete(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>确认删除</Text>
            </View>
            
            <Text style={styles.modalText}>确定要删除这个单词吗？</Text>
            
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setDeleteModalVisible(false);
                  setWordToDelete(null);
                }}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteConfirmButton]}
                onPress={confirmDeleteWord}
              >
                <Text style={styles.modalButtonText}>删除</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFE4B5',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    fontSize: 18,
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingTop: 0,
    paddingBottom: 0,
    fontSize: 18,
    marginBottom: 10,
    color: '#333',
    height: 50,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  addButton: {
    backgroundColor: '#4ECDC4',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 5,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  listContainer: {
    flex: 1,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 10,
  },
  list: {
    flex: 1,
  },
  tableContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#4ECDC4',
  },
  headerCell: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerCellLast: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    height: 60, // 减小行高
  },
  tableRowLast: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    height: 60, // 减小行高
  },
  englishCell: {
    flex: 3, // 增加第一列宽度
    padding: 10, // 减小内边距
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  chineseCell: {
    flex: 3, // 增加第二列宽度
    padding: 10, // 减小内边距
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  editCell: {
    flex: 1, // 减小第三列宽度
    padding: 10, // 减小内边距
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteCell: {
    flex: 1, // 减小第四列宽度
    padding: 10, // 减小内边距
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellText: {
    fontSize: 16, // 减小字体大小
    color: '#333',
    textAlign: 'left',
  },
  editButton: {
    backgroundColor: '#4ECDC4',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  iconButton: {
    padding: 10,
    alignItems: 'center',
  },
  icon: {
    width: 24,
    height: 24,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxHeight: '80%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  modalInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 18,
    marginBottom: 15,
    color: '#333',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  saveButton: {
    backgroundColor: '#4ECDC4',
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  deleteModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  deleteConfirmButton: {
    backgroundColor: '#FF6B6B',
  },
  modalText: {
    fontSize: 18,
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
  },
});