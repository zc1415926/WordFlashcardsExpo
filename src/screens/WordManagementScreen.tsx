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
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StorageService } from '../services/StorageService';
import { WordCard } from '../types';
import { RootStackParamList } from '../Navigation';
import { PageHeader } from '../components/PageHeader';
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

    // Update the word in place, preserving order
    await StorageService.updateWord({
      ...editingWord,
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
  
      // 生成 CSV 内容，添加 BOM 以便 Excel 正确识别 UTF-8 编码
          const csvContent = '\uFEFF' + exportWords.map(word => {
            // 清理不可见字符（零宽字符、软连字符等）
            const cleanEnglish = word.english.replace(/[\u200B-\u200D\uFEFF]/g, '');
            const cleanChinese = word.chinese.replace(/[\u200B-\u200D\uFEFF]/g, '');
            return `${cleanEnglish},${cleanChinese}`;
          }).join('\n');      try {
        // 在应用的文档目录中创建临时文件
        const fileUri = `${FileSystem.documentDirectory}words.csv`;
        await FileSystem.writeAsStringAsync(fileUri, csvContent);
        console.log('文件已创建:', fileUri);
        
        // 使用分享功能让用户保存文件
              await Sharing.shareAsync(fileUri, {
                mimeType: 'text/csv',
                dialogTitle: '导出单词列表',
                UTI: 'public.comma-separated-values-text',
              });        
        Alert.alert(
          '导出成功',
          `已成功导出 ${exportWords.length} 个单词`,
          [
            { text: '确定', onPress: () => {} }
          ]
        );
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
        <Text style={[styles.cellText, { fontFamily: 'CenturyGothic' }]}>{item.english}</Text>
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
        <PageHeader
          title="管理单词"
          navigation={navigation}
          insets={insets}
        />

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
              textAlignVertical="center"
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder="汉语意思"
              value={chinese}
              onChangeText={setChinese}
              placeholderTextColor="#999"
              textAlignVertical="center"
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
    paddingVertical: 0,
    height: 50,
    fontSize: 18,
    marginBottom: 15,
    color: '#333',
    textAlignVertical: 'center',
    includeFontPadding: false,
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