# SPEC 13 — Estados del input de Buscar (validaciones + backend simulado)

> **Estado:** Aprobado
> **Dependencias:** spec 09 (rediseño Buscar), spec 11 (componentes en `search/presentation/components/`, quitó prop `editable`), spec 12 (botón enviar `arrow-forward-circle`), spec 05 (`useTheme`/colores), spec 10 (capa adaptativa). Toca `SearchScreen`, `SearchUrlInput`, `SearchContext`, `SearchFeedback` (reuso), `TrackMain` (+toast nuevo), nuevos `search/domain/` y `search/data/`, y `docs/ux_spec.md`.
> **Fecha:** 2026-08-25
> **Objetivo:** Implementar la máquina de estados del input de Buscar —validación de formato ML México, duplicado y lista llena (5/5), más estados de backend simulados (verificando → disponible/no-disponible) y popover de éxito— tomando en cuenta el botón de enviar del spec 12.

## Contexto

`docs/ux_spec.md` § "All Input States" define la máquina de estados del input de Buscar, pero
(1) mezcla validaciones frontend con estados de backend (Decodo) que aún no existe, y (2) se
escribió antes del botón de enviar (spec 12). Este spec implementa esos estados —validaciones
reales + estados de backend **simulados**— tomando en cuenta el botón de enviar, con
**arquitectura limpia y componetizada**.

Hoy `SearchScreen` solo maneja duplicado (copy `"URL ya agregada anteriormente"`, timer
2500ms) y navega en URL válida. No hay validación de formato, ni límite de lista, ni estados
de verificación. La feature `search` solo tiene capa `presentation/`, a diferencia de
`track`/`profile` que ya tienen `domain/`.

## Scope

**Incluye:**

- **Validador de formato (puro)** `src/features/search/domain/usecases/validateMercadoLibreUrl.ts`. Válida = URL parseable con esquema `http(s)` cuyo hostname es `mercadolibre.com.mx` o termina en `.mercadolibre.com.mx`. Inválida → warning `"Solo URLs de Mercadolibre México."`
- **Duplicado**: si `history.includes(url)` → warning `"Ya estás rastreando este producto."` (reemplaza `"URL ya agregada anteriormente"`).
- **Lista llena**: constante `MAX_TRACKED = 5`. Con `history.length >= 5` → input + botones deshabilitados (atenuados) + warning persistente `"Lista llena (5/5). Elimina un producto para agregar otro."`. `addSearch` protege el tope.
- **Chequeo backend simulado** `src/features/search/data/checkProductFake.ts` (implementa la interface `ProductRepository`): delay ~1200ms. Durante: feedback `loading` `"Verificando producto..."` con **input + ✕ + enviar deshabilitados**. Resultado:
  - URL termina en `MLM-0` → no disponible → error `"Este producto ya no está disponible en Mercadolibre."`
  - resto → disponible → `addSearch` + `lastAdded` + limpia input + navega a Rastrear.
- **Toast de éxito** en Rastrear: campo transitorio `lastAdded` en `SearchContext`; componente `Toast` reutilizable muestra `"«url» agregado!"` ~2s y luego se limpia.
- **Persistencia de mensajes**: reemplaza el timer de 2500ms. Los mensajes de validación/error persisten hasta que cambia el texto del input (`onChangeText`) o se sale de la vista. `loading` es transitorio.
- **`SearchUrlInput`**: reintroduce prop `disabled` (spec 11 quitó `editable`) → deshabilita input + ✕ + enviar, atenuados.
- **Reuso** de `SearchFeedback` (tipos `error/warning/loading/success/hint` ya existen); sin componente nuevo ahí.
- **Docs**: añadir URLs dummy de prueba a `docs/ux_spec.md` y reflejar el botón enviar `>` en los mockups de estados.

**No incluye (queda para otro spec):**

- Backend/Decodo real (nombre real de producto, disponibilidad real, check real). `checkProductFake` es stub.
- Nombre real en el éxito (por ahora = la URL).
- Lógica premium/tiers (el `5` es hardcoded, sin planes).
- Debounce de auto-abrir teclado 1s tras pegar (sección "URL Input UX" del doc).
- Persistir `history`/`lastAdded` en AsyncStorage (siguen en memoria).
- Onboarding, ads, notificaciones, swipe, estados de card — otras secciones del doc.
- Haptics.

