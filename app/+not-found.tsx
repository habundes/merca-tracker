import { View, Text, StyleSheet } from 'react-native';
import { Link, Stack } from 'expo-router';
import { useThemedStyles } from '@/shared/hooks/useThemedStyles';

export default function NotFound() {
  const styles = useThemedStyles((colors) => StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      paddingHorizontal: 24,
      backgroundColor: colors.bg,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textMuted,
      textAlign: 'center',
    },
    link: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.accent,
      marginTop: 8,
    },
  }));

  return (
    <>
      <Stack.Screen options={{ title: 'No encontrado' }} />
      <View style={styles.container}>
        <Text style={styles.title}>Página no encontrada</Text>
        <Text style={styles.subtitle}>La ruta que intentaste abrir no existe.</Text>
        <Link href="/" style={styles.link}>
          Volver al inicio
        </Link>
      </View>
    </>
  );
}
