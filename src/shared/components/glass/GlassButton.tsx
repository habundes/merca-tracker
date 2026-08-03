import { Pressable, StyleSheet, type PressableProps } from 'react-native';
import { GlassView, type GlassViewProps } from './GlassView';

export interface GlassButtonProps extends Omit<GlassViewProps, 'onPress'> {
  onPress: PressableProps['onPress'];
  disabled?: boolean;
  children: React.ReactNode;
}

export function GlassButton({
  onPress,
  disabled = false,
  isInteractive = true,
  style,
  children,
  glassEffectStyle,
  tintColor,
  colorScheme,
  ...rest
}: GlassButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) =>
        StyleSheet.flatten([
          { opacity: disabled ? 0.4 : pressed ? 0.7 : 1 },
          style,
        ])
      }
    >
      <GlassView
        glassEffectStyle={glassEffectStyle}
        tintColor={tintColor}
        isInteractive={isInteractive}
        colorScheme={colorScheme}
        style={{
          paddingVertical: 12,
          paddingHorizontal: 20,
          borderRadius: 999,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
        {...rest}
      >
        {children}
      </GlassView>
    </Pressable>
  );
}
