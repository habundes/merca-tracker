# Mercadolibre Price Tracker App - Complete Specification

**Project:** Mobile app (iOS & Android) for tracking Mercadolibre product price changes with notifications  
**Region:** Mexico only (.com.mx)  
**Status:** MVP Planning  
**Last Updated:** May 29, 2026  
**UX Specification:** See `ux_spec.md` for full UI/UX details (screens, flows, components, platform differences)  

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Feature Matrix](#feature-matrix)
3. [Checking Modes](#checking-modes)
4. [URL Validation](#url-validation)
5. [Architecture](#architecture)
6. [Technology Stack](#technology-stack)
7. [Database Schema](#database-schema)
8. [API Specification](#api-specification)
9. [Authentication (Clerk)](#authentication-clerk)
10. [Payments (Stripe)](#payments-stripe)
11. [Notifications (Firebase)](#notifications-firebase)
12. [Background Jobs](#background-jobs)
13. [Data Collection (Decodo)](#data-collection-decodo)
14. [Pricing & Revenue](#pricing--revenue)
15. [User Flows](#user-flows)
16. [Implementation Timeline](#implementation-timeline)
17. [Deployment & Infrastructure](#deployment--infrastructure)
18. [Known Gaps & Solutions](#known-gaps--solutions)

---

## Project Overview

### Problem
Users want to know when Mercadolibre product prices change or reach a desired price without manually checking constantly.

### Solution
A focused mobile app where users:
1. Paste Mercadolibre product URLs → auto-added to tracklist
2. Default: Manual check mode (see price in app, no notifications)
3. Optional: Set automatic interval checks OR wish price alerts
4. Get notified on price change OR when wish price is reached

### Monetization
- **Free + Ads:** Track 5 products (max 2 with auto-checks active), 2 manual checks/day per product, 12/24hr intervals, wish price 24hrs only, Google AdMob (Banner + Interstitial + Native + Reward ads)
- **Premium:** Track 20 products, unlimited manual checks, 6/12/24hr intervals, wish price 6/12/24hrs, ad-free

---

## Feature Matrix

| Feature | Free + Ads | Premium |
|---------|-----------|---------|
| **Products in Tracklist** | 5 max | 20 max |
| **Auto-Check Slots** | 2 max (Interval or Wish Price) | 20 (all products) |
| **Ads** | ✅ Banner + Interstitial + Native + Reward | ❌ Ad-free |
| **Mode 1: Manual** | ✅ Always active (2 checks/day) | ✅ Always active (unlimited) |
| **Mode 2: Interval** | 12 or 24 hrs | 6, 12, or 24 hrs |
| **Mode 3: Wish Price** | 24hrs only | 6, 12, or 24 hrs |
| **Notifications** | Mode 2 & 3 only | Mode 2 & 3 only |
| **Check History** | Last 5 checks | All checks |
| **Cost** | Free | $5.99/month or $49.99/year |

### Subscription Behavior on Downgrade

When premium ends (canceled or expired):
- ✅ ALL automatic checks (interval + wish price) stop immediately
- ✅ ALL products kept in DB (never deleted)
- ✅ ALL check history kept in DB (never deleted)
- ✅ Last 5 products shown (or all products if user has fewer than 5), by `created_at DESC`
- ✅ Checks cleared for those visible products (fresh start on free tier)
- ✅ Hidden products + all their checks stay in DB untouched
- ✅ Re-subscribe → ALL products and checks restored instantly

### Grace Period (Payment Failure Only)
Grace periods apply ONLY when payment fails (`past_due`):
- **Monthly:** 12 hours to update payment before downgrade
- **Annual:** 24 hours to update payment before downgrade
- User notified immediately with full data loss warning
- If payment recovered within grace → Premium fully restored
- If not → downgrade applies

---

## Checking Modes

Every product has Manual always active, plus optionally one auto mode:

### Mode 1: Manual (Default — Always Active)
- No automatic checking
- No notifications (user sees price directly in app)
- User taps "Check Now" to get current price
- Free: 2 checks/day per product
- Premium: Unlimited checks
- Cannot be disabled

### Mode 2: Interval Check
- Automatic checks at set interval
- Free: 12 or 24 hours
- Premium: 6, 12, or 24 hours
- Notification sent ONLY if price changed (up or down)
- No notification if price is the same
- Mutually exclusive with Wish Price (replaces it if active)

### Mode 3: Wish Price
- User sets a target price
- System checks at interval until price reaches target
- Free: 24 hours only
- Premium: 6, 12, or 24 hours
- Notification sent ONLY when price hits or goes below target
- When target reached:
  - Checking pauses
  - App asks: [Set New Wish Price] or [Delete Product]
- Mutually exclusive with Interval (replaces it if active)

### Mode Rules
```
Manual:     Always ON — cannot be disabled
Interval:   Mutually exclusive with Wish Price
Wish Price: Mutually exclusive with Interval

FREE TIER AUTO-CHECK SLOT LIMIT:
  Max 2 products can have Interval OR Wish Price active at the same time
  The other 3 products are limited to Manual mode only
  To activate a 3rd auto-check, user must deactivate one of the 2 active slots

PREMIUM:
  All 20 products can have auto-checks active simultaneously

Switching:
  Set Interval   → replaces Wish Price automatically (same slot)
  Set Wish Price → replaces Interval automatically (same slot)
  Set Manual     → frees up one auto-check slot

Checking stops ONLY when:
  - User manually disables auto mode
  - Subscription ends (canceled or expired)
  - Payment fails + grace period exceeded
  - Product deleted from tracklist
  - Product becomes unavailable on Mercadolibre
```

---

## Architecture

> 📐 For full screen designs, platform components, interaction flows and ad placement see **`ux_spec.md`**
> 🏛️ For backend layer structure (Domain/Application/Infrastructure/Presentation), folder layout, and dependency injection see **`clean_architecture.md`**

### High-Level Diagram

```
┌──────────────────────────────────────────────┐
│      Expo Mobile App (iOS & Android)         │
│  - Clerk authentication                      │
│  - Stripe payments                           │
│  - URL paste → auto-add to tracklist         │
│  - Search tab (launch screen)                │
│  - Tracklist tab (stack, newest on top)      │
│  - Mode config (Manual/Interval/Wish Price)  │
│  - Check history list                        │
│  - Google AdMob (free tier)                  │
│  - Firebase push notifications               │
└──────────────────┬───────────────────────────┘
                   │ REST API + JWT
┌──────────────────▼───────────────────────────┐
│  Node.js Backend (Express.js)                │
│  Clean Architecture — see clean_architecture.md │
│                                              │
│  Presentation  → routes, controllers          │
│  Application   → use cases (AddProduct, etc) │
│  Domain        → entities, business rules     │
│  Infrastructure→ Prisma, Stripe, Clerk,       │
│                  Decodo, Firebase wrappers    │
└──────────────────┬───────────────────────────┘
                   │
        ┌──────────┼──────────┬────────────┐
        │          │          │            │
   ┌────▼──┐ ┌────▼───┐ ┌───▼────┐ ┌───▼──┐
   │Postgre│ │ Decodo │ │ Clerk  │ │Stripe│
   │SQL    │ │  API   │ │ Auth   │ │Pymnt │
   └───────┘ └────────┘ └────────┘ └──────┘
```

### Data Flow: User Adds Product
```
1. User on Search screen — pastes URL
   ↓
2. After 1 second → keyboard opens → user taps Enter
   ↓
3. Frontend validation (instant, no API call):
   └─ Fails → error shown below input, stays on Search screen
   ↓
4. Backend validates URL + checks limit
   └─ Fails → error shown below input, stays on Search screen
   ↓
5. Decodo API validates product availability
   ├─ Unavailable → error shown below input, stays on Search screen
   └─ Available → save to DB (manual mode by default)
   ↓
6. Success → "iPhone 15 Pro agregado!" shown briefly
   ↓
7. App auto-navigates to Tracklist tab
   ↓
8. New product at TOP of stack (created_at DESC), card pre-expanded
   ↓
9. User configures mode from expanded card
```

### Data Flow: Background Job Check
```
1. Hourly job runs
2. Finds products: check_enabled=true, next_check <= NOW
3. For each product:
   ├─ Call Decodo API
   ├─ Product unavailable?
   │   └─ Stop checking + notify user to delete
   ├─ Store in price_history
   ├─ IF Mode = Interval:
   │   ├─ Price different? → Send notification
   │   └─ Price same? → No notification
   ├─ IF Mode = Wish Price:
   │   ├─ Price reached target? → Notify + pause checking
   │   └─ Not reached? → Schedule next check
   └─ Update last_known_price + next_check_at
```

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Mobile** | Expo (React Native) |
| **Mobile UI** | Platform-specific (iOS Liquid Glass + Android Material Design 3) — see `ux_spec.md` |
| **Auth (Mobile)** | Clerk SDK for Expo |
| **Payments (Mobile)** | Stripe React Native SDK |
| **Notifications** | Firebase Cloud Messaging |
| **Ads** | Google AdMob |
| **Backend** | Node.js 18+ + Express.js — Clean Architecture (Domain/Application/Infrastructure/Presentation), see `clean_architecture.md` |
| **Database** | PostgreSQL via Supabase (Pro plan) |
| **ORM** | Prisma |
| **Auth (Backend)** | Clerk SDK Node |
| **Payments (Backend)** | Stripe API |
| **Notifications (Backend)** | Firebase Admin SDK |
| **Scraping** | Decodo API |
| **Scheduler** | node-cron |
| **Package Manager** | pnpm |
| **Hosting** | DigitalOcean App Platform (backend) + Supabase (database) |

---

## Database Schema

> 🔧 Full SQL schema (tables, indexes, triggers) → `backend_technical.md → Database Schema`

### Tables
- `users` — subscription tier, Stripe IDs, premium_access_until
- `user_products` — tracklist items, check mode, is_visible, is_available
- `price_history` — check records per product (free: last 5, premium: all)
- `manual_check_log` — rate limiting for manual checks
- `notification_tokens` — FCM tokens per user/device
- `stripe_events` — audit log for idempotency

### Key Fields
- `is_visible` — controls downgrade display (never deletes data)
- `check_mode` — `manual` | `interval` | `wish_price`
- `active_auto_checks` — slot counter (max 2 for free)
- `premium_access_until` — used by hourly downgrade job
- `added_date` — used to determine last 5 visible on downgrade

---
## URL Validation

> 🔧 Full validation code (frontend + backend) → `backend_technical.md → URL Validation`

Two-layer validation to prevent unnecessary Decodo API calls.

### Valid URL Formats
```
Full URL:  https://articulo.mercadolibre.com.mx/MLM-1234567890
Short ID:  MLM-1234567890  (auto-expanded to full URL)
```

### Validation Rules (Both Layers)
1. **Empty?** → Error: `empty_url`
2. **Valid URL or MLM-ID?** → Error: `invalid_format`
3. **Domain = mercadolibre.com.mx?** → Error: `invalid_domain`
4. **Contains MLM-xxxxxx?** → Error: `invalid_product`
5. ✅ All pass → call backend

### Layer 1: Frontend
- Instant feedback (no API call)
- Runs on Enter/Submit after 1s debounce
- Shows error message below input field

### Layer 2: Backend
- Security layer before any DB or Decodo call
- Runs in `POST /api/user/add-product`
- Returns 400 if fails

### Validation Flow
```
User input → Layer 1 (frontend) → Layer 2 (backend) → Tracklist limit check → Duplicate check → Decodo
            ❌ = instant error     ❌ = 400, no Decodo  ❌ = error             ❌ = error        ❌ = error
```

### Error Messages (Spanish)

| Error Code | Message |
|------------|---------|
| `empty_url` | Por favor ingresa una URL de Mercadolibre. |
| `invalid_format` | El texto ingresado no es una URL válida. |
| `invalid_domain` | Solo se aceptan URLs de Mercadolibre México (mercadolibre.com.mx). |
| `invalid_product` | No se encontró un ID de producto en la URL. |
| `already_tracking` | Ya estás rastreando este producto. |
| `tracklist_full` | Lista llena (5/5). Elimina un producto para agregar otro. |
| `auto_slots_full` | Ya tienes 2 productos con verificación automática activa. Desactiva uno para activar este. |
| `invalid_wish_price` | El precio deseado debe ser un número mayor a cero. |
| `product_unavailable` | Este producto ya no está disponible en Mercadolibre. |

---

## API Specification

> 🔧 Full endpoint definitions, request/response schemas → `backend_technical.md → API Specification`

### Base URL
```
Development: http://localhost:3000/api
Production:  https://api.pricetrackerapp.com/api
```

### Auth Header
```
Authorization: Bearer <JWT_FROM_CLERK>
```

### Endpoints Summary

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/user/add-product` | Add product to tracklist | Required |
| `GET` | `/api/user/tracklist` | Get all visible products | Required |
| `GET` | `/api/user/products/:id` | Get single product details | Required |
| `DELETE` | `/api/user/products/:id` | Remove from tracklist | Required |
| `PUT` | `/api/user/products/:id/mode` | Set check mode (manual/interval/wish_price) | Required |
| `POST` | `/api/user/products/:id/check` | Manual price check (rate limited) | Required |
| `POST` | `/api/user/products/:id/reward-check` | Reward ad extra check | Required |
| `GET` | `/api/user/products/:id/history` | Get check history | Required |
| `GET` | `/api/user/subscription` | Get subscription status | Required |
| `POST` | `/api/user/checkout-session` | Create Stripe checkout | Required |
| `GET` | `/api/user/stripe-portal` | Get Stripe portal link | Required |
| `POST` | `/api/user/notification-token` | Save FCM token | Required |
| `POST` | `/webhooks/clerk` | Clerk user events | Webhook |
| `POST` | `/webhooks/stripe` | Stripe payment events | Webhook |

### Error Response Format
```json
{ "success": false, "error": "error_code", "message": "Human-readable message" }
```

### Success Response Format
```json
{ "success": true, "data": {}, "timestamp": "2024-05-28T12:00:00Z" }
```

---
## Authentication (Clerk)

> 📐 UI/UX screens (Welcome, Sign In, Sign Up) → `ux_spec.md → Auth Flow`
> 🔧 Full implementation code → `backend_technical.md → Authentication`

### Supported Methods
- ✅ Email/Password
- ✅ Google OAuth
- ✅ Apple Sign-In (iOS only)
- ❌ GitHub (disabled)

### Session Persistence
- Clerk manages session tokens via SecureStore (Expo)
- Session persists between app closes
- On launch: session exists → Search tab | no session → Welcome screen
- On sign out → Welcome screen

### Webhook Events
Subscribe to in Clerk Dashboard: `user.created`, `user.deleted`
- `user.created` → creates user row in DB (subscription_tier = 'free')
- `user.deleted` → CASCADE deletes all user data

---

## Payments (Stripe)

> 🔧 Full webhook handler, downgrade job, cancellation code → `backend_technical.md → Payments`

### Products & Prices
- Monthly: **$3.99/month** → `STRIPE_PRICE_MONTHLY`
- Annual: **$35.88/year** ($2.99/month — 25% savings) → `STRIPE_PRICE_ANNUAL`

### Webhook Events to Handle
| Event | Action |
|-------|--------|
| `checkout.session.completed` | Upgrade user to premium, set `premium_access_until` |
| `customer.subscription.deleted` | Set `subscription_status = canceled` (keeps premium till `premium_access_until`) |
| `customer.subscription.updated` (past_due) | Start grace period (12hr monthly / 24hr annual), notify user |
| `customer.subscription.updated` (active) | Restore premium, unhide all products |

### Downgrade Logic (Hourly Job)
- Detects: `subscription_tier = premium` AND `premium_access_until < NOW`
- Keeps last `Math.min(total, 5)` products visible
- Clears checks for visible products (fresh start)
- Hides rest — data NEVER deleted
- Re-subscribe → all products restored (`is_visible = true`)

### Grace Periods (Payment Failure)
- Monthly: 12 hours
- Annual: 24 hours
- User notified immediately with exact deadline

---

## Notifications (Firebase)

> 🔧 Full backend setup, FCM token handling, deep link handler → `backend_technical.md → Notifications`

### Notification Scenarios

| Scenario | Title | Body |
|----------|-------|------|
| Price dropped (interval) | `iPhone 15 Pro 📉` | `Precio: $899 → $749` |
| Price increased (interval) | `iPhone 15 Pro 📈` | `Precio: $749 → $899` |
| Price same | (no notification) | — |
| Wish price reached | `🎯 ¡Precio deseado alcanzado!` | `iPhone 15 ahora $749. Abre la app.` |
| Product unavailable | `⚠️ Producto no disponible` | `iPhone 15 ya no está en Mercadolibre.` |
| Manual check | (no notification) | — |
| Payment failed (monthly) | `⚠️ Pago fallido` | `Actualiza en 12 horas. X productos afectados.` |
| Payment failed (annual) | `⚠️ Pago fallido` | `Actualiza en 24 horas. X productos afectados.` |
| Premium expired | `📉 Suscripción terminada` | `X productos visibles. Y ocultos. Re-suscríbete.` |
| Premium revoked | `⚠️ Acceso Premium revocado` | `Downgraded a Free + Ads.` |
| Payment recovered | `✅ Pago recuperado` | `Premium restaurado. Todos tus productos están de vuelta.` |

---

## Background Jobs

> 🔧 Full job code (price check, downgrade) → `backend_technical.md → Background Jobs`

### Hourly Price Check Job
- Runs every hour
- Concurrency lock prevents overlapping runs (GAP-03 fix)
- Finds all products with `check_enabled = true` and `next_check_at <= NOW`
- For each product:
  - Calls Decodo API
  - If unavailable → stop checking, notify user
  - If price changed (interval mode) → send notification
  - If wish price reached → pause checking, notify user
  - On error → push `next_check_at` forward (no infinite retries)
  - Free users → trim price_history to last 5 checks

### Automatic Downgrade Job
- Runs hourly (same scheduler)
- Detects expired `premium_access_until`
- Handles both cancellations and past_due grace period expirations
- See: Payments section for full downgrade logic

---

## Data Collection (Decodo)

> 🔧 Full scrape function → `backend_technical.md → Data Collection`

### Setup
1. Sign up at https://decodo.com
2. Use code `DECODO30` for 30% discount
3. Get API key → `DECODO_API_KEY`

### Cost Estimation
- ~$0.002 per check (100-200KB per scrape @ $12.50/GB)
- Starter plan: $225/month for 25GB (~225,000 checks)
- At 1,000 users × 2 auto slots × 1 check/day = 36,000 checks/month ≈ $72/month

### Product Validation
Before saving to DB, Decodo response must confirm:
- Product exists and is available
- Price field is not null
- Availability not in: `unavailable`, `out_of_stock`, `removed`

### Fields (verify on implementation)
- `title` — product name
- `price` — current price (parse float, strip `$` and `,`)
- `image_url` — product image (if returned)
- `seller_id` — seller identifier (if returned)
- `seller_name` — seller name (if returned)

---

## Pricing, Flows & Timeline

> 📊 See `pricing_models.md` for:
> - **Pricing & Revenue** — tiers, ad strategy, costs, projections, break-even analysis
> - **User Flows** — add product, configure mode, subscription ends, re-subscribe, payment fails
> - **Implementation Timeline** — week-by-week checklist (6 weeks)

> 📐 See `ux_spec.md` for:
> - **Mobile UI Mockups** — screens, cards, animations, swipe actions

---

## Deployment & Infrastructure

> 🔧 Security middleware, deep linking endpoints, full config → `backend_technical.md → Deployment`

### Database: Supabase (Pro — $25/month)
- 8GB disk, $10 compute credits (Micro: 2-core ARM, 1GB RAM)
- Automatic daily backups, Row Level Security (RLS)
- Upgrade to Small (+$50/month) at ~2,000+ DAU

### Backend: DigitalOcean App Platform (~$20/month)
- Deploy on git push
- Auto SSL, managed environment

### Security Checklist
- [ ] JWT validation (Clerk middleware)
- [ ] Stripe webhook signature verified
- [ ] Clerk webhook signature verified (svix)
- [ ] Helmet.js security headers
- [ ] Body size limit (10kb)
- [ ] Rate limiting (global + per-endpoint)
- [ ] CORS configured (explicit origins)
- [ ] Supabase RLS enabled on all tables
- [ ] Sentry error monitoring
- [ ] Env vars not in git

### New Dependencies Required
```bash
pnpm add svix express-rate-limit helmet cors @sentry/node
```

---

## Summary

### Core Behavior
- Product added → Manual mode by default (no auto checks, no notifications)
- Manual mode: user sees price in app, no push notification, 2 checks/day (free)
- Interval mode: notify ONLY on price change, never on same price
- Wish Price mode: notify ONLY when target reached → pause → user decides
- Interval and Wish Price are mutually exclusive (replace each other)
- Free tier: max 2 auto-check slots active simultaneously (of 5 products)
- Checking stops ONLY for: manual stop, sub ended, payment fail, product deleted, product unavailable

### Data Policy
- ✅ Data is NEVER deleted (products or checks)
- ✅ On downgrade: products hidden (not deleted), checks cleared only for 5 visible products
- ✅ Re-subscribe: ALL products and checks instantly restored

### Payment Grace Periods
- Monthly past_due: 12hr grace → then downgrade
- Annual past_due: 24hr grace → then downgrade
- Notification sent immediately with exact deadline and data impact

### Pricing
- Free + Ads: $0 (Banner + Interstitial + Native + Reward ads)
- Premium Monthly: $5.99/month
- Premium Annual: $49.99/year ($4.16/month — 30% savings)

### Free Tier Limits
- 5 products max
- 2 auto-check slots max (Interval or Wish Price active simultaneously)
- 3 remaining products: manual checks only
- Manual: 2 checks/day per product (no notifications)
- Interval: 12 or 24 hrs (notify on price change only)
- Wish Price: 24hrs only (notify on target reached)
- Last 5 checks per product shown
- Banner + Interstitial + Native + Reward ads
- **Self-sustaining on ad revenue from ~58 users**

### Premium Tier Limits
- 20 products max
- All 20 products can have auto-checks active simultaneously
- Manual: unlimited (no notifications)
- Interval: 6, 12, or 24 hrs (notify on price change only)
- Wish Price: 6, 12, or 24 hrs (notify on target reached)
- All checks kept (no limit)
- Ad-free

---

**Document version:** 11.0  
**Last updated:** May 29, 2026  
**Status:** Ready for implementation

---

## Known Gaps & Solutions

> 🔍 Full gap descriptions, solutions and status → `gaps.md`

**Pending:** GAP-04, GAP-16, GAP-17, GAP-20, GAP-21 — see `gaps.md`

---

**Document version:** 11.0
**Last updated:** May 29, 2026
**Status:** Ready for implementation
