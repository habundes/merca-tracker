# Mejoras y fixes — revisión del proyecto

## Header

- **Estado:** Implementado
- **Dependencias:** spec 01 (sistema `glass/`), spec 05 (`ThemeContext` light/dark/system), spec 09 (rediseño Buscar), spec 10 (capa adaptativa + MD3). Toca `SearchContext`, `ThemeContext`, `GlassView`, `SearchScreen`, pantallas y `app/(tabs)/_layout.tsx`.
- **Fecha:** 2026-08-21
- **Objetivo (una frase):** Corregir tres bugs reales de robustez y aplicar mejoras incrementales de rendimiento, duplicación e higiene detectadas en la revisión del proyecto, sin cambiar comportamiento visible ni alcance de producto.

## Contexto

Revisión general del proyecto para detectar mejoras. La base está sana: pins alineados
(Expo 57, RN 0.86, React 19.2, TS 6 `strict`), sin `any`/`@ts-ignore`/`TODO` en `src`,
navegación limpia y `ThemeContext` bien memoizado con hidratación. La revisión encontró
tres bugs reales de robustez, varias oportunidades de rendimiento y una cantidad
acotada de duplicación y código muerto. Este spec agrupa lo accionable de bajo riesgo.
Lo que requiere decisión de producto o infra mayor queda listado en "No incluye".

## Scope

**Incluye:**

### A. Bugs reales (prioridad alta)

1. **`ThemeContext` sin manejo de error de AsyncStorage** (`src/shared/context/ThemeContext.tsx:86`). `getItem(...).then(...)` no tiene `.catch`; si la lectura rechaza, `isHydrated` queda `false` para siempre y todos los consumidores quedan atrapados en colores de fallback. `setMode` (`:121`) hace `setItem` sin `catch`. Fix: `.catch` que ponga `isHydrated=true` igualmente; envolver el `setItem`.
2. **`GlassView` fallback: `borderColor` sin `borderWidth`** (`src/shared/components/glass/GlassView.tsx:31`). El borde nunca se pinta salvo que el llamador aporte width (la card vacía de `TrackMain` no lo hace). Fix: `borderWidth: StyleSheet.hairlineWidth`.
3. **`setTimeout` sin limpiar en `SearchScreen`** (`src/features/search/presentation/screens/SearchScreen.tsx:60`). Timer de reset de 2500ms no se cancela; posible `setState` tras desmontar. Fix: guardar id y limpiar en cleanup / al reenviar.

### B. Rendimiento (prioridad media)

4. **`SearchContext` recrea `value` y handlers cada render** (`src/shared/context/SearchContext.tsx:20-31`). Sin `useMemo`/`useCallback`; identidad del context cambia siempre → `TrackMain` y `SearchScreen` re-renderizan de más. Fix: `useCallback` en los 3 handlers + `useMemo` en el value (espejo de `ThemeContext.tsx:127`).

### C. Duplicación (prioridad media)

5. **Hook `useThemedStyles(factory)`** para eliminar el patrón repetido en 8 archivos: `useMemo(() => StyleSheet.create({...}), [colors])` (`TrackMain`, `TrackConfig`, `ItemDetail`, `ProfileMain`, `AccountSettings`, `PaymentSettings`, `AppearanceSettings`, `app/+not-found.tsx`).
6. **Centralizar colores de fallback pre-hidratación.** Hex duplicados que sombrean `lightColors`/`darkColors` en `app/(tabs)/_layout.tsx:26,34,39` y `src/shared/navigation/stack-screen-options.ts:11-13`, con mezcla incoherente (fondo Android `#fef7ff` light + label inactivo `#8e8e93` dark). Fix: referenciar tokens de `ThemeContext`.
7. **Colapsar placeholders idénticos** `AccountSettings.tsx` y `PaymentSettings.tsx` (byte-a-byte iguales salvo el título) en una pantalla parametrizada.

### D. Código muerto / higiene (prioridad media-baja)

8. **Exports adaptativos sin uso.** `Button`/`Header` en `src/shared/components/adaptive/index.ts:29-30` no los consume ninguna pantalla → arrastran `GlassButton`, `GlassHeader`, `MaterialButton`, `MaterialHeader`. Eliminar (o cablear). Si se conserva `GlassHeader`, arreglar antes su texto sin color (`GlassHeader.tsx:23`, invisible en dark).
9. **Higiene de repo.** Borrar `errors/errors.txt` (log rancio de otra máquina/pnpm). En `app.json` name/slug genérico `mobile-app` → `merca-tracker`.
10. **Consistencia (regla CLAUDE.md: identificadores en inglés).** `app/(tabs)/profile/_layout.tsx:5` `PerfilLayout` → `ProfileLayout`. Mover `src/components/search/` bajo `src/features/search/presentation/components/` y usar alias `@/` en vez de `../../../../` (`SearchScreen.tsx:17`). Quitar prop `editable` sin uso en `SearchUrlInput`.

