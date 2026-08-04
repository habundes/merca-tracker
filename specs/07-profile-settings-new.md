# Configuración y header de perfil

## Header

- **Estado:** Aprobado
- **Dependencias:**
  - Spec `06` (Apariencia screen propia) — Implementado. Provee el bloque `demoNav` con los 3 links (Ajustes de cuenta / Ajustes de pago / Apariencia) que este spec renombra y reordena.
  - Base: Expo SDK 57, React 19.2, RN 0.86, TS 6.
  - Sin dependencias npm nuevas.
- **Fecha:** 2026-08-04
- **Objetivo (una frase):** En `ProfileMain` (rama `loggedIn`), renombrar la sección `demoNav` a `configSection` (texto visible "Configuración"), mover el botón "Cerrar sesión" debajo de esa sección con margen ajustado, quitar el texto "Sesión iniciada" y mostrar en su lugar el correo, y cambiar el título del header a un placeholder "John Doe" cuando no exista `name` (signup sin nombre queda con el nombre real).

## Scope

**Incluye:**

- **Renombrar identificadores del bloque de links.** En `ProfileMain.tsx`: `demoNav` → `configSection`, `demoNavTitle` → `configSectionTitle`, `demoNavBtn` → `configBtn`, `demoNavText` → `configText`. Texto visible del título: "Demo de navegación" → "Configuración". Los 3 links dentro (Ajustes de cuenta / Ajustes de pago / Apariencia) no cambian de texto ni de destino.

- **Mover el botón "Cerrar sesión".** El `TouchableOpacity` con estilo `logoutBtn`/`logoutText` pasa de estar antes del bloque `configSection` a estar **después** (debajo del último link, "Apariencia"). Se ajusta su `marginTop` (de `24` a `8`, igual al `gap` que separa los links entre sí) para no quedar pegado al último link. El resto del estilo (`logoutBtn`/`logoutText`: borde, color, padding) no cambia.

- **Reemplazar el subtítulo "Sesión iniciada" por el correo.** El `<Text style={styles.sub}>` que hoy muestra el literal "Sesión iniciada" pasa a mostrar `{email}`.

- **Placeholder de nombre en el título.** El `<Text style={styles.title}>` pasa de `{name || email}` a `{name || 'John Doe'}`. Si el usuario hizo signup con un nombre real, se muestra ese nombre; si entró por login (sin campo `name`), se muestra el placeholder `'John Doe'`.

**No incluye (queda para otro spec):**

- Conexión real a base de datos para obtener el nombre de usuario — `'John Doe'` es un placeholder temporal.
- Agregar un campo `name` al flujo de login.
- Cambiar el texto, orden o destino de los 3 links (Ajustes de cuenta / Ajustes de pago / Apariencia).
- Cambiar el ícono `person-circle-outline` del header.
- Cualquier estilo de `logoutBtn`/`logoutText` más allá del `marginTop`.
- Validación o formateo del correo mostrado (se reutiliza el mismo state `email` ya capturado en login/signup).

## Data model / Tipos

Sin datos nuevos. Se reutiliza el state existente de `ProfileMain` (`name`, `email`). Sin tipos nuevos.

## Implementation plan

Cada paso deja el árbol compilando (`npx tsc --noEmit`) y la app arrancable. Branch: `spec-07-profile-settings-new`.

1. **Renombrar identificadores del bloque de links.** En `ProfileMain.tsx`: renombrar en `styles` `demoNav`→`configSection`, `demoNavTitle`→`configSectionTitle`, `demoNavBtn`→`configBtn`, `demoNavText`→`configText`; actualizar los usos en el JSX de la rama `loggedIn`. Cambiar el texto "Demo de navegación" → "Configuración". `tsc` verde.

2. **Mover "Cerrar sesión" debajo de `configSection`.** Reordenar el JSX de la rama `loggedIn`: el `TouchableOpacity` de `logoutBtn` pasa a estar después del `View` de `configSection` (debajo del link "Apariencia"). Ajustar `logoutBtn.marginTop` de `24` a `8`. `tsc` verde.

