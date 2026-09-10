// Proveedor con el que se autentica el usuario. `email` = formulario correo + contraseña.
export type AuthProvider = 'email' | 'google' | 'apple';

// Credenciales que capturan los formularios de Crear cuenta / Iniciar sesión.
export type AuthCredentials = {
  email: string;
  password: string;
};

// Sesión resultante. Stub: no hay token ni id de usuario (spec 20 es solo UI).
export type AuthSession = {
  email: string;
  provider: AuthProvider;
  // Nombre mostrado: se deriva del correo (el flujo no pide `name`).
  displayName: string;
};
