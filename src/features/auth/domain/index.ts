// Capa domain de `auth`: entities (tipos + copy), usecases (puros) y repositories
// (interfaces). Sin dependencias a react-native.
export type { AuthCredentials, AuthProvider, AuthSession } from './entities/auth-credentials';
export {
  AUTH_ERROR_MESSAGES,
  AuthError,
  isAuthError,
  type AuthErrorCode,
} from './entities/auth-error';
export type { AuthRepository } from './repositories/auth-repository';
export { validateEmail } from './usecases/validateEmail';
export { MIN_PASSWORD_LENGTH, validatePassword } from './usecases/validatePassword';