### E. Robustez de consistencia (prioridad baja)

11. **`useSearch` no lanza fuera de provider** (`SearchContext.tsx:10-15`), a diferencia de `useTheme` que sí lanza (`ThemeContext.tsx:137`). Unificar: hacer que lance.

**No incluye (requiere decisión aparte / otro spec):**

- **Persistir historial de búsqueda** en AsyncStorage — hoy es en memoria a propósito (CLAUDE.md). Requiere decisión de producto/spec.
- **Tooling/infra:** ESLint + Prettier, tests, CI, `ErrorBoundary`, accesibilidad base, safe-area. Bucket grande, decisión aparte.
- **Stubs vacíos / feature `list` fantasma** y deriva de docs (CLAUDE.md línea 17 describe `search.tsx` como archivo único; hoy es carpeta) — limpieza documental separada.
- Confirmar si el revert del commit `4f7d91f "revering change"` fue intencional.

## Data model / Tipos

Sin datos ni persistencia nuevos. El hook `useThemedStyles<T>(factory: (colors: ThemeColors) => T): T` vive en `src/shared/hooks/` y reutiliza `useTheme()`. La colapsada de placeholders usa una prop `title: string`.

## Implementation plan

Branch: `spec-11-mejoras-fixes` (autocreada). Cada paso deja `npx tsc --noEmit` verde.

1. **Bugs A.** `.catch` en `ThemeContext` (getItem + setMode); `borderWidth` en fallback de `GlassView`; limpiar `setTimeout` en `SearchScreen`.
2. **Rendimiento B.** `useCallback`/`useMemo` en `SearchContext`.
3. **Hook C5.** Crear `useThemedStyles` y migrar los 8 consumidores.
4. **Fallbacks C6.** Referenciar tokens de tema en `_layout.tsx` y `stack-screen-options.ts`.
5. **Placeholders C7.** Unificar Account/Payment en una pantalla parametrizada.
6. **Muerto/higiene D.** Quitar exports/componentes sin uso; borrar `errors/errors.txt`; corregir name/slug; renombrar `ProfileLayout`; mover `components/search/` y arreglar imports; quitar prop `editable`.
7. **Consistencia E11.** `useSearch` lanza fuera de provider.
8. **Verificación** (ver sección).

## Acceptance criteria

- [x] `ThemeContext.getItem` y `setMode` tienen `.catch`; un error de storage deja `isHydrated=true` (no atasca en fallback).
- [x] El fallback de `GlassView` pinta borde visible (la card vacía de `TrackMain` muestra borde).
- [x] `SearchScreen` no deja timers activos tras desmontar; sin warning de `setState` en desmontado.
- [x] `SearchContext` memoiza value + handlers; consumidores no re-renderizan sin cambio de historial.
- [x] Existe `useThemedStyles` y los 8 archivos lo usan; sin `useMemo(StyleSheet.create…)` duplicado.
- [x] Los colores de fallback pre-hidratación referencian tokens de `ThemeContext` (sin hex duplicados).
- [x] Account y Payment comparten una sola pantalla parametrizada.
- [x] No quedan exports/componentes adaptativos sin uso; `errors/errors.txt` borrado; `app.json` con slug `merca-tracker`; `ProfileLayout` renombrado; `components/search/` bajo el feature con alias `@/`.
- [x] `useSearch` lanza fuera de su provider.
- [x] `npx tsc --noEmit` sin errores nuevos.

## Decisiones tomadas y descartadas

- **Sí:** agrupar bugs + mejoras de bajo riesgo en un solo spec de "limpieza". Son cambios pequeños y ortogonales a features.
- **No:** persistir el historial ni añadir tooling/infra aquí. Son decisiones de producto/alcance mayor; se dejan fuera para no inflar el spec.
- **No:** tocar la capa MD3/glass más allá de quitar lo muerto; la arquitectura adaptativa (spec 10) se respeta.

## Riesgos identificados

- **Migración amplia de `useThemedStyles`** toca 8 archivos; riesgo de romper estilos si el factory no calca la firma actual.
- **Mover `src/components/search/`** cambia imports; verificar que ningún call-site quede colgado.
- **Sin dispositivo físico local:** validación visual del borde de fallback y del tema depende de emulador/simulador o de la máquina del usuario.

## Verificación end-to-end

1. `npx tsc --noEmit` → verde.
2. Correr la app (iOS y Android): sin flash de tema al arrancar en modo no-system; borde visible en card vacía de `TrackMain`; buscar/rastrear sin regresiones.
3. Alternar light/dark/system en Apariencia → colores responden en ambas plataformas.
4. Buscar varias URLs → historial correcto; volver a Buscar sin warnings en consola.
