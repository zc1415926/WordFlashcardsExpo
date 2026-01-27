import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from './screens/HomeScreen';
import { WordManagementScreen } from './screens/WordManagementScreen';
import { StudyScreen } from './screens/StudyScreen';
import { ImportScreen } from './screens/ImportScreen';

export type RootStackParamList = {
  Home: undefined;
  WordManagement: { action?: 'export' | 'import' };
  Study: { mode: 'english-to-chinese' | 'chinese-to-english'; shuffle: boolean };
  Import: undefined;
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
        <Stack.Screen name="Import" component={ImportScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};