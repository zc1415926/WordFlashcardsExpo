import * as Speech from 'expo-speech';

export class TTSService {
  static async init(): Promise<void> {
    // Expo speech 不需要初始化
  }

  static async speak(text: string): Promise<void> {
    try {
      await Speech.speak(text, {
        language: 'en-US',
      });
    } catch (error) {
      console.error('TTS Error:', error);
    }
  }

  static async stop(): Promise<void> {
    try {
      await Speech.stop();
    } catch (error) {
      console.error('TTS Stop Error:', error);
    }
  }
}