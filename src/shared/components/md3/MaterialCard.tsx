import { StyleSheet } from 'react-native';
import { MaterialSurface, type MaterialSurfaceProps } from './MaterialSurface';

/**
 * ElevatedCard MD3: radio 16dp, `elevation` (sombra Android) y surface tint.
 * Espeja `GlassCardProps` (padding, borderRadius) para compatibilidad.
 */
export interface MaterialCardProps extends MaterialSurfaceProps {
  padding?: number;
  borderRadius?: number;
  elevation?: number;
}

export function MaterialCard({
  padding = 16,
  borderRadius = 16,
  elevation = 1,
  style,
  children,
  ...rest
}: MaterialCardProps) {
  return (
    <MaterialSurface
      {...rest}
      style={StyleSheet.flatten([
        { padding, borderRadius, elevation, borderWidth: 0, overflow: 'hidden' },
        style,
      ])}
    >
      {children}
    </MaterialSurface>
  );
}
