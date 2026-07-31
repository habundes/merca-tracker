import { View, type ViewProps } from 'react-native';
import {
  GlassView as ExpoGlassView,
  isLiquidGlassAvailable,
  type GlassStyle,
  type GlassColorScheme,
} from 'expo-glass-effect';

export interface GlassViewProps extends ViewProps {
  glassEffectStyle?: GlassStyle;
  tintColor?: string;
  isInteractive?: boolean;
  colorScheme?: GlassColorScheme;
}

export function GlassView({
  glassEffectStyle = 'regular',
  tintColor,
  isInteractive,
  colorScheme,
  children,
  ...rest
}: GlassViewProps) {
  if (!isLiquidGlassAvailable()) {
    return <View {...rest}>{children}</View>;
  }
  return (
    <ExpoGlassView
      glassEffectStyle={glassEffectStyle}
      tintColor={tintColor}
      isInteractive={isInteractive}
      colorScheme={colorScheme}
      {...rest}
    >
      {children}
    </ExpoGlassView>
  );
}
