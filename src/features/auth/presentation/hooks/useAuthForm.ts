import { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/shared/context/AuthContext';
import {
  AUTH_ERROR_MESSAGES,
  isAuthError,
  validateEmail,
  validatePassword,
  type AuthProvider,
  type AuthRepository,
  type AuthSession,
} from '@/features/auth/domain';
import { fakeAuthDataSource } from '@/features/auth/data/fakeAuthDataSource';

export type AuthMode = 'signin' | 'signup';

export interface UseAuthForm {
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  confirm: string;
  setConfirm: (value: string) => void;
  showPassword: boolean;
  toggleShowPassword: () => void;
  error: string | null;
  isSubmitting: boolean;
  submit: () => Promise<void>;
  submitWithProvider: (provider: Exclude<AuthProvider, 'email'>) => Promise<void>;
}

// Orquesta los formularios de auth: valida en local (sin tocar el repositorio),
// llama al puerto `AuthRepository`, guarda la sesión y sale del grupo `(auth)`.
// `repo` es inyectable para tests; las pantallas no conocen la implementación.
export function useAuthForm(
  mode: AuthMode,
  repo: AuthRepository = fakeAuthDataSource,
): UseAuthForm {
  const { signIn } = useAuth();
  const router = useRouter();

  const [email, setEmailState] = useState('');
  const [password, setPasswordState] = useState('');
  const [confirm, setConfirmState] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // El error se borra al primer cambio de cualquier campo (como en Buscar).
  const setEmail = useCallback((value: string) => {
    setEmailState(value);
    setError(null);
  }, []);

  const setPassword = useCallback((value: string) => {
    setPasswordState(value);
    setError(null);
  }, []);

  const setConfirm = useCallback((value: string) => {
    setConfirmState(value);
    setError(null);
  }, []);

  const toggleShowPassword = useCallback(() => setShowPassword(prev => !prev), []);

  // Sale del grupo `(auth)` sin dejar historial: nada de volver con gesto al
  // formulario ya usado. `canDismiss` evita llamar a `dismissAll` sin stack.
  const goToApp = useCallback(() => {
    if (router.canDismiss()) router.dismissAll();
    router.replace('/search');
  }, [router]);

  const runProviderCall = useCallback(
    async (call: () => Promise<AuthSession>) => {
      setError(null);
      setIsSubmitting(true);
      try {
        const session = await call();
        signIn(session);
        goToApp();
      } catch (thrown) {
        setError(
          isAuthError(thrown) ? thrown.message : AUTH_ERROR_MESSAGES['provider-failed'],
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [signIn, goToApp],
  );

  const submit = useCallback(async () => {
    if (isSubmitting) return;

    const emailError = validateEmail(email);
    if (emailError) {
      setError(AUTH_ERROR_MESSAGES[emailError]);
      return;
    }

    const passwordError = validatePassword(password, mode === 'signup' ? confirm : undefined);
    if (passwordError) {
      setError(AUTH_ERROR_MESSAGES[passwordError]);
      return;
    }

    const credentials = { email: email.trim(), password };
    await runProviderCall(() =>
      mode === 'signup' ? repo.signUp(credentials) : repo.signIn(credentials),
    );
  }, [isSubmitting, email, password, confirm, mode, repo, runProviderCall]);

  const submitWithProvider = useCallback(
    async (provider: Exclude<AuthProvider, 'email'>) => {
      if (isSubmitting) return;
      await runProviderCall(() => repo.signInWithProvider(provider));
    },
    [isSubmitting, repo, runProviderCall],
  );

  return {
    email,
    setEmail,
    password,
    setPassword,
    confirm,
    setConfirm,
    showPassword,
    toggleShowPassword,
    error,
    isSubmitting,
    submit,
    submitWithProvider,
  };
}
