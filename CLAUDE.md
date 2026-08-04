# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical constraint

Expo SDK is pinned to **57**. The API has changed vs older versions. Before writing native/Expo code, consult the exact versioned docs: https://docs.expo.dev/versions/v57.0.0/. Do not rely on training knowledge for Expo APIs — verify against the installed version.

Related pins to respect when adding code: React 19.2, React Native 0.86, TypeScript 6, React Navigation 7.

## Architecture

Single-package Expo app using **Expo Router** (file-based routing, spec-03). Entry: `app.json` (plugins: `expo-router`) → `app/_layout.tsx` (root layout with `SearchProvider` + `StatusBar`) → `app/(tabs)/_layout.tsx` (bottom tabs navigator) → three tab groups (`lista`, `buscar`, `perfil`), initial route `buscar`.

**Key layout:**

- `app/` — Expo Router file structure. `_layout.tsx` at each level defines navigation structure. No manual `NavigationContainer` — router handles it.
  - `app/_layout.tsx` — root. Wraps `SearchProvider`, sets `StatusBar`, declares root `<Stack>` with `headerShown:false`.
  - `app/(tabs)/` — route group. Contains `_layout.tsx` with bottom `<Tabs>` navigator (three screens: `lista`, `buscar`, `perfil`), icons via `@expo/vector-icons` Ionicons.
  - `app/(tabs)/lista/`, `app/(tabs)/buscar/`, `app/(tabs)/perfil/` — tab folders with `_layout.tsx` (per-tab `<Stack>`) and `.tsx` files (routes). Dynamic routes use `[param].tsx` syntax (e.g., `app/(tabs)/lista/[itemId].tsx`).
  - `app/(tabs)/lista/index.tsx`, `app/(tabs)/buscar/index.tsx`, `app/(tabs)/perfil/index.tsx` — re-export screen components from `src/features/*/presentation/screens/`.

- `src/` — Feature logic (feature-driven).
  - `context/` — React Context providers. `SearchContext` holds URL search history (in-memory only, not persisted) and is the app-wide state layer. Any screen needing history uses `useSearch()`.
  - `features/*/presentation/screens/` — screen components. Use `router.push()` (from `expo-router`) instead of `navigation.navigate()`. Dynamic params via `useLocalSearchParams<{param: type}>()` (not `route.params`).
  - `components/glass/` — Liquid Glass component system (iOS 26+, spec `01`). `GlassView` is the base wrapper; it checks `isLiquidGlassAvailable()` from `expo-glass-effect` and falls through to a plain `<View>` on Android, Web, and iOS <26. `GlassCard`, `GlassButton`, `GlassHeader` all compose `GlassView` — never import from `expo-glass-effect` directly in screens; use the wrappers so the passthrough behavior is preserved everywhere.

**Router usage:**
- Push route (object syntax for typed params): `router.push({ pathname: '/lista/[itemId]', params: { itemId: item } })`.
- Get route params: `const { itemId } = useLocalSearchParams<{ itemId: string }>()`.
- React Navigation (@react-navigation/*) is uninstalled; all navigation goes through Expo Router.

## Spec-driven workflow

Features are defined in `specs/NN-slug.md` before implementation. `.spec-config.yml` sets `AutoCreateBranch: true` — `/spec-impl` creates a `spec-NN-slug` branch automatically. Spec states progress: `Borrador` → `Aprobado` → `Implementado`. Only `Aprobado` specs may be implemented. Do not modify a spec's scope during implementation — surface ambiguities and ask instead.

## Language

User-facing strings and commit messages are in Spanish. Code identifiers stay in English.
