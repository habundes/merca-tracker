# Renombrar tab "Lista" a "Rastrear"

## Header

- **Estado:** Implementado
- **Dependencias:** Spec `03` (Migración Expo Router) — Implementado. Este cambio reencuadra el tab `list` de esa migración.
- **Fecha:** 2026-08-04
- **Objetivo (una frase):** Renombrar el tab "Lista" a "Rastrear" — ruta `list` → `track`, feature `src/features/list` → `src/features/track`, componentes `ListMain`/`ListConfig` → `TrackMain`/`TrackConfig`, y todos los copies visibles ("Mis búsquedas", "Configurar lista", "Limpiar búsquedas", "Sin búsquedas aún", "Las URLs buscadas…") reformulados con la terminología "rastreo/rastreos", **sin tocar `search`, `profile`, `SearchContext` ni el flujo de captura de URLs**.

## Scope

**Incluye:**

- Renombrar folder de rutas `app/(tabs)/list/` → `app/(tabs)/track/` (con sus 4 archivos: `_layout.tsx`, `index.tsx`, `config.tsx`, `[itemId].tsx`).
- Renombrar folder de feature `src/features/list/` → `src/features/track/`. Preservar la subestructura (`data/`, `domain/`, `presentation/screens/`, index de convención).
- Renombrar componentes: `ListMain` → `TrackMain`, `ListConfig` → `TrackConfig`. `ItemDetail` conserva nombre (es genérico).
- Actualizar imports en los 3 route files re-exportadores para apuntar a `../../../src/features/track/presentation/screens/…`.
- `app/(tabs)/_layout.tsx`:
  - Renombrar `<Tabs.Screen name="list" …>` → `name="track"`.
  - Label `title: 'Lista'` → `title: 'Rastrear'`.
  - Mapa de icons: la clave `list` → `track` (glyph `list-outline` se mantiene).
- `app/(tabs)/track/_layout.tsx`:
  - Renombrar función `ListaLayout` → `TrackLayout`.
  - Títulos: `'Mis búsquedas'` → `'Mis rastreos'`; `'Configurar lista'` → `'Configurar rastreo'`; `'Detalle'` sin cambio.
- `src/features/track/presentation/screens/TrackMain.tsx` (ex `ListMain.tsx`):
  - `<Text style={styles.title}>Mis búsquedas</Text>` → `'Mis rastreos'`.
  - `Alert.alert 'Limpiar búsquedas'` / `'¿Estás seguro que deseas limpiar tu historial de búsquedas?'` → `'Limpiar rastreos'` / `'…historial de rastreos?'`.
  - Empty state: `'Sin búsquedas aún'` → `'Sin rastreos aún'`; `'Las URLs buscadas aparecerán aquí'` → `'Las URLs rastreadas aparecerán aquí'`.
  - `router.push('/list/config')` → `router.push('/track/config')`.
  - `router.push({ pathname: '/list/[itemId]', … })` → `pathname: '/track/[itemId]'`.
- `src/features/track/presentation/screens/TrackConfig.tsx` (ex `ListConfig.tsx`):
  - `<Text style={styles.title}>Configurar lista</Text>` → `'Configurar rastreo'`.
  - `router.push({ pathname: '/list/[itemId]', … })` → `pathname: '/track/[itemId]'`.
- Verificar que no queda ninguna ruta string `'/list'` o `'/list/…'` en el árbol (grep).

**No incluye (queda para otro spec):**

- Ningún cambio en `app/(tabs)/search.tsx`, la screen `SearchScreen`, ni el `SearchContext` (nombre del context, hook `useSearch`, campos `history`/`clearHistory`, comportamiento).
- Ningún cambio en `profile` ni en `app/_layout.tsx`.
- Cambio del icono del tab (`list-outline` sigue).
- Renombrar `ItemDetail` (nombre neutral, sirve igual).
- Persistencia del historial (sigue en memoria vía `SearchContext`).
- Refactors adicionales dentro de la feature (styles, layout, etc.).

## Data model / Tipos

Sin cambios de datos. Único payload de rutas sigue siendo `itemId: string` en `[itemId].tsx`. La forma tipada del router (`typedRoutes`) se regenerará al arrancar Expo tras el rename — los strings `/track/config` y `/track/[itemId]` deben aparecer en `.expo/types/router.d.ts`.

## Implementation plan

Cada paso deja el árbol compilando (`npx tsc --noEmit`). `spec-impl` crea branch `spec-04-renombrar-tab-rastrear` → rollback trivial.

