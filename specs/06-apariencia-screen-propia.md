# Apariencia como screen propia

## Header

- **Estado:** Implementado
- **Dependencias:**
  - Spec `03` (Migración Expo Router) — Implementado. Provee `router.push` y layout de `profile` stack.
  - Spec `05` (Dark mode con toggle en Perfil) — Implementado. Provee `ThemeContext`, `useTheme`, `setMode`, tokens semánticos. Este spec **revierte** la decisión de spec 05 de mantener el toggle inline en `ProfileMain`.
  - Base: Expo SDK 57, React 19.2, RN 0.86, TS 6.
  - Sin dependencias npm nuevas.
- **Fecha:** 2026-08-04
- **Objetivo (una frase):** Extraer el segmentado "Apariencia" de `ProfileMain` a una screen dedicada en `/profile/appearance` (nueva `AppearanceSettings.tsx`), enlazada desde el bloque `demoNav` junto a "Ajustes de cuenta" y "Ajustes de pago", visible solo cuando `loggedIn`, con label de sección "Apariencia" arriba del segmentado.

## Scope

**Incluye:**

- **Nueva screen `AppearanceSettings`.** Archivo `src/features/profile/presentation/screens/AppearanceSettings.tsx`. Contenido:
  - Label de sección "Apariencia" (mismo estilo que `appearanceSectionTitle` actual).
  - Segmentado horizontal de 3 botones "Sistema" | "Claro" | "Oscuro" idéntico al actual (mismos tokens: activo `colors.accent` + `#ffffff`, inactivo `colors.bgTertiary` + `colors.text`, border `colors.border`).
  - Consume `useTheme()` para `mode`, `setMode`, `colors`.
  - `StyleSheet.create` dentro del componente envuelto en `useMemo(..., [colors])` (patrón spec 05).
  - Contenedor: `View` con `flex:1`, `backgroundColor: colors.bg`, padding horizontal 20, padding top 24.

- **Nueva ruta `app/(tabs)/profile/appearance.tsx`.** Re-export directo de `AppearanceSettings` (mismo patrón que `account.tsx` / `payment.tsx`).

- **Stack layout `app/(tabs)/profile/_layout.tsx`.** Añadir `<Stack.Screen name="appearance" options={{ title: 'Apariencia' }} />`.

- **Refactor `ProfileMain.tsx`:**
  - Eliminar constante `THEME_OPTIONS`, variable `appearanceToggle`, uso de `themeMode`/`setThemeMode` de `useTheme()`.
  - Eliminar estilos: `appearanceSection`, `appearanceSectionTitle`, `appearanceSegment`, `appearanceSegmentBtn`, `appearanceSegmentBtnActive`, `appearanceSegmentText`, `appearanceSegmentTextActive`.
  - Añadir tercer botón en `demoNav` (bajo "Ajustes de pago"): "Apariencia" → `router.push('/profile/appearance')`. Mismo estilo `demoNavBtn` / `demoNavText`.
  - Sigue visible solo cuando `loggedIn === true`.

**No incluye (queda para otro spec):**

- Renombrar `demoNav` a algo tipo "Ajustes".
- Cambiar la lógica de `loggedIn` o mover Apariencia fuera de esa rama.
- Icono al lado del texto del link.
- Añadir descripción/texto explicativo arriba del segmentado en la nueva screen.
- Animación de transición al cambiar de modo.
- Modificar el patrón del segmentado (iconos, layout vertical, etc.).
- Tocar la paleta o los tokens del `ThemeContext`.

## Data model / Tipos

Sin datos nuevos. Feature reutiliza `ThemeContext` existente (`ThemeMode`, `useTheme`, `setMode`) sin cambios. Persistencia sigue igual (`AsyncStorage` key `@merca-tracker/theme-preference`, gestionada por `ThemeProvider`). Sin tipos nuevos.

## Implementation plan

Cada paso deja árbol compilando (`npx tsc --noEmit`) y app arrancable. Branch: `spec-06-apariencia-screen-propia`.

1. **Crear `AppearanceSettings.tsx`.** Nuevo archivo `src/features/profile/presentation/screens/AppearanceSettings.tsx`. Copiar bloque `appearanceToggle` de `ProfileMain` (label + segmentado 3 botones) como componente standalone. Consumir `useTheme()` para `mode`, `setMode`, `colors`. `StyleSheet.create` dentro con `useMemo(..., [colors])`. Contenedor `View flex:1 bg:colors.bg pad:20/24`. `tsc` verde. Sin consumidores todavía.

