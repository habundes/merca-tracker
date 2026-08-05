import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/context/ThemeContext';

// Barra de tabs a medida SOLO en Android. NativeTabs (app/(tabs)/_layout.tsx)
// no permite ajustar altura, tamaño de ícono ni espaciado ícono-texto, así que
// para un look tipo YouTube (más alta y con más aire) usamos la Tabs JS.
// iOS y web siguen con NativeTabs.

export const unstable_settings = {
  anchor: 'search',
};

type IconPair = {
  active: keyof typeof Ionicons.glyphMap;
  inactive: keyof typeof Ionicons.glyphMap;
};

const ICONS: Record<string, IconPair> = {
  track: { active: 'list', inactive: 'list-outline' },
  search: { active: 'search', inactive: 'search-outline' },
  profile: { active: 'person', inactive: 'person-outline' },
};

export default function TabsLayoutAndroid() {
  const { colors, isHydrated } = useTheme();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: isHydrated ? colors.accent : '#2563eb',
        tabBarInactiveTintColor: isHydrated ? colors.tabInactive : '#8e8e93',
        // Barra más alta y aireada (tipo YouTube). Sin borde ni píldora.
        tabBarStyle: {
          backgroundColor: isHydrated ? colors.surface : '#fef7ff',
          borderTopWidth: 0,
          height: 74,
          paddingTop: 12,
          paddingBottom: 14,
        },
        // Más espacio entre ícono y texto.
        tabBarIconStyle: { marginBottom: 2 },
        tabBarLabelStyle: { fontSize: 12, marginTop: 2 },
        tabBarIcon: ({ focused, color }) => {
          const pair = ICONS[route.name];
          return (
            <Ionicons
              name={focused ? pair.active : pair.inactive}
              size={26}
              color={color}
            />
          );
        },
      })}
    >
      <Tabs.Screen name="track" options={{ title: 'Rastrear' }} />
      <Tabs.Screen name="search" options={{ title: 'Buscar' }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}
