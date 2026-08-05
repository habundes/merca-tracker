# Mercadolibre Price Tracker — Backend Technical Reference

**Related files:**
- `mercadolibre_tracker_simplified.md` — Main spec (architecture, features, flows)
- `ux_spec.md` — UI/UX specification
- `pricing_models.md` — Pricing model comparison

**Last Updated:** May 29, 2026

---

## Table of Contents

1. [Dependencies & Installation](#dependencies--installation)
2. [Database Schema](#database-schema)
3. [API Specification](#api-specification)
4. [Environment Variables](#environment-variables)
5. [Database Setup (Supabase)](#database-setup-supabase)
6. [Authentication — Clerk Implementation](#authentication--clerk-implementation)
7. [URL Validation — Code](#url-validation--code)
8. [Payments — Stripe Implementation](#payments--stripe-implementation)
9. [Notifications — Firebase Implementation](#notifications--firebase-implementation)
10. [Background Jobs](#background-jobs)
11. [Data Collection — Decodo](#data-collection--decodo)
12. [Manual Check Handler](#manual-check-handler)
13. [Deployment & Infrastructure](#deployment--infrastructure)
14. [Known Gaps & Solutions](#known-gaps--solutions) → `gaps.md`
15. [Code Organization](#code-organization) → `clean_architecture.md`

---

> 🏛️ **Architecture:** This file documents working implementation logic by feature (Auth, Payments, Notifications, etc). For how this code should be organized into layers (Domain / Application / Infrastructure / Presentation), folder structure, and dependency injection — see `clean_architecture.md`.

## Dependencies & Installation

### Backend
```bash
pnpm add express prisma @clerk/clerk-sdk-node svix stripe firebase-admin axios node-cron dotenv winston express-rate-limit helmet cors @sentry/node
```

### Mobile
```bash
pnpm add @clerk/clerk-expo expo-secure-store @stripe/react-native-stripe-sdk expo-notifications firebase expo-ads-admob expo-linking
```

---

## Database Schema

> **Database:** PostgreSQL via **Supabase Pro** ($25/month)
> **ORM:** Prisma (connects to Supabase via connection string)
> **Note:** Enable Row Level Security (RLS) on all tables in Supabase dashboard as an extra security layer beyond Prisma-level checks.

### Users Table
```sql
CREATE TABLE users (
  id VARCHAR PRIMARY KEY,                    -- Clerk user ID
  email VARCHAR UNIQUE NOT NULL,
  subscription_tier VARCHAR DEFAULT 'free',  -- 'free' or 'premium'
  subscription_status VARCHAR,               -- 'active', 'canceled', 'past_due', 'expired'
  stripe_customer_id VARCHAR UNIQUE,
  stripe_subscription_id VARCHAR,
  stripe_price_id VARCHAR,                   -- price_xxxxx_month or price_xxxxx_year
  premium_access_until TIMESTAMP,            -- When premium access expires
  tracklist_count INT DEFAULT 0,
  active_auto_checks INT DEFAULT 0,           -- Track active interval/wish_price slots (max 2 for free)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX idx_users_premium_access_until ON users(premium_access_until);
```

### User_Products Table (Tracklist)
```sql
CREATE TABLE user_products (
  product_id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mercadolibre_id VARCHAR NOT NULL,
  url VARCHAR NOT NULL,
  title VARCHAR,
  image_url VARCHAR,                          -- From Decodo (if returned)
  seller_id VARCHAR,                          -- From Decodo (if returned)
  seller_name VARCHAR,                        -- From Decodo (if returned)
  current_price DECIMAL(10, 2),
  last_known_price DECIMAL(10, 2),

  -- Checking Mode
  check_mode VARCHAR DEFAULT 'manual',        -- 'manual', 'interval', 'wish_price'
  check_interval INT,                         -- 6, 12, or 24 (null if manual)
  wish_price DECIMAL(10, 2),                  -- Target price (null if not wish_price mode)

  -- Scheduling
  check_enabled BOOLEAN DEFAULT FALSE,        -- false = manual only
  next_check_at TIMESTAMP,                    -- null if manual

  -- Visibility (for downgrade)
  is_visible BOOLEAN DEFAULT TRUE,            -- false = hidden (downgraded, not deleted)

  -- Status
  is_available BOOLEAN DEFAULT TRUE,          -- false if product unavailable on ML

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(user_id, mercadolibre_id)
);

CREATE INDEX idx_user_products_user_id ON user_products(user_id);
CREATE INDEX idx_user_products_next_check ON user_products(next_check_at);
CREATE INDEX idx_user_products_check_enabled ON user_products(check_enabled);
CREATE INDEX idx_user_products_created_at ON user_products(user_id, created_at DESC);
CREATE INDEX idx_user_products_is_visible ON user_products(user_id, is_visible);
```

**Key field: `is_visible`**
- `true` → shown in tracklist
- `false` → hidden (product stays in DB, checks stay in DB)
- When user re-subscribes → all set back to `true`

### Price_History Table
```sql
CREATE TABLE price_history (
  history_id BIGSERIAL PRIMARY KEY,
  product_id INT NOT NULL REFERENCES user_products(product_id) ON DELETE CASCADE,
  price DECIMAL(10, 2) NOT NULL,
  previous_price DECIMAL(10, 2),
  price_change VARCHAR,                       -- 'up', 'down', 'same'
  check_type VARCHAR,                         -- 'manual', 'interval', 'wish_price'
  checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_price_history_product_id ON price_history(product_id);
CREATE INDEX idx_price_history_checked_at ON price_history(product_id, checked_at DESC);
```

**Retention Policy:**
- Free tier: Show last 5 checks per visible product
- Premium: Show all checks
- On downgrade: Clear checks for visible products (up to 5, or all if fewer than 5) — fresh start
- Hidden products: All checks kept untouched in DB
- Re-subscribe: All checks restored
- Product deleted: All checks deleted (CASCADE)

### Manual_Check_Log Table (Rate Limiting)
```sql
CREATE TABLE manual_check_log (
  log_id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INT NOT NULL REFERENCES user_products(product_id) ON DELETE CASCADE,
  checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_manual_check_log ON manual_check_log(user_id, product_id, checked_at DESC);
```

**Rate Limit:**
- Free: Max 2 manual checks per day per product (resets midnight UTC)
- Premium: Unlimited

### Notification_Tokens Table
```sql
CREATE TABLE notification_tokens (
  token_id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fcm_token VARCHAR NOT NULL,
  device_type VARCHAR,                        -- 'ios' or 'android'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, fcm_token)
);

CREATE INDEX idx_notification_tokens_user_id ON notification_tokens(user_id);
```

### Stripe_Events Table (Audit Log)
```sql
CREATE TABLE stripe_events (
  event_id VARCHAR PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR NOT NULL,
  data JSONB,
  processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stripe_events_user_id ON stripe_events(user_id);
```

---

---

## API Specification

### Base URL
```
Development: http://localhost:3000/api
Production:  https://api.pricetrackerapp.com/api
```

### Authentication Header
```
Authorization: Bearer <JWT_FROM_CLERK>
```

---

### Tracklist Endpoints

#### POST /api/user/add-product
```json
Request:
{ "url": "https://articulo.mercadolibre.com.mx/MLM-1234567890" }

Response (Success):
{
  "success": true,
  "data": {
    "product_id": 123,
    "mercadolibre_id": "MLM-1234567890",
    "title": "iPhone 15 Pro",
    "current_price": 899.99,
    "image_url": "https://...",
    "seller_id": "seller_123",
    "seller_name": "TechStore MX",
    "check_mode": "manual"
  }
}

Response (Tracklist Full):
{
  "success": false,
  "error": "tracklist_full",
  "message": "Tracklist full (5/5). Delete items to add more."
}

Response (Product Unavailable):
{
  "success": false,
  "error": "product_unavailable",
  "message": "This product is no longer available on Mercadolibre."
}

Response (Already Tracking):
{
  "success": false,
  "error": "already_tracking",
  "message": "You are already tracking this product."
}

Response (Empty Field):
{
  "success": false,
  "error": "empty_url",
  "message": "Por favor ingresa una URL de Mercadolibre."
}

Response (Not a URL):
{
  "success": false,
  "error": "invalid_format",
  "message": "El texto ingresado no es una URL válida."
}

Response (Not Mercadolibre):
{
  "success": false,
  "error": "invalid_domain",
  "message": "Solo se aceptan URLs de Mercadolibre México (mercadolibre.com.mx)."
}

Response (No Product ID):
{
  "success": false,
  "error": "invalid_product",
  "message": "No se encontró un ID de producto válido en la URL. Asegúrate de copiar la URL del producto."
}
```

#### GET /api/user/tracklist
Returns only visible products (is_visible = true), ordered newest first:
```json
Response:
{
  "success": true,
  "data": [
    {
      "product_id": 123,
      "title": "iPhone 15 Pro",
      "image_url": "https://...",
      "seller_name": "TechStore MX",
      "current_price": 899.99,
      "check_mode": "manual",
      "check_interval": null,
      "wish_price": null,
      "check_enabled": false,
      "next_check_at": null,
      "is_available": true
    }
  ],
  "tracklist_count": 1,
  "tracklist_limit": 5,
  "hidden_count": 0
}
```

Note: Products ordered by `created_at DESC` — newest product always first in array.
`hidden_count` shows how many products are hidden (shown in upgrade CTA).

#### DELETE /api/user/products/:product_id
```json
Response:
{ "success": true, "message": "Product removed from tracklist" }
```

#### PUT /api/user/products/:product_id/mode
```json
Request (Set to Manual):
{ "check_mode": "manual" }

Request (Set to Interval — replaces Wish Price if active):
{
  "check_mode": "interval",
  "check_interval": 24
}

Request (Set to Wish Price — replaces Interval if active):
{
  "check_mode": "wish_price",
  "wish_price": 749.99,
  "check_interval": 24
}

Response (Success):
{
  "success": true,
  "data": {
    "product_id": 123,
    "check_mode": "wish_price",
    "wish_price": 749.99,
    "check_interval": 24,
    "check_enabled": true,
    "next_check_at": "2024-05-30T12:00:00Z",
    "auto_slots_used": 2,
    "auto_slots_limit": 2
  }
}

Response (Invalid interval for free tier — e.g. 6hrs):
{
  "success": false,
  "error": "invalid_interval",
  "message": "Free tier supports 12 or 24 hour intervals only."
}

Response (Auto-check slots full — free tier only):
{
  "success": false,
  "error": "auto_slots_full",
  "message": "Ya tienes 2 productos con verificación automática activa. Desactiva uno para activar este.",
  "auto_slots_used": 2,
  "auto_slots_limit": 2
}

Response (Invalid wish_price):
{
  "success": false,
  "error": "invalid_wish_price",
  "message": "El precio deseado debe ser un número mayor a cero."
}
```

**Wish price validation (GAP-12 fix):**
```javascript
// PUT /api/user/products/:product_id/mode
export const setProductMode = async (req, res) => {
  const { check_mode, check_interval, wish_price } = req.body;

  // Validate wish_price when mode is wish_price
  if (check_mode === 'wish_price') {
    if (wish_price === undefined || wish_price === null) {
      return res.status(400).json({
        success: false,
        error: 'invalid_wish_price',
        message: 'El precio deseado es requerido.'
      });
    }

    const price = parseFloat(wish_price);

    if (isNaN(price)) {
      return res.status(400).json({
        success: false,
        error: 'invalid_wish_price',
        message: 'El precio deseado debe ser un número válido.'
      });
    }

    if (price <= 0) {
      return res.status(400).json({
        success: false,
        error: 'invalid_wish_price',
        message: 'El precio deseado debe ser mayor a cero.'
      });
    }

    if (price > 9999999) {
      return res.status(400).json({
        success: false,
        error: 'invalid_wish_price',
        message: 'El precio deseado es demasiado alto.'
      });
    }
  }

  // ... rest of mode logic
};
```

> 🔧 Auto-check slot enforcement logic → `backend_technical.md → Authentication → JWT Verification Middleware`

---

### Manual Check Endpoint

#### POST /api/user/products/:product_id/check
```json
Response (Success - Price Changed):
{
  "success": true,
  "data": {
    "product_id": 123,
    "new_price": 749.99,
    "old_price": 899.99,
    "price_change": "down",
    "checks_remaining_today": 1
  }
}

Response (Success - Price Same):
{
  "success": true,
  "data": {
    "product_id": 123,
    "new_price": 899.99,
    "price_change": "same",
    "checks_remaining_today": 1
  }
}

Response (Rate Limit - Free User):
{
  "success": false,
  "error": "rate_limit",
  "message": "Daily limit reached (2/2). Resets at midnight.",
  "checks_used": 2,
  "checks_limit": 2,
  "resets_at": "2024-05-30T00:00:00Z"
}

Response (Product Unavailable):
{
  "success": false,
  "error": "product_unavailable",
  "message": "This product is no longer available on Mercadolibre."
}
```

---

### Check History Endpoint

#### GET /api/user/products/:product_id/history
```json
Response:
{
  "success": true,
  "data": {
    "product_id": 123,
    "title": "iPhone 15 Pro",
    "current_price": 749.99,
    "checks": [
      {
        "history_id": 501,
        "price": 749.99,
        "previous_price": 899.99,
        "price_change": "down",
        "check_type": "interval",
        "checked_at": "2024-05-30T12:00:00Z"
      },
      {
        "history_id": 500,
        "price": 899.99,
        "previous_price": 899.99,
        "price_change": "same",
        "check_type": "manual",
        "checked_at": "2024-05-29T14:30:00Z"
      }
    ],
    "total_checks": 2,
    "check_limit": 5
  }
}
```

---

### Subscription Endpoints

#### GET /api/user/subscription
```json
Response:
{
  "success": true,
  "data": {
    "subscription_tier": "premium",
    "subscription_status": "active",
    "premium_access_until": "2024-06-29T00:00:00Z",
    "hidden_products": 0
  }
}
```

#### POST /api/user/checkout-session
```json
Request: { "price_id": "price_xxxxx_month" }

Response:
{
  "success": true,
  "data": { "checkout_url": "https://checkout.stripe.com/..." }
}
```

#### GET /api/user/stripe-portal
```json
Response:
{
  "success": true,
  "data": { "portal_url": "https://billing.stripe.com/..." }
}
```

---

---

## Environment Variables

```
# App
NODE_ENV=production
PORT=3000
API_URL=https://api.pricetrackerapp.com

# Database (Supabase)
DATABASE_URL=postgresql://...  # From Supabase → Settings → Database → Connection string

# Clerk
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_MONTHLY=price_...
STRIPE_PRICE_ANNUAL=price_...

# Firebase
FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...

# Decodo
DECODO_API_KEY=...
DECODO_API_URL=https://api.decodo.com/v1

# Deep Linking
APPLE_TEAM_ID=XXXXXXXXXX
ANDROID_SHA256_FINGERPRINT=XX:XX:XX:...

# Monitoring
SENTRY_DSN=...
```

---

## Database Setup (Supabase)

### Supabase Pro ($25/month)
- 8GB disk, $10 compute credits (Micro: 2-core ARM, 1GB RAM)
- Automatic daily backups
- Row Level Security (RLS) — enable on all tables
- Prisma compatible via connection string

### Free tier (dev only)
- 500MB, pauses after 1 week inactivity — NOT for production

### Upgrade to Small instance (+$50/month) when:
- Consistent CPU pressure at 2,000+ DAU
- Complex queries slowing down

### `updated_at` Auto-Update Triggers
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_products_updated_at
  BEFORE UPDATE ON user_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_tokens_updated_at
  BEFORE UPDATE ON notification_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## Authentication — Clerk Implementation

### Frontend Setup (Expo)
```javascript
// App.tsx
import { ClerkProvider, SignedIn, SignedOut } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';

const tokenCache = {
  async getToken(key) { return SecureStore.getItemAsync(key); },
  async saveToken(key, value) { return SecureStore.setItemAsync(key, value); },
  async clearToken(key) { return SecureStore.deleteItemAsync(key); }
};

export default function App() {
  return (
    <ClerkProvider
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY}
      tokenCache={tokenCache}
    >
      <SignedIn><MainNavigator /></SignedIn>
      <SignedOut><AuthNavigator /></SignedOut>
    </ClerkProvider>
  );
}
```

### JWT Verification Middleware
```javascript
// middleware/verifyClerk.js
import { clerkClient } from '@clerk/clerk-sdk-node';

export const verifyClerkToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, error: 'unauthorized' });

  try {
    const decoded = await clerkClient.verifyToken(token);
    req.user = { id: decoded.sub };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'unauthorized', message: 'Invalid or expired token' });
  }
};

app.use('/api', verifyClerkToken);
```

### Webhook Handler (with svix signature verification)
```javascript
import { Webhook } from 'svix';

app.post('/webhooks/clerk', express.raw({ type: 'application/json' }), async (req, res) => {
  const svix_id        = req.headers['svix-id'];
  const svix_timestamp = req.headers['svix-timestamp'];
  const svix_signature = req.headers['svix-signature'];

  if (!svix_id || !svix_timestamp || !svix_signature)
    return res.status(400).json({ error: 'Missing svix headers' });

  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
  let evt;
  try {
    evt = wh.verify(req.body, { 'svix-id': svix_id, 'svix-timestamp': svix_timestamp, 'svix-signature': svix_signature });
  } catch (err) {
    return res.status(400).json({ error: 'Invalid webhook signature' });
  }

  switch (evt.type) {
    case 'user.created':
      await db.users.create({
        data: { id: evt.data.id, email: evt.data.email_addresses[0].email_address, subscription_tier: 'free', tracklist_count: 0, active_auto_checks: 0 }
      });
      break;
    case 'user.deleted':
      await db.users.delete({ where: { id: evt.data.id } });
      break;
  }
  res.json({ success: true });
});
```

### Sign Out (Frontend)
```javascript
import { useClerk } from '@clerk/clerk-expo';

export function SignOutButton() {
  const { signOut } = useClerk();
  return <Button onPress={() => signOut()} title="Cerrar sesión" />;
}
```

### Authenticated API Calls (Frontend)
```javascript
import { useAuth } from '@clerk/clerk-expo';
import axios from 'axios';

export function useApiClient() {
  const { getToken } = useAuth();

  const apiCall = async (method, endpoint, data = null) => {
    const token = await getToken();
    return axios({
      method,
      url: `${process.env.EXPO_PUBLIC_API_URL}${endpoint}`,
      headers: { Authorization: `Bearer ${token}` },
      data
    });
  };

  return { apiCall };
}
```

---

## URL Validation — Code

### Layer 1: Frontend (JavaScript/React Native)
```javascript
const ML_DOMAIN_REGEX   = /mercadolibre\.com\.mx/i;
const ML_PRODUCT_ID_REGEX = /MLM-?\d{7,12}/i;
const URL_REGEX         = /^https?:\/\/.+/i;

export function validateMercadolibreUrl(input) {
  const value = input.trim();

  if (!value)
    return { valid: false, error: 'empty_url', message: 'Por favor ingresa una URL de Mercadolibre.' };

  if (ML_PRODUCT_ID_REGEX.test(value) && !value.startsWith('http')) {
    const match = value.match(ML_PRODUCT_ID_REGEX);
    return { valid: true, mercadolibre_id: match[0].replace('-', ''), normalized_url: `https://articulo.mercadolibre.com.mx/${match[0]}` };
  }

  if (!URL_REGEX.test(value))
    return { valid: false, error: 'invalid_format', message: 'El texto ingresado no es una URL válida.' };

  if (!ML_DOMAIN_REGEX.test(value))
    return { valid: false, error: 'invalid_domain', message: 'Solo se aceptan URLs de Mercadolibre México (mercadolibre.com.mx).' };

  const productMatch = value.match(ML_PRODUCT_ID_REGEX);
  if (!productMatch)
    return { valid: false, error: 'invalid_product', message: 'No se encontró un ID de producto en la URL.' };

  return { valid: true, mercadolibre_id: productMatch[0].replace('-', ''), normalized_url: value };
}
```

### Debounce & Keyboard (React Native)
```javascript
const inputRef = useRef(null);
const debounceTimer = useRef(null);

const handleInputChange = (text) => {
  setInputValue(text);
  if (debounceTimer.current) clearTimeout(debounceTimer.current);
  // After 1 second → open keyboard
  debounceTimer.current = setTimeout(() => { inputRef.current?.focus(); }, 1000);
};

const handleSubmit = () => {
  Keyboard.dismiss();
  validateAndAdd(inputValue);
};

<TextInput
  ref={inputRef}
  onChangeText={handleInputChange}
  onSubmitEditing={handleSubmit}
  returnKeyType="send"
  blurOnSubmit={true}
/>
```

### Layer 2: Backend (Express)
```javascript
// utils/validateMercadolibreUrl.js — same regex, used before Decodo call
export function validateMercadolibreUrl(input) {
  if (!input?.trim()) return { valid: false, error: 'empty_url' };
  const value = input.trim();

  if (/MLM-?\d{7,12}/i.test(value) && !value.startsWith('http')) {
    const match = value.match(/MLM-?\d{7,12}/i);
    return { valid: true, mercadolibre_id: match[0].replace('-',''), normalized_url: `https://articulo.mercadolibre.com.mx/${match[0]}` };
  }
  if (!/^https?:\/\/.+/i.test(value)) return { valid: false, error: 'invalid_format' };
  if (!/mercadolibre\.com\.mx/i.test(value)) return { valid: false, error: 'invalid_domain' };
  const m = value.match(/MLM-?\d{7,12}/i);
  if (!m) return { valid: false, error: 'invalid_product' };
  return { valid: true, mercadolibre_id: m[0].replace('-',''), normalized_url: value };
}
```

---

## Payments — Stripe Implementation

### Webhook Handler
```javascript
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  // Idempotency check (GAP-02)
  const existing = await db.stripeEvents.findUnique({ where: { event_id: event.id } });
  if (existing) return res.json({ received: true, skipped: true });

  await db.stripeEvents.create({ data: { event_id: event.id, event_type: event.type, data: event.data } });

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const sub = await stripe.subscriptions.retrieve(session.subscription);
      const priceId = sub.items.data[0].price.id;
      const periodEnd = new Date(sub.current_period_end * 1000);
      let premiumAccessUntil = periodEnd;
      if (priceId === process.env.STRIPE_PRICE_ANNUAL) {
        premiumAccessUntil = new Date(periodEnd);
        premiumAccessUntil.setFullYear(premiumAccessUntil.getFullYear() + 1);
      }
      await db.userProducts.updateMany({ where: { user_id: session.client_reference_id }, data: { is_visible: true } });
      await db.users.update({
        where: { id: session.client_reference_id },
        data: { stripe_customer_id: session.customer, stripe_subscription_id: session.subscription, stripe_price_id: priceId, subscription_tier: 'premium', subscription_status: 'active', premium_access_until: premiumAccessUntil }
      });
      break;
    }
    case 'customer.subscription.deleted': {
      const delSub = event.data.object;
      await db.users.update({ where: { stripe_customer_id: delSub.customer }, data: { subscription_status: 'canceled' } });
      break;
    }
    case 'customer.subscription.updated': {
      const updSub = event.data.object;
      if (updSub.status === 'past_due') {
        const failedUser = await db.users.findUnique({ where: { stripe_customer_id: updSub.customer } });
        const isAnnual = failedUser.stripe_price_id === process.env.STRIPE_PRICE_ANNUAL;
        const graceMs = isAnnual ? 24 * 60 * 60 * 1000 : 12 * 60 * 60 * 1000;
        const downgradeAt = new Date(Date.now() + graceMs);
        const tracklistCount = await db.userProducts.count({ where: { user_id: failedUser.id } });
        const graceLabel = isAnnual ? '24 horas' : '12 horas';
        const expiresAt = downgradeAt.toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
        await db.users.update({ where: { id: failedUser.id }, data: { subscription_status: 'past_due', premium_access_until: downgradeAt } });
        await notifyUser(failedUser.id, '⚠️ Pago fallido — Acción requerida',
          `Actualiza tu método de pago en ${graceLabel} o tu cuenta pasará a Free + Ads.\n\n` +
          `Productos afectados: ${Math.max(0, tracklistCount - 5)} ocultos (últimos 5 se mantienen).\n` +
          `Nota: Tus datos nunca se eliminan. Re-suscríbete para restaurar todo.\n\nFecha límite: ${expiresAt}`);
      } else if (updSub.status === 'active') {
        const recoveredUser = await db.users.findUnique({ where: { stripe_customer_id: updSub.customer } });
        await db.userProducts.updateMany({ where: { user_id: recoveredUser.id }, data: { is_visible: true } });
        await db.users.update({ where: { stripe_customer_id: updSub.customer }, data: { subscription_status: 'active', subscription_tier: 'premium' } });
        await notifyUser(recoveredUser.id, '✅ Pago recuperado', 'Tu acceso Premium ha sido restaurado. Todos tus productos y checks están de vuelta.');
      }
      break;
    }
  }
  res.json({ received: true });
});
```

### Automatic Downgrade Job (Hourly)
```javascript
cron.schedule('0 * * * *', async () => {
  const expiredUsers = await db.users.findMany({
    where: { subscription_tier: 'premium', premium_access_until: { lt: new Date() }, subscription_status: { in: ['canceled', 'past_due', 'expired'] } }
  });

  for (const user of expiredUsers) {
    try {
      const allProducts = await db.userProducts.findMany({ where: { user_id: user.id }, orderBy: { created_at: 'desc' } });
      const keepCount = Math.min(allProducts.length, 5);
      const productsToShow = allProducts.slice(0, keepCount);
      const productsToHide = allProducts.slice(keepCount);

      // 1. Stop all auto-checks
      await db.userProducts.updateMany({ where: { user_id: user.id }, data: { check_enabled: false, check_mode: 'manual', check_interval: null, wish_price: null, next_check_at: null } });

      // 2. Hide products beyond last 5
      if (productsToHide.length > 0)
        await db.userProducts.updateMany({ where: { product_id: { in: productsToHide.map(p => p.product_id) } }, data: { is_visible: false } });

      // 3. Clear checks for visible products (fresh start)
      for (const product of productsToShow)
        await db.priceHistory.deleteMany({ where: { product_id: product.product_id } });

      // 4. Downgrade user
      await db.users.update({ where: { id: user.id }, data: { subscription_tier: 'free', subscription_status: 'expired', tracklist_count: productsToShow.length } });

      // 5. Notify
      const isPastDue = user.subscription_status === 'past_due';
      const hiddenMsg = productsToHide.length > 0 ? `${productsToHide.length} producto${productsToHide.length !== 1 ? 's' : ''} oculto${productsToHide.length !== 1 ? 's' : ''} (no eliminados). ` : '';
      await notifyUser(user.id,
        isPastDue ? '⚠️ Acceso Premium revocado' : '📉 Suscripción Premium terminada',
        `Cuenta en Free + Ads. Mostrando ${productsToShow.length} producto${productsToShow.length !== 1 ? 's' : ''}. ${hiddenMsg}Re-suscríbete para restaurar todo.`);
    } catch (err) {
      console.error(`Error downgrading user ${user.id}:`, err);
    }
  }
});
```

---

## Notifications — Firebase Implementation

### Backend Setup
```javascript
import admin from 'firebase-admin';

admin.initializeApp({ credential: admin.credential.cert(require('./firebase-key.json')) });

export const notifyUser = async (userId, title, body) => {
  const tokens = await db.notificationTokens.findMany({ where: { user_id: userId } });
  for (const token of tokens) {
    try {
      await admin.messaging().send({ token: token.fcm_token, notification: { title, body } });
    } catch (err) {
      const invalidCodes = ['messaging/invalid-registration-token', 'messaging/registration-token-not-registered'];
      if (invalidCodes.includes(err.code)) {
        await db.notificationTokens.delete({ where: { token_id: token.token_id } });
      } else {
        console.error(`FCM error for token ${token.token_id}:`, err);
      }
    }
  }
};
```

### Frontend Token Setup (Expo)
```javascript
import * as Notifications from 'expo-notifications';

export function useNotificationToken() {
  const { getToken } = useAuth();
  useEffect(() => {
    (async () => {
      const token = await Notifications.getExpoPushTokenAsync();
      const authToken = await getToken();
      await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/user/notification-token`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fcm_token: token.data })
      });
    })();
  }, []);
}
```

### Notification Deep Link Handler (Expo)
```javascript
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';

Notifications.addNotificationResponseReceivedListener(response => {
  const deepLink = response.notification.request.content.data?.deepLink;
  if (deepLink) Linking.openURL(deepLink);
});
```

---

## Background Jobs

### Hourly Price Check Job
```javascript
import cron from 'node-cron';

// Concurrency lock (GAP-03)
let priceCheckJobRunning = false;

cron.schedule('0 * * * *', async () => {
  if (priceCheckJobRunning) { console.warn('[PriceCheck] Previous job still running — skipping'); return; }
  priceCheckJobRunning = true;

  try {
    const dueProducts = await db.userProducts.findMany({
      where: { check_enabled: true, is_visible: true, check_mode: { in: ['interval', 'wish_price'] }, next_check_at: { lte: new Date() } },
      include: { user: true }
    });

    for (const product of dueProducts) {
      try {
        const result = await scrapeProduct(product.url);

        if (!result.success || !result.is_available) {
          await db.userProducts.update({ where: { product_id: product.product_id }, data: { check_enabled: false, is_available: false } });
          await notifyUser(product.user_id, '⚠️ Producto no disponible', `${product.title} ya no está disponible en Mercadolibre.`);
          continue;
        }

        const newPrice = result.price;
        const oldPrice = product.last_known_price || product.current_price;
        let priceChange = 'same';
        if (newPrice > oldPrice) priceChange = 'up';
        if (newPrice < oldPrice) priceChange = 'down';

        await db.priceHistory.create({ data: { product_id: product.product_id, price: newPrice, previous_price: oldPrice, price_change: priceChange, check_type: product.check_mode } });

        if (product.check_mode === 'interval') {
          if (priceChange !== 'same') {
            const emoji = priceChange === 'up' ? '📈' : '📉';
            await notifyUser(product.user_id, `${product.title} ${emoji}`, `Precio: $${oldPrice} → $${newPrice}`);
          }
          const nextCheck = new Date();
          nextCheck.setHours(nextCheck.getHours() + product.check_interval);
          await db.userProducts.update({ where: { product_id: product.product_id }, data: { current_price: newPrice, last_known_price: oldPrice, next_check_at: nextCheck } });
        }

        if (product.check_mode === 'wish_price') {
          if (newPrice <= product.wish_price) {
            await notifyUser(product.user_id, '🎯 ¡Precio deseado alcanzado!', `${product.title} ahora $${newPrice}. Abre la app para continuar.`);
            await db.userProducts.update({ where: { product_id: product.product_id }, data: { check_enabled: false, current_price: newPrice, last_known_price: oldPrice } });
          } else {
            const nextCheck = new Date();
            nextCheck.setHours(nextCheck.getHours() + product.check_interval);
            await db.userProducts.update({ where: { product_id: product.product_id }, data: { current_price: newPrice, last_known_price: oldPrice, next_check_at: nextCheck } });
          }
        }

        // Trim history for free users (keep last 5)
        if (product.user.subscription_tier === 'free') {
          const allChecks = await db.priceHistory.findMany({ where: { product_id: product.product_id }, orderBy: { checked_at: 'desc' } });
          if (allChecks.length > 5)
            await db.priceHistory.deleteMany({ where: { history_id: { in: allChecks.slice(5).map(c => c.history_id) } } });
        }

      } catch (err) {
        // Push next_check_at forward on error (GAP-07)
        const retryAt = new Date();
        retryAt.setHours(retryAt.getHours() + product.check_interval);
        await db.userProducts.update({ where: { product_id: product.product_id }, data: { next_check_at: retryAt } });
        console.error(`[PriceCheck] Error for product ${product.product_id}:`, err);
      }
    }
  } catch (err) {
    console.error('[PriceCheck] Fatal error:', err);
  } finally {
    priceCheckJobRunning = false;
  }
});
```

---

## Data Collection — Decodo

### Scrape Function
```javascript
export async function scrapeProduct(url) {
  try {
    const response = await axios.post(
      `${process.env.DECODO_API_URL}/scrape`,
      { url, render_js: true, timeout: 30000 },
      { headers: { 'Authorization': `Bearer ${process.env.DECODO_API_KEY}` } }
    );
    const data = response.data;
    if (!data || data.status !== 'success') return { success: false, is_available: false };

    const availability = data.data?.availability?.toLowerCase();
    const isAvailable = !['unavailable', 'out_of_stock', 'removed'].includes(availability) && data.data?.price != null;
    if (!isAvailable) return { success: true, is_available: false };

    return {
      success: true, is_available: true,
      title:       data.data.title || null,
      price:       parseFloat(data.data.price.toString().replace(/[$,]/g, '')),
      image_url:   data.data.image_url || null,    // Verify on implementation
      seller_id:   data.data.seller_id || null,    // Verify on implementation
      seller_name: data.data.seller_name || null   // Verify on implementation
    };
  } catch (err) {
    console.error('Decodo error:', err);
    return { success: false, is_available: false, error: err.message };
  }
}
```

---

## Manual Check Handler

```javascript
export const manualCheck = async (req, res) => {
  const { product_id } = req.params;
  const userId = req.user.id;

  const user    = await db.users.findUnique({ where: { id: userId } });
  // GAP-06: always scope to authenticated user
  const product = await db.userProducts.findFirst({ where: { product_id: parseInt(product_id), user_id: userId, is_visible: true } });
  if (!product) return res.status(404).json({ error: 'not_found' });

  // Rate limit: free = 2/day (+ 1 reward if watched ad)
  if (user.subscription_tier === 'free') {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const checksToday = await db.manualCheckLog.count({ where: { user_id: userId, product_id: parseInt(product_id), checked_at: { gte: today } } });
    if (checksToday >= 2) {
      const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
      return res.status(429).json({ success: false, error: 'rate_limit', message: 'Límite diario alcanzado (2/2). Resetea a medianoche.', checks_used: 2, checks_limit: 2, resets_at: tomorrow.toISOString() });
    }
  }

  const result = await scrapeProduct(product.url);
  if (!result.success || !result.is_available) {
    await db.userProducts.update({ where: { product_id: parseInt(product_id) }, data: { check_enabled: false, is_available: false } });
    return res.status(200).json({ success: false, error: 'product_unavailable', message: 'Este producto ya no está disponible en Mercadolibre.' });
  }

  const newPrice = result.price;
  const oldPrice = product.last_known_price || product.current_price;
  let priceChange = 'same';
  if (newPrice > oldPrice) priceChange = 'up';
  if (newPrice < oldPrice) priceChange = 'down';

  await db.priceHistory.create({ data: { product_id: parseInt(product_id), price: newPrice, previous_price: oldPrice, price_change: priceChange, check_type: 'manual' } });
  await db.manualCheckLog.create({ data: { user_id: userId, product_id: parseInt(product_id) } });
  await db.userProducts.update({ where: { product_id: parseInt(product_id) }, data: { current_price: newPrice, last_known_price: oldPrice } });

  // Trim to last 5 for free users
  if (user.subscription_tier === 'free') {
    const allChecks = await db.priceHistory.findMany({ where: { product_id: parseInt(product_id) }, orderBy: { checked_at: 'desc' } });
    if (allChecks.length > 5)
      await db.priceHistory.deleteMany({ where: { history_id: { in: allChecks.slice(5).map(c => c.history_id) } } });
  }

  const checksRemainingToday = user.subscription_tier === 'free'
    ? 2 - (await db.manualCheckLog.count({ where: { user_id: userId, product_id: parseInt(product_id), checked_at: { gte: (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })() } } }))
    : null;

  return res.json({ success: true, data: { product_id: parseInt(product_id), new_price: newPrice, old_price: oldPrice, price_change: priceChange, checks_remaining_today: checksRemainingToday } });
};
```

---

## Deployment & Infrastructure

### Security Middleware
```javascript
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import * as Sentry from '@sentry/node';

// Sentry error monitoring
Sentry.init({ dsn: process.env.SENTRY_DSN, environment: process.env.NODE_ENV, tracesSampleRate: 0.1 });

// Security headers
app.use(helmet());

// Body size limit
app.use(express.json({ limit: '10kb' }));

// CORS
app.use(cors({
  origin: ['https://api.pricetrackerapp.com', 'http://localhost:3000', 'exp://*'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Global rate limit
app.use(rateLimit({ windowMs: 60 * 1000, max: 100 }));

// Stricter limit for add-product
app.post('/api/user/add-product', rateLimit({ windowMs: 60 * 1000, max: 10 }), ...);
```

### Deep Linking Setup

**`apple-app-site-association`** (serve at `/.well-known/apple-app-site-association`):
```javascript
app.get('/.well-known/apple-app-site-association', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json({ applinks: { apps: [], details: [{ appID: `${process.env.APPLE_TEAM_ID}.com.yourname.mltracker`, paths: ['/app/product/*', '/app/tracklist', '/app/subscribe'] }] } });
});
```

**`assetlinks.json`** (serve at `/.well-known/assetlinks.json`):
```javascript
app.get('/.well-known/assetlinks.json', (req, res) => {
  res.json([{ relation: ['delegate_permission/common.handle_all_urls'], target: { namespace: 'android_app', package_name: 'com.yourname.mltracker', sha256_cert_fingerprints: [process.env.ANDROID_SHA256_FINGERPRINT] } }]);
});
```

### Security Checklist
- [ ] JWT validation on all endpoints (Clerk middleware)
- [ ] Stripe webhook signature verified (`constructEvent`)
- [ ] Clerk webhook signature verified (`svix`)
- [ ] Helmet.js security headers
- [ ] HTTPS only
- [ ] Body size limit (`10kb`)
- [ ] Rate limiting (global + per-endpoint)
- [ ] SQL injection prevention (Prisma)
- [ ] CORS configured (explicit origins)
- [ ] Env vars not in git (`.gitignore`)
- [ ] Supabase RLS enabled on all tables
- [ ] Sentry error monitoring active
- [ ] Stale FCM tokens cleaned up on send failure

---

## Known Gaps & Solutions

> 🔍 Full gap descriptions, solutions, and status → `gaps.md`

---

## Code Organization

> 🏛️ Full Clean Architecture structure, layers, folder layout, and migration plan → `clean_architecture.md`

All implementation logic in this file (Authentication, Payments, Notifications, Background Jobs, Decodo, Manual Check Handler) is organized **by feature** for readability. When implementing, this logic should be structured into 4 layers per `clean_architecture.md`:

| Layer | Contains |
|-------|----------|
| **Domain** | Entities (`Product`, `User`), value objects (`CheckMode`), business rules (auto-check slot limit, downgrade logic, wish price validation) |
| **Application** | Use cases — one per workflow (`AddProductUseCase`, `SetCheckModeUseCase`, `RunHourlyPriceCheckUseCase`, webhook handlers) |
| **Infrastructure** | Prisma repositories, Stripe/Clerk/Decodo/Firebase gateway wrappers — this is where the code in this file physically lives |
| **Presentation** | Express routes, controllers, middleware — thin HTTP ↔ use case translation only |

**Quick reference — where each section of this file ends up:**

| Section in this file | Target layer/location |
|----------------------|------------------------|
| JWT Verification Middleware | `presentation/http/middleware/` |
| Clerk/Stripe Webhook Handlers | `presentation/http/webhooks/` + `application/use-cases/webhooks/` |
| URL Validation (Layer 1 + 2) | `infrastructure/security/url-validator.js` |
| Automatic Downgrade Job | `application/use-cases/jobs/` + `domain/rules/downgrade.rules.js` |
| Firebase Backend Setup | `infrastructure/gateways/firebase-notification.gateway.js` |
| Hourly Price Check Job | `application/use-cases/jobs/run-hourly-price-check.use-case.js` |
| Decodo Scrape Function | `infrastructure/gateways/decodo-scraper.gateway.js` |
| Manual Check Handler | `application/use-cases/products/manual-check-product.use-case.js` |
| Auto-check slot enforcement | `domain/rules/auto-check-slot.rules.js` |
| `wish_price` validation | `domain/value-objects/check-mode.vo.js` |

---

**Document version:** 2.0
**Last updated:** June 18, 2026
**Status:** Ready for implementation — see `clean_architecture.md` for layered structure
