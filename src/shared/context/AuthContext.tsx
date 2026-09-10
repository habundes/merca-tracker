import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { AuthProvider as SessionProvider, AuthSession } from '@/features/auth/domain';

// Sesión del stub persistida en AsyncStorage (add-on del spec 20: sin persistencia
// el gate de rutas obligaría a iniciar sesión en cada arranque). Solo se guarda la
// sesión falsa — correo, proveedor y nombre mostrado; **nunca** contraseñas ni
// tokens. Cuando llegue el proveedor real, sus tokens van en SecureStore, no aquí.
type AuthContextType = {
  session: AuthSession | null;
  isAuthenticated: boolean;
  // false hasta que se resuelve la lectura de storage: evita mostrar la
  // bienvenida un frame antes de saber que sí había sesión.
  isHydrated: boolean;
  signIn: (session: AuthSession) => void;
  signOut: () => void;
};

const STORAGE_KEY = '@merca-tracker/auth-session';
const VALID_PROVIDERS: SessionProvider[] = ['email', 'google', 'apple'];

function parseStoredSession(raw: string | null): AuthSession | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<AuthSession>;
    if (
      typeof parsed?.email === 'string' &&
      typeof parsed?.displayName === 'string' &&
      VALID_PROVIDERS.includes(parsed?.provider as SessionProvider)
    ) {
      return {
        email: parsed.email,
        displayName: parsed.displayName,
        provider: parsed.provider as SessionProvider,
      };
    }
  } catch {
    // JSON corrupto: se trata como "sin sesión" y se limpia abajo.
  }
  return null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(stored => {
        const restored = parseStoredSession(stored);
        if (restored) {
          setSession(restored);
        } else if (stored !== null) {
          AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
        }
      })
      .catch(() => {})
      // Pase lo que pase con storage, hidratamos: sin esto el gate dejaría la app
      // en la pantalla de carga para siempre (mismo patrón que ThemeContext).
      .finally(() => setIsHydrated(true));
  }, []);

  const signIn = useCallback((next: AuthSession) => {
    setSession(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const signOut = useCallback(() => {
    setSession(null);
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  }, []);

  const value = useMemo(
    () => ({
      session,
      isAuthenticated: session !== null,
      isHydrated,
      signIn,
      signOut,
    }),
    [session, isHydrated, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
