# SPEC 19 — Barra de tabs translúcida en Android (claro y oscuro)

> **Estado:** Aprobado
> **Dependencias:** spec 05 (`ThemeContext`/`useTheme` con tokens light/dark; se le agrega
> token nuevo `tabBarBackground`), spec 10 (rama `Platform.OS === 'android'` de la tab bar en
> `app/(tabs)/_layout.tsx` y uso de `NativeTabs`), spec 14/15 (iconos SF/`md` de los triggers —
> no cambian).
> **Fecha:** 2026-09-02
> **Objetivo:** Hacer la barra de tabs **solo en Android** semi-transparente (color `rgba`,
> **sin blur nativo** — no existe en `NativeTabs` SDK 57) en temas claro y oscuro, dejando que el
> contenido de la pantalla se vea por detrás, sin tocar iOS.
>
> **Archivos que toca:**
>
> - `src/shared/context/ThemeContext.tsx` — token nuevo `tabBarBackground` (rgba) en
>   `ThemeColors`, `lightColors` y `darkColors`.
> - `app/(tabs)/_layout.tsx` — en Android, `backgroundColor` = `tabBarBackground`; ajuste de
>   `activeColor`/`inactiveColor` por legibilidad; `disableAutomaticContentInsets` en Android para
>   que el contenido pase por detrás. iOS intacto (sigue `DynamicColorIOS`).
> - `src/features/track/presentation/screens/TrackMain.tsx`, `app/(tabs)/search.tsx`
>   (`SearchScreen`), `src/features/profile/presentation/screens/ProfileMain.tsx` — padding
>   inferior manual (alto de la barra) en el contenedor scroll para que el contenido pase por
>   detrás sin quedar oculto de forma permanente.

## Alcance

**Dentro:**

- **Token de tema** `tabBarBackground` (color `rgba` semi-transparente) en `ThemeColors`, con
  valor para `lightColors` y `darkColors`. Aditivo — no toca tokens existentes.
- **`app/(tabs)/_layout.tsx` (solo rama Android):**
  - `backgroundColor` de `NativeTabs` = `tabBarBackground` (hoy `colors.surface` opaco).
  - Ajuste de `activeColor`/`inactiveColor` para legibilidad sobre fondo translúcido.
  - `disableAutomaticContentInsets` en Android para que el contenido de pantalla pase por detrás
    de la barra.
- **Contenido por detrás:** padding inferior manual (≈ alto de la barra) en el contenedor scroll
  de las 3 pantallas de tab (`TrackMain` FlatList, `SearchScreen`, `ProfileMain` ScrollView) para
  que el último ítem no quede oculto de forma permanente bajo la barra.
- **Ambos temas:** claro y oscuro, tomando el tono de `assets/menu_android.jpeg` (oscuro) y
  `assets/menu_android_light.jpeg` (claro).

**Fuera:**

- **iOS**: intacto. Sigue con `DynamicColorIOS` / Liquid Glass; no se toca su rama.
- **Blur real** / `expo-blur` / barra JS custom (era la opción (b), descartada).
- **Degradado/glow** del centro de las imágenes (`backgroundColor` solo acepta color sólido).
- **Adoptar el azul de Messenger** como color activo: se mantienen los tokens del tema
  (`text`/`tabInactive`), solo se ajusta contraste si hace falta.
- **Material You** / color dinámico del wallpaper.
- Cambios de **alto, forma, radios o posición** de la barra (no flotante, no pill nueva);
  `disableIndicator` se conserva.
- Persistencia, nuevos datos, o cambios a iconos/labels de los triggers.

## Modelo de datos

Sin datos ni persistencia nuevos. Único cambio de tipo: token aditivo en `ThemeColors`.

