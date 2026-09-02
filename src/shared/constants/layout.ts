import { Platform } from 'react-native';

/**
 * Alto aproximado de la barra de tabs de Android (Material `BottomNavigationView`),
 * usado como padding inferior en las pantallas de tab para que su contenido no quede
 * oculto de forma permanente bajo la barra translúcida (spec 19).
 *
 * Solo aplica en Android; en iOS/web es 0 (la barra iOS se maneja con insets nativos).
 * Valor afinable tras verlo en el simulador.
 */
export const TAB_BAR_HEIGHT = Platform.OS === 'android' ? 80 : 0;
