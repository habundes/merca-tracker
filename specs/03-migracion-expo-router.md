# Migración a Expo Router (desde React Navigation 7)

## Header

- **Estado:** Aprobado
- **Dependencias:**
  - Spec `02` (navegación anidada clean-arch) — **Implementado**. Esta migración reemplaza su capa de navegación (`src/navigation/*`, `src/features/*/presentation/navigation/*`) conservando las screens y `src/shared/*`.
  - Base: Expo SDK 57, React 19.2, RN 0.86, TS 6.
  - **Requiere `expo-router`** (versión que resuelva `npx expo install` para SDK 57) + peers (`expo-linking`, `expo-constants`; `react-native-screens` y `react-native-safe-area-context` ya presentes).
  - **Elimina** `@react-navigation/native`, `@react-navigation/native-stack`, `@react-navigation/bottom-tabs`.
- **Fecha:** 2026-08-03
- **Objetivo (una frase):** Migrar el motor de navegación de React Navigation 7 a Expo Router (routing por archivos en `app/`, route files finos que re-exportan las screens de `src/features/*`, navegación por hooks y typed routes), con paridad 1:1 de tabs, stacks, títulos y comportamiento — sin features nuevas.

## Scope

**Incluye:**

- Instalar `expo-router` (+ peers) vía `npx expo install`; desinstalar los 3 paquetes `@react-navigation/*`.
- Cambiar entry: `package.json` `"main": "index.ts"` → `"main": "expo-router/entry"`. Borrar `index.ts` y `App.tsx`.
- `app.json`: añadir `scheme` (p.ej. `"mobileapp"`), `plugins: ["expo-router"]`, `experiments.typedRoutes: true`.
- Crear árbol `app/` (route files finos re-exportan screens existentes; imports relativos — no hay alias `@/`):
  - `app/_layout.tsx` — providers (`SearchProvider`) + `StatusBar` + `<Stack screenOptions={{ headerShown:false }}>` envolviendo el grupo de tabs.
  - `app/(tabs)/_layout.tsx` — `<Tabs>` con 3 tabs, iconos Ionicons y estilos actuales; `initialRouteName: 'buscar'` vía `unstable_settings`.
  - Tab **Buscar**: `app/(tabs)/buscar.tsx` (re-export `SearchScreen`), `headerShown:true` a nivel tab (título "Buscar").
  - Tab **Lista**: `app/(tabs)/lista/_layout.tsx` (`<Stack>`), `index.tsx`→ListMain ("Mis búsquedas"), `config.tsx`→ListConfig ("Configurar lista"), `[itemId].tsx`→ItemDetail ("Detalle").
  - Tab **Perfil**: `app/(tabs)/perfil/_layout.tsx` (`<Stack>`), `index.tsx`→ProfileMain ("Perfil"), `account.tsx`→AccountSettings ("Ajustes de cuenta"), `payment.tsx`→PaymentSettings ("Ajustes de pago").
- Reescribir la navegación **dentro de cada screen** a hooks Expo Router (ver Data model). Cuerpo/estilos/estado de las screens intactos salvo la capa de navegación.
- Borrar la capa RN Navigation: `src/navigation/{AppTabs.tsx,types.ts}`, `src/features/list/presentation/navigation/*`, `src/features/profile/presentation/navigation/*`.
- Ajustar `tsconfig.json` / incluir los tipos generados por typedRoutes (`expo-env.d.ts` / `.expo/types`), lo que Expo genere al primer arranque.

**No incluye (queda para otro spec):**

- Deep linking real / configuración de URLs públicas más allá del `scheme` mínimo que Router exige.
- Auth gating / rutas protegidas / redirects. El login sigue viviendo dentro de la screen `perfil/index` (= ProfileMain), con estado local efímero como hoy.
- Persistencia (AsyncStorage) de sesión o estado.
- Cambios de contenido, estilos, títulos, iconos o comportamiento de las screens (es paridad).
- Aplicar glass a headers, theming de navegación.
- API routes de Expo Router, `+not-found` custom más allá del default, web/SEO.

## Data model / Tipos

Sin datos de negocio ni persistencia nueva. El cambio es de **API de navegación**: los `ParamList` manuales y el `declare global RootParamList` se **eliminan**; los tipos de ruta pasan a ser generados por `typedRoutes`.

Mapeo imperativo (React Navigation → Expo Router hooks):

| Screen (`src/features/*`) | Antes (props) | Después (hooks) |
|---|---|---|
| `list/.../ListMain.tsx` | `navigation.navigate('ListConfig')` | `const router = useRouter(); router.push('/lista/config')` |
| `list/.../ListMain.tsx` | `navigation.navigate('ItemDetail', { itemId: item })` | `router.push(\`/lista/${encodeURIComponent(item)}\`)` |
| `list/.../ListConfig.tsx` | `navigation.navigate('ItemDetail', { itemId: 'demo-1' })` | `router.push('/lista/demo-1')` |
| `list/.../ItemDetail.tsx` | `route.params.itemId` (prop) | `const { itemId } = useLocalSearchParams<{ itemId: string }>()` |
| `profile/.../ProfileMain.tsx` | `navigation.navigate('AccountSettings')` / `'PaymentSettings'` | `router.push('/perfil/account')` / `router.push('/perfil/payment')` |
| `profile/.../AccountSettings.tsx`, `PaymentSettings.tsx` | reciben `Props` tipados (sin usarlos) | quitar props/imports de `NativeStackScreenProps` |
| `search/.../SearchScreen.tsx` | sin navegación | sin cambios de navegación |

