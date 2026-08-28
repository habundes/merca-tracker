import { Stack, ThemeProvider as NavigationThemeProvider, DarkTheme, DefaultTheme } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SearchProvider } from '@/shared/context/SearchContext';
import { ThemeProvider, useTheme } from '@/shared/context/ThemeContext';

function RootNavigator() {
  const { effectiveScheme } = useTheme();
  const isDark = effectiveScheme === 'dark';
  return (
    // El ThemeProvider de navegación mantiene la chrome nativa (tab bar, headers)
    // consistente con el modo de la app y evita el parpadeo al cambiar de tab.
    <NavigationThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }} />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <SearchProvider>
          <RootNavigator />
        </SearchProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
