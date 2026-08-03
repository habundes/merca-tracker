# Arquitectura de navegación anidada por tab (clean architecture feature-first)

## Header

- **Estado:** Aprobado
- **Dependencias:**
  - Spec `01` (Liquid Glass) — sus componentes se **mueven** a `src/shared/components/glass` (mismo código, nueva ruta).
  - Base: Expo SDK 57, React Navigation 7 (`@react-navigation/native`, `@react-navigation/bottom-tabs` ya instalados).
  - **Requiere `@react-navigation/native-stack`** (`^7`, compatible RN Nav 7) — lo instala el usuario; este spec solo lo configura.
- **Fecha:** 2026-08-03
- **Objetivo (una frase):** Introducir navegación anidada por tab (native-stacks) bajo clean architecture feature-first (`src/features/<f>/{domain,data,presentation}`), entregando la capa presentation real (navegación tipada + pantallas placeholder) para Home y Perfil, Search como pantalla única, y carpetas domain/data vacías con convención documentada — sin lógica, datos ni persistencia.

## Scope

**Incluye:**

- Configurar `@react-navigation/native-stack` (instalado por el usuario).
- Crear `src/features/{home,profile,search}/`:
  - `home` y `profile` con `domain/`, `data/` (vacías, `index.ts` + comentario de convención) y `presentation/`.
  - `search` solo con `presentation/`.
- Presentation Home: `navigation/HomeStack.tsx` + `navigation/types.ts` (`HomeStackParamList`) + `screens/` (`HomeMain`, `ListConfig`, `ItemDetail`).
- Presentation Profile: `navigation/ProfileStack.tsx` + `navigation/types.ts` (`ProfileStackParamList`) + `screens/` (`ProfileMain`, `Login`, `SignUp`, `AccountSettings`, `PaymentSettings`).
- Presentation Search: `screens/SearchScreen.tsx` (sin stack).
- `src/navigation/` raíz: `AppTabs.tsx` + `types.ts` (`AppTabsParamList` compone las param lists de cada feature y declara `RootParamList`).
- Mover a `src/shared/`: `SearchContext` (→ `context/`), glass (→ `components/glass/`). Actualizar imports (`App.tsx` y consumidores).
- Headers: tabs `headerShown:false`; stacks con header propio por pantalla; Search con header a nivel de tab.
- Pantallas nuevas = placeholder (título + navegación). `ItemDetail` con param `itemId: string`.

**No incluye (queda para otro spec):**

- Contenido/lógica real de pantallas; entidades, casos de uso, repositorios reales (domain/data quedan vacías con convención).
- Autenticación real, sesión, tokens, gate raíz auth-vs-app (login vive dentro de `ProfileStack` como pantalla navegable, sin protección de rutas).
- Persistencia (AsyncStorage u otra) de sesión o estado.
- Deep linking / URL linking.
- Stack para Search o cualquier sub-pantalla de búsqueda.
- Theming / aplicación de glass a los headers de navegación.
- Capas domain/data con contenido (casos de uso, repos) — la arquitectura se entrega a nivel de presentation + esqueleto de capas.

## Data model / Tipos

Sin datos de negocio ni persistencia. Solo param lists de navegación tipadas (React Navigation 7), co-locadas por feature y compuestas en la raíz.

```ts
// src/features/home/presentation/navigation/types.ts
export type HomeStackParamList = {
  HomeMain: undefined;
  ListConfig: undefined;
  ItemDetail: { itemId: string };
};
```

```ts
// src/features/profile/presentation/navigation/types.ts
export type ProfileStackParamList = {
  ProfileMain: undefined;
  Login: undefined;
  SignUp: undefined;
  AccountSettings: undefined;
  PaymentSettings: undefined;
};
```

```ts
// src/navigation/types.ts
import type { NavigatorScreenParams } from '@react-navigation/native';
import type { HomeStackParamList } from '../features/home/presentation/navigation/types';
import type { ProfileStackParamList } from '../features/profile/presentation/navigation/types';

export type AppTabsParamList = {
  Historial: NavigatorScreenParams<HomeStackParamList>;
  Buscar: undefined;                                  // pantalla única, sin stack
  Perfil: NavigatorScreenParams<ProfileStackParamList>;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends AppTabsParamList {}
  }
}
```

Screens tipan props con `NativeStackScreenProps<...>` (stacks) o `BottomTabScreenProps<AppTabsParamList, 'Buscar'>` (Search). `ItemDetail` es la única con param (`itemId: string`).

