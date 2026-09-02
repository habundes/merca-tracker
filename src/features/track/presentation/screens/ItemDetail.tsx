import { useMemo } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  Linking,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme, ON_ACCENT, type ThemeColors } from '@/shared/context/ThemeContext';
import { useThemedStyles } from '@/shared/hooks/useThemedStyles';
import { Card } from '@/shared/components/adaptive';
import { useItemDetail } from '@/features/track/presentation/hooks/useItemDetail';
import type {
  PriceDirection,
  CheckButtonState,
} from '@/features/track/domain';

// Indicador de precio en emoji (calca el ux_spec, evita mapear iconos Ionicons).
const INDICATOR: Record<PriceDirection, string> = {
  down: '📉',
  up: '📈',
  none: '➡️',
  wish: '🎯',
  unavailable: '⚠️',
};

// Label del botón "Check Ahora" según su estado dummy (líneas 442-447 del ux_spec).
const CHECK_LABEL: Record<CheckButtonState, string> = {
  available: 'Check Ahora',
  partial: 'Check Ahora (1/2)',
  reward: 'Ver ad → +1 check',
  limit: 'Límite alcanzado ⏰',
};

// Color del precio: baja→success (verde), sube→danger (rojo), resto→textMuted (gris).
function priceColor(direction: PriceDirection, colors: ThemeColors): string {
  if (direction === 'down') return colors.success;
  if (direction === 'up') return colors.danger;
  return colors.textMuted;
}

// Flecha corta para la línea "hace X · próx: Y" (↓ baja / ↑ sube / → resto).
function directionArrow(direction: PriceDirection): string {
  if (direction === 'down') return '↓';
  if (direction === 'up') return '↑';
  return '→';
}

