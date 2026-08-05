# SPEC 08 — Navegar a Rastrear tras búsqueda exitosa

> **Estado:** Implementado
> **Dependencias:** SPEC 03 (Migración Expo Router), SPEC 04 (Renombrar tab a Rastrear). Reutiliza `SearchContext.addSearch` (spec 03) y la ruta `/track` (spec 04).
> **Fecha:** 2026-08-04
> **Objetivo:** Tras un "Ir" con URL nueva en `/search`, agregar la URL al historial y navegar automáticamente a la tab `/track` para verla en el listado; los duplicados siguen bloqueando con el mensaje inline actual sin navegar.

## Contexto

Hoy, tras un "Ir" exitoso en `/search`, la URL se agrega al `SearchContext.history` y aparece un mensaje inline transitorio ("URL agregada al historial") por 2.5s; el usuario debe cambiar manualmente a la tab Rastrear para verla. El flujo natural es: buscar → ver el rastreo agregado. Este spec cierra ese loop navegando automáticamente a `/track` cuando la URL es nueva. Además, el hint quedó stale tras spec 04 (dice "…en Lista", pero la tab ya se llama "Rastrear") y se aprovecha para corregirlo.

## Scope

**Incluye:**

- En `src/features/search/presentation/screens/SearchScreen.tsx`, dentro de `handleSearch`, tras `addSearch(trimmed)` y `setUrl('')`, navegar con `router.push('/track')` usando `useRouter` de `expo-router`.
- Eliminar el estado `added` (y su `setAdded`, `setTimeout`) — la navegación es feedback suficiente.
- Eliminar el `<Text style={styles.added}>URL agregada al historial</Text>` y su estilo `added` de `StyleSheet`.
- Actualizar el hint stale: `"Las búsquedas se guardan en Lista"` → `"Las búsquedas se guarda en Rastrear"`.
- Los duplicados conservan el comportamiento actual: `setDuplicate(true)`, mensaje inline "URL ya agregada anteriormente", sin navegar, sin re-agregar.

**No incluye (queda para otro spec):**

- Cambiar el destino a `/track/[itemId]` (detalle directo).
- Navegar también cuando la URL es duplicada.
- Cambios en `SearchContext` (`addSearch`, `history`, `clearHistory`).
- Validación de formato de URL (hoy solo `trim` + duplicate check; se mantiene).
- Cambios en el autofocus, el `KeyboardAvoidingView` o el layout de `SearchScreen`.
- Cambios en `TrackMain` (el nuevo item ya aparece arriba porque `addSearch` lo antepone).

## Data model / Tipos

Sin datos nuevos. Se reutiliza `SearchContext` (spec 03): `addSearch(url: string)` antepone la URL a `history: string[]`. No se introducen tipos, campos ni estructuras nuevas.

## Implementation plan

Branch: `spec-08-navegar-rastrear-tras-busqueda`. Cada paso deja `npx tsc --noEmit` verde.

1. **Importar `useRouter`.** En `SearchScreen.tsx`, agregar `useRouter` al import existente de `expo-router` (que ya trae `useFocusEffect`). Instanciar `const router = useRouter();` dentro del componente.

2. **Navegar tras búsqueda exitosa.** En `handleSearch`, después de `setUrl('')`, agregar `router.push('/track')`. Eliminar `setAdded(true)` y el `setTimeout(() => setAdded(false), 2500)`.

3. **Eliminar estado `added`.** Quitar `const [added, setAdded] = useState(false);`. Quitar del JSX la rama `added ? <Text style={styles.added}>URL agregada al historial</Text> : …` — el ternario pasa de 3 ramas a 2: `duplicate ? <Text duplicate> : <Text hint>`.

4. **Quitar estilo `added`.** Eliminar la entrada `added: { … }` del `StyleSheet.create`.

5. **Actualizar copy del hint.** Cambiar el literal `"Las búsquedas se guardan en Lista"` por `"Las búsquedas se guarda en Rastrear"`.

6. **Verificación manual.** Ver sección de acceptance criteria.

## Acceptance criteria

- [ ] `SearchScreen.tsx` importa `useRouter` desde `expo-router` y llama `const router = useRouter();`.
- [ ] `handleSearch` invoca `router.push('/track')` tras `addSearch(trimmed)` y `setUrl('')`, solo en la rama no-duplicada.
- [ ] `SearchScreen.tsx` no contiene el identificador `added`, ni `setAdded`, ni el `<Text style={styles.added}>`, ni la entrada `added` en `StyleSheet`.
- [ ] El hint muestra el literal exacto `"Las búsquedas se guarda en Rastrear"` (ya no `"…en Lista"`).
- [ ] Buscar una URL nueva → se navega a la tab Rastrear; el nuevo item aparece arriba del listado en `TrackMain`.
- [ ] Buscar una URL ya presente en el historial → aparece el mensaje "URL ya agregada anteriormente" durante ~2.5s, la tab activa sigue siendo Buscar, no se navega.
- [ ] Volver manualmente a la tab Buscar → input vacío y con autofocus (comportamiento actual intacto).
- [ ] `npx tsc --noEmit` pasa sin errores nuevos.

## Decisiones tomadas y descartadas

- **Sí:** navegar al listado `/track` (no al detalle `/track/[itemId]`). El listado ya muestra la URL recién agregada arriba (por el `unshift` implícito de `addSearch`), y deja al usuario en control para abrir el detalle si quiere. Ir directo al detalle sería más agresivo y saltarse el listado quita contexto.

- **No:** navegar también en el caso duplicado. El usuario decidió mantener el feedback inline "URL ya agregada anteriormente" sin navegar — señala explícitamente que la acción no tuvo efecto, en lugar de llevar al usuario a un listado donde no notaría que su URL no se agregó.

- **Sí:** eliminar el mensaje transitorio "URL agregada al historial" y su `setTimeout`. La transición de tab es feedback suficiente y evita estado que ya no se ve (la pantalla se desmonta/pierde foco antes de los 2.5s).

- **Sí:** actualizar el hint "…en Lista" → "…en Rastrear" aprovechando que se toca ese bloque. El copy quedó stale tras spec 04 (rename de la tab); corregirlo aquí evita otro spec trivial.

- **No:** validar el formato de la URL antes de navegar. Fuera de scope; el filtro actual (`trim` no vacío + no duplicada) es el mismo que hoy.

- **No:** tocar `SearchContext`. `addSearch` ya hace exactamente lo necesario (antepone + deduplica silenciosamente). Agregar un flag "acabo de agregar" acoplaría el context a la UX de una sola screen.

## Verificación end-to-end

1. `npx tsc --noEmit` limpio.
2. `npm start` → abrir en simulador. Tab inicial: Buscar.
3. Ingresar `https://ejemplo-1.com` → "Ir". Verificar: transición automática a tab Rastrear; el item aparece en la primera posición del listado.
4. Volver a Buscar (tap en tab). Verificar: input vacío, focus en el input, hint dice "Las búsquedas se guarda en Rastrear".
5. Ingresar `https://ejemplo-1.com` de nuevo → "Ir". Verificar: aparece "URL ya agregada anteriormente" ~2.5s, tab activa sigue en Buscar, `history` sin duplicar.
6. Ingresar `https://ejemplo-2.com` → "Ir". Verificar: nueva navegación a Rastrear; item aparece arriba del anterior.
