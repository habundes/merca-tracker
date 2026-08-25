import { useCallback, useMemo, useRef } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '@/shared/context/ThemeContext';
import {
  SearchFeedback,
  SearchHelp,
  SearchUrlInput,
} from '@/features/search/presentation/components';
import { useProductSearch } from '@/features/search/presentation/hooks/useProductSearch';
import { feedbackForStatus } from '@/features/search/domain';

export default function SearchScreen() {
  const { colors } = useTheme();
  const inputRef = useRef<TextInput>(null);
  const { value, status, disabled, onChangeText, onClear, onSubmit } =
    useProductSearch();

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

  const feedback = feedbackForStatus(status);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SearchUrlInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        onSubmit={onSubmit}
        onClear={onClear}
        disabled={disabled}
      />

      <View style={styles.feedbackSlot}>
        <SearchFeedback type={feedback.type} message={feedback.message} />
      </View>

      <View style={styles.helpSlot}>
        <SearchHelp />
      </View>
    </KeyboardAvoidingView>
  );
}
