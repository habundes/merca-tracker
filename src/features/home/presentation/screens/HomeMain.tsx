import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSearch } from '../../../../shared/context/SearchContext';
import { GlassCard } from '../../../../shared/components/glass';
import type { HomeStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'HomeMain'>;

export default function HomeMain({ navigation }: Props) {
  const { history, clearHistory } = useSearch();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis búsquedas</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => navigation.navigate('ListConfig')}>
            <Text style={styles.configText}>Configurar</Text>
          </TouchableOpacity>
          {history.length > 0 && (
            <TouchableOpacity onPress={clearHistory}>
              <Text style={styles.clearText}>Limpiar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {history.length === 0 ? (
        <View style={styles.empty}>
          {/* Demo temporal Liquid Glass — spec 01-liquid-glass-components */}
          <GlassCard style={styles.emptyGlass}>
            <Ionicons name="search-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Sin búsquedas aún</Text>
            <Text style={styles.emptySubText}>Las URLs buscadas aparecerán aquí</Text>
          </GlassCard>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item, index) => `${item}-${index}`}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={styles.item}
              onPress={() => navigation.navigate('ItemDetail', { itemId: item })}
            >
              <View style={styles.indexBadge}>
                <Text style={styles.indexText}>{index + 1}</Text>
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemUrl} numberOfLines={1}>{item}</Text>
              </View>
              <Ionicons name="open-outline" size={16} color="#aaa" />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  configText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
  },
  clearText: {
    fontSize: 14,
    color: '#dc2626',
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 16,
    gap: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 12,
  },
  indexBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  itemContent: {
    flex: 1,
  },
  itemUrl: {
    fontSize: 14,
    color: '#444',
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
    color: '#bbb',
  },
  emptySubText: {
    fontSize: 13,
    color: '#ccc',
  },
});
