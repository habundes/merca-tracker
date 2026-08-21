import { Stack } from 'expo-router';
import { useTheme } from '@/shared/context/ThemeContext';
import { stackScreenOptions } from '@/shared/navigation/stack-screen-options';

export default function TrackLayout() {
  const { colors, isHydrated } = useTheme();

  return (
    <Stack screenOptions={stackScreenOptions(colors, isHydrated)}>
      <Stack.Screen name="index" options={{ title: 'Mis rastreos' }} />
      <Stack.Screen name="config" options={{ title: 'Configurar rastreo' }} />
      <Stack.Screen name="[itemId]" options={{ title: 'Detalle' }} />
    </Stack>
  );
}
