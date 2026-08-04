# Dark mode con toggle en Perfil

## Header

- **Estado:** Implementado
- **Dependencias:**
  - Spec `03` (Migración Expo Router) — Implementado. Este spec introduce theming sobre las screens ya re-exportadas en `app/(tabs)/**`.
  - Spec `04` (Renombrar tab Rastrear) — Implementado. Afecta `TrackMain`/`TrackConfig` en `src/features/track/`.
  - Base: Expo SDK 57, React 19.2, RN 0.86, TS 6.
  - **Requiere** `@react-native-async-storage/async-storage` (no instalado; vía `npx expo install`).
- **Fecha:** 2026-08-04
- **Objetivo (una frase):** Introducir dark mode completo mediante un `ThemeContext` que expone tokens semánticos (`bg`, `bgSecondary`, `bgTertiary`, `text`, `textMuted`, `border`, `accent`, `danger`, `tabInactive`), con modo `light | dark | system` (default `system`) persistido en `AsyncStorage`, toggle segmentado de 3 botones en una nueva sección "Apariencia" en `ProfileMain`, refactor de las 7 screens + tab bar + stack headers + fallback de `GlassView` para consumir tokens vía `useMemo(() => StyleSheet.create(...), [colors])`, y `app.json.userInterfaceStyle` cambiado de `"light"` a `"automatic"`.

## Scope

**Incluye:**

- **Dependencias.** `npx expo install @react-native-async-storage/async-storage` (versión compatible SDK 57).
- **`app.json`.** `userInterfaceStyle: "light"` → `"automatic"`.
- **`ThemeContext`.** Nuevo módulo `src/shared/context/ThemeContext.tsx`:
  - `type ThemeMode = 'light' | 'dark' | 'system'`.
  - `type ThemeColors = { bg, bgSecondary, bgTertiary, text, textMuted, border, accent, danger, tabInactive }` (todos `string`).
  - Constantes `lightColors` / `darkColors` (valores de la tabla del Data model).
  - `ThemeProvider`: lee preferencia inicial de `AsyncStorage` (key `@merca-tracker/theme-preference`), suscribe a `Appearance.addChangeListener` cuando `mode === 'system'`, expone `{ mode, effectiveScheme: 'light'|'dark', colors, setMode }`. `setMode` persiste en `AsyncStorage`.
  - Hook `useTheme()`.
- **Root layout (`app/_layout.tsx`).** Envolver árbol con `<ThemeProvider>` por dentro de `<SearchProvider>` (o al revés, indiferente). `<StatusBar style="auto" />` se mantiene (ya reacciona al scheme).
- **Tab bar (`app/(tabs)/_layout.tsx`).** Consumir `useTheme()` y aplicar `colors.accent` (active), `colors.tabInactive` (inactive), `colors.bgSecondary` (`tabBarStyle.backgroundColor`), `colors.border` (`borderTopColor`). El `screenOptions` sigue siendo función de `route`; se puede convertir el layout a leer `colors` en el cuerpo del componente.
- **Stacks (`app/(tabs)/track/_layout.tsx`, `app/(tabs)/profile/_layout.tsx`).** Aplicar `headerStyle.backgroundColor: colors.bgSecondary`, `headerTintColor: colors.text`, `contentStyle.backgroundColor: colors.bg` vía `screenOptions` del `<Stack>`. Igual para el header del tab Search (`headerShown:true` en `(tabs)/_layout.tsx`).
- **Refactor de screens** — mover `StyleSheet.create` dentro del componente envuelto en `useMemo(() => StyleSheet.create({...}), [colors])`, y reemplazar todos los literales de color por tokens:
  - `src/features/track/presentation/screens/TrackMain.tsx`
  - `src/features/track/presentation/screens/TrackConfig.tsx`
  - `src/features/track/presentation/screens/ItemDetail.tsx`
  - `src/features/search/presentation/screens/SearchScreen.tsx`
  - `src/features/profile/presentation/screens/ProfileMain.tsx`
  - `src/features/profile/presentation/screens/AccountSettings.tsx`
  - `src/features/profile/presentation/screens/PaymentSettings.tsx`
- **UI de toggle en `ProfileMain`.** Nueva sección **"Apariencia"** arriba de "Ajustes de cuenta". Componente: label "Apariencia" + control segmentado de 3 botones ("Sistema" | "Claro" | "Oscuro"). El botón activo usa `colors.accent` como fondo y `#fff` de texto; inactivos usan `colors.bgTertiary` + `colors.text`. Tap → `setMode('system'|'light'|'dark')`.
- **Fallback de `GlassView`** (`src/shared/components/glass/GlassView.tsx` o similar). El `<View>` de fallback pasa de blanco/translúcido hardcoded a `colors.bgSecondary` con `borderColor: colors.border`. `GlassCard`/`GlassButton`/`GlassHeader` heredan al componerse sobre `GlassView`.

