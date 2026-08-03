import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ListStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<ListStackParamList, 'ListConfig'>;

export default function ListConfig({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Configurar lista</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('ItemDetail', { itemId: 'demo-1' })}
      >
        <Text style={styles.buttonText}>Ver detalle de ejemplo</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
  },
  button: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
