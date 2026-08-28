# SPEC 18 — Pantalla Detalle del item (UI maqueteada, clean architecture)

> **Estado:** Aprobado
> **Dependencias:** spec 04 (feature `track`, pantalla `ItemDetail` y ruta dinámica
> `/track/[itemId]`), spec 02 (convención clean-arch feature-first:
> `domain/{entities,usecases,repositories}`, `data/{datasources,models,repositories}`,
> `presentation/` depende de domain), spec 10 (capa adaptativa
> `shared/components/adaptive`: `Card`/`Surface`), spec 05 (`ThemeContext`/`colors` — se
> le agrega un token nuevo `success`).
> **Fecha:** 2026-08-28
> **Objetivo:** Enriquecer la pantalla Detalle (`/track/[itemId]`) para que muestre —solo
> con datos dummy, sin backend— el diseño "Item Detail" del `docs/ux_spec.md` (líneas
> 413-458, 442-447, 998-1014: imagen, seller, precio con indicador de cambio, historial
> de checks, resumen de modo, botones de acción, y variantes normal / wish-price / no
> disponible / estados del botón Check Ahora), **estructurando la feature en clean
> architecture** (entidad `TrackItemDetail` + repositorio dummy + caso de uso, consumidos
> por la pantalla vía un hook), sin lógica de negocio ni persistencia real.
>
> **Archivos que toca:**
>
> - `src/features/track/domain/entities/` — `TrackItemDetail.ts`, `PriceCheck.ts` (entidades + tipos valor).
> - `src/features/track/domain/repositories/TrackDetailRepository.ts` — interfaz.
> - `src/features/track/domain/usecases/getItemDetail.ts` — caso de uso.
> - `src/features/track/domain/index.ts` — barrel (reemplaza el `export {}` vacío).
> - `src/features/track/data/datasources/dummyTrackDataSource.ts` — DTOs dummy (absorbe `dummyHistory.ts`).
> - `src/features/track/data/models/TrackItemDetailDTO.ts` — DTO + mapper `toDomain`.
> - `src/features/track/data/repositories/DummyTrackDetailRepository.ts` — implementa la interfaz.
> - `src/features/track/presentation/hooks/useItemDetail.ts` — cablea usecase + repo dummy.
> - `src/features/track/presentation/screens/ItemDetail.tsx` — render desde la entidad.
> - `src/shared/context/ThemeContext.tsx` — token `success` (verde) en light/dark.
> - Ajuste de import en `SearchContext.tsx` y `TrackMain.tsx` al mover `dummyHistory.ts` al datasource.

## Alcance

**Dentro:**

- **Capa domain** (feature `track`, sin deps a RN):
  - `entities/PriceCheck.ts`: entrada de historial (`date` label, `price` label,
    `direction`).
  - `entities/TrackItemDetail.ts`: entidad del detalle (título, seller, imagen, precio
    actual, cambio de precio, labels de últ./próx. check, modo, disponibilidad, estado
    wish-price, estado del botón Check Ahora, `checks: PriceCheck[]`) + tipos valor
    (`PriceDirection`, `TrackMode`, `CheckButtonState`, `Availability`).
  - `repositories/TrackDetailRepository.ts`: interfaz `getDetailByUrl(url): TrackItemDetail | null`.
  - `usecases/getItemDetail.ts`: caso de uso que recibe la interfaz y resuelve la entidad
    por URL.
  - `domain/index.ts`: barrel que reemplaza el `export {}` vacío.
- **Capa data**:
  - `datasources/dummyTrackDataSource.ts`: arreglo de DTOs dummy (absorbe el contenido de
    `dummyHistory.ts`, ampliado con los campos del diseño) + el listado de URLs para sembrar
    la lista.
  - `models/TrackItemDetailDTO.ts`: forma cruda del dato dummy + mapper `toDomain(dto)`.
  - `repositories/DummyTrackDetailRepository.ts`: implementa `TrackDetailRepository` leyendo
    el datasource y mapeando DTO→entidad.
- **Capa presentation**:
  - `hooks/useItemDetail.ts`: instancia el repo dummy + usecase y devuelve `TrackItemDetail | null`.
  - `screens/ItemDetail.tsx`: reescrito para renderizar el diseño completo desde la entidad
    (nunca importa el dummy ni el DTO directo): imagen, seller, título, precio grande +
    indicador de cambio, labels "hace X · próx: Y", divisor, "Historial de checks" (máx 5),
    "Modo: …", y botones de acción. Usa `Card`/`Surface` adaptativos.
