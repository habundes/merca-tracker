import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/shared/context/ThemeContext';

export default function AccountSettings() {
  const { colors } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
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
  }), [colors]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ajustes de cuenta</Text>
    </View>
  );
}
