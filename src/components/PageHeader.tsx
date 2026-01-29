import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

interface PageHeaderProps {
  title: string;
  navigation: NativeStackNavigationProp<any>;
  insets: { top: number };
  rightElement?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  navigation,
  insets,
  rightElement,
}) => {
  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.backButton}>← 返回</Text>
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
      {rightElement || <View style={styles.placeholder} />}
    </View>
  );
};

const styles = StyleSheet.create({
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
  placeholder: {
    width: 50,
  },
});