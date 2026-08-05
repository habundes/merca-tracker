import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../shared/context/ThemeContext';

export function SearchHelp() {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.divider, { borderTopColor: colors.border }]} />
      <Text style={[styles.title, { color: colors.text }]}>💡 Cómo obtener la URL:</Text>
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
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
});
