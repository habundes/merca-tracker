# Android — Material Design 3

## Header

- **Estado:** Aprobado
- **Dependencias:** spec 01 (sistema `GlassView`/`GlassCard`/`GlassButton`/`GlassHeader`), spec 05 (tema `useTheme()` con light/dark/system), spec 09 (rediseño Buscar).
- **Fecha:** 2026-08-05
- **Objetivo (una frase):** Implementar la capa de diseño **Material Design 3 solo para Android** con paridad visual respecto al Liquid Glass ya existente en iOS, mediante componentes MD3 dedicados y una capa adaptativa que elige glass (iOS) vs MD3 (Android), sin tocar iOS ni la lógica de negocio.

## Contexto

`docs/ux_spec.md` describe dos sistemas de diseño paralelos: **iOS — Liquid Glass** (implementado vía `expo-glass-effect` y `src/shared/components/glass/`) y **Android — Material Design 3**. Hoy la capa Android MD3 está **sin implementar**: no hay librería Material, ni ramas `Platform.OS === 'android'` de estilo, ni ripple, ni tokens MD3, ni NavigationBar con indicator pill, ni OutlinedTextField, ni ElevatedCard. En Android todo cae al fallback plano de `GlassView` (un `<View>` con `bgSecondary` + `border`), además con una paleta de colores derivada de iOS.

Este spec da paridad visual en Android con lo que iOS ya tiene. iOS no se toca.

## Scope

**Incluye:**

1. **Tokens MD3 aditivos** en `ThemeColors` (`ThemeContext.tsx`): `surface`, `surfaceVariant`, `outline`, `primaryContainer`, `onPrimaryContainer`, `elevationTint`. Aditivos — no rompen glass ni los tokens iOS actuales, y se agregan a `lightColors` y `darkColors`.
2. **Componentes MD3** en `src/shared/components/md3/`, espejando la API de `glass/`:
   - `MaterialSurface` (base themed, equivalente a `GlassView`)
   - `MaterialCard` (ElevatedCard: `elevation`, radio 16dp, surface tint)
   - `MaterialButton` (filled/tonal con `android_ripple`, radio full)
   - `MaterialHeader` (título alineado a la izquierda, estilo MediumTopAppBar estático)
   - `MaterialTextField` (OutlinedTextField: outline 1dp, radio 28dp)
3. **Capa adaptativa** `src/shared/components/adaptive/`: exporta `Surface`/`Card`/`Button`/`Header`/`TextField` que resuelven `Platform.OS === 'android' ? MD3 : Glass`. Único punto que consumen las pantallas.
4. **Migrar consumidores** de `glass/` directo → capa adaptativa: `SearchUrlInput`, `SearchFeedback`, `TrackMain` y demás pantallas que hoy importan `glass`.
5. **Tab bar Android** (`app/(tabs)/_layout.tsx`): indicator pill en el tab activo + estilo NavigationBar MD3, con rama `Platform.OS === 'android'`. iOS conserva la barra actual.
6. **Ripple**: press feedback `android_ripple` en `MaterialButton` y en los `Pressable` táctiles clave (botón ✕, acciones), solo Android.

**No incluye (queda para otro spec):**

- Material You / color dinámico del wallpaper.
- Háptica nativa `VibrationEffect` (ni `expo-haptics`).
- `BottomSheet`, `Snackbar`, `FilledChip` nativos MD3.
- Componentes nativos `@expo/ui` (Jetpack Compose).
- `MediumTopAppBar` con scroll/colapso real (solo se aproxima el look estático).
- Rediseño de pantallas de auth/config aún no implementadas.

## Data model / Tipos

Sin datos ni persistencia nuevos. Solo se amplía el tipo del tema y se agregan interfaces de props espejando `glass/`.

```ts
// src/shared/context/ThemeContext.tsx — tokens MD3 aditivos
export type ThemeColors = {
  // ...tokens iOS existentes intactos (bg, bgSecondary, text, accent, danger, ...)
  surface: string;
  surfaceVariant: string;
  outline: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  elevationTint: string;
};

// src/shared/components/adaptive/index.ts — API estable consumida por pantallas
export { Surface, Card, Button, Header, TextField };
// Cada uno: Platform.OS === 'android' ? Material* : Glass*
```

## Implementation plan

Branch: `spec-10-android-material-design-3` (autocreada). Cada paso deja `npx tsc --noEmit` verde.

