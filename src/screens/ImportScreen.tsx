import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StorageService } from '../services/StorageService';
import { WordCard } from '../types';
import { RootStackParamList } from '../Navigation';
import { PageHeader } from '../components/PageHeader';

type Props = NativeStackScreenProps<RootStackParamList, 'Import'>;

export const ImportScreen: React.FC<Props> = ({ navigation }) => {
  const [importContent, setImportContent] = useState('');
  const [importSummary, setImportSummary] = useState('');
  const insets = useSafeAreaInsets();

  const parseImportContent = (content: string): WordCard[] => {
    const lines = content.split('\n');
    const words: WordCard[] = [];

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      const parts = trimmedLine.split(',');
      if (parts.length < 2) {
        console.warn(`第 ${index + 1} 行格式不正确: "${line}"`);
        return;
      }

      const english = parts[0].trim();
      const chinese = parts[1].trim();

      if (english && chinese) {
        words.push({
          id: `import_${Date.now()}_${index}`,
          english,
          chinese,
          createdAt: Date.now(),
        });
      }
    });

    return words;
  };

  const checkDuplicates = (importedWords: WordCard[]) => {
    const existingSet = new Set<string>();
    let duplicates = 0;
    const uniqueWords: WordCard[] = [];

    importedWords.forEach((word) => {
      const key = `${word.english.toLowerCase()}-${word.chinese}`;
      if (existingSet.has(key)) {
        duplicates++;
      } else {
        uniqueWords.push(word);
        existingSet.add(key);
      }
    });

    return { duplicates, uniqueWords };
  };

  const handleImport = async () => {
    try {
      console.log('=== 开始导入 ===');
      
      // 选择文件 - 不指定 type 让系统显示所有文件
      console.log('调用 DocumentPicker.getDocumentAsync');
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
      });

      console.log('DocumentPicker 结果:', result);

      if (result.canceled) {
        console.log('用户取消了文件选择');
        return;
      }

      const file = result.assets[0];
      if (!file.uri) {
        Alert.alert('提示', '未选择文件');
        return;
      }

      console.log('选择的文件:', file);
      console.log('文件 URI:', file.uri);

      // 使用 legacy API 读取文件内容（因为新 API 的 File 没有 text() 方法）
      console.log('使用 legacy API 读取文件');
      const content = await FileSystem.readAsStringAsync(file.uri);

      console.log('文件内容长度:', content.length);

      // 设置导入内容
      setImportContent(content);
      setImportSummary('');
    } catch (error) {
      console.error('Import error:', error);
      const err = error as Error;
      console.error('Error type:', err?.constructor?.name);
      console.error('Error message:', err?.message);
      console.error('Error stack:', err?.stack);
      
      // 检查是否用户取消了选择
      if (error && typeof error === 'object' && 'code' in error && error.code === 'DOCUMENT_PICKER_CANCELED') {
        // 用户取消了文件选择
        return;
      }
      
      Alert.alert('错误', '导入文件失败，请重试');
    }
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

    // 清空输入内容
    setImportContent('');
  };

  const handleClear = () => {
    setImportContent('');
    setImportSummary('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.content}>
        <PageHeader
          title="导入单词"
          navigation={navigation}
          insets={insets}
        />

        <ScrollView style={styles.body}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>方式一：选择 CSV 文件</Text>
            <Text style={styles.sectionDescription}>
              点击下方按钮选择 CSV 文件进行导入
            </Text>
            <TouchableOpacity
              style={[styles.button, styles.selectFileButton]}
              onPress={handleImport}
            >
              <Text style={styles.buttonText}>选择 CSV 文件</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>方式二：粘贴 CSV 内容</Text>
            <Text style={styles.sectionDescription}>
              直接粘贴 CSV 内容（格式：英语,汉语，每行一个）
            </Text>
            <TextInput
              style={styles.input}
              placeholder="例如：&#10;hello,你好&#10;hi,嗨&#10;goodbye,再见"
              value={importContent}
              onChangeText={setImportContent}
              multiline={true}
              numberOfLines={10}
              textAlignVertical="top"
              placeholderTextColor="#999"
            />
          </View>

          {importSummary ? (
            <View style={styles.summary}>
              <Text style={styles.summaryText}>{importSummary}</Text>
            </View>
          ) : null}

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.button, styles.clearButton]}
              onPress={handleClear}
            >
              <Text style={[styles.buttonText, styles.clearButtonText]}>清空</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.appendButton]}
              onPress={() => handleImportConfirm('append')}
            >
              <Text style={styles.buttonText}>追加</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.overwriteButton]}
              onPress={() => handleImportConfirm('overwrite')}
            >
              <Text style={styles.buttonText}>覆盖</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
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
  body: {
    flex: 1,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  selectFileButton: {
    backgroundColor: '#4ECDC4',
    alignSelf: 'flex-start',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#333',
    minHeight: 200,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    textAlignVertical: 'top',
  },
  summary: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  summaryText: {
    fontSize: 16,
    color: '#2E7D32',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#E0E0E0',
  },
  appendButton: {
    backgroundColor: '#4ECDC4',
  },
  overwriteButton: {
    backgroundColor: '#FF6B6B',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  clearButtonText: {
    color: '#666',
  },
});