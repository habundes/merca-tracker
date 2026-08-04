import { Stack } from 'expo-router';

export default function ListaLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Mis búsquedas' }} />
      <Stack.Screen name="config" options={{ title: 'Configurar lista' }} />
      <Stack.Screen name="[itemId]" options={{ title: 'Detalle' }} />
    </Stack>
  );
}
