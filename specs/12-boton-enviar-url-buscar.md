# Buscar — Botón de enviar URL

## Header

- **Estado:** Aprobado
- **Dependencias:** spec 09 (rediseño Buscar, `SearchUrlInput`), spec 05 (`useTheme()` / `colors.accent`), spec 11 (componentes movidos a `src/features/search/presentation/components/`, prop `editable` eliminada). Toca únicamente `SearchUrlInput.tsx`.
- **Fecha:** 2026-08-21
- **Objetivo (una frase):** Añadir un botón-icono de enviar dentro del input de Buscar (junto al ✕) que dispare la búsqueda existente, conservando el envío por Enter del teclado.

## Contexto

En Buscar, el único modo de enviar la URL es el Enter del teclado (`onSubmitEditing` + `returnKeyType: 'search'` en `SearchUrlInput`). El spec 09 quitó el botón "Ir" para un look glass más limpio, pero la verificación de UX mostró baja descubribilidad del envío solo-por-teclado, sobre todo en el caso de uso principal: **pegar** una URL de Mercadolibre. Este spec reintroduce una affordance de envío discreta —un botón-icono dentro del input, no un botón separado— sin tocar la lógica de búsqueda.

## Scope

**Incluye:**

- En `src/features/search/presentation/components/SearchUrlInput.tsx`, añadir un `Pressable` de enviar tras el botón ✕, reutilizando el mismo patrón del botón de limpiar (`hitSlop={8}`, `accessibilityRole="button"`, `android_ripple`, estilo con `pressed && { opacity: 0.5 }`).
  - `onPress={onSubmit}` (la prop `onSubmit` que el componente ya recibe).
  - `Ionicons name="arrow-forward-circle"`, `size={22}`, `color={colors.accent}` — acción primaria, contrasta con el ✕ en `textMuted`.
  - `accessibilityLabel="Rastrear URL"`.
  - Visible solo con texto (mismo `showClear = value.length > 0` que el ✕).
- Añadir estilo `sendBtn` (clon de `clearBtn`, `marginLeft: 8`) al `StyleSheet`.
- Conservar `onSubmitEditing` + `returnKeyType: 'search'` → el Enter sigue enviando.

**No incluye (queda para otro spec):**

- Validación de formato/dominio de URL (Mercadolibre México). El tipo `'error'` de `SearchFeedback` sigue sin usarse.
- Cambios en `handleSearch`, `SearchContext`, navegación o el pill de duplicado.
- Cambios en `SearchScreen.tsx` (no se toca).
- Estado deshabilitado o de loading/spinner en el botón.

## Data model / Tipos

Sin datos ni persistencia nuevos. `SearchUrlInputProps` ya expone `onSubmit`; no cambia la firma de props.

## Implementation plan

Branch: `spec-12-boton-enviar-url-buscar` (autocreada). Cada paso deja `npx tsc --noEmit` verde.

1. **Botón de enviar.** En `SearchUrlInput.tsx`, tras el bloque `{showClear && (<Pressable … ✕ />)}`, añadir un segundo `Pressable` condicionado a `showClear`: `onPress={onSubmit}`, `accessibilityLabel="Rastrear URL"`, patrón idéntico al del ✕, con `Ionicons name="arrow-forward-circle" size={22} color={colors.accent}`.
2. **Estilo.** Añadir `sendBtn` al `StyleSheet` (clon de `clearBtn`, `marginLeft: 8`).
3. **No tocar** `textInputProps` ni `SearchScreen.tsx`.
4. **Verificación** (ver sección).

## Acceptance criteria

- [ ] Con texto en el input aparecen el ✕ y el botón de enviar (`arrow-forward-circle` en `colors.accent`); el ✕ sigue en `textMuted`.
- [ ] Con el campo vacío no aparece el botón de enviar (ni el ✕).
- [ ] Tocar el botón hace exactamente lo mismo que el Enter: URL nueva → `addSearch` + `router.push('/track')` + limpia el campo; URL duplicada → pill `warning` "URL ya agregada anteriormente".
- [ ] El Enter del teclado sigue enviando (sin regresión).
- [ ] No se modifica `SearchScreen.tsx` ni la lógica `handleSearch`.
- [ ] `npx tsc --noEmit` sin errores nuevos.

## Decisiones tomadas y descartadas

- **Reintroducir affordance de envío (vs conservar solo-Enter del spec 09):** la verificación de UX mostró baja descubribilidad, agravada por el caso de pegar URL. Se resuelve con un botón-icono dentro del input, no con un botón "Ir" separado (se respeta el look limpio del spec 09).
- **Botón + Enter (vs excluyentes):** no son excluyentes; el Enter da fluidez y el botón descubribilidad.
- **Icono dentro del input (vs botón grande debajo):** compacto y reutiliza el patrón del ✕; cero cambios en el layout de `SearchScreen`.
- **Visible solo con texto (vs siempre visible deshabilitado):** coherente con el ✕ y evita introducir estado deshabilitado.
- **`arrow-forward-circle` en acento (vs `send` / `search`):** flecha en acento comunica acción primaria y contrasta con el ✕ muted.
- **Sin validación de URL:** fuera de alcance; el tipo `'error'` de `SearchFeedback` ya está soportado para un spec futuro.

## Riesgos identificados

- **Sin dispositivo iOS/Android local:** la validación visual del acento/contraste depende de simulador/emulador o de la máquina del usuario.
- **✕ y botón de enviar adyacentes:** verificar que los `hitSlop` no se solapen y ambos sean tocables cómodamente.

## Verificación end-to-end

1. `npx tsc --noEmit` → verde.
2. Correr la app, tab **Buscar**:
   - Campo vacío → sin ✕ ni botón de enviar.
   - Escribir/pegar una URL → aparecen ✕ y el botón de enviar.
   - Tocar el botón de enviar → navega a **Rastrear** y limpia el campo (igual que Enter).
   - Pulsar Enter → mismo comportamiento (regresión).
   - Reenviar la misma URL → pill `warning` "URL ya agregada anteriormente".
3. Alternar light/dark en Apariencia → el botón de enviar (acento) contrasta y el ✕ sigue en `textMuted`.
