import { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { useTheme, ON_ACCENT } from '@/shared/context/ThemeContext';

export default function TrackConfig() {
  const { colors } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      backgroundColor: colors.bg,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    button: {
      backgroundColor: colors.accent,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 10,
    },
    buttonText: {
      color: ON_ACCENT,
      fontWeight: '600',
    },
  }), [colors]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Configurar rastreo</Text>
      <Link
        href={{ pathname: '/track/[itemId]', params: { itemId: encodeURIComponent('demo-1') } }}
        asChild
      >
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Ver detalle de ejemplo</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}
