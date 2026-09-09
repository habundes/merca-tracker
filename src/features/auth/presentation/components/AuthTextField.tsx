import { forwardRef } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TextField } from '@/shared/components/adaptive';
import { useTheme } from '@/shared/context/ThemeContext';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export interface AuthTextFieldProps extends TextInputProps {
  icon?: IoniconName;
  // Campo de contraseña: agrega el botón de ojo. El estado vive en el hook.
  isPassword?: boolean;
  showPassword?: boolean;
  onToggleShowPassword?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
}

// Compone el `TextField` adaptativo (MD3 en Android, Glass en iOS) con un icono
// opcional, el `TextInput` y el botón de mostrar/ocultar contraseña.
export const AuthTextField = forwardRef<TextInput, AuthTextFieldProps>(
  (
    {
      icon,
      isPassword = false,
      showPassword = false,
      onToggleShowPassword,
      containerStyle,
      style,
      editable = true,
      ...rest
    },
    ref,
  ) => {
    const { colors } = useTheme();

    return (
      <TextField
        style={[
          styles.container,
          { borderColor: colors.border },
          !editable && styles.disabled,
          containerStyle,
        ]}
      >
        {icon ? (
          <Ionicons name={icon} size={18} color={colors.textMuted} style={styles.leadingIcon} />
        ) : null}
        <TextInput
          ref={ref}
          editable={editable}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={isPassword && !showPassword}
          style={[styles.input, { color: colors.text }, style]}
          {...rest}
        />
        {isPassword && onToggleShowPassword ? (
          <Pressable
            onPress={onToggleShowPassword}
            disabled={!editable}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            accessibilityState={{ disabled: !editable }}
            android_ripple={{ color: colors.outline, borderless: true, radius: 18 }}
            style={({ pressed }) => [styles.eyeBtn, pressed && styles.pressed]}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        ) : null}
      </TextField>
    );
  },
);

AuthTextField.displayName = 'AuthTextField';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 10,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    overflow: 'hidden',
  },
  disabled: {
    opacity: 0.6,
  },
  leadingIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  eyeBtn: {
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.5,
  },
});
