import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, Platform } from 'react-native';
import { useAuth } from './AuthContext';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ColorScheme = 'light' | 'dark';

export type ThemeColors = {
  bg: string;
  bgSecondary: string;
  bgTertiary: string;
  text: string;
  textMuted: string;
  border: string;
  accent: string;
  danger: string;
  success: string;
  tabInactive: string;
  // Tokens MD3 (aditivos, Android). No afectan glass/iOS.
  surface: string;
  surfaceVariant: string;
  outline: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  elevationTint: string;
  // Fondo semi-transparente (rgba) de la barra de tabs en Android (spec 19).
  // Solo lo consume app/(tabs)/_layout.tsx; iOS usa DynamicColorIOS.
  tabBarBackground: string;
};

export type ThemeContextValue = {
  mode: ThemeMode;
  effectiveScheme: ColorScheme;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
  isHydrated: boolean;
  // Sin sesión el tema no se puede elegir ni guardar: manda el sistema (spec 20).
  canChangeTheme: boolean;
};

export const lightColors: ThemeColors = {
  bg: '#ffffff',
  bgSecondary: '#f9fafb',
  bgTertiary: '#f3f4f6',
  text: '#111111',
  textMuted: '#666666',
  border: '#e5e7eb',
  accent: '#2563eb',
  danger: '#dc2626',
  success: '#16a34a',
  tabInactive: '#aaaaaa',
  surface: '#fef7ff',
  surfaceVariant: '#e7e0ec',
  outline: '#79747e',
  primaryContainer: '#eaddff',
  onPrimaryContainer: '#21005d',
  elevationTint: '#6750a4',
  tabBarBackground: 'rgba(249,250,251,0.92)', // bgSecondary @ 92%
};

export const darkColors: ThemeColors = {
  bg: '#000000',
  bgSecondary: '#0d0d0f',
  bgTertiary: '#2c2c2e',
  text: '#ffffff',
  textMuted: '#8e8e93',
  border: '#38383a',
  accent: '#0a84ff',
  danger: '#ff453a',
  success: '#30d158',
  tabInactive: '#8e8e93',
  surface: '#1c1b1f',
  surfaceVariant: '#49454f',
  outline: '#938f99',
  primaryContainer: '#4f378b',
  onPrimaryContainer: '#eaddff',
  elevationTint: '#d0bcff',
  tabBarBackground: 'rgba(28,27,31,0.92)', // surface #1c1b1f @ 92%
};

export const ON_ACCENT = '#ffffff';

const STORAGE_KEY = '@merca-tracker/theme-preference';
const VALID_MODES: ThemeMode[] = ['light', 'dark', 'system'];

// Esquema real del SO leído al cargar el módulo, es decir ANTES de que el provider
// llame a `Appearance.setColorScheme` para forzar un modo. Una vez forzado, la API
// de `Appearance` devuelve el valor forzado y el del sistema ya no es legible; este
// valor inicial es el fallback para volver al tema del sistema (p. ej. al cerrar
// sesión) sin reiniciar la app.
const initialSystemScheme: ColorScheme = (Appearance.getColorScheme() as ColorScheme) ?? 'light';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [isHydrated, setIsHydrated] = useState(false);
  const [systemScheme, setSystemScheme] = useState<ColorScheme>(initialSystemScheme);
  // El tema es parte de la cuenta (spec 20): sin sesión no se puede elegir ni
  // guardar, así que manda el sistema; el modo guardado vuelve a aplicar al entrar.
  const { isAuthenticated } = useAuth();

  const canChangeTheme = isAuthenticated;
  const followsSystem = !canChangeTheme || mode === 'system';
  const effectiveScheme: ColorScheme = followsSystem ? systemScheme : mode;
  const colors = effectiveScheme === 'dark' ? darkColors : lightColors;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored && VALID_MODES.includes(stored as ThemeMode)) {
          setModeState(stored as ThemeMode);
        } else if (stored !== null) {
          AsyncStorage.removeItem(STORAGE_KEY);
        }
      })
      .catch(() => {})
      // Pase lo que pase con storage, hidratamos: sin esto un rechazo dejaría
      // isHydrated=false para siempre y a todos los consumidores en fallback.
      .finally(() => setIsHydrated(true));
  }, []);

  // Solo se escucha (y se re-lee) el esquema del SO mientras NO estamos forzando
  // la apariencia: con un modo forzado, `Appearance` reporta el valor forzado y
  // contaminaría `systemScheme`.
  // No se re-lee `getColorScheme()` al volver al modo sistema: en ese instante la
  // apariencia forzada todavía está aplicada y devolvería ese valor. Se parte del
  // último valor conocido (o `initialSystemScheme`) y el listener corrige en cuanto
  // el SO reporta el cambio real.
  useEffect(() => {
    if (!followsSystem) return;
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme((colorScheme as ColorScheme) ?? 'light');
    });
    return () => subscription.remove();
  }, [followsSystem]);

  // Fuerza la apariencia nativa al esquema elegido en la app.
  // - iOS: sin esto, la barra de NativeTabs y los colores DynamicColorIOS
  //   resuelven contra el esquema del sistema y parpadean a claro al cambiar de
  //   tab en modo oscuro. `null` = seguir al sistema (mode 'system').
  // - Android: `Appearance.setColorScheme` mapea a
  //   `AppCompatDelegate.setDefaultNightMode`, lo único que re-tinta los
  //   diálogos nativos AppCompat (`Alert.alert`) al tema de la app. Se pasa
  //   siempre el `effectiveScheme` concreto ('light'/'dark'): en Android `null`
  //   revienta, y usar el esquema efectivo hace que 'system' siga al SO.
  useEffect(() => {
    if (Platform.OS === 'ios') {
      // `null` resetea al esquema del sistema; el tipo de RN 0.86 no lo incluye
      // pese a soportarlo en runtime (iOS), de ahí el cast al tipo del parámetro.
      const scheme = (followsSystem ? null : mode) as Parameters<
        typeof Appearance.setColorScheme
      >[0];
      Appearance.setColorScheme(scheme);
    } else if (Platform.OS === 'android') {
      Appearance.setColorScheme(effectiveScheme);
    }
  }, [followsSystem, mode, effectiveScheme]);

  const setMode = (newMode: ThemeMode) => {
    // Sin sesión no se guarda ni se aplica: el tema lo decide el sistema.
    if (!canChangeTheme) return;
    setModeState(newMode);
    AsyncStorage.setItem(STORAGE_KEY, newMode).catch(() => {});
  };

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, effectiveScheme, colors, setMode, isHydrated, canChangeTheme }),
    // `setMode` se recrea en cada render pero solo cierra sobre `canChangeTheme`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode, effectiveScheme, colors, isHydrated, canChangeTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
