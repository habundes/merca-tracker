import { View, type ViewProps } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

/**
 * Base MD3 (Android) themed, equivalente a `GlassView`.
 * Espeja la API de `GlassViewProps` para permitir migración vía la capa
 * adaptativa sin tocar los call-sites. Las props glass-only
 * (`glassEffectStyle`, `tintColor`, `isInteractive`, `colorScheme`) se aceptan
 * y se ignoran en Android.
 */
export interface MaterialSurfaceProps extends ViewProps {
  glassEffectStyle?: unknown;
  tintColor?: string;
  isInteractive?: boolean;
  colorScheme?: unknown;
}

export function MaterialSurface({
  glassEffectStyle: _glassEffectStyle,
  tintColor: _tintColor,
  isInteractive: _isInteractive,
  colorScheme: _colorScheme,
  style,
  children,
  ...rest
}: MaterialSurfaceProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[{ backgroundColor: colors.surface, borderColor: colors.outline }, style]}
      {...rest}
    >
      {children}
    </View>
  );
}
