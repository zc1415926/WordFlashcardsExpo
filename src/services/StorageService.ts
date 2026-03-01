import AsyncStorage from '@react-native-async-storage/async-storage';
import { WordCard } from '../types';

const STORAGE_KEY = '@word_flashcards';

export class StorageService {
  static async getWords(): Promise<WordCard[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
      console.error('Error loading words:', e);
      return [];
    }
  }

  static async saveWords(words: WordCard[]): Promise<void> {
    try {
      const jsonValue = JSON.stringify(words);
      await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
    } catch (e) {
      console.error('Error saving words:', e);
    }
  }

  static async addWord(word: Omit<WordCard, 'id' | 'createdAt'>): Promise<void> {
    const words = await this.getWords();
    const newWord: WordCard = {
      ...word,
      id: Date.now().toString(),
      createdAt: Date.now(),
    };
    await this.saveWords([...words, newWord]);
  }

  static async deleteWord(id: string): Promise<void> {
    const words = await this.getWords();
    const filteredWords = words.filter(word => word.id !== id);
    await this.saveWords(filteredWords);
  }

  static async updateWord(updatedWord: WordCard): Promise<void> {
    const words = await this.getWords();
    const updatedWords = words.map(word => 
      word.id === updatedWord.id ? updatedWord : word
    );
    await this.saveWords(updatedWords);
  }

  static async clearAllWords(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Error clearing words:', e);
    }
  }
}