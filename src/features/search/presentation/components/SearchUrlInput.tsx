import { forwardRef } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  type TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TextField } from '@/shared/components/adaptive';
import { useTheme } from '@/shared/context/ThemeContext';

export interface SearchUrlInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  onClear: () => void;
}

export const SearchUrlInput = forwardRef<TextInput, SearchUrlInputProps>(
  ({ value, onChangeText, onSubmit, onClear }, ref) => {
    const { colors } = useTheme();
    const showClear = value.length > 0;

    const textInputProps: TextInputProps = {
      value,
      onChangeText,
      onSubmitEditing: onSubmit,
      placeholder: 'Pega URL de Mercadolibre',
      placeholderTextColor: colors.textMuted,
      keyboardType: 'url',
      autoCapitalize: 'none',
      autoCorrect: false,
      returnKeyType: 'search',
      style: [styles.input, { color: colors.text }],
    };

    return (
      <TextField
        style={[
          styles.container,
          { borderColor: colors.border },
        ]}
      >
        <Ionicons
          name="link-outline"
          size={18}
          color={colors.textMuted}
          style={styles.leadingIcon}
        />
        <TextInput ref={ref} {...textInputProps} />
        {showClear && (
          <Pressable
            onPress={onClear}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Limpiar URL"
            android_ripple={{ color: colors.outline, borderless: true, radius: 18 }}
            style={({ pressed }) => [styles.clearBtn, pressed && { opacity: 0.5 }]}
          >
            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
          </Pressable>
        )}
        {showClear && (
          <Pressable
            onPress={onSubmit}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Rastrear URL"
            android_ripple={{ color: colors.outline, borderless: true, radius: 18 }}
            style={({ pressed }) => [styles.sendBtn, pressed && { opacity: 0.5 }]}
          >
            <Ionicons name="arrow-forward-circle" size={22} color={colors.accent} />
          </Pressable>
        )}
      </TextField>
    );
  },
);

SearchUrlInput.displayName = 'SearchUrlInput';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    height: 48,
    overflow: 'hidden',
  },
  leadingIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  clearBtn: {
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
