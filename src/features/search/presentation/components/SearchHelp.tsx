import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/context/ThemeContext';

export function SearchHelp() {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.divider, { borderTopColor: colors.border }]} />
      <View style={styles.titleRow}>
        <Ionicons name="bulb-outline" size={16} color={colors.text} style={styles.icon} />
        <Text style={[styles.title, { color: colors.text }]}>Cómo obtener la URL:</Text>
      </View>
      <Text style={[styles.body, { color: colors.textMuted }]}>
        Abre Mercadolibre → encuentra un producto → copia la URL desde el navegador o app.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  icon: {
    marginRight: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
});
