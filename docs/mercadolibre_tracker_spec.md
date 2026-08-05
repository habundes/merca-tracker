# Mercadolibre Price Tracker App - Complete Specification

**Project:** Mobile app (iOS & Android) for tracking Mercadolibre product prices with premium features  
**Region:** Mexico only (.com.mx)  
**Status:** MVP Planning  
**Last Updated:** May 2026  

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Feature Matrix](#feature-matrix)
3. [Architecture](#architecture)
4. [Technology Stack](#technology-stack)
5. [Database Schema](#database-schema)
6. [API Specification](#api-specification)
7. [Authentication (Clerk)](#authentication-clerk)
8. [Payments (Stripe)](#payments-stripe)
9. [Notifications (Firebase)](#notifications-firebase)
10. [Background Jobs](#background-jobs)
11. [Data Collection (Decodo)](#data-collection-decodo)
12. [Pricing Strategy](#pricing-strategy)
13. [User Flows](#user-flows)
14. [Implementation Timeline](#implementation-timeline)
15. [Deployment & Infrastructure](#deployment--infrastructure)

---

## Project Overview

### Problem
Users want to track Mercadolibre product prices over time to find the best deals, but there's no easy way to see price history or set up automatic price alerts.

### Solution
A mobile app where users:
1. Paste Mercadolibre product URLs
2. See price history (last 7 days)
3. Free tier: Manual price checks + ads
4. Premium tier: Automatic scheduled checks every 12/24/48 hours + automatic price alerts + push notifications

### Monetization
- **Free + Ads:** Users get the core experience with Google AdMob ads
- **Premium:** $3.99/month or $39.99/year for automatic checks and alerts

### Key Constraints
- Mexico only for MVP (Mercadolibre .com.mx)
- Solo developer initially
- Scalable from day 1 (but not over-engineered)
- Privacy-first (only user can see their data)

---

## Feature Matrix

| Feature | Free + Ads | Premium |
|---------|-----------|---------|
| **Watchlist Size** | 20 items max | 100 items max |
| **Price History** | Last 7 days | Last 7 days |
| **Manual Price Check** | ✅ Yes (5/day limit) | ✅ Yes (unlimited) |
| **Automatic Checks** | ❌ No | ✅ Yes (12/24/48 hr intervals) |
| **Price Alerts** | ❌ No | ✅ Yes (automatic) |
| **Push Notifications** | ❌ No | ✅ Yes |
| **Ads** | ✅ Yes | ❌ No (ad-free) |
| **Cost** | Free | $3.99/month or $39.99/year |

### Detailed Features

#### Authentication
- Sign up / Login via Clerk
- Supported methods:
  - ✅ Email/Password (traditional)
  - ✅ Google OAuth (easy)
  - ✅ Apple Sign-In (iOS requirement)
  - ❌ GitHub (not included)
- No password management needed (Clerk handles it)
- User profile management

#### Watchlist Management
- **Auto-add feature:** Paste Mercadolibre URL → automatically added to watchlist ✨
- Auto-extract product ID from URL (supports: `MLM-1234567890` or full URL)
- View all tracked products
- See current price + price history chart (last 7 days)
- Delete from watchlist (free users can delete to manage 20 items)
- Limit enforcement (20/100 based on tier)
- **Important:** `added_date` is tracked for all products (used when downgrading from Premium)

#### Free User Features
- Manual "Check Price Now" button (rate limited: 5/day)
- Ad banner + interstitial ads (Google AdMob)
- Price history from manual checks only
- Current price display

#### Premium User Features
- Configure automatic checks per product
  - Choose interval: 12 hours, 24 hours, or 48 hours
  - Set and forget
  - System automatically checks at configured times
- Set price alerts
  - Notify when price drops to specific amount
  - Automatic push notification when triggered
  - One-time alert (can re-arm)
- View price history from both manual and automatic checks
- Ad-free experience
- Unlimited manual checks (if desired)

#### Subscription Management
- View current subscription tier and details
- Upgrade to Premium from within app
- Choose: Monthly ($3.99/month) or Annual ($39.99/year)
- Manage subscription via Stripe Customer Portal
- **Monthly:** Cancel anytime, keep premium access until billing period ends ✨
- **Annual:** Cancel anytime, keep premium access until year ends ✨
- Clear upgrade path when hitting limits

#### When Monthly Premium Cancels
- User cancels subscription (sets `cancel_at_period_end = true`)
- Sees message: "Subscription will end on [date]. You'll keep premium features until then."
- User keeps full premium access until `current_period_end`
- On period end date:
  - Watchlist frozen (can only manage last 20 items)
  - Auto-checks stop
  - Notifications stop
  - Ads reappear
  - Can still view/delete items, manual check (5/day)
- Clear path to re-upgrade

#### When Annual Premium Cancels
- User cancels subscription (sets `cancel_at_period_end = true`)
- Sees message: "Subscription will end on [date]. You'll keep premium features until then."
- User keeps full premium access until `premium_access_until` (1 year from purchase)
- On year end date:
  - Automatically downgrades to free tier
  - Last 20 items remain (by added_date DESC)
  - Auto-checks stop
  - Notifications stop
  - Ads reappear
  - Can still view/delete items, manual check (5/day)

---

## Architecture

### High-Level Architecture Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                  Expo Mobile App                               │
│        (iOS & Android with Platform-Specific UI)               │
│                                                                 │
│  - Clerk authentication UI                                     │
│  - Product URL paste input                                     │
│  - Watchlist display (iOS HIG + Android Material Design)       │
│  - Price charts                                                │
│  - Alert configuration (premium only)                          │
│  - Subscription management (Stripe checkout)                   │
│  - Google AdMob ads (free tier)                                │
│  - Firebase push notifications (premium)                       │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     │ REST API + JWT (Clerk)
                     │
┌────────────────────▼─────────────────────────────────────────┐
│              Node.js Backend (Express.js)                     │
│                                                                 │
│  Authentication Layer:                                         │
│  ├─ Clerk webhook receiver (user created/updated/deleted)     │
│  ├─ JWT verification middleware                               │
│  ├─ User context injection                                    │
│                                                                 │
│  Business Logic:                                               │
│  ├─ URL parser (extract MLM-xxxxx from URLs)                  │
│  ├─ Watchlist CRUD (with 20/100 limit enforcement)            │
│  ├─ Product configuration (scheduled checks settings)          │
│  ├─ Manual price check endpoint (rate-limited)                │
│  ├─ Alert management (premium feature)                        │
│                                                                 │
│  Integrations:                                                 │
│  ├─ Stripe webhook receiver (subscription events)             │
│  ├─ Decodo API client (price scraping)                        │
│  ├─ Firebase Admin SDK (push notifications)                   │
│  └─ PostgreSQL query builder (data persistence)               │
│                                                                 │
│  Background Jobs:                                              │
│  ├─ Price check scheduler (every 8 hours)                     │
│  ├─ Alert trigger logic                                       │
│  ├─ Subscription sync (from Stripe)                           │
│  └─ Data cleanup (old price history)                          │
└────────────────────┬──────────────────────────────────────┬───┘
                     │                                      │
         ┌───────────┴──────────┐                           │
         │                      │                           │
┌────────▼────────┐     ┌──────▼────────┐    ┌────────────▼─────────┐
│  PostgreSQL DB  │     │  Decodo API   │    │  External Services:  │
│ (DigitalOcean)  │     │(Price Data)   │    │  ├─ Clerk (Auth)     │
│                 │     │               │    │  ├─ Stripe (Payment) │
│ ├─ users        │     │ • Proxy mgmt  │    │  └─ Firebase (Push)  │
│ ├─ user_products│     │ • JS rendering│    └──────────────────────┘
│ ├─ price_history│     │ • HTML parse  │
│ ├─ config       │     └───────────────┘
│ ├─ alerts       │
│ └─ subscriptions│
└─────────────────┘
```

### Data Flow Examples

#### User Adds a Product (Free User)
```
1. User opens app → Watchlist screen
2. Taps "Add Product"
3. Pastes: "https://articulo.mercadolibre.com.mx/MLM-1234567890"
4. App sends: POST /api/user/add-product { url: "..." }
5. Backend:
   ├─ Validates JWT (Clerk)
   ├─ Extracts product ID: MLM-1234567890
   ├─ Checks watchlist count (5/20 used)
   ├─ Product exists in DB? 
   │  ├─ No: Call Decodo API → scrape → store price
   │  └─ Yes: Use existing data
   ├─ Create user_product record
   └─ Return: { product_id, title, price, added_at }
6. App displays product in watchlist
7. User can manually check price (once/day limit applies)
```

#### Premium User Sets Automatic Check
```
1. User taps product → "Configure Checks"
2. Selects: "Check every 24 hours" + "Alert if price < $500"
3. App sends: POST /api/user/products/MLM-1234567890/config
   {
     check_interval: 24,
     alert_price: 500,
     alert_enabled: true
   }
4. Backend:
   ├─ Validates JWT + user is premium
   ├─ Creates/updates user_product_configs record
   ├─ Sets next_check_at = now + 24 hours
   └─ Returns: { config_id, next_check_at, ... }
5. App shows: "✅ Checking every 24 hours, alert at $500"
6. Background job (every 8 hours):
   ├─ Finds all configs with check_interval <= hours_elapsed
   ├─ Calls Decodo API for current price
   ├─ Stores in price_history
   ├─ Checks: is price <= $500?
   │  ├─ Yes: Send Firebase push notification
   │  ├─ Set alert_sent = true
   │  └─ User gets: "iPhone dropped to $480! 🔔"
   └─ Updates next_check_at = now + 24 hours
```

#### User Cancels Premium
```
1. User in Stripe Customer Portal → Cancel subscription
2. Stripe sends webhook: customer.subscription.deleted
3. Backend webhook handler:
   ├─ Finds user by stripe_customer_id
   ├─ Updates: subscription_tier = 'free'
   ├─ Deletes all user_product_configs (stops auto-checks)
   ├─ Disables push notifications
   ├─ Freezes watchlist (can't add, can manage last 20)
   └─ Logs the cancellation
4. App (next sync):
   ├─ GET /api/user/subscription → returns tier='free'
   ├─ Shows: "You're back on Free plan"
   ├─ Disables: automatic checks, alerts, config UI
   ├─ Shows ads again
   └─ Shows upgrade prompt

5. User can still:
   ├─ See price history (last 7 days)
   ├─ View watchlist (first 20 items)
   ├─ Manually check price (5/day limit)
   └─ Delete items (to manage watchlist)
```

---

## Technology Stack

### Frontend (Mobile)
- **Framework:** Expo (React Native)
- **Language:** JavaScript/TypeScript
- **State Management:** React Context or Zustand
- **UI Components:** Native components + custom styling
- **Platform-Specific UI:**
  - iOS: Apple Human Interface Guidelines (HIG)
  - Android: Material Design 3
- **API Client:** Axios or Fetch API
- **Authentication:** Clerk SDK for Expo
- **Payments:** Stripe React Native SDK
- **Notifications:** Expo Notifications + Firebase Cloud Messaging
- **Charts:** React Native chart library (e.g., react-native-chart-kit)
- **Ads:** Google Mobile Ads SDK

### Backend
- **Runtime:** Node.js (v18+)
- **Framework:** Express.js
- **Language:** JavaScript/TypeScript
- **Database:** PostgreSQL (DigitalOcean managed)
- **ORM/Query Builder:** Prisma or TypeORM
- **Authentication:** Clerk SDK + JWT verification
- **Payments:** Stripe API + webhooks
- **Notifications:** Firebase Admin SDK
- **Data Collection:** Decodo API + Axios
- **Background Jobs:** Node.js `node-cron` or Bull queue
- **Environment:** dotenv for config management
- **Logging:** Winston or Pino
- **Error Tracking:** Sentry (optional, future)

### External Services
- **Authentication:** Clerk (https://clerk.com)
- **Payments:** Stripe (https://stripe.com)
- **Push Notifications:** Firebase Cloud Messaging (https://firebase.google.com)
- **Data Scraping:** Decodo (https://decodo.com)
- **Ads:** Google AdMob (https://admob.google.com)
- **Database Hosting:** DigitalOcean Managed Databases
- **Application Hosting:** DigitalOcean App Platform or Heroku

### Development Tools
- **Package Manager:** npm or yarn
- **Version Control:** Git/GitHub
- **CI/CD:** GitHub Actions (optional)
- **API Testing:** Postman or Insomnia
- **Database Admin:** pgAdmin or DBeaver
- **Monitoring:** Simple server logs (upgrade later)

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id VARCHAR PRIMARY KEY,                    -- Clerk user ID
  email VARCHAR UNIQUE NOT NULL,
  subscription_tier VARCHAR DEFAULT 'free',  -- 'free' or 'premium'
  subscription_status VARCHAR,               -- 'active', 'canceled', 'past_due', 'expired'
  stripe_customer_id VARCHAR UNIQUE,
  stripe_subscription_id VARCHAR,
  stripe_price_id VARCHAR,                   -- Track monthly vs annual (price_xxxxx_month or price_xxxxx_year)
  premium_access_until TIMESTAMP,            -- When premium access expires (for annual plans)
  watchlist_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (id),
  UNIQUE(stripe_customer_id)
);

CREATE INDEX idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX idx_users_premium_access_until ON users(premium_access_until);  -- For checking expired annual plans
```

**Important fields:**
- `subscription_status`: Tracks Stripe status (used for webhook handling)
- `premium_access_until`: When annual subscription expires. User stays premium until this date even if they cancel.
- `stripe_price_id`: Tracks which price was purchased (monthly vs annual) for proper cancellation handling


### User_Products Table (Watchlist)
```sql
CREATE TABLE user_products (
  tracking_id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id VARCHAR NOT NULL,               -- MLM-1234567890
  url VARCHAR NOT NULL,
  title VARCHAR,
  current_price DECIMAL(10, 2),
  seller_id VARCHAR,
  availability VARCHAR,                     -- 'available', 'out_of_stock'
  added_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- IMPORTANT: track when added for free tier logic
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, product_id)                -- One user can't track same product twice
);

CREATE INDEX idx_user_products_user_id ON user_products(user_id);
CREATE INDEX idx_user_products_product_id ON user_products(product_id);
CREATE INDEX idx_user_products_added_date ON user_products(user_id, added_date DESC);  -- For free tier queries
```

**Note:** `added_date` is crucial for when premium users downgrade to free tier. The system will keep only the 20 most recently added items and remove older ones.


### User_Product_Configs Table (Premium: Scheduled Checks & Alerts)
```sql
CREATE TABLE user_product_configs (
  config_id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id VARCHAR NOT NULL,
  
  -- Automatic checking
  check_interval INT NOT NULL,              -- 12, 24, or 48 hours
  check_enabled BOOLEAN DEFAULT TRUE,
  last_checked_at TIMESTAMP,
  next_check_at TIMESTAMP NOT NULL,
  
  -- Price alerts
  alert_price DECIMAL(10, 2),               -- Optional: alert when price <= this
  alert_enabled BOOLEAN DEFAULT FALSE,
  alert_sent BOOLEAN DEFAULT FALSE,         -- Has alert triggered?
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_configs_user_id ON user_product_configs(user_id);
CREATE INDEX idx_configs_next_check ON user_product_configs(next_check_at);
CREATE INDEX idx_configs_alert_enabled ON user_product_configs(alert_enabled);
```

### Price_History Table (Time-Series)
```sql
CREATE TABLE price_history (
  history_id BIGSERIAL PRIMARY KEY,
  product_id VARCHAR NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  checked_by VARCHAR,                      -- 'auto' or 'manual'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (product_id) REFERENCES user_products(product_id)
);

CREATE INDEX idx_price_history_product_id ON price_history(product_id);
CREATE INDEX idx_price_history_created_at ON price_history(created_at);
CREATE INDEX idx_price_history_product_date ON price_history(product_id, created_at DESC);
```

### Manual_Checks Table (Rate Limiting for Free Users)
```sql
CREATE TABLE manual_checks (
  check_id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id VARCHAR NOT NULL,
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_manual_checks_user_date ON manual_checks(user_id, requested_at DESC);
```

### Stripe_Events Table (Audit Log)
```sql
CREATE TABLE stripe_events (
  event_id VARCHAR PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR NOT NULL,              -- checkout.session.completed, etc.
  data JSONB,
  processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(event_id)
);

CREATE INDEX idx_stripe_events_user_id ON stripe_events(user_id);
CREATE INDEX idx_stripe_events_type ON stripe_events(event_type);
```

### Key Relationships
```
users (1) ──→ (M) user_products (watchlist)
users (1) ──→ (M) user_product_configs (premium: scheduled checks)
user_products (1) ──→ (M) price_history
users (1) ──→ (M) manual_checks (rate limiting)
```

### Database Constraints & Logic
- **Watchlist limit enforcement:** Application layer checks count before INSERT
- **Premium-only features:** Application checks subscription_tier before allowing config creation
- **Price history retention:** Keep last 7 days only (monthly cleanup job)
- **Alert triggers:** Only for premium users with alert_enabled=true
- **Frozen watchlist:** When user cancels, they can manage only last 20 items

---

## API Specification

### Base URL
```
Development: http://localhost:3000/api
Production: https://api.pricetrackerapp.com/api
```

### Authentication
All endpoints except `/auth/webhook` require:
```
Authorization: Bearer <JWT_FROM_CLERK>
```

Clerk JWT verification:
```javascript
// Middleware in Express
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    const decoded = await clerkClient.verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

### Error Response Format
```json
{
  "error": "error_code",
  "message": "Human-readable error message",
  "details": {} // Optional
}
```

### Success Response Format
```json
{
  "success": true,
  "data": {},
  "timestamp": "2024-05-28T12:00:00Z"
}
```

---

## Authentication (Clerk)

### Overview
Clerk handles all authentication. Your backend:
1. Receives Clerk JWT in request headers
2. Verifies JWT signature
3. Extracts user_id from JWT
4. Uses user_id as foreign key in your database

### Authentication Options (No GitHub)

Clerk supports multiple login methods. You can enable any combination:

**Recommended for you:**
- ✅ **Email/Password** (traditional, no social required)
- ✅ **Google OAuth** (easy for users)
- ✅ **Apple Sign-In** (required for iOS)
- ❌ **GitHub** (not recommended for consumer app)

**Not recommended:**
- Facebook (privacy concerns)
- Twitter (outdated)

### Setup Steps

#### 1. Create Clerk Account
- Go to https://clerk.com
- Sign up
- Create application
- Go to Authenticators
- Enable: Email, Google, Apple (disable GitHub)

#### 2. Get Clerk Keys
- Frontend key: `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
- Backend key: `CLERK_SECRET_KEY`

#### 3. Install Clerk SDK

**Frontend (Expo):**
```bash
pnpm add @clerk/clerk-expo
```

**Backend (Node.js):**
```bash
pnpm add @clerk/clerk-sdk-node
```

#### 4. Environment Variables

**.env (Backend)**
```
CLERK_SECRET_KEY=sk_test_xxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxx
```

#### 5. Webhook Setup

In Clerk Dashboard:
- Go to Webhooks
- Add endpoint: `https://yourdomain.com/webhooks/clerk`
- Subscribe to: `user.created`, `user.deleted`, `user.updated`

**Webhook Handler (Backend):**
```javascript
// POST /webhooks/clerk
app.post('/webhooks/clerk', express.raw({type: 'application/json'}), async (req, res) => {
  const evt = req.body;
  
  switch(evt.type) {
    case 'user.created':
      // Create user in your DB
      await db.users.create({
        id: evt.data.id,
        email: evt.data.email_addresses[0].email_address,
        subscription_tier: 'free'
      });
      break;
    
    case 'user.deleted':
      // Delete user and all related data
      await db.users.delete({ where: { id: evt.data.id } });
      break;
  }
  
  res.json({ success: true });
});
```

### Frontend Integration (Expo)

```javascript
import { ClerkProvider, SignedIn, SignedOut } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';

export default function App() {
  return (
    <ClerkProvider 
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY}
      tokenCache={{
        getToken: (key) => SecureStore.getItemAsync(key),
        saveToken: (key, token) => SecureStore.setItemAsync(key, token),
      }}
    >
      <SignedIn>
        <AppNavigator />
      </SignedIn>
      <SignedOut>
        <AuthNavigator />
      </SignedOut>
    </ClerkProvider>
  );
}
```

### Backend JWT Verification

```javascript
import { clerkClient } from '@clerk/clerk-sdk-node';

const verifyClerkToken = async (token) => {
  try {
    const decoded = await clerkClient.verifyToken(token);
    return decoded;
  } catch (err) {
    throw new Error('Invalid token');
  }
};

// Use in middleware
app.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token' });
  }
  
  verifyClerkToken(token)
    .then(decoded => {
      req.user = decoded;
      next();
    })
    .catch(() => res.status(401).json({ error: 'Invalid token' }));
});
```

---

## Payments (Stripe)

### Overview
Stripe handles all payment processing. Your backend:
1. Creates Stripe Checkout Sessions
2. Receives webhook events (subscription created, renewed, canceled)
3. Updates user subscription_tier based on Stripe events

### Setup Steps

#### 1. Create Stripe Account
- Go to https://stripe.com
- Sign up for account

#### 2. Get Stripe Keys
- Publishable key (frontend): `pk_test_xxxxx`
- Secret key (backend): `sk_test_xxxxx`
- Webhook secret: `whsec_xxxxx`

#### 3. Create Products & Prices in Stripe Dashboard

**Product:** Mercadolibre Price Tracker Premium

**Prices:**
- Monthly: $3.99 USD per month (Price ID: `price_xxxxx_month`)
- Annual: $39.99 USD per year (Price ID: `price_xxxxx_year`)

#### 4. Install Stripe SDK

```bash
pnpm add stripe @stripe/react-native-stripe-sdk
```

#### 5. Environment Variables

**.env (Backend)**
```
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PRICE_MONTHLY=price_xxxxx_month
STRIPE_PRICE_ANNUAL=price_xxxxx_year
```

### API Endpoints for Payments

#### GET /api/user/subscription
```
Returns user's current subscription status

Response:
{
  "subscription_tier": "free" | "premium",
  "subscription_status": "active" | "canceled" | "past_due",
  "stripe_customer_id": "cus_xxxxx",
  "stripe_subscription_id": "sub_xxxxx",
  "current_period_end": "2024-06-28T00:00:00Z",
  "cancel_at_period_end": false
}
```

#### POST /api/user/checkout-session
```
Create a Stripe Checkout Session for upgrading to Premium

Request:
{
  "price_id": "price_xxxxx_month" | "price_xxxxx_annual",
  "success_url": "app://checkout/success",
  "cancel_url": "app://checkout/cancel"
}

Response:
{
  "session_id": "cs_test_xxxxx",
  "checkout_url": "https://checkout.stripe.com/pay/cs_test_xxxxx"
}
```

Frontend opens `checkout_url` in browser or Stripe-hosted checkout.

#### GET /api/user/stripe-portal
```
Get link to Stripe Customer Portal (manage subscription)

Response:
{
  "portal_url": "https://billing.stripe.com/..."
}
```

### Webhook Handler

**Endpoint:** `POST /webhooks/stripe`

**Stripe Events to Handle:**
- `checkout.session.completed` - User completed payment
- `customer.subscription.created` - Subscription activated
- `customer.subscription.updated` - Subscription changed (payment failure, renewal)
- `customer.subscription.deleted` - Subscription canceled (supports annual carryover)
- `invoice.payment_succeeded` - Payment received

```javascript
// POST /webhooks/stripe
app.post('/webhooks/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  // Verify webhook signature
  const event = stripe.webhooks.constructEvent(
    req.body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET
  );
  
  switch(event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      // session.customer_email = customer's email
      // session.client_reference_id = your user ID (set during checkout)
      // session.subscription = subscription ID
      
      const user = await db.users.findUnique({
        where: { id: session.client_reference_id }
      });
      
      // Get subscription to determine if annual or monthly
      const subscription = await stripe.subscriptions.retrieve(session.subscription);
      const priceId = subscription.items.data[0].price.id;
      
      // Calculate premium_access_until based on subscription type
      const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
      
      // For monthly: premium_access_until = end of current period
      // For annual: premium_access_until = 1 year from now
      let premiumAccessUntil = currentPeriodEnd;
      if (priceId === process.env.STRIPE_PRICE_ANNUAL) {
        premiumAccessUntil = new Date(currentPeriodEnd);
        premiumAccessUntil.setFullYear(premiumAccessUntil.getFullYear() + 1);
      }
      
      await db.users.update({
        where: { id: user.id },
        data: {
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          stripe_price_id: priceId,
          subscription_tier: 'premium',
          subscription_status: 'active',
          premium_access_until: premiumAccessUntil
        }
      });
      break;
    
    case 'customer.subscription.deleted':
      const delSubscription = event.data.object;
      const customer_id = delSubscription.customer;
      
      const canceledUser = await db.users.findUnique({
        where: { stripe_customer_id: customer_id }
      });
      
      // Both monthly and annual use cancel_at_period_end
      // User stays premium until premium_access_until date
      // Just update status
      await db.users.update({
        where: { id: canceledUser.id },
        data: {
          subscription_status: 'canceled'
          // subscription_tier stays 'premium' until premium_access_until
          // premium_access_until stays the same (period end or year end)
        }
      });
      break;
    
    case 'customer.subscription.updated':
      const updatedSub = event.data.object;
      const updatedCustomerId = updatedSub.customer;
      
      const updatedUser = await db.users.findUnique({
        where: { stripe_customer_id: updatedCustomerId }
      });
      
      // Payment failed? Set to past_due
      if (updatedSub.status === 'past_due') {
        await db.users.update({
          where: { id: updatedUser.id },
          data: {
            subscription_status: 'past_due',
            subscription_tier: 'free'  // User loses access immediately during grace period
          }
        });
      } else if (updatedSub.status === 'active') {
        // Payment recovered
        await db.users.update({
          where: { id: updatedUser.id },
          data: {
            subscription_status: 'active',
            subscription_tier: 'premium'
          }
        });
      }
      break;
  }
  
  res.json({ received: true });
});
```

### Automatic Daily Check for Expired Subscriptions

Background job that runs daily (1 AM UTC) to handle both monthly and annual subscription expirations:

```javascript
// In your background job scheduler
cron.schedule('0 1 * * *', async () => {
  // Find all premium users with expired subscriptions
  // Both monthly and annual use premium_access_until field
  const expiredUsers = await db.users.findMany({
    where: {
      subscription_tier: 'premium',
      premium_access_until: { lt: new Date() }  // Expired
    }
  });
  
  for (const user of expiredUsers) {
    // Downgrade to free tier
    await db.users.update({
      where: { id: user.id },
      data: {
        subscription_tier: 'free',
        subscription_status: 'expired'
      }
    });
    
    // Delete all scheduled checks (stops auto-checks)
    await db.userProductConfigs.deleteMany({
      where: { user_id: user.id }
    });
    
    // Keep only last 20 items by added_date DESC
    const allItems = await db.userProducts.findMany({
      where: { user_id: user.id },
      orderBy: { added_date: 'desc' }
    });
    
    // Items to delete are those beyond the first 20
    const itemsToDelete = allItems.slice(20);
    
    if (itemsToDelete.length > 0) {
      await db.userProducts.deleteMany({
        where: {
          tracking_id: { in: itemsToDelete.map(item => item.tracking_id) }
        }
      });
    }
    
    // Update watchlist count
    await db.users.update({
      where: { id: user.id },
      data: {
        watchlist_count: Math.min(allItems.length, 20)
      }
    });
    
    // Send notification to user
    const tokens = await db.notificationTokens.findMany({
      where: { user_id: user.id }
    });
    
    for (const token of tokens) {
      await sendNotification(
        token.fcm_token,
        'Premium Subscription Ended',
        'Your premium subscription has ended. Watchlist limited to 20 items.'
      );
    }
    
    console.log(`User ${user.id} downgraded from premium to free`);
  }
});
```

**How this works for both monthly and annual:**
- Monthly user cancels → uses `cancel_at_period_end = true` → stays premium until `current_period_end` → `premium_access_until` = period end date
- Annual user cancels → uses `cancel_at_period_end = true` → stays premium until 1 year later → `premium_access_until` = year end date
- Both use the same `premium_access_until` field
- Background job runs daily and downgrades anyone whose `premium_access_until` has passed
- Works seamlessly for both monthly and annual subscriptions

### Frontend Checkout Flow

```javascript
import { useAuth } from '@clerk/clerk-expo';

export function UpgradeButton() {
  const { getToken } = useAuth();
  
  const handleUpgrade = async (priceId) => {
    try {
      const token = await getToken();
      
      const response = await fetch(
        'https://api.pricetrackerapp.com/api/user/checkout-session',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            price_id: priceId,
            success_url: 'app://checkout/success',
            cancel_url: 'app://checkout/cancel'
          })
        }
      );
      
      const data = await response.json();
      
      // Open Stripe Checkout in browser
      await WebBrowser.openBrowserAsync(data.checkout_url);
      
    } catch (err) {
      console.error('Checkout error:', err);
    }
  };
  
  return (
    <>
      <Button 
        onPress={() => handleUpgrade('price_xxxxx_month')}
        title="Upgrade - $3.99/month"
      />
      <Button 
        onPress={() => handleUpgrade('price_xxxxx_year')}
        title="Upgrade - $39.99/year"
      />
    </>
  );
}
```

---

## Notifications (Firebase)

### Overview
Firebase Cloud Messaging (FCM) sends push notifications to premium users when prices drop or checks complete.

### Setup Steps

#### 1. Create Firebase Project
- Go to https://console.firebase.google.com
- Create new project
- Enable Cloud Messaging

#### 2. Get Firebase Service Account Key
- In Firebase Console: Project Settings → Service Accounts
- Generate new private key
- Download JSON file

#### 3. Install Firebase Admin SDK

```bash
pnpm add firebase-admin
```

#### 4. Initialize Firebase Admin (Backend)

```javascript
import admin from 'firebase-admin';

const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

export const sendNotification = async (deviceToken, title, body) => {
  try {
    await admin.messaging().send({
      token: deviceToken,
      notification: {
        title: title,
        body: body
      },
      webpush: {
        fcmOptions: {
          link: 'app://product/details' // Deep link to app
        }
      }
    });
  } catch (err) {
    console.error('FCM error:', err);
  }
};
```

#### 5. Frontend Setup (Expo)

```bash
pnpm add expo-notifications firebase
```

**Get Device Token (on app launch):**

```javascript
import * as Notifications from 'expo-notifications';
import { useAuth } from '@clerk/clerk-expo';

export function useNotificationToken() {
  const { getToken } = useAuth();
  
  useEffect(() => {
    (async () => {
      const token = await Notifications.getExpoPushTokenAsync();
      
      // Send to your backend
      const authToken = await getToken();
      
      await fetch(
        'https://api.pricetrackerapp.com/api/user/notification-token',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fcm_token: token.data
          })
        }
      );
    })();
  }, []);
}
```

### Notification Scenarios

#### Price Alert Triggered
```javascript
// When scheduled check finds price <= alert_price

const user = await db.users.findUnique({
  where: { id: userId },
  include: { notification_tokens: true }
});

const message = `${productTitle} dropped to $${newPrice}! ⬇️`;

for (const tokenRecord of user.notification_tokens) {
  await sendNotification(
    tokenRecord.fcm_token,
    'Price Drop Alert!',
    message
  );
}
```

#### Scheduled Check Completed (Optional)
```javascript
// Can notify premium users that check completed

await sendNotification(
  deviceToken,
  'Price Check Complete',
  `${productTitle}: $${currentPrice}`
);
```

---

## Background Jobs

### Overview
Background jobs run on a schedule to:
1. Check prices for premium users (every 8 hours)
2. Trigger alerts when price thresholds met
3. Clean up old price history
4. Sync subscription status

### Scheduling Implementation

**Option 1: node-cron (Simple)**
```bash
pnpm add node-cron
```

```javascript
import cron from 'node-cron';

// Run every 8 hours (0:00, 8:00, 16:00)
cron.schedule('0 */8 * * *', async () => {
  console.log('Starting price check job...');
  await checkScheduledPrices();
});

// Run daily at 1 AM
cron.schedule('0 1 * * *', async () => {
  console.log('Starting cleanup job...');
  await cleanupOldPriceHistory();
});
```

**Option 2: Bull Queue (Robust - for later)**
```bash
pnpm add bull
```

### Price Check Job

```javascript
async function checkScheduledPrices() {
  // Find all products with scheduled checks that need updating
  const dueConfigs = await db.userProductConfigs.findMany({
    where: {
      check_enabled: true,
      next_check_at: { lte: new Date() }
    },
    include: {
      user: true
    }
  });
  
  for (const config of dueConfigs) {
    try {
      // Call Decodo API to get current price
      const result = await decodoScrape(config.product_id);
      
      if (result.success) {
        const newPrice = result.price;
        
        // Store price in history
        await db.priceHistory.create({
          data: {
            product_id: config.product_id,
            price: newPrice,
            checked_by: 'auto'
          }
        });
        
        // Check if alert should trigger
        if (config.alert_enabled && config.alert_price) {
          if (newPrice <= config.alert_price && !config.alert_sent) {
            
            // Send notification
            const user = await db.users.findUnique({
              where: { id: config.user_id },
              include: { notification_tokens: true }
            });
            
            for (const token of user.notification_tokens) {
              await sendNotification(
                token.fcm_token,
                '🔥 Price Drop Alert!',
                `Item dropped to $${newPrice}`
              );
            }
            
            // Mark alert as sent
            await db.userProductConfigs.update({
              where: { config_id: config.config_id },
              data: { alert_sent: true }
            });
          }
        }
        
        // Schedule next check
        const nextCheck = new Date();
        nextCheck.setHours(nextCheck.getHours() + config.check_interval);
        
        await db.userProductConfigs.update({
          where: { config_id: config.config_id },
          data: {
            last_checked_at: new Date(),
            next_check_at: nextCheck
          }
        });
      }
      
    } catch (err) {
      console.error(`Error checking product ${config.product_id}:`, err);
      // Log error, don't crash entire job
    }
  }
}
```

### Cleanup Job

```javascript
async function cleanupOldPriceHistory() {
  // Delete price history older than 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  await db.priceHistory.deleteMany({
    where: {
      created_at: { lt: sevenDaysAgo }
    }
  });
  
  console.log('Cleanup complete');
}
```

### Monitoring

Keep it simple initially:
```javascript
// Log job execution
const jobLog = (jobName, status, message) => {
  console.log(`[${new Date().toISOString()}] ${jobName}: ${status} - ${message}`);
};

// At end of each job
jobLog('priceCheck', 'COMPLETE', `Processed ${dueConfigs.length} configs`);
```

Later: Integrate Sentry or similar for error monitoring.

---

## Data Collection (Decodo)

### Overview
Decodo is a managed scraping API that handles:
- Proxy rotation (avoid IP blocks)
- JavaScript rendering (dynamic content)
- HTML parsing (extract prices)
- Rate limiting (respect website limits)
- Error handling (retries, timeouts)

### Setup Steps

#### 1. Create Decodo Account
- Go to https://decodo.com
- Sign up
- Use code `DECODO30` for 30% discount

#### 2. Get API Key
- Decodo Dashboard: API section
- Copy API key

#### 3. Choose Pricing Plan

For MVP:
- **Pay-As-You-Go:** $12.50/GB (flexible)
- **Starter:** $225/month for 25GB (costs ~$0.009 per request)

At 100 premium users × 3 checks/day × 30 days = 9,000 requests = ~$81/month (well under $225)

#### 4. Environment Variables

**.env (Backend)**
```
DECODO_API_KEY=your_api_key
DECODO_API_URL=https://api.decodo.com/v1
```

### Integration

```javascript
import axios from 'axios';

const decodoClient = axios.create({
  baseURL: process.env.DECODO_API_URL,
  headers: {
    'Authorization': `Bearer ${process.env.DECODO_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

export async function scrapeProduct(mercadolibreUrl) {
  try {
    const response = await decodoClient.post('/scrape', {
      url: mercadolibreUrl,
      selectors: {
        title: '.h-title',           // Mercadolibre title selector
        price: '.price-tag',          // Mercadolibre price selector
        availability: '.availability' // Stock status
      },
      render_js: true,                // Render JavaScript
      timeout: 30000
    });
    
    if (response.status === 'success') {
      return {
        success: true,
        title: response.data.title,
        price: parseFloat(response.data.price.replace('$', '').replace(',', '')),
        availability: response.data.availability,
        scraped_at: new Date()
      };
    } else {
      return {
        success: false,
        error: response.error
      };
    }
    
  } catch (err) {
    console.error('Decodo scraping error:', err);
    return {
      success: false,
      error: 'Failed to scrape product'
    };
  }
}
```

### Usage in Price Check Job

```javascript
const result = await scrapeProduct(productUrl);

if (result.success) {
  await db.priceHistory.create({
    data: {
      product_id: productId,
      price: result.price,
      checked_by: 'auto'
    }
  });
  
  // Update current price in user_products
  await db.userProducts.update({
    where: { tracking_id: productTrackingId },
    data: {
      current_price: result.price,
      availability: result.availability
    }
  });
} else {
  console.error(`Failed to scrape: ${result.error}`);
}
```

---

## Pricing Strategy

### Monthly Pricing
- **Free + Ads:** $0 (with ads)
- **Premium:** $3.99/month

### Annual Pricing
- **Free + Ads:** $0 (with ads)
- **Premium:** $39.99/year (saves ~17%)

### Cost Breakdown (At Scale)

#### Operating Costs per 100 Premium Users
```
Decodo (price scraping):      $150-200/month
PostgreSQL (database):         $12/month
Server (Node.js backend):      $20/month
Firebase (push):               Free (< 10M/month)
Google AdMob (free tier):      Free
Stripe (payment processing):   2.9% + $0.30 per transaction
Clerk (auth):                  Free tier
---
Total fixed:                   ~$185/month
```

#### Revenue per 100 Premium Users
```
Monthly plan:
- 60 users × $3.99 = $239.40

Annual plan:
- 40 users × $39.99 = $1,599.60

Total: $1,839/month ÷ 100 users = $18.39/user
Profit per user: $18.39 - $1.85 = $16.54 ✅
```

### Revenue Projections

| Month | Free Users | Premium Users | Monthly Revenue | Costs | Profit |
|-------|-----------|---------------|-----------------|-------|--------|
| Month 1 | 100 | 5 | ~$20 | $185 | -$165 |
| Month 3 | 500 | 30 | ~$120 | $210 | -$90 |
| Month 6 | 2000 | 100 | ~$400 | $250 | +$150 |
| Month 9 | 4000 | 200 | ~$800 | $350 | +$450 |
| Month 12 | 6000 | 300 | ~$1,200 | $400 | +$800 |

**Key insight:** You break even around month 5-6 with this pricing.

### Ad Revenue (Secondary)

Free users see ads. At low scale:
- 1000 free users × 1 ad impression/day × 30 days = 30,000 impressions/month
- CPM: $2-5 per 1,000 impressions
- Revenue: ~$60-150/month (modest but helps!)

### Future Pricing Adjustments

Once you hit 1000 premium users:
- Consider raising to $4.99/month or $49.99/year
- Add features to justify price increase (e.g., wishlist, price history export)
- Offer loyalty discounts to existing users

---

## User Flows

### Free User Flow

```
1. Download App
   ↓
2. Sign up (Email, Google, or Apple - no GitHub needed)
   ↓
3. See empty watchlist + "Paste Product URL" input
   ↓
4. Paste product URL or ID (MLM-1234567890 or full URL)
   ↓
5. Product AUTOMATICALLY ADDED to watchlist ✨
   - Stored with current_price
   - added_date = NOW (important for free tier downgrade logic!)
   ↓
6. See product + current price + price chart (last 7 days)
   ↓
7. Can tap "Check Price Now" (5/day limit)
   ↓
8. See ads between products
   ↓
9. Hit watchlist limit (20 items):
   - Cannot paste more items
   - Message: "Watchlist full (20/20). Upgrade or delete items."
   ↓
10. To use alerts/auto-checks: tap "Upgrade" → Stripe checkout
```

### Premium User Flow

```
1. Free user taps "Upgrade"
   ↓
2. See pricing:
   - Monthly: $3.99/month
   - Annual: $39.99/year (17% savings)
   ↓
3. Choose monthly or annual plan
   ↓
4. Taken to Stripe checkout
   ↓
5. Enter card details
   ↓
6. Subscription activated, upgraded to premium instantly
   - If monthly: premium_access_until = NULL (continuous until canceled)
   - If annual: premium_access_until = today + 365 days
   ↓
7. Can now:
   - Track up to 100 items
   - Paste multiple products (auto-add to watchlist)
   - Configure automatic checks (12/24/48 hours)
   - Set price alerts
   - Receive push notifications
   - No ads
   ↓
8. For each tracked product, can tap "Configure":
   - Choose check interval (12/24/48 hours)
   - Set alert price (optional)
   - Save
   ↓
9. System checks automatically at set times
   ↓
10. When price <= alert price → push notification
    ↓
11. Can manage subscription via Stripe portal
```

### Monthly Subscription Cancellation

```
Premium user on monthly plan cancels subscription:

1. User taps "Manage Subscription" → Stripe Customer Portal
   ↓
2. Clicks "Cancel subscription"
   ↓
3. Stripe sets: cancel_at_period_end = true
   - Subscription continues until current_period_end
   - No new charges after current period
   ↓
4. User sees: "Your subscription will end on [date]"
   ↓
5. User keeps FULL premium access until current_period_end:
   - Can track all 100 items
   - Auto-checks continue
   - Alerts continue
   - Notifications continue
   - No ads
   ↓
6. When current_period_end date is reached:
   - Stripe webhook: customer.subscription.deleted
   - Backend downgrades user
   - subscription_tier = 'free'
   - Auto-checks disabled
   - Watchlist frozen at last 20 items (by added_date DESC)
   - Ads reappear
   ↓
7. User can still:
   - View watchlist (only first 20)
   - Manually check prices (5/day)
   - Delete items
   - See price history (last 7 days)
   ↓
8. Clear upgrade path: "Restore Premium"
```

### Annual Subscription Cancellation

```
Premium user on annual plan cancels subscription:

1. User taps "Manage Subscription" → Stripe Customer Portal
   ↓
2. Clicks "Cancel subscription"
   ↓
3. Stripe sets: cancel_at_period_end = true
   - Subscription continues until premium_access_until (1 year from purchase)
   - No new charges after current period
   ↓
4. User sees: "Your subscription will end on [date]"
   ↓
5. User keeps FULL premium access until premium_access_until:
   - Can track all 100 items
   - Auto-checks continue
   - Alerts continue
   - Notifications continue
   - No ads
   ↓
6. When premium_access_until date is reached:
   - Background job detects: premium_access_until < TODAY
   - Backend downgrades user
   - subscription_tier = 'free'
   - subscription_status = 'expired'
   - Auto-checks disabled
   - Watchlist limited to last 20 items (by added_date DESC)
   - Ads reappear
   ↓
7. User gets notification:
   - "Your annual premium subscription has expired. You're back on Free plan."
   ↓
8. User can still:
   - View watchlist (only first 20 items by added_date DESC)
   - Manually check prices (5/day)
   - Delete items
   - See price history (last 7 days)
   ↓
9. Clear upgrade path: "Restore Premium"
```

### When Premium User Downgrades to Free

```
Scenarios where premium user downgrades:
1. Monthly user's billing period ends after cancellation
2. Annual user's year expires after cancellation
3. Payment fails and isn't recovered within grace period

Downgrade process:

1. Trigger event detected:
   - Monthly: customer.subscription.deleted webhook (at period end)
   - Annual: background job detects premium_access_until < TODAY
   - Payment failed: customer.subscription.updated webhook (status=past_due after retries)
   ↓
2. User had, for example, 75 tracked items
   ↓
3. Query items ordered by added_date DESC, take last 20:
   - Keep: items 56-75 (most recently added)
   - Delete: items 1-55 (older items)
   ↓
4. Update user:
   - subscription_tier = 'free'
   - subscription_status = 'canceled' or 'expired' or 'past_due'
   - watchlist_count = 20
   ↓
5. Delete all user_product_configs:
   - This stops all scheduled checks
   - Stops all price alerts
   ↓
6. Send user notification:
   - "Your premium subscription ended. Watchlist limited to 20 items."
   - "Oldest items were removed. Manage your favorites now."
   ↓
7. User now has:
   - Exactly 20 most recently added items
   - No auto-checks (can manual check 5/day)
   - Ads visible
   - Price history (last 7 days only)
   - Can delete items to manage below 20
   - Can't add new items
```

### Failed Payment Handling

```
Monthly subscription payment fails:

1. Stripe attempts payment
   ↓
2. Fails - retries for up to 4 days
   ↓
3. If payment still fails after 4 days:
   - Stripe webhook: customer.subscription.updated status='past_due'
   ↓
4. Backend:
   - subscription_status = 'past_due'
   - subscription_tier = 'free' (user loses access)
   - Auto-checks disabled
   - Ads reappear
   ↓
5. User gets notification:
   - "Payment failed. Update payment method to restore Premium access."
   ↓
6. If user updates payment method:
   - Stripe retries payment
   - Payment succeeds
   - Webhook: customer.subscription.updated status='active'
   ↓
7. Backend:
   - subscription_tier = 'premium'
   - Auto-checks resume
   - Ads disappear
```

---

## Implementation Timeline

### Week 1: Foundation & Setup

**Backend:**
- [ ] Set up Node.js/Express project
- [ ] Connect PostgreSQL (DigitalOcean)
- [ ] Set up Clerk authentication
- [ ] Set up Stripe integration
- [ ] Environment variables configuration
- [ ] Database schema creation (all tables)
- [ ] Create database migrations

**Frontend:**
- [ ] Initialize Expo project
- [ ] Set up Clerk integration
- [ ] Set up project structure (navigation, screens)
- [ ] Create basic UI components (buttons, inputs, cards)

**DevOps:**
- [ ] Reserve DigitalOcean resources
- [ ] Set up GitHub repository
- [ ] Configure basic logging

### Week 2: Core Features

**Backend:**
- [ ] URL parser (MLM-xxxxx extraction)
- [ ] Watchlist CRUD endpoints
- [ ] GET product endpoint (current price + 7-day history)
- [ ] Limit enforcement (20/100 based on tier)
- [ ] Manual price check endpoint (5/day rate limiting)

**Frontend:**
- [ ] Watchlist screen
- [ ] Add product URL screen
- [ ] Price history chart
- [ ] Basic navigation
- [ ] Clerk auth integration (login/signup)

**Integration:**
- [ ] Test Decodo API with sample URLs
- [ ] Create scraping function

### Week 3: Free User Features

**Backend:**
- [ ] Rate limiting middleware
- [ ] Price history endpoint
- [ ] Manual check logic

**Frontend:**
- [ ] Google AdMob integration
- [ ] Ad placement (banner, interstitial)
- [ ] Manual "Check Price" button
- [ ] Platform-specific UI (iOS HIG vs Android Material)

**Testing:**
- [ ] Test watchlist limits
- [ ] Test price checking
- [ ] Test ad display

### Week 4: Premium Features

**Backend:**
- [ ] User_product_configs endpoints
- [ ] Schedule configuration endpoint (12/24/48 hours)
- [ ] Alert configuration endpoint
- [ ] Stripe checkout session creation
- [ ] Stripe webhook handler
- [ ] Subscription sync logic

**Frontend:**
- [ ] Subscription status screen
- [ ] Upgrade button + Stripe checkout
- [ ] Schedule configuration UI
- [ ] Alert configuration UI
- [ ] Premium feature gates (show/hide UI based on tier)

**Integration:**
- [ ] Firebase Admin setup (backend)
- [ ] Firebase token request (frontend)
- [ ] Test notification sending

### Week 5: Scheduled Checks & Notifications

**Backend:**
- [ ] node-cron scheduler setup
- [ ] Background price check job
- [ ] Alert trigger logic
- [ ] Firebase notification sender
- [ ] Subscription cancellation handler

**Frontend:**
- [ ] Handle push notifications in app
- [ ] Deep links for notifications
- [ ] Notification permission request

**Testing:**
- [ ] Test scheduled checks run at correct times
- [ ] Test alerts trigger correctly
- [ ] Test notifications receive

### Week 6: Polish & Launch

**Backend:**
- [ ] Logging and monitoring
- [ ] Error handling improvements
- [ ] Rate limiting fine-tuning
- [ ] Database backups (DigitalOcean)
- [ ] Webhook retry logic

**Frontend:**
- [ ] UI refinement based on testing
- [ ] Edge case handling
- [ ] Loading states
- [ ] Error messages
- [ ] Performance optimization

**Testing:**
- [ ] Full end-to-end testing
- [ ] Manual testing on devices
- [ ] Payment flow testing (Stripe test mode)
- [ ] Notification testing

**Preparation:**
- [ ] App store assets (icons, screenshots, description)
- [ ] Privacy policy + terms of service
- [ ] Create app store accounts (Apple Developer, Google Play)
- [ ] Prepare submission materials

### Week 7+: App Store Submission & Monitoring

**Submission:**
- [ ] Submit to Apple App Store
- [ ] Submit to Google Play Store
- [ ] Wait for approval (usually 1-3 days)

**Post-Launch:**
- [ ] Monitor Stripe events
- [ ] Monitor error logs
- [ ] Monitor Decodo API failures
- [ ] Gather user feedback
- [ ] Fix bugs as reported
- [ ] Monitor ad revenue

---

## Deployment & Infrastructure

### Server Deployment

#### Option 1: DigitalOcean App Platform (Recommended)
```
Cost: ~$20/month
Pros:
- Managed PostgreSQL included
- Built-in SSL
- Auto-scaling
- Simple deployment via Git

Setup:
1. Connect GitHub repo
2. Add environment variables
3. Deploy on push to main branch
4. App runs at yourdomain.com
```

#### Option 2: Heroku
```
Cost: ~$50/month (newer pricing)
Pros:
- Easy to use
- Good for startups
- Free tier available (limited)

Cons:
- More expensive than DigitalOcean
- Sleeping dynos on free tier
```

### Environment Variables

**Backend .env file:**
```
# Node environment
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/mercadolibre_tracker

# Authentication
CLERK_SECRET_KEY=sk_test_xxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxx

# Payments
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PRICE_MONTHLY=price_xxxxx_month
STRIPE_PRICE_ANNUAL=price_xxxxx_year

# Data Collection
DECODO_API_KEY=xxxxx
DECODO_API_URL=https://api.decodo.com/v1

# Notifications
FIREBASE_PROJECT_ID=xxxxx
FIREBASE_PRIVATE_KEY=xxxxx
FIREBASE_CLIENT_EMAIL=xxxxx

# Server
API_URL=https://api.pricetrackerapp.com
PORT=3000

# Logging
LOG_LEVEL=info
```

### Database Backups

**DigitalOcean Managed Database:**
- Automatic daily backups (30-day retention)
- Manual backups available
- Point-in-time recovery

**Monitoring:**
- DigitalOcean dashboard shows connection status
- Monitor database size
- Set up alerts for high connections

### Security Checklist

- [ ] All endpoints require JWT validation
- [ ] Stripe webhook signatures verified
- [ ] Clerk webhook signatures verified
- [ ] Passwords hashed (Clerk handles)
- [ ] HTTPS only (no HTTP)
- [ ] Rate limiting on sensitive endpoints
- [ ] SQL injection prevention (use ORM like Prisma)
- [ ] CORS properly configured
- [ ] Sensitive data not logged
- [ ] Environment variables not in git
- [ ] Database credentials encrypted

### Monitoring & Logging

**Initial Setup:**
```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Log important events
logger.info(`User ${userId} upgraded to premium`);
logger.error(`Decodo API failed: ${err.message}`);
```

**Later:** Integrate Sentry or LogRocket for error tracking and user session monitoring.

### Scaling Considerations (Future)

When you hit 10,000+ users:
1. **Database scaling:** Read replicas for heavy queries
2. **Cache layer:** Redis for price caching
3. **Queue system:** Bull for background jobs
4. **CDN:** CloudFlare for static assets
5. **Monitoring:** Better error tracking and APM

---

## Summary & Next Steps

### What You Have Now
- ✅ Complete architecture documented
- ✅ Database schema ready to implement
- ✅ All API endpoints specified
- ✅ Integration guides for each service
- ✅ Timeline for implementation
- ✅ Deployment strategy

### What to Do Next

1. **Set up services (1 day):**
   - [ ] Create Clerk account and app
   - [ ] Create Stripe account and products
   - [ ] Create Firebase project
   - [ ] Create Decodo account
   - [ ] Create DigitalOcean account

2. **Initialize projects (1 day):**
   - [ ] Clone Express starter template
   - [ ] Initialize Expo app
   - [ ] Set up GitHub repo
   - [ ] Create .env files

3. **Start building (Week 1):**
   - [ ] Create database schema
   - [ ] Set up Clerk authentication
   - [ ] Build URL parser
   - [ ] Test with Decodo

### Success Metrics

Track these after launch:
- Weekly active users (WAU)
- Free → Premium conversion rate (target: 5-10%)
- Average watchlist size per user
- Premium user retention (month-over-month)
- Average session duration
- Crash-free sessions
- Push notification open rate

### Questions to Answer As You Build

1. What should the watchlist limit be for free users? (20 recommended)
2. Should there be a free trial for Premium? (7 days recommended)
3. What happens if Decodo API fails? (Log error, retry in next job)
4. Should free users see a "last updated" timestamp? (Yes)
5. Should users be able to manually trigger a check outside schedule? (Yes, but rate-limited)

---

## Appendix: Key Resources

### Official Documentation
- Expo: https://docs.expo.dev
- Clerk: https://clerk.com/docs
- Stripe: https://stripe.com/docs
- Firebase: https://firebase.google.com/docs
- PostgreSQL: https://www.postgresql.org/docs
- Decodo: https://help.decodo.com

### Package Manager: pnpm

This project uses **pnpm** (performant npm) instead of npm for faster, more reliable dependency management.

**Installation:**
```bash
# Install pnpm globally
npm install -g pnpm

# Or via Homebrew (macOS)
brew install pnpm

# Verify installation
pnpm --version
```

**Common commands:**
```bash
pnpm install          # Install all dependencies
pnpm add <package>    # Add a new package
pnpm remove <package> # Remove a package
pnpm update          # Update packages
pnpm run dev         # Run dev script
```

### Libraries You'll Need

**Backend (package.json):**
```bash
pnpm init
pnpm add express postgres prisma @clerk/clerk-sdk-node stripe firebase-admin axios node-cron dotenv winston
pnpm add -D prisma  # Development dependency for migrations
```

**Mobile (package.json):**
```bash
npx create-expo-app .
pnpm add react react-native expo @clerk/clerk-expo @stripe/react-native-stripe-sdk expo-notifications firebase react-native-chart-kit
```

Alternatively, here are the dependencies as JSON:

**Backend dependencies:**
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "postgres": "^13.0",
    "prisma": "^5.0.0",
    "@clerk/clerk-sdk-node": "^4.0.0",
    "stripe": "^13.0.0",
    "firebase-admin": "^12.0.0",
    "axios": "^1.6.0",
    "node-cron": "^3.0.0",
    "dotenv": "^16.0.0",
    "winston": "^3.10.0"
  },
  "devDependencies": {
    "prisma": "^5.0.0"
  }
}
```

**Mobile dependencies:**
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-native": "^0.72.0",
    "expo": "^49.0.0",
    "@clerk/clerk-expo": "^1.0.0",
    "@stripe/react-native-stripe-sdk": "^2.0.0",
    "expo-notifications": "^0.20.0",
    "firebase": "^10.0.0",
    "react-native-chart-kit": "^6.12.0"
  }
}

---

**Document version:** 1.0  
**Last updated:** May 28, 2026  
**Status:** Ready for implementation
