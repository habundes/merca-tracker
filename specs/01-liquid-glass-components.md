# Sistema de componentes Liquid Glass (iOS 26+)

## Header

- **Estado:** Aprobado
- **Dependencias:** ninguna (proyecto base ya tiene Expo SDK 57, React Navigation instalado pero fuera de scope aquí)
- **Fecha:** 2026-07-31
- **Objetivo (una frase):** Crear un sistema de componentes reutilizables (`GlassView`, `GlassCard`, `GlassButton`, `GlassHeader`) que apliquen el material Liquid Glass nativo de iOS 26+ vía `expo-glass-effect`, sin tocar navegación ni pantallas existentes.

## Scope

**Incluye:**
- Configurar `expo-glass-effect` (~57.0.1, compatible con Expo SDK 57 ya instalado).
- Crear carpeta `src/components/glass/` con 4 componentes: `GlassView`, `GlassCard`, `GlassButton`, `GlassHeader`.
- Cada componente detecta si Liquid Glass está disponible (`isLiquidGlassAvailable()` o equivalente de la librería) y hace **render passthrough** (View plano sin efecto) si no lo está — sin crashear en iOS <26, Android o Web.
- Barrel export `src/components/glass/index.ts`.
- Actualizar `app.json` si `expo-glass-effect` requiere config plugin.
- Uso de demostración temporal: envolver un bloque existente de `HomeScreen` en `GlassCard` únicamente para verificación visual manual (no rediseño de la pantalla).

**No incluye (queda para otro spec):**
- Rediseño de `BottomTabs` / navegación con glass real (tab bar, headers de navegación).
- Soporte glass-like (blur) para Android o Web — quedan como están (Android → Material Design a futuro; Web sin cambios).
- Fallback visual "glass-like" con blur para iOS <26 — en ese rango solo se garantiza que no rompe (passthrough plano), sin intento de imitar el efecto.
- Theming global (dark mode, tokens de color) más allá de lo mínimo para que los componentes compilen.

## Data model / Tipos

No hay persistencia ni datos de negocio nuevos. Se definen únicamente interfaces de props en TypeScript:

```ts
// src/components/glass/GlassView.tsx
export interface GlassViewProps extends ViewProps {
  glassStyle?: 'regular' | 'clear'; // mapea a expo-glass-effect
  tintColor?: string;
  isInteractive?: boolean;
}

// src/components/glass/GlassCard.tsx
export interface GlassCardProps extends GlassViewProps {
  padding?: number; // default 16
  borderRadius?: number; // default 20
}

// src/components/glass/GlassButton.tsx
export interface GlassButtonProps extends GlassViewProps {
  onPress: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

// src/components/glass/GlassHeader.tsx
export interface GlassHeaderProps extends GlassViewProps {
  title: string;
}
```

Todos reexportados desde `src/components/glass/index.ts`.

## Implementation plan

1. **VAlidar dependencia.** `npx expo install expo-glass-effect` dentro de `mobile-app/mobile-app`. Verificar que quede fijada en `package.json` (~57.0.1, matcheando SDK 57).
2. **Confirmar API real instalada.** Leer los tipos en `node_modules/expo-glass-effect` (`.d.ts`) para confirmar nombres exactos de componente/props/helper de disponibilidad antes de escribir los wrappers (la API pública puede diferir levemente de la documentación pública).
3. **Config nativa.** Si la librería requiere config plugin, agregarlo a `app.json` bajo `expo.plugins`. Sistema queda funcional (app sigue arrancando en Android/Web) tras este paso.
4. **`GlassView`.** Wrapper base: si `isLiquidGlassAvailable()` (o el helper real) es `true` y `Platform.OS === 'ios'`, renderiza el componente nativo de glass; si no, renderiza `View` plano con los mismos `style`/`children`. Sistema queda funcional y probable de importar sin crashear en cualquier plataforma.
5. **`GlassCard`.** Compone `GlassView` agregando `padding`/`borderRadius` por defecto.
6. **`GlassButton`.** Compone `GlassView` + `Pressable`, maneja estado `pressed`/`disabled` con opacidad reducida.
7. **`GlassHeader`.** Compone `GlassView` + `Text` para el título, pensado para uso futuro en headers custom.
8. **Barrel export.** `src/components/glass/index.ts` reexporta los 4 componentes y sus tipos de props.
9. **Demo visual temporal.** En `src/screens/HomeScreen.tsx`, envolver un bloque existente en `<GlassCard>` solo para verificar visualmente en Simulator/dispositivo iOS 26+. Se documenta que este uso es temporal/demostrativo (no rediseño final de la pantalla).
10. **Verificación final.** `tsc --noEmit` sin errores. App corre en iOS 26+ simulator mostrando el glass real en `HomeScreen`, y sigue corriendo sin crash en Android/Web (passthrough).

## Acceptance criteria

- [ ] `expo-glass-effect` instalado y listado en `package.json` con versión compatible con Expo SDK 57.
- [ ] Existen los 4 archivos: `src/components/glass/GlassView.tsx`, `GlassCard.tsx`, `GlassButton.tsx`, `GlassHeader.tsx`, más `index.ts`.
- [ ] `tsc --noEmit` pasa sin errores nuevos.
- [ ] En un dispositivo/simulador iOS 26+, el `GlassCard` de demo en `HomeScreen` muestra el material Liquid Glass real (no un placeholder).
- [ ] En Android y Web, la app sigue arrancando y renderizando sin crash (los componentes glass caen a `View` plano).
- [ ] Ningún archivo de `src/navigation/` fue modificado.

## Decisiones tomadas y descartadas

- **`expo-glass-effect` nativo (opción a) en vez de `expo-blur` con fallback (opción c):** se descarta el fallback con blur porque el usuario definió que versiones de iOS <26 son scope de otro spec — no se busca imitar el efecto ahí, solo no romper.
- **`src/components/glass/` en vez de `src/ui/`:** sigue el patrón ya existente en el proyecto (`src/context`, `src/navigation`, `src/screens`), cada dominio en su propia carpeta.
- **Navegación fuera de scope:** el usuario decidió explícitamente dejar la aplicación del glass en `BottomTabs`/headers para un spec futuro; este spec solo entrega el sistema de componentes reutilizable.
- **Passthrough sin intento de imitar el efecto en plataformas no soportadas:** evita duplicar lógica de blur que luego se descartaría al abordar Android/iOS viejo en specs futuros.

## Riesgos identificados

- **API pública de `expo-glass-effect` puede no coincidir exactamente con lo documentado** (paquete relativamente nuevo) → mitigado en el paso 2 del plan de implementación (leer tipos reales antes de codear).
- **Sin acceso a Mac/dispositivo iOS 26+ local** (el usuario prueba en otra máquina) → la verificación visual del criterio de aceptación depende de esa máquina remota.
