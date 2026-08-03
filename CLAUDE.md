# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical constraint

Expo SDK is pinned to **57**. The API has changed vs older versions. Before writing native/Expo code, consult the exact versioned docs: https://docs.expo.dev/versions/v57.0.0/. Do not rely on training knowledge for Expo APIs — verify against the installed version.

Related pins to respect when adding code: React 19.2, React Native 0.86, TypeScript 6, React Navigation 7.

## Commands

Run from this directory (`mobile-app/mobile-app/`):

```bash
npm start          # expo start (choose platform interactively)
npm run android    # expo start --android
npm run ios        # expo start --ios (requires macOS + Xcode Simulator)
npm run web        # expo start --web
npx tsc --noEmit   # type-check without emitting
```

No test runner, linter, or formatter is configured. Type-check is the only automated verification. If iOS Simulator fails to launch via `osascript` on macOS, grant Terminal → System Events permission under Privacy → Automation, or open Simulator manually first.

## Architecture

Single-package Expo app. Entry: `index.ts` → `App.tsx` → `SearchProvider` → `NavigationContainer` → `BottomTabs`.

Key layout under `src/`:

- `context/` — React Context providers. `SearchContext` holds the URL search history (in-memory only, not persisted) and is the app-wide state layer. Any screen needing history uses `useSearch()`.
- `navigation/BottomTabs.tsx` — the only navigator. Three tabs (`Historial`, `Buscar`, `Perfil`), initial route `Buscar`. Icons via `@expo/vector-icons` Ionicons. Tab styling is hardcoded here.
- `screens/` — one file per tab. Screens consume `useSearch()` for shared state.
- `components/glass/` — Liquid Glass component system (iOS 26+, spec `01`). `GlassView` is the base wrapper; it checks `isLiquidGlassAvailable()` from `expo-glass-effect` and falls through to a plain `<View>` on Android, Web, and iOS <26. `GlassCard`, `GlassButton`, `GlassHeader` all compose `GlassView` — never import from `expo-glass-effect` directly in screens; use the wrappers so the passthrough behavior is preserved everywhere.

## Spec-driven workflow

Features are defined in `specs/NN-slug.md` before implementation. `.spec-config.yml` sets `AutoCreateBranch: true` — `/spec-impl` creates a `spec-NN-slug` branch automatically. Spec states progress: `Borrador` → `Aprobado` → `Implementado`. Only `Aprobado` specs may be implemented. Do not modify a spec's scope during implementation — surface ambiguities and ask instead.

## Language

User-facing strings and commit messages are in Spanish. Code identifiers stay in English.
