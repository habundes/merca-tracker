import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from './types';
import ProfileMain from '../screens/ProfileMain';
import Login from '../screens/Login';
import SignUp from '../screens/SignUp';
import AccountSettings from '../screens/AccountSettings';
import PaymentSettings from '../screens/PaymentSettings';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStack() {
  return (
    <Stack.Navigator initialRouteName="ProfileMain">
      <Stack.Screen name="ProfileMain" component={ProfileMain} options={{ title: 'Perfil' }} />
      <Stack.Screen name="Login" component={Login} options={{ title: 'Iniciar sesión' }} />
      <Stack.Screen name="SignUp" component={SignUp} options={{ title: 'Crear cuenta' }} />
      <Stack.Screen name="AccountSettings" component={AccountSettings} options={{ title: 'Ajustes de cuenta' }} />
      <Stack.Screen name="PaymentSettings" component={PaymentSettings} options={{ title: 'Ajustes de pago' }} />
    </Stack.Navigator>
  );
}
