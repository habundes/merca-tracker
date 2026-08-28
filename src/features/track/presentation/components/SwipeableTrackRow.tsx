import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import * as Haptics from 'expo-haptics';
import { ON_ACCENT } from '@/shared/context/ThemeContext';
import { useThemedStyles } from '@/shared/hooks/useThemedStyles';

// Umbral de reveal (doc UX): la fila se considera abierta a partir de 40px.
const REVEAL_THRESHOLD = 40;

type SwipeableTrackRowProps = {
  children: React.ReactNode;
};

/**
 * Envuelve una fila de "Mis Rastreos" con gestos de swipe (spec 16).
 *
 * - Swipe izquierda → revela a la derecha: 🔄 Check Ahora (azul) + 🗑 Eliminar (rojo).
 * - Swipe derecha → revela a la izquierda: ⚙️ Configurar (gris).
 *
 * Los botones son **solo visuales**: al tocarse únicamente cierran el swipe
 * (`swipeableMethods.close()`); no ejecutan acción ni navegación. El tap normal
 * de la fila (su contenido) conserva su comportamiento original.
 */
export function SwipeableTrackRow({ children }: SwipeableTrackRowProps) {
  const styles = useThemedStyles((colors) =>
    StyleSheet.create({
      actionsContainer: {
        flexDirection: 'row',
        alignItems: 'stretch',
      },
      action: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 18,
      },
      checkAction: {
        backgroundColor: colors.accent,
      },
      deleteAction: {
        backgroundColor: colors.danger,
        // Redondea las esquinas exteriores (derecha) para igualar el radio de
        // la fila (item.borderRadius = 10) y que no asome color al cerrar.
        borderTopRightRadius: 10,
        borderBottomRightRadius: 10,
      },
      configAction: {
        backgroundColor: colors.textMuted,
        // Redondea las esquinas exteriores (izquierda) igual que la fila.
        borderTopLeftRadius: 10,
        borderBottomLeftRadius: 10,
      },
    })
  );

  // Swipe izquierda revela el lado derecho: Check Ahora + Eliminar.
  const renderRightActions = (
    _progress: unknown,
    _translation: unknown,
    swipeableMethods: SwipeableMethods
  ) => (
    <View style={styles.actionsContainer}>
      <TouchableOpacity
        style={[styles.action, styles.checkAction]}
        onPress={() => swipeableMethods.close()}
      >
        <Ionicons name="refresh" size={22} color={ON_ACCENT} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.action, styles.deleteAction]}
        onPress={() => swipeableMethods.close()}
      >
        <Ionicons name="trash" size={22} color={ON_ACCENT} />
      </TouchableOpacity>
    </View>
  );

  // Swipe derecha revela el lado izquierdo: Configurar.
  const renderLeftActions = (
    _progress: unknown,
    _translation: unknown,
    swipeableMethods: SwipeableMethods
  ) => (
    <View style={styles.actionsContainer}>
      <TouchableOpacity
        style={[styles.action, styles.configAction]}
        onPress={() => swipeableMethods.close()}
      >
        <Ionicons name="settings-outline" size={22} color={ON_ACCENT} />
      </TouchableOpacity>
    </View>
  );

  return (
    <ReanimatedSwipeable
      friction={2}
      leftThreshold={REVEAL_THRESHOLD}
      rightThreshold={REVEAL_THRESHOLD}
      renderRightActions={renderRightActions}
      renderLeftActions={renderLeftActions}
      onSwipeableWillOpen={() =>
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      }
    >
      {children}
    </ReanimatedSwipeable>
  );
}
