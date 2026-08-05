import { StyleSheet, Text } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { MaterialSurface, type MaterialSurfaceProps } from './MaterialSurface';

/**
 * TopAppBar MD3 (aproximación estática del MediumTopAppBar): título alineado
 * a la izquierda con color de tema explícito. Espeja `GlassHeaderProps`.
 */
export interface MaterialHeaderProps extends MaterialSurfaceProps {
  title: string;
}

export function MaterialHeader({ title, style, children, ...rest }: MaterialHeaderProps) {
  const { colors } = useTheme();

  return (
    <MaterialSurface
      {...rest}
      style={StyleSheet.flatten([
        {
          paddingHorizontal: 16,
          paddingVertical: 16,
          justifyContent: 'center',
          borderWidth: 0,
        },
        style,
      ])}
    >
      <Text style={{ fontSize: 22, fontWeight: '600', color: colors.text }}>{title}</Text>
      {children}
    </MaterialSurface>
  );
}
