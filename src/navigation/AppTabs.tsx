import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import type { AppTabsParamList } from './types';

import HomeStack from '../features/home/presentation/navigation/HomeStack';
import SearchScreen from '../features/search/presentation/screens/SearchScreen';
import ProfileStack from '../features/profile/presentation/navigation/ProfileStack';

const Tab = createBottomTabNavigator<AppTabsParamList>();

export default function AppTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Buscar"
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
            Historial: 'time-outline',
            Buscar: 'search-outline',
            Perfil: 'person-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Historial" component={HomeStack} />
      <Tab.Screen name="Buscar" component={SearchScreen} options={{ headerShown: true }} />
      <Tab.Screen name="Perfil" component={ProfileStack} />
    </Tab.Navigator>
  );
}
