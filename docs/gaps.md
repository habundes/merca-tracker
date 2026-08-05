# Mercadolibre Price Tracker — Known Gaps & Solutions

**Purpose:** Documents all implementation gaps, their severity, solutions, and current status.
**Last Updated:** June 18, 2026

**Related files:**
- `mercadolibre_tracker_simplified.md` — Main spec
- `backend_technical.md` — Implementation code (organized by feature)
- `clean_architecture.md` — Target code structure (Domain/Application/Infrastructure/Presentation)
- `ux_spec.md` — UX specification

---

## Table of Contents

1. [Pending Gaps](#pending-gaps)
2. [New Dependencies Required](#new-dependencies-required)

---

## Pending Gaps

Gaps that still require implementation.

| ID | Severity | Category | Description |
|----|----------|----------|-------------|
| GAP-04 | 🔴 Critical | Feature | Reward ad missing backend endpoint |
| GAP-16 | 🔵 Architecture | Mobile | Expo build configuration not documented |
| GAP-17 | 🔵 Architecture | Mobile | iOS Privacy Manifest (`PrivacyInfo.xcprivacy`) missing |
| GAP-21 | 🔵 Architecture | API | Missing `GET /api/user/products/:id` endpoint |
| GAP-23 | 🔵 Architecture | Code Organization | Backend not yet migrated to Clean Architecture layers |

---

### GAP-04: Reward Ad Missing Backend Endpoint 🔴 Critical

**Problem:** Spec defines reward ads granting +1 manual check but no endpoint exists to receive AdMob confirmation and execute the check.

**Solution needed:**
- New endpoint: `POST /api/user/products/:product_id/reward-check`
- Only for free tier users
- Max 1 reward check per product per day (separate from the 2 regular manual checks)
- Add `check_type` column to `manual_check_log` table: `'manual'` | `'reward'`
- Same price check logic as manual check
- AdMob frontend confirms reward earned → calls this endpoint

**DB change required:**
```sql
ALTER TABLE manual_check_log ADD COLUMN check_type VARCHAR DEFAULT 'manual';
-- Values: 'manual', 'reward'
```

---

### GAP-16: Expo Build Configuration Not Documented 🔵 Architecture

**Problem:** AdMob, Firebase, Stripe, and Clerk all require specific entries in `app.config.js` and native config files. Missing these causes build failures on both iOS and Android.

**Solution needed:** Document the following in `ux_spec.md → Platform Differences`:

```javascript
// app.config.js
export default {
  expo: {
    name: 'ML Price Tracker',
    slug: 'ml-price-tracker',
    version: '1.0.0',
    scheme: 'mltracker',
    ios: {
      bundleIdentifier: 'com.yourname.mltracker',
      googleServicesFile: './GoogleService-Info.plist',
      infoPlist: {
        NSUserNotificationsUsageDescription: 'Para notificarte cuando el precio cambie.'
      },
      associatedDomains: ['applinks:api.pricetrackerapp.com']
    },
    android: {
      package: 'com.yourname.mltracker',
      googleServicesFile: './google-services.json',
      permissions: ['RECEIVE_BOOT_COMPLETED', 'VIBRATE']
    },
    plugins: [
      ['expo-notifications', { sounds: [] }],
      ['react-native-google-mobile-ads', {
        androidAppId: 'ca-app-pub-xxxxx~xxxxx',
        iosAppId: 'ca-app-pub-xxxxx~xxxxx'
      }]
    ]
  }
};
```

**Files required in project root:**
- `GoogleService-Info.plist` (iOS Firebase)
- `google-services.json` (Android Firebase)

---

### GAP-17: iOS Privacy Manifest Missing 🔵 Architecture

**Problem:** Apple requires `PrivacyInfo.xcprivacy` for apps using SDKs that access device data. AdMob, Firebase, Stripe and Clerk all trigger this requirement. Without it App Store will reject the build.

**Solution needed:** Add to `ios/PrivacyInfo.xcprivacy`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>NSPrivacyTracking</key>
  <false/>
  <key>NSPrivacyCollectedDataTypes</key>
  <array>
    <dict>
      <key>NSPrivacyCollectedDataType</key>
      <string>NSPrivacyCollectedDataTypeEmailAddress</string>
      <key>NSPrivacyCollectedDataTypeLinked</key>
      <true/>
      <key>NSPrivacyCollectedDataTypePurposes</key>
      <array>
        <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
      </array>
    </dict>
  </array>
  <key>NSPrivacyAccessedAPITypes</key>
  <array>
    <dict>
      <key>NSPrivacyAccessedAPIType</key>
      <string>NSPrivacyAccessedAPICategoryUserDefaults</string>
      <key>NSPrivacyAccessedAPITypeReasons</key>
      <array><string>CA92.1</string></array>
    </dict>
  </array>
</dict>
</plist>
```

---

### GAP-20: Downgrade Job Not Optimized for Scale 🔵 Architecture

**Problem:** Current downgrade job uses nested loops: `users → products → checks`. At scale with 1,000+ expired users, this runs thousands of individual DB queries sequentially causing performance issues.

**Solution needed:** Replace nested loops with batch queries in `backend_technical.md → Payments → Automatic Downgrade Job`:

```javascript
// Replace nested loops with batch approach:

// 1. Get ALL products for ALL expired users in one query
const allProducts = await db.userProducts.findMany({
  where: { user_id: { in: expiredUserIds } },
  orderBy: { created_at: 'desc' }
});

// 2. Group by user in memory (no extra DB calls)
const productsByUser = {};
allProducts.forEach(p => {
  if (!productsByUser[p.user_id]) productsByUser[p.user_id] = [];
  productsByUser[p.user_id].push(p);
});

// 3. Determine which to hide and which to keep
const productsToHide = [];
const productIdsToKeep = [];
for (const userId of expiredUserIds) {
  const userProducts = productsByUser[userId] || [];
  const keepCount = Math.min(userProducts.length, 5);
  userProducts.slice(keepCount).forEach(p => productsToHide.push(p.product_id));
  userProducts.slice(0, keepCount).forEach(p => productIdsToKeep.push(p.product_id));
}

// 4. Single batch query to hide products
await db.userProducts.updateMany({
  where: { product_id: { in: productsToHide } },
  data: { is_visible: false, check_enabled: false }
});

// 5. Single batch query to clear checks for visible products
await db.priceHistory.deleteMany({
  where: { product_id: { in: productIdsToKeep } }
});
```

---

### GAP-21: Missing `GET /api/user/products/:id` Endpoint 🔵 Architecture

**Problem:** No endpoint to fetch a single product's full details. The Configure Mode screen needs `current_price`, `check_mode`, `check_interval`, `wish_price`, and `next_check_at` for one product without loading the entire tracklist.

**Solution needed:** Add to `backend_technical.md → API Specification`:

```
GET /api/user/products/:product_id

Response:
{
  "success": true,
  "data": {
    "product_id": 123,
    "mercadolibre_id": "MLM-1234567890",
    "title": "iPhone 15 Pro",
    "image_url": "https://...",
    "seller_name": "TechStore MX",
    "current_price": 899.99,
    "last_known_price": 949.99,
    "check_mode": "interval",
    "check_interval": 24,
    "wish_price": null,
    "check_enabled": true,
    "next_check_at": "2024-05-30T12:00:00Z",
    "is_available": true
  }
}
```

---

## New Dependencies Required (Pending)

```bash
pnpm add svix express-rate-limit helmet cors @sentry/node
```

---

**Document version:** 2.0
**Last updated:** May 29, 2026
**Pending:** 5 gaps (GAP-04, GAP-16, GAP-17, GAP-20, GAP-21)
