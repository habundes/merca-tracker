import { Tabs } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/shared/context/ThemeContext';
import { GlassView } from '../../src/shared/components/glass';

export const unstable_settings = {
  initialRouteName: 'search',
};

type IconPair = { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap };

const ICONS: Record<string, IconPair> = {
  track: { active: 'list', inactive: 'list-outline' },
  search: { active: 'search', inactive: 'search-outline' },
  profile: { active: 'person', inactive: 'person-outline' },
};

export default function TabsLayout() {
  const { colors, isHydrated } = useTheme();
  const isIOS = Platform.OS === 'ios';

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: isHydrated ? colors.accent : '#2563eb',
        tabBarInactiveTintColor: isHydrated ? colors.tabInactive : '#aaaaaa',
        // On iOS use a translucent glass background (Liquid Glass on iOS 26,
        // falls back to a plain view elsewhere). Keep an opaque bar on Android/Web.
        tabBarBackground: isIOS ? () => <GlassView style={StyleSheet.absoluteFill} /> : undefined,
        tabBarStyle: {
          backgroundColor: isIOS ? 'transparent' : isHydrated ? colors.bgSecondary : '#f9fafb',
          borderTopWidth: 1,
          borderTopColor: isHydrated ? colors.border : '#e5e7eb',
          height: 60,
          paddingBottom: 8,
        },
        tabBarIcon: ({ focused, color, size }) => {
          const pair = ICONS[route.name];
          const name = focused ? pair.active : pair.inactive;
          return <Ionicons name={name} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="track" options={{ title: 'Rastrear' }} />
      <Tabs.Screen name="search" options={{ title: 'Buscar' }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}