- **Variantes visuales** (el DTO dummy de cada item decide cuál se pinta):
  - **Normal** (precio + cambio ↑/↓/→ + historial + modo + botones).
  - **Wish-price alcanzado** (líneas 448-458): 🎯 badge, modo "Wish Price (alcanzado)",
    botones `[Nuevo precio deseado]` `[Eliminar]`.
  - **No disponible** (líneas 998-1014): título tachado, precio oculto (`$---`), leyenda
    "ya no existe", único botón `[Eliminar Producto]`, sin historial.
- **4 estados visuales del botón "Check Ahora"** (líneas 442-447), elegidos por el dummy:
  `[Check Ahora]` / `[Check Ahora (1/2)]` / `[Ver ad → +1 check]` / `[Límite alcanzado ⏰]`.
- **Cableado de botones** (UI, sin backend):
  - `Configurar` → `router.push('/track/config')`.
  - `Ver en Mercadolibre →` → `Linking.openURL(url)`.
  - `Check Ahora` (y sus variantes) → **inerte** (solo visual).
  - `Eliminar` / `Eliminar Producto` → **inerte** (solo visual; el borrado real vive en el
    swipe de la lista, spec 17).
- **Tema**: token `success` (verde) en `ThemeColors` (light + dark). Color de precio:
  baja→`success`, sube→`danger`, sin cambio→`textMuted`.
- **Fallbacks** conservados: sin `itemId` → "Ítem no encontrado"; URL sin match en el
  datasource → "Detalle del ítem" + URL cruda.

**Fuera:**

- Backend real (Decodo), fetch, checks reales, historial real, rate-limit real, reward ad
  real. El botón Check Ahora y sus 4 estados son **solo visuales**.
- Persistencia (AsyncStorage) del detalle o del historial.
- Card expandible **inline en la lista** (el diseño la describe como card que se expande;
  aquí el detalle es **pantalla dedicada** ya existente). No se construye expand/collapse
  en `TrackMain`; este solo cambia el import al mover `dummyHistory.ts`.
- Contenido real de la pantalla Configurar (`TrackConfig` sigue placeholder; solo se navega
  a ella).
- Notificaciones / deep link `mltracker://product/:id`.
- Cambios al store real de rastreos (`SearchContext.history: string[]` sin cambios).
- Ads reales, FastImage / caché de imágenes.
- Tests automatizados (no hay runner; se verifica con `tsc --noEmit` + prueba manual).

## Modelo de datos

Todo es dummy (labels string, sin fechas ni aritmética real). Se separa en 3 capas.

### Domain — entidades (sin deps a RN)

```ts
// domain/entities/PriceCheck.ts
export type PriceDirection = 'down' | 'up' | 'none' | 'wish' | 'unavailable';

export type PriceCheck = {
  dateLabel: string; // "May 30 2:00PM"
  priceLabel: string; // "$749"
  direction: PriceDirection;
};
```

```ts
// domain/entities/TrackItemDetail.ts
import type { PriceCheck, PriceDirection } from './PriceCheck';

export type TrackMode = { kind: 'interval' | 'wish' | 'manual'; label: string };
// label: "Intervalo 24hrs" | "Wish Price (alcanzado)" | "Manual"
export type CheckButtonState = 'available' | 'partial' | 'reward' | 'limit';
// [Check Ahora] | [Check Ahora (1/2)] | [Ver ad → +1 check] | [Límite alcanzado ⏰]
export type Availability = 'available' | 'unavailable';

export type PriceChange = {
  direction: PriceDirection;
  amountLabel: string | null; // "-$150" | "+$200" | null (sin cambio / no disp.)
};

export type TrackItemDetail = {
  url: string;
  title: string;
  seller: string;
  imageUrl: string;
  priceLabel: string; // "$749"  ("$---" si no disponible)
  priceChange: PriceChange;
  lastCheckLabel: string; // "hace 2 hrs"
  nextCheckLabel: string | null; // "22 hrs" (null si manual / no disponible)
  mode: TrackMode;
  availability: Availability;
  wishReached: boolean;
  checkButton: CheckButtonState;
  checks: PriceCheck[]; // máx 5 (free)
};
```

### Data — DTO + mapper

```ts
// data/models/TrackItemDetailDTO.ts
import type {
  TrackItemDetail,
  CheckButtonState,
  PriceDirection,
} from '@/features/track/domain';

export type PriceCheckDTO = {
  date: string;
  price: string;
  dir: PriceDirection;
};

export type TrackItemDetailDTO = {
  url: string;
  title: string;
  seller: string;
  image: string;
  price: string;
  change: { dir: PriceDirection; amount: string | null };
  lastCheck: string;
  nextCheck: string | null;
  mode: string;
  modeKind: 'interval' | 'wish' | 'manual';
  available: boolean;
  wishReached: boolean;
  checkButton: CheckButtonState;
  checks: PriceCheckDTO[];
};

export function toDomain(dto: TrackItemDetailDTO): TrackItemDetail {
  /* mapeo campo a campo */
}
```

