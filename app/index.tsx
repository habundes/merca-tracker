import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { useAuth } from '@/shared/context/AuthContext';
import { lightColors, useTheme } from '@/shared/context/ThemeContext';

// Gate de sesión (add-on del spec 20): sin sesión la app entra por la bienvenida
// y no monta los tabs; con sesión va directo a Buscar.
export default function Index() {
  const { isAuthenticated, isHydrated } = useAuth();
  const { colors, isHydrated: isThemeHydrated } = useTheme();

  // Mientras se lee storage se pinta un fondo del tema (no `null`) para no
  // meter un flash blanco antes de decidir el destino.
  if (!isHydrated) {
    return (
      <View
        style={{ flex: 1, backgroundColor: isThemeHydrated ? colors.bg : lightColors.bg }}
      />
    );
  }

  return <Redirect href={isAuthenticated ? '/search' : '/welcome'} />;
}
