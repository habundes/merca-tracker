import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SearchProvider } from '@/shared/context/SearchContext';
import { ThemeProvider } from '@/shared/context/ThemeContext';

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