1. **Tokens MD3.** Ampliar `ThemeColors` y las dos paletas (`lightColors`, `darkColors`) con `surface`/`surfaceVariant`/`outline`/`primaryContainer`/`onPrimaryContainer`/`elevationTint`, con valores MD3 para light y dark. No modificar los tokens iOS existentes.
2. **`md3/` base.** Crear `src/shared/components/md3/MaterialSurface.tsx`: `View` themed con `surface` + `outline`, leyendo `useTheme()` igual que `GlassView`. Base de los demás.
3. **`md3/` componentes.** `MaterialCard` (elevation + radio 16dp + surface tint), `MaterialButton` (`Pressable` con `android_ripple` sobre `primaryContainer`, radio full), `MaterialHeader` (título alineado a la izquierda con color de tema explícito), `MaterialTextField` (outlined 1dp `outline`, radio 28dp). Barrel `md3/index.ts`.
4. **Capa adaptativa.** Crear `src/shared/components/adaptive/`. Cada componente resuelve glass vs md3 por `Platform.OS` (vía `Platform.select` o extensiones `.android.tsx`/`.ios.tsx`). Mantener nombres/props compatibles con la API de glass para migración sin cambios de call-site salvo el import.
5. **Migrar consumidores.** Cambiar imports de `../../shared/components/glass` → capa adaptativa en `SearchUrlInput`, `SearchFeedback` y `TrackMain`. iOS renderiza igual que hoy (glass); ningún screen importa `glass/` directo salvo la capa adaptativa.
6. **Tab bar Android.** En `app/(tabs)/_layout.tsx`, rama `Platform.OS === 'android'`: indicator pill (fondo `primaryContainer` redondeado tras el icono activo) + estilo NavigationBar. iOS sin cambios.
7. **Ripple.** Añadir `android_ripple` en `MaterialButton` y en los `Pressable` táctiles clave (botón ✕ del input, acciones de card).
8. **Verificación final** (ver sección Verificación).

## Acceptance criteria

- [ ] `ThemeColors` incluye tokens MD3 (`surface`, `surfaceVariant`, `outline`, `primaryContainer`, `onPrimaryContainer`, `elevationTint`) en light y dark; los tokens iOS existentes siguen intactos.
- [ ] Existe `src/shared/components/md3/` con `MaterialSurface`, `MaterialCard`, `MaterialButton`, `MaterialHeader`, `MaterialTextField` e `index.ts`.
- [ ] Existe `src/shared/components/adaptive/` que en Android renderiza los MD3 y en iOS los glass.
- [ ] Search y Track consumen la capa adaptativa; ningún screen importa `glass/` directamente salvo la propia capa adaptativa.
- [ ] En Android el tab activo muestra indicator pill; en iOS la tab bar queda igual que hoy.
- [ ] En Android el input de búsqueda se ve como OutlinedTextField (outline 1dp, esquinas redondeadas), cards con elevación, botones con ripple.
- [ ] `npx tsc --noEmit` sin errores nuevos.
- [ ] Alternar light/dark/system en Apariencia (spec-05) actualiza correctamente los colores MD3.
- [ ] iOS 26+ no cambia (glass idéntico a antes).

## Decisiones tomadas y descartadas

- **`md3/` separado + capa adaptativa (vs ramas dentro de `glass/`):** decisión del usuario de no meter MD3 en `glass/`; se aísla la lógica Material y se selecciona por plataforma en `adaptive/`.
- **Paridad visual pragmática (vs MD3 completo):** se excluyen Material You, háptica nativa, BottomSheet/Snackbar/FilledChip para acotar; quedan para specs futuros.
- **Sin Material You (vs color dinámico del wallpaper):** el tema es controlado (spec-05); el color dinámico rompería consistencia de marca y el flujo de tema actual.
- **Tokens MD3 aditivos (vs reemplazar la paleta iOS):** no romper iOS ni glass; los nuevos roles conviven con los existentes.

## Riesgos identificados

- **Migración de imports amplia:** varios archivos referencian glass; el cambio a la capa adaptativa debe mantener nombres/props para no tocar markup. Riesgo de romper llamadas si la API adaptativa no calca la de glass.
- **Sin dispositivo Android físico local:** verificación de ripple/elevation/pill depende del emulador o de la máquina del usuario.
- **`MediumTopAppBar` real (scroll/colapso) no se implementa:** solo se aproxima el look estático; el comportamiento nativo requeriría otro spec.
- **Fallback iOS<26:** con la capa adaptativa, iOS<26 seguirá en glass-fallback plano (no MD3), lo cual es correcto pero conviene documentarlo.

## Verificación end-to-end

1. `npx tsc --noEmit` → verde.
2. **Android (emulador o dispositivo):** abrir la app → tab bar muestra indicator pill en el tab activo; Buscar muestra OutlinedTextField; cards con elevación; botones con ripple al tocar. Alternar tema en Apariencia → colores MD3 responden.
3. **iOS 26+:** confirmar que Buscar/Track siguen mostrando Liquid Glass idéntico a antes (sin regresión).
4. **iOS <26 / fallback:** confirmar legibilidad en light y dark.
