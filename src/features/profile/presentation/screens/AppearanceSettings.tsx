import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme, ThemeMode } from '@/shared/context/ThemeContext';
import { useThemedStyles } from '@/shared/hooks/useThemedStyles';

const THEME_OPTIONS: { label: string; value: ThemeMode }[] = [
  { label: 'Sistema', value: 'system' },
  { label: 'Claro', value: 'light' },
  { label: 'Oscuro', value: 'dark' },
];

export default function AppearanceSettings() {
  const { mode, setMode } = useTheme();

  const styles = useThemedStyles((colors) => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
      paddingHorizontal: 20,
      paddingTop: 24,
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
  }));

  return (
    <View style={styles.container}>
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