## Data model / Tipos

Capas limpias en `src/features/search/domain/entities/` (sin dependencias a RN):

```ts
// tracklist.ts
export const MAX_TRACKED = 5;

// url-validation.ts
export type UrlValidationResult =
  | { ok: true }
  | { ok: false; reason: 'invalidFormat' };

// product-check.ts
export type ProductCheckResult =
  | { status: 'available' }
  | { status: 'unavailable' };

// search-status.ts — estado único de la UI de Buscar
export type SearchStatus =
  | { kind: 'idle' }
  | { kind: 'invalidFormat' }
  | { kind: 'duplicate' }
  | { kind: 'full' }
  | { kind: 'checking' }
  | { kind: 'unavailable' };
```

```ts
// src/features/search/domain/repositories/product-repository.ts
export interface ProductRepository {
  check(url: string): Promise<ProductCheckResult>;
}
```

`SearchContext` (campos añadidos):

```ts
type SearchContextType = {
  history: string[];
  addSearch: (url: string) => void; // aplica MAX_TRACKED
  removeSearch: (url: string) => void;
  clearHistory: () => void;
  isFull: boolean; // history.length >= MAX_TRACKED
  lastAdded: string | null;
  setLastAdded: (url: string | null) => void;
};
```

## Implementation plan

Branch: `spec-13-estados-input-buscar` (autocreada). Cada paso deja `npx tsc --noEmit` verde.

1. **Domain** `src/features/search/domain/`: `entities/` (constantes + tipos de arriba), `usecases/validateMercadoLibreUrl.ts` (puro), `usecases/feedbackForStatus.ts` (`SearchStatus` → `{ type: SearchFeedbackType; message: string }`), `repositories/product-repository.ts`, `index.ts`. Sin imports de `react-native`.
2. **Data** `src/features/search/data/checkProductFake.ts`: implementa `ProductRepository`, delay ~1200ms (Promise + setTimeout), regla `MLM-0` → `unavailable`, resto → `available`. Exporta instancia `fakeProductRepository`.
3. **SearchContext**: guard `MAX_TRACKED` en `addSearch`; derivar `isFull`; añadir `lastAdded` + `setLastAdded` (todo memoizado en el `value`).
4. **SearchUrlInput**: prop `disabled?: boolean` → `editable={!disabled}`; ✕ y enviar reciben `disabled` y estilo atenuado (`opacity`) cuando aplica.
5. **Hook** `src/features/search/presentation/hooks/useProductSearch.ts`: encapsula `value`, `status`, `disabled`, `onChangeText` (limpia el status), `onClear`, `onSubmit`. `onSubmit` orquesta: vacío→`idle`; `validateMercadoLibreUrl`→`invalidFormat`; duplicado; `full`; si no `checking`→`repo.check`→ `unavailable` | disponible (`addSearch` + `setLastAdded` + limpia + `router.push('/track')`). Limpia el status al perder foco. Recibe `repo: ProductRepository = fakeProductRepository` (testable).
6. **SearchScreen** (delgada): consume el hook; render `SearchUrlInput` + `SearchFeedback` (via `feedbackForStatus`) + `SearchHelp`; estado `full` → input deshabilitado + warning. Elimina el timer 2500ms viejo.
7. **Toast reutilizable** `src/shared/components/Toast.tsx`: presentacional, adaptive/temático, auto-hide por prop (`onHide`).
8. **TrackMain**: renderiza `<Toast>` con `"«lastAdded» agregado!"` cuando `lastAdded != null`; al ocultarse llama `setLastAdded(null)`.
9. **Docs** `docs/ux_spec.md`: sección "URLs dummy de prueba" (no disponible = `.../MLM-0`; disponible = otra `.com.mx`) y reflejar el botón `>` (enviar) en los mockups de estados.
10. **Verificación** (ver sección).

## Acceptance criteria

