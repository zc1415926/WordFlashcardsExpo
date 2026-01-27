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
  }).current;

  const cardB = useRef<CardState>({
    panX: new Animated.Value(500),
    scale: new Animated.Value(0.8),
    opacity: new Animated.Value(0),
    flipAnimation: new Animated.Value(0),
  }).current;

  const [activeCard, setActiveCard] = useState<'A' | 'B'>('A');
  const isAnimating = useRef(false);
  const cardAIsFlipped = useRef(false);
  const cardBIsFlipped = useRef(false);

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

  const resetCard = (card: CardState, isCardA: boolean) => {
    card.flipAnimation.setValue(0);
    card.panX.setValue(0);
    card.scale.setValue(1);
    card.opacity.setValue(1);
    if (isCardA) {
      cardAIsFlipped.current = false;
    } else {
      cardBIsFlipped.current = false;
    }
  };

  const handleFlip = () => {
    console.log('=== handleFlip 被调用 ===');
    const card = getActiveCard();
    const isFlipped = activeCard === 'A' ? cardAIsFlipped.current : cardBIsFlipped.current;
    const toValue = isFlipped ? 0 : 1;
    console.log('当前卡片:', activeCard, 'isFlipped:', isFlipped, 'toValue:', toValue);

    Animated.timing(card.flipAnimation, {
      toValue: toValue,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      console.log('翻转动画完成');
      // 更新翻转状态
      if (activeCard === 'A') {
        cardAIsFlipped.current = !isFlipped;
      } else {
        cardBIsFlipped.current = !isFlipped;
      }
      onFlip();
    });
  };

  const handleNext = () => {
    console.log('=== handleNext 被调用 ===');
    if (isAnimating.current) {
      console.log('正在动画中，忽略 handleNext');
      return;
    }
    isAnimating.current = true;

    const outgoing = getActiveCard();
    const incoming = getInactiveCard();
    console.log('当前卡片:', activeCard, '切换到:', activeCard === 'A' ? 'B' : 'A');

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
    resetCard(incoming, activeCard === 'A');
    incoming.panX.setValue(500);
    incoming.scale.setValue(0.8);
    incoming.opacity.setValue(0);

    // 同时执行退出和入场动画
    Animated.parallel([
      // 退出动画
      Animated.parallel([
        Animated.timing(outgoing.panX, {
          toValue: -500,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(outgoing.scale, {
          toValue: 0.8,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(outgoing.opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]),
      // 入场动画，立即开始，使用timing替代spring
      Animated.parallel([
        Animated.timing(incoming.panX, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(incoming.scale, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(incoming.opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
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
    resetCard(incoming, activeCard === 'A');
    incoming.panX.setValue(-500);
    incoming.scale.setValue(0.8);
    incoming.opacity.setValue(0);

    // 同时执行退出和入场动画
    Animated.parallel([
      // 退出动画
      Animated.parallel([
        Animated.timing(outgoing.panX, {
          toValue: 500,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(outgoing.scale, {
          toValue: 0.8,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(outgoing.opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]),
      // 入场动画，立即开始，使用timing替代spring
      Animated.parallel([
        Animated.timing(incoming.panX, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(incoming.scale, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(incoming.opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
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
        Animated.timing(card.panX, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  const renderCard = (card: CardState, cardData: CardData, isBack: boolean = false) => {
    // 使用透明度和位移来显示/隐藏答案
    const questionOpacity = card.flipAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0],
    });

    const questionTranslateY = card.flipAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -20],
    });

    const answerOpacity = card.flipAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    const answerTranslateY = card.flipAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [20, 0],
    });

    const animatedStyle = {
      transform: [
        { translateX: card.panX },
        { scale: card.scale },
      ],
      opacity: card.opacity,
    };

    // 判断当前卡片是否翻转
    const isCardA = card === cardA;
    const isFlipped = isCardA ? cardAIsFlipped.current : cardBIsFlipped.current;

    return (
      <Animated.View style={[styles.card, animatedStyle]}>
        {/* 问题区域 */}
        <Animated.View
          style={{
            opacity: questionOpacity,
            transform: [{ translateY: questionTranslateY }],
            alignItems: 'center',
            pointerEvents: isFlipped ? 'none' : 'auto',
          }}
        >
          <Text style={styles.questionText}>{cardData.question}</Text>
          <TouchableOpacity style={styles.flipButton} onPress={handleFlip}>
            <Text style={styles.flipButtonText}>查看答案</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* 答案区域 */}
        <Animated.View
          style={[
            styles.answerContainer,
            {
              opacity: answerOpacity,
              transform: [{ translateY: answerTranslateY }],
            },
          ]}
          pointerEvents={isFlipped ? 'auto' : 'none'}
        >
          <Text style={styles.answerText}>{cardData.answer}</Text>
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>下一个 →</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
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
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 60,
    padding: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,
    elevation: 10,
    position: 'absolute',
  },
  answerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#4ECDC4',
    borderRadius: 25,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 60,
    padding: 40,
  },
  questionText: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginTop: -20,
    marginBottom: 80,
  },
  answerText: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: -20,
    marginBottom: 20,
  },
  flipButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 50,
    paddingVertical: 18,
    borderRadius: 30,
  },
  flipButtonText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  nextButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 50,
    paddingVertical: 18,
    borderRadius: 30,
  },
  nextButtonText: {
    color: '#4ECDC4',
    fontSize: 22,
    fontWeight: 'bold',
  },
});