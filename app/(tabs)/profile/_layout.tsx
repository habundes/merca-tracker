import { Stack } from 'expo-router';

export default function PerfilLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Perfil' }} />
      <Stack.Screen name="account" options={{ title: 'Ajustes de cuenta' }} />
      <Stack.Screen name="payment" options={{ title: 'Ajustes de pago' }} />
    </Stack>
  );
}
