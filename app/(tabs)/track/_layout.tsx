import { Stack } from 'expo-router';
import { useTheme } from '../../../src/shared/context/ThemeContext';

export default function TrackLayout() {
  const { colors, isHydrated } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: isHydrated ? colors.bgSecondary : '#f9fafb' },
        headerTintColor: isHydrated ? colors.text : '#111111',
        contentStyle: { backgroundColor: isHydrated ? colors.bg : '#ffffff' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Mis rastreos' }} />
      <Stack.Screen name="config" options={{ title: 'Configurar rastreo' }} />
      <Stack.Screen name="[itemId]" options={{ title: 'Detalle' }} />
    </Stack>
  );
}
