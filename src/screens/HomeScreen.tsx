import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StorageService } from '../services/StorageService';
import { WordCard } from '../types';
import { RootStackParamList } from '../Navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    loadWordCount();
  }, []);

  const loadWordCount = async () => {
    const words = await StorageService.getWords();
    setWordCount(words.length);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.content}>
        <Text style={styles.title}>背单词闪卡</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>当前单词数</Text>
          <Text style={styles.cardNumber}>{wordCount}</Text>
        </View>

        <View style={styles.buttonContainer}>
          <View style={styles.rowButtonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton, styles.halfButton]}
              onPress={() => navigation.navigate('Study', { mode: 'english-to-chinese', shuffle: false })}
              disabled={wordCount === 0}
            >
              <Text style={styles.buttonText}>顺序英语</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.primaryButton, styles.halfButton]}
              onPress={() => navigation.navigate('Study', { mode: 'english-to-chinese', shuffle: true })}
              disabled={wordCount === 0}
            >
              <Text style={styles.buttonText}>乱序英语</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.rowButtonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton, styles.halfButton]}
              onPress={() => navigation.navigate('Study', { mode: 'chinese-to-english', shuffle: false })}
              disabled={wordCount === 0}
            >
              <Text style={styles.buttonText}>顺序汉语</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.primaryButton, styles.halfButton]}
              onPress={() => navigation.navigate('Study', { mode: 'chinese-to-english', shuffle: true })}
              disabled={wordCount === 0}
            >
              <Text style={styles.buttonText}>乱序汉语</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.rowButtonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton, styles.thirdButton]}
              onPress={() => navigation.navigate('WordManagement')}
            >
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>管理单词</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton, styles.thirdButton]}
              onPress={() => navigation.navigate('WordManagement', { action: 'export' })}
              disabled={wordCount === 0}
            >
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>出</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton, styles.thirdButton]}
              onPress={() => navigation.navigate('WordManagement', { action: 'import' })}
            >
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>入</Text>
            </TouchableOpacity>
          </View>
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
    justifyContent: 'center',
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#FF6B6B',
    marginBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 24,
    color: '#666',
    marginBottom: 10,
  },
  cardNumber: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  buttonContainer: {
    gap: 15,
  },
  rowButtonContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  halfButton: {
    flex: 1,
  },
  thirdButton: {
    flex: 1,
  },
  button: {
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  primaryButton: {
    backgroundColor: '#4ECDC4',
  },
  secondaryButton: {
    backgroundColor: '#95E1D3',
  },
  buttonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#2C3E50',
  },
});