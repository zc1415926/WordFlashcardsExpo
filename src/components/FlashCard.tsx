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

// 检测文本是否主要是英文字符
const isMainlyEnglish = (text: string): boolean => {
  const englishChars = text.replace(/[^a-zA-Z]/g, '').length;
  return englishChars / text.length > 0.5;
};

// Helper function to calculate font size based on word length
const calculateFontSize = (text: string): number => {
  const isEnglish = isMainlyEnglish(text);
  // 英文使用更大的基础字体和更宽松的阈值
  const baseFontSize = isEnglish ? 56 : 40;
  const maxLength = isEnglish ? 10 : 5; // 英文10字符内保持大字体
  
  if (text.length <= maxLength) {
    return baseFontSize;
  } else {
    // Reduce font size proportionally to length, with a minimum of 20
    const reductionFactor = maxLength / text.length;
    return Math.max(20, Math.floor(baseFontSize * reductionFactor));
  }
};

// Helper function to calculate padding based on word length
const calculatePadding = (text: string, maxLength: number = 5): number => {
  const basePadding = 30;
  if (text.length <= maxLength) {
    return basePadding;
  } else {
    // Reduce padding for longer words, with a minimum of 8
    const reductionFactor = maxLength / text.length;
    return Math.max(8, Math.floor(basePadding * reductionFactor));
  }
};

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
    const card = getActiveCard();
    const isFlipped = activeCard === 'A' ? cardAIsFlipped.current : cardBIsFlipped.current;
    const toValue = isFlipped ? 0 : 1;

    Animated.timing(card.flipAnimation, {
      toValue: toValue,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      // 更新翻转状态
      if (activeCard === 'A') {
        cardAIsFlipped.current = !isFlipped;
      } else {
        cardBIsFlipped.current = !isFlipped;
      }
      onFlip();
    });
  };

  // 创建卡片切换动画的公共函数
  const createCardTransition = (
    outgoingOffset: number,
    incomingOffset: number,
    onComplete: () => void,
    preloadData?: { question: string; answer: string } | null
  ) => {
    const outgoing = getActiveCard();
    const incoming = getInactiveCard();

    // 预加载卡片数据
    if (preloadData) {
      if (activeCard === 'A') {
        setCardBData(preloadData);
      } else {
        setCardAData(preloadData);
      }
    }

    // 重置并设置入场动画的初始状态
    resetCard(incoming, activeCard === 'A');
    incoming.panX.setValue(incomingOffset);
    incoming.scale.setValue(0.8);
    incoming.opacity.setValue(0);

    // 同时执行退出和入场动画
    Animated.parallel([
      // 退出动画
      Animated.timing(outgoing.panX, {
        toValue: outgoingOffset,
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
      // 入场动画
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
    ]).start(() => {
      onComplete();
      setActiveCard(activeCard === 'A' ? 'B' : 'A');
      isAnimating.current = false;
    });
  };

  const handleNext = () => {
    if (isAnimating.current) return;
    isAnimating.current = true;

    const nextData = onNextData ? onNextData() : null;
    createCardTransition(-500, 500, onNextProp, nextData);
  };

  const handlePrevious = () => {
    if (isAnimating.current) return;
    isAnimating.current = true;

    const prevData = onPreviousData ? onPreviousData() : null;
    createCardTransition(500, -500, onPrevious, prevData);
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

  // 在 renderCard 外部预计算动画插值映射，避免每次渲染重新创建配置对象
  const getInterpolations = (card: CardState) => ({
    questionOpacity: { inputRange: [0, 1], outputRange: [1, 0] },
    questionTranslateY: { inputRange: [0, 1], outputRange: [0, -20] },
    answerOpacity: { inputRange: [0, 1], outputRange: [0, 1] },
    answerTranslateY: { inputRange: [0, 1], outputRange: [20, 0] },
    answerTranslateYLarge: { inputRange: [0, 1], outputRange: [1000, 0] },
  });

  const renderCard = (card: CardState, cardData: CardData, isCardA: boolean) => {
    const isFlipped = isCardA ? cardAIsFlipped.current : cardBIsFlipped.current;
    const isActive = (isCardA && activeCard === 'A') || (!isCardA && activeCard === 'B');

    // Calculate dynamic font sizes and padding
    const questionFontSize = calculateFontSize(cardData.question);
    const answerFontSize = calculateFontSize(cardData.answer);
    const questionPadding = calculatePadding(cardData.question);
    const answerPadding = calculatePadding(cardData.answer);

    // 判断是否为英文，应用 Gothic 字体
    const questionIsEnglish = isMainlyEnglish(cardData.question);
    const answerIsEnglish = isMainlyEnglish(cardData.answer);
    
    // 调试信息
    if (isActive) {
      console.log('=== FlashCard Debug ===');
      console.log('Question:', cardData.question, 'FontSize:', questionFontSize, 'isEnglish:', isMainlyEnglish(cardData.question));
      console.log('Answer:', cardData.answer, 'FontSize:', answerFontSize, 'isEnglish:', isMainlyEnglish(cardData.answer));
    }
    
    // 根据当前状态和活跃卡片确定使用哪种内边距
    const currentVerticalPadding = isActive
      ? (isFlipped ? answerPadding : questionPadding)
      : (isFlipped ? questionPadding : answerPadding);

    const interps = getInterpolations(card);

    const animatedStyle = {
      transform: [{ translateX: card.panX }, { scale: card.scale }],
      opacity: card.opacity,
    };

    return (
      <Animated.View style={[styles.card, { paddingTop: currentVerticalPadding, paddingBottom: currentVerticalPadding }, animatedStyle]}>
        {/* 问题区域 */}
        <Animated.View
          style={[
            styles.questionContainer,
            {
              opacity: card.flipAnimation.interpolate(interps.questionOpacity),
              transform: [{ translateY: card.flipAnimation.interpolate(interps.questionTranslateY) }],
            },
          ]}
        >
          <Text
            style={[
              styles.questionText,
              {
                fontSize: questionFontSize,
                fontFamily: questionIsEnglish ? 'CenturyGothic' : undefined,
                fontWeight: questionIsEnglish ? undefined : 'bold',
              }
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.5}
            allowFontScaling={false}
            onLayout={(event) => {
              if (isActive) {
                console.log('Question Text Layout - Width:', event.nativeEvent.layout.width, 'Height:', event.nativeEvent.layout.height);
              }
            }}
          >
            {cardData.question}
          </Text>
        </Animated.View>
        <Animated.View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            opacity: card.flipAnimation.interpolate(interps.questionOpacity),
          }}
        >
          <TouchableOpacity style={styles.flipButton} onPress={handleFlip}>
            <Text style={styles.flipButtonText}>查看答案</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* 答案区域 */}
        <Animated.View
          style={[
            styles.answerContainer,
            {
              opacity: card.flipAnimation.interpolate(interps.answerOpacity),
              transform: [
                { translateY: card.flipAnimation.interpolate(interps.answerTranslateYLarge) },
                { translateY: card.flipAnimation.interpolate(interps.answerTranslateY) },
              ],
              paddingVertical: answerPadding,
            },
          ]}
        >
          <View style={styles.answerTextContainer}>
            <Text
              style={[
                styles.answerText,
                              {
                                fontSize: answerFontSize,
                                fontFamily: answerIsEnglish ? 'CenturyGothic' : undefined,
                                fontWeight: answerIsEnglish ? undefined : 'bold',
                              }              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.5}
              allowFontScaling={false}
              onLayout={(event) => {
                if (isActive) {
                  console.log('Answer Text Layout - Width:', event.nativeEvent.layout.width, 'Height:', event.nativeEvent.layout.height);
                }
              }}
            >
              {cardData.answer}
            </Text>
          </View>
          <View style={styles.nextButtonContainer}>
            <TouchableOpacity style={styles.nextButton} onPress={handleFlip}>
              <Text style={styles.nextButtonText}>返回</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {renderCard(cardA, cardAData, true)}
      {renderCard(cardB, cardBData, false)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  card: {
    width: '100%',
    height: 350,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'flex-start',
    paddingVertical: 40,
    paddingHorizontal: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,
    elevation: 10,
    position: 'absolute',
  },
  questionContainer: {
    height: 116,
    justifyContent: 'center',
    width: '100%',
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
    paddingVertical: 40,
    paddingHorizontal: 0,
  },
  answerTextContainer: {
    height: 116,
    justifyContent: 'center',
    width: '100%',
  },
  questionText: {
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    width: '100%',
  },
  answerText: {
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    width: '100%',
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
  nextButtonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
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