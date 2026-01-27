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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StorageService } from '../services/StorageService';
import { WordCard } from '../types';
import { RootStackParamList } from '../Navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'WordManagement'>;

export const WordManagementScreen: React.FC<Props> = ({ navigation }) => {
  const [words, setWords] = useState<WordCard[]>([]);
  const [english, setEnglish] = useState('');
  const [chinese, setChinese] = useState('');
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadWords();
  }, []);

  const loadWords = async () => {
    const loadedWords = await StorageService.getWords();
    setWords(loadedWords);
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
});