- [ ] URL con host ≠ `mercadolibre.com.mx` (o sin esquema / no parseable) → warning "Solo URLs de Mercadolibre México."; no agrega.
- [ ] URL ya en `history` → warning "Ya estás rastreando este producto."; no agrega.
- [ ] Con 5 items: input + ✕ + enviar deshabilitados y warning "Lista llena (5/5)…"; al eliminar uno (<5) se rehabilita.
- [ ] URL válida nueva → feedback "Verificando producto…" ~1200ms con input + ✕ + enviar deshabilitados.
- [ ] URL válida terminando en `MLM-0` → error "Este producto ya no está disponible en Mercadolibre."; no agrega.
- [ ] URL válida (no `MLM-0`) → agrega, limpia input, navega a Rastrear y muestra toast "«url» agregado!" ~2s.
- [ ] Enter y botón enviar producen comportamiento idéntico en todos los casos.
- [ ] Los mensajes de validación/error persisten hasta cambiar el texto o salir de la vista (sin timer 2500ms).
- [ ] `src/features/search/domain` no importa `react-native`; `SearchScreen` queda delgada usando `useProductSearch`.
- [ ] `docs/ux_spec.md` incluye las URLs dummy y el botón enviar en los mockups.
- [ ] `npx tsc --noEmit` sin errores nuevos.

## Decisiones tomadas y descartadas

- **Sí:** clean arch en `search` (domain puro + data stub + hook + screen delgada). Alinea con `domain/` ya presente en track/profile y con la petición de componetizar.
- **Sí:** interface `ProductRepository` + `fakeProductRepository`. Permite cambiar a Decodo real sin tocar la UI.
- **Sí:** `SearchStatus` (unión discriminada) + `feedbackForStatus` puro. Un único lugar mapea estado → copy/estilo.
- **Sí:** reusar `SearchContext` como store del tracklist (ya lo es). No se crea contexto nuevo (fuera de scope).
- **Sí:** `Toast` reutilizable en `shared/components`. Se descarta `Alert` (intrusivo) y el overlay que retrasa la navegación.
- **Sí:** éxito = la URL por ahora. El nombre real depende de backend (fuera de scope).
- **Sí:** `MAX_TRACKED = 5` hardcoded. Tiers/premium fuera de scope.
- **Sí:** reintroducir `disabled` en `SearchUrlInput` (spec 11 quitó `editable` por no usarse; ahora sí se usa).
- **No:** debounce auto-teclado 1s del doc. No pedido; el foco actual ya abre teclado al entrar.
- **No:** persistir en AsyncStorage. Sigue en memoria.

## Riesgos identificados

| Riesgo                                                            | Mitigación                                                                                                                             |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `new URL()` no fiable en Hermes/RN 0.86                           | El validador queda puro y aislado; si `URL` falla, parsear el hostname por regex sin cambiar la firma. Verificar contra docs Expo v57. |
| Toast cross-screen via context se re-muestra al volver a Rastrear | `setLastAdded(null)` al ocultar; el toast solo dispara con `lastAdded != null`.                                                        |
| Sin backend/dispositivo real                                      | Validación visual (disabled, loading, toast) depende de simulador/emulador o de la máquina del usuario.                                |

## Verificación end-to-end

1. `npx tsc --noEmit` → verde.
2. App, tab **Buscar** (probar con Enter y con el botón enviar, ambos):
   - `https://amazon.com/x` → warning de formato; no agrega.
   - URL `.com.mx` ya rastreada → warning de duplicado.
   - Con 5 items → input/botones deshabilitados + "Lista llena".
   - URL `.com.mx` nueva → "Verificando…" ~1.2s (deshabilitado) → navega a Rastrear + toast "agregado!".
   - URL `…/MLM-0` → error "ya no está disponible"; no agrega.
   - Editar el texto tras un error → el mensaje desaparece.
3. Confirmar que `src/features/search/domain` no importa `react-native` (grep).

## Lo que **no** entra en este spec

- Backend/Decodo real y nombre real de producto.
- Lógica premium/tiers (el `5` es fijo).
- Debounce de auto-teclado, persistencia en AsyncStorage, onboarding, ads, notificaciones, swipe, estados de card, haptics.

Cada uno de esos, si aterriza, va en su propio spec.
