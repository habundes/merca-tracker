import { Stack } from 'expo-router';
import { useTheme } from '../../../src/shared/context/ThemeContext';

export default function PerfilLayout() {
  const { colors, isHydrated } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: isHydrated ? colors.bgSecondary : '#f9fafb' },
        headerTintColor: isHydrated ? colors.text : '#111111',
        contentStyle: { backgroundColor: isHydrated ? colors.bg : '#ffffff' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Perfil' }} />
      <Stack.Screen name="account" options={{ title: 'Ajustes de cuenta' }} />
      <Stack.Screen name="payment" options={{ title: 'Ajustes de pago' }} />
      <Stack.Screen name="appearance" options={{ title: 'Apariencia' }} />
    </Stack>
  );
}
