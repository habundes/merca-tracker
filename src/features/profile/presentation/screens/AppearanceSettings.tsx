import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme, ThemeMode } from '@/shared/context/ThemeContext';
import { useThemedStyles } from '@/shared/hooks/useThemedStyles';

const THEME_OPTIONS: { label: string; value: ThemeMode }[] = [
  { label: 'Sistema', value: 'system' },
  { label: 'Claro', value: 'light' },
  { label: 'Oscuro', value: 'dark' },
];

export default function AppearanceSettings() {
  const { mode, setMode, canChangeTheme } = useTheme();
  // Sin sesión el tema lo decide el sistema (spec 20), así que se muestra
  // "Sistema" y el control queda inactivo.
  const shownMode = canChangeTheme ? mode : 'system';

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
    segmentDisabled: {
      opacity: 0.6,
    },
    hint: {
      marginTop: 12,
      fontSize: 13,
      lineHeight: 18,
      color: colors.textMuted,
    },
  }));

  return (
    <View style={styles.container}>
      <View style={[styles.segment, !canChangeTheme && styles.segmentDisabled]}>
        {THEME_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            disabled={!canChangeTheme}
            accessibilityRole="button"
            accessibilityState={{
              selected: shownMode === opt.value,
              disabled: !canChangeTheme,
            }}
            style={[
              styles.segmentBtn,
              shownMode === opt.value && styles.segmentBtnActive,
            ]}
            onPress={() => setMode(opt.value)}
          >
            <Text
              style={[
                styles.segmentText,
                shownMode === opt.value && styles.segmentTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {!canChangeTheme ? (
        <Text style={styles.hint}>
          Inicia sesión para elegir el tema. Sin sesión la app sigue el tema del sistema.
        </Text>
      ) : null}
    </View>
  );
}
