# SPEC 20 — UI de bienvenida, iniciar sesión y crear cuenta (solo UI, stub)

> **Estado:** Aprobado
> **Dependencias:** spec 02 / spec 03 (dejaron el login como pantalla no protegida dentro de
> `profile/index` y aplazaron "auth real" a un spec futuro — este es ese spec, en su versión de
> **UI únicamente**), spec 05 (`ThemeContext`/`useTheme`, tokens claro/oscuro, `isHydrated`),
> spec 07 (`Configuración` en Perfil; declaró fuera de alcance el campo `name` del login),
> spec 10 (capa adaptativa `Surface`/`Card`/`TextField` = MD3 en Android, Glass en iOS).
> **Fecha:** 2026-09-09
> **Objetivo:** Sustituir el formulario de login/registro embebido en `ProfileMain` por un flujo
> propio de tres pantallas —**Bienvenida**, **Crear cuenta**, **Iniciar sesión**— con botones
> sociales (Google, y Apple solo en iOS), validación, estados de carga y errores con el copy en
> español de `docs/ux_spec.md`. **Solo UI**: la autenticación es un _stub_ con retardo artificial
> (al estilo de `checkProductFake.ts`), **sin dependencias nativas nuevas, sin backend y sin
> proveedor real (Clerk)**. Add-ons posteriores a la aprobación (pedidos por el usuario tras verlo
> en device, ver Decisiones): el tema pasa a depender de la sesión, y la sesión del stub se persiste
> en AsyncStorage con gate de rutas (sin sesión: solo la bienvenida, sin tabs).
>
> **Archivos que toca:**
>
> - `app/(auth)/_layout.tsx` (nuevo) — `Stack` del grupo: `welcome` sin header; `signup`/`login`
>   con header, títulos en español y `stackScreenOptions(colors, isHydrated)`.
> - `app/(auth)/welcome.tsx`, `app/(auth)/signup.tsx`, `app/(auth)/login.tsx` (nuevos) —
>   re-export de una línea de las pantallas en `src/features/auth/presentation/screens/`.
> - `src/features/auth/**` (nuevo) — dominio, data (stub), hook y pantallas (árbol completo abajo).
> - `src/shared/context/AuthContext.tsx` (nuevo) — sesión del stub; **persistida en AsyncStorage**
>   con `isHydrated` (add-on posterior a la aprobación, ver Decisiones).
> - `app/_layout.tsx` — monta `<AuthProvider>` **envolviendo** a `ThemeProvider` (el tema consulta
>   la sesión).
> - `app/index.tsx` — gate de sesión: `Redirect` a `/search` con sesión, a `/welcome` sin ella
>   (add-on posterior a la aprobación).
> - `app/(tabs)/_layout.tsx` — gate: sin sesión los tabs no se montan (`Redirect` a `/welcome`).
> - `src/features/profile/presentation/screens/ProfileMain.tsx` — se le quita el formulario inline;
>   sin sesión muestra una tarjeta CTA hacia `/welcome` (y **nada** de Configuración); "Cerrar
>   sesión" gana confirmación.
> - `src/shared/context/ThemeContext.tsx` — add-on posterior a la aprobación: el tema pasa a ser
>   parte de la cuenta (`canChangeTheme`); sin sesión manda el esquema del SO.
> - `src/features/profile/presentation/screens/AppearanceSettings.tsx` — control inactivo + aviso
>   cuando no hay sesión.
> - `docs/ux_spec.md` — se reescribe la sección `Auth Flow` para que el doc y este spec no se
>   contradigan (la bienvenida lleva los sociales; los formularios ya no los repiten).
> - `CLAUDE.md` — corregir la afirmación de que existen `MaterialButton`/`MaterialHeader`/
>   `GlassButton`/`GlassHeader` (no existen: `md3/index.ts` exporta 3 componentes,
>   `glass/index.ts` exporta 2).

## Alcance

**Dentro:**

- **Grupo de rutas raíz `app/(auth)/`**, hermano de `(tabs)`, con tres pantallas:
  - **Bienvenida** (`/welcome`): hero (glyph Ionicons), nombre de app, tagline, botones
    "Continuar con Apple" (solo iOS), "Continuar con Google", "Continuar con correo"
    (→ `/signup`), enlace "Ya tengo cuenta" (→ `/login`) y pie "Términos de uso · Política de
    privacidad".
  - **Crear cuenta** (`/signup`): correo + contraseña + confirmar contraseña, error inline,
    CTA "Crear cuenta", pie "¿Ya tienes cuenta? [Iniciar sesión]".
  - **Iniciar sesión** (`/login`): correo + contraseña, enlace "¿Olvidaste tu contraseña?",
    CTA "Iniciar sesión", pie "¿No tienes cuenta? [Crear cuenta]".
- **Feature `src/features/auth/`** con la misma separación por capas que `features/search`
  (domain / data / presentation).
- **Stub de autenticación** (`FakeAuthDataSource`) con retardo artificial y disparadores
  deterministas para poder revisar **todos** los estados de error sin backend.
