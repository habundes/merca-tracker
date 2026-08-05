# Mercadolibre Price Tracker — Pricing, Revenue, User Flows & Timeline

**Related files:**
- `mercadolibre_tracker_simplified.md` — Main spec (architecture, features)
- `backend_technical.md` — Full implementation code
- `ux_spec.md` — UI/UX specification

**Last Updated:** May 29, 2026

---

## Table of Contents

1. [Pricing Models Evaluation (Options A/B/C)](#pricing-models-evaluation)
2. [Selected Model — Revenue Comparison](#revenue-comparison)
3. [Pricing & Revenue](#pricing--revenue)
4. [User Flows](#user-flows)
5. [Implementation Timeline](#implementation-timeline)

---

## Pricing Models Evaluation

 (Before Proposals)

```
Free + Ads:  $0    (Banner + Interstitial only)
Monthly:     $3.99/month
Annual:      $35.88/year ($2.99/month — 25% savings)
```

**Problems identified:**
- $3.99/month too low for value delivered
- Annual discount too aggressive (hurts monthly revenue)
- Ad revenue too dependent on volume
- No mid-tier option (big jump from free to premium)

---

## Option A: Two Tiers + Better Pricing

```
Free + Ads:  $0
Premium:     $5.99/month
Annual:      $49.99/year ($4.16/month — 30% savings)
```

### Tier Details

| Feature | Free + Ads | Premium |
|---------|-----------|---------|
| Products | 2 max | 20 max |
| Manual Checks | 2/day | Unlimited |
| Intervals | 12, 24 hrs | 6, 12, 24 hrs |
| Wish Price | 24hrs only | 6, 12, 24 hrs |
| Ads | Banner + Interstitial | None |

### Why $5.99?
- Still impulse-buy price (under $6)
- Feels fair for real-time price tracking value
- 50% more revenue than $3.99/month
- Annual at $49.99 is a clean, attractive number
- 30% savings encourages annual commitment

### Pros
- ✅ Simple (only 2 tiers — easy to market and build)
- ✅ 50% more subscription revenue vs current
- ✅ Clean pricing ($5.99 and $49.99)
- ✅ Strong annual incentive (30% savings)
- ✅ Less decision fatigue for users

### Cons
- ❌ No mid-tier option for price-sensitive users
- ❌ Some users may not convert from free to $5.99

---

## Option B: Three Tiers

```
Free + Ads:  $0
Basic:       $2.99/month
Premium:     $6.99/month
Annual:      $59.99/year ($5/month — 28% savings)
```

### Tier Details

| Feature | Free + Ads | Basic | Premium |
|---------|-----------|-------|---------|
| Products | 2 max | 10 max | 20 max |
| Manual Checks | 2/day | 5/day | Unlimited |
| Intervals | 12, 24 hrs | 12, 24 hrs | 6, 12, 24 hrs |
| Wish Price | ❌ None | ❌ None | ✅ 6, 12, 24 hrs |
| Ads | Banner + Interstitial | Banner only | None |

### Why Three Tiers?
- Captures middle-ground users unwilling to pay $6.99
- Basic at $2.99 converts free users more easily
- Premium users pay more for full feature set
- Reduces ad load for Basic users (banner only)

### Pros
- ✅ Captures more paying users at lower price point
- ✅ Natural upgrade path (Free → Basic → Premium)
- ✅ Higher potential total revenue with 3 tiers
- ✅ Wish price as exclusive Premium feature increases perceived value

### Cons
- ❌ More complex to build (3 subscription tiers)
- ❌ More complex to market (users confused by options)
- ❌ Harder to manage in Stripe (3 products/prices)
- ❌ Risk of cannibalization (Basic users never upgrade to Premium)

---

## Option C: Two Tiers + Smarter Ad Strategy

```
Free + Ads:  $0
Premium:     $4.99/month
Annual:      $44.99/year ($3.75/month — 25% savings)
```

### Tier Details

| Feature | Free + Ads | Premium |
|---------|-----------|---------|
| Products | 2 max | 20 max |
| Manual Checks | 2/day | Unlimited |
| Intervals | 12, 24 hrs | 6, 12, 24 hrs |
| Wish Price | 24hrs only | 6, 12, 24 hrs |
| Ads | Banner + Interstitial + Native + Reward | None |

### Smart Ad Strategy for Free Tier

| Format | Placement | CPM | Notes |
|--------|-----------|-----|-------|
| **Banner** | Fixed bottom of tracklist | $2-5 | Always visible |
| **Interstitial** | Opening product detail | $5-15 | Max once every 3 opens |
| **Native** | Every 3rd product in feed | $3-8 | Only when 3+ products tracked |
| **Reward** | After hitting daily check limit | $10-30 | User watches for +1 check |

### Why This Model?
- Lower subscription price ($4.99) = easier conversion
- Make up revenue difference with smarter ads
- Reward ads highest CPM ($10-30) with user consent
- Native ads higher engagement than standard banners

### Pros
- ✅ Lower subscription barrier ($4.99 vs $5.99)
- ✅ Reward ads generate premium revenue from free users
- ✅ Native ads blend naturally into UI
- ✅ Users get value from reward ads (+1 check)

### Cons
- ❌ More ad complexity to implement (4 formats)
- ❌ Heavier ad load may frustrate free users
- ❌ Lower per-user subscription revenue vs Option A

---

---

## Pricing & Revenue

### Subscription Tiers
| | Free + Ads | Premium |
|-|-----------|---------|
| Price | $0 | $5.99/month or $49.99/year |
| Annual equiv. | — | $4.16/month (30% savings) |
| Products | 5 max | 20 max |
| Auto-check slots | 2 max | 20 (all products) |
| Ads | Banner + Interstitial + Native + Reward | None |

---

### Free-Only Sustainability Analysis

This section answers: **Can the app survive on ad revenue alone, without any premium users?**

#### Costs

```
Fixed costs (monthly):
  Supabase Pro:          $25  (includes $10 compute credits = net $25)
  Server (Node.js):      $20
  Firebase:              $0
  Clerk:                 $0
  AdMob:                 $0
  ──────────────────────────
  Base fixed:            $45

Variable cost: Decodo (per check)
  ~100-200KB per scrape @ $12.50/GB = ~$0.002/check
```

**Decodo estimate with 2 auto-check slots per free user:**
```
1,000 users × 60% active = 600 active users
600 × 2 auto slots = 1,200 active auto-checks
1,200 × 1 check/day (24hr interval avg) = 1,200 checks/day
1,200 × 30 days = 36,000 checks/month

Decodo cost: 36,000 × $0.002 = $72/month
Total costs @ 1,000 users: $72 + $32 = $104/month
```

#### Ad Revenue Per User (Aggressive — 4 Formats)

```
Format          CPM      Sessions/day   Revenue/user/month
──────────────────────────────────────────────────────────
Banner          $4       5 imp/day      $0.020 × 30 = $0.60
Interstitial    $10      2 opens/day    $0.020 × 30 = $0.60
Native          $6       1 imp/day      $0.006 × 30 = $0.18
Reward          $20      0.3/day avg    $0.006 × 30 = $0.18
──────────────────────────────────────────────────────────
Gross/user/mo:                                       $1.56

Fill rate Mexico (40%):        $1.56 × 40% = $0.624/user/month
```

#### Break-Even Point

```
Monthly costs = $32 (fixed) + $0.072/user (Decodo)
Monthly revenue = $0.624/user (ads)

Break-even: $45 / ($0.624 - $0.072) = 45 / 0.552 = ~82 users
```

**Break-even: ~82 free users** ✅

#### Free-Only Revenue Projections (Pessimistic)

| Month | Users | Active (60%) | Ad Revenue | Decodo | Total Costs | Balance |
|-------|-------|-------------|------------|--------|-------------|---------|
| 1 | 50 | 30 | $19 | $4 | $49 | **-$30** |
| 2 | 100 | 60 | $37 | $7 | $52 | **-$15** |
| 3 | 150 | 90 | $56 | $11 | $56 | **$0** |
| 6 | 400 | 240 | $150 | $29 | $74 | **+$76** |
| 12 | 800 | 480 | $299 | $58 | $103 | **+$196** |
| 18 | 1,400 | 840 | $524 | $101 | $146 | **+$378** |
| 24 | 2,000 | 1,200 | $749 | $144 | $189 | **+$560** |

**Key insight:** App is self-sustaining from month 3 with only ~150 users.

---

### Ad Strategy (Free Tier — 4 Formats Maximum)

**1. Banner Ad (Always Visible)**
- Position: Fixed bottom of tracklist screen
- CPM: ~$2-5 | Always visible during session

**2. Interstitial Ad (Full Screen)**
- Position: When opening product detail (max once every 3 opens)
- CPM: ~$5-15 | High impact

**3. Native Ad (In-Feed)**
- Position: Every 3rd product in tracklist (only when 3+ products tracked)
- CPM: ~$3-8 | Blends naturally

**4. Reward Ad (User Initiated — Highest CPM)**
- Triggered when user hits 2/2 daily manual check limit
- "Watch a short ad for +1 extra check today"
- CPM: ~$10-30 | User chooses to watch

```
After hitting 2/2 check limit:
┌──────────────────────────┐
│ Límite diario alcanzado  │
│ 2/2 checks usados hoy    │
│                          │
│ [Ver ad → +1 check]      │
│ [Actualizar a Premium]   │
└──────────────────────────┘
```

---

### Combined Revenue Projections (Free + Ads + Premium)

| Month | Free Users | Premium Users | Sub Rev | Ad Rev | Total | Costs | Profit |
|-------|-----------|---------------|---------|--------|-------|-------|--------|
| 1 | 100 | 5 | $30 | $62 | $92 | $53 | **+$39** |
| 3 | 500 | 30 | $180 | $312 | $492 | $75 | **+$417** |
| 6 | 2,000 | 100 | $510 | $1,248 | $1,758 | $189 | **+$1,569** |
| 12 | 5,000 | 300 | $1,530 | $3,120 | $4,650 | $405 | **+$4,245** |

---

---

## User Flows

### Add Product to Tracklist
```
1. App launches → Search tab opens (first screen)
   ↓
2. User pastes URL into input (keyboard not open yet)
   ↓
3. After 1 second debounce → keyboard opens automatically
   ↓
4. User taps Enter/Enviar on keyboard
   ↓
5. Keyboard closes
   ↓
6. LAYER 1 — Frontend validation (instant, no API call):
   ├─ Empty → "Por favor ingresa una URL de Mercadolibre."
   ├─ Not a URL or MLM-ID → "El texto ingresado no es una URL válida."
   ├─ Not mercadolibre.com.mx → "Solo se aceptan URLs de Mercadolibre México."
   └─ No MLM-xxxxx ID → "No se encontró un ID de producto en la URL."
   ↓
7. LAYER 2 — Backend validation (security, before Decodo):
   └─ Same checks — returns 400 if fails
   ↓
8. Tracklist limit check:
   └─ Full → "Lista llena (5/5). Ve a Tracklist para eliminar un producto."
   ↓
9. Duplicate check (DB):
   └─ Already tracking → "Ya estás rastreando este producto."
   ↓
10. Decodo validates product availability:
    ├─ Unavailable → "Este producto ya no está disponible en Mercadolibre."
    └─ Available → Save to DB (manual mode by default)
    ↓
11. ✅ "iPhone 15 Pro agregado!" shown below input (briefly)
    ↓
12. App auto-navigates to Tracklist tab
    ↓
13. New product at TOP of stack, card pre-expanded
    ↓
14. User configures mode from expanded card
```

### Configure Checking Mode
```
User taps product → Configure
   ↓
┌────────────────────────────┐
│ ✅ Manual [Always active]  │
│ Check Now (1/2 today)      │
├────────────────────────────┤
│ ○ Interval                 │  mutually exclusive
│  [12hrs] [24hrs]           │
│  Slots: 1/2 active         │  ← free tier slot counter
│  [Activate]                │
├────────────────────────────┤
│ ○ Wish Price               │  mutually exclusive
│  Target [$____]            │
│  Interval: [24hrs]         │  (free: locked to 24hrs)
│  Slots: 1/2 active         │  ← same counter
│  [Activate]                │
└────────────────────────────┘

When both slots used (2/2 active):
┌────────────────────────────┐
│ ✅ Manual [Always active]  │
├────────────────────────────┤
│ ○ Interval [locked 🔒]     │
│  Slots: 2/2 active         │
│  Deactivate another product│
│  to enable this one        │
├────────────────────────────┤
│ ○ Wish Price [locked 🔒]   │
│  Slots: 2/2 active         │
└────────────────────────────┘
```

### Subscription Ends (Canceled or Expired)
```
premium_access_until reached
   ↓
Hourly job detects expiry
   ↓
1. Stop ALL auto-checks immediately
2. Determine how many products to keep visible:
   - Math.min(total_products, 5)
   - Example: 20 products → keep 5, hide 15
   - Example: 3 products  → keep all 3, hide none
3. Hide products beyond visible count (is_visible = false)
4. Clear ALL checks for visible products (fresh start on free tier)
5. Hidden products: ALL their checks kept untouched in DB
6. Downgrade to free + ads
7. Notify user with exact counts
   ↓
User sees:
   ├─ Up to 5 products visible (last added)
   ├─ Auto-checks stopped (reverted to manual)
   ├─ Ads appear
   ├─ Banner: "X productos ocultos. Re-suscríbete para restaurar."
   └─ Data is NEVER deleted
```

### Re-Subscribe
```
User taps "Restore Premium" banner
   ↓
Stripe checkout
   ↓
Payment success
   ↓
Backend:
   ├─ Set is_visible = true for ALL products
   ├─ Restore subscription_tier = 'premium'
   └─ Restore premium_access_until
   ↓
User sees:
   ├─ All products back in tracklist
   ├─ All check history visible again
   ├─ Can re-configure auto modes
   └─ Notification: "Welcome back! All data restored."
```

### Payment Fails (Past Due)
```
Payment fails → Stripe past_due
   ↓
Grace period starts:
   ├─ Monthly: 12 hours
   └─ Annual: 24 hours
   ↓
User notified:
   "⚠️ Payment Failed
   Update payment within [12/24hrs] or
   account downgrades to Free + Ads.
   X products will be hidden.
   Note: Data is never deleted.
   Deadline: [date + time]"
   ↓
IF payment updated → Premium restored, all products visible
IF grace expires → Downgrade (same as subscription ends flow)
```

---

---

## Implementation Timeline

### Week 1: Foundation
- [ ] Clerk (Email, Google, Apple — no GitHub)
- [ ] Stripe products ($5.99/mo, $49.99/yr)
- [ ] Firebase project
- [ ] PostgreSQL schema (with `is_visible` field)
- [ ] Decodo API testing + field verification
- [ ] Supabase project setup (Pro plan)
- [ ] DigitalOcean App Platform setup (backend server)
- [ ] Backend folder scaffolding — Domain / Application / Infrastructure / Presentation (see `clean_architecture.md → Folder Structure`)
- [ ] Domain layer: `Product`, `User` entities + `CheckMode` value object (see `clean_architecture.md → Layer 1 — Domain`)

### Week 2: Core Backend
- [ ] Define ports (interfaces): ProductRepository, UserRepository, ScraperGateway, PaymentGateway, AuthGateway, NotificationGateway (see `clean_architecture.md → Layer 2 — Application`)
- [ ] Infrastructure: Prisma repositories implementing ports
- [ ] Infrastructure: Decodo, Stripe, Clerk, Firebase gateway wrappers
- [ ] Clerk webhook handler (Presentation + Application use case)
- [ ] Stripe webhook handler (grace periods, is_visible restore)
- [ ] URL parser (MLM-xxxxx) — `infrastructure/security/url-validator.js`
- [ ] Use case: `AddProductUseCase` → POST /add-product + Decodo validation
- [ ] Use case: `GetTracklistUseCase` → GET /tracklist (is_visible filter)
- [ ] Use case: `DeleteProductUseCase` → DELETE /products/:id
- [ ] Use case: `SetCheckModeUseCase` → PUT /products/:id/mode (3 modes + auto-slot rule)
- [ ] Use case: `ManualCheckProductUseCase` → POST /products/:id/check (2/day rate limit, 2 auto-check slot limit)
- [ ] Use case: `GetProductHistoryUseCase` → GET /products/:id/history
- [ ] Dependency Injection container (`di-container.js`) wiring all use cases (see `clean_architecture.md → Dependency Injection Setup`)
- [ ] Unit tests for Domain rules (auto-check slots, downgrade partitioning) — zero mocks needed (see `clean_architecture.md → Testing Strategy by Layer`)

### Week 3: Mobile App
- [ ] Expo setup
- [ ] Platform-specific UI — iOS Liquid Glass + Android Material Design 3 (see `ux_spec.md`)
- [ ] Native bottom tab navigation: Search | Tracklist | Profile — icons only (see `ux_spec.md → Navigation Structure`)
- [ ] Auth screens: Welcome, Sign Up, Sign In via Clerk (see `ux_spec.md → Auth Flow`)
- [ ] Search screen — first screen on launch, URL input + debounce + keyboard flow (see `ux_spec.md → Search Screen`)
- [ ] Tracklist screen — stack, newest on top, expandable cards + swipe actions (see `ux_spec.md → Tracklist Screen`)
- [ ] Configure mode UI — 3 modes, mutually exclusive Interval/WishPrice (see `ux_spec.md → Configure Mode Screen`)
- [ ] Check history inline in expanded card
- [ ] Wish price reached modal
- [ ] Re-subscribe flow
- [ ] Onboarding tooltips — first launch only (see `ux_spec.md → Onboarding Flow`)

### Week 4: Background Jobs & Notifications
- [ ] Firebase notification setup — `FirebaseNotificationGateway` (Infrastructure)
- [ ] Use case: `RunHourlyPriceCheckUseCase` — orchestrates price check job (Application)
- [ ] Interval mode (notify only if changed) — domain logic in `Product.getPriceDirection()`
- [ ] Wish price mode (pause when reached) — domain logic in `Product.hasReachedWishPrice()`
- [ ] Product unavailable handling — `Product.markUnavailable()`
- [ ] Manual check rate limiting (2/day) + auto-check slot enforcement (2 slots) — `domain/rules/auto-check-slot.rules.js`
- [ ] Concurrency lock for hourly job (GAP-03) — orchestration level in `server.js`
- [ ] AdMob integration (free tier)

### Week 5: Payments & Downgrade
- [ ] Stripe checkout — `CreateCheckoutSessionUseCase`
- [ ] Grace period logic (12hr/24hr) — `handle-stripe-subscription-updated.use-case.js`
- [ ] Cancellation warning modal
- [ ] Use case: `RunDowngradeExpiredUsersUseCase` — hourly downgrade job (Application)
- [ ] Downgrade logic (hide products, clear checks for visible products, stop checks) — `domain/rules/downgrade.rules.js`
- [ ] Re-subscribe restore logic (is_visible = true for all) — `handle-stripe-checkout-completed.use-case.js`
- [ ] All payment notification scenarios
- [ ] Reward check endpoint (GAP-04) — `RewardCheckProductUseCase`
- [ ] `wish_price` server-side validation (GAP-12) — `CheckMode` value object

### Week 6: Polish & Launch
- [ ] End-to-end testing
- [ ] Edge cases + error states
- [ ] App store assets
- [ ] Beta testing
- [ ] Submission
- [ ] E2E tests against full API spec via real DI container (see `clean_architecture.md → Testing Strategy by Layer`)

---

**Document version:** 3.0
**Last updated:** June 18, 2026
**Status:** Ready for implementation
