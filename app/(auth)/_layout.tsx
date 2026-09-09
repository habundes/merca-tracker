import { Stack } from 'expo-router';
import { useTheme } from '@/shared/context/ThemeContext';
import { stackScreenOptions } from '@/shared/navigation/stack-screen-options';

// Grupo de auth: hermano de `(tabs)`, así que la barra de tabs no se ve mientras
// el usuario está en la bienvenida o en los formularios. `stackScreenOptions`
// aporta el fallback de tema pre-hidratación (evita el destello claro).
export default function AuthLayout() {
  const { colors, isHydrated } = useTheme();

  return (
    <Stack
      screenOptions={{
        ...stackScreenOptions(colors, isHydrated),
        // Solo la flecha en el botón atrás: sin esto iOS usa el título de la
        // pantalla anterior y, como la bienvenida no tiene header, muestra
        // "welcome" (el nombre de la ruta). Android ya es 'minimal' por defecto.
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ title: 'Crear cuenta' }} />
      <Stack.Screen name="login" options={{ title: 'Iniciar sesión' }} />
    </Stack>
  );
}