- **`AuthContext`** (`session`, `isAuthenticated`, `isHydrated`, `signIn`, `signOut`) para que
  `ProfileMain` refleje el login hecho en otra pantalla. **Persistido en AsyncStorage** (add-on
  posterior a la aprobación): se guarda solo la sesión falsa (correo, proveedor, nombre mostrado),
  nunca contraseñas ni tokens.
- **Gate de sesión** (add-on posterior a la aprobación): sin sesión la app entra por `/welcome` y
  **no monta los tabs** — ni al arrancar, ni por deep link, ni al cerrar sesión. Con sesión,
  arranque directo a Buscar. Así los rastreos quedan atados a una cuenta.
- **Limpieza de `ProfileMain`**: fuera el formulario inline y el `type Mode`; queda tarjeta CTA
  (sin sesión) y la vista con sesión actual + confirmación al cerrar sesión.
- **Tema ligado a la sesión** (add-on posterior a la aprobación, pedido del usuario tras verlo en
  device): sin sesión el tema **no se puede elegir ni guardar** y la app sigue el esquema del SO;
  con sesión aplica y persiste el modo elegido. `ThemeContext` expone `canChangeTheme`, `setMode`
  es no-op sin sesión, y la pantalla Apariencia queda inactiva con un aviso. El enlace a
  Apariencia **desaparece** de Perfil sin sesión.
- **Componente `AuthButton`** local al feature, con variantes `filled` / `outline` / `social` /
  `link`, construido con `Pressable` (`android_ripple` en Android) sobre los tokens del tema.
- **Copy en español** tomado de `docs/ux_spec.md` (errores, confirmación de logout).
- **Claro y oscuro** en iOS y Android, sin destello pre-hidratación.

**Fuera:**

- **Clerk y cualquier proveedor real**: `@clerk/clerk-expo`, OAuth funcional de Google/Apple,
  `expo-auth-session`, `expo-apple-authentication`, `expo-secure-store`. **Cero dependencias
  nuevas** (no se corre `npx expo install`); los botones sociales resuelven contra el stub.
- **Refresh de tokens y almacenamiento seguro** (`expo-secure-store`): la sesión persistida es la
  falsa, sin tokens. (La persistencia y el gate de rutas estaban fuera de alcance y entraron como
  add-ons posteriores a la aprobación — ver Decisiones.)
- **Recuperación de contraseña y verificación de email**: el enlace "¿Olvidaste tu contraseña?"
  existe visualmente pero no navega a ninguna pantalla (muestra `Toast` "Próximamente").
- **Pantallas de Términos de uso / Política de privacidad**: no existen documentos ni URLs; el pie
  muestra `Toast` "Próximamente".
- **Onboarding con tooltips** post-registro (`docs/ux_spec.md`, sección Onboarding Flow).
- **Borrado de cuenta**, paywall, límites de plan free/premium.
- **Campo "Nombre completo"**: se elimina (no está en `ux_spec.md`; `specs/07:28` lo dejó fuera).
- **Tocar la capa adaptativa** (`glass/`, `md3/`, `adaptive/index.ts`): no se añaden botones
  compartidos; `AuthButton` vive en el feature.
- **Cambios en los tabs**, sus iconos, el anchor `search` o la barra translúcida (spec 19).

## Wireframes y copy

```
BIENVENIDA  /welcome  (sin header)          CREAR CUENTA  /signup
┌────────────────────────────────┐          ┌────────────────────────────────┐
│                                │          │ ←   Crear cuenta               │
│                                │          ├────────────────────────────────┤
│              ◉                 │ hero     │                                │
│        Merca Tracker           │          │ ┌────────────────────────────┐ │
│     Rastrea precios en         │          │ │ Correo electrónico         │ │
│     Mercadolibre               │ tagline  │ └────────────────────────────┘ │
│                                │          │ ┌────────────────────────────┐ │
│ ┌────────────────────────────┐ │          │ │ Contraseña              ◉  │ │
│ │  Continuar con Apple       │ │ iOS      │ └────────────────────────────┘ │
│ └────────────────────────────┘ │          │ ┌────────────────────────────┐ │
│ ┌────────────────────────────┐ │          │ │ Confirmar contraseña    ◉  │ │
│ │  Continuar con Google      │ │          │ └────────────────────────────┘ │
│ └────────────────────────────┘ │          │                                │
│ ┌────────────────────────────┐ │          │  ⚠ <error inline>              │
│ │  Continuar con correo      │ │ →/signup │                                │
│ └────────────────────────────┘ │          │ ┌────────────────────────────┐ │
│                                │          │ │       Crear cuenta         │ │
│      Ya tengo cuenta  →        │ →/login  │ └────────────────────────────┘ │
│                                │          │                                │
│  Al continuar aceptas los      │          │      ¿Ya tienes cuenta?        │
│  Términos de uso y la          │          │      [Iniciar sesión]          │
│  Política de privacidad        │          │                                │
└────────────────────────────────┘          └────────────────────────────────┘

INICIAR SESIÓN  /login                      PERFIL sin sesión (ProfileMain)
┌────────────────────────────────┐          ┌────────────────────────────────┐
│ ←   Iniciar sesión             │          │                                │
├────────────────────────────────┤          │              ◉                 │
│                                │          │   Aún no has iniciado sesión   │
│ ┌────────────────────────────┐ │          │                                │
│ │ Correo electrónico         │ │          │ ┌────────────────────────────┐ │
│ └────────────────────────────┘ │          │ │  Iniciar sesión o crear    │ │
│ ┌────────────────────────────┐ │          │ │  cuenta                    │ │
│ │ Contraseña              ◉  │ │          │ └────────────────────────────┘ │
│ └────────────────────────────┘ │          │            ↓ /welcome          │
│                                │          │                                │
│   ¿Olvidaste tu contraseña?    │          │   Apariencia  (sin sesión)     │
│                                │          │                                │
│  ⚠ <error inline>              │          └────────────────────────────────┘
│                                │
│ ┌────────────────────────────┐ │          Android: misma estructura; sin
│ │      Iniciar sesión        │ │          "Continuar con Apple"; superficies
│ └────────────────────────────┘ │          MD3 (`Card`/`TextField` adaptativos)
│                                │          y `android_ripple` en cada botón.
│      ¿No tienes cuenta?        │          iOS: Liquid Glass en iOS 26+, con
│      [Crear cuenta]            │          fallback plano por debajo.
└────────────────────────────────┘
```

