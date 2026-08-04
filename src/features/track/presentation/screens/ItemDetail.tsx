import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../../shared/context/ThemeContext';

export default function ItemDetail() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const { colors } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
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
    },
  }), [colors]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detalle del ítem</Text>
      <Text style={styles.subtitle}>itemId: {itemId}</Text>
    </View>
  );
}