3. **Reemplazar "Sesión iniciada" por el correo.** Cambiar `<Text style={styles.sub}>Sesión iniciada</Text>` a `<Text style={styles.sub}>{email}</Text>`.

4. **Placeholder de nombre en el título.** Cambiar `<Text style={styles.title}>{name || email}</Text>` a `<Text style={styles.title}>{name || 'John Doe'}</Text>`. `tsc` verde.

5. **Verificación manual.**
   - Login (sin nombre) → título "John Doe", subtítulo con el correo ingresado.
   - Signup (con nombre) → título con el nombre real ingresado, subtítulo con el correo ingresado.
   - Sección "Configuración" con los 3 links en el mismo orden y estilo de antes.
   - "Cerrar sesión" aparece debajo del link "Apariencia", con separación visual consistente (no pegado, no con hueco excesivo).
   - Tap "Cerrar sesión" sigue reseteando el formulario y volviendo a la vista de login/signup.

6. **Grep de residuos.** `grep -RIn "demoNav" src app` → sin resultados (todo renombrado a `config*`).

## Acceptance criteria

- [ ] `ProfileMain.tsx` no contiene ya los identificadores `demoNav`, `demoNavTitle`, `demoNavBtn`, `demoNavText`; existen `configSection`, `configSectionTitle`, `configBtn`, `configText` en su lugar.
- [ ] El texto visible del título de la sección es "Configuración" (ya no "Demo de navegación").
- [ ] El `TouchableOpacity` de "Cerrar sesión" aparece en el JSX **después** del bloque `configSection` (debajo del link "Apariencia"), no antes.
- [ ] `logoutBtn.marginTop` es `8` (ya no `24`).
- [ ] El `<Text style={styles.sub}>` ya no contiene el literal "Sesión iniciada"; muestra `{email}`.
- [ ] El `<Text style={styles.title}>` usa `{name || 'John Doe'}` (ya no `{name || email}`).
- [ ] Login (sin nombre) → título muestra "John Doe"; signup (con nombre) → título muestra el nombre real ingresado.
- [ ] Los 3 links (Ajustes de cuenta / Ajustes de pago / Apariencia) mantienen su texto, orden y destino de `router.push`.
- [ ] `grep -RIn "demoNav" src app` no devuelve resultados.
- [ ] `npx tsc --noEmit` pasa sin errores nuevos introducidos por este cambio (los errores preexistentes de rutas tipadas, ver nota de riesgos, no son responsabilidad de este spec).
- [ ] Verificación manual: login y signup ambos muestran el header correcto; "Cerrar sesión" queda visualmente separado del último link sin gap excesivo ni pegado.

## Decisiones tomadas y descartadas

- **Renombrar identificadores a `config*`** (vs dejar `demoNav*` y solo cambiar el string visible). Elegido: consistencia entre el nombre en código y el nombre visible "Configuración"; evita confusión futura al leer `demoNav` cuando ya no es una demo.

- **`logoutBtn.marginTop: 8`** (vs mantener `24`, vs no tocar el margen). Elegido: al pasar de estar pegado al título/ícono a estar pegado al último link, un margen de `24` dejaría un hueco visualmente inconsistente con el `gap:8` interno de `configSection`; `8` iguala esa separación.

- **Nombre real si existe (signup), placeholder "John Doe" si no (login)** (vs "John Doe" fijo siempre, vs mantener `{name || email}`). Elegido: preserva la única señal real de identidad que ya captura el formulario (el campo `name` de signup) sin descartar información existente; "John Doe" cubre el caso login que no pide nombre, simulando el futuro dato de BD.

- **Correo en el subtítulo en vez de "Sesión iniciada"** (vs quitar el subtítulo por completo, vs mantener "Sesión iniciada" y agregar el correo en otro lugar). Elegido: aprovecha el espacio ya reservado para mostrar información útil (el correo con el que se inició sesión) sin agregar un elemento nuevo al layout.

- **Placeholder "John Doe" hardcodeado, sin conexión a BD** (vs dejar la lógica preparada para recibir el nombre de un backend). Elegido: no hay backend de usuarios en este proyecto todavía; conectar a BD real queda fuera de scope y se aborda en un spec futuro cuando exista esa integración.
