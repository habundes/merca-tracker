import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { Card } from '@/shared/components/adaptive';
import { TAB_BAR_HEIGHT } from '@/shared/constants/layout';
import { useAuth } from '@/shared/context/AuthContext';
import { useTheme, type ThemeColors } from '@/shared/context/ThemeContext';
import { useThemedStyles } from '@/shared/hooks/useThemedStyles';
import { confirmDestructiveAction } from '@/shared/utils/confirmDialog';
import { AuthButton } from '@/features/auth/presentation/components';

// El login ya no vive aquí: el flujo completo está en el grupo `(auth)`
// (spec 20). Esta pantalla solo refleja la sesión de `AuthContext`.
export default function ProfileMain() {
  const { colors } = useTheme();
  const { session, signOut } = useAuth();
  const router = useRouter();

  const styles = useThemedStyles(themedStyles);

  const handleLogout = () => {
    confirmDestructiveAction({
      title: '¿Cerrar sesión?',
      message: '¿Seguro que quieres cerrar la sesión?',
      confirmLabel: 'Cerrar sesión',
      // Sin navegación imperativa: al quedarse sin sesión, el gate de
      // `app/(tabs)/_layout.tsx` redirige solo a la bienvenida.
      onConfirm: signOut,
    });
  };

  if (!session) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Ionicons name="person-circle-outline" size={72} color={colors.textMuted} />
        <Text style={styles.title}>Aún no has iniciado sesión</Text>
        <Text style={styles.sub}>
          Crea una cuenta o entra para guardar tus rastreos.
        </Text>

        <Card style={styles.ctaCard}>
          <AuthButton
            label="Iniciar sesión o crear cuenta"
            variant="filled"
            icon="log-in-outline"
            onPress={() => router.push('/welcome')}
          />
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Ionicons name="person-circle-outline" size={72} color={colors.accent} />
      <Text style={styles.title}>{session.displayName}</Text>
      <Text selectable style={styles.sub}>
        {session.email}
      </Text>

      <View style={styles.configSection}>
        <Text style={styles.configSectionTitle}>Configuración</Text>
        <Link href="/profile/account" asChild>
          <Link.Trigger>
            <TouchableOpacity style={styles.configBtn}>
              <Text style={styles.configText}>Ajustes de cuenta</Text>
            </TouchableOpacity>
          </Link.Trigger>
          <Link.Preview />
        </Link>
        <Link href="/profile/payment" asChild>
          <Link.Trigger>
            <TouchableOpacity style={styles.configBtn}>
              <Text style={styles.configText}>Ajustes de pago</Text>
            </TouchableOpacity>
          </Link.Trigger>
          <Link.Preview />
        </Link>
        <Link href="/profile/appearance" asChild>
          <Link.Trigger>
            <TouchableOpacity style={styles.configBtn}>
              <Text style={styles.configText}>Apariencia</Text>
            </TouchableOpacity>
          </Link.Trigger>
          <Link.Preview />
        </Link>
      </View>

      <AuthButton
        label="Cerrar sesión"
        variant="outline"
        style={styles.logoutBtn}
        onPress={handleLogout}
      />
    </ScrollView>
  );
}

const themedStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flexGrow: 1,
      backgroundColor: colors.bg,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 28,
      paddingVertical: 40,
      // Clearance para la barra translúcida (Android; 0 en iOS). Spec 19.
      paddingBottom: 40 + TAB_BAR_HEIGHT,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
      marginTop: 12,
      textAlign: 'center',
    },
    sub: {
      fontSize: 14,
      color: colors.textMuted,
      marginTop: 6,
      textAlign: 'center',
    },
    ctaCard: {
      width: '100%',
      marginTop: 24,
    },
    configSection: {
      marginTop: 24,
      alignItems: 'center',
      gap: 8,
    },
    configSectionTitle: {
      fontSize: 12,
      color: colors.textMuted,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    configBtn: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    configText: {
      color: colors.accent,
      fontWeight: '600',
      fontSize: 14,
    },
    logoutBtn: {
      marginTop: 40,
      alignSelf: 'stretch',
    },
  });
