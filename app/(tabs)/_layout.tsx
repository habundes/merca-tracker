import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/shared/context/ThemeContext';

export const unstable_settings = {
  initialRouteName: 'search',
};

export default function TabsLayout() {
  const { colors, isHydrated } = useTheme();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: isHydrated ? colors.accent : '#2563eb',
        tabBarInactiveTintColor: isHydrated ? colors.tabInactive : '#aaaaaa',
        tabBarStyle: {
          backgroundColor: isHydrated ? colors.bgSecondary : '#f9fafb',
          borderTopWidth: 1,
          borderTopColor: isHydrated ? colors.border : '#e5e7eb',
          height: 60,
          paddingBottom: 8,
        },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            track: 'list-outline',
            search: 'search-outline',
            profile: 'person-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="track" options={{ title: 'Rastrear' }} />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Buscar',
          headerShown: true,
          headerStyle: { backgroundColor: isHydrated ? colors.bgSecondary : '#f9fafb' },
          headerTintColor: isHydrated ? colors.text : '#111111',
        }}
      />
      <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}