```ts
// src/shared/context/ThemeContext.tsx
export type ThemeColors = {
  // ...tokens existentes intactos (bg, bgSecondary, surface, text, tabInactive, ...)
  tabBarBackground: string; // rgba semi-transparente de la barra de tabs (Android)
};

// lightColors
tabBarBackground: 'rgba(249,250,251,0.80)'; // tono claro (bgSecondary @ 80%)

// darkColors
tabBarBackground: 'rgba(28,27,31,0.80)'; // tono oscuro (surface #1c1b1f @ 80%)
```

Notas:

- **Alpha 0.80** = balance translucidez vs. legibilidad. Ajustable en review si se quiere más/menos
  transparente (se valida en el simulador).
- Solo lo consume Android (`_layout.tsx`); iOS sigue con `DynamicColorIOS`. El token existe en
  ambas paletas por consistencia del tipo.

## Plan de implementación

Rama `spec-19-tab-bar-translucida-android` (autocreada). Cada paso deja `npx tsc --noEmit` verde y
la app arrancando.

1. **Token de tema.** En `ThemeContext.tsx`: agregar `tabBarBackground: string` a `ThemeColors`,
   con valor en `lightColors` (`rgba(249,250,251,0.80)`) y `darkColors` (`rgba(28,27,31,0.80)`).
   Paso aislado: nadie lo consume aún, no rompe nada.

2. **Barra translúcida (Android).** En `app/(tabs)/_layout.tsx`, en la rama Android, cambiar
   `backgroundColor` de `colors.surface` a `colors.tabBarBackground` (con el mismo fallback
   pre-hidratación → `lightColors.tabBarBackground`). iOS sin cambios (sigue `DynamicColorIOS`).
   Resultado: barra semi-transparente sobre el fondo de pantalla (el contenido aún no pasa por
   detrás).

3. **Contenido por detrás (Android).**
   - En `_layout.tsx`, pasar `disableAutomaticContentInsets` a los `<NativeTabs.Trigger>` **solo
     cuando `Platform.OS === 'android'`** (gate para no alterar el scroll de iOS), quitando el inset
     inferior automático para que la pantalla se extienda bajo la barra.
   - Añadir padding inferior manual (≈ alto de la barra) al contenedor scroll de las 3 pantallas:
     `contentContainerStyle` del `FlatList` en `TrackMain`, del `ScrollView` en `ProfileMain`, y del
     contenedor de `SearchScreen`. Constante compartida (p.ej. `TAB_BAR_HEIGHT`) afinable en el sim,
     solo Android. Evita que el último ítem quede permanentemente oculto.

4. **Legibilidad (Android).** Tras verlo en el sim, si el contraste flaquea sobre la barra
   translúcida, ajustar `activeColor`/`inactiveColor` de la rama Android (mantener tokens del tema
   `text`/`tabInactive`; subir contraste del inactivo o el alpha de la barra si hace falta). Puede
   quedar sin cambio si se ve bien.

5. **Verificación.** `npx tsc --noEmit` verde; probar en emulador/device Android en tema claro y
   oscuro (ver Criterios). Confirmar que iOS no cambió.

## Criterios de aceptación

- [ ] `ThemeColors` incluye `tabBarBackground`; `lightColors` y `darkColors` lo definen con un color
      `rgba` semi-transparente. Los tokens existentes quedan intactos.
- [ ] En **Android**, la barra de tabs se ve **semi-transparente** (no opaca) tanto en tema claro
      como oscuro, con el tono de las imágenes de referencia.
- [ ] En **Android**, el contenido de la pantalla se ve por detrás de la barra (o, si
      `BottomNavigationView` no lo permite, degrada a mostrar el fondo de pantalla — ver Riesgos; la
      translucidez se mantiene).
- [ ] El último ítem del listado de "Mis Rastreos" (y el contenido de Buscar/Perfil) **no queda
      oculto de forma permanente** bajo la barra: se puede desplazar hasta verlo completo.
- [ ] Los labels/iconos de la barra (activo e inactivo) son **legibles** sobre la barra translúcida
      en ambos temas.
- [ ] Alternar claro/oscuro/sistema en Apariencia (spec 05) actualiza el color de la barra
      correctamente.