**No incluye (queda para otro spec):**

- Theming de los headers de Liquid Glass real en iOS 26+ (el sistema los tinta; no tocamos).
- Iconos alternativos por modo (los Ionicons ya toman `color` prop y funcionan con ambos schemes).
- Splash screen dark (Expo lo maneja aparte con `splash.dark`).
- Animación de transición entre modos (fade). Cambio inmediato.
- Extraer los estilos comunes a un `styles` compartido cross-feature. Cada screen mantiene su bloque.
- Adaptive icon dark para Android.
- Themed images/assets.
- Tests unitarios del `ThemeContext` (no hay test runner en el proyecto).

## Data model / Tipos

Sin datos de negocio. Se introduce estado de UI persistido.

**Persistencia (AsyncStorage):**

| Key | Valor | Notas |
|---|---|---|
| `@merca-tracker/theme-preference` | `'light' \| 'dark' \| 'system'` | Escrita por `setMode`; leída al montar `ThemeProvider`. Ausente → default `'system'`. Valor inválido → tratar como ausente + limpiar. |

**Paleta:**

| Token | Light | Dark |
|---|---|---|
| `bg` | `#ffffff` | `#000000` |
| `bgSecondary` | `#f9fafb` | `#1c1c1e` |
| `bgTertiary` | `#f3f4f6` | `#2c2c2e` |
| `text` | `#111111` | `#ffffff` |
| `textMuted` | `#666666` | `#8e8e93` |
| `border` | `#e5e7eb` | `#38383a` |
| `accent` | `#2563eb` | `#0a84ff` |
| `danger` | `#dc2626` | `#ff453a` |
| `tabInactive` | `#aaaaaa` | `#8e8e93` |

**Tipos (`src/shared/context/ThemeContext.tsx`):**

```ts
export type ThemeMode = 'light' | 'dark' | 'system';
export type ColorScheme = 'light' | 'dark';

export type ThemeColors = {
  bg: string;
  bgSecondary: string;
  bgTertiary: string;
  text: string;
  textMuted: string;
  border: string;
  accent: string;
  danger: string;
  tabInactive: string;
};

export type ThemeContextValue = {
  mode: ThemeMode;              // preferencia del usuario
  effectiveScheme: ColorScheme; // resuelto (si mode==='system' → Appearance)
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
};
```

**Constantes (mismo archivo):**

```ts
export const lightColors: ThemeColors = {
  bg: '#ffffff',
  bgSecondary: '#f9fafb',
  bgTertiary: '#f3f4f6',
  text: '#111111',
  textMuted: '#666666',
  border: '#e5e7eb',
  accent: '#2563eb',
  danger: '#dc2626',
  tabInactive: '#aaaaaa',
};

export const darkColors: ThemeColors = {
  bg: '#000000',
  bgSecondary: '#1c1c1e',
  bgTertiary: '#2c2c2e',
  text: '#ffffff',
  textMuted: '#8e8e93',
  border: '#38383a',
  accent: '#0a84ff',
  danger: '#ff453a',
  tabInactive: '#8e8e93',
};
```

**Resolución de `effectiveScheme`:**

- `mode === 'light'` → `'light'`.
- `mode === 'dark'` → `'dark'`.
- `mode === 'system'` → `Appearance.getColorScheme() ?? 'light'`. Suscripción a `Appearance.addChangeListener` activa **solo** cuando `mode === 'system'` (unsubscribe al cambiar a manual).

**Hidratación (arranque):**

- `ThemeProvider` monta con `mode: 'system'` como valor sincrónico inicial (evita flash) y dispara `AsyncStorage.getItem` en `useEffect`; al resolver, si el valor persistido difiere, hace `setMode(persisted)`. Un frame de posible flash es aceptable (no bloqueamos render con splash).

## Implementation plan

Cada paso deja el árbol compilando (`npx tsc --noEmit`) y la app arrancable. `spec-impl` crea branch `spec-05-dark-light-system-mode` → rollback trivial.

1. **Docs primero.** Leer docs Expo SDK v57 para `useColorScheme`, `Appearance` (RN 0.86), `expo-status-bar`, y README de `@react-native-async-storage/async-storage` para SDK 57. No confiar en memoria (CLAUDE.md).