**Convención domain/data** (documentada en `index.ts` de cada carpeta vacía, con `export {}`):

- `domain/` → `entities/`, `usecases/`, `repositories/` (interfaces). Sin dependencias a RN ni librerías.
- `data/` → `repositories/` (implementaciones), `datasources/`, `models/` (DTOs). Implementa interfaces de domain.
- `presentation/` → depende de domain, nunca al revés.

## Implementation plan

Cada paso deja el proyecto compilando (`tsc --noEmit`) y la app arrancando. Se corre `tsc --noEmit` **tras cada paso**.

1. **Dependencia.** Usuario instala `@react-navigation/native-stack` (`^7`). Validar peer contra `@react-navigation/native ^7.3.x` y su presencia en `package.json` antes de codear.
2. **`src/shared/` + mover código.** Crear `src/shared/`. Mover `SearchContext` → `src/shared/context/SearchContext.tsx` y glass → `src/shared/components/glass/*`. Actualizar imports (`App.tsx` y consumidores). Borrar `src/context/` y `src/components/` viejos solo tras `tsc` verde. App idéntica funcionalmente.
3. **Esqueleto de features.** Crear `src/features/{home,profile,search}/`. En home y profile: `domain/index.ts` y `data/index.ts` con comentario de convención + `export {}` (vacíos). En las tres: `presentation/`. Search solo `presentation/`.
4. **Home presentation.** `screens/HomeMain.tsx` (mover HomeScreen actual aquí, renombrar `HomeMain`), `screens/ListConfig.tsx`, `screens/ItemDetail.tsx` (placeholders: título + navegación; `ItemDetail` lee `route.params.itemId`). `navigation/types.ts` (`HomeStackParamList`). `navigation/HomeStack.tsx` (native-stack, `initialRouteName: HomeMain`, header propio). Aún no cableado a tabs.
5. **Profile presentation.** `screens/` (`ProfileMain` = ProfileScreen actual movido/renombrado, `Login`, `SignUp`, `AccountSettings`, `PaymentSettings`, placeholders con navegación). `navigation/types.ts` (`ProfileStackParamList`). `navigation/ProfileStack.tsx` (native-stack, `initialRouteName: ProfileMain`, header propio).
6. **Search presentation.** Mover `SearchScreen` → `src/features/search/presentation/screens/SearchScreen.tsx`. Sin stack.
7. **`src/navigation/types.ts`.** `AppTabsParamList` componiendo las param lists de features + `declare global` de `RootParamList`.
8. **`src/navigation/AppTabs.tsx`.** Reemplaza `BottomTabs`. Tabs: `Historial`→`HomeStack`, `Buscar`→`SearchScreen` (`options={{ headerShown: true }}`), `Perfil`→`ProfileStack`. `screenOptions`: `headerShown:false` global, conservar iconos Ionicons + estilos de tab actuales. `initialRouteName:'Buscar'`.
9. **Cablear `App.tsx`.** Importar `AppTabs` (nueva ruta) y `SearchProvider` (`src/shared/context`). Borrar `src/navigation/BottomTabs.tsx` viejo.
10. **Navegación funcional.** Botones con `navigation.navigate(...)` tipados; `ItemDetail` navegado desde `ListConfig`/`HomeMain` con un `itemId` de ejemplo; back nativo del header.
11. **Verificación final.** `tsc --noEmit` sin errores. App arranca; navegación `HomeMain`→`ListConfig`→`ItemDetail` y `Perfil`→(`Login`/`SignUp`/`AccountSettings`/`PaymentSettings`) con back; Search igual con su header; glass y `useSearch()` operativos desde `shared/`.

## Acceptance criteria

