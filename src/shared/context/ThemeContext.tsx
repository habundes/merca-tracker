import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, Platform } from 'react-native';

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
  tabInactive: string;
  // Tokens MD3 (aditivos, Android). No afectan glass/iOS.
  surface: string;
  surfaceVariant: string;
  outline: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  elevationTint: string;
};

export type ThemeContextValue = {
  mode: ThemeMode;
  effectiveScheme: ColorScheme;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
  isHydrated: boolean;
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
  tabInactive: '#aaaaaa',
  surface: '#fef7ff',
  surfaceVariant: '#e7e0ec',
  outline: '#79747e',
  primaryContainer: '#eaddff',
  onPrimaryContainer: '#21005d',
  elevationTint: '#6750a4',
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
  tabInactive: '#8e8e93',
  surface: '#1c1b1f',
  surfaceVariant: '#49454f',
  outline: '#938f99',
  primaryContainer: '#4f378b',
  onPrimaryContainer: '#eaddff',
  elevationTint: '#d0bcff',
};

export const ON_ACCENT = '#ffffff';

const STORAGE_KEY = '@merca-tracker/theme-preference';
const VALID_MODES: ThemeMode[] = ['light', 'dark', 'system'];

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [isHydrated, setIsHydrated] = useState(false);
  const [systemScheme, setSystemScheme] = useState<ColorScheme>(
    (Appearance.getColorScheme() as ColorScheme) ?? 'light'
  );

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

  useEffect(() => {
    if (mode !== 'system') return;
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme((colorScheme as ColorScheme) ?? 'light');
    });
    return () => subscription.remove();
  }, [mode]);

  // Fuerza la apariencia nativa al modo elegido en la app. Solo iOS: sin esto,
  // la barra de NativeTabs y los colores DynamicColorIOS resuelven contra el
  // esquema del sistema y parpadean a claro al cambiar de tab en modo oscuro.
  // En Android NO se aplica: su AppearanceModule.setColorScheme exige un valor
  // no-null (revienta con `null`) y su barra usa color explícito, no el trait.
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    // `null` resetea al esquema del sistema; el tipo de RN 0.86 no lo incluye
    // pese a soportarlo en runtime (iOS), de ahí el cast al tipo del parámetro.
    const scheme = (mode === 'system' ? null : mode) as Parameters<
      typeof Appearance.setColorScheme
    >[0];
    Appearance.setColorScheme(scheme);
  }, [mode]);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    AsyncStorage.setItem(STORAGE_KEY, newMode).catch(() => {});
  };

  const effectiveScheme: ColorScheme = mode === 'system' ? systemScheme : mode;
  const colors = effectiveScheme === 'dark' ? darkColors : lightColors;

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, effectiveScheme, colors, setMode, isHydrated }),
    [mode, effectiveScheme, colors, isHydrated]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
