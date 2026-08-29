## Critical constraint

Expo SDK is pinned to **57**. The API has changed vs older versions. Before writing native/Expo code, consult the exact versioned docs: https://docs.expo.dev/versions/v57.0.0/. Do not rely on training knowledge for Expo APIs — verify against the installed version.

Related pins to respect when adding code: React 19.2, React Native 0.86, TypeScript 6, Expo Router. **New Architecture** is on (required by Reanimated 4 / gesture-handler; do not disable in `app.json`).

Package manager is **pnpm** (migrated spec-16). Lockfile: `pnpm-lock.yaml`. Do not run `npm`/`yarn` or generate `package-lock.json`. Install native deps with `npx expo install`.

## Architecture

Single-package Expo app using **Expo Router** (file-based routing, spec-03). Entry: `app.json` (plugins: `expo-router`) → `app/_layout.tsx` (root: `GestureHandlerRootView` > `ThemeProvider` > `SearchProvider` > `StatusBar` + `<Stack>`) → `app/(tabs)/_layout.tsx` (`NativeTabs`) → three tab groups (`track`, `search`, `profile`, renamed in spec-04), anchor route `search`.

**Key layout:**

- `app/` — Expo Router file structure. `_layout.tsx` at each level defines navigation. No manual `NavigationContainer`.
  - `app/_layout.tsx` — `<GestureHandlerRootView>` (spec-16) wrapping root providers + root `<Stack>` with `headerShown:false`.
  - `app/(tabs)/_layout.tsx` — `NativeTabs` from `expo-router/unstable-native-tabs` (native bar: Liquid Glass iOS 26+, Material 3 Android). Per trigger: `sf` SF Symbol on iOS (outline/fill pairs, e.g. `tray.full`/`tray.full.fill`, spec-14), `md` icon on Android; `disableIndicator`; colors from `useTheme()` via `DynamicColorIOS` (spec-05). No `role="search"` (breaks Spanish label — see memory).
  - `app/(tabs)/track/` — `index.tsx`, dynamic `[itemId].tsx`, `config.tsx`.
  - `app/(tabs)/search.tsx` — single-file route.
  - `app/(tabs)/profile/` — `index.tsx`, `account.tsx`, `payment.tsx`, `appearance.tsx` (spec-06). Each `.tsx` re-exports a screen from `src/features/profile/presentation/screens/`. Renamed "Ajustes" → "Configuración" (spec-07).

- `src/` — Feature logic.
  - `shared/context/` — React Context providers. `SearchContext` holds in-memory URL search history (`useSearch()`). `ThemeContext` provides `mode` (`light`/`dark`/`system`), `setMode`, resolved `colors`, `effectiveScheme`, and `isHydrated`; mode persisted via AsyncStorage (spec-05). `ThemeColors` carries additive MD3 tokens (`surface`, `outline`, `primaryContainer`, `elevationTint`, …) alongside the iOS tokens (spec-10).
  - `features/{track,search,profile,list}/presentation/screens/` — screens use `router.push()` and `useLocalSearchParams<{param: type}>()`.
  - **Adaptive design layer (spec-10):** `shared/components/adaptive/` is the only design-component entry point screens import — exports `Surface`/`Card`/`TextField`, resolving `Platform.OS === 'android'` → MD3 else Glass. Do **not** import `glass/` or `md3/` directly in screens.
    - `shared/components/glass/` — Liquid Glass (iOS 26+, spec-01). `GlassView` checks `isLiquidGlassAvailable()` from `expo-glass-effect`, falls back to plain `<View>` on Android/Web/iOS<26. `GlassCard`/`GlassButton`/`GlassHeader` compose it. Never import `expo-glass-effect` outside `glass/`.
    - `shared/components/md3/` — Material Design 3 for Android (`MaterialSurface`/`MaterialCard`/`MaterialTextField`/`MaterialButton`/`MaterialHeader`): themed surfaces, elevation, `android_ripple`, outlined field.
  - **Gestures (spec-16/17):** `features/track/.../components/SwipeableTrackRow.tsx` wraps track rows with `ReanimatedSwipeable` (`react-native-gesture-handler`) — swipe reveals Check/Eliminar (right) and Configurar (left); light haptic on open (`expo-haptics`). Deletes confirm first (spec-17). Native deps (gesture-handler, reanimated, worklets, haptics) require a dev-client rebuild — not Expo Go.

**Router usage:**
- Push with typed params: `router.push({ pathname: '/track/[itemId]', params: { itemId: item } })`.
- Get route params: `const { itemId } = useLocalSearchParams<{ itemId: string }>()`.
- React Navigation (@react-navigation/*) is uninstalled; all navigation goes through Expo Router.

## Spec-driven workflow

Features are defined in `specs/NN-slug.md` before implementation. `.spec-config.yml` sets `AutoCreateBranch: true` — `/spec-impl` creates a `spec-NN-slug` branch automatically. Spec states progress: `Borrador` → `Aprobado` → `Implementado`. Only `Aprobado` specs may be implemented. Do not modify a spec's scope during implementation — surface ambiguities and ask instead.

## Language

User-facing strings and commit messages are in Spanish. Code identifiers stay in English.