- [ ] `@react-navigation/native-stack` presente en `package.json` (`^7`, peer compatible con `@react-navigation/native ^7.3.x`).
- [ ] Existe `src/features/{home,profile,search}/`; home y profile con `domain/` + `data/` (con `index.ts` de convención) y `presentation/`; search solo `presentation/`.
- [ ] `SearchContext` vive en `src/shared/context/` y glass en `src/shared/components/glass/`; no quedan `src/context/` ni `src/components/` viejos.
- [ ] `HomeStack` (native-stack) con rutas `HomeMain`, `ListConfig`, `ItemDetail`; header propio por pantalla.
- [ ] `ProfileStack` (native-stack) con rutas `ProfileMain`, `Login`, `SignUp`, `AccountSettings`, `PaymentSettings`; header propio.
- [ ] `AppTabs` reemplaza a `BottomTabs`: tabs `headerShown:false`, `Historial`→HomeStack, `Buscar`→SearchScreen (con header a nivel tab), `Perfil`→ProfileStack; iconos y estilos de tab conservados; `initialRouteName:'Buscar'`.
- [ ] Param lists co-locadas por feature; `src/navigation/types.ts` compone `AppTabsParamList` y declara `RootParamList` (tipado global de `useNavigation`).
- [ ] `ItemDetail` recibe y usa `route.params.itemId: string`.
- [ ] `tsc --noEmit` pasa sin errores.
- [ ] En la app: navegar `HomeMain`→`ListConfig`→`ItemDetail` y volver; entrar a las 4 sub-pantallas de Perfil y volver; Search funciona igual; glass y `useSearch()` operativos.
- [ ] `App.tsx` importa `AppTabs` y `SearchProvider` desde las nuevas rutas; `BottomTabs.tsx` viejo eliminado.

## Decisiones tomadas y descartadas

- **Clean architecture feature-first** (vs feature-modular plano, vs layer-first global): el usuario replanteó a clean-arch completa; feature-first mantiene el límite por feature y coloca las 3 capas juntas, escalando mejor que layer-first disperso.
- **domain/data vacías con convención** (vs stubs de ejemplo, vs solo presentation): este spec no tiene lógica ni datos en scope; se crean las carpetas con `index.ts` documentando la convención para fijar el patrón, sin entidades/casos de uso ficticios que luego se descartarían.
- **Login/SignUp dentro de `ProfileStack`** (vs gate raíz auth-vs-app): decisión explícita del usuario; sin protección de rutas ni sesión — auth real es otro spec.
- **`@react-navigation/native-stack`** (vs `@react-navigation/stack` JS): stack nativo por performance y back gesture nativo; usuario lo instala, spec solo configura.
- **Search sin stack ni domain/data** (solo `presentation/screens`): el usuario confirmó una sola pantalla sin nada que añadir; se evita ceremonia innecesaria. Header servido a nivel de tab.
- **Código compartido en `src/shared/`** (`SearchContext`, glass): son cross-feature; no pertenecen a ninguna feature. `SearchContext` explícitamente fuera de la feature `search`.
- **Param lists co-locadas por feature + compuestas en raíz** (vs archivo central único): cada feature es dueña de sus rutas; `src/navigation/types.ts` solo compone y declara `RootParamList`.
- **Sin persistencia / deep linking** (fuera de scope): la navegación es andamiaje; sesión y linking se abordan cuando exista auth/contenido real.

## Riesgos identificados y plan de mitigación

| # | Riesgo | Mitigación |
|---|--------|-----------|
| R1 | Refactor de imports amplio (mover `SearchContext`/glass a `shared/`, renombrar screens) rompe el build | `tsc --noEmit` tras cada paso del plan; el movimiento a `shared/` (paso 2) se hace y valida antes de crear features; borrar carpetas viejas solo tras `tsc` verde. |
| R2 | La API de `@react-navigation/native-stack` difiere en RN Nav 7 | Instalar `^7`, validar peer contra `@react-navigation/native ^7.3.x`; leer los `.d.ts` instalados + docs v57/RN Nav 7 antes de escribir `HomeStack`/`ProfileStack` (no confiar en memoria, per CLAUDE.md). |
| R3 | Header duplicado o ausente en Search (tab header + stack) | Tabs `screenOptions.headerShown:false` global; Search fija `options={{ headerShown:true }}` solo en su `Tab.Screen`; stacks manejan su propio header. El criterio de aceptación verifica el header de Search explícitamente. |
| R4 | `declare global RootParamList` mal hecho rompe el tipado de `useNavigation` en toda la app | Un único `declare global` en `src/navigation/types.ts`; validar con navegación tipada real en placeholders (paso 10) + `tsc`. |
| R5 | Carpetas domain/data vacías percibidas como muertas o mal llenadas | `index.ts` con comentario de convención + `export {}` en cada `domain/`/`data/`; convención documentada también en la sección Data model. |

**Mitigaciones transversales:**

- No hay test runner ni linter → `tsc --noEmit` es la única verificación automática; por eso se corre tras cada paso.
- `spec-impl` crea branch `spec-NN-slug` (AutoCreateBranch:true) → rollback trivial si algo se rompe.
- Verificación manual final en la app (navegación ida/vuelta, headers, back gesture) cubre lo que `tsc` no ve.
