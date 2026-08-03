import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'PaymentSettings'>;

export default function PaymentSettings({}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ajustes de pago</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
  },
});