2. **Crear ruta `app/(tabs)/profile/appearance.tsx`.** Re-export directo de `AppearanceSettings` (patrón `account.tsx`/`payment.tsx`). `tsc` verde.

3. **Registrar en stack.** `app/(tabs)/profile/_layout.tsx`: añadir `<Stack.Screen name="appearance" options={{ title: 'Apariencia' }} />`. Verificar que headerStyle/tint del stack se aplican (herencia de spec 05).

4. **Añadir link en `ProfileMain.demoNav`.** Insertar tercer `TouchableOpacity` bajo "Ajustes de pago": texto "Apariencia" → `router.push('/profile/appearance')`. Mismo `demoNavBtn` / `demoNavText`. Verificar navegación en ambos modos.

5. **Eliminar toggle inline de `ProfileMain`.**
   - Borrar constante `THEME_OPTIONS`.
   - Borrar `appearanceToggle` JSX y su uso en la rama `loggedIn`.
   - Borrar `themeMode` y `setThemeMode` del destructure de `useTheme()` (dejar solo `colors`).
   - Borrar estilos `appearanceSection`, `appearanceSectionTitle`, `appearanceSegment`, `appearanceSegmentBtn`, `appearanceSegmentBtnActive`, `appearanceSegmentText`, `appearanceSegmentTextActive`.
   - `tsc` verde.

6. **Verificación manual:**
   - Login → `ProfileMain` muestra "Ajustes de cuenta", "Ajustes de pago", "Apariencia" (nuevo).
   - Tap "Apariencia" → navega a screen con header "Apariencia" + botón back.
   - En la screen: 3 botones segmentados; tap cambia tema en vivo (toda la app se re-tinta al volver).
   - Kill + relaunch → preferencia persiste.
   - Sin sesión (login/signup) → link "Apariencia" no visible.
   - Verificar en light y dark: header, background, botones legibles.

7. **Grep de residuos.** `grep -RIn "appearanceSegment\|appearanceSection\|THEME_OPTIONS" src app` → resultados solo en `AppearanceSettings.tsx`. `grep -RIn "'#[0-9a-fA-F]{3,8}'" src app` → sin nuevas fugas fuera de `ThemeContext.tsx` y `#ffffff` del texto activo (ahora en `AppearanceSettings.tsx`).

## Acceptance criteria

- [x] Existe `src/features/profile/presentation/screens/AppearanceSettings.tsx` que exporta `default` un componente funcional.
- [x] `AppearanceSettings` consume `useTheme()` (`mode`, `setMode`, `colors`), renderiza label "Apariencia" + segmentado horizontal de 3 botones ("Sistema" | "Claro" | "Oscuro"); activo `colors.accent` + texto `#ffffff`; inactivo `colors.bgTertiary` + `colors.text`; border `colors.border`. Tap dispara `setMode(...)`.
- [x] `StyleSheet.create` de `AppearanceSettings` está envuelto en `useMemo(() => StyleSheet.create({...}), [colors])`. Sin literales de color hex/`rgb`/`rgba` fuera de `#ffffff` del texto activo.
- [x] Existe `app/(tabs)/profile/appearance.tsx` que re-exporta `AppearanceSettings` (patrón `account.tsx`).
- [x] `app/(tabs)/profile/_layout.tsx` declara `<Stack.Screen name="appearance" options={{ title: 'Apariencia' }} />`.
- [x] `ProfileMain.tsx` renderiza en la rama `loggedIn` un `TouchableOpacity` con texto "Apariencia" dentro del bloque `demoNav`, bajo "Ajustes de pago", que hace `router.push('/profile/appearance')`. Mismo estilo `demoNavBtn` / `demoNavText`.
- [x] `ProfileMain.tsx` **no** contiene ya: constante `THEME_OPTIONS`, variable `appearanceToggle`, `themeMode`/`setThemeMode` en el destructure de `useTheme()`, ni los estilos `appearanceSection`, `appearanceSectionTitle`, `appearanceSegment`, `appearanceSegmentBtn`, `appearanceSegmentBtnActive`, `appearanceSegmentText`, `appearanceSegmentTextActive`.
- [x] `grep -RIn "appearanceSegment\|appearanceSection\|THEME_OPTIONS" src app` devuelve resultados **solo** en `AppearanceSettings.tsx`.
- [x] En login/signup (sin `loggedIn`) el link "Apariencia" no es alcanzable desde `ProfileMain`.
- [x] `npx tsc --noEmit` pasa sin errores.
- [ ] Verificación manual: tap en "Apariencia" navega a la screen; los 3 botones cambian el tema en vivo; header de la screen dice "Apariencia" y respeta light/dark; preferencia persiste tras relaunch.

