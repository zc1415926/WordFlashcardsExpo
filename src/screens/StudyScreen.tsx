import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StorageService } from '../services/StorageService';
import { TTSService } from '../services/TTSService';
import { FlashCard } from '../components/FlashCard';
import { PageHeader } from '../components/PageHeader';
import { WordCard } from '../types';
import { RootStackParamList } from '../Navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Study'>;

export const StudyScreen: React.FC<Props> = ({ route, navigation }) => {
  const { mode, shuffle } = route.params;
  const [words, setWords] = useState<WordCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadWords();
    TTSService.init();
  }, []);

  const loadWords = async () => {
    const loadedWords = await StorageService.getWords();
    if (loadedWords.length === 0) {
      Alert.alert('提示', '还没有单词，请先添加单词！', [
        { text: '确定', onPress: () => navigation.goBack() },
      ]);
      return;
    }

    // 如果需要乱序，则打乱单词顺序
    if (shuffle) {
      const shuffledWords = [...loadedWords].sort(() => Math.random() - 0.5);
      setWords(shuffledWords);
    } else {
      setWords(loadedWords);
    }
  };

  const getCurrentCard = () => {
    if (words.length === 0) return null;
    return words[currentIndex];
  };

  const handleNext = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // 循环回到第一个单词
      setCurrentIndex(0);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      // 循环到最后一个单词
      setCurrentIndex(words.length - 1);
    }
  };

  const getNextCardData = () => {
    if (words.length === 0) return null;

    const nextIndex = (currentIndex + 1) % words.length;
    const nextCard = words[nextIndex];
    const question = mode === 'english-to-chinese' ? nextCard.english : nextCard.chinese;
    const answer = mode === 'english-to-chinese' ? nextCard.chinese : nextCard.english;
    return { question, answer };
  };

  const getPreviousCardData = () => {
    if (words.length === 0) return null;

    const prevIndex = currentIndex === 0 ? words.length - 1 : currentIndex - 1;
    const prevCard = words[prevIndex];
    const question = mode === 'english-to-chinese' ? prevCard.english : prevCard.chinese;
    const answer = mode === 'english-to-chinese' ? prevCard.chinese : prevCard.english;
    return { question, answer };
  };

  const handleFlip = () => {
    // 可以在这里添加翻转逻辑
  };

  const currentCard = getCurrentCard();

  if (!currentCard) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.content}>
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const question = mode === 'english-to-chinese' ? currentCard.english : currentCard.chinese;
  const answer = mode === 'english-to-chinese' ? currentCard.chinese : currentCard.english;
  let modeTitle: string;
  if (mode === 'english-to-chinese') {
    modeTitle = shuffle ? '乱序英语' : '顺序英语';
  } else {
    modeTitle = shuffle ? '乱序汉语' : '顺序汉语';
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.content}>
        <PageHeader
          title={modeTitle}
          navigation={navigation}
          insets={insets}
          rightElement={
            <Text style={styles.progress}>
              {currentIndex + 1} / {words.length}
            </Text>
          }
        />

        <FlashCard
          question={question}
          answer={answer}
          onFlip={handleFlip}
          onNext={handleNext}
          onPrevious={handlePrevious}
          mode={mode}
          onNextData={getNextCardData}
          onPreviousData={getPreviousCardData}
        />

        <View style={styles.hintContainer}>
          <Text style={styles.hintText}>← 左滑上一个 | 右滑下一个 →</Text>
          <Text style={styles.hintSubText}>点击"查看答案"翻转卡片</Text>
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
  progress: {
    fontSize: 18,
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  loadingText: {
    fontSize: 24,
    color: '#666',
    textAlign: 'center',
    marginTop: 100,
  },
  hintContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  hintText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 8,
  },
  hintSubText: {
    fontSize: 14,
    color: '#AAA',
    textAlign: 'center',
  },
});