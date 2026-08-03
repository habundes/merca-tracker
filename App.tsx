import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SearchProvider } from './src/shared/context/SearchContext';
import AppTabs from './src/navigation/AppTabs';

export default function App() {
  return (
    <SearchProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <AppTabs />
      </NavigationContainer>
    </SearchProvider>
  );
}
