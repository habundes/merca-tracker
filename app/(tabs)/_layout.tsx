import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Platform } from 'react-native';
import { useTheme } from '@/shared/context/ThemeContext';

// Ruta ancla del navegador de tabs. El landing real lo maneja app/index.tsx
// con un <Redirect href="/search" />.
export const unstable_settings = {
  anchor: 'search',
};

const isAndroid = Platform.OS === 'android';

export default function TabsLayout() {
  const { colors, isHydrated } = useTheme();

  // NativeTabs renderiza la barra nativa: Material 3 en Android (con su pill
  // indicator nativo) y Liquid Glass en iOS 26+. Coloreamos según el tema de
  // la app para respetar el modo forzado (light/dark) aunque no coincida con
  // el del sistema. Fallbacks pre-hidratación evitan el flash de color.
  const backgroundColor = isHydrated
    ? isAndroid
      ? colors.surface
      : colors.bgSecondary
    : isAndroid
      ? '#fef7ff'
      : '#f9fafb';
  const tintColor = isHydrated ? colors.accent : '#2563eb';
  const indicatorColor = isHydrated ? colors.primaryContainer : '#eaddff';

  return (
    <NativeTabs
      backgroundColor={backgroundColor}
      tintColor={tintColor}
      indicatorColor={indicatorColor}
    >
      <NativeTabs.Trigger name="track">
        <NativeTabs.Trigger.Icon sf={{ default: 'list.bullet', selected: 'list.bullet' }} md="list" />
        <NativeTabs.Trigger.Label>Rastrear</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="search">
        <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
        <NativeTabs.Trigger.Label>Buscar</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Icon sf={{ default: 'person', selected: 'person.fill' }} md="person" />
        <NativeTabs.Trigger.Label>Perfil</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
