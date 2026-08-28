# SPEC 16 — Swipe en Mis Rastreos (revelar acciones)

> **Estado:** Aprobado
> **Dependencias:** spec 04 (feature `track` / pantalla `TrackMain`), spec 13 (store
> del tracklist en `SearchContext`; dejó "swipe, estados de card" fuera). Toca
> `package.json`, `app/_layout.tsx`, `src/features/track/presentation/screens/TrackMain.tsx`,
> un componente nuevo `src/features/track/presentation/components/SwipeableTrackRow.tsx`,
> y `docs/ux_spec.md` (última tarea).
> **Fecha:** 2026-08-27
> **Objetivo:** Agregar a cada fila de "Mis Rastreos" gestos de swipe que revelen los
> botones de acción del doc UX (swipe izquierda → 🔄 Check Ahora + 🗑 Eliminar; swipe
> derecha → ⚙️ Configurar), mostrando los botones según `docs/ux_spec.md` líneas
> 454-520, **sin ejecutar acciones ni navegación** — solo el gesto y la UI.

## Contexto

La pantalla "Mis rastreos" (`TrackMain.tsx`) hoy pinta un `FlatList` de URLs (string)
sin swipe. Este spec añade el gesto de swipe (izquierda/derecha) sobre esas filas y
revela los botones definidos en el doc, pero deja los botones **inertes** (solo
cierran el swipe). No construye la card de producto ni cablea las acciones reales;
eso queda para specs futuros. `docs/ux_spec.md` líneas 454-520 es la fuente de diseño.

## Alcance

**Dentro:**

- Instalar y configurar `react-native-gesture-handler`, `react-native-reanimated`,
  `react-native-worklets` (peer de reanimated 4) y `expo-haptics`.
- Envolver la raíz de la app en `<GestureHandlerRootView>` (`app/_layout.tsx`).
- Componente nuevo `SwipeableTrackRow` que envuelve el contenido de cada fila con
  `ReanimatedSwipeable`.
- **Swipe izquierda** (revela lado derecho): botones **🔄 Check Ahora** (azul,
  `colors.accent`) y **🗑 Eliminar** (rojo, `colors.danger`).
- **Swipe derecha** (revela lado izquierdo): botón **⚙️ Configurar** (gris,
  `colors.textMuted`).
- Umbral de reveal a **40px** (doc); **haptic ligero** al abrir (doc).
- Los 3 botones al tocarse **solo cierran el swipe** (`swipeableMethods.close()`).

**Fuera:**

- Cablear las acciones reales de los botones (borrar, verificar precio, abrir
  Configurar) — todos inertes en este spec (decisión del usuario).
- Navegación desde los botones del swipe ("no navegaciones"). El **tap normal de la
  fila** sigue navegando al Detalle (comportamiento existente, sin cambios).
- Full-swipe trigger (doc línea 472: 60% del ancho dispara Eliminar / abre
  Configurar). Solo se revela por swipe parcial.
- Construir la card de producto con imagen/precio/cambio/próx-check (doc 353-450).
- Deshabilitar swipe si la card está expandida o el producto no disponible (doc
  515-518): no existen esos estados en el código, así que la condición no aplica y el
  swipe queda habilitado en todas las filas.

## Modelo de datos

**Sin cambios.** Los botones son solo visuales; no se introduce ni modifica ningún
tipo, campo ni store. Se sigue consumiendo `history: string[]` de `useSearch()`.

## Plan de implementación

Cada paso deja la app compilando.

1. **Dependencias.** `npx expo install react-native-gesture-handler
react-native-reanimated react-native-worklets expo-haptics`. SDK 57 fija
   `~2.32.0` / `4.5.1` / `0.10.1`. **No** se crea `babel.config.js`:
   `babel-preset-expo` inyecta automáticamente el plugin `react-native-worklets/plugin`.
   Requiere **New Architecture** (default en SDK 57; `app.json` no la desactiva).
   Al ser dependencias nativas, requiere **rebuild del dev client**.

2. **Root gesture-handler.** En `app/_layout.tsx`, envolver el árbol devuelto por
   `RootLayout` en `<GestureHandlerRootView style={{ flex: 1 }}>` (expo-router no lo
   provee). Import: `import { GestureHandlerRootView } from 'react-native-gesture-handler'`.

3. **Componente `SwipeableTrackRow.tsx`** (nuevo, en
   `src/features/track/presentation/components/`):
   - Usa `ReanimatedSwipeable` de `react-native-gesture-handler/ReanimatedSwipeable`.
   - `renderRightActions = (progress, translation, methods) => ...` → **🔄 Check
     Ahora** (Ionicons `refresh`, fondo `colors.accent`) + **🗑 Eliminar** (Ionicons
     `trash`, fondo `colors.danger`), texto blanco (`ON_ACCENT`).
   - `renderLeftActions = (progress, translation, methods) => ...` → **⚙️ Configurar**
     (Ionicons `settings-outline`, fondo/gris `colors.textMuted`).
   - Botones = `TouchableOpacity`; `onPress={() => methods.close()}` (inerte salvo
     cerrar; sin acción, sin navegación).
   - `friction={2}`, `leftThreshold={40}`, `rightThreshold={40}` (reveal a 40px, doc).
   - `onSwipeableWillOpen={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}`
     (haptic ligero al alcanzar el umbral, doc línea 510).
   - Sin `overshoot`-to-action / sin disparar nada en `onSwipeableOpen` (no full-swipe).
   - Estilos con `useThemedStyles` (patrón del repo).

