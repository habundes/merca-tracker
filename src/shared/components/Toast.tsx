import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text } from 'react-native';
import { Surface } from '@/shared/components/adaptive';
import { useTheme } from '@/shared/context/ThemeContext';

export interface ToastProps {
  message: string; // parte principal; se trunca con "…" si no cabe
  suffix?: string; // texto fijo que nunca se trunca (p. ej. " agregado!")
  duration?: number; // ms visible antes de auto-ocultarse
  bottomOffset?: number; // distancia desde el borde inferior (para librar tab bars, etc.)
  onHide: () => void;
}

const DEFAULT_DURATION = 2000;
const DEFAULT_BOTTOM_OFFSET = 32;
const FADE_MS = 200;

// Toast presentacional: aparece con fade-in, se mantiene `duration` ms y hace
// fade-out; al terminar llama `onHide`. Adaptativo (Surface) y temático.
// El posicionamiento vertical lo controla el llamador vía `bottomOffset` — el
// Toast no asume que exista una tab bar.
export function Toast({
  message,
  suffix,
  duration = DEFAULT_DURATION,
  bottomOffset = DEFAULT_BOTTOM_OFFSET,
  onHide,
}: ToastProps) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  // Evita re-disparar el timer si el padre pasa un `onHide` nuevo en cada render.
  const onHideRef = useRef(onHide);
  onHideRef.current = onHide;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: FADE_MS,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    const hideTimer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: FADE_MS,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) onHideRef.current();
      });
    }, duration);

    return () => clearTimeout(hideTimer);
  }, [message, suffix, duration, opacity]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.wrapper, { opacity, bottom: bottomOffset }]}
    >
      <Surface style={[styles.pill, { borderColor: colors.border }]}>
        <Text
          style={[styles.text, styles.messageText, { color: colors.text }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {message}
        </Text>
        {suffix ? (
          <Text style={[styles.text, { color: colors.text }]} numberOfLines={1}>
            {suffix}
          </Text>
        ) : null}
      </Surface>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 10,
    overflow: 'hidden',
    maxWidth: '100%',
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
  messageText: {
    flexShrink: 1, // el nombre se encoge y se trunca; el suffix se mantiene
  },
});
