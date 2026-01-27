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
  Modal,
  ScrollView,
  Clipboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StorageService } from '../services/StorageService';
import { WordCard } from '../types';
import { RootStackParamList } from '../Navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'WordManagement'>;

export const WordManagementScreen: React.FC<Props> = ({ navigation, route }) => {
  const [words, setWords] = useState<WordCard[]>([]);
  const [english, setEnglish] = useState('');
  const [chinese, setChinese] = useState('');
  const insets = useSafeAreaInsets();

  // 导入导出相关状态
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importContent, setImportContent] = useState('');
  const [importSummary, setImportSummary] = useState('');

  useEffect(() => {
    const initialize = async () => {
      const loadedWords = await loadWords();

      // 检查是否从首页进入，触发导出或导入
      if (route.params?.action === 'export') {
        handleExport(loadedWords);
      } else if (route.params?.action === 'import') {
        handleImport();
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

  const handleDeleteWord = async (id: string) => {
    Alert.alert(
      '确认删除',
      '确定要删除这个单词吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            await StorageService.deleteWord(id);
            await loadWords();
          },
        },
      ]
    );
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
      await Clipboard.setString(csvContent);
      Alert.alert(
        '导出成功',
        `已复制 ${exportWords.length} 个单词到剪贴板，格式为 CSV（英语,汉语）`,
        [
          { text: '确定', onPress: () => {} },
        ]
      );
    } catch (error) {
      Alert.alert('导出失败', '复制到剪贴板时出错');
      console.error('Export error:', error);
    }
  };

  const handleImport = () => {
    setImportContent('');
    setImportModalVisible(true);
  };

  const parseImportContent = (content: string): WordCard[] => {
    const lines = content.trim().split('\n');
    const importedWords: WordCard[] = [];

    lines.forEach((line, index) => {
      const parts = line.split(',');
      if (parts.length >= 2) {
        const english = parts[0].trim();
        const chinese = parts.slice(1).join(',').trim(); // 支持汉语中包含逗号

        if (english && chinese) {
          importedWords.push({
            id: `import_${Date.now()}_${index}`,
            english,
            chinese,
          });
        }
      }
    });

    return importedWords;
  };

  const checkDuplicates = (importedWords: WordCard[]): { duplicates: number; uniqueWords: WordCard[] } => {
    const existingSet = new Set(words.map(w => `${w.english}|${w.chinese}`));
    const uniqueWords: WordCard[] = [];
    let duplicates = 0;

    importedWords.forEach(word => {
      const key = `${word.english}|${word.chinese}`;
      if (existingSet.has(key)) {
        duplicates++;
      } else {
        uniqueWords.push(word);
        existingSet.add(key);
      }
    });

    return { duplicates, uniqueWords };
  };

  const handleImportConfirm = async (mode: 'append' | 'overwrite') => {
    const importedWords = parseImportContent(importContent);

    if (importedWords.length === 0) {
      Alert.alert('提示', '未找到有效的单词数据');
      return;
    }

    if (mode === 'overwrite') {
      // 覆盖模式：清空现有单词，导入新单词
      await StorageService.clearAllWords();
      for (const word of importedWords) {
        await StorageService.addWord(word);
      }
      setImportSummary(`成功导入 ${importedWords.length} 个单词（覆盖原有数据）`);
    } else {
      // 追加模式：检查重复
      const { duplicates, uniqueWords } = checkDuplicates(importedWords);

      if (uniqueWords.length === 0) {
        setImportSummary(`导入的 ${importedWords.length} 个单词全部重复，未添加任何新单词`);
      } else {
        for (const word of uniqueWords) {
          await StorageService.addWord(word);
        }
        if (duplicates > 0) {
          setImportSummary(`成功导入 ${uniqueWords.length} 个新单词，跳过 ${duplicates} 个重复单词`);
        } else {
          setImportSummary(`成功导入 ${uniqueWords.length} 个单词`);
        }
      }
    }

    await loadWords();
  };

  const renderWordItem = ({ item }: { item: WordCard }) => (
    <View style={styles.wordItem}>
      <View style={styles.wordContent}>
        <Text style={styles.englishText}>{item.english}</Text>
        <Text style={styles.chineseText}>{item.chinese}</Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteWord(item.id)}
      >
        <Text style={styles.deleteButtonText}>删除</Text>
      </TouchableOpacity>
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
          />
          <TextInput
            style={styles.input}
            placeholder="汉语意思"
            value={chinese}
            onChangeText={setChinese}
            placeholderTextColor="#999"
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddWord}>
            <Text style={styles.addButtonText}>添加单词</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listContainer}>
          <Text style={styles.listTitle}>
            单词列表 ({words.length} 个)
          </Text>
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

      {/* 导入模态框 */}
      <Modal
        visible={importModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setImportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>导入单词</Text>
              <TouchableOpacity onPress={() => setImportModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalLabel}>粘贴 CSV 内容（格式：英语,汉语，每行一个）：</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="例如：&#10;hello,你好&#10;hi,嗨&#10;goodbye,再见"
                value={importContent}
                onChangeText={setImportContent}
                multiline={true}
                numberOfLines={10}
                textAlignVertical="top"
                placeholderTextColor="#999"
              />

              {importSummary ? (
                <View style={styles.importSummary}>
                  <Text style={styles.importSummaryText}>{importSummary}</Text>
                </View>
              ) : null}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setImportModalVisible(false);
                  setImportContent('');
                  setImportSummary('');
                }}
              >
                <Text style={styles.modalButtonText}>取消</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonAppend]}
                onPress={() => handleImportConfirm('append')}
              >
                <Text style={styles.modalButtonText}>追加导入</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonOverwrite]}
                onPress={() => handleImportConfirm('overwrite')}
              >
                <Text style={styles.modalButtonText}>覆盖导入</Text>
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
    padding: 15,
    fontSize: 18,
    marginBottom: 10,
    color: '#333',
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
  wordItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  wordContent: {
    flex: 1,
  },
  englishText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  chineseText: {
    fontSize: 18,
    color: '#666',
  },
  deleteButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  modalClose: {
    fontSize: 28,
    color: '#999',
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
  },
  modalLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  modalInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#333',
    minHeight: 200,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  importSummary: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  importSummaryText: {
    fontSize: 16,
    color: '#2E7D32',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#E0E0E0',
  },
  modalButtonAppend: {
    backgroundColor: '#4ECDC4',
  },
  modalButtonOverwrite: {
    backgroundColor: '#FF6B6B',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});