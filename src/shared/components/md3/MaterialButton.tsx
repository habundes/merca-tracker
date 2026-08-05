import { Pressable, StyleSheet, type PressableProps } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import type { MaterialSurfaceProps } from './MaterialSurface';

/**
 * Botón MD3 tonal: fondo `primaryContainer`, radio full, `android_ripple`.
 * Espeja `GlassButtonProps` (onPress, disabled, children) para compatibilidad.
 */
export interface MaterialButtonProps extends Omit<MaterialSurfaceProps, 'onPress'> {
  onPress: PressableProps['onPress'];
  disabled?: boolean;
  children: React.ReactNode;
}

export function MaterialButton({
  onPress,
  disabled = false,
  glassEffectStyle: _glassEffectStyle,
  tintColor: _tintColor,
  isInteractive: _isInteractive,
  colorScheme: _colorScheme,
  style,
  children,
  ...rest
}: MaterialButtonProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      android_ripple={{ color: colors.onPrimaryContainer + '33', borderless: false }}
      style={StyleSheet.flatten([
        {
          backgroundColor: colors.primaryContainer,
          paddingVertical: 12,
          paddingHorizontal: 20,
          borderRadius: 999,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          opacity: disabled ? 0.4 : 1,
        },
        style,
      ])}
      {...rest}
    >
      {children}
    </Pressable>
  );
}