### Data — datasource (absorbe `dummyHistory.ts`)

`data/datasources/dummyTrackDataSource.ts` exporta:

- `DUMMY_TRACK_DETAILS: TrackItemDetailDTO[]` — los 5 items actuales ampliados con los campos
  nuevos, **cubriendo las variantes**: p.ej. item 1 normal (baja), item 2 sube, item 3 sin
  cambio, item 4 wish-price alcanzado, item 5 no disponible; y repartiendo los 4 estados de
  `checkButton` entre ellos.
- `DUMMY_TRACK_HISTORY: string[] = DUMMY_TRACK_DETAILS.map(d => d.url)` — para sembrar
  `SearchContext`.

### Repositorio

```ts
// domain/repositories/TrackDetailRepository.ts
import type { TrackItemDetail } from '@/features/track/domain';
export interface TrackDetailRepository {
  getDetailByUrl(url: string): TrackItemDetail | null;
}
```

```ts
// data/repositories/DummyTrackDetailRepository.ts  — implementa la interfaz
//   getDetailByUrl(url): busca en DUMMY_TRACK_DETAILS y devuelve toDomain(dto) | null
```

```ts
// domain/usecases/getItemDetail.ts
export const getItemDetail = (repo: TrackDetailRepository, url: string) =>
  repo.getDetailByUrl(url);
```

### Presentation

`hooks/useItemDetail.ts`: `useMemo` que instancia `new DummyTrackDetailRepository()` y llama
`getItemDetail(repo, url)`; devuelve `TrackItemDetail | null`. La pantalla solo conoce la
entidad de domain.

**Nota:** en este maqueteado DTO≈entidad; el mapper es casi 1:1. Se mantiene la frontera
igual para fijar el patrón clean-arch (cuando llegue Decodo, solo cambian datasource+mapper).

## Plan de implementación

Cada paso deja `tsc --noEmit` verde y la app arrancando. No hay test runner; se corre
`tsc --noEmit` tras cada paso.

1. **Token `success` en el tema.** En `ThemeContext.tsx`: agregar `success: string` a
   `ThemeColors`, y su valor en `lightColors` (`#16a34a`) y `darkColors` (`#30d158`).
   Paso aislado: nadie lo usa aún, no rompe nada.

2. **Domain.** Crear (sin deps a RN):
   - `domain/entities/PriceCheck.ts` (`PriceDirection`, `PriceCheck`).
   - `domain/entities/TrackItemDetail.ts` (`TrackMode`, `CheckButtonState`, `Availability`,
     `PriceChange`, `TrackItemDetail`).
   - `domain/repositories/TrackDetailRepository.ts` (interfaz `getDetailByUrl`).
   - `domain/usecases/getItemDetail.ts`.
   - `domain/index.ts`: barrel que re-exporta entidades, tipos, interfaz y usecase
     (reemplaza el `export {}`). tsc verde (aún sin consumidores).

3. **Data (crear, sin borrar lo viejo aún).**
   - `data/models/TrackItemDetailDTO.ts` (`PriceCheckDTO`, `TrackItemDetailDTO`, `toDomain`).
   - `data/datasources/dummyTrackDataSource.ts`: `DUMMY_TRACK_DETAILS: TrackItemDetailDTO[]`
     (5 items actuales ampliados, repartiendo variantes y estados de `checkButton`) +
     `DUMMY_TRACK_HISTORY = DUMMY_TRACK_DETAILS.map(d => d.url)`.
   - `data/repositories/DummyTrackDetailRepository.ts` (implementa la interfaz vía datasource
     - `toDomain`). `dummyHistory.ts` sigue existiendo; tsc verde.

4. **Migrar consumidores y borrar `dummyHistory.ts`.**
   - `SearchContext.tsx`: importar `DUMMY_TRACK_HISTORY` desde el datasource.
   - `TrackMain.tsx`: `titleByUrl` desde `DUMMY_TRACK_DETAILS` (`d.url → d.title`).
   - Borrar `src/features/track/dummyHistory.ts`. tsc verde (sin referencias colgantes).

5. **Presentation hook.** `presentation/hooks/useItemDetail.ts`: `useMemo` que instancia
   `DummyTrackDetailRepository` y llama `getItemDetail(repo, url)`; retorna
   `TrackItemDetail | null`.