export default function ItemDetail() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const { colors } = useTheme();
  const router = useRouter();

  // itemId llega codificado (una URL puede contener / ? & #). Lo decodificamos
  // para mostrar el valor original; si falta o está corrupto, mostramos aviso.
  const url = useMemo(() => {
    if (!itemId) return null;
    try {
      return decodeURIComponent(itemId);
    } catch {
      return itemId;
    }
  }, [itemId]);

  // Detalle: solo la entidad de domain (el hook cablea repo dummy + usecase).
  const item = useItemDetail(url);

  const styles = useThemedStyles((colors) =>
    StyleSheet.create({
      // Fallbacks (sin url / sin match)
      fallback: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 24,
        backgroundColor: colors.bg,
      },
      fallbackTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.text,
      },
      fallbackSubtitle: {
        fontSize: 14,
        color: colors.textMuted,
        textAlign: 'center',
      },
      // Detalle
      screen: {
        flex: 1,
        backgroundColor: colors.bg,
      },
      scrollContent: {
        padding: 16,
      },
      card: {
        gap: 12,
      },
      headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
      },
      image: {
        width: 80,
        height: 80,
        borderRadius: 12,
        backgroundColor: colors.bgSecondary,
      },
      headerText: {
        flex: 1,
        gap: 4,
      },
      title: {
        fontSize: 17,
        fontWeight: '700',
        color: colors.text,
        lineHeight: 22,
      },
      titleUnavailable: {
        textDecorationLine: 'line-through',
        color: colors.textMuted,
      },
      seller: {
        fontSize: 13,
        color: colors.textMuted,
      },
      priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
      },
      price: {
        fontSize: 30,
        fontWeight: '800',
      },
      indicator: {
        fontSize: 18,
      },
      changeText: {
        fontSize: 15,
        fontWeight: '600',
      },
      unavailableLead: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.textMuted,
      },
      legend: {
        fontSize: 13,
        color: colors.textMuted,
      },
      metaLine: {
        fontSize: 13,
        color: colors.textMuted,
      },
      divider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: colors.border,
        marginVertical: 4,
      },
      sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.text,
      },
      checkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      },
      bullet: {
        fontSize: 12,
        color: colors.textMuted,
      },
      checkDate: {
        flex: 1,
        fontSize: 13,
        color: colors.textMuted,
      },
      checkPrice: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.text,
      },
      checkIndicator: {
        fontSize: 14,
      },
      mode: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
        marginTop: 4,
      },
      buttonsCol: {
        gap: 10,
        marginTop: 4,
      },
      buttonRow: {
        flexDirection: 'row',
        gap: 10,
      },
      button: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
      },
      buttonPrimary: {
        backgroundColor: colors.accent,
      },
      buttonPrimaryText: {
        fontSize: 15,
        fontWeight: '700',
        color: ON_ACCENT,
      },
      buttonSecondary: {
        backgroundColor: colors.bgSecondary,
        borderWidth: 1,
        borderColor: colors.border,
      },
      buttonSecondaryText: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
      },
      buttonDanger: {
        borderWidth: 1,
        borderColor: colors.danger,
      },
      buttonDangerText: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.danger,
      },
    }),
  );

  // Fallback: sin URL válida.
  if (!url) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackTitle}>Ítem no encontrado</Text>
        <Text style={styles.fallbackSubtitle}>
          No se recibió una URL válida para este rastreo.
        </Text>
      </View>
    );
  }

  // Fallback: URL sin match en el datasource.
  if (!item) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackTitle}>Detalle del ítem</Text>
        <Text style={styles.fallbackSubtitle}>{url}</Text>
      </View>
    );
  }

  const isUnavailable = item.availability === 'unavailable';
  const isWish = item.wishReached;
  const dir = item.priceChange.direction;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
      <Card style={styles.card}>
        {/* Cabecera: imagen, título (tachado si no disponible), seller. */}
        <View style={styles.headerRow}>
          <Image source={{ uri: item.imageUrl }} style={styles.image} />
          <View style={styles.headerText}>
            <Text
              style={[styles.title, isUnavailable && styles.titleUnavailable]}
              numberOfLines={3}
            >
              {item.title}
            </Text>
            <Text style={styles.seller}>{item.seller}</Text>
          </View>
        </View>

        {/* Precio grande + indicador/monto (o "⚠️ No disponible"). */}
        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: priceColor(dir, colors) }]}>
            {item.priceLabel}
          </Text>
          {isUnavailable ? (
            <Text style={styles.unavailableLead}>⚠️ No disponible</Text>
          ) : (
            <>
              <Text style={styles.indicator}>{INDICATOR[dir]}</Text>
              {item.priceChange.amountLabel != null && (
                <Text style={[styles.changeText, { color: priceColor(dir, colors) }]}>
                  {item.priceChange.amountLabel}
                </Text>
              )}
            </>
          )}
        </View>

        {isUnavailable ? (
          <Text style={styles.legend}>
            Este producto ya no existe en Mercadolibre
          </Text>
        ) : (
          <Text style={styles.metaLine}>
            {directionArrow(dir)} {item.lastCheckLabel}
            {item.nextCheckLabel != null ? ` · próx: ${item.nextCheckLabel}` : ''}
          </Text>
        )}

        <View style={styles.divider} />

        {/* Historial + modo: ocultos si no disponible. */}
        {!isUnavailable && (
          <>
            <Text style={styles.sectionTitle}>Historial de checks:</Text>
            {item.checks.slice(0, 5).map((check, index) => (
              <View key={index} style={styles.checkRow}>
                <Text style={styles.bullet}>●</Text>
                <Text style={styles.checkDate}>{check.dateLabel}</Text>
                <Text style={styles.checkPrice}>{check.priceLabel}</Text>
                <Text style={styles.checkIndicator}>
                  {INDICATOR[check.direction]}
                </Text>
              </View>
            ))}
            <Text style={styles.mode}>Modo: {item.mode.label}</Text>
          </>
        )}

        {/* Botones según variante. */}
        <View style={styles.buttonsCol}>
          {isUnavailable ? (
            // No disponible → único botón (inerte).
            <Pressable style={[styles.button, styles.buttonDanger]}>
              <Text style={styles.buttonDangerText}>Eliminar Producto</Text>
            </Pressable>
          ) : isWish ? (
            // Wish-price alcanzado → ambos inertes.
            <View style={styles.buttonRow}>
              <Pressable style={[styles.button, styles.buttonPrimary]}>
                <Text style={styles.buttonPrimaryText}>Nuevo precio deseado</Text>
              </Pressable>
              <Pressable style={[styles.button, styles.buttonDanger]}>
                <Text style={styles.buttonDangerText}>Eliminar</Text>
              </Pressable>
            </View>
          ) : (
            // Normal → Check Ahora (inerte) + Configurar (navega) + Ver en ML (link).
            <>
              <View style={styles.buttonRow}>
                <Pressable style={[styles.button, styles.buttonPrimary]}>
                  <Text style={styles.buttonPrimaryText}>
                    {CHECK_LABEL[item.checkButton]}
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.button, styles.buttonSecondary]}
                  android_ripple={{ color: colors.outline }}
                  onPress={() => router.push('/track/config')}
                >
                  <Text style={styles.buttonSecondaryText}>Configurar</Text>
                </Pressable>
              </View>
              <Pressable
                style={[styles.button, styles.buttonSecondary]}
                android_ripple={{ color: colors.outline }}
                onPress={() => {
                  Linking.openURL(url).catch(() => {});
                }}
              >
                <Text style={styles.buttonSecondaryText}>
                  Ver en Mercadolibre →
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </Card>
    </ScrollView>
  );
}
