# Buscar — Rediseño Liquid Glass (iOS)

## Header

- **Estado:** Aprobado
- **Dependencias:** spec 01 (sistema `GlassView`/`GlassCard`/`GlassButton`/`GlassHeader`), spec 05 (tema `useTheme()`), spec 08 (navegación a Rastrear tras búsqueda).
- **Fecha:** 2026-08-05
- **Objetivo (una frase):** Rediseñar **solo la capa visual** de la pantalla Buscar en iOS aplicando el material Liquid Glass del spec 01 (input glass, botón ✕, pill de feedback y bloque "Cómo obtener la URL"), sin tocar la lógica de búsqueda ni introducir Decodo/validación.

## Contexto

`docs/ux_spec.md` (sección **Search Screen → iOS — Liquid Glass Design**) define el Buscar con material Liquid Glass: input frosted, ✕ para limpiar, pill de feedback glass y un bloque "💡 Cómo obtener la URL". El `SearchScreen.tsx` actual no refleja nada de eso: es un `TextInput` con borde plano + botón sólido "Ir", con feedback binario (duplicado / hint estático). El spec 01 construyó el sistema Liquid Glass reutilizable pero dejó su aplicación a pantallas reales para un spec futuro — este es ese spec, acotado a Buscar.

## Scope

**Incluye:**
- Nuevos componentes en `src/components/search/`: `SearchUrlInput`, `SearchFeedback`, `SearchHelp`, componiendo los componentes glass de `src/shared/components/glass/`.
- `SearchUrlInput`: input glass (icono 🔗 + `TextInput` + botón ✕ para limpiar, visible solo con texto). Placeholder "🔗 Pega URL de Mercadolibre".
- `SearchFeedback`: pill glass (cápsula) debajo del input, con icono + color por `type` (`error` | `warning` | `loading` | `success` | `hint`). En este spec solo se renderizan `warning` (URL duplicada) y `hint` (mensaje por defecto); los demás tipos quedan soportados en la API para el spec futuro de la máquina de estados.
- `SearchHelp`: divider + bloque "💡 Cómo obtener la URL" con el texto del ux_spec.
- Reescribir el markup de `SearchScreen.tsx`: título grande "Buscar Producto", contenido alineado arriba (large-title iOS), componiendo los 3 componentes nuevos. Se conserva intacta la lógica existente (`handleSearch`, autofocus, providers).
- Fallback correcto en Android / iOS <26: `GlassView` cae a `View` plano (`bgSecondary` + borde `border`), legible en light y dark.

**No incluye (queda para otro spec):**
- Integración Decodo, validación de formato/dominio de URL (solo Mercadolibre México), y la máquina de estados completa: loading (`Verificando producto...`), no disponible, lista llena (5/5), success con auto-navegación.
- Comportamiento de teclado del ux_spec (pegar → 1 s debounce → teclado abre solo). Se **conserva** el autofocus de 100 ms actual.
- Cambios en la lógica de negocio (`SearchContext`, dedupe, `router.push('/track')`).
- Rediseño Material Design 3 de Android (solo se garantiza el fallback plano; MD3 queda a futuro).
- Banner AdMob del ux_spec.
- Tokens de color nuevos en `ThemeContext` (verde success / naranja warning) — se usan constantes locales.

## Data model / Tipos

Sin datos ni persistencia nuevos. Solo interfaces de props en TypeScript:

```ts
// src/components/search/SearchUrlInput.tsx
export interface SearchUrlInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  inputRef?: React.RefObject<TextInput>;
  editable?: boolean; // default true
}

// src/components/search/SearchFeedback.tsx
export type SearchFeedbackType = 'error' | 'warning' | 'loading' | 'success' | 'hint';
export interface SearchFeedbackProps {
  type: SearchFeedbackType;
  message: string;
}

// src/components/search/SearchHelp.tsx  (sin props)
```

## Implementation plan

Branch: `spec-09-buscar-liquid-glass`. Cada paso deja `npx tsc --noEmit` verde.

