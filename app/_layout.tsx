import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SearchProvider } from '../src/shared/context/SearchContext';
import { ThemeProvider } from '../src/shared/context/ThemeContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <SearchProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }} />
      </SearchProvider>
    </ThemeProvider>
  );
}
