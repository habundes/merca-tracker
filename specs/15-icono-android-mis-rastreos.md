# SPEC 15 — Icono Android del tab Mis Rastreos

> **Estado:** Implementado
> **Dependencias:** spec 03 (migración a Expo Router / NativeTabs), spec 14 (cambió el `sf` de iOS de "track" a `tray.full`/`tray.full.fill`). Toca `app/(tabs)/_layout.tsx`.
> **Fecha:** 2026-08-25
> **Objetivo:** Actualizar el ícono Android (`md`) del tab "Mis Rastreos" para que combine visualmente con el nuevo ícono iOS (`tray.full`/`tray.full.fill`, spec 14), ya que el `md` actual (`list`) quedó desalineado con ese significado.

## Contexto

El spec 14 cambió el ícono iOS de "Mis Rastreos" de `list.bullet` a `tray.full`/`tray.full.fill`
(bandeja llena). El prop `md` (Android) no se tocó en ese spec —se decidió explícitamente que
Android se queda con un solo icono fijo, sin par outline/fill, por falta de evidencia de que
`NativeTabs` soporte esa distinción ahí (ver spec 14, "Decisiones tomadas y descartadas")—, por lo
que sigue en `list`, que ya no combina visualmente con el nuevo significado de "bandeja".

## Alcance

**Dentro:**

- Cambiar el `md` del trigger "track" en `app/(tabs)/_layout.tsx` de `"list"` a un icono Material
  fijo que combine con "bandeja llena" (candidato sugerido: `"inbox"`).

**Fuera:**

- No se introduce par outline/fill en Android (sigue sin evidencia de soporte en `NativeTabs`).
- No se toca el `sf` (iOS) de ningún trigger.
- No se tocan los tabs "Buscar" ni "Perfil".
- No cambian labels ni orden de tabs.

## Plan de implementación

1. En `app/(tabs)/_layout.tsx`, cambiar el `md` del `NativeTabs.Trigger` `name="track"` de
   `"list"` a `"inbox"` (o el nombre Material Icon que se confirme al aprobar el spec).

## Criterios de aceptación

- [x] En Android, el tab "Mis Rastreos" muestra el nuevo icono fijo, sin distinción
      outline/fill (igual que hoy con Perfil).
- [x] En iOS no hay ningún cambio visual (este spec no toca `sf`).
- [x] El label "Mis Rastreos" no cambia.

## Decisiones tomadas

- **Icono confirmado: `inbox`.** Se comparó con `inventory_2` y `archive` (ambos leen como caja
  cerrada de cartón, no como bandeja). `inbox` es una bandeja vista de perfil con una ranura
  horizontal, la forma más parecida a `tray.full` de iOS.
