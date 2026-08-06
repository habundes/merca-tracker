import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/shared/context/ThemeContext';

export default function ItemDetail() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const { colors } = useTheme();

  // itemId llega codificado (una URL puede contener / ? & #). Lo decodificamos
  // para mostrar el valor original; si falta o está corrupto, mostramos aviso.
  const url = useMemo(() => {
    if (!itemId) return null;
    try {
      return decodeURIComponent(itemId);
    } catch {
      return itemId;
    }
  }, [itemId]);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
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
  }), [colors]);

  if (!url) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Ítem no encontrado</Text>
        <Text style={styles.subtitle}>No se recibió una URL válida para este rastreo.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detalle del ítem</Text>
      <Text style={styles.subtitle}>{url}</Text>
    </View>
  );
}
