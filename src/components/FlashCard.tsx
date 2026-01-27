import React, { useState } from 'react';
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
}

export const FlashCard: React.FC<FlashCardProps> = ({
  question,
  answer,
  onFlip,
  onNext: onNextProp,
  onPrevious,
  mode,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [flipAnimation] = useState(new Animated.Value(0));
  const panX = useState(new Animated.Value(0))[0];
  const scale = useState(new Animated.Value(1))[0];
  const opacity = useState(new Animated.Value(1))[0];

  const handleFlip = () => {
    Animated.timing(flipAnimation, {
      toValue: isFlipped ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsFlipped(!isFlipped);
      onFlip();
    });
  };

  const handleSpeak = async () => {
    const textToSpeak = mode === 'english-to-chinese' ? question : answer;
    await TTSService.speak(textToSpeak);
  };

  const resetCardAnimation = () => {
    setIsFlipped(false);
    flipAnimation.setValue(0);
    Animated.parallel([
      Animated.timing(panX, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 0,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 0,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleNext = () => {
    Animated.parallel([
      Animated.timing(panX, {
        toValue: -500,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onNextProp();
      resetCardAnimation();
      Animated.parallel([
        Animated.timing(panX, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.8,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]).start();
      Animated.parallel([
        Animated.spring(panX, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(opacity, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handlePrevious = () => {
    Animated.parallel([
      Animated.timing(panX, {
        toValue: 500,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onPrevious();
      resetCardAnimation();
      Animated.parallel([
        Animated.timing(panX, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.8,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]).start();
      Animated.parallel([
        Animated.spring(panX, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(opacity, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dx) > 10;
    },
    onPanResponderMove: (_, gestureState) => {
      Animated.timing(panX, {
        toValue: gestureState.dx,
        duration: 0,
        useNativeDriver: true,
      }).start();
    },
    onPanResponderRelease: (_, gestureState) => {
      const threshold = 50;
      if (gestureState.dx > threshold) {
        handlePrevious();
      } else if (gestureState.dx < -threshold) {
        handleNext();
      } else {
        Animated.spring(panX, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  const frontInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const frontAnimatedStyle = {
    transform: [
      { rotateY: frontInterpolate },
      { translateX: panX },
      { scale },
    ],
    opacity,
  };

  const backAnimatedStyle = {
    transform: [
      { rotateY: backInterpolate },
      { translateX: panX },
      { scale },
    ],
    opacity,
  };

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Animated.View style={[styles.card, frontAnimatedStyle, styles.cardFront]}>
        <Text style={styles.questionLabel}>问题</Text>
        <Text style={styles.questionText}>{question}</Text>
        <TouchableOpacity style={styles.speakButton} onPress={handleSpeak}>
          <Text style={styles.speakButtonText}>🔊 播放发音</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.flipButton} onPress={handleFlip}>
          <Text style={styles.flipButtonText}>查看答案</Text>
        </TouchableOpacity>
      </Animated.View>

      {isFlipped && (
        <Animated.View style={[styles.card, backAnimatedStyle, styles.cardBack]}>
          <Text style={styles.answerLabel}>答案</Text>
          <Text style={styles.answerText}>{answer}</Text>
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>下一个 →</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
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