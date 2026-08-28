import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useSearch } from '@/shared/context/SearchContext';
import { useTheme } from '@/shared/context/ThemeContext';
import { useThemedStyles } from '@/shared/hooks/useThemedStyles';
import { Card } from '@/shared/components/adaptive';
import { Toast } from '@/shared/components/Toast';
import { SwipeableTrackRow } from '@/features/track/presentation/components/SwipeableTrackRow';
import { DUMMY_TRACK_ITEMS } from '@/features/track/dummyHistory';

// La lista guarda URLs; el nombre del artículo vive en los datos dummy. Mapeamos
// URL → título para mostrar el nombre completo; si no hay match, usamos la URL.
const titleByUrl = new Map(
  DUMMY_TRACK_ITEMS.map((item) => [item.url, item.title]),
);

// En iOS el safe-area inset inferior YA incluye la tab bar flotante (Liquid
// Glass), así que basta sumarle un pequeño margen para separarla. En Android la
// barra es sólida y el contenido ya queda por encima, así que va un margen fijo.
const IOS_TOAST_GAP = 12;
const ANDROID_TOAST_MARGIN = 32;

export default function TrackMain() {
  const { history, clearHistory, removeSearch, lastAdded, setLastAdded } =
    useSearch();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toastBottomOffset =
    Platform.OS === 'ios'
      ? insets.bottom + IOS_TOAST_GAP
      : ANDROID_TOAST_MARGIN;

  const styles = useThemedStyles((colors) =>
    StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: colors.bg,
      },
      header: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 12,
      },
      headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
      },
      configText: {
        fontSize: 14,
        color: colors.accent,
        fontWeight: '600',
      },
      clearText: {
        fontSize: 14,
        color: colors.danger,
        fontWeight: '600',
      },
      list: {
        paddingHorizontal: 16,
        gap: 8,
      },
      item: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bgSecondary,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 12,
        overflow: 'hidden',
      },
      itemContent: {
        flex: 1,
      },
      itemTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
      },
      empty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      },
      emptyGlass: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 32,
        paddingVertical: 32,
      },
      emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textMuted,
      },
      emptySubText: {
        fontSize: 13,
        color: colors.textMuted,
      },
    }),
  );

  const handleClearHistory = () => {
    Alert.alert(
      'Limpiar rastreos',
      '¿Estás seguro que deseas limpiar tu historial de rastreos?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Limpiar', style: 'destructive', onPress: clearHistory },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerActions}>
          <Link href='/track/config' asChild>
            <TouchableOpacity>
              <Text style={styles.configText}>Configurar</Text>
            </TouchableOpacity>
          </Link>
          {history.length > 0 && (
            <TouchableOpacity onPress={handleClearHistory}>
              <Text style={styles.clearText}>Limpiar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {history.length === 0 ? (
        <View style={styles.empty}>
          {/* Demo temporal Liquid Glass — spec 01-liquid-glass-components */}
          <Card style={styles.emptyGlass}>
            <Ionicons
              name='search-outline'
              size={48}
              color={colors.textMuted}
            />
            <Text style={styles.emptyText}>Sin rastreos aún</Text>
            <Text style={styles.emptySubText}>
              Las URLs rastreadas aparecerán aquí
            </Text>
          </Card>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item, index) => `${item}-${index}`}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <SwipeableTrackRow>
              <Link
                href={{
                  pathname: '/track/[itemId]',
                  params: { itemId: encodeURIComponent(item) },
                }}
                asChild
              >
                <Link.Trigger>
                  <Pressable
                    style={styles.item}
                    android_ripple={{ color: colors.outline }}
                  >
                    <View style={styles.itemContent}>
                      <Text style={styles.itemTitle}>
                        {titleByUrl.get(item) ?? item}
                      </Text>
                    </View>
                  </Pressable>
                </Link.Trigger>
                {/* Vista previa (peek) y menú contextual — iOS; en Android solo navega. */}
                <Link.Preview />
                <Link.Menu>
                  <Link.MenuAction
                    icon='trash'
                    destructive
                    onPress={() => removeSearch(item)}
                  >
                    Eliminar del historial
                  </Link.MenuAction>
                </Link.Menu>
              </Link>
            </SwipeableTrackRow>
          )}
        />
      )}

      {lastAdded != null && (
        <Toast
          message={`«${lastAdded}`}
          suffix='» agregado!'
          bottomOffset={toastBottomOffset}
          onHide={() => setLastAdded(null)}
        />
      )}
    </View>
  );
}
