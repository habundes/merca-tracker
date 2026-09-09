import type {
  AuthCredentials,
  AuthProvider,
  AuthSession,
} from '../domain/entities/auth-credentials';
import { AuthError } from '../domain/entities/auth-error';
import type { AuthRepository } from '../domain/repositories/auth-repository';

// Stub de autenticación (proveedor real fuera de scope, spec 20). Simula latencia
// y decide los errores por convención, para que todos los estados de la UI sean
// revisables sin backend:
//
//   Iniciar sesión con `noexiste@demo.mx`   → email-not-found
//   Iniciar sesión con contraseña `incorrecta` → wrong-password
//   Crear cuenta con `existe@demo.mx`       → email-already-registered
//   Social con FORCE_PROVIDER_ERROR = true  → provider-failed
const FAKE_DELAY_MS = 900;
const EMAIL_NOT_FOUND = 'noexiste@demo.mx';
const EMAIL_TAKEN = 'existe@demo.mx';
const WRONG_PASSWORD = 'incorrecta';

// Ponlo en `true` para revisar el error de los botones sociales (no hay OAuth real).
export const FORCE_PROVIDER_ERROR: boolean = false;

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

// "hugo.andrade@demo.mx" → "Hugo Andrade". El flujo no pide nombre, así que el
// nombre mostrado sale del correo.
function deriveDisplayName(email: string): string {
  const localPart = email.split('@')[0] ?? email;
  const words = localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1));
  return words.length > 0 ? words.join(' ') : email;
}

function sessionFor(email: string, provider: AuthProvider): AuthSession {
  return { email, provider, displayName: deriveDisplayName(email) };
}

export const fakeAuthDataSource: AuthRepository = {
  async signIn({ email, password }: AuthCredentials): Promise<AuthSession> {
    await delay(FAKE_DELAY_MS);
    const normalized = normalizeEmail(email);
    if (normalized === EMAIL_NOT_FOUND) {
      throw new AuthError('email-not-found');
    }
    if (password === WRONG_PASSWORD) {
      throw new AuthError('wrong-password');
    }
    return sessionFor(normalized, 'email');
  },

  async signUp({ email }: AuthCredentials): Promise<AuthSession> {
    await delay(FAKE_DELAY_MS);
    const normalized = normalizeEmail(email);
    if (normalized === EMAIL_TAKEN) {
      throw new AuthError('email-already-registered');
    }
    return sessionFor(normalized, 'email');
  },

  async signInWithProvider(provider: Exclude<AuthProvider, 'email'>): Promise<AuthSession> {
    await delay(FAKE_DELAY_MS);
    if (FORCE_PROVIDER_ERROR) {
      throw new AuthError('provider-failed');
    }
    return sessionFor(`usuario@${provider}.demo`, provider);
  },
};
