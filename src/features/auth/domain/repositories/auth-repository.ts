import type { AuthCredentials, AuthProvider, AuthSession } from '../entities/auth-credentials';

// Puerto de autenticación. Es la frontera del spec 20: hoy lo implementa
// `fakeAuthDataSource`; el spec de auth real lo implementará contra el proveedor
// (Clerk) sin tocar pantallas ni hooks. Rechaza con `AuthError`.
export interface AuthRepository {
  signIn(credentials: AuthCredentials): Promise<AuthSession>;
  signUp(credentials: AuthCredentials): Promise<AuthSession>;
  signInWithProvider(provider: Exclude<AuthProvider, 'email'>): Promise<AuthSession>;
}
