import { View, type ViewProps } from 'react-native';
import {
  GlassView as ExpoGlassView,
  isLiquidGlassAvailable,
  type GlassStyle,
  type GlassColorScheme,
} from 'expo-glass-effect';
import { useTheme } from '../../context/ThemeContext';

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
  style,
  children,
  ...rest
}: GlassViewProps) {
  const { colors, effectiveScheme } = useTheme();

  if (!isLiquidGlassAvailable()) {
    return (
      <View
        style={[{ backgroundColor: colors.bgSecondary, borderColor: colors.border }, style]}
        {...rest}
      >
        {children}
      </View>
    );
  }
  return (
    <ExpoGlassView
      glassEffectStyle={glassEffectStyle}
      tintColor={tintColor}
      isInteractive={isInteractive}
      colorScheme={colorScheme ?? effectiveScheme}
      style={style}
      {...rest}
    >
      {children}
    </ExpoGlassView>
  );
}
