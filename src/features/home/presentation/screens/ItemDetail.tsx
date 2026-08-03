import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'ItemDetail'>;

export default function ItemDetail({ route }: Props) {
  const { itemId } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detalle del ítem</Text>
      <Text style={styles.subtitle}>itemId: {itemId}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
});
