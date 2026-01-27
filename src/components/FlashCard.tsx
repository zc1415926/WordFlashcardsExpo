import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native';
import { TTSService } from '../services/TTSService';

interface FlashCardProps {
  question: string;
  answer: string;
  onFlip: () => void;
  onNext: () => void;
  onPrevious: () => void;
  mode: 'english-to-chinese' | 'chinese-to-english';
  onNextData?: () => { question: string; answer: string } | null;
  onPreviousData?: () => { question: string; answer: string } | null;
}

interface CardData {
  question: string;
  answer: string;
}

interface CardState {
  panX: Animated.Value;
  scale: Animated.Value;
  opacity: Animated.Value;
  flipAnimation: Animated.Value;
  isFlipped: boolean;
}

export const FlashCard: React.FC<FlashCardProps> = ({
  question,
  answer,
  onFlip,
  onNext: onNextProp,
  onPrevious,
  mode,
  onNextData,
  onPreviousData,
}) => {
  const [cardAData, setCardAData] = useState<CardData>({ question, answer });
  const [cardBData, setCardBData] = useState<CardData>({ question, answer });

  // 两个卡片的状态
  const cardA = useRef<CardState>({
    panX: new Animated.Value(0),
    scale: new Animated.Value(1),
    opacity: new Animated.Value(1),
    flipAnimation: new Animated.Value(0),
    isFlipped: false,
  }).current;

  const cardB = useRef<CardState>({
    panX: new Animated.Value(500),
    scale: new Animated.Value(0.8),
    opacity: new Animated.Value(0),
    flipAnimation: new Animated.Value(0),
    isFlipped: false,
  }).current;

  const [activeCard, setActiveCard] = useState<'A' | 'B'>('A');
  const isAnimating = useRef(false);

  // 当props变化时，更新当前卡片数据
  useEffect(() => {
    if (!isAnimating.current) {
      if (activeCard === 'A') {
        setCardAData({ question, answer });
      } else {
        setCardBData({ question, answer });
      }
    }
  }, [question, answer]);

  const getActiveCard = () => (activeCard === 'A' ? cardA : cardB);
  const getInactiveCard = () => (activeCard === 'A' ? cardB : cardA);
  const getActiveCardData = () => (activeCard === 'A' ? cardAData : cardBData);
  const getInactiveCardData = () => (activeCard === 'A' ? cardBData : cardAData);

  const resetCard = (card: CardState) => {
    card.isFlipped = false;
    card.flipAnimation.setValue(0);
    card.panX.setValue(0);
    card.scale.setValue(1);
    card.opacity.setValue(1);
  };

  const handleFlip = () => {
    const card = getActiveCard();
    Animated.timing(card.flipAnimation, {
      toValue: card.isFlipped ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      card.isFlipped = !card.isFlipped;
      onFlip();
    });
  };

  const handleSpeak = async (questionText: string, answerText: string) => {
    const textToSpeak = mode === 'english-to-chinese' ? questionText : answerText;
    await TTSService.speak(textToSpeak);
  };

  const handleNext = () => {
    if (isAnimating.current) return;
    isAnimating.current = true;

    const outgoing = getActiveCard();
    const incoming = getInactiveCard();

    // 预加载下一个卡片数据
    const nextData = onNextData ? onNextData() : null;
    if (nextData) {
      if (activeCard === 'A') {
        setCardBData(nextData);
      } else {
        setCardAData(nextData);
      }
    }

    // 重置并设置入场动画的初始状态
    resetCard(incoming);
    incoming.panX.setValue(500);
    incoming.scale.setValue(0.8);
    incoming.opacity.setValue(0);

    // 同时执行退出和入场动画
    Animated.parallel([
      // 退出动画
      Animated.parallel([
        Animated.timing(outgoing.panX, {
          toValue: -500,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(outgoing.scale, {
          toValue: 0.8,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(outgoing.opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      // 入场动画，延迟100ms开始
      Animated.sequence([
        Animated.delay(100),
        Animated.parallel([
          Animated.spring(incoming.panX, {
            toValue: 0,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }),
          Animated.spring(incoming.scale, {
            toValue: 1,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }),
          Animated.spring(incoming.opacity, {
            toValue: 1,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start(() => {
      onNextProp();
      setActiveCard(activeCard === 'A' ? 'B' : 'A');
      isAnimating.current = false;
    });
  };

  const handlePrevious = () => {
    if (isAnimating.current) return;
    isAnimating.current = true;

    const outgoing = getActiveCard();
    const incoming = getInactiveCard();

    // 预加载上一个卡片数据
    const prevData = onPreviousData ? onPreviousData() : null;
    if (prevData) {
      if (activeCard === 'A') {
        setCardBData(prevData);
      } else {
        setCardAData(prevData);
      }
    }

    // 重置并设置入场动画的初始状态
    resetCard(incoming);
    incoming.panX.setValue(-500);
    incoming.scale.setValue(0.8);
    incoming.opacity.setValue(0);

    // 同时执行退出和入场动画
    Animated.parallel([
      // 退出动画
      Animated.parallel([
        Animated.timing(outgoing.panX, {
          toValue: 500,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(outgoing.scale, {
          toValue: 0.8,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(outgoing.opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      // 入场动画，延迟100ms开始
      Animated.sequence([
        Animated.delay(100),
        Animated.parallel([
          Animated.spring(incoming.panX, {
            toValue: 0,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }),
          Animated.spring(incoming.scale, {
            toValue: 1,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }),
          Animated.spring(incoming.opacity, {
            toValue: 1,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start(() => {
      onPrevious();
      setActiveCard(activeCard === 'A' ? 'B' : 'A');
      isAnimating.current = false;
    });
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => !isAnimating.current,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return !isAnimating.current && Math.abs(gestureState.dx) > 10;
    },
    onPanResponderMove: (_, gestureState) => {
      if (isAnimating.current) return;
      const card = getActiveCard();
      Animated.timing(card.panX, {
        toValue: gestureState.dx,
        duration: 0,
        useNativeDriver: true,
      }).start();
    },
    onPanResponderRelease: (_, gestureState) => {
      if (isAnimating.current) return;
      const card = getActiveCard();
      const threshold = 50;
      if (gestureState.dx > threshold) {
        handlePrevious();
      } else if (gestureState.dx < -threshold) {
        handleNext();
      } else {
        Animated.spring(card.panX, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  const renderCard = (card: CardState, cardData: CardData, isBack: boolean = false) => {
    const frontInterpolate = card.flipAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '180deg'],
    });

    const backInterpolate = card.flipAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: ['180deg', '360deg'],
    });

    const frontAnimatedStyle = {
      transform: [
        { rotateY: frontInterpolate },
        { translateX: card.panX },
        { scale: card.scale },
      ],
      opacity: card.opacity,
    };

    const backAnimatedStyle = {
      transform: [
        { rotateY: backInterpolate },
        { translateX: card.panX },
        { scale: card.scale },
      ],
      opacity: card.opacity,
    };

    return (
      <>
        <Animated.View style={[styles.card, frontAnimatedStyle, styles.cardFront]}>
          <Text style={styles.questionLabel}>问题</Text>
          <Text style={styles.questionText}>{cardData.question}</Text>
          <TouchableOpacity style={styles.speakButton} onPress={() => handleSpeak(cardData.question, cardData.answer)}>
            <Text style={styles.speakButtonText}>🔊 播放发音</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.flipButton} onPress={handleFlip}>
            <Text style={styles.flipButtonText}>查看答案</Text>
          </TouchableOpacity>
        </Animated.View>

        {card.isFlipped && (
          <Animated.View style={[styles.card, backAnimatedStyle, styles.cardBack]}>
            <Text style={styles.answerLabel}>答案</Text>
            <Text style={styles.answerText}>{cardData.answer}</Text>
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>下一个 →</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </>
    );
  };

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {renderCard(cardA, cardAData)}
      {renderCard(cardB, cardBData)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    height: 350,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,
    elevation: 10,
    position: 'absolute',
  },
  cardFront: {
    backfaceVisibility: 'hidden',
  },
  cardBack: {
    backfaceVisibility: 'hidden',
    backgroundColor: '#4ECDC4',
  },
  questionLabel: {
    fontSize: 24,
    color: '#999',
    marginBottom: 10,
  },
  questionText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
  },
  answerLabel: {
    fontSize: 24,
    color: '#FFFFFF',
    marginBottom: 10,
  },
  answerText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 30,
  },
  speakButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 15,
  },
  speakButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  flipButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
  },
  flipButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  nextButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
  },
  nextButtonText: {
    color: '#4ECDC4',
    fontSize: 20,
    fontWeight: 'bold',
  },
});