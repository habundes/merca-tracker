import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { HomeStackParamList } from './types';
import HomeMain from '../screens/HomeMain';
import ListConfig from '../screens/ListConfig';
import ItemDetail from '../screens/ItemDetail';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStack() {
  return (
    <Stack.Navigator initialRouteName="HomeMain">
      <Stack.Screen name="HomeMain" component={HomeMain} options={{ title: 'Mis búsquedas' }} />
      <Stack.Screen name="ListConfig" component={ListConfig} options={{ title: 'Configurar lista' }} />
      <Stack.Screen name="ItemDetail" component={ItemDetail} options={{ title: 'Detalle' }} />
    </Stack.Navigator>
  );
}