1. **`SearchUrlInput`.** Crear `src/components/search/SearchUrlInput.tsx`. Compone `GlassView` (de `../../shared/components/glass`) con `style` que incluye `borderRadius: 14`, `borderWidth: StyleSheet.hairlineWidth`, `borderColor: colors.border`, `flexDirection: 'row'`, `alignItems: 'center'`, padding horizontal — el `borderWidth` explícito hace visible el borde tanto en glass como en el fallback plano. Dentro: icono `link-outline` (Ionicons), `TextInput` (reenvía `value`/`onChangeText`/`onSubmitEditing=onSubmit`/`editable`/`inputRef`, con `keyboardType="url"`, `autoCapitalize="none"`, `returnKeyType="search"`, `placeholder="🔗 Pega URL de Mercadolibre"`, `placeholderTextColor={colors.textMuted}`, texto `colors.text`), y botón ✕ (`Pressable` plano, `onPress=onClear`, visible solo si `value` no está vacío).
2. **`SearchFeedback`.** Crear `src/components/search/SearchFeedback.tsx`. Compone `GlassView` como cápsula (`borderRadius: 999`, padding H 14 / V 8, row, gap 6). Mapa local `type → { icon, color }`: `error`/`warning` → `colors.danger` (warning documentado como `#FF9500` en ux_spec, se usa naranja local), `success` → `#34C759`, `loading`/`hint` → `colors.textMuted`. Renderiza icono + `Text` con el `message`.
3. **`SearchHelp`.** Crear `src/components/search/SearchHelp.tsx`. Divider (`borderTopWidth: StyleSheet.hairlineWidth`, `colors.border`) + título "💡 Cómo obtener la URL:" + cuerpo "Abre Mercadolibre → encuentra un producto → copia la URL desde el navegador o app". Texto `colors.textMuted`.
4. **Barrel export.** `src/components/search/index.ts` reexporta los 3 componentes y sus tipos.
5. **Reescribir `SearchScreen.tsx`.** Conservar imports y toda la lógica (`useSearch`, `useTheme`, `useRouter`, `useFocusEffect` con autofocus 100 ms, `handleSearch` completo). Reemplazar el markup por: `KeyboardAvoidingView` (contenido alineado arriba, `paddingTop` para large title) > `Text` título "Buscar Producto" (28–34 px, weight 700, `colors.text`) > `<SearchUrlInput …>` > `<SearchFeedback type={duplicate ? 'warning' : 'hint'} message={…} />` > `<SearchHelp />`. Eliminar el botón sólido "Ir" (el submit ocurre por teclado y el ✕ limpia).
6. **Verificación final.** `npx tsc --noEmit` sin errores; verificación manual en iOS 26+ y fallback en Android/iOS<26 (ver sección de verificación).

## Acceptance criteria

- [ ] Existen `src/components/search/SearchUrlInput.tsx`, `SearchFeedback.tsx`, `SearchHelp.tsx` e `index.ts`.
- [ ] `SearchScreen.tsx` usa los 3 componentes nuevos; ya no hay `TextInput` plano ni botón "Ir" inline.
- [ ] La lógica se conserva: URL nueva → `addSearch` + `router.push('/track')`; URL duplicada → pill `warning`; ✕ limpia el input.
- [ ] `npx tsc --noEmit` pasa sin errores nuevos.
- [ ] En iOS 26+, input y pill de feedback muestran material Liquid Glass real (no placeholder).
- [ ] En Android / iOS <26, el input cae a `View` plano (`bgSecondary` + borde `border`) legible en light y dark, siguiendo `effectiveScheme` al alternar tema.
- [ ] El bloque "💡 Cómo obtener la URL" es visible bajo el feedback.

## Decisiones tomadas y descartadas

- **Solo visual (vs incluir máquina de estados / Decodo):** el usuario acotó el spec al rediseño visual; loading/no-disponible/lista-llena/success y la integración real quedan para specs posteriores. `SearchFeedback` ya expone todos los `type` para no rehacer su API después.
- **Conservar autofocus 100 ms (vs debounce del ux_spec):** el usuario prefirió no cambiar el comportamiento de teclado actual; el debounce "pegar → 1 s → teclado" se descarta en este spec.
- **Componentes en `src/components/search/` (vs `src/features/search/presentation/components/`):** decisión del usuario de ubicarlos bajo `src/components/`. Nota: los componentes glass viven en `src/shared/components/glass/`.
- **Quitar el botón "Ir" (vs conservarlo):** el mock iOS del ux_spec no muestra botón; el submit va por teclado (`returnKeyType`/`onSubmitEditing`) y el ✕ limpia. Descartado conservarlo para un look glass más limpio.
- **Constantes de color locales para success/warning (vs tokens de tema):** `ThemeContext` no tiene verde ni naranja; se usan valores locales del ux_spec para no ampliar el tema en un spec visual acotado.
- **`borderWidth` explícito en el `style` del input:** el fallback de `GlassView` no aplica `borderWidth` por sí solo, así que se pasa en `style` para que el borde se vea en glass y en fallback.

## Verificación end-to-end

1. `npx tsc --noEmit` → verde.
2. iOS 26+ simulator: abrir tab Buscar → input y pill muestran Liquid Glass real. Escribir texto → aparece ✕ → tocar ✕ limpia. Pegar una URL, enviar, volver a pegar la misma → pill `warning` "URL ya agregada anteriormente". URL nueva → navega a Rastrear (`/track`).
3. Android (o iOS <26): mismos flujos con fallback plano (`bgSecondary` + borde); alternar tema light/dark en Apariencia y confirmar que input/pill siguen `effectiveScheme` y son legibles.
4. Confirmar que el bloque "💡 Cómo obtener la URL" aparece bajo el feedback y el título grande dice "Buscar Producto".

## Riesgos identificados

- **Sin Mac/dispositivo iOS 26+ local:** la verificación del material glass real depende de la máquina remota del usuario (mismo riesgo que spec 01).
- **`GlassHeader`/texto glass sin color de tema automático:** al componer, pasar `colors.text`/`colors.textMuted` explícitos para evitar texto negro en dark mode.
