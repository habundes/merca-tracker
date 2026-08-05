import type { ThemeColors } from '@/shared/context/ThemeContext';

/**
 * screenOptions compartidas por los Stack anidados de cada tab.
 * Usa colores del tema cuando ya hidrató; si no, aplica fallbacks
 * claros para evitar un flash de color incorrecto antes de la hidratación.
 */
export function stackScreenOptions(colors: ThemeColors, isHydrated: boolean) {
  return {
    headerStyle: { backgroundColor: isHydrated ? colors.bgSecondary : '#f9fafb' },
    headerTintColor: isHydrated ? colors.text : '#111111',
    contentStyle: { backgroundColor: isHydrated ? colors.bg : '#ffffff' },
  };
}