### Copy (español, fuente `docs/ux_spec.md`)

| Elemento                      | Texto                                                                                      |
| ----------------------------- | ------------------------------------------------------------------------------------------ |
| Bienvenida — nombre           | `Merca Tracker`                                                                            |
| Bienvenida — tagline          | `Rastrea precios en Mercadolibre`                                                          |
| Bienvenida — sociales         | `Continuar con Apple` (iOS) · `Continuar con Google`                                       |
| Bienvenida — correo           | `Continuar con correo`                                                                     |
| Bienvenida — enlace           | `Ya tengo cuenta`                                                                          |
| Bienvenida — pie              | `Al continuar aceptas los Términos de uso y la Política de privacidad`                     |
| Títulos de header             | `Crear cuenta` · `Iniciar sesión`                                                          |
| Placeholders                  | `Correo electrónico` · `Contraseña` · `Confirmar contraseña`                               |
| Enlace de reset               | `¿Olvidaste tu contraseña?`                                                                |
| Pies de formulario            | `¿Ya tienes cuenta? Iniciar sesión` · `¿No tienes cuenta? Crear cuenta`                    |
| Error — campos vacíos         | `Completa todos los campos.`                                                               |
| Error — formato de correo     | `Ingresa un correo electrónico válido.`                                                    |
| Error — contraseña corta      | `La contraseña debe tener al menos 8 caracteres.`                                          |
| Error — no coinciden          | `Las contraseñas no coinciden.`                                                            |
| Error — contraseña incorrecta | `Contraseña incorrecta. Inténtalo de nuevo.`                                               |
| Error — correo no encontrado  | `No encontramos una cuenta con ese email.`                                                 |
| Error — correo ya registrado  | `Ya existe una cuenta con ese email. Inicia sesión.`                                       |
| Error — social falló          | `No se pudo conectar. Inténtalo de nuevo.`                                                 |
| Perfil sin sesión             | `Aún no has iniciado sesión` / `Iniciar sesión o crear cuenta`                             |
| Confirmación de logout        | `¿Cerrar sesión?` · `¿Seguro que quieres cerrar la sesión?` · `[Cancelar] [Cerrar sesión]` |
| Toast de pendientes           | `Próximamente`                                                                             |

Los cuatro errores de proveedor son **verbatim** de `docs/ux_spec.md` (sección _Auth Error
States_); en la UI el `⚠` lo aporta el layout (icono `alert-circle`), no el string.

## Modelo de datos

Sin persistencia ni tablas. Tipos nuevos, todos dentro del feature salvo el contexto.

### Domain

```ts
// src/features/auth/domain/entities/auth-credentials.ts
export type AuthProvider = 'email' | 'google' | 'apple';

export type AuthCredentials = {
  email: string;
  password: string;
};

export type AuthSession = {
  email: string;
  provider: AuthProvider;
  // Nombre mostrado: se deriva del correo (no hay campo `name` en el flujo).
  displayName: string;
};
```

```ts
// src/features/auth/domain/entities/auth-error.ts
export type AuthErrorCode =
  | 'empty-fields'
  | 'invalid-email'
  | 'weak-password'
  | 'password-mismatch'
  | 'wrong-password'
  | 'email-not-found'
  | 'email-already-registered'
  | 'provider-failed';

export const AUTH_ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  'empty-fields': 'Completa todos los campos.',
  'invalid-email': 'Ingresa un correo electrónico válido.',
  'weak-password': 'La contraseña debe tener al menos 8 caracteres.',
  'password-mismatch': 'Las contraseñas no coinciden.',
  'wrong-password': 'Contraseña incorrecta. Inténtalo de nuevo.',
  'email-not-found': 'No encontramos una cuenta con ese email.',
  'email-already-registered':
    'Ya existe una cuenta con ese email. Inicia sesión.',
  'provider-failed': 'No se pudo conectar. Inténtalo de nuevo.',
};

export class AuthError extends Error {
  constructor(readonly code: AuthErrorCode) {
    super(AUTH_ERROR_MESSAGES[code]);
  }
}
```

