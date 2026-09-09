## Critical constraint

Expo SDK is pinned to **57**. The API has changed vs older versions. Before writing native/Expo code, consult the exact versioned docs: https://docs.expo.dev/versions/v57.0.0/. Do not rely on training knowledge for Expo APIs — verify against the installed version.

Related pins to respect when adding code: React 19.2, React Native 0.86, TypeScript 6, Expo Router. **New Architecture** is on (required by Reanimated 4 / gesture-handler; do not disable in `app.json`).

Package manager is **pnpm** (migrated spec-16). Lockfile: `pnpm-lock.yaml`. Do not run `npm`/`yarn` or generate `package-lock.json`. Install native deps with `npx expo install`.

## Architecture

Single-package Expo app using **Expo Router** (file-based routing, spec-03). Entry: `app.json` (plugins: `expo-router`) → `app/_layout.tsx` (root: `GestureHandlerRootView` > `AuthProvider` > `ThemeProvider` > `SearchProvider` > `StatusBar` + `<Stack>`; `AuthProvider` va por fuera porque `ThemeProvider` consulta la sesión) → `app/(tabs)/_layout.tsx` (`NativeTabs`) → three tab groups (`track`, `search`, `profile`, renamed in spec-04), anchor route `search`. Sibling group `app/(auth)/` holds the welcome/sign-up/sign-in screens (spec-20) — no route gating: `app/index.tsx` still redirects to `/search`.

**Key layout:**

- `app/` — Expo Router file structure. `_layout.tsx` at each level defines navigation. No manual `NavigationContainer`.
  - `app/_layout.tsx` — `<GestureHandlerRootView>` (spec-16) wrapping root providers + root `<Stack>` with `headerShown:false`.
  - `app/(tabs)/_layout.tsx` — `NativeTabs` from `expo-router/unstable-native-tabs` (native bar: Liquid Glass iOS 26+, Material 3 Android). Per trigger: `sf` SF Symbol on iOS (outline/fill pairs, e.g. `tray.full`/`tray.full.fill`, spec-14), `md` icon on Android; `disableIndicator`; colors from `useTheme()` via `DynamicColorIOS` (spec-05). No `role="search"` (breaks Spanish label — see memory).
  - `app/(tabs)/track/` — `index.tsx`, dynamic `[itemId].tsx`, `config.tsx`.
  - `app/(tabs)/search.tsx` — single-file route.
  - `app/(tabs)/profile/` — `index.tsx`, `account.tsx`, `payment.tsx`, `appearance.tsx` (spec-06). Each `.tsx` re-exports a screen from `src/features/profile/presentation/screens/`. Renamed "Ajustes" → "Configuración" (spec-07). `ProfileMain` no longer holds a login form: without a session it shows a CTA to `/welcome` (spec-20).
  - `app/(auth)/` — `welcome.tsx`, `signup.tsx`, `login.tsx` + `_layout.tsx` (spec-20). Sibling of `(tabs)`, so the tab bar is hidden during auth; `welcome` is header-less, the forms get a header via `stackScreenOptions`.

- `src/` — Feature logic.
  - `shared/context/` — React Context providers. `SearchContext` holds in-memory URL search history (`useSearch()`). `AuthContext` holds the **in-memory only** auth session (`useAuth()`: `session`/`isAuthenticated`/`signIn`/`signOut`); it is a stub for spec-20 — no AsyncStorage/SecureStore, no provider SDK, lost on app close. `ThemeContext` provides `mode` (`light`/`dark`/`system`), `setMode`, resolved `colors`, `effectiveScheme`, `isHydrated` and `canChangeTheme`; mode persisted via AsyncStorage (spec-05). **The theme belongs to the account (spec-20):** with no session `canChangeTheme` is `false`, `setMode` is a no-op and the app follows the OS scheme; the stored mode re-applies on sign-in. The real OS scheme is captured at module load (`initialSystemScheme`) because `Appearance.setColorScheme` makes the forced value the one `Appearance` reports back. `ThemeColors` carries additive MD3 tokens (`surface`, `outline`, `primaryContainer`, `elevationTint`, …) alongside the iOS tokens (spec-10).
  - `features/{track,search,profile,list,auth}/presentation/screens/` — screens use `router.push()` and `useLocalSearchParams<{param: type}>()`.
  - **Auth (spec-20, UI only):** `features/auth/` mirrors `features/search`' layering. `domain/` has the `AuthRepository` port + pure `validateEmail`/`validatePassword` + `AuthError`/`AUTH_ERROR_MESSAGES` (Spanish copy); `data/fakeAuthDataSource.ts` is the stub (900 ms delay; `noexiste@demo.mx`, password `incorrecta`, `existe@demo.mx`, `FORCE_PROVIDER_ERROR` trigger each error state). Screens never import the data source — `useAuthForm(mode, repo)` injects it. Swapping in a real provider (Clerk, per `docs/`) means replacing the data source only.
  - **Adaptive design layer (spec-10):** `shared/components/adaptive/` is the only design-component entry point screens import — exports `Surface`/`Card`/`TextField`, resolving `Platform.OS === 'android'` → MD3 else Glass. Do **not** import `glass/` or `md3/` directly in screens.
    - `shared/components/glass/` — Liquid Glass (iOS 26+, spec-01). `GlassView` checks `isLiquidGlassAvailable()` from `expo-glass-effect`, falls back to plain `<View>` on Android/Web/iOS<26. `GlassCard` composes it. Never import `expo-glass-effect` outside `glass/`.
    - `shared/components/md3/` — Material Design 3 for Android (`MaterialSurface`/`MaterialCard`/`MaterialTextField`): themed surfaces, elevation, `android_ripple`, outlined field.
    - There is **no shared Button or Header component** in either folder (and none exported from `adaptive/`). Buttons are built per feature/screen with `Pressable` + `android_ripple` over theme tokens; `features/auth/.../components/AuthButton.tsx` (spec-20, variants filled/outline/social/link) is the closest thing to a reusable one — promote it to `adaptive/` if a second feature needs it.
  - **Gestures (spec-16/17):** `features/track/.../components/SwipeableTrackRow.tsx` wraps track rows with `ReanimatedSwipeable` (`react-native-gesture-handler`) — swipe reveals Check/Eliminar (right) and Configurar (left); light haptic on open (`expo-haptics`). Deletes confirm first (spec-17). Native deps (gesture-handler, reanimated, worklets, haptics) require a dev-client rebuild — not Expo Go.

**Router usage:**
- Push with typed params: `router.push({ pathname: '/track/[itemId]', params: { itemId: item } })`.
- Get route params: `const { itemId } = useLocalSearchParams<{ itemId: string }>()`.
- React Navigation (@react-navigation/*) is uninstalled; all navigation goes through Expo Router.

## Spec-driven workflow

Features are defined in `specs/NN-slug.md` before implementation. `.spec-config.yml` sets `AutoCreateBranch: true` — `/spec-impl` creates a `spec-NN-slug` branch automatically. Spec states progress: `Borrador` → `Aprobado` → `Implementado`. Only `Aprobado` specs may be implemented. Do not modify a spec's scope during implementation — surface ambiguities and ask instead.

## Language

User-facing strings and commit messages are in Spanish. Code identifiers stay in English.
