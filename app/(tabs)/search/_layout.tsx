import { Stack } from 'expo-router';
import { useTheme } from '@/shared/context/ThemeContext';
import { stackScreenOptions } from '@/shared/navigation/stack-screen-options';

export default function SearchLayout() {
  const { colors, isHydrated } = useTheme();

  return (
    <Stack screenOptions={stackScreenOptions(colors, isHydrated)}>
      <Stack.Screen name="index" options={{ title: 'Buscar' }} />
    </Stack>
  );
}
