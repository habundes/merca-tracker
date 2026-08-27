import { useMemo } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useThemedStyles } from '@/shared/hooks/useThemedStyles';
import { DUMMY_TRACK_ITEMS } from '@/features/track/dummyHistory';

export default function ItemDetail() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>();

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

  // Dummy solo para testing visual — el detalle real vendrá del backend (Decodo).
  const item = useMemo(
    () => DUMMY_TRACK_ITEMS.find(i => i.url === url) ?? null,
    [url],
  );

  const styles = useThemedStyles((colors) => StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: 24,
      backgroundColor: colors.bg,
    },
    detailContainer: {
      flex: 1,
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 24,
      paddingTop: 32,
      backgroundColor: colors.bg,
    },
    image: {
      width: 220,
      height: 220,
      borderRadius: 12,
      backgroundColor: colors.bgSecondary,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    productTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
    },
    seller: {
      fontSize: 14,
      color: colors.textMuted,
    },
    price: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.accent,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textMuted,
      textAlign: 'center',
    },
  }));

  if (!url) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Ítem no encontrado</Text>
        <Text style={styles.subtitle}>No se recibió una URL válida para este rastreo.</Text>
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Detalle del ítem</Text>
        <Text style={styles.subtitle}>{url}</Text>
      </View>
    );
  }

  return (
    <View style={styles.detailContainer}>
      <Image source={{ uri: item.image }} style={styles.image} />
      <Text style={styles.productTitle}>{item.title}</Text>
      <Text style={styles.seller}>{item.seller}</Text>
      <Text style={styles.price}>{item.price}</Text>
      <Text style={styles.subtitle}>{url}</Text>
    </View>
  );
}
