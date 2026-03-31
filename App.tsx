import { StatusBar } from 'expo-status-bar';
import * as Font from 'expo-font';
import { View } from 'react-native';
import { Navigation } from './src/Navigation';
import { useEffect, useState } from 'react';

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          'CenturyGothic': require('./assets/Gothic.ttf'),
          'StickandBall': require('./assets/StickandBall.ttf'),
          'StickandBallthin': require('./assets/StickandBallthin.ttf'),
        });
        setFontsLoaded(true);
      } catch (error) {
        console.error('Font loading error:', error);
        // 即使字体加载失败，也继续显示应用
        setFontsLoaded(true);
      }
    }
    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return <View />;
  }

  return (
    <>
      <Navigation />
      <StatusBar style="auto" />
    </>
  );
}
