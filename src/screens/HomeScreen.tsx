import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { StorageService } from '../services/StorageService';
import { WordCard } from '../types';
import { RootStackParamList } from '../Navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const EditIcon = () => (
  <Svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2C3E50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    <Path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1" />
    <Path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415" />
    <Path d="M16 5l3 3" />
  </Svg>
);

const ExportIcon = () => (
  <Svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2C3E50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    <Path d="M12.5 21h-6.5a1 1 0 0 1 -1 -1v-16a1 1 0 0 1 1 -1h12a1 1 0 0 1 1 1v8" />
    <Path d="M19 16v6" />
    <Path d="M22 19l-3 3l-3 -3" />
    <Path d="M11 17a1 1 0 1 0 2 0a1 1 0 0 0 -2 0" />
  </Svg>
);

const ImportIcon = () => (
  <Svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2C3E50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    <Path d="M14 3v4a1 1 0 0 0 1 1h4" />
    <Path d="M5 13v-8a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2h-5.5m-9.5 -2h7m-3 -3l3 3l-3 3" />
  </Svg>
);

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [wordCount, setWordCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadWordCount();
    }, [])
  );

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
              style={[styles.button, styles.secondaryButton, styles.thirdButton, styles.iconButton]}
              onPress={() => navigation.navigate('WordManagement', { action: undefined as any })}
            >
              <EditIcon />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton, styles.thirdButton, styles.iconButton]}
              onPress={() => navigation.navigate('WordManagement', { action: 'export' })}
              disabled={wordCount === 0}
            >
              <ExportIcon />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton, styles.thirdButton, styles.iconButton]}
              onPress={() => navigation.navigate('Import' as never)}
            >
              <ImportIcon />
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
  iconButton: {
    padding: 12,
  },
});