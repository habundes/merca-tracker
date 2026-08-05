## Critical constraint

Expo SDK is pinned to **57**. The API has changed vs older versions. Before writing native/Expo code, consult the exact versioned docs: https://docs.expo.dev/versions/v57.0.0/. Do not rely on training knowledge for Expo APIs — verify against the installed version.

Related pins to respect when adding code: React 19.2, React Native 0.86, TypeScript 6, Expo Router.

## Architecture

Single-package Expo app using **Expo Router** (file-based routing, spec-03). Entry: `app.json` (plugins: `expo-router`) → `app/_layout.tsx` (root: `ThemeProvider` > `SearchProvider` > `StatusBar` + `<Stack>`) → `app/(tabs)/_layout.tsx` (bottom tabs) → three tab groups (`track`, `search`, `profile`, renamed in spec-04), initial route `search`.

**Key layout:**

- `app/` — Expo Router file structure. `_layout.tsx` at each level defines navigation. No manual `NavigationContainer`.
  - `app/_layout.tsx` — root providers + root `<Stack>` with `headerShown:false`.
  - `app/(tabs)/_layout.tsx` — bottom `<Tabs>` (`track`, `search`, `profile`), Ionicons, colors from `useTheme()` (spec-05).
  - `app/(tabs)/track/` — `index.tsx`, dynamic `[itemId].tsx`, `config.tsx`.
  - `app/(tabs)/search.tsx` — single-file route.
  - `app/(tabs)/profile/` — `index.tsx`, `account.tsx`, `payment.tsx`, `appearance.tsx` (spec-06). Each `.tsx` re-exports a screen from `src/features/profile/presentation/screens/`. Renamed "Ajustes" → "Configuración" (spec-07).

- `src/` — Feature logic.
  - `shared/context/` — React Context providers. `SearchContext` holds in-memory URL search history (`useSearch()`). `ThemeContext` provides `mode` (`light`/`dark`/`system`), `setMode`, resolved `colors`, and `isHydrated`; mode persisted via AsyncStorage (spec-05).
  - `features/{track,search,profile,list}/presentation/screens/` — screens use `router.push()` and `useLocalSearchParams<{param: type}>()`.
  - `shared/components/glass/` — Liquid Glass system (iOS 26+, spec-01). `GlassView` base wrapper checks `isLiquidGlassAvailable()` from `expo-glass-effect`, falls through to plain `<View>` on Android/Web/iOS<26. `GlassCard`, `GlassButton`, `GlassHeader` compose `GlassView`; passes explicit `colorScheme` to the native material. Never import `expo-glass-effect` directly in screens.

**Router usage:**
- Push with typed params: `router.push({ pathname: '/track/[itemId]', params: { itemId: item } })`.
- Get route params: `const { itemId } = useLocalSearchParams<{ itemId: string }>()`.
- React Navigation (@react-navigation/*) is uninstalled; all navigation goes through Expo Router.

## Spec-driven workflow

Features are defined in `specs/NN-slug.md` before implementation. `.spec-config.yml` sets `AutoCreateBranch: true` — `/spec-impl` creates a `spec-NN-slug` branch automatically. Spec states progress: `Borrador` → `Aprobado` → `Implementado`. Only `Aprobado` specs may be implemented. Do not modify a spec's scope during implementation — surface ambiguities and ask instead.

## Language

User-facing strings and commit messages are in Spanish. Code identifiers stay in English.
