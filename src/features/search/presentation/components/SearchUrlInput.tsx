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
  disabled?: boolean;
}

export const SearchUrlInput = forwardRef<TextInput, SearchUrlInputProps>(
  ({ value, onChangeText, onSubmit, onClear, disabled = false }, ref) => {
    const { colors } = useTheme();
    const showClear = value.length > 0;

    const textInputProps: TextInputProps = {
      value,
      onChangeText,
      onSubmitEditing: onSubmit,
      editable: !disabled,
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
          disabled && styles.disabled,
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
            disabled={disabled}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Limpiar URL"
            accessibilityState={{ disabled }}
            android_ripple={{ color: colors.outline, borderless: true, radius: 18 }}
            style={({ pressed }) => [styles.clearBtn, pressed && { opacity: 0.5 }]}
          >
            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
          </Pressable>
        )}
        {showClear && (
          <Pressable
            onPress={onSubmit}
            disabled={disabled}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Rastrear URL"
            accessibilityState={{ disabled }}
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
  disabled: {
    opacity: 0.5,
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
  sendBtn: {
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