## Decisiones tomadas y descartadas

- **Screen dedicada `/profile/appearance`** (vs mantener toggle inline en `ProfileMain`, vs modal/action-sheet). Elegido: consistencia con "Ajustes de cuenta" y "Ajustes de pago" que ya son screens propias; reduce ruido en `ProfileMain`. Revierte decisión de spec 05 que descartó screen dedicada por "no justificar screen propia" — ahora sí se justifica por consistencia visual con el resto del bloque.

- **Link dentro de `demoNav` junto a los otros dos** (vs sección "Apariencia" separada arriba, vs renombrar `demoNav` a "Ajustes"). Elegido: mismo patrón visual, mínima diferencia con el estado actual, sin renombrar bloques.

- **Link visible solo cuando `loggedIn`** (vs siempre visible incluso en login/signup). Elegido: preserva comportamiento previo (el toggle antiguo ya era solo `loggedIn`); mantiene la rama de auth "limpia" sin controles de configuración. Contra: usuario sin sesión no puede cambiar tema; aceptable — el default `system` cubre el caso.

- **Contenido mínimo en la nueva screen (label + segmentado)** (vs añadir descripción explicativa "Elige cómo se ve la app", vs previews de light/dark). Elegido: paridad exacta con el toggle actual; sin fricción ni scope creep.

- **Reutilizar `ThemeContext` sin cambios** (vs añadir hook derivado tipo `useThemeMode()`). Elegido: `useTheme()` ya expone `mode`/`setMode`; no aporta abstraer.

- **Sin icono en el link "Apariencia"** (vs añadir Ionicon al lado del texto). Elegido: los otros dos links de `demoNav` tampoco tienen icono; consistencia gana.

- **Título del header "Apariencia"** (vs "Tema", vs "Ajustes de apariencia"). Elegido: coincide con el label ya usado en `ProfileMain` y con el texto del link; menos strings que mantener.

- **Ruta `appearance` en inglés** (vs `apariencia` en español). Elegido: alinea con `account` y `payment` (también en inglés). Los strings visibles siguen en español; solo el path es en inglés.

## Riesgos identificados y plan de mitigación

| # | Riesgo | Mitigación |
|---|---|---|
| R1 | Tipado estricto de `router.push('/profile/appearance')` falla porque expo-router no reconoce la ruta hasta que existe el archivo | Crear `app/(tabs)/profile/appearance.tsx` **antes** de añadir el `router.push` en `ProfileMain` (orden del Implementation plan lo garantiza: paso 2 antes de paso 4). |
| R2 | Header de la nueva screen no aplica tokens (light/dark) porque `screenOptions` del stack no cubre la ruta nueva | `_layout.tsx` de `profile` ya define `screenOptions` con `useTheme()` (spec 05); nueva `<Stack.Screen name="appearance" />` hereda. Verificar en la matriz manual con OS en dark. |
| R3 | Eliminar `themeMode`/`setThemeMode` del destructure de `useTheme()` en `ProfileMain` deja `useTheme` importado pero solo se usa `colors` — sin problema, pero fácil olvidar el import si más tarde se borra `colors` | Solo se limpia lo listado en el paso 5; `colors` sigue siendo consumido por todo el bloque de estilos. Sin acción adicional. |
| R4 | Usuario con preferencia `dark`/`light` guardada bajo el segmentado antiguo pierde acceso a cambiarla si el link nuevo tiene bug de render | Preferencia sigue persistida en `AsyncStorage`; el peor caso es que quede fija en el modo previo. Reversible tocando `AsyncStorage` o reinstalando. Verificar link en Acceptance manual antes de merge. |
| R5 | `demoNav` con tres botones apila demasiado texto en pantallas pequeñas y descuadra el layout de `ProfileMain` | Los 3 `demoNavBtn` son verticales con `gap:8` (ya definido); añadir un tercero mantiene el patrón. Verificar en simulador iPhone SE. |
