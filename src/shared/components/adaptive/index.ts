import { Platform } from 'react-native';
import {
  GlassView,
  GlassCard,
  GlassButton,
  GlassHeader,
  type GlassViewProps,
  type GlassCardProps,
  type GlassButtonProps,
  type GlassHeaderProps,
} from '../glass';
import {
  MaterialSurface,
  MaterialCard,
  MaterialButton,
  MaterialHeader,
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
export const Button = (isAndroid ? MaterialButton : GlassButton) as React.ComponentType<GlassButtonProps>;
export const Header = (isAndroid ? MaterialHeader : GlassHeader) as React.ComponentType<GlassHeaderProps>;
// No hay GlassTextField: en iOS el contenedor de input es un GlassView.
export const TextField = (isAndroid ? MaterialTextField : GlassView) as React.ComponentType<GlassViewProps>;

export type {
  GlassViewProps as SurfaceProps,
  GlassCardProps as CardProps,
  GlassButtonProps as ButtonProps,
  GlassHeaderProps as HeaderProps,
  GlassViewProps as TextFieldProps,
};
