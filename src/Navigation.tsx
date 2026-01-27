import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from './screens/HomeScreen';
import { WordManagementScreen } from './screens/WordManagementScreen';
import { StudyScreen } from './screens/StudyScreen';

export type RootStackParamList = {
  Home: undefined;
  WordManagement: undefined;
  Study: { mode: 'english-to-chinese' | 'chinese-to-english' };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const Navigation = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="WordManagement" component={WordManagementScreen} />
        <Stack.Screen name="Study" component={StudyScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};