```ts
// src/features/auth/domain/repositories/auth-repository.ts
export interface AuthRepository {
  signIn(credentials: AuthCredentials): Promise<AuthSession>;
  signUp(credentials: AuthCredentials): Promise<AuthSession>;
  signInWithProvider(
    provider: Exclude<AuthProvider, 'email'>,
  ): Promise<AuthSession>;
}
```

Use cases puros (espejan `validateMercadoLibreUrl.ts` / `feedbackForStatus.ts`):

```ts
// domain/usecases/validateEmail.ts
export function validateEmail(value: string): AuthErrorCode | null;

// domain/usecases/validatePassword.ts  (mínimo 8 caracteres; confirmación opcional)
export function validatePassword(
  value: string,
  confirm?: string,
): AuthErrorCode | null;
```

### Data (stub)

```ts
// src/features/auth/data/fakeAuthDataSource.ts
const DELAY_MS = 900; // mismo espíritu que checkProductFake.ts
const EMAIL_NOT_FOUND = 'noexiste@demo.mx';
const EMAIL_TAKEN = 'existe@demo.mx';
const WRONG_PASSWORD = 'incorrecta';
export const FORCE_PROVIDER_ERROR = false; // ponlo en true para revisar el error de sociales

export const fakeAuthDataSource: AuthRepository = {
  /* … */
};
```

Disparadores deterministas (documentados aquí porque son la única forma de revisar los estados sin
backend):

| Acción                            | Entrada                       | Resultado                                  |
| --------------------------------- | ----------------------------- | ------------------------------------------ |
| Iniciar sesión                    | correo `noexiste@demo.mx`     | `email-not-found`                          |
| Iniciar sesión                    | contraseña `incorrecta`       | `wrong-password`                           |
| Crear cuenta                      | correo `existe@demo.mx`       | `email-already-registered`                 |
| Social (Google/Apple)             | `FORCE_PROVIDER_ERROR = true` | `provider-failed`                          |
| Cualquier otra combinación válida | —                             | `AuthSession` con `displayName` del correo |

### Presentation

```ts
// src/features/auth/presentation/hooks/useAuthForm.ts  (espeja useProductSearch.ts)
type AuthMode = 'signin' | 'signup';

export function useAuthForm(mode: AuthMode): {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  confirm: string;
  setConfirm: (v: string) => void;
  showPassword: boolean;
  toggleShowPassword: () => void;
  error: string | null;
  isSubmitting: boolean;
  submit: () => Promise<void>; // valida → repo → AuthContext.signIn → navega
  submitWithProvider: (p: 'google' | 'apple') => Promise<void>;
};
```

```ts
// src/shared/context/AuthContext.tsx  (espeja SearchContext: solo memoria)
export type AuthContextValue = {
  session: AuthSession | null;
  isAuthenticated: boolean;
  signIn: (session: AuthSession) => void;
  signOut: () => void;
};

export function useAuth(): AuthContextValue; // lanza si falta el provider
```

### Árbol de archivos

```
app/(auth)/_layout.tsx
app/(auth)/welcome.tsx        → WelcomeScreen
app/(auth)/signup.tsx         → SignUpScreen
app/(auth)/login.tsx          → SignInScreen

src/features/auth/
  domain/entities/auth-credentials.ts
  domain/entities/auth-error.ts
  domain/repositories/auth-repository.ts
  domain/usecases/validateEmail.ts
  domain/usecases/validatePassword.ts
  domain/index.ts                              (barrel, como features/search/domain/index.ts)
  data/fakeAuthDataSource.ts
  presentation/components/AuthButton.tsx
  presentation/components/AuthTextField.tsx    (input + ojo, sobre `TextField` adaptativo)
  presentation/components/index.ts
  presentation/hooks/useAuthForm.ts
  presentation/screens/WelcomeScreen.tsx
  presentation/screens/SignUpScreen.tsx
  presentation/screens/SignInScreen.tsx

src/shared/context/AuthContext.tsx
```

### Reuso obligatorio (no duplicar)

