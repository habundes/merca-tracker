import { Stack, ThemeProvider as NavigationThemeProvider, DarkTheme, DefaultTheme } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '@/shared/context/AuthContext';
import { SearchProvider } from '@/shared/context/SearchContext';
import { ThemeProvider, lightColors, useTheme } from '@/shared/context/ThemeContext';

function RootNavigator() {
  const { colors, effectiveScheme, isHydrated } = useTheme();
  const isDark = effectiveScheme === 'dark';
  return (
    // El ThemeProvider de navegación mantiene la chrome nativa (tab bar, headers)
    // consistente con el modo de la app y evita el parpadeo al cambiar de tab.
    <NavigationThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {/* `contentStyle` pinta el fondo de las escenas del stack raíz: sin él,
          durante la transición entre `(auth)` y `(tabs)` se ve el fondo de la
          ventana (blanco en Android). */}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: isHydrated ? colors.bg : lightColors.bg,
          },
        }}
      />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* AuthProvider va por fuera: ThemeProvider consulta la sesión para decidir
          si aplica el modo guardado o sigue al sistema (spec 20). */}
      <AuthProvider>
        <ThemeProvider>
          <SearchProvider>
            <RootNavigator />
          </SearchProvider>
        </ThemeProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