1. **Renombrar feature.** `git mv src/features/list src/features/track`. Renombrar archivos: `TrackMain.tsx` (ex `ListMain.tsx`) y `TrackConfig.tsx` (ex `ListConfig.tsx`). Renombrar los componentes exportados (`export default function ListMain` → `TrackMain`, ídem `ListConfig` → `TrackConfig`). `ItemDetail.tsx` intacto.
2. **Actualizar copies dentro de las screens** (`TrackMain.tsx`, `TrackConfig.tsx`): reemplazar todos los literales listados en Scope. Actualizar las llamadas a `router.push` a rutas `/track/…`.
3. **Renombrar folder de rutas.** `git mv "app/(tabs)/list" "app/(tabs)/track"`. Actualizar los 3 re-exports en `index.tsx`, `config.tsx`, `[itemId].tsx` para apuntar a `src/features/track/presentation/screens/{TrackMain,TrackConfig,ItemDetail}`.
4. **`app/(tabs)/track/_layout.tsx`.** Renombrar función a `TrackLayout`; ajustar los tres títulos (`'Mis rastreos'`, `'Configurar rastreo'`, `'Detalle'`).
5. **`app/(tabs)/_layout.tsx`.** Cambiar la clave `list` del mapa de iconos por `track`; cambiar `<Tabs.Screen name="list" options={{ title: 'Lista' }} />` a `name="track" options={{ title: 'Rastrear' }}`. `search` y `profile` sin cambios; `unstable_settings.initialRouteName: 'search'` intacto.
6. **Verificar rutas huérfanas.** `grep -RIn "'/list" app src` no debe devolver nada; tampoco quedan identificadores `ListMain`/`ListConfig`.
7. **Regenerar tipos typedRoutes.** Arrancar `npm start` para que Expo regenere `.expo/types/router.d.ts` con `/track/…`. `npx tsc --noEmit` limpio.
8. **Verificación en app.** El tab inicial sigue siendo Search. Cambiar a la tab "Rastrear": título de header "Mis rastreos"; pulsar "Configurar" → header "Configurar rastreo", botón "Ver detalle de ejemplo" → header "Detalle" con `itemId='demo-1'`, back funcional. Con historial vacío se ve "Sin rastreos aún" / "Las URLs rastreadas aparecerán aquí". Realizar una búsqueda en Search (no tocada), volver a Rastrear, ver la URL en la lista, abrir detalle. Alert "Limpiar rastreos" al pulsar Limpiar.

## Acceptance criteria

- [ ] No existen `app/(tabs)/list/` ni `src/features/list/`.
- [ ] Existen `app/(tabs)/track/{_layout,index,config,[itemId]}.tsx` y `src/features/track/presentation/screens/{TrackMain,TrackConfig,ItemDetail}.tsx`.
- [ ] `app/(tabs)/_layout.tsx` declara `<Tabs.Screen name="track" options={{ title: 'Rastrear' }} />`; el mapa de icons usa la clave `track` (glyph `list-outline`).
- [ ] Stack titles: `'Mis rastreos'`, `'Configurar rastreo'`, `'Detalle'`.
- [ ] Copies en `TrackMain.tsx`: header "Mis rastreos"; empty state "Sin rastreos aún" + "Las URLs rastreadas aparecerán aquí"; alert "Limpiar rastreos" con mensaje "¿Estás seguro que deseas limpiar tu historial de rastreos?".
- [ ] Copies en `TrackConfig.tsx`: título "Configurar rastreo".
- [ ] `grep -RIn "'/list" app src` no devuelve resultados; no queda `ListMain`/`ListConfig` como identificador.
- [ ] `SearchContext`, `useSearch`, `app/(tabs)/search.tsx` y `src/features/search/**` no aparecen en el diff.
- [ ] `npx tsc --noEmit` pasa sin errores.
- [ ] Verificación manual (paso 8) exitosa.

## Decisiones tomadas y descartadas

- **Solo renombrar el tab `list`, no fusionar con `search`** (decisión del usuario). Alternativa descartada: fusionar ambas tabs en una única "Rastrear" — el usuario aclaró que Search no se toca.
- **Rutas/folders en inglés (`track`), UI en español ("Rastrear")** — coherente con CLAUDE.md ("code identifiers stay in English") y con el commit reciente `Updateing routes engkish` que ya movió las rutas a inglés.
- **No renombrar `SearchContext`/`useSearch`** — está en `src/shared/`, es cross-feature, y el usuario dijo explícitamente "búsqueda o search no es afectado". El context conceptualmente es "historial de URLs capturadas por el buscador"; queda intacto.
- **`ItemDetail` sin renombrar** — nombre genérico, no acarrea semántica de "lista".
- **Icono del tab intacto (`list-outline`)** — reencuadre del tab es de copy/estructura, no visual. Cambiar el glyph queda fuera de scope; si se quiere, otro spec.
- **No introducir alias `@/`** — el proyecto usa imports relativos (spec 03 lo dejó así); no se cambia.

## Riesgos identificados y plan de mitigación

| # | Riesgo | Mitigación |
|---|--------|-----------|
| R1 | `typedRoutes` cachea `/list/…` en `.expo/types/router.d.ts` y `tsc` falla tras el rename | Arrancar Expo (paso 7) para regenerar; si persiste, borrar `.expo/types` y reiniciar. |
| R2 | Queda una ruta string `/list/…` sin migrar (rompe navegación en runtime, silencioso) | grep obligatorio (paso 6) + verificación manual de los 3 caminos (Rastrear → Configurar, Rastrear → Detalle, Configurar → Detalle). |
| R3 | El re-export path relativo (`../../../src/features/track/...`) se descuadra si se mueve el folder de rutas al mismo tiempo que el feature | Renombrar primero la feature (paso 1), después las rutas (paso 3), verificar `tsc` entre ambos. |
| R4 | Renombrar carpetas en Windows sobre git puede perder history si no se usa `git mv` | Usar `git mv` explícito, no mover con el explorador. |
