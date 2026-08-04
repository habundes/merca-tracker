import { Stack } from 'expo-router';

export default function TrackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Mis rastreos' }} />
      <Stack.Screen name="config" options={{ title: 'Configurar rastreo' }} />
      <Stack.Screen name="[itemId]" options={{ title: 'Detalle' }} />
    </Stack>
  );
}
