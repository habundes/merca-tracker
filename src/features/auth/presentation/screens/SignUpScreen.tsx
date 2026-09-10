import { useRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type ThemeColors } from '@/shared/context/ThemeContext';
import { useThemedStyles } from '@/shared/hooks/useThemedStyles';
import { AuthButton, AuthTextField } from '@/features/auth/presentation/components';
import { useAuthForm } from '@/features/auth/presentation/hooks/useAuthForm';

export default function SignUpScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const styles = useThemedStyles(themedStyles);
  const form = useAuthForm('signup');
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
      >
        <AuthTextField
          icon="mail-outline"
          placeholder="Correo electrónico"
          value={form.email}
          onChangeText={form.setEmail}
          editable={!form.isSubmitting}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />

        <AuthTextField
          ref={passwordRef}
          icon="lock-closed-outline"
          placeholder="Contraseña"
          value={form.password}
          onChangeText={form.setPassword}
          editable={!form.isSubmitting}
          isPassword
          showPassword={form.showPassword}
          onToggleShowPassword={form.toggleShowPassword}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => confirmRef.current?.focus()}
        />

        <AuthTextField
          ref={confirmRef}
          icon="lock-closed-outline"
          placeholder="Confirmar contraseña"
          value={form.confirm}
          onChangeText={form.setConfirm}
          editable={!form.isSubmitting}
          isPassword
          showPassword={form.showPassword}
          onToggleShowPassword={form.toggleShowPassword}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={() => void form.submit()}
        />

        {/* Altura reservada: el error no debe empujar el CTA al aparecer. */}
        <View style={styles.errorSlot}>
          {form.error ? (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
              <Text selectable style={styles.errorText}>
                {form.error}
              </Text>
            </View>
          ) : null}
        </View>

        <AuthButton
          label="Crear cuenta"
          variant="filled"
          loading={form.isSubmitting}
          onPress={() => void form.submit()}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿Ya tienes cuenta?</Text>
          <AuthButton
            label="Iniciar sesión"
            variant="link"
            disabled={form.isSubmitting}
            onPress={() => router.push('/login')}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const themedStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    content: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 32,
      gap: 12,
    },
    errorSlot: {
      minHeight: 20,
      justifyContent: 'center',
    },
    errorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    errorText: {
      flex: 1,
      fontSize: 14,
      color: colors.danger,
    },
    footer: {
      alignItems: 'center',
      marginTop: 8,
      gap: 2,
    },
    footerText: {
      fontSize: 14,
      color: colors.textMuted,
    },
  });
