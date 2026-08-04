import { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme, ThemeMode } from '../../../../shared/context/ThemeContext';

const THEME_OPTIONS: { label: string; value: ThemeMode }[] = [
  { label: 'Sistema', value: 'system' },
  { label: 'Claro', value: 'light' },
  { label: 'Oscuro', value: 'dark' },
];

export default function AppearanceSettings() {
  const { colors, mode, setMode } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
      paddingHorizontal: 20,
      paddingTop: 24,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textMuted,
      textTransform: 'uppercase',
      marginBottom: 10,
    },
    segment: {
      flexDirection: 'row',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      overflow: 'hidden',
    },
    segmentBtn: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.bgTertiary,
    },
    segmentBtnActive: {
      backgroundColor: colors.accent,
    },
    segmentText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    segmentTextActive: {
      color: '#ffffff',
    },
  }), [colors]);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Apariencia</Text>
      <View style={styles.segment}>
        {THEME_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.segmentBtn,
              mode === opt.value && styles.segmentBtnActive,
            ]}
            onPress={() => setMode(opt.value)}
          >
            <Text
              style={[
                styles.segmentText,
                mode === opt.value && styles.segmentTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
