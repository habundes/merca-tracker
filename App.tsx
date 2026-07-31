import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SearchProvider } from './src/context/SearchContext';
import BottomTabs from './src/navigation/BottomTabs';

export default function App() {
  return (
    <SearchProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <BottomTabs />
      </NavigationContainer>
    </SearchProvider>
  );
}