`useThemedStyles` (`src/shared/hooks/useThemedStyles.ts`) · `useTheme()` + `ON_ACCENT`
(`src/shared/context/ThemeContext.tsx`) · `Surface`/`Card`/`TextField` de
`src/shared/components/adaptive/` — **único** punto de entrada de diseño, nunca `glass/` ni `md3/`
directo · `stackScreenOptions(colors, isHydrated)` (`src/shared/navigation/stack-screen-options.ts`)
· `confirmDestructiveAction(...)` (`src/shared/utils/confirmDialog.ts`) · `Toast`
(`src/shared/components/Toast.tsx`) · `useSafeAreaInsets()` de `react-native-safe-area-context` (ya
instalado) · `Ionicons` de `@expo/vector-icons` (no hay `expo-image` ni `expo-symbols`; el hero es
un glyph, como el `person-circle-outline` de `ProfileMain`, porque no existe asset de logo).

### Detalles de plataforma (fijados para no improvisar)

- **Correo:** `keyboardType="email-address"`, `autoCapitalize="none"`, `autoCorrect={false}`,
  `autoComplete="email"`, `textContentType="emailAddress"`, `returnKeyType="next"`,
  `onSubmitEditing` → `ref` del campo contraseña.
- **Contraseña:** `secureTextEntry`, `autoComplete="password"` (login) / `"new-password"`
  (registro), `textContentType="password"` / `"newPassword"`, `returnKeyType="go"`. En RN 0.86 se
  usa `submitBehavior` (no el deprecado `blurOnSubmit`).
- **Teclado:** `KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}` +
  `ScrollView keyboardShouldPersistTaps="handled"`, igual que `ProfileMain`/`SearchScreen`; en
  Android manda `softwareKeyboardLayoutMode` (default `resize`).
- **Estilos nuevos:** alto 48 y `borderRadius` 10 (para igualar los botones existentes),
  `borderCurve: 'continuous'`, `boxShadow` en vez de las props legacy `shadow*`/`elevation`, `gap`
  en vez de márgenes encadenados.
- **Botón Apple:** solo `Platform.OS === 'ios'` (`docs/mercadolibre_tracker_simplified.md`: Apple
  Sign-In es iOS only), con el par negro/blanco según `effectiveScheme`.
- **Accesibilidad:** `accessibilityRole="button"`, `accessibilityLabel`,
  `accessibilityState={{ disabled, busy }}`, `hitSlop={8}` en los `Pressable`; `<Text selectable>`
  en los mensajes de error; objetivos ≥ 44 pt.

## Plan de implementación

Rama `spec-20-ui-bienvenida-login-registro` (autocreada, `AutoCreateBranch: true`). Cada paso deja
`npx tsc --noEmit` verde y la app arrancando.

1. **Dominio + stub.** Crear `src/features/auth/domain/**` (entidades, puerto, `validateEmail`,
   `validatePassword`, barrel) y `data/fakeAuthDataSource.ts` con el retardo y los disparadores de la
   tabla. Paso aislado: nadie lo consume aún. `npx tsc --noEmit`.

2. **Sesión en memoria.** `src/shared/context/AuthContext.tsx` (espejo de `SearchContext`) y montarlo
   en `app/_layout.tsx` dentro de `ThemeProvider`, envolviendo a `SearchProvider`. La app se comporta
   igual que antes. `npx tsc --noEmit` + arrancar.

3. **Componentes.** `AuthButton` (variantes `filled`/`outline`/`social`/`link`, `Pressable` +
   `android_ripple`, tokens del tema, `boxShadow`, `borderCurve`) y `AuthTextField` (placeholder +
   icono opcional + botón de ojo), ambos sobre la capa adaptativa.

4. **Hook `useAuthForm`.** Estado de campos, validación con los use cases, `isSubmitting`, `error`,
   `submit`/`submitWithProvider` que llaman al repositorio, hacen `signIn()` y navegan.

5. **Grupo de rutas y pantallas.** `app/(auth)/_layout.tsx` (`welcome` con `headerShown: false`;
   `signup`/`login` con header, `title` en español, back mínimo y
   `stackScreenOptions(colors, isHydrated)`), los tres re-exports de una línea y las tres pantallas.
   Navegación fijada:
   - Entrada: `router.push('/welcome')` desde Perfil.
   - Éxito: `signIn(session)` → `router.dismissAll()` → `router.replace('/search')`.
   - Logout: `confirmDestructiveAction` → `signOut()` → `router.dismissAll()` →
     `router.replace('/welcome')`.
   - "Ya tengo cuenta" / pies: `router.push('/login')` / `router.push('/signup')`.

6. **Limpieza de `ProfileMain` (mismo paso, no posterior).** Eliminar `type Mode`, los `TextInput`,
   `showPassword`, `handleLogin`/`handleSignup` y el estado `loggedIn` local; leer `useAuth()`. Sin
   sesión: `Card` con "Aún no has iniciado sesión" + `AuthButton` → `/welcome`, sin sección de
   Configuración. Con sesión: vista actual con `session.displayName`/`session.email` y
   "Cerrar sesión" vía `confirmDestructiveAction`. Verificar que no quede ningún `TextInput` en el
   archivo.

7. **Documentación.** Reescribir la sección `Auth Flow` de `docs/ux_spec.md` conforme a estas
   pantallas (bienvenida con sociales; formularios sin sociales) y corregir en `CLAUDE.md` la lista de
   componentes de `md3/`/`glass/`.

