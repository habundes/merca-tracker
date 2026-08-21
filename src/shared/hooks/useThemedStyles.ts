import { useMemo } from 'react';
import { useTheme, type ThemeColors } from '@/shared/context/ThemeContext';

/**
 * Crea estilos dependientes del tema una sola vez por cambio de `colors`.
 * Reemplaza el patrón repetido `useMemo(() => StyleSheet.create({...}), [colors])`.
 *
 *   const styles = useThemedStyles((colors) => StyleSheet.create({ ... }));
 */
export function useThemedStyles<T>(factory: (colors: ThemeColors) => T): T {
  const { colors } = useTheme();
  return useMemo(() => factory(colors), [colors]);
}
