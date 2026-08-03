import { StyleSheet, Text } from 'react-native';
import { GlassView, type GlassViewProps } from './GlassView';

export interface GlassHeaderProps extends GlassViewProps {
  title: string;
}

export function GlassHeader({ title, style, children, ...rest }: GlassHeaderProps) {
  return (
    <GlassView
      {...rest}
      style={StyleSheet.flatten([
        {
          paddingHorizontal: 16,
          paddingVertical: 12,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        },
        style,
      ])}
    >
      <Text style={{ fontSize: 17, fontWeight: '600' }}>{title}</Text>
      {children}
    </GlassView>
  );
}
