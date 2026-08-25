# SPEC 14 — Iconos outline/fill en tabs Mis Rastreos y Buscar

> **Estado:** Aprobado
> **Dependencias:** spec 03 (migración a Expo Router / NativeTabs), spec 05 (`useTheme`/colores). Toca `app/(tabs)/_layout.tsx`.
> **Fecha:** 2026-08-25
> **Objetivo:** Cambiar los íconos SF Symbols de los tabs "Mis Rastreos" y "Buscar" para que usen un par outline/fill según el estado activo, igual que ya hace el tab "Perfil".

## Alcance

**Dentro:**

- Cambiar el `sf` del trigger "track" a `{ default: 'chart.bar', selected: 'chart.bar.fill' }`.
- Cambiar el `sf` del trigger "search" a `{ default: 'magnifyingglass', selected: 'magnifyingglass.circle.fill' }`.

**Fuera:**

- El prop `md` (Android) de ambos triggers no cambia — sigue siendo un solo icono fijo (`list`, `search`), igual que ya pasa hoy con Perfil (`md="person"`).
- El tab "Perfil" no se toca (ya tiene su par outline/fill: `person`/`person.fill`).
- No se usa `role="search"` (regla ya fijada, ver memoria del proyecto).
- No cambian labels ("Mis Rastreos", "Buscar") ni orden de tabs.

## Plan de implementación

1. En `app/(tabs)/_layout.tsx`, cambiar el `sf` del `NativeTabs.Trigger` `name="track"` de `{ default: 'list.bullet', selected: 'list.bullet' }` a `{ default: 'chart.bar', selected: 'chart.bar.fill' }`.
2. En el mismo archivo, cambiar el `sf` del `NativeTabs.Trigger` `name="search"` de `"magnifyingglass"` a `{ default: 'magnifyingglass', selected: 'magnifyingglass.circle.fill' }`.

## Criterios de aceptación

- [ ] En iOS, el tab "Mis Rastreos" inactivo muestra `chart.bar` (outline) y activo muestra `chart.bar.fill` (relleno).
- [ ] En iOS, el tab "Buscar" inactivo muestra `magnifyingglass` (outline) y activo muestra `magnifyingglass.circle.fill` (relleno).
- [ ] El tab "Perfil" no cambia visualmente (sigue `person`/`person.fill`).
- [ ] En Android, los tres tabs siguen mostrando un solo icono fijo (`list`, `search`, `person`), sin distinción outline/fill.
- [ ] Los labels "Mis Rastreos", "Buscar" y "Perfil" no cambian.

## Decisiones tomadas y descartadas

- **Icono de "Mis Rastreos": `chart.bar`/`chart.bar.fill` en vez de clipboard.** El pedido original mencionaba clipboard, pero se confirmó explícitamente el cambio a icono de gráfico de barras (analytics).
- **Icono activo de "Buscar": `magnifyingglass.circle.fill` en vez de `magnifyingglass.fill`.** SF Symbols no tiene una variante rellena de la lupa sola; se usa la lupa dentro de un círculo relleno como equivalente visual outline/fill.
- **Android (`md`) se mantiene con un solo icono fijo, sin par outline/fill.** Sigue el precedente ya establecido en el tab Perfil (`md="person"`), y no hay evidencia de que `NativeTabs` soporte variante por estado en Android.
- **No se usa `role="search"` en el trigger de Buscar.** Regla ya fijada en el proyecto (rompe el label en español); no se reabre en este spec.
