import { Stack } from 'expo-router';
import { useTheme } from '../../../src/shared/context/ThemeContext';

export default function PerfilLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bgSecondary },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Perfil' }} />
      <Stack.Screen name="account" options={{ title: 'Ajustes de cuenta' }} />
      <Stack.Screen name="payment" options={{ title: 'Ajustes de pago' }} />
    </Stack>
  );
}