6. **Reescribir `ItemDetail.tsx`** (render desde la entidad, con `Card`/`Surface`
   adaptativos y `useThemedStyles`):
   - Params: `useLocalSearchParams` + `decodeURIComponent` (como hoy) → `url`; `router` de
     `expo-router` para navegar.
   - `const item = useItemDetail(url)`.
   - **Fallbacks:** sin `url` → "Ítem no encontrado"; `item == null` → "Detalle del ítem" +
     URL cruda (conservados).
   - **Cabecera:** imagen, título (tachado si no disponible), seller.
   - **Precio:** `priceLabel` grande, color por `priceChange.direction`
     (baja→`success`, sube→`danger`, otro→`textMuted`) + indicador
     (📉/📈/➡️/🎯/⚠️) y `amountLabel`. No disponible → `$---` + "⚠️ No disponible".
   - **Línea** "↓ hace 2 hrs · próx: 22 hrs" (oculta `próx` si `nextCheckLabel == null`).
   - **Divisor** + **"Historial de checks:"** con `checks.map` (máx 5; punto ● + fecha +
     precio + indicador). Oculto si no disponible.
   - **"Modo: {mode.label}"**.
   - **Botones** según variante:
     - normal → `[Check Ahora*]` `[Configurar]` + `[Ver en Mercadolibre →]`.
     - wish alcanzado → `[Nuevo precio deseado]` `[Eliminar]`.
     - no disponible → solo `[Eliminar Producto]`.
     - `Check Ahora*` = label según `checkButton` (available/partial/reward/limit), **inerte**.
     - `Configurar` → `router.push('/track/config')`.
     - `Ver en Mercadolibre →` → `Linking.openURL(url)` (`Linking` de `react-native`).
     - `Eliminar` / `Nuevo precio deseado` → **inertes** (solo visual).

7. **Verificación.** `tsc --noEmit` sin errores; prueba manual (ver criterios de aceptación).

## Criterios de aceptación

- [ ] `ThemeColors` incluye `success`; `lightColors` y `darkColors` lo definen; el precio a
      la baja se pinta con `success` (verde), al alza con `danger` (rojo), sin cambio con
      `textMuted` (gris).
- [ ] Existe la capa **domain** de `track`: `entities/PriceCheck.ts`,
      `entities/TrackItemDetail.ts`, `repositories/TrackDetailRepository.ts`,
      `usecases/getItemDetail.ts`, y `domain/index.ts` los re-exporta (ya no es `export {}`).
      Ningún archivo de `domain/` importa React Native.
- [ ] Existe la capa **data**: `models/TrackItemDetailDTO.ts` (con `toDomain`),
      `datasources/dummyTrackDataSource.ts` (`DUMMY_TRACK_DETAILS`, `DUMMY_TRACK_HISTORY`),
      `repositories/DummyTrackDetailRepository.ts` que implementa `TrackDetailRepository`.
- [ ] `dummyHistory.ts` fue eliminado; `SearchContext` y `TrackMain` importan del datasource;
      la lista "Mis rastreos" sigue sembrada con los mismos 5 items y sus títulos.
- [ ] `ItemDetail.tsx` obtiene el detalle **solo** vía `useItemDetail(url)` (entidad de
      domain); no importa el datasource, el DTO ni `DUMMY_TRACK_DETAILS` directamente.
- [ ] La pantalla Detalle en variante **normal** muestra: imagen, seller, título, precio con
      color+indicador y monto de cambio, línea "hace … · próx: …", divisor, "Historial de
      checks" (hasta 5 entradas con fecha/precio/indicador) y "Modo: …".
- [ ] Variante **wish-price alcanzado**: badge 🎯, "Modo: Wish Price (alcanzado)", botones
      `[Nuevo precio deseado]` `[Eliminar]` (sin `[Check Ahora]`/`[Configurar]`).
- [ ] Variante **no disponible**: título tachado, precio `$---` + "⚠️ No disponible", **sin**
      historial, único botón `[Eliminar Producto]`.
- [ ] El botón Check Ahora muestra su label según el estado dummy del item
      (`[Check Ahora]` / `[Check Ahora (1/2)]` / `[Ver ad → +1 check]` / `[Límite alcanzado ⏰]`)
      y **no dispara ninguna acción** (inerte).
- [ ] `[Configurar]` navega a `/track/config`; `[Ver en Mercadolibre →]` abre la URL con
      `Linking.openURL`; `[Eliminar]` / `[Eliminar Producto]` / `[Nuevo precio deseado]` son
      inertes.
