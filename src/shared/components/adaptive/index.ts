import { Platform } from 'react-native';
import {
  GlassView,
  GlassCard,
  type GlassViewProps,
  type GlassCardProps,
} from '../glass';
import {
  MaterialSurface,
  MaterialCard,
  MaterialTextField,
} from '../md3';

/**
 * Capa adaptativa: único punto que consumen las pantallas.
 * En Android resuelve a los componentes MD3; en iOS a los Liquid Glass.
 * La API (props) calca la de `glass/` para migrar sin tocar los call-sites.
 */
const isAndroid = Platform.OS === 'android';

export const Surface = (isAndroid ? MaterialSurface : GlassView) as React.ComponentType<GlassViewProps>;
export const Card = (isAndroid ? MaterialCard : GlassCard) as React.ComponentType<GlassCardProps>;
// No hay GlassTextField: en iOS el contenedor de input es un GlassView.
export const TextField = (isAndroid ? MaterialTextField : GlassView) as React.ComponentType<GlassViewProps>;

export type {
  GlassViewProps as SurfaceProps,
  GlassCardProps as CardProps,
  GlassViewProps as TextFieldProps,
};
