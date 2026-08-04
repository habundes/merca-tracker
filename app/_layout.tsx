import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SearchProvider } from '../src/shared/context/SearchContext';

export default function RootLayout() {
  return (
    <SearchProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </SearchProvider>
  );
}
