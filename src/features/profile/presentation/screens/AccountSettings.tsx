import { View, Text, StyleSheet } from 'react-native';

export default function AccountSettings() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ajustes de cuenta</Text>
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
