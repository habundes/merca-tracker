import { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme, ThemeMode } from '../../../../shared/context/ThemeContext';

type Mode = 'login' | 'signup';

const THEME_OPTIONS: { label: string; value: ThemeMode }[] = [
  { label: 'Sistema', value: 'system' },
  { label: 'Claro', value: 'light' },
  { label: 'Oscuro', value: 'dark' },
];

export default function ProfileMain() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [error, setError] = useState('');
  const { colors, mode: themeMode, setMode: setThemeMode } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flexGrow: 1,
      backgroundColor: colors.bg,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 28,
      paddingVertical: 40,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
      marginTop: 12,
    },
    sub: {
      fontSize: 14,
      color: colors.textMuted,
      marginTop: 6,
    },
    toggle: {
      flexDirection: 'row',
      marginTop: 24,
      backgroundColor: colors.bgTertiary,
      borderRadius: 10,
      padding: 4,
    },
    toggleBtn: {
      paddingHorizontal: 28,
      paddingVertical: 8,
      borderRadius: 8,
    },
    toggleActive: {
      backgroundColor: colors.bgSecondary,
      shadowColor: colors.text,
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    toggleText: {
      fontSize: 14,
      color: colors.textMuted,
      fontWeight: '600',
    },
    toggleTextActive: {
      color: colors.accent,
    },
    form: {
      width: '100%',
      marginTop: 24,
      gap: 12,
    },
    input: {
      height: 48,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      backgroundColor: colors.bgSecondary,
      fontSize: 15,
      color: colors.text,
    },
    passwordRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    eyeBtn: {
      height: 48,
      paddingHorizontal: 12,
      justifyContent: 'center',
      backgroundColor: colors.bgSecondary,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: 10,
    },
    error: {
      color: colors.danger,
      fontSize: 13,
      textAlign: 'center',
    },
    actionBtn: {
      height: 48,
      backgroundColor: colors.accent,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 4,
    },
    actionText: {
      color: '#ffffff',
      fontWeight: '700',
      fontSize: 16,
    },
    logoutBtn: {
      marginTop: 24,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderWidth: 1.5,
      borderColor: colors.accent,
      borderRadius: 10,
    },
    logoutText: {
      color: colors.accent,
      fontWeight: '600',
      fontSize: 15,
    },
    appearanceSection: {
      width: '100%',
      marginTop: 32,
    },
    appearanceSectionTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textMuted,
      textTransform: 'uppercase',
      marginBottom: 10,
    },
    appearanceSegment: {
      flexDirection: 'row',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      overflow: 'hidden',
    },
    appearanceSegmentBtn: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.bgTertiary,
    },
    appearanceSegmentBtnActive: {
      backgroundColor: colors.accent,
    },
    appearanceSegmentText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    appearanceSegmentTextActive: {
      color: '#ffffff',
    },
    demoNav: {
      marginTop: 24,
      alignItems: 'center',
      gap: 8,
    },
    demoNavTitle: {
      fontSize: 12,
      color: colors.textMuted,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    demoNavBtn: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    demoNavText: {
      color: colors.accent,
      fontWeight: '600',
      fontSize: 14,
    },
  }), [colors]);

  const reset = () => { setEmail(''); setPassword(''); setConfirm(''); setName(''); setError(''); };

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) return setError('Completa todos los campos.');
    setError('');
    setLoggedIn(true);
  };

  const handleSignup = () => {
    if (!name.trim() || !email.trim() || !password.trim()) return setError('Completa todos los campos.');
    if (password !== confirm) return setError('Las contraseñas no coinciden.');
    setError('');
    setLoggedIn(true);
  };

  const appearanceToggle = (
    <View style={styles.appearanceSection}>
      <Text style={styles.appearanceSectionTitle}>Apariencia</Text>
      <View style={styles.appearanceSegment}>
        {THEME_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.appearanceSegmentBtn,
              themeMode === opt.value && styles.appearanceSegmentBtnActive,
            ]}
            onPress={() => setThemeMode(opt.value)}
          >
            <Text
              style={[
                styles.appearanceSegmentText,
                themeMode === opt.value && styles.appearanceSegmentTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (loggedIn) {
    return (
      <View style={styles.container}>
        <Ionicons name="person-circle-outline" size={72} color={colors.accent} />
        <Text style={styles.title}>{name || email}</Text>
        <Text style={styles.sub}>Sesión iniciada</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => { setLoggedIn(false); reset(); }}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

        {appearanceToggle}

        <View style={styles.demoNav}>
          <Text style={styles.demoNavTitle}>Demo de navegación</Text>
          <TouchableOpacity style={styles.demoNavBtn} onPress={() => router.push('/profile/account')}>
            <Text style={styles.demoNavText}>Ajustes de cuenta</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.demoNavBtn} onPress={() => router.push('/profile/payment')}>
            <Text style={styles.demoNavText}>Ajustes de pago</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Ionicons name="person-circle-outline" size={72} color={colors.textMuted} />
        <Text style={styles.title}>{mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</Text>

        {/* Toggle login/signup */}
        <View style={styles.toggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, mode === 'login' && styles.toggleActive]}
            onPress={() => { setMode('login'); reset(); }}
          >
            <Text style={[styles.toggleText, mode === 'login' && styles.toggleTextActive]}>Entrar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, mode === 'signup' && styles.toggleActive]}
            onPress={() => { setMode('signup'); reset(); }}
          >
            <Text style={[styles.toggleText, mode === 'signup' && styles.toggleTextActive]}>Registrarse</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          {mode === 'signup' && (
            <TextInput
              style={styles.input}
              placeholder="Nombre completo"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Correo electrónico"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Contraseña"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(v => !v)}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {mode === 'signup' && (
            <TextInput
              style={styles.input}
              placeholder="Confirmar contraseña"
              placeholderTextColor={colors.textMuted}
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry={!showPassword}
            />
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={mode === 'login' ? handleLogin : handleSignup}
          >
            <Text style={styles.actionText}>{mode === 'login' ? 'Entrar' : 'Crear cuenta'}</Text>
          </TouchableOpacity>
        </View>

        {appearanceToggle}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
