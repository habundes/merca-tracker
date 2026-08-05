# Mercadolibre Price Tracker — UX Specification

**Project:** Mobile app (iOS & Android) — Fast & Intuitive UI
**Goal:** Users prefer the app over Mercadolibre's own app/website for price monitoring
**Key Differentiator:** Everything visible at a glance — no tedious navigation
**Last Updated:** May 29, 2026

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Auth Flow](#auth-flow-first-launch--returning-users)
3. [Navigation Structure](#navigation-structure)
4. [Search Screen](#search-screen)
5. [Tracklist Screen](#tracklist-screen)
6. [Card Expandable](#card-expandable)
7. [Swipe Actions](#swipe-actions)
8. [Configure Mode Screen](#configure-mode-screen)
9. [URL Input UX](#url-input-ux)
10. [Notifications UX](#notifications-ux)
11. [Platform Differences (iOS vs Android)](#platform-differences-ios-vs-android)
12. [Empty States](#empty-states)
13. [Error States](#error-states)
14. [Ad Placement](#ad-placement)
15. [Onboarding Flow](#onboarding-flow-first-login--after-sign-up)
16. [Performance Requirements](#performance-requirements)

---

## Design Philosophy

### Why users should prefer this app over Mercadolibre

| Mercadolibre App/Web | This App |
|---------------------|---------|
| No price change alerts | ✅ Instant push notifications |
| Must manually revisit product | ✅ Price history visible at a glance |
| Tedious navigation to find price | ✅ All info on one card |
| No price trend indicator | ✅ 📉 📈 ➡️ at a glance |
| Multiple taps to get to product | ✅ Swipe for instant actions |
| No check history | ✅ Last 5 checks inline on card |

### Core UX Principles
- **Zero unnecessary taps** — most actions reachable in 1-2 gestures
- **Price is always prominent** — large, readable, with change indicator
- **History visible without navigating** — expand card inline
- **Swipe = action** — no hunting for buttons
- **Fast loading** — cached data shown instantly, fresh data loads behind

---

## Navigation Structure

### Bottom Tab Navigation

3 tabs con **icono + label**, primer screen al abrir es **Buscar** (`initialRouteName: 'search'`).
Implementado con el `<Tabs>` JS de Expo Router (react-navigation bottom-tabs), no con tabs nativos.

```
iOS y Android (mismo orden y layout):
┌─────────────────────────────────┐
│                                 │
│         [Screen Content]        │
│                                 │
├─────────────────────────────────┤
│   📋     │    🔍     │    👤   │
│ Rastrear   Buscar     Perfil    │
└─────────────────────────────────┘
   track      search    profile
```

Iconos (Ionicons, cross-platform — no SF Symbols ni Material Symbols nativos):

| Tab | activo (filled) | inactivo (outline) |
|-----|-----------------|--------------------|
| Rastrear (`track`)  | `list`   | `list-outline`   |
| Buscar (`search`)   | `search` | `search-outline` |
| Perfil (`profile`)  | `person` | `person-outline` |

Estado activo: **icono filled + tint** (`colors.accent`, del tema). Sin indicator pill.

Tab bar por plataforma:
  - **iOS:** fondo translúcido vía `GlassView` (Liquid Glass en iOS 26; cae a vista plana en iOS<26).
    No es el `UITabBarController` nativo — aproximación con el sistema Glass del proyecto.
  - **Android / Web:** barra opaca (`backgroundColor: colors.bgSecondary` + borde superior).
    No es `NavigationBar` MD3 nativo; sin indicator pill.

### App Structure

Refleja la estructura real en `app/` (Expo Router, file-based). Nombres de ruta ≡ carpetas.

```
app/
├── _layout.tsx                 ← Root: ThemeProvider > SearchProvider > StatusBar + <Stack headerShown:false>
├── index.tsx                   ← Redirect → /search
└── (tabs)/
    ├── _layout.tsx             ← <Tabs> Ionicons, initialRouteName: 'search'
    │
    ├── track/                  ← Tab 1: 📋 "Rastrear"  (list-outline)
    │   ├── _layout.tsx         ← <Stack> con headers temáticos
    │   ├── index.tsx           ← "Mis rastreos" (stack de cards)
    │   ├── config.tsx          ← "Configurar rastreo"
    │   └── [itemId].tsx        ← "Detalle" (ruta dinámica)
    │
    ├── search.tsx              ← Tab 2: 🔍 "Buscar" (search-outline) — pantalla inicial
    │
    └── profile/                ← Tab 3: 👤 "Perfil" (person-outline)
        ├── _layout.tsx         ← <Stack> con headers temáticos
        ├── index.tsx           ← "Perfil"
        ├── account.tsx         ← "Ajustes de cuenta"
        ├── payment.tsx         ← "Ajustes de pago"
        └── appearance.tsx      ← "Apariencia" (theme mode: light/dark/system)
```

Notas:
- `initialRouteName: 'search'` en `(tabs)/_layout.tsx` → **Search** es la pantalla al abrir.
- `app/index.tsx` redirige a `/search` para arranques que caen en la raíz.
- Cada `.tsx` de pantalla re-exporta el screen desde `src/features/{track,search,profile}/presentation/screens/`.
- Configurar rastreo es una ruta dentro del stack de `track/` (no modal ni tab).
- Providers en root: `ThemeProvider` (mode + colors, persist AsyncStorage), `SearchProvider` (historial de URLs en memoria).

### Navigation Flow After Successful Product Add

```
User on Search tab (Tab 1)
    ↓
Pastes URL → keyboard opens after 1s → taps Enter
    ↓
Keyboard closes → validation → Decodo confirms
    ↓
Product added to DB
    ↓
✅ "iPhone 15 Pro agregado!" (brief message below input)
    ↓
App auto-navigates to Tracklist tab (Tab 2)
    ↓
New product at TOP of stack, card pre-expanded
    ↓
User configures mode directly from expanded card
```

---

## Search Screen

Dedicated screen for adding products. No product list here — only URL input, feedback, and ads (free tier).
**First screen shown on app launch.**

---

### iOS — Liquid Glass Design

```
┌──────────────────────────────────┐
│                                  │  ← Dynamic Island / Status bar
│   Buscar Producto                │  ← Large title (SF Pro Display)
│                                  │
│  ╔════════════════════════════╗  │
│  ║ 🔗 Pega URL de Mercado... ║  │  ← Liquid Glass input field
│  ╚════════════════════════════╝  │    frosted glass effect, blur bg
│                                  │
│  [feedback message area]         │  ← below input (error/loading/success)
│                                  │
│  ─────────────────────────────   │
│  💡 Cómo obtener la URL:         │
│  Abre Mercadolibre → encuentra   │
│  un producto → copia la URL      │
│  desde el navegador o app        │
│                                  │
│                                  │
│                                  │
│                                  │
├──────────────────────────────────┤
│ 📢 [AdMob Banner — free only]    │  ← Fixed bottom, above tab bar
├──────────────────────────────────┤
│    🔍    │    📋    │    👤      │  ← Native tab bar (Liquid Glass)
└──────────────────────────────────┘

Liquid Glass elements:
  - Input field: frosted glass with blur background
  - Tab bar:     translucent glass (iOS 26 native)
  - Cards:       glass material with subtle border
  - Feedback:    subtle glass pill below input
```

### Android — Material Design 3

```
┌──────────────────────────────────┐
│ Buscar Producto                  │  ← TopAppBar (Medium)
│                                  │
│  ┌────────────────────────────┐  │
│  │ 🔗 Pega URL de Mercado... │  │  ← Outlined TextField (MD3)
│  └────────────────────────────┘  │
│                                  │
│  [feedback message area]         │
│                                  │
│  ─────────────────────────────   │
│  💡 Cómo obtener la URL:         │
│  Abre Mercadolibre → encuentra   │
│  un producto → copia la URL      │
│                                  │
│                                  │
│                                  │
│                                  │
├──────────────────────────────────┤
│ 📢 [AdMob Banner — free only]    │  ← Fixed bottom, above nav bar
├──────────────────────────────────┤
│    🔍    │    📋    │    👤      │  ← Material 3 Bottom Navigation
└──────────────────────────────────┘

Material 3 elements:
  - Input field:  Outlined TextField with rounded corners
  - Top bar:      MediumTopAppBar with scroll behavior
  - Tab bar:      NavigationBar (MD3) with indicator pills
  - Feedback:     Filled Chip or SnackBar below input
```

---

### All Input States

```
Default (empty):
┌────────────────────────────────┐
│ 🔗 Pega URL de Mercadolibre   │
└────────────────────────────────┘


URL pasted (keyboard not open yet):
┌────────────────────────────────┐
│ https://articulo.mercadolib... │ ✕ │
└────────────────────────────────┘


After 1 second → keyboard opens automatically:
┌────────────────────────────────┐
│ https://articulo.mercadolib... │ ✕ │
└────────────────────────────────┘
[Keyboard open — user taps Enter/Enviar]


User taps Enter → keyboard closes → validation error:
┌────────────────────────────────┐
│ https://amazon.com/...         │ ✕ │
└────────────────────────────────┘
  ⚠️ Solo URLs de Mercadolibre México.


User taps Enter → keyboard closes → loading:
┌────────────────────────────────┐
│ https://articulo.mercadolib... │ ✕ │  ← input disabled
└────────────────────────────────┘
  ⏳ Verificando producto...


Product unavailable:
┌────────────────────────────────┐
│ https://articulo.mercadolib... │ ✕ │
└────────────────────────────────┘
  ❌ Este producto ya no está disponible en Mercadolibre.


Already tracking:
┌────────────────────────────────┐
│ https://articulo.mercadolib... │ ✕ │
└────────────────────────────────┘
  ⚠️ Ya estás rastreando este producto.


Tracklist full (input disabled):
┌────────────────────────────────┐
│ 🔗 Pega URL de Mercadolibre   │  ← disabled, grayed out
└────────────────────────────────┘
  ⚠️ Lista llena (5/5). Ve a Tracklist para eliminar un producto.


✅ Success → auto-navigate to Tracklist tab:
┌────────────────────────────────┐
│ 🔗 Pega URL de Mercadolibre   │  ← clears immediately
└────────────────────────────────┘
  ✅ iPhone 15 Pro agregado!
→ App switches to Tracklist tab, new product at top, expanded
```

---

## Tracklist Screen

Shows all tracked products as a stack — **newest product always on top**.
No URL input here — that lives in the Search screen.

### Layout Overview

```
iOS:
┌──────────────────────────────┐
│ Tracklist           👤 ⚙️    │  ← Header
├──────────────────────────────┤
│ 📋 Rastreando 3/5 · 1/2 🔄  │  ← Status bar
├──────────────────────────────┤
│                              │
│  [Card 1 — newest, expanded] │  ← Most recently added, pre-expanded on arrival
│  [Card 2 — collapsed]        │
│  [Ad — Native]               │  ← Every 3rd item
│  [Card 3 — collapsed]        │
│                              │
├──────────────────────────────┤
│ 📢 [AdMob Banner]            │  ← Fixed bottom banner (free)
└──────────────────────────────┘

Products ordered by: created_at DESC (newest at top of stack)

When arriving from Search (new product added):
  - Scroll position resets to top automatically
  - New product card is at top, pre-expanded
  - Rest of cards collapsed below
```

### Status Bar Variations
```
Free tier, no products:
│ 📋 Sin productos · Agrega hasta 5     │

Free tier, slots used:
│ 📋 Rastreando 5/5 · 2/2 🔄 (lleno)   │

Premium tier:
│ ⭐ Rastreando 8/20 · 3/20 🔄          │

Downgraded (hidden products):
│ 📋 Rastreando 2/5 · 15 ocultos 👁    │  ← tap to see upgrade prompt
```

---

## Card Expandable

Each product card has two states: **collapsed** and **expanded**.
Only one card can be expanded at a time. Tapping another card collapses the current one.

---

### Collapsed Card

Shows essential info at a glance — no taps needed.

```
iOS (collapsed):
┌──────────────────────────────────┐
│ 🖼  iPhone 15 Pro                 │  ← Product image (if available)
│     TechStore MX                 │  ← Seller name
│                                  │
│  $749       📉 -$150             │  ← Current price (large) + change
│  ↓ hace 2 hrs · próx: 22 hrs    │  ← Last check time + next check countdown
└──────────────────────────────────┘
   ↑ tap anywhere to expand

Price change indicator variants:
  $749  📉 -$150  (dropped — green price, red badge)
  $949  📈 +$200  (increased — red price, orange badge)
  $899  ➡️        (no change — gray)
  $899  ⏸ pausado  (wish price triggered — yellow)
  $899  ⚠️ no disp. (unavailable — gray strikethrough)
  $899  ⏳ manual   (manual mode — no next check shown)
```

---

### Expanded Card

Tapping the card reveals full history + actions inline — **no screen navigation needed**.

```
iOS (expanded):
┌──────────────────────────────────┐
│ 🖼  iPhone 15 Pro                 │
│     TechStore MX                 │
│                                  │
│  $749       📉 -$150             │
│  ↓ hace 2 hrs · próx: 22 hrs    │
│ ──────────────────────────────── │  ← divider appears on expand
│                                  │
│  Historial de checks:            │
│  ● May 30 2:00PM  $749  📉       │  ← Most recent first
│  ● May 29 2:00PM  $899  ➡️       │
│  ● May 28 2:00PM  $899  ➡️       │
│  ● May 27 2:00PM  $899  📈       │
│  ● May 26 2:00PM  $799  ➡️       │  ← Last check (5 max for free)
│                                  │
│  Modo: Intervalo 24hrs           │  ← Current mode summary
│                                  │
│  [Check Ahora]  [Configurar]     │  ← Action buttons
│  [Ver en Mercadolibre →]         │  ← External link (opens ML)
│                                  │
└──────────────────────────────────┘
   ↑ tap header to collapse

Check Now button states:
  [Check Ahora]           → available (2 checks left today)
  [Check Ahora (1/2)]     → 1 of 2 checks used
  [Ver ad → +1 check]     → limit reached, reward ad available
  [Límite alcanzado ⏰]   → limit reached, no reward ad option

Wish price paused state:
  $745  🎯 ¡Precio deseado alcanzado!
  ──────────────────────────────────
  Historial de checks:
  ● May 30  $745  🎯
  ● ...

  Modo: Wish Price (alcanzado)

  [Nuevo precio deseado]  [Eliminar]
```

---

### Card Transition Animation

```
Collapsed → Expanded:
  Duration: 250ms
  Easing: ease-out
  Height: animates from ~80px to full content height
  History items: fade in with 50ms stagger
  Divider: slides in

Expanded → Collapsed:
  Duration: 200ms
  Easing: ease-in
  Height: animates back to ~80px
  History: fade out instantly
```

---

## Swipe Actions

Swipe gestures for fast access without expanding the card.

---

### Swipe Left → Reveal Destructive + Check Actions

```
Swipe left on card:

┌────────────────────────────────────────┐
│ 🖼 iPhone 15 Pro  $749 📉              │░░░░░░░░░░│
│    TechStore MX   próx: 22hrs         │ 🔄      🗑 │
└────────────────────────────────────────┘░░░░░░░░░░│
                                          Check  Eliminar
                                          (blue) (red)

Full swipe left → triggers "Eliminar" with confirmation:
  "¿Eliminar iPhone 15 Pro del tracklist?"
  [Cancelar] [Eliminar]
```

**Swipe Left Actions:**
- 🔄 **Check Ahora** (blue) — triggers manual price check immediately
- 🗑 **Eliminar** (red) — removes product with confirmation dialog

---

### Swipe Right → Reveal Configure Action

```
Swipe right on card:

┌────────────────────────────────────────┐
│░░░░░░░│  🖼 iPhone 15 Pro  $749 📉     │
│ ⚙️    │    TechStore MX   próx: 22hrs  │
└────────────────────────────────────────┘
 Config
 (gray)

Full swipe right → opens Configure Mode screen directly
```

**Swipe Right Actions:**
- ⚙️ **Configurar** (gray) — opens Configure Mode screen

---

### Swipe Behavior Details

```
Threshold to reveal:     40px
Threshold for full swipe: 60% of card width
Haptic feedback:         light tap when threshold reached

iOS: Uses SwipeableRow / Reanimated 2
Android: Uses Swipeable from react-native-gesture-handler

Swipe disabled when:
  - Card is expanded (tap to collapse first)
  - Product is unavailable (⚠️ state)
```

---

### Swipe + Expanded Card Interaction

```
If card is expanded and user swipes:
  1. Card collapses first (animated, 200ms)
  2. Then swipe action triggers

This prevents accidental swipes while reading history.
```

---

## Configure Mode Screen

Accessed via:
- Swipe right on card
- "Configurar" button inside expanded card

```
iOS:
┌──────────────────────────────┐
│ ← Configurar                 │  ← back to tracklist
├──────────────────────────────┤
│ 🖼 iPhone 15 Pro              │
│ TechStore MX                 │
│ Precio actual: $749          │
├──────────────────────────────┤
│ MODO DE VERIFICACIÓN         │
│                              │
│ ✅ Manual                    │  ← always active, cannot disable
│    2/2 checks usados hoy     │
│    Resetea a medianoche      │
├──────────────────────────────┤
│ VERIFICACIÓN AUTOMÁTICA      │
│                              │
│ ○ Intervalo                  │  ← mutually exclusive
│   [12hrs]  [24hrs]           │
│   Slots disponibles: 1/2     │
│   [Activar Intervalo]        │
│                              │
│ ○ Precio Deseado             │  ← mutually exclusive
│   Target: [$_______]         │
│   Cada: [24hrs] (fijo free)  │
│   Slots disponibles: 1/2     │
│   [Activar Precio Deseado]   │
├──────────────────────────────┤
│ [Eliminar Producto 🗑]       │  ← destructive, shown at bottom
└──────────────────────────────┘

When auto slots are full (2/2):
│ VERIFICACIÓN AUTOMÁTICA      │
│ Slots activos: 2/2 🔒        │
│                              │
│ ○ Intervalo    [bloqueado]   │
│ ○ Precio Deseado [bloqueado] │
│                              │
│ Desactiva otro producto para │
│ activar la verificación aquí │

When interval is active:
│ ● Intervalo [activo]         │
│   Verificando cada 24 hrs    │
│   Próxima: May 31 2:00 PM   │
│   [Cambiar intervalo]        │
│   [Desactivar]               │

When wish price triggered:
│ ● Precio Deseado [alcanzado] │
│   🎯 $749 alcanzado!         │
│                              │
│   [Nuevo precio deseado]     │
│   [Eliminar producto]        │
```

---

## URL Input UX

The URL input bar is always visible at the top of the Tracklist screen.
Messages (errors, warnings, loading, success) appear **below** the input — never inside it.

### Interaction Flow

```
1. User pastes URL into input field (no keyboard needed to paste)
   ↓
2. URL appears in input
   ↓
3. After 1 second (debounce) → keyboard opens automatically
   ↓
4. User taps Enter / Send on keyboard
   ↓
5. Keyboard closes
   ↓
6. Frontend validation runs instantly
   ├─ Fails → error shown below input, nothing added
   └─ Passes → calls Decodo API
      ↓
7. Decodo validates product availability
   ├─ Unavailable → error shown below input, nothing added
   └─ Available → product auto-added to tracklist ✨
      ↓
8. Success message shown below input (2 seconds then fades)
9. Input clears automatically
10. New product card appears expanded in tracklist
```

---

### States & Mockups

```
Default (empty):
┌────────────────────────────────┐
│ 🔗 Pega URL de Mercadolibre   │
└────────────────────────────────┘


User pastes URL (no keyboard yet):
┌────────────────────────────────┐
│ https://articulo.mercadolib... │ ✕ │
└────────────────────────────────┘


After 1 second debounce → keyboard opens automatically:
┌────────────────────────────────┐
│ https://articulo.mercadolib... │ ✕ │
└────────────────────────────────┘
[Teclado del dispositivo abre — usuario toca Enter/Enviar]


User taps Enter → keyboard closes → validation error:
┌────────────────────────────────┐
│ https://amazon.com/...         │ ✕ │
└────────────────────────────────┘
  ⚠️ Solo URLs de Mercadolibre México.
  [Producto NO agregado]


User taps Enter → keyboard closes → Loading (Decodo):
┌────────────────────────────────┐
│ https://articulo.mercadolib... │ ✕ │
└────────────────────────────────┘
  ⏳ Verificando producto...
  [Input desactivado mientras carga]


Product unavailable:
┌────────────────────────────────┐
│ https://articulo.mercadolib... │ ✕ │
└────────────────────────────────┘
  ❌ Este producto ya no está disponible en Mercadolibre.
  [Producto NO agregado]


Already tracking:
┌────────────────────────────────┐
│ https://articulo.mercadolib... │ ✕ │
└────────────────────────────────┘
  ⚠️ Ya estás rastreando este producto.
  [Producto NO agregado]


Tracklist full (input disabled — no need to paste):
┌────────────────────────────────┐
│ 🔗 Pega URL de Mercadolibre   │  ← input disabled
└────────────────────────────────┘
  ⚠️ Lista llena (5/5). Elimina un producto para agregar otro.


Success — product auto-added:
┌────────────────────────────────┐
│ 🔗 Pega URL de Mercadolibre   │  ← input clears immediately
└────────────────────────────────┘
  ✅ iPhone 15 Pro agregado!      ← fades out after 2 seconds
[New product card appears expanded below]
```

---

### Debounce & Keyboard Behavior

```javascript
// React Native implementation
const inputRef = useRef(null);
const debounceTimer = useRef(null);

const handleInputChange = (text) => {
  setInputValue(text);

  // Clear previous timer
  if (debounceTimer.current) clearTimeout(debounceTimer.current);

  // After 1 second of no typing → open keyboard automatically
  debounceTimer.current = setTimeout(() => {
    inputRef.current?.focus(); // Opens keyboard after paste
  }, 1000);
};

const handleSubmit = () => {
  // Triggered by Enter / returnKeyType="send"
  Keyboard.dismiss(); // Closes keyboard
  validateAndAdd(inputValue);
};

<TextInput
  ref={inputRef}
  value={inputValue}
  onChangeText={handleInputChange}
  onSubmitEditing={handleSubmit}   // ← Enter / Send key triggers submit
  returnKeyType="send"             // ← Shows "Enviar" on keyboard
  blurOnSubmit={true}              // ← Keyboard closes on submit
  placeholder="Pega URL de Mercadolibre"
  editable={!isLoading && !isTracklistFull}
/>
```

---

### Message Styles

| Type | Icon | Color | Duration |
|------|------|-------|----------|
| Error | ❌ | Red `#FF3B30` (iOS) / `#F44336` (Android) | Until user edits input |
| Warning | ⚠️ | Orange `#FF9500` (iOS) / `#FF9800` (Android) | Until user edits input |
| Loading | ⏳ | Gray `#8E8E93` (iOS) / `#9E9E9E` (Android) | While Decodo loads |
| Success | ✅ | Green `#34C759` (iOS) / `#4CAF50` (Android) | 2 seconds then fades out |

---

### After Product Added

```
Input clears
    ↓
"✅ iPhone 15 Pro agregado!" shown below input (1 second)
    ↓
App auto-navigates to Tracklist tab
    ↓
New product card at TOP of stack, pre-expanded
    ↓
User configures mode directly from expanded card
```

---

## Notifications UX

### Notification Appearance (Lock Screen / Notification Center)

```
iOS Notification:
┌─────────────────────────────────┐
│  📱 ML Tracker                  │
│  iPhone 15 Pro 📉               │
│  Precio: $899 → $749 (-$150)    │
│  Hace un momento                │
└─────────────────────────────────┘

Android Notification:
┌─────────────────────────────────┐
│ 📱 ML Tracker    · ahora        │
│ iPhone 15 Pro 📉                │
│ $899 → $749 (-$150)             │
│  [Ver]                          │
└─────────────────────────────────┘
```

### Notification Tap Behavior

```
User taps notification
    ↓
App opens directly to that product card
    ↓
Card is pre-expanded showing check history
    ↓
Most recent check highlighted at top

Deep link: mltracker://product/:product_id
```

### Notification Types & Copy (Spanish)

| Scenario | Título | Cuerpo |
|----------|--------|--------|
| Price dropped | `iPhone 15 Pro 📉` | `Precio: $899 → $749 (-$150)` |
| Price increased | `iPhone 15 Pro 📈` | `Precio: $749 → $899 (+$150)` |
| Wish price reached | `🎯 ¡Precio deseado alcanzado!` | `iPhone 15 Pro ahora $749. Abre la app para continuar.` |
| Product unavailable | `⚠️ Producto no disponible` | `iPhone 15 Pro ya no está en Mercadolibre. Elimínalo de tu lista.` |
| Payment failed (monthly) | `⚠️ Pago fallido` | `Actualiza tu método de pago en las próximas 12 horas para mantener Premium.` |
| Payment failed (annual) | `⚠️ Pago fallido` | `Actualiza tu método de pago en las próximas 24 horas para mantener Premium.` |
| Premium expired | `📉 Premium terminado` | `Tu cuenta volvió a Free. 5 productos visibles. Suscríbete para restaurar todo.` |

---

## Platform Differences (iOS vs Android)

### iOS — Liquid Glass (iOS 26)

```
Design System: Apple Liquid Glass (iOS 26)

Navigation:
  - Native UITabBarController (3 tabs, icons only)
  - Tab bar: translucent Liquid Glass material (frosted)
  - No back button — swipe from left edge
  - Configure screen: modal sheet with glass background

Typography:
  - SF Pro Display — prices, large titles (bold)
  - SF Pro Text — labels, body text
  - SF Pro Rounded — numbers in cards

Colors:
  - Price dropped:    #34C759 (iOS system green)
  - Price increased:  #FF3B30 (iOS system red)
  - Neutral:          #8E8E93 (iOS system gray)
  - Primary action:   #007AFF (iOS system blue)
  - Wish price hit:   #FF9500 (iOS system orange)
  - Background:       system background (auto dark/light)

Liquid Glass elements:
  - Search input:    frosted glass field, subtle blur behind
  - Tab bar:         iOS 26 native translucent glass
  - Product cards:   glass material with subtle border + blur
  - Expanded card:   deeper glass with layered blur
  - Feedback pill:   glass capsule below search input
  - Modals/sheets:   glass background with vibrancy

Card Style:
  - Glass material background (not plain white)
  - Rounded corners (20px radius)
  - Subtle specular highlight on top edge
  - Drop shadow: soft, diffused

Status bar: automatic (dark/light based on content)

Haptics:
  - Card expand:      UIImpactFeedbackGenerator (.light)
  - Swipe threshold:  UIImpactFeedbackGenerator (.medium)
  - Swipe action:     UINotificationFeedbackGenerator (.success)
  - Delete confirm:   UINotificationFeedbackGenerator (.warning)
  - Success add:      UINotificationFeedbackGenerator (.success)
```

### Android — Material Design 3

```
Design System: Material Design 3 (Material You)

Navigation:
  - NavigationBar (MD3) — 3 tabs, icons + indicator pills
  - Active tab: filled icon + rounded indicator pill
  - Back gesture: swipe from left or bottom

Typography:
  - Google Sans / Roboto
  - Material type scale (Display, Headline, Body, Label)

Colors:
  - Price dropped:   #4CAF50 (Material green)
  - Price increased: #F44336 (Material red)
  - Neutral:         #9E9E9E (Material gray)
  - Primary action:  #1976D2 (Material blue)
  - Wish price hit:  #FF9800 (Material orange)
  - Surfaces: Material You dynamic color (auto from wallpaper)

MD3 Components:
  - Search input:   OutlinedTextField with rounded corners (28dp)
  - Tab bar:        NavigationBar with indicator pills
  - Product cards:  ElevatedCard (elevation: 2dp)
  - Expanded card:  ElevatedCard (elevation: 4dp)
  - Feedback:       FilledChip or Snackbar below input
  - Modals:         BottomSheet (MD3 style)
  - Top bar:        MediumTopAppBar with scroll behavior

Card Style:
  - ElevatedCard with rounded corners (16dp radius)
  - Surface color from Material You palette
  - State layer on press (ripple effect)
  - Dividers between card sections

Status bar: matches app bar color (MD3)

Ripple effects:
  - All touchable elements: Material ripple
  - Swipe reveals: MD3 swipe-to-dismiss

Haptics (VibrationEffect):
  - Card expand:     EFFECT_CLICK (10ms)
  - Swipe threshold: EFFECT_TICK (20ms)
  - Swipe action:    EFFECT_HEAVY_CLICK (50ms)
  - Success add:     EFFECT_DOUBLE_CLICK
```

### Feature Comparison Table

| Feature | iOS (Liquid Glass) | Android (Material 3) |
|---------|-------------------|---------------------|
| Tab bar | UITabBar (glass) | NavigationBar (MD3) |
| Input field | Glass field | OutlinedTextField |
| Cards | Glass material | ElevatedCard |
| Active tab | Filled icon + tint | Icon + indicator pill |
| Modals | Bottom sheet (glass) | BottomSheet (MD3) |
| Feedback | Glass pill | FilledChip / Snackbar |
| Dark mode | Automatic (system) | Dynamic color (MD3) |
| Haptics | UIImpactFeedback | VibrationEffect |

---

## Empty States

### No Products Yet

```
iOS:
┌──────────────────────────────┐
│                              │
│         📱                  │
│                              │
│   Tu tracklist está vacío   │
│                              │
│  Pega una URL de Mercado-   │
│  libre para empezar a       │
│  rastrear precios           │
│                              │
│  [Ver cómo funciona]        │  ← optional onboarding
│                              │
└──────────────────────────────┘

URL input: highlighted/pulsing to draw attention
```

### All Products Paused (Wish Prices Triggered)

```
┌──────────────────────────────┐
│ 🎯 ¡Todos los precios        │
│    deseados alcanzados!      │
│                              │
│ Configura nuevos precios     │
│ o agrega más productos       │
└──────────────────────────────┘
```

### Hidden Products (After Downgrade)

```
┌──────────────────────────────┐
│ 👁 15 productos ocultos      │
│                              │
│ Tienes 15 productos de       │
│ cuando eras Premium. No      │
│ fueron eliminados.           │
│                              │
│ [Restaurar con Premium]      │
└──────────────────────────────┘
```

---

## Error States

### Product Unavailable Card State

```
┌──────────────────────────────────┐
│ 🖼  ~~iPhone 15 Pro~~             │  ← strikethrough title
│     TechStore MX                 │
│                                  │
│  $---   ⚠️ No disponible         │  ← price hidden
│  Este producto ya no existe      │
│  en Mercadolibre                 │
│ ──────────────────────────────── │
│  [Eliminar Producto]             │  ← only action available
└──────────────────────────────────┘

Swipe actions disabled on unavailable cards
Card cannot be expanded to history
```

### No Internet Connection

```
Top of screen banner (not blocking):
┌──────────────────────────────┐
│ ⚡ Sin conexión               │
│    Mostrando datos guardados  │
└──────────────────────────────┘

Cards still show:
  - Last known price (cached)
  - Last check history (cached)
  - "Check Ahora" button disabled with tooltip: "Sin conexión"
```

### Rate Limit Reached (Free Tier)

```
In expanded card:
┌──────────────────────────────────┐
│  [Límite diario alcanzado 2/2]   │  ← gray, disabled
│  Resetea a medianoche            │
│                                  │
│  [Ver ad → +1 check hoy]         │  ← reward ad option
│  [Actualizar a Premium ⭐]       │  ← upsell
└──────────────────────────────────┘
```

---

## Ad Placement

Ads are designed to feel native and non-intrusive while maximizing revenue.

### Banner Ad
```
Position: Fixed bottom of screen, above safe area
Height: 50px (standard AdMob banner)
Always visible on tracklist screen
Slides up when keyboard appears (URL input)

iOS:                          Android:
┌──────────────────────┐     ┌──────────────────────┐
│ [Product Cards]      │     │ [Product Cards]      │
│                      │     │                      │
│ 📢 [Banner Ad]       │     │ 📢 [Banner Ad]       │
│ ▓▓▓▓▓ Home Bar ▓▓▓▓▓│     └──────────────────────┘
└──────────────────────┘
```

### Native Ad (In-Feed)
```
Appears every 3rd item in tracklist (only when 3+ products tracked)
Styled as a product card with "Patrocinado" label

┌──────────────────────────────────┐
│ Patrocinado                      │  ← small label
│ 🖼  Samsung Galaxy Tab S9        │
│     Amazon MX                    │
│  $8,999    Ver oferta →          │
└──────────────────────────────────┘

Cannot be expanded (no history)
Cannot be swiped (no actions)
Tapping opens external link
```

### Interstitial Ad
```
Trigger: Opening a product's Configure Mode screen
Frequency: Max once every 3 Configure opens (not every time)
Timing: Show BEFORE the Configure screen loads

Flow:
  User swipes right / taps Configure
      ↓
  Ad shows (full screen, 5 second countdown)
      ↓
  [X] or countdown completes
      ↓
  Configure screen opens

Interstitial NOT shown when:
  - User is responding to a wish price notification
  - First Configure open of the session
  - Premium users (never)
```

### Reward Ad
```
Trigger: User hits 2/2 daily manual check limit
Shown inside expanded card as optional button

Flow:
  User taps "Ver ad → +1 check hoy"
      ↓
  Reward ad plays (15-30 seconds, cannot skip)
      ↓
  AdMob confirms completion
      ↓
  App calls POST /api/user/products/:id/reward-check
      ↓
  Check executes, price shown in card history
      ↓
  Button updates to "Extra check usado ✅"

Available once per product per day
Resets at midnight UTC
```

---

## Interaction Summary

| Action | Gesture | Result |
|--------|---------|--------|
| See price history | Tap card | Card expands inline |
| Close history | Tap card again | Card collapses |
| Manual check | Swipe left → 🔄 | Check runs immediately |
| Delete product | Swipe left → 🗑 | Confirmation then delete |
| Configure mode | Swipe right → ⚙️ | Configure screen opens |
| Quick check from card | Expanded → [Check Ahora] | Check runs, history updates |
| Configure from card | Expanded → [Configurar] | Configure screen opens |
| Add product | Paste URL in top bar | Auto-validates + adds |
| Reward ad | Expanded → [Ver ad] | Ad plays → +1 check |

---

## Auth Flow (First Launch & Returning Users)

### First Launch — Welcome Screen

Shown only when no active session exists (new install or logged out).

```
iOS (Liquid Glass):
┌──────────────────────────────────┐
│                                  │
│                                  │
│         🏷️                       │  ← App icon large
│   ML Price Tracker               │  ← App name
│   Rastrea precios en             │
│   Mercadolibre                   │  ← Tagline
│                                  │
│                                  │
│  ╔════════════════════════════╗  │
│  ║    Crear cuenta            ║  │  ← Primary CTA (glass button)
│  ╚════════════════════════════╝  │
│                                  │
│  ╔════════════════════════════╗  │
│  ║    Iniciar sesión          ║  │  ← Secondary CTA (glass outline)
│  ╚════════════════════════════╝  │
│                                  │
│  Al continuar aceptas los        │
│  [Términos de uso] y la          │
│  [Política de privacidad]        │  ← Clerk-managed links
│                                  │
└──────────────────────────────────┘

Android (Material 3):
┌──────────────────────────────────┐
│                                  │
│                                  │
│         🏷️                       │
│   ML Price Tracker               │
│   Rastrea precios en             │
│   Mercadolibre                   │
│                                  │
│                                  │
│  ┌────────────────────────────┐  │
│  │      Crear cuenta          │  │  ← FilledButton (MD3)
│  └────────────────────────────┘  │
│                                  │
│  ┌────────────────────────────┐  │
│  │      Iniciar sesión        │  │  ← OutlinedButton (MD3)
│  └────────────────────────────┘  │
│                                  │
│  Al continuar aceptas los        │
│  [Términos de uso] y la          │
│  [Política de privacidad]        │
│                                  │
└──────────────────────────────────┘
```

### Auth Navigation Flow

```
First install / no session:
  Launch → Welcome screen
      ↓
  "Crear cuenta"    → Sign Up screen
  "Iniciar sesión"  → Sign In screen
      ↓
  Auth success (Clerk handles all logic)
      ↓
  → Search tab (first app screen)

Returning user (session exists):
  Launch → Search tab directly (Welcome screen skipped)

Sign out (from Profile tab):
  Session cleared by Clerk → Welcome screen
```

### Auth Error States

```
Wrong password:
  ⚠️ Contraseña incorrecta. Inténtalo de nuevo.

Email not found:
  ⚠️ No encontramos una cuenta con ese email.

Email already registered:
  ⚠️ Ya existe una cuenta con ese email. Inicia sesión.

Google / Apple auth failed:
  ⚠️ No se pudo conectar. Inténtalo de nuevo.

Note: All password reset and email verification flows
are fully managed by Clerk (no custom screens needed).
```

---

### Sign Up Screen

```
iOS (Liquid Glass):
┌──────────────────────────────────┐
│ ←  Crear cuenta                  │  ← back to welcome
├──────────────────────────────────┤
│                                  │
│  ╔════════════════════════════╗  │
│  ║  Continuar con Google  G   ║  │  ← Glass button + Google icon
│  ╚════════════════════════════╝  │
│                                  │
│  ╔════════════════════════════╗  │
│  ║  Continuar con Apple   🍎  ║  │  ← iOS only
│  ╚════════════════════════════╝  │
│                                  │
│  ─────────── o ────────────      │  ← divider
│                                  │
│  ╔════════════════════════════╗  │
│  ║  Correo electrónico        ║  │  ← Glass input
│  ╚════════════════════════════╝  │
│                                  │
│  ╔════════════════════════════╗  │
│  ║  Contraseña                ║  │  ← Glass input
│  ╚════════════════════════════╝  │
│                                  │
│  ╔════════════════════════════╗  │
│  ║       Crear cuenta         ║  │  ← Primary CTA
│  ╚════════════════════════════╝  │
│                                  │
│  ¿Ya tienes cuenta?              │
│  [Iniciar sesión]                │  ← link to Sign In
│                                  │
└──────────────────────────────────┘

Android (Material 3):
  Same structure — OutlinedTextField, FilledButton, OutlinedButton
  No Apple Sign-In option on Android
```

---

### Sign In Screen

```
iOS (Liquid Glass):
┌──────────────────────────────────┐
│ ←  Iniciar sesión                │
├──────────────────────────────────┤
│                                  │
│  ╔════════════════════════════╗  │
│  ║  Continuar con Google  G   ║  │
│  ╚════════════════════════════╝  │
│                                  │
│  ╔════════════════════════════╗  │
│  ║  Continuar con Apple   🍎  ║  │  ← iOS only
│  ╚════════════════════════════╝  │
│                                  │
│  ─────────── o ────────────      │
│                                  │
│  ╔════════════════════════════╗  │
│  ║  Correo electrónico        ║  │
│  ╚════════════════════════════╝  │
│                                  │
│  ╔════════════════════════════╗  │
│  ║  Contraseña                ║  │
│  ╚════════════════════════════╝  │
│                                  │
│           [¿Olvidaste tu         │
│            contraseña?]          │  ← Clerk handles reset flow
│                                  │
│  ╔════════════════════════════╗  │
│  ║       Iniciar sesión       ║  │
│  ╚════════════════════════════╝  │
│                                  │
│  ¿No tienes cuenta?              │
│  [Crear cuenta]                  │  ← link to Sign Up
│                                  │
└──────────────────────────────────┘

Android (Material 3):
  Same structure — OutlinedTextField, FilledButton, OutlinedButton
  No Apple Sign-In option on Android
```

---

### Auth Flow Diagram

```
App Launch
    ↓
Check Clerk session (automatic)
    ├─ Session active → Search tab (skip auth entirely)
    └─ No session →
           ↓
       Welcome Screen
       ├─ "Crear cuenta"   → Sign Up Screen
       └─ "Iniciar sesión" → Sign In Screen
              ↓
       User fills form / taps social login
              ↓
       Clerk handles:
         - Email/password auth
         - Google OAuth
         - Apple Sign-In (iOS)
         - Password reset (email)
         - Session persistence ✅
              ↓
       Auth success → Search tab (first screen)
              ↓
       Session persists across app closes (Clerk)
       User never sees Welcome Screen again until logout
```

---

### Session Persistence

```
Handled entirely by Clerk SDK:
  - Session stored securely in device keychain (iOS)
  - Session stored in encrypted SharedPreferences (Android)
  - Auto-refresh tokens silently in background
  - User stays logged in indefinitely until:
    a) Manual logout (from Profile tab)
    b) Account deleted
    c) Clerk session revoked (admin action)

No "remember me" toggle needed — always persistent by default
```

---

### Logout (Profile Tab)

```
Profile tab → "Cerrar sesión"
    ↓
Confirmation:
  "¿Cerrar sesión?"
  [Cancelar]  [Cerrar sesión]
    ↓
Clerk clears session
    ↓
App navigates to Welcome Screen
    ↓
All local cached data cleared
```

---

## Onboarding Flow (First Login — After Sign Up)

Runs only once after a user creates a new account. Skipped for returning users.

```
Sign Up success
    ↓
Navigate to Search tab
    ↓
Subtle pulsing animation on URL input
    ↓
Tooltip overlay (dismissable):
  "👆 Pega la URL de un producto de
   Mercadolibre para empezar a rastrearlo"
    ↓
User pastes URL → adds product → navigates to Tracklist tab
    ↓
New product card expanded automatically
    ↓
Tooltip:
  "👆 Configura cómo verificar el precio"
    ↓
User selects mode → tooltip disappears
    ↓
Tooltip:
  "👈 Desliza izquierda para verificar ahora"
    ↓
Onboarding complete — tooltips never shown again
```

---

## Performance Requirements

| Action | Target Time |
|--------|------------|
| App cold start | < 2 seconds |
| Tracklist load (cached) | < 100ms |
| Card expand animation | 250ms |
| Swipe reveal | 0ms (follows finger) |
| Manual check response | < 3 seconds |
| New product validation | < 1 second (frontend) |
| New product add (Decodo) | < 5 seconds |

**Caching strategy:**
- Tracklist data: cached in AsyncStorage on every fetch
- Price history per product: cached on expand
- Images: cached via FastImage
- Stale-while-revalidate: show cached data instantly, refresh in background

---

**Document version:** 1.0
**Last updated:** May 29, 2026
**Status:** Ready for implementation
**Related:** mercadolibre_tracker_simplified.md (main spec)
