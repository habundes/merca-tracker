# SPEC 17 — Eliminar rastreo desde swipe (con confirmación)

> **Estado:** Aprobado
> **Dependencias:** spec 16 (`SwipeableTrackRow` y su botón 🗑 Eliminar, hoy inerte),
> spec 13 (store del tracklist en `SearchContext`: `removeSearch`, `clearHistory`),
> spec 04 (feature `track` / pantalla `TrackMain`). Toca
> `src/features/track/presentation/screens/TrackMain.tsx`,
> `src/features/track/presentation/components/SwipeableTrackRow.tsx` y un util nuevo
> `src/shared/utils/confirmDialog.ts`.
> **Fecha:** 2026-08-28
> **Objetivo:** Cablear el botón 🗑 Eliminar del swipe de "Mis Rastreos" para que borre
> el item con `removeSearch` tras una confirmación (`Alert.alert` que nombra el item),
> extrayendo un helper compartido que también reusan el botón "Limpiar" y el menú
> contextual "Eliminar del historial".

## Alcance

**Dentro:**

- **Helper compartido** `src/shared/utils/confirmDialog.ts`: función que envuelve
  `Alert.alert` con dos botones (Cancelar `cancel` + acción `destructive`),
  parametrizable en título, mensaje, etiqueta de confirmación y `onConfirm`.
- **Cablear el botón 🗑 Eliminar del swipe**: al tocarlo, cierra el swipe y abre la
  confirmación; al confirmar, ejecuta `removeSearch(item)` (la fila desaparece de la
  lista).
- **Confirmación que nombra el item**: usa el título (`titleByUrl.get(item) ?? item`)
  en el mensaje del diálogo.
- **Refactor de "Limpiar"**: `handleClearHistory` deja su `Alert.alert` inline y pasa a
  usar el helper compartido (mismo texto y comportamiento actuales).
- **Menú contextual** "Eliminar del historial" (`Link.MenuAction`, iOS long-press):
  pasa de borrar directo a borrar **con la misma confirmación**.
- Pasar el item (o un `onDelete`) de `TrackMain` a `SwipeableTrackRow` para que el
  botón sepa qué fila borra.

**Fuera:**

- Cablear los botones **🔄 Check Ahora** y **⚙️ Configurar** del swipe: siguen
  **inertes** (solo `close()`), como en spec 16.
- Full-swipe-to-delete (disparo automático al 60%): sigue fuera; solo se revela por
  swipe parcial y se borra tocando el botón.
- Construir un popover/modal custom: se descartó, se reusa `Alert.alert` (decisión del
  usuario).
- Cambios en el modelo de datos o en `SearchContext` (`removeSearch`/`clearHistory` ya
  existen).
- Deshacer/undo tras borrar, o Toast de confirmación de borrado.

## Modelo de datos

**Sin cambios.** No se introduce ni modifica ningún tipo, campo ni store. Se reutiliza
tal cual `history: string[]`, `removeSearch(url)` y `clearHistory()` de `useSearch()`
(spec 13). El helper nuevo solo define un tipo local de opciones para el diálogo:

```ts
type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  cancelLabel?: string; // default 'Cancelar'
};
```

## Plan de implementación

Cada paso deja la app compilando.

1. **Helper compartido.** Crear `src/shared/utils/confirmDialog.ts` con
   `confirmDestructiveAction(options: ConfirmOptions)` que llama a
   `Alert.alert(title, message, [{ text: cancelLabel ?? 'Cancelar', style: 'cancel' },
{ text: confirmLabel, style: 'destructive', onPress: onConfirm }])`. Sin
   dependencias nuevas (`Alert` es de `react-native`). Paso aislado: no rompe nada aún.

2. **Refactor de "Limpiar".** En `TrackMain.tsx`, reescribir `handleClearHistory` para
   que use `confirmDestructiveAction({ title: 'Limpiar rastreos', message: '¿Estás
seguro que deseas limpiar tu historial de rastreos?', confirmLabel: 'Limpiar',
onConfirm: clearHistory })`. Comportamiento y textos idénticos a hoy; solo cambia la
   implementación. Verifica que el helper funciona en un punto ya existente.

3. **Handler de borrado individual.** En `TrackMain.tsx`, añadir
   `handleDeleteItem(item: string)` que calcula `const name = titleByUrl.get(item) ??
item` y llama `confirmDestructiveAction({ title: 'Eliminar rastreo', message:
`¿Eliminar «${name}»?`, confirmLabel: 'Eliminar', onConfirm: () => removeSearch(item)
})`.

