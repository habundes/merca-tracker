import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ON_ACCENT, useTheme, type ThemeColors } from '@/shared/context/ThemeContext';
import { useThemedStyles } from '@/shared/hooks/useThemedStyles';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export type AuthButtonVariant = 'filled' | 'outline' | 'social' | 'link';

// `apple` pinta el par negro/blanco que pide la HIG de Apple para "Continuar con
// Apple"; el resto de los sociales usan la superficie neutra del tema.
export type AuthButtonTone = 'neutral' | 'apple';

export interface AuthButtonProps {
  label: string;
  onPress: () => void;
  variant?: AuthButtonVariant;
  tone?: AuthButtonTone;
  icon?: IoniconName;
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export function AuthButton({
  label,
  onPress,
  variant = 'filled',
  tone = 'neutral',
  icon,
  loading = false,
  disabled = false,
  accessibilityLabel,
  style,
}: AuthButtonProps) {
  const { colors, effectiveScheme } = useTheme();
  const styles = useThemedStyles(themedStyles);

  const isApple = variant === 'social' && tone === 'apple';
  const appleBg = effectiveScheme === 'dark' ? '#ffffff' : '#000000';
  const appleFg = effectiveScheme === 'dark' ? '#000000' : '#ffffff';

  const isBlocked = disabled || loading;

  const contentColor =
    variant === 'filled'
      ? ON_ACCENT
      : variant === 'outline' || variant === 'link'
        ? colors.accent
        : isApple
          ? appleFg
          : colors.text;

  const rippleColor = variant === 'filled' || isApple ? 'rgba(255,255,255,0.24)' : colors.outline;

  return (
    <Pressable
      onPress={onPress}
      disabled={isBlocked}
      hitSlop={variant === 'link' ? 8 : undefined}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isBlocked, busy: loading }}
      android_ripple={
        variant === 'link' ? { color: colors.outline, borderless: true } : { color: rippleColor }
      }
      style={({ pressed }) => [
        styles.base,
        variant === 'link' ? styles.link : styles.block,
        variant === 'filled' && styles.filled,
        variant === 'outline' && styles.outline,
        variant === 'social' && styles.social,
        isApple && { backgroundColor: appleBg, borderColor: appleBg },
        isBlocked && styles.blocked,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={contentColor} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={18} color={contentColor} /> : null}
          <Text
            style={[
              variant === 'link' ? styles.linkLabel : styles.label,
              { color: contentColor },
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const themedStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    base: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    // Botón de ancho completo: mismo alto/radio que los CTA ya existentes en la app.
    block: {
      height: 48,
      borderRadius: 10,
      borderCurve: 'continuous',
      paddingHorizontal: 16,
      boxShadow: Platform.OS === 'android' ? '0 1px 2px rgba(0,0,0,0.16)' : undefined,
    },
    // Enlace de texto: sin fondo, pero con área táctil de 44 pt.
    link: {
      minHeight: 44,
      paddingHorizontal: 8,
      paddingVertical: 10,
    },
    filled: {
      backgroundColor: colors.accent,
    },
    outline: {
      borderWidth: 1.5,
      borderColor: colors.accent,
    },
    social: {
      backgroundColor: colors.bgSecondary,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    blocked: {
      opacity: 0.6,
    },
    pressed: {
      opacity: 0.5,
    },
    label: {
      fontSize: 16,
      fontWeight: '700',
    },
    linkLabel: {
      fontSize: 15,
      fontWeight: '600',
    },
  });
