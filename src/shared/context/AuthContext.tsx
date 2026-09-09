import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { AuthSession } from '@/features/auth/domain';

// Sesión SOLO EN MEMORIA (spec 20): sin AsyncStorage ni SecureStore, se pierde al
// cerrar la app. Existe para que Perfil refleje el login hecho en las pantallas
// del grupo `(auth)`. La persistencia llega con el spec de auth real.
type AuthContextType = {
  session: AuthSession | null;
  isAuthenticated: boolean;
  signIn: (session: AuthSession) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);

  const signIn = useCallback((next: AuthSession) => setSession(next), []);
  const signOut = useCallback(() => setSession(null), []);

  const value = useMemo(
    () => ({
      session,
      isAuthenticated: session !== null,
      signIn,
      signOut,
    }),
    [session, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
