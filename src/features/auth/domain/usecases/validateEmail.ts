import type { AuthErrorCode } from '../entities/auth-error';

// Formato mínimo razonable de correo: algo@algo.tld, sin espacios ni arrobas extra.
// No se valida el dominio (eso es cosa del proveedor real).
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Puro. `null` = correo aceptable.
export function validateEmail(value: string): AuthErrorCode | null {
  const email = value.trim();
  if (!email) return 'empty-fields';
  if (!EMAIL_PATTERN.test(email)) return 'invalid-email';
  return null;
}
