import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ListStackParamList } from './types';
import ListMain from '../screens/ListMain';
import ListConfig from '../screens/ListConfig';
import ItemDetail from '../screens/ItemDetail';

const Stack = createNativeStackNavigator<ListStackParamList>();

export default function ListStack() {
  return (
    <Stack.Navigator initialRouteName="ListMain">
      <Stack.Screen name="ListMain" component={ListMain} options={{ title: 'Mis búsquedas' }} />
      <Stack.Screen name="ListConfig" component={ListConfig} options={{ title: 'Configurar lista' }} />
      <Stack.Screen name="ItemDetail" component={ItemDetail} options={{ title: 'Detalle' }} />
    </Stack.Navigator>
  );
}
