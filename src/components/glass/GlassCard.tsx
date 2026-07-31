import { StyleSheet } from 'react-native';
import { GlassView, type GlassViewProps } from './GlassView';

export interface GlassCardProps extends GlassViewProps {
  padding?: number;
  borderRadius?: number;
}

export function GlassCard({
  padding = 16,
  borderRadius = 20,
  style,
  children,
  ...rest
}: GlassCardProps) {
  return (
    <GlassView
      {...rest}
      style={StyleSheet.flatten([{ padding, borderRadius, overflow: 'hidden' }, style])}
    >
      {children}
    </GlassView>
  );
}