8. **Verificación.** `npx tsc --noEmit` verde; recorrido manual completo (ver Criterios) en dev client
   iOS y emulador Android, en claro y oscuro.

9. **Add-ons posteriores a la aprobación** (pedidos por el usuario tras verlo en device):
   - **Tema ligado a la sesión.** `ThemeContext` expone `canChangeTheme`; sin sesión manda el
     esquema del SO y `setMode` es no-op; Apariencia queda inactiva con aviso y su enlace desaparece
     de Perfil sin sesión. Requiere invertir providers (`AuthProvider` por fuera).
   - **Sesión persistida + gate de rutas.** `AuthContext` guarda/lee la sesión en AsyncStorage con
     `isHydrated`; `app/index.tsx` redirige según sesión y `app/(tabs)/_layout.tsx` bloquea el
     montaje de los tabs sin ella. El logout deja de navegar a mano: basta `signOut()`.

## Criterios de aceptación

- [ ] Existe el grupo `app/(auth)/` con `welcome`, `signup` y `login`; los tres archivos de ruta son
      re-exports de una línea y las pantallas viven en `src/features/auth/presentation/screens/`.
- [ ] La bienvenida muestra hero, nombre, tagline, "Continuar con Google", "Continuar con correo",
      "Ya tengo cuenta" y el pie de Términos/Privacidad; **"Continuar con Apple" solo aparece en
      iOS**.
- [ ] "Continuar con correo" abre **Crear cuenta**; "Ya tengo cuenta" abre **Iniciar sesión**; los
      pies de cada formulario cruzan entre ambas.
- [ ] Validación local antes de llamar al stub: campos vacíos, correo inválido, contraseña < 8,
      confirmación distinta — cada uno con su copy de la tabla y sin llamar al repositorio.
- [ ] Los cuatro errores de proveedor se ven con el copy **verbatim** de `docs/ux_spec.md`, usando
      los disparadores documentados (`noexiste@demo.mx`, contraseña `incorrecta`, `existe@demo.mx`,
      `FORCE_PROVIDER_ERROR`).
- [ ] Durante el envío el CTA queda deshabilitado con indicador de carga y no se puede enviar dos
      veces.
- [ ] Un registro/login válido lleva a **Buscar**, y Perfil muestra la sesión (`displayName` +
      correo) sin reiniciar la app.
- [ ] Tras autenticar, el gesto/botón atrás **no** regresa a la bienvenida ni al formulario (iOS y
      Android).
- [ ] "Cerrar sesión" pide confirmación (`¿Cerrar sesión?` / [Cancelar] [Cerrar sesión]) y al
      confirmar deja la app en la bienvenida.
- [ ] `ProfileMain.tsx` ya no contiene ningún `TextInput` ni `type Mode`; el único acceso al login es
      su tarjeta CTA.
- [ ] El campo "Nombre completo" ya no existe en ningún flujo.
- [ ] Perfil sin sesión **no** muestra la sección Configuración (ni el enlace a Apariencia); con
      sesión sí muestra los tres enlaces.
- [ ] Sin sesión la app usa el **tema del SO** aunque haya un modo guardado, y `setMode` no cambia
      nada; al iniciar sesión vuelve a aplicar el modo guardado y al cambiarlo persiste.
- [ ] La pantalla Apariencia, sin sesión, muestra "Sistema" seleccionado, el control inactivo y el
      aviso "Inicia sesión para elegir el tema…".
- [ ] **Sin sesión no se ven los tabs**: arranque en frío abre la bienvenida; un deep link a
      `/search`, `/track` o `/profile` redirige a `/welcome`.
- [ ] **Con sesión el arranque va directo a Buscar**, sin pasar por la bienvenida ni parpadearla
      (la sesión se restaura de AsyncStorage antes de decidir el destino).
- [ ] Cerrar sesión deja la app en la bienvenida **sin tabs**, igual que un arranque sin sesión (el
      comportamiento del arranque y del logout coincide).
- [ ] La sesión sobrevive cerrar y reabrir la app; tras cerrar sesión no vuelve a aparecer.
- [ ] En AsyncStorage solo se guarda correo, proveedor y nombre mostrado — ninguna contraseña.
- [ ] Abrir la bienvenida con la app en oscuro **no** produce destello claro (fallback `isHydrated`),
      y las 3 pantallas se ven correctas en claro y oscuro, iOS y Android.
- [ ] Con el teclado abierto, el CTA y el mensaje de error siguen alcanzables por scroll en ambas
      plataformas.
- [ ] El pie de Términos/Privacidad respeta el safe area inferior (no queda bajo la barra de gestos) y
      muestra `Toast` "Próximamente"; igual "¿Olvidaste tu contraseña?".
- [ ] Ninguna pantalla importa `fakeAuthDataSource`: el stub entra por el parámetro `repo` de
      `useAuthForm`, que por defecto lo inyecta detrás del puerto `AuthRepository` (mismo patrón que
      `useProductSearch(repo = fakeProductRepository)`). El puerto es la frontera para el futuro
      spec de Clerk.