- [ ] **iOS no cambia**: la barra sigue idéntica (Liquid Glass / `DynamicColorIOS`), sin regresión
      en scroll ni apariencia.
- [ ] Se conserva `disableIndicator` y no cambian iconos, labels, alto ni forma de la barra.
- [ ] `npx tsc --noEmit` pasa sin errores nuevos.

## Decisiones tomadas y descartadas

- **Mantener `NativeTabs`** (opción a del usuario) en vez de barra JS custom con `expo-blur`
  (opción b): cambio mínimo por props, conserva la barra Material nativa. Descartada la barra custom
  por ser cambio grande y perder lo nativo.
- **Color `rgba` sólido semi-transparente** en vez de blur real: `NativeTabs` SDK 57 no expone blur
  en Android (`blurEffect` es solo iOS); `backgroundColor` → `tabBarBackgroundColor` de
  `BottomNavigationView` solo acepta un `ColorValue`. Se aproxima el look con alpha.
- **Sin degradado/glow** del centro de las imágenes: `backgroundColor` no admite gradiente;
  replicar el degradado exigiría barra custom (descartada). Se toma el tono plano translúcido.
- **Token nuevo `tabBarBackground`** en el tema (en vez de hardcodear el rgba en `_layout.tsx`):
  respeta light/dark y el patrón de tokens aditivos (como `success` en spec 18).
- **Solo Android** (iOS intacto): iOS ya resuelve la barra con `DynamicColorIOS`/Liquid Glass; se
  aísla el cambio a la rama Android para no regresar iOS.
- **Mantener colores de tema para activo/inactivo** (`text`/`tabInactive`) en vez de adoptar el azul
  de Messenger de las imágenes: consistencia de marca; solo se ajusta contraste si la legibilidad lo
  exige.
- **Contenido por detrás vía `disableAutomaticContentInsets` + padding manual** (en vez de dejar el
  inset automático): es lo que permite que la translucidez muestre contenido; el padding evita
  ocultar el último ítem. Gateado a Android para no tocar el scroll de iOS.
- **Alpha 0.80 como default afinable en el simulador** (decisión del usuario: lo valida en el test):
  valor de arranque, no definitivo.

## Riesgos identificados

| #   | Riesgo                                                                                                                                                                                                                                 | Mitigación                                                                                                                                                                                                 |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | `BottomNavigationView` (Material) no dibuja el contenido por detrás de la barra (lo deja arriba), así que la translucidez muestra el fondo de pantalla en vez de contenido vivo. Límite de `NativeTabs`, no resoluble sin salir de él. | Aceptado: se verifica en device; si ocurre, la barra sigue translúcida sobre el fondo (degradación documentada en Alcance/Criterios). El "content-behind" real solo llegaría con la opción (b) descartada. |
| R2  | `backgroundColor` con alpha no se respeta en `BottomNavigationView` (algunas versiones lo compositan sobre su elevación/scrim y se ve opaco).                                                                                          | Verificar en el sim; si pasa, probar quitar elevación/scrim vía `unstable_nativeProps` o subir el alpha; si no, documentar como no soportado en esta versión.                                              |
| R3  | Legibilidad: con la barra translúcida y contenido detrás, activo/inactivo pierden contraste en algún fondo.                                                                                                                            | Paso 4 del plan ajusta `activeColor`/`inactiveColor` o sube el alpha; validación visual en ambos temas.                                                                                                    |
| R4  | `TAB_BAR_HEIGHT` mal calculado deja el último ítem oculto o con hueco excesivo.                                                                                                                                                        | Constante afinable en el sim; verificar que el último ítem se ve completo al hacer scroll en las 3 pantallas.                                                                                              |
| R5  | `disableAutomaticContentInsets` afecta otros insets (top/side) al desactivar el `SafeAreaView` automático en Android.                                                                                                                  | Gatear solo Android; si aparece contenido bajo la status bar, aplicar el inset superior manualmente en las pantallas.                                                                                      |
