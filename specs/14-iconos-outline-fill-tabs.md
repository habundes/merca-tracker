# SPEC 14 — Iconos outline/fill en tabs Mis Rastreos y Buscar

> **Estado:** Aprobado
> **Dependencias:** spec 03 (migración a Expo Router / NativeTabs), spec 05 (`useTheme`/colores). Toca `app/(tabs)/_layout.tsx`.
> **Fecha:** 2026-08-25
> **Objetivo:** Cambiar el ícono SF Symbol del tab "Mis Rastreos" para que use un par outline/fill (`tray.full`/`tray.full.fill`) según el estado activo, igual que ya hace el tab "Perfil". El tab "Buscar" se evaluó para el mismo tratamiento pero se descartó (ver "Decisiones tomadas y descartadas").

## Alcance

**Dentro:**

- Cambiar el `sf` del trigger "track" a `{ default: 'tray.full', selected: 'tray.full.fill' }`.

**Fuera:**

- El `sf` del trigger "search" no cambia — se queda como `"magnifyingglass"` fijo (ver "Decisiones tomadas y descartadas").
- El prop `md` (Android) de ambos triggers no cambia — sigue siendo un solo icono fijo (`list`, `search`), igual que ya pasa hoy con Perfil (`md="person"`).
- El tab "Perfil" no se toca (ya tiene su par outline/fill: `person`/`person.fill`).
- No se usa `role="search"` (regla ya fijada, ver memoria del proyecto).
- No cambian labels ("Mis Rastreos", "Buscar") ni orden de tabs.

## Plan de implementación

1. En `app/(tabs)/_layout.tsx`, cambiar el `sf` del `NativeTabs.Trigger` `name="track"` de `{ default: 'list.bullet', selected: 'list.bullet' }` a `{ default: 'tray.full', selected: 'tray.full.fill' }`.
2. El `sf` del `NativeTabs.Trigger` `name="search"` se queda sin cambios (`"magnifyingglass"` fijo).

## Criterios de aceptación

- [ ] En iOS, el tab "Mis Rastreos" inactivo muestra `tray.full` (outline) y activo muestra `tray.full.fill` (relleno).
- [ ] En iOS, el tab "Buscar" muestra `magnifyingglass` fijo en ambos estados (sin variante fill), solo cambia el color activo/inactivo.
- [ ] El tab "Perfil" no cambia visualmente (sigue `person`/`person.fill`).
- [ ] En Android, los tres tabs siguen mostrando un solo icono fijo (`list`, `search`, `person`), sin distinción outline/fill.
- [ ] Los labels "Mis Rastreos", "Buscar" y "Perfil" no cambian.

## Decisiones tomadas y descartadas

- **Icono de "Mis Rastreos": `tray.full`/`tray.full.fill`.** Se probaron y descartaron `chart.bar`/`chart.bar.fill` (gráfico de barras) y `chart.line.uptrend.xyaxis` (línea de analytics, sin variante fill real) por no ser el estilo buscado. Entre las opciones con variante fill real relacionadas a lista/rastreo (`clipboard`, `list.bullet.clipboard`, `list.bullet.rectangle`, `tray.full`) se eligió `tray.full` (bandeja llena).
- **Icono de "Buscar": se descarta el par outline/fill, se mantiene `magnifyingglass` fijo.** SF Symbols no tiene una variante rellena de la lupa sola (no es una forma cerrada). La alternativa `magnifyingglass.circle.fill` se probó pero se descartó por feedback visual — no era el resultado esperado. Se revisó el catálogo completo de la familia `magnifyingglass` (`magnifyingglass.circle`, `text.magnifyingglass`, `arrow.up/down.magnifyingglass`, `plus/minus.magnifyingglass`, `doc.text.magnifyingglass`) y ninguna tiene variante `.fill` de la lupa sola. Se mantiene el icono fijo, igual que estaba antes de este spec.
- **Android (`md`) se mantiene con un solo icono fijo, sin par outline/fill.** Sigue el precedente ya establecido en el tab Perfil (`md="person"`), y no hay evidencia de que `NativeTabs` soporte variante por estado en Android.
- **No se usa `role="search"` en el trigger de Buscar.** Regla ya fijada en el proyecto (rompe el label en español); no se reabre en este spec.
