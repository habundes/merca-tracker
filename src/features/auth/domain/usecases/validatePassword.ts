import type { AuthErrorCode } from '../entities/auth-error';

export const MIN_PASSWORD_LENGTH = 8;

// Puro. `confirm` solo se pasa en Crear cuenta; en Iniciar sesión se omite.
// `null` = contraseña aceptable.
export function validatePassword(value: string, confirm?: string): AuthErrorCode | null {
  if (!value) return 'empty-fields';
  if (confirm !== undefined && !confirm) return 'empty-fields';
  if (value.length < MIN_PASSWORD_LENGTH) return 'weak-password';
  if (confirm !== undefined && value !== confirm) return 'password-mismatch';
  return null;
}
