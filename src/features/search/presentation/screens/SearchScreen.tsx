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
import { TAB_BAR_HEIGHT } from '@/shared/constants/layout';
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
          // Re-centra el contenido por encima de la barra translúcida (Android; 0
          // en iOS), ya que el contenido ahora se extiende bajo la barra. Spec 19.
          paddingBottom: TAB_BAR_HEIGHT,
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
