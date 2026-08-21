import { Stack } from 'expo-router';
import { useTheme } from '@/shared/context/ThemeContext';
import { stackScreenOptions } from '@/shared/navigation/stack-screen-options';

export default function ProfileLayout() {
  const { colors, isHydrated } = useTheme();

  return (
    <Stack screenOptions={stackScreenOptions(colors, isHydrated)}>
      <Stack.Screen name="index" options={{ title: 'Perfil' }} />
      <Stack.Screen name="account" options={{ title: 'Ajustes de cuenta' }} />
      <Stack.Screen name="payment" options={{ title: 'Ajustes de pago' }} />
      <Stack.Screen name="appearance" options={{ title: 'Apariencia' }} />
    </Stack>
  );
}