- [ ] Ninguna pantalla nueva importa `glass/` ni `md3/` directo (solo `adaptive/`).
- [ ] Todos los botones tienen `accessibilityRole`/`accessibilityLabel`, estado deshabilitado
      accesible y objetivo ≥ 44 pt; los errores son `selectable`.
- [ ] Los tres tabs y las rutas `/profile/account|payment|appearance` siguen funcionando igual.
- [ ] `package.json` y `pnpm-lock.yaml` **sin cambios** (cero dependencias nuevas).
- [ ] `npx tsc --noEmit` pasa sin errores nuevos.
- [ ] `docs/ux_spec.md` (sección Auth Flow) y `CLAUDE.md` quedan consistentes con lo implementado.

## Decisiones tomadas y descartadas

- **Bienvenida con los botones sociales y "Continuar con correo"** (elección explícita del usuario)
  en vez de la bienvenida original de `docs/ux_spec.md` ("Crear cuenta" / "Iniciar sesión" con los
  sociales repetidos en cada formulario): evita duplicar los sociales en dos pantallas y quita un
  toque hasta el registro. Se **actualiza `docs/ux_spec.md`** para no dejar dos verdades.
- **Grupo raíz `app/(auth)/`** en vez de meter las pantallas en el stack de Perfil: oculta la barra de
  tabs durante el auth (lo que pedía `ux_spec.md`) y evita el `TAB_BAR_HEIGHT` de spec 19. Descartado
  también `presentation: 'modal'`: el flujo es de pantalla completa, no un formulario puntual.
- **Sin gate de rutas** (`app/index.tsx` intacto): specs 02 y 03 decidieron no proteger rutas, y sin
  sesión persistida un gate mostraría la bienvenida en cada arranque en frío. Queda para el spec de
  auth real.
- **`AuthContext` solo en memoria** (espeja `SearchContext`) en vez de AsyncStorage: la persistencia
  está fuera de alcance, pero el contexto es necesario para que Perfil refleje el login hecho en otra
  pantalla. Descartado pasar el resultado por params de ruta (frágil y no lo ve Perfil).
- **`AuthButton` local al feature** en vez de añadir `MaterialButton`/`GlassButton` a la capa
  adaptativa: mantiene el spec en "solo UI" y no arriesga las pantallas existentes. Se documenta como
  deuda: si un segundo feature necesita botones, se promueve a `adaptive/`.
- **Stub con disparadores deterministas** en vez de errores aleatorios: hace revisables todos los
  estados y repetible la verificación manual.
- **Sin campo "Nombre completo"** (`displayName` derivado del correo): `ux_spec.md` no lo tiene, el
  esquema de `users` en `docs/backend_technical.md` no guarda `name`, y `specs/07:28` lo declaró fuera
  de alcance.
- **Sociales resuelven contra el stub** en vez de mostrar siempre "No se pudo conectar": permite
  recorrer el camino feliz desde la bienvenida; el error se revisa con `FORCE_PROVIDER_ERROR`.
- **`dismissAll()` + `replace()`** para salir del grupo de auth en vez de `back()`: deja el historial
  limpio y evita volver con gesto a una pantalla de auth ya usada.
- **Ionicons como hero** en vez de `assets/icon.png` o `expo-image` con SF Symbols: no hay asset de
  logo in-app y `expo-image` no está instalado (añadirlo exigiría rebuild del dev client).
- **Tema ligado a la sesión** (add-on posterior a la aprobación, pedido del usuario tras verlo en
  device): la opción de Apariencia salía en Perfil sin sesión, y si el tema se configura dentro de
  la cuenta, sin sesión no tiene sentido ni elegirlo ni guardarlo. Se descartó la alternativa de
  "solo las pantallas de `(auth)` siguen al sistema" (dejaba la incoherencia de un tema forzado en
  los tabs sin sesión) y la de "dejarlo como estaba". Implica que `AuthProvider` pase a envolver a
  `ThemeProvider` en `app/_layout.tsx`, porque `ThemeContext` ahora consulta la sesión.
- **Gate de sesión + sesión persistida** (add-on posterior a la aprobación, pedido del usuario tras
  ver la incoherencia en device: el arranque sin sesión mostraba Buscar con tabs, pero el logout
  llevaba a la bienvenida sin tabs). Revierte la decisión de specs 02/03 de no proteger rutas,
  porque los rastreos deben quedar atados a una cuenta. Va acompañado de persistencia en
  AsyncStorage: con la sesión solo en memoria, el gate obligaría a iniciar sesión en cada arranque.
  Descartado "solo gate sin persistencia" (login en cada arranque) y "dejarlo sin gate".
- **El gate vive en `app/index.tsx` + `app/(tabs)/_layout.tsx`**, no en cada pantalla: el layout de
  tabs es el único punto por el que pasan las tres pestañas, así que cubre arranque, deep links y
  logout con una sola comprobación. Por eso el logout ya no navega a mano — `signOut()` basta.