- Único payload de params en toda la app: **`itemId: string`** → ruta dinámica `app/(tabs)/lista/[itemId].tsx`, leído con `useLocalSearchParams`.
- Títulos/headers se declaran en cada `_layout.tsx` de stack vía `<Stack.Screen name="..." options={{ title }}>`, replicando exactamente los actuales.
- Tabs: `screenOptions` global `headerShown:false`; Buscar sobreescribe `headerShown:true`. Iconos por `name` de tab (mismos glyphs Ionicons) y estilos de `tabBar` idénticos a `AppTabs.tsx`.

## Implementation plan

Cada paso deja el proyecto compilando (`npx tsc --noEmit`) y la app arrancable. Correr `tsc --noEmit` **tras cada paso**. `spec-impl` crea branch `spec-03-*` (AutoCreateBranch:true) → rollback trivial.

1. **Docs primero.** Leer docs Expo Router para SDK **v57** (https://docs.expo.dev/versions/v57.0.0/) — `Stack`, `Tabs`, `useRouter`, `useLocalSearchParams`, `unstable_settings`, typedRoutes — y los `.d.ts` que instale el paso 2. No confiar en memoria (CLAUDE.md).
2. **Dependencias.** `npx expo install expo-router expo-linking expo-constants` (resuelve versiones + peers para SDK 57; `expo-linking` y `expo-constants` no están en el proyecto y deben instalarse explícitamente). Verificar en `package.json` que quedaron versiones coherentes con expo 57 antes de codear. Aún **no** desinstalar RN Navigation.
3. **Entry + config.** `package.json` `main` → `"expo-router/entry"`. `app.json`: añadir `scheme`, `plugins:["expo-router"]`, `experiments.typedRoutes:true`. Borrar `index.ts` y `App.tsx`.
4. **Root layout.** `app/_layout.tsx`: `SearchProvider` (import desde `src/shared/context/SearchContext`) + `StatusBar` + `<Stack screenOptions={{ headerShown:false }}>`. Arrancar (`npm start`) para que Expo genere los tipos de typedRoutes; ajustar `tsconfig` include si Expo lo pide.
5. **Tabs layout.** `app/(tabs)/_layout.tsx`: `<Tabs>` replicando `AppTabs.tsx` (iconos Ionicons `Lista/Buscar/Perfil`→`lista/buscar/perfil`, colores/estilos de `tabBar`, `initialRouteName:'buscar'` vía `unstable_settings`). Definir las 3 `<Tabs.Screen>` con su `title`/`tabBarIcon`; `buscar` con `headerShown:true`.
6. **Tab Buscar.** `app/(tabs)/buscar.tsx` re-exporta `SearchScreen`. Verificar que la tab renderiza y `useSearch()` funciona.
7. **Stack Lista.** `app/(tabs)/lista/_layout.tsx` (`<Stack>` con titles). `index.tsx`→ListMain, `config.tsx`→ListConfig, `[itemId].tsx`→ItemDetail. Reescribir navegación de `ListMain` y `ListConfig` a `useRouter().push(...)`; `ItemDetail` a `useLocalSearchParams`.
8. **Stack Perfil.** `app/(tabs)/perfil/_layout.tsx` (`<Stack>` con titles). `index.tsx`→ProfileMain, `account.tsx`→AccountSettings, `payment.tsx`→PaymentSettings. Reescribir `ProfileMain` a `useRouter().push('/perfil/account' | '/perfil/payment')`; quitar props de `AccountSettings`/`PaymentSettings`.
9. **Limpieza RN Navigation.** Borrar `src/navigation/{AppTabs.tsx,types.ts}`, `src/features/list/presentation/navigation/*`, `src/features/profile/presentation/navigation/*`. Quitar imports muertos de `NativeStackScreenProps`/`ParamList` en las screens. En `src/features/search/presentation/screens/SearchScreen.tsx` cambiar `import { useFocusEffect } from '@react-navigation/native'` → `import { useFocusEffect } from 'expo-router'` (SDK 56+ prohíbe importar de `@react-navigation/*` en código de app; `expo-router` re-exporta el mismo hook). `npx expo uninstall @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs`.
10. **Verificación final.** `npx tsc --noEmit` limpio. Arrancar app: tab inicial Buscar; `lista`→config→[itemId] y back; `perfil`→account/payment y back; login efímero de ProfileMain intacto; header de Buscar visible; glass y `useSearch()` operativos.

## Acceptance criteria

- [ ] `expo-router` presente en `package.json` (versión de `npx expo install` para SDK 57); `@react-navigation/native|native-stack|bottom-tabs` **eliminados**.
- [ ] `package.json` `"main": "expo-router/entry"`; `index.ts` y `App.tsx` borrados.
- [ ] `app.json` tiene `scheme`, `plugins:["expo-router"]` y `experiments.typedRoutes:true`.
- [ ] Existe `app/_layout.tsx` (SearchProvider + StatusBar + Stack `headerShown:false`) y `app/(tabs)/_layout.tsx` (Tabs, `initialRouteName:'buscar'`, iconos/estilos conservados).
- [ ] Rutas: `(tabs)/buscar`, `(tabs)/lista/{index,config,[itemId]}`, `(tabs)/perfil/{index,account,payment}`; cada route file re-exporta la screen de `src/features/*` (imports relativos).
- [ ] Títulos idénticos: Lista "Mis búsquedas"/"Configurar lista"/"Detalle"; Perfil "Perfil"/"Ajustes de cuenta"/"Ajustes de pago"; Buscar con header a nivel tab.
- [ ] Screens migradas a hooks: `useRouter().push` en ListMain/ListConfig/ProfileMain; `useLocalSearchParams` en ItemDetail (`itemId:string`); AccountSettings/PaymentSettings sin props de navegación.
- [ ] Eliminada la capa RN Navigation (`src/navigation/*`, `src/features/*/presentation/navigation/*`) y todo import de `NativeStackScreenProps`/`*ParamList`. `SearchScreen.tsx` importa `useFocusEffect` desde `expo-router`, no desde `@react-navigation/native`.
- [ ] `npx tsc --noEmit` pasa sin errores.
- [ ] En la app: tab inicial Buscar; navegar `lista`→config→detalle de un ítem (con `itemId` correcto) y volver; `perfil`→account/payment y volver; login/logout efímero de ProfileMain igual; glass y `useSearch()` operativos.

## Decisiones tomadas y descartadas

- **Route files finos re-exportando screens** (vs mover screens a `app/`): conserva el layout clean-architecture feature-first del spec 02; `app/` queda como capa de routing delgada. Contra: cada screen se referencia en dos sitios (route file + archivo real).
- **Navegación por hooks `useRouter`/`useLocalSearchParams`** (vs wrapper de compat que inyecte props sintéticas): idiomático Expo Router y elimina deuda; los route files no pasan props `navigation`/`route`, así que mantener la API vieja habría requerido un shim frágil.
- **`experiments.typedRoutes:true`** (vs strings sin tipar): recupera la seguridad de tipos que daban los `ParamList` manuales, ahora generada por Router.
- **Paridad 1:1, sin deep linking real ni auth gating** (decisión explícita del usuario): `scheme` se añade solo porque Expo Router lo requiere; redirects/rutas protegidas y linking público son otro spec. Login sigue efímero dentro de `perfil/index`.
- **Grupo `(tabs)` + stacks anidados por carpeta** (vs tabs planas): reproduce exactamente el árbol tabs→stack actual y mantiene headers por pantalla.
- **`npx expo install` para versionar** (vs fijar versión a mano): CLAUDE.md prohíbe confiar en memoria de versiones; Expo resuelve la compatible con SDK 57.

## Riesgos identificados y plan de mitigación

| # | Riesgo | Mitigación |
|---|--------|-----------|
| R1 | Versión/API de `expo-router` en SDK 57 difiere de lo asumido (props de `Tabs`/`Stack`, forma de `initialRouteName`) | `npx expo install` para versión; leer docs v57 + `.d.ts` instalados antes de escribir layouts (paso 1). |
| R2 | `initialRouteName:'buscar'` no aplica: Expo Router enfoca la primera ruta por orden de archivo, no por `initialRouteName` directo | Usar `export const unstable_settings = { initialRouteName: 'buscar' }` en `(tabs)/_layout.tsx`; verificar tab inicial en criterio de aceptación. |
| R3 | typedRoutes no genera tipos hasta el primer arranque → `tsc` falla por rutas string | Arrancar la app tras el paso 4 para generar tipos; incluir `expo-env.d.ts`/`.expo/types` en tsconfig si Expo lo indica; correr `tsc` tras cada paso. |
| R4 | Header duplicado en Buscar (header de tab + header de algún stack) o ausente | Tabs `screenOptions.headerShown:false` global; `buscar` fija `headerShown:true`; los stacks Lista/Perfil manejan su propio header. El criterio verifica el header de Buscar. |
| R5 | `itemId` con caracteres URL-inseguros (son URLs del historial) rompe la ruta dinámica | `encodeURIComponent` al navegar; `useLocalSearchParams` decodifica. Probar con una URL real del historial en verificación. |
| R6 | Borrar `App.tsx`/`index.ts` y cambiar `main` deja la app sin arrancar si el root layout falla | El root layout (paso 4) se crea y arranca antes de borrar la capa vieja; RN Navigation se desinstala al final (paso 9) tras `tsc` verde. |
| R7 | Sin test runner ni linter → solo `tsc` como verificación automática | `tsc --noEmit` tras cada paso + verificación manual final (navegación ida/vuelta, headers, back, tab inicial). |
