import { lightColors, type ThemeColors } from '@/shared/context/ThemeContext';

/**
 * screenOptions compartidas por los Stack anidados de cada tab.
 * Usa colores del tema cuando ya hidrató; si no, aplica fallbacks
 * claros para evitar un flash de color incorrecto antes de la hidratación.
 */
export function stackScreenOptions(colors: ThemeColors, isHydrated: boolean) {
  return {
    headerStyle: { backgroundColor: isHydrated ? colors.bgSecondary : lightColors.bgSecondary },
    headerTintColor: isHydrated ? colors.text : lightColors.text,
    contentStyle: { backgroundColor: isHydrated ? colors.bg : lightColors.bg },
  };
}