4. **Prop `onDelete` en `SwipeableTrackRow`.** Añadir a `SwipeableTrackRowProps` un
   `onDelete: () => void`. En `renderRightActions`, el botón 🗑 Eliminar pasa de
   `onPress={() => swipeableMethods.close()}` a `onPress={() => {
swipeableMethods.close(); onDelete(); }}` (cierra el swipe y luego dispara la
   confirmación). **Check Ahora y Configurar quedan igual (inertes).**

5. **Cablear en la lista.** En `TrackMain.tsx`, pasar `onDelete={() =>
handleDeleteItem(item)}` al `<SwipeableTrackRow>` de cada `renderItem`.

6. **Menú contextual.** En el `Link.MenuAction` "Eliminar del historial", cambiar
   `onPress={() => removeSearch(item)}` por `onPress={() => handleDeleteItem(item)}`
   para que también confirme antes de borrar.

## Criterios de aceptación

- [ ] Existe `src/shared/utils/confirmDialog.ts` exportando `confirmDestructiveAction`,
      que arma un `Alert.alert` con botón `cancel` + botón `destructive`.
- [ ] Swipe izquierda en una fila → tocar 🗑 **Eliminar** cierra el swipe y abre un
      diálogo con título "Eliminar rastreo" y mensaje "¿Eliminar «Nombre»?" (nombre del
      item, no la URL cuando hay título).
- [ ] Confirmar en el diálogo → la fila desaparece de la lista (`removeSearch`);
      Cancelar → la lista queda intacta.
- [ ] El botón "Limpiar" sigue mostrando su diálogo con textos actuales y sigue
      vaciando la lista, ahora vía `confirmDestructiveAction`.
- [ ] El menú contextual (long-press iOS) "Eliminar del historial" ahora muestra la
      **misma** confirmación antes de borrar (ya no borra directo).
- [ ] Los botones 🔄 **Check Ahora** y ⚙️ **Configurar** siguen inertes (solo cierran
      el swipe): no borran, no verifican, no navegan.
- [ ] El tap normal de la fila sigue navegando al Detalle (sin cambios).
- [ ] No hay borrado por swipe completo (60%); el borrado solo ocurre tocando el botón
      y confirmando.
- [ ] La app compila y corre en iOS y Android (dev client).

## Decisiones tomadas y descartadas

- **Reusar `Alert.alert`** en vez de construir un popover/modal custom (pedido del
  usuario: "igual a como se hace en Limpiar"). El término "popover" del prompt se
  materializa como el diálogo nativo que ya usa "Limpiar".
- **Helper compartido `confirmDestructiveAction`** en `src/shared/utils/` en vez de
  duplicar el `Alert.alert` inline: menos duplicación y un solo punto para el patrón de
  confirmación destructiva (usado por Limpiar, borrado individual y menú contextual).
- **La confirmación nombra el item** (`«Nombre»` vía `titleByUrl`, con fallback a la
  URL) en vez de un texto genérico: más claro para el usuario.
- **Añadir confirmación al menú contextual** "Eliminar del historial", que antes
  borraba directo: consistencia entre las tres vías de borrado.
- **Check Ahora y Configurar siguen inertes** (spec 16): solo se cablea Eliminar; las
  otras acciones quedan para specs futuros.
- **`onDelete` como callback** pasado desde `TrackMain` (que es dueño de `titleByUrl` y
  `removeSearch`), en vez de pasar el item crudo y resolver el nombre dentro de
  `SwipeableTrackRow`: mantiene el componente de swipe agnóstico de los datos.
- **Sin undo/Toast de borrado**: fuera de alcance; el borrado es inmediato tras
  confirmar.

## Riesgos identificados

| #   | Riesgo                                                                                                                                           | Mitigación                                                                                                                                        |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | Orden `close()` → `onDelete()`: si `close()` anima y el `Alert` aparece encima, en algún device podría verse la fila cerrándose bajo el diálogo. | El `Alert` nativo bloquea la UI igualmente; visualmente aceptable. Si molesta, invertir a `onDelete()` antes de `close()` o cerrar sin animación. |
| R2  | Borrado por índice vs por valor: `keyExtractor` usa `${item}-${index}`, pero `removeSearch` filtra por URL; URLs duplicadas borrarían todas.     | `history` ya deduplica en `addSearch` (spec 13), así que no hay URLs repetidas; sin cambios necesarios.                                           |
| R3  | El diálogo nombra el item con `titleByUrl`; si la URL no está en los datos dummy, muestra la URL cruda (larga).                                  | Fallback aceptado (`?? item`); el título largo lo trunca el propio `Alert` del sistema.                                                           |
