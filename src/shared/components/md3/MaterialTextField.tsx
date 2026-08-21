import { StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { MaterialSurface, type MaterialSurfaceProps } from './MaterialSurface';

/**
 * OutlinedTextField MD3 (contenedor): outline 1dp `outline`, radio 28dp.
 * Actúa como wrapper del `TextInput`, espejando el uso de `GlassView` como
 * contenedor de input en iOS. Espeja `GlassViewProps` para migración.
 */
export interface MaterialTextFieldProps extends MaterialSurfaceProps {
  borderRadius?: number;
}

export function MaterialTextField({
  borderRadius = 28,
  style,
  children,
  ...rest
}: MaterialTextFieldProps) {
  const { colors } = useTheme();

  return (
    <MaterialSurface
      {...rest}
      style={StyleSheet.flatten([
        {
          borderRadius,
          borderWidth: 1,
          borderColor: colors.outline,
          backgroundColor: colors.surface,
        },
        style,
      ])}
    >
      {children}
    </MaterialSurface>
  );
}