2. **Dependencias + config.** `npx expo install @react-native-async-storage/async-storage`. Cambiar `app.json.expo.userInterfaceStyle` de `"light"` a `"automatic"`. `tsc --noEmit` verde.

3. **`ThemeContext`.** Crear `src/shared/context/ThemeContext.tsx` con los tipos, constantes `lightColors`/`darkColors`, `ThemeProvider` (hidratación de `AsyncStorage`, suscripción condicional a `Appearance`, `setMode` que persiste) y `useTheme()`. Sin consumidores todavía. `tsc` verde.

4. **Wire root layout.** `app/_layout.tsx`: envolver el árbol con `<ThemeProvider>` (dentro de `<SearchProvider>`). `<StatusBar style="auto" />` intacto. Verificar arranque de la app: no debe cambiar nada visual todavía.

5. **Tab bar themed.** `app/(tabs)/_layout.tsx`: consumir `useTheme()` en el cuerpo; aplicar `colors.accent` / `colors.tabInactive` / `colors.bgSecondary` (bg) / `colors.border` (borderTop). El header del tab `search` (`headerShown:true`) recibe `headerStyle.backgroundColor: colors.bgSecondary`, `headerTintColor: colors.text` vía `options` de `<Tabs.Screen name="search">`. Forzar dark temporalmente (`setMode('dark')` en dev) para verificar. `tsc` verde.

6. **Stack headers themed.** `app/(tabs)/track/_layout.tsx` y `app/(tabs)/profile/_layout.tsx`: `screenOptions` del `<Stack>` consume `useTheme()` y aplica `headerStyle.backgroundColor: colors.bgSecondary`, `headerTintColor: colors.text`, `contentStyle.backgroundColor: colors.bg`. Verificar headers en ambos modos.

7. **Refactor screens — feature `track`.** Convertir `TrackMain.tsx`, `TrackConfig.tsx`, `ItemDetail.tsx`: mover `StyleSheet.create` dentro del componente, envolver en `const styles = useMemo(() => StyleSheet.create({ ... }), [colors])`, reemplazar cada literal de color por un token. `tsc` verde. Verificar visualmente en ambos modos.

8. **Refactor screens — feature `search`.** Igual para `SearchScreen.tsx`. `tsc` verde. Verificar.

9. **Refactor screens — feature `profile`.** Igual para `ProfileMain.tsx`, `AccountSettings.tsx`, `PaymentSettings.tsx`. `tsc` verde. Verificar.

10. **UI de toggle en `ProfileMain`.** Añadir sección "Apariencia" arriba de "Ajustes de cuenta": label "Apariencia" + segmentado horizontal de 3 botones ("Sistema" | "Claro" | "Oscuro"). Activo: `bg: colors.accent`, `text: '#ffffff'`. Inactivo: `bg: colors.bgTertiary`, `text: colors.text`. Border container: `colors.border`. Tap → `setMode(...)`. Verificar los 3 estados persisten tras reload de la app.

11. **Fallback de `GlassView`.** En `src/shared/components/glass/GlassView.tsx` (rama fallback, cuando `isLiquidGlassAvailable()` es false), consumir `useTheme()` y aplicar `backgroundColor: colors.bgSecondary`, `borderColor: colors.border` al `<View>` de fallback. `GlassCard`/`GlassButton`/`GlassHeader` heredan.

12. **Verificación final.** `npx tsc --noEmit` limpio. `grep -RIn -E "'#[0-9a-fA-F]{3,8}'" src app` — resultado esperado: solo dentro de `ThemeContext.tsx` (paletas) y de `'#fff'`/`'#ffffff'` puntual en el toggle activo. Cualquier otro literal restante es un olvido → arreglar. Reset del preference (`AsyncStorage.removeItem`) → debe defaultear a `system`.

13. **Verificación manual (matriz):**
    - Con `mode: system` y OS en **light**: toda la app en light.
    - Con `mode: system` y OS en **dark**: toda la app en dark (tab bar, headers, cards, texto, borders, empty states de Rastrear, historial en Buscar, formularios de Perfil).
    - Cambiar OS scheme con la app abierta en `mode: system` → app se re-tinta en vivo.
    - Toggle a "Claro" con OS en dark → app queda light.
    - Toggle a "Oscuro" con OS en light → app queda dark.
    - Kill + relaunch → última preferencia persiste.
    - Detalle de un ítem (`/track/[itemId]`) legible en ambos modos.
    - Flujo login efímero en `ProfileMain` legible en ambos modos.

