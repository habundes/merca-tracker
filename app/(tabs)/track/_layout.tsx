import { Stack } from 'expo-router';
import { useTheme } from '../../../src/shared/context/ThemeContext';

export default function TrackLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bgSecondary },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Mis rastreos' }} />
      <Stack.Screen name="config" options={{ title: 'Configurar rastreo' }} />
      <Stack.Screen name="[itemId]" options={{ title: 'Detalle' }} />
    </Stack>
  );
}
