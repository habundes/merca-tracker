import { useState, useRef, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSearch } from '@/shared/context/SearchContext';
import { useTheme } from '@/shared/context/ThemeContext';
import {
  SearchFeedback,
  SearchHelp,
  SearchUrlInput,
  type SearchFeedbackType,
} from '../../../../components/search';

export default function SearchScreen() {
  const [url, setUrl] = useState('');
  const [duplicate, setDuplicate] = useState(false);

  const inputRef = useRef<TextInput>(null);
  const { addSearch, history } = useSearch();
  const { colors } = useTheme();
  const router = useRouter();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.bg,
          paddingHorizontal: 20,
          justifyContent: 'center',
        },
        feedbackSlot: {
          marginTop: 12,
          minHeight: 32,
        },
        helpSlot: {
          marginTop: 24,
        },
      }),
    [colors],
  );

  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }, []),
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
    router.push('/track');
  };

  const feedbackType: SearchFeedbackType = duplicate ? 'warning' : 'hint';
  const feedbackMessage = duplicate
    ? 'URL ya agregada anteriormente'
    : 'Las búsquedas se guardan en Rastrear';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SearchUrlInput
        ref={inputRef}
        value={url}
        onChangeText={setUrl}
        onSubmit={handleSearch}
        onClear={() => setUrl('')}
      />

      <View style={styles.feedbackSlot}>
        <SearchFeedback type={feedbackType} message={feedbackMessage} />
      </View>

      <View style={styles.helpSlot}>
        <SearchHelp />
      </View>
    </KeyboardAvoidingView>
  );
}