## Acceptance criteria

- [ ] `@react-native-async-storage/async-storage` presente en `package.json` (versión resuelta por `npx expo install` para SDK 57).
- [ ] `app.json.expo.userInterfaceStyle` es `"automatic"`.
- [ ] Existe `src/shared/context/ThemeContext.tsx` que exporta `ThemeMode`, `ColorScheme`, `ThemeColors`, `ThemeContextValue`, `lightColors`, `darkColors`, `ThemeProvider`, `useTheme`.
- [ ] `lightColors` y `darkColors` contienen exactamente los 9 tokens listados con los valores de la tabla del Data model.
- [ ] `ThemeProvider` persiste la preferencia en `AsyncStorage` con key `@merca-tracker/theme-preference` y valores `'light' | 'dark' | 'system'`; ausente → default `'system'`; inválido → limpiar y default.
- [ ] `Appearance.addChangeListener` está suscrito **solo** cuando `mode === 'system'` (unsubscribe al cambiar a manual).
- [ ] `app/_layout.tsx` envuelve el árbol con `<ThemeProvider>`.
- [ ] `app/(tabs)/_layout.tsx` consume `useTheme()`: `tabBarActiveTintColor: colors.accent`, `tabBarInactiveTintColor: colors.tabInactive`, `tabBarStyle.backgroundColor: colors.bgSecondary`, `borderTopColor: colors.border`. El header del tab `search` usa `headerStyle.backgroundColor: colors.bgSecondary` y `headerTintColor: colors.text`.
- [ ] `app/(tabs)/track/_layout.tsx` y `app/(tabs)/profile/_layout.tsx` aplican `headerStyle.backgroundColor: colors.bgSecondary`, `headerTintColor: colors.text`, `contentStyle.backgroundColor: colors.bg` vía `screenOptions`.
- [ ] Las 7 screens (`TrackMain`, `TrackConfig`, `ItemDetail`, `SearchScreen`, `ProfileMain`, `AccountSettings`, `PaymentSettings`) tienen su `StyleSheet.create` dentro del componente envuelto en `useMemo(() => StyleSheet.create(...), [colors])` y ningún literal de color hex/`rgb`/`rgba` en el bloque de estilos.
- [ ] `ProfileMain` renderiza una sección **"Apariencia"** arriba de "Ajustes de cuenta" con tres botones segmentados ("Sistema" | "Claro" | "Oscuro"); el botón activo tiene fondo `colors.accent` y texto `#ffffff`; los inactivos tienen fondo `colors.bgTertiary` y texto `colors.text`; tap dispara `setMode(...)`.
- [ ] `GlassView` fallback (`<View>` en Android / iOS<26 / Web) aplica `backgroundColor: colors.bgSecondary` y `borderColor: colors.border`.
- [ ] `grep -RIn -E "'#[0-9a-fA-F]{3,8}'" src app` devuelve resultados **solo** en `ThemeContext.tsx` y en `#ffffff`/`#fff` del texto activo del toggle.
- [ ] `npx tsc --noEmit` pasa sin errores.
- [ ] Matriz manual del paso 13 del Implementation plan: los 8 escenarios se verifican OK.

## Decisiones tomadas y descartadas

- **`ThemeContext` con tokens semánticos** (vs `useColorScheme()` directo en cada screen, vs hook `useThemeColor()` por token estilo Expo template). Elegido: un solo punto de cambio, testeable, y necesario para soportar el toggle manual (`useColorScheme()` solo refleja el sistema y no permite override). Descartadas las otras dos.

- **Tres modos `light | dark | system`** (vs solo `light | dark`, vs solo seguir sistema sin toggle). Elegido: patrón estándar iOS/Android; da control al usuario y respeta el sistema por default.

- **Persistencia en `AsyncStorage`** (vs `expo-secure-store`, vs memoria efímera). Elegido: preferencia no es sensible; `AsyncStorage` es el estándar RN para este caso. Contra: añade una dependencia nueva al proyecto.

- **Toggle segmentado de 3 botones** (vs `Switch` binario, vs modal/action-sheet). Elegido: un tap, sin ocultar opciones, self-explanatory.

- **Ubicación del toggle en `ProfileMain` (nueva sección "Apariencia" arriba de "Ajustes de cuenta")** (vs nueva screen dedicada `/profile/appearance`, vs modal). Elegido: es una sola opción, no justifica screen propia; visible sin navegar.