4. **`TrackMain.tsx`.** Envolver el `<Link>…</Link>` de cada `renderItem` con
   `<SwipeableTrackRow>…</SwipeableTrackRow>`. La fila conserva su contenido, el
   `Pressable`, el tap→Detalle y (iOS) `Link.Preview`/`Link.Menu` sin cambios; solo se
   añade el swipe alrededor.

5. **Doc (última tarea).** Al terminar la implementación, actualizar `docs/ux_spec.md`
   (sección _Swipe Actions_, líneas 454-520) para reflejar lo realmente implementado:
   el swipe se aplica **sobre las filas de la lista de URLs**, botones **solo visuales**
   (cierran el swipe), **sin full-swipe** y **sin navegación**. **Omitir la card de
   producto** en la descripción — la implementación es sobre la lista, no sobre la card
   con imagen/precio/próx-check.

## Criterios de aceptación

- [ ] `package.json` incluye `react-native-gesture-handler`, `react-native-reanimated`,
      `react-native-worklets` y `expo-haptics` en versiones de SDK 57.
- [ ] `<GestureHandlerRootView style={{flex:1}}>` envuelve la raíz en `app/_layout.tsx`.
- [ ] Swipe izquierda en una fila revela a la derecha **[🔄 Check Ahora]** (azul) y
      **[🗑 Eliminar]** (rojo).
- [ ] Swipe derecha revela a la izquierda **[⚙️ Configurar]** (gris).
- [ ] Tocar cualquiera de los 3 botones **solo cierra** el swipe: no borra, no
      verifica, no navega.
- [ ] No hay auto-acción por swipe completo (60%); solo se revela.
- [ ] El tap normal de la fila sigue navegando al Detalle (sin cambios).
- [ ] Se dispara un haptic ligero al abrir el swipe.
- [ ] La app compila y corre en iOS y Android (dev client, New Architecture).
- [ ] Como última tarea, `docs/ux_spec.md` (Swipe Actions) queda actualizado con lo
      implementado, sobre la lista y omitiendo la card de producto.

## Decisiones tomadas y descartadas

- **Botones solo visuales** (pedido del usuario): sin cablear acciones ni navegación.
  Borrar real (`removeSearch` ya existe), Check real y Configurar (navegación) → specs
  futuros.
- **Solo revelar**, sin full-swipe-to-delete (doc línea 472) — descartado por el pedido
  explícito "solo la acción de swipe".
- **Swipe sobre las filas URL actuales**; no se construye la card de producto (doc
  353-450) — fuera de alcance.
- **`ReanimatedSwipeable`** (no el `Swipeable` clásico, deprecado) — alineado con el
  doc línea 512 ("Reanimated 2").
- **Sin `babel.config.js` manual** — en SDK 57 `babel-preset-expo` auto-inyecta el
  plugin de worklets; añadir el viejo `react-native-reanimated/plugin` sería erróneo.
- Condiciones "swipe deshabilitado si card expandida / no disponible" (doc 515-518)
  **no aplican**: no hay expand ni campo de disponibilidad en el código; se retoman
  cuando esos estados existan.

## Riesgos identificados

| #   | Riesgo                                                                                                                     | Mitigación                                                                                                                                                   |
| --- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| R1  | Conflicto de gestos: el pan horizontal del swipe vs `Link.Preview`/`Link.Menu` (peek/long-press iOS) en la misma fila.     | Mantener el contenido de la fila dentro del child del `ReanimatedSwipeable`; verificar en device iOS; si estorba, evaluar quitar el peek en filas con swipe. |
| R2  | Deps nativas → Expo Go no las trae; requiere rebuild.                                                                      | Dev build / `expo run:ios`/`expo run:android`; correr con dev client, no Expo Go.                                                                            |
| R3  | Reanimated 4 exige New Architecture.                                                                                       | No poner `newArchEnabled:false`; SDK 57 la trae por default (verificado, `app.json` sin opt-out).                                                            |
| R4  | Versiones peer ya resueltas en `node_modules` (gesture-handler 3.1.0, reanimated 4.5.3) más nuevas que los pins de SDK 57. | Correr `expo install` para fijarlas explícitas en `package.json` y revisar.                                                                                  |

## Verificación end-to-end

1. `npx expo install …` y rebuild del dev client (`expo run:ios` / `expo run:android`
   o EAS dev build).
2. Abrir el tab "Mis Rastreos" (hay 5 items dummy sembrados).
3. Swipe izquierda en una fila → aparecen **Check** (azul) + **Eliminar** (rojo) a la
   derecha; tap en cada uno → la fila se cierra y no pasa nada más.
4. Swipe derecha → aparece **Configurar** (gris) a la izquierda; tap → se cierra.
5. Confirmar haptic ligero al abrir el swipe.
6. Tap normal en la fila → navega a Detalle (sin cambios).
7. Repetir en iOS y Android.
