import { View, Text, StyleSheet } from 'react-native';
import { useThemedStyles } from '@/shared/hooks/useThemedStyles';

/** Placeholder de pantalla de ajustes: centra un título sobre el fondo del tema. */
export function SettingsPlaceholder({ title }: { title: string }) {
  const styles = useThemedStyles((colors) => StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.bg,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}
