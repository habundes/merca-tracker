// Códigos de error del flujo de auth. Los cuatro últimos vienen del proveedor
// (aquí, del stub); los primeros los produce la validación local antes de llamarlo.
export type AuthErrorCode =
  | 'empty-fields'
  | 'invalid-email'
  | 'weak-password'
  | 'password-mismatch'
  | 'wrong-password'
  | 'email-not-found'
  | 'email-already-registered'
  | 'provider-failed';

// Copy en español. Los mensajes de proveedor son verbatim de `docs/ux_spec.md`
// (sección Auth Error States). El icono de alerta lo pone la UI, no el string.
export const AUTH_ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  'empty-fields': 'Completa todos los campos.',
  'invalid-email': 'Ingresa un correo electrónico válido.',
  'weak-password': 'La contraseña debe tener al menos 8 caracteres.',
  'password-mismatch': 'Las contraseñas no coinciden.',
  'wrong-password': 'Contraseña incorrecta. Inténtalo de nuevo.',
  'email-not-found': 'No encontramos una cuenta con ese email.',
  'email-already-registered': 'Ya existe una cuenta con ese email. Inicia sesión.',
  'provider-failed': 'No se pudo conectar. Inténtalo de nuevo.',
};

export class AuthError extends Error {
  constructor(readonly code: AuthErrorCode) {
    super(AUTH_ERROR_MESSAGES[code]);
    this.name = 'AuthError';
  }
}

// Type guard: el hook solo sabe mostrar mensajes de `AuthError`; cualquier otro
// rechazo se traduce a 'provider-failed'.
export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}
