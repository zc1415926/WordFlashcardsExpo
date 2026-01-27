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
import { WordCard } from '../types';
import { RootStackParamList } from '../Navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Study'>;

export const StudyScreen: React.FC<Props> = ({ route, navigation }) => {
  const { mode } = route.params;
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
    setWords(loadedWords);
  };

  const getCurrentCard = () => {
    if (words.length === 0) return null;
    return words[currentIndex];
  };

  const handleNext = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      Alert.alert('恭喜', '你已经学完所有单词！', [
        { text: '返回首页', onPress: () => navigation.navigate('Home') },
        { text: '重新开始', onPress: () => setCurrentIndex(0) },
      ]);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const getNextCardData = () => {
    if (currentIndex < words.length - 1) {
      const nextCard = words[currentIndex + 1];
      const question = mode === 'english-to-chinese' ? nextCard.english : nextCard.chinese;
      const answer = mode === 'english-to-chinese' ? nextCard.chinese : nextCard.english;
      return { question, answer };
    }
    return null;
  };

  const getPreviousCardData = () => {
    if (currentIndex > 0) {
      const prevCard = words[currentIndex - 1];
      const question = mode === 'english-to-chinese' ? prevCard.english : prevCard.chinese;
      const answer = mode === 'english-to-chinese' ? prevCard.chinese : prevCard.english;
      return { question, answer };
    }
    return null;
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
  const modeTitle = mode === 'english-to-chinese' ? '看英语说汉语' : '看汉语说英语';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.content}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← 返回</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{modeTitle}</Text>
          <Text style={styles.progress}>
            {currentIndex + 1} / {words.length}
          </Text>
        </View>

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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
    flex: 1,
    textAlign: 'center',
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