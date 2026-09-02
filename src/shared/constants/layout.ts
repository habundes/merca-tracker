import { Platform } from 'react-native';

/**
 * Alto aproximado de la barra de tabs, usado como padding inferior en las pantallas
 * de tab para que su contenido (p.ej. el último ítem de "Mis Rastreos") no quede
 * oculto de forma permanente bajo la barra (spec 19).
 *
 * - Android: barra Material `BottomNavigationView` translúcida.
 * - iOS: barra flotante Liquid Glass (iOS 26) — el inset automático no basta para
 *   levantar el último ítem por encima de la barra flotante, así que se añade manual.
 *
 * En web es 0. Valores afinables tras verlo en el simulador.
 */
export const TAB_BAR_HEIGHT =
  Platform.OS === 'android' ? 120 : Platform.OS === 'ios' ? 100 : 0;
