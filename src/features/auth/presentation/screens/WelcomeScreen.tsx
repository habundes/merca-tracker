import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Toast } from '@/shared/components/Toast';
import { useTheme, type ThemeColors } from '@/shared/context/ThemeContext';
import { useThemedStyles } from '@/shared/hooks/useThemedStyles';
import { AuthButton } from '@/features/auth/presentation/components';
import { useAuthForm } from '@/features/auth/presentation/hooks/useAuthForm';

const APP_NAME = 'Merca Tracker';
const TAGLINE = 'Rastrea precios en Mercadolibre';
const PENDING_MESSAGE = 'Próximamente';

export default function WelcomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const styles = useThemedStyles(themedStyles);
  // La bienvenida solo usa los sociales del hook; el formulario vive en /signup.
  const { error, isSubmitting, pendingProvider, submitWithProvider } = useAuthForm('signup');
  const [toast, setToast] = useState<string | null>(null);

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 16 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <Ionicons name="pricetags" size={72} color={colors.accent} />
          <Text style={styles.appName}>{APP_NAME}</Text>
          <Text style={styles.tagline}>{TAGLINE}</Text>
        </View>

        <View style={styles.actions}>
          {Platform.OS === 'ios' && (
            <AuthButton
              label="Continuar con Apple"
              variant="social"
              tone="apple"
              icon="logo-apple"
              loading={pendingProvider === 'apple'}
              disabled={isSubmitting}
              onPress={() => void submitWithProvider('apple')}
            />
          )}
          <AuthButton
            label="Continuar con Google"
            variant="social"
            icon="logo-google"
            loading={pendingProvider === 'google'}
            disabled={isSubmitting}
            onPress={() => void submitWithProvider('google')}
          />
          <AuthButton
            label="Continuar con correo"
            variant="filled"
            icon="mail-outline"
            disabled={isSubmitting}
            onPress={() => router.push('/signup')}
          />
        </View>

        <View style={styles.errorSlot}>
          {error ? (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
              <Text selectable style={styles.errorText}>
                {error}
              </Text>
            </View>
          ) : null}
        </View>

        <AuthButton
          label="Ya tengo cuenta"
          variant="link"
          disabled={isSubmitting}
          onPress={() => router.push('/login')}
        />

        <Text style={styles.footer}>
          Al continuar aceptas los{' '}
          <Text
            accessibilityRole="link"
            style={styles.footerLink}
            onPress={() => setToast(PENDING_MESSAGE)}
          >
            Términos de uso
          </Text>{' '}
          y la{' '}
          <Text
            accessibilityRole="link"
            style={styles.footerLink}
            onPress={() => setToast(PENDING_MESSAGE)}
          >
            Política de privacidad
          </Text>
        </Text>
      </ScrollView>

      {toast ? (
        <Toast
          message={toast}
          bottomOffset={insets.bottom + 24}
          onHide={() => setToast(null)}
        />
      ) : null}
    </View>
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
      justifyContent: 'center',
      paddingHorizontal: 28,
      gap: 24,
    },
    hero: {
      alignItems: 'center',
      gap: 8,
    },
    appName: {
      fontSize: 26,
      fontWeight: '700',
      color: colors.text,
    },
    tagline: {
      fontSize: 15,
      color: colors.textMuted,
      textAlign: 'center',
    },
    actions: {
      gap: 12,
    },
    // Altura reservada para que el bloque no salte al aparecer el error.
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
      fontSize: 13,
      lineHeight: 19,
      textAlign: 'center',
      color: colors.textMuted,
    },
    footerLink: {
      color: colors.accent,
      fontWeight: '600',
    },
  });
