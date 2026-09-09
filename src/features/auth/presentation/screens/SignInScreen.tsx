import { useRef, useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Toast } from '@/shared/components/Toast';
import { useTheme, type ThemeColors } from '@/shared/context/ThemeContext';
import { useThemedStyles } from '@/shared/hooks/useThemedStyles';
import { AuthButton, AuthTextField } from '@/features/auth/presentation/components';
import { useAuthForm } from '@/features/auth/presentation/hooks/useAuthForm';

const PENDING_MESSAGE = 'Próximamente';

export default function SignInScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const styles = useThemedStyles(themedStyles);
  const form = useAuthForm('signin');
  const passwordRef = useRef<TextInput>(null);
  const [toast, setToast] = useState<string | null>(null);

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
          autoComplete="password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={() => void form.submit()}
        />

        {/* El reset de contraseña lo maneja el proveedor real (otro spec). */}
        <View style={styles.forgotRow}>
          <AuthButton
            label="¿Olvidaste tu contraseña?"
            variant="link"
            disabled={form.isSubmitting}
            onPress={() => setToast(PENDING_MESSAGE)}
          />
        </View>

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
          label="Iniciar sesión"
          variant="filled"
          loading={form.isSubmitting}
          onPress={() => void form.submit()}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿No tienes cuenta?</Text>
          <AuthButton
            label="Crear cuenta"
            variant="link"
            disabled={form.isSubmitting}
            onPress={() => router.push('/signup')}
          />
        </View>
      </ScrollView>

      {toast ? (
        <Toast
          message={toast}
          bottomOffset={insets.bottom + 24}
          onHide={() => setToast(null)}
        />
      ) : null}
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
    forgotRow: {
      alignItems: 'flex-end',
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