- **AsyncStorage (no SecureStore) para la sesión del stub**: no hay tokens ni contraseñas que
  proteger, y `expo-secure-store` implicaría dependencia nativa nueva (fuera de alcance). Cuando
  llegue el proveedor real, sus tokens van en SecureStore.
- **Esquema del SO capturado al cargar el módulo** (`initialSystemScheme`) en vez de re-leer
  `Appearance.getColorScheme()` al volver al modo sistema: spec 05 fuerza la apariencia nativa con
  `Appearance.setColorScheme`, así que tras forzar un modo la API devuelve el valor forzado. Se
  parte del valor real de arranque y el listener corrige cuando el SO reporta un cambio.

## Riesgos identificados

| #   | Riesgo                                                                                                      | Mitigación                                                                                                                                                                                                                         |
| --- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | Dos UIs de login coexistiendo si `ProfileMain` no se limpia en el mismo cambio.                             | El paso 6 va junto con las pantallas nuevas; criterio explícito: cero `TextInput` en `ProfileMain.tsx`.                                                                                                                            |
| R2  | Destello de tema claro al abrir el grupo nuevo antes de hidratar `ThemeContext`.                            | `(auth)/_layout.tsx` usa `stackScreenOptions(colors, isHydrated)` (mismo fallback a `lightColors` que `(tabs)/profile` y `(tabs)/search`) y cada pantalla pinta `colors.bg` en su raíz.                                            |
| R3  | Historial inconsistente entre grupos hermanos: volver con gesto a una pantalla de auth ya usada.            | Navegación fijada en el paso 5: `push` para entrar, `dismissAll()` + `replace()` al autenticar y al cerrar sesión; criterio de aceptación que lo verifica en ambas plataformas.                                                    |
| R4  | El teclado tapa el CTA o el error en pantallas cortas.                                                      | CTA **dentro** del `ScrollView` (nunca fijo al fondo) + `KeyboardAvoidingView` (`padding`, iOS) + `keyboardShouldPersistTaps="handled"`; Android en `resize`.                                                                      |
| R5  | El pie de Términos/Privacidad queda bajo la barra de gestos (el grupo no tiene header ni tab bar).          | Padding inferior `useSafeAreaInsets().bottom + 16`; no se usa `TAB_BAR_HEIGHT` porque `(auth)` no tiene tab bar.                                                                                                                   |
| R6  | Este stub divergiendo del Clerk que documentan `docs/`.                                                     | Frontera explícita: `AuthRepository` (puerto) + `FakeAuthDataSource` (única implementación); presentation solo conoce el puerto, así que el spec de Clerk sustituye el data source sin tocar pantallas ni hooks.                   |
| R7  | Regresión en rutas existentes al añadir un grupo raíz.                                                      | El grupo es aditivo: `app/index.tsx`, el anchor `search` y los deep links a `/profile/*` no se tocan; solo `app/_layout.tsx` cambia para montar `<AuthProvider>`. Criterio: los 3 tabs y las 3 rutas de Perfil siguen funcionando. |
| R8  | Tentación de instalar Clerk/OAuth "de una vez" y romper el alcance (rebuild de dev client, config plugins). | Criterio de aceptación: `package.json` y `pnpm-lock.yaml` sin cambios. Cualquier proveedor real es otro spec.                                                                                                                      |
| R9  | Tras forzar un modo, `Appearance` ya no expone el esquema real del SO (spec 05), así que al cerrar sesión el tema "del sistema" podría quedarse con el último valor forzado. | `initialSystemScheme` leído al cargar el módulo (antes de cualquier forzado) + listener activo solo mientras se sigue al sistema, para no contaminar el valor. Hueco conocido y aceptado: si el SO cambia de tema mientras hay un modo forzado, el valor se corrige al siguiente cambio del SO o al reiniciar la app. |
| R10 | Invertir el orden de providers (`AuthProvider` por fuera de `ThemeProvider`) rompe algún consumidor de tema. | `AuthContext` no depende del tema, así que la inversión no crea ciclos; verificado con `tsc --noEmit` y arrancando la app. El criterio de los 3 tabs + rutas de Perfil cubre la regresión. |
| R11 | El gate deja al usuario fuera de la app si la lectura de AsyncStorage falla o se cuelga. | `isHydrated` se pone en `true` en el `finally` (mismo patrón que `ThemeContext`): un rechazo deja la app en "sin sesión" (bienvenida), nunca en pantalla de carga. |
| R12 | Bucle o parpadeo de redirección entre `/` , `(tabs)` y `/welcome` mientras se hidrata la sesión. | `app/index.tsx` pinta un fondo del tema hasta que `isHydrated`, y el gate de `(tabs)` solo actúa `if (isSessionHydrated && !isAuthenticated)`: ningún redirect ocurre con estado indeterminado. |
| R13 | Sesión persistida corrupta o de una versión anterior del stub rompe el arranque. | `parseStoredSession` valida forma y proveedor; si no cuadra, limpia la llave y arranca sin sesión. |
