import { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSearch } from '../../../../shared/context/SearchContext';
import { useTheme, ON_ACCENT } from '../../../../shared/context/ThemeContext';

export default function SearchScreen() {
  const [url, setUrl] = useState('');
  const [duplicate, setDuplicate] = useState(false);
  const [added, setAdded] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const { addSearch, history } = useSearch();
  const { colors } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      marginBottom: 24,
      color: colors.text,
    },
    row: {
      flexDirection: 'row',
      width: '100%',
      alignItems: 'center',
      gap: 8,
    },
    input: {
      flex: 1,
      height: 48,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      backgroundColor: colors.bgSecondary,
      fontSize: 15,
      color: colors.text,
    },
    button: {
      height: 48,
      paddingHorizontal: 20,
      backgroundColor: colors.accent,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonText: {
      color: ON_ACCENT,
      fontWeight: '700',
      fontSize: 15,
    },
    hint: {
      marginTop: 16,
      color: colors.textMuted,
      fontSize: 13,
    },
    duplicate: {
      marginTop: 16,
      color: colors.danger,
      fontSize: 13,
      fontWeight: '600',
    },
    added: {
      marginTop: 16,
      color: colors.accent,
      fontSize: 13,
      fontWeight: '600',
    },
  }), [colors]);

  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }, [])
  );

  const handleSearch = () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    if (history.includes(trimmed)) {
      setDuplicate(true);
      setTimeout(() => setDuplicate(false), 2500);
      return;
    }
    setDuplicate(false);
    addSearch(trimmed);
    setUrl('');
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>Rastrea un producto</Text>
      <View style={styles.row}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="https://ejemplo.com"
          placeholderTextColor={colors.textMuted}
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          keyboardType="url"
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.button} onPress={handleSearch}>
          <Text style={styles.buttonText}>Ir</Text>
        </TouchableOpacity>
      </View>
      {duplicate
        ? <Text style={styles.duplicate}>URL ya agregada anteriormente</Text>
        : added
          ? <Text style={styles.added}>URL agregada al historial</Text>
          : <Text style={styles.hint}>Las búsquedas se guardan en Lista</Text>
      }
    </KeyboardAvoidingView>
  );
}
