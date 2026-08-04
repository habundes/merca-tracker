import { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../../shared/context/ThemeContext';

export default function TrackConfig() {
  const router = useRouter();
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
      color: '#ffffff',
      fontWeight: '600',
    },
  }), [colors]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Configurar rastreo</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          router.push({ pathname: '/track/[itemId]', params: { itemId: 'demo-1' } })
        }
      >
        <Text style={styles.buttonText}>Ver detalle de ejemplo</Text>
      </TouchableOpacity>
    </View>
  );
}
