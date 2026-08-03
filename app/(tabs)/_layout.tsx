import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export const unstable_settings = {
  initialRouteName: 'buscar',
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#aaa',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          height: 60,
          paddingBottom: 8,
        },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            lista: 'list-outline',
            buscar: 'search-outline',
            perfil: 'person-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="lista" options={{ title: 'Lista' }} />
      <Tabs.Screen name="buscar" options={{ title: 'Buscar', headerShown: true }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}