- [ ] Fallbacks conservados: sin `itemId` → "Ítem no encontrado"; URL sin match en el
      datasource → "Detalle del ítem" + URL cruda.
- [ ] La pantalla usa `Card`/`Surface` de `shared/components/adaptive` (Glass en iOS, MD3 en
      Android) y respeta el tema (light/dark).
- [ ] `tsc --noEmit` pasa sin errores; la app arranca y navega Lista → Detalle → back en iOS
      y Android (dev client).

## Decisiones tomadas y descartadas

- **Clean architecture feature-first para el maqueteado** (pedido del usuario): se llenan
  `domain/` y `data/` de `track` (hoy vacías) con entidad + interfaz + usecase + repo dummy,
  aunque sea UI sin backend, para fijar el patrón (spec 02). Descartado seguir importando el
  dummy directo en la pantalla.
- **DTO≈entidad con mapper casi 1:1** (en vez de omitir la capa data por ser dummy): se
  mantiene la frontera datasource→DTO→`toDomain`→entidad para que, al llegar Decodo, solo
  cambien datasource y mapper sin tocar domain ni presentation.
- **Pantalla dedicada `/track/[itemId]`**, no card expandible inline (el `ux_spec` describe
  "Item Detail" como card que se expande dentro de la lista). La app ya usa ruta dedicada y
  el prompt pide "la vista Detalle"; construir expand/collapse inline en `TrackMain` queda
  fuera.
- **Datos dummy como labels string** (no fechas/precios reales calculados): es maqueteado
  visual; evita lógica de fechas/formato que pertenece al backend real.
- **Las 3 variantes + 4 estados del botón las decide el DTO por item** (en vez de un selector
  de estado en runtime): sin backend, la forma más simple de ver todas las caras es repartir
  las variantes entre los 5 items dummy.
- **Botones cableados solo a navegación / link externo** (`Configurar`→`/track/config`,
  `Ver en ML`→`Linking.openURL`), lo demás inerte: navegación y abrir URL son UI pura;
  `Check Ahora`, `Eliminar` y `Nuevo precio deseado` necesitarían backend/estado real →
  specs futuros. El borrado real ya vive en el swipe de la lista (spec 17), no se duplica aquí.
- **Token `success` nuevo en el tema** (en vez de reusar `accent`/hardcodear verde): el
  diseño exige verde para precio a la baja y el tema no lo tenía; se agrega como token para
  respetar light/dark.
- **Indicador de precio con emoji** (📉/📈/➡️/🎯/⚠️, como el `ux_spec`) en vez de iconos
  Ionicons: calca el doc y evita mapear nombres de iconos; el color lo da el token del tema.
- **Absorber `dummyHistory.ts` en `data/datasources/`** (y borrarlo) en vez de dejarlo como
  archivo legacy: un solo origen de datos dummy en la capa correcta; se actualizan los 2
  imports (`SearchContext`, `TrackMain`).
- **`SearchContext` (en `shared/`) sigue importando el datasource de la feature**: coupling
  preexistente (ya importaba `dummyHistory` de `track`); se conserva la misma dirección, solo
  cambia la ruta. Refactorizar ese seed a `shared/` queda fuera.

## Riesgos identificados

| #   | Riesgo                                                                                                                                                     | Mitigación                                                                                                                                  |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | Mover `dummyHistory.ts` al datasource rompe el seed de `SearchContext` o el `titleByUrl` de `TrackMain` (import colgante o export renombrado).             | `tsc --noEmit` tras el paso 4; verificar en la app que "Mis rastreos" sigue sembrada con los 5 items y sus títulos antes de continuar.      |
| R2  | `Linking.openURL` con una URL dummy (`…/MLM-05`) abre el navegador a una página inexistente en device real.                                                | Aceptado para el maqueteado (son URLs ficticias); con Decodo serán URLs reales. Opcional: envolver en `Linking.canOpenURL` antes de abrir.  |
| R3  | Un import accidental de React Native en `domain/` (p.ej. un tipo) contamina la capa y rompe la regla clean-arch.                                           | Entidades = solo tipos TS puros; el barrel solo re-exporta tipos/funciones; revisar que ningún archivo de `domain/` importe `react-native`. |
| R4  | La API de `Card`/`Surface` adaptativos (`GlassCardProps`) difiere entre Glass (iOS) y MD3 (Android) y el detalle se ve distinto o rompe en una plataforma. | Leer props de `glass/` y `md3/` antes de usarlos (calcan la API); probar el render del Detalle en iOS y Android (dev client).               |