- **`useMemo(() => StyleSheet.create(...), [colors])` dentro del componente** (vs `StyleSheet.create` estático + colores inline en cada `style={[..., { color }]}`). Elegido: todo el estilo en un lugar; `useMemo` evita recrear en cada render. Contra: cada screen se toca entera en el refactor.

- **Paleta dark basada en iOS system dark** (negro `#000` para `bg`, `#1c1c1e` para `bgSecondary`, `#0a84ff` para accent). Alternativa descartada: mantener `#2563eb` como accent en ambos modos — perdía contraste sobre fondos oscuros.

- **`app.json.userInterfaceStyle: "automatic"`** (vs mantener `"light"` y forzar tema en JS). Elegido: alinea el native UI (splash de sistema, indicadores nativos, `Alert`) con el scheme.

- **Hidratación de `AsyncStorage` no bloquea el render** (posible flash de un frame si el usuario tiene `mode: 'dark'` persistido y el sistema está en light). Elegido: aceptar el flash breve; bloquear el árbol tras un `getItem` complica el arranque y no aporta valor visible.

- **`Appearance.addChangeListener` suscrito solo cuando `mode === 'system'`** (vs siempre suscrito). Elegido: en modo manual el scheme del OS es irrelevante; suscripción condicional evita recomputar `effectiveScheme` innecesariamente.

- **Fallback de `GlassView` themed, pero no el glass real de iOS 26+**. Elegido: en iOS 26+ el sistema tinta el material; forzar colores rompería el efecto. Los otros platforms/versiones caen al `<View>` fallback, que sí honra el tema.

- **Splash dark, adaptive icon dark, imágenes themed → fuera de scope.** Justificación: producto MVP; se añaden si el usuario lo pide en spec posterior.

## Riesgos identificados y plan de mitigación

| # | Riesgo | Mitigación |
|---|---|---|
| R1 | `@react-native-async-storage/async-storage` versión incompatible con SDK 57 rompe el arranque | Instalar vía `npx expo install` (nunca a mano); tras instalar, arrancar la app antes de tocar código de tema para verificar. |
| R2 | Flash de tema incorrecto al arrancar si la preferencia persistida difiere del scheme del sistema (`mode: dark` persistido, OS en light) | Aceptado como decisión (ver Decisiones). Si el flash resulta molesto en verificación, mitigación posterior: bloquear el render con splash hasta hidratar (fuera de scope de este spec). |
| R3 | `Appearance.addChangeListener` no se desuscribe al cambiar de `system` a manual → fugas y recomputes fantasma | Retornar el `remove()` del listener desde `useEffect` con dep `[mode]`; verificar con toggle rápido entre modos que el listener se instala/desinstala. |
| R4 | Refactor de 7 screens deja literales de color olvidados → dark mode inconsistente | Grep obligatorio en Acceptance (`'#[0-9a-fA-F]{3,8}'` solo permitido en `ThemeContext.tsx` y `#fff` del toggle activo). Verificación manual visual en todas las screens y sub-screens. |
| R5 | `useMemo` con dep `[colors]` no recomputa si `colors` es el mismo objeto entre renders y luego el objeto cambia por switch de scheme | `ThemeContext` retorna `colors` derivado de `effectiveScheme` (referencia distinta entre light/dark porque son constantes distintas); verificar que el value del provider se recalcula (usar `useMemo` en el value del provider con dep `[mode, effectiveScheme]`). |
| R6 | Header nativo del stack no acepta cambios en caliente al re-tintarse — Expo Router puede cachear `screenOptions` | `screenOptions` se declara como función que consume `useTheme()` dentro del componente `_layout`; al cambiar `mode`, el componente re-renderiza y las options se recomputan. Verificar en la matriz manual. |
| R7 | `GlassView` fallback themed rompe el efecto real de Liquid Glass en iOS 26+ si el fallback se aplica por error | La rama de fallback está gated por `isLiquidGlassAvailable()` — no tocar la condición. Verificar en simulador iOS 26+ que el material real sigue apareciendo. |
| R8 | `userInterfaceStyle: "automatic"` cambia comportamiento de UI nativo (Alert, DatePicker) en producción sin que se note en dev | Verificación manual: disparar el `Alert.alert('Limpiar rastreos', …)` en `TrackMain` con OS en dark — el sheet debe salir en dark. |
| R9 | Persistencia con valor corrupto/legacy (`'auto'`, `null`, string ajeno) rompe el provider en runtime | Validar en `getItem`: si el valor no pertenece a `['light','dark','system']`, `removeItem` + default `system`. Cubierto en Acceptance. |
