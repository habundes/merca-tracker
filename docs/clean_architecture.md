# Mercadolibre Price Tracker — Clean Architecture (Backend)

**Purpose:** Defines the Clean Architecture structure for the Node.js + Express backend — folder layout, dependency rules, and where each piece of existing logic belongs.

**Related files:**
- `backend_technical.md` — Raw implementation code (Stripe, Clerk, Decodo, Firebase, jobs)
- `mercadolibre_tracker_simplified.md` — Database schema, API spec, feature rules
- `gaps.md` — Pending implementation gaps

**Last Updated:** June 18, 2026

---

## Table of Contents

1. [Why Clean Architecture](#why-clean-architecture)
2. [The 4 Layers](#the-4-layers)
3. [The Dependency Rule](#the-dependency-rule)
4. [Folder Structure](#folder-structure)
5. [Layer 1 — Domain](#layer-1--domain)
6. [Layer 2 — Application (Use Cases)](#layer-2--application-use-cases)
7. [Layer 3 — Infrastructure](#layer-3--infrastructure)
8. [Layer 4 — Presentation](#layer-4--presentation)
9. [Dependency Injection Setup](#dependency-injection-setup)
10. [Mapping: Existing Code → New Structure](#mapping-existing-code--new-structure)
11. [Example: Full Vertical Slice](#example-full-vertical-slice)
12. [Testing Strategy by Layer](#testing-strategy-by-layer)
13. [Migration Plan](#migration-plan)

---

## Why Clean Architecture

The current backend (as documented in `backend_technical.md`) mixes Express route handlers, business rules (auto-check slot limits, downgrade logic, price comparison), and external SDK calls (Stripe, Clerk, Decodo, Firebase, Prisma) in the same functions. This works for an MVP but creates problems as the app grows:

- **Hard to test** — can't test "is the wish price reached?" logic without mocking Express `req`/`res` and hitting a real database
- **Hard to swap providers** — switching from Supabase to another Postgres host, or Decodo to a different scraper, touches business logic
- **Hard to reuse logic** — the same "downgrade a user" logic is needed in the Stripe webhook AND the hourly cron job, currently duplicated

Clean Architecture solves this by separating **business rules** (what the app does) from **frameworks and tools** (how it's done) — Express, Prisma, Stripe SDK, Clerk SDK, Decodo, and Firebase all become swappable details.

---

## The 4 Layers

```
┌─────────────────────────────────────────────────────┐
│  Presentation                                        │
│  Express routes, controllers, middleware             │
│  ↓ calls                                              │
├─────────────────────────────────────────────────────┤
│  Application (Use Cases)                              │
│  Business workflows: AddProduct, CheckPrice,          │
│  SetCheckMode, DowngradeUser, ProcessStripeWebhook    │
│  ↓ calls (via interfaces)                              │
├─────────────────────────────────────────────────────┤
│  Domain                                                │
│  Entities + business rules: Product, User,             │
│  Subscription, PriceCheck — pure logic, zero deps      │
├─────────────────────────────────────────────────────┤
│  Infrastructure                                        │
│  Implementations: Prisma repo, Stripe gateway,         │
│  Clerk gateway, Decodo gateway, Firebase gateway       │
└─────────────────────────────────────────────────────┘
```

| Layer | Contains | Knows About |
|-------|----------|-------------|
| **Domain** | Entities, value objects, domain rules | Nothing external — pure JS/TS |
| **Application** | Use cases, ports (interfaces) | Domain only |
| **Infrastructure** | Repositories, external API clients | Domain + Application interfaces |
| **Presentation** | Express routes, controllers, DTOs | Application use cases only |

---

## The Dependency Rule

**Dependencies point inward only.** Domain knows nothing about Application. Application knows nothing about Infrastructure or Presentation.

```
Presentation  ──depends on──▶  Application  ──depends on──▶  Domain
                                     ▲
                                     │ implements interfaces defined here
                                     │
Infrastructure ─────────────────────┘
```

This is achieved via **Dependency Inversion**: Application defines interfaces (ports) like `ProductRepository` or `PaymentGateway`. Infrastructure implements them. Presentation wires everything together at startup (Dependency Injection).

**Practical effect for this app:** A use case like `CheckProductPrice` calls `scraperGateway.scrapeProduct(url)` — it has no idea whether that's Decodo, a different scraper, or a test double. Swapping Decodo for another provider only touches `infrastructure/gateways/decodo-scraper-gateway.js`.

---

## Folder Structure

```
backend/
├── src/
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── user.entity.js
│   │   │   ├── product.entity.js
│   │   │   ├── price-check.entity.js
│   │   │   └── subscription.entity.js
│   │   ├── value-objects/
│   │   │   ├── check-mode.vo.js          // 'manual' | 'interval' | 'wish_price'
│   │   │   ├── subscription-tier.vo.js   // 'free' | 'premium'
│   │   │   └── money.vo.js               // price handling, avoids float bugs
│   │   ├── errors/
│   │   │   ├── domain-error.js
│   │   │   ├── auto-slots-full-error.js
│   │   │   ├── tracklist-full-error.js
│   │   │   └── invalid-wish-price-error.js
│   │   └── rules/
│   │       ├── auto-check-slot.rules.js   // max 2 slots for free tier
│   │       ├── tracklist-limit.rules.js   // 5 free / 20 premium
│   │       └── downgrade.rules.js         // keep last 5, clear visible checks
│   │
│   ├── application/
│   │   ├── use-cases/
│   │   │   ├── products/
│   │   │   │   ├── add-product.use-case.js
│   │   │   │   ├── delete-product.use-case.js
│   │   │   │   ├── set-check-mode.use-case.js
│   │   │   │   ├── manual-check-product.use-case.js
│   │   │   │   ├── reward-check-product.use-case.js   // GAP-04
│   │   │   │   ├── get-product.use-case.js             // GAP-21
│   │   │   │   └── get-tracklist.use-case.js
│   │   │   ├── subscriptions/
│   │   │   │   ├── create-checkout-session.use-case.js
│   │   │   │   ├── get-subscription-status.use-case.js
│   │   │   │   └── get-stripe-portal-link.use-case.js
│   │   │   ├── webhooks/
│   │   │   │   ├── handle-clerk-user-created.use-case.js
│   │   │   │   ├── handle-clerk-user-deleted.use-case.js
│   │   │   │   ├── handle-stripe-checkout-completed.use-case.js
│   │   │   │   ├── handle-stripe-subscription-deleted.use-case.js
│   │   │   │   └── handle-stripe-subscription-updated.use-case.js
│   │   │   └── jobs/
│   │   │       ├── run-hourly-price-check.use-case.js
│   │   │       └── run-downgrade-expired-users.use-case.js
│   │   │
│   │   └── ports/                          // interfaces — Infrastructure implements these
│   │       ├── product-repository.port.js
│   │       ├── user-repository.port.js
│   │       ├── price-history-repository.port.js
│   │       ├── manual-check-log-repository.port.js
│   │       ├── notification-token-repository.port.js
│   │       ├── scraper-gateway.port.js       // Decodo
│   │       ├── payment-gateway.port.js       // Stripe
│   │       ├── auth-gateway.port.js          // Clerk
│   │       └── notification-gateway.port.js  // Firebase
│   │
│   ├── infrastructure/
│   │   ├── persistence/
│   │   │   ├── prisma/
│   │   │   │   ├── schema.prisma
│   │   │   │   └── client.js
│   │   │   └── repositories/
│   │   │       ├── prisma-product.repository.js
│   │   │       ├── prisma-user.repository.js
│   │   │       ├── prisma-price-history.repository.js
│   │   │       ├── prisma-manual-check-log.repository.js
│   │   │       └── prisma-notification-token.repository.js
│   │   ├── gateways/
│   │   │   ├── decodo-scraper.gateway.js
│   │   │   ├── stripe-payment.gateway.js
│   │   │   ├── clerk-auth.gateway.js
│   │   │   └── firebase-notification.gateway.js
│   │   ├── security/
│   │   │   ├── url-validator.js              // Layer 1 + 2 from URL Validation
│   │   │   └── wish-price-validator.js        // GAP-12
│   │   └── jobs/
│   │       └── cron-scheduler.js              // node-cron wiring
│   │
│   └── presentation/
│       ├── http/
│       │   ├── routes/
│       │   │   ├── products.routes.js
│       │   │   ├── subscription.routes.js
│       │   │   └── notification-token.routes.js
│       │   ├── controllers/
│       │   │   ├── products.controller.js
│       │   │   ├── subscription.controller.js
│       │   │   └── notification-token.controller.js
│       │   ├── middleware/
│       │   │   ├── verify-clerk-token.middleware.js
│       │   │   ├── rate-limit.middleware.js
│       │   │   └── error-handler.middleware.js
│       │   └── webhooks/
│       │       ├── clerk-webhook.controller.js
│       │       └── stripe-webhook.controller.js
│       └── server.js                          // Express app + DI wiring
│
├── di-container.js                            // Dependency Injection setup
├── .env
└── package.json
```

---

## Layer 1 — Domain

Pure business logic. No Express, no Prisma, no Stripe SDK, no Decodo SDK. Just JavaScript classes and functions.

### Entity Example: Product

```javascript
// domain/entities/product.entity.js

export class Product {
  constructor({
    productId, userId, mercadolibreId, url, title,
    currentPrice, lastKnownPrice, checkMode, checkInterval,
    wishPrice, checkEnabled, isVisible, isAvailable
  }) {
    this.productId = productId;
    this.userId = userId;
    this.mercadolibreId = mercadolibreId;
    this.url = url;
    this.title = title;
    this.currentPrice = currentPrice;
    this.lastKnownPrice = lastKnownPrice;
    this.checkMode = checkMode;       // CheckMode value object
    this.checkInterval = checkInterval;
    this.wishPrice = wishPrice;
    this.checkEnabled = checkEnabled;
    this.isVisible = isVisible;
    this.isAvailable = isAvailable;
  }

  // Domain logic lives ON the entity, not scattered in route handlers
  hasPriceChanged(newPrice) {
    return newPrice !== this.currentPrice;
  }

  getPriceDirection(newPrice) {
    if (newPrice > this.currentPrice) return 'up';
    if (newPrice < this.currentPrice) return 'down';
    return 'same';
  }

  hasReachedWishPrice(newPrice) {
    if (this.checkMode !== 'wish_price' || !this.wishPrice) return false;
    return newPrice <= this.wishPrice;
  }

  markUnavailable() {
    this.checkEnabled = false;
    this.isAvailable = false;
  }

  switchToManualMode() {
    this.checkMode = 'manual';
    this.checkEnabled = false;
    this.checkInterval = null;
    this.wishPrice = null;
  }
}
```

### Value Object Example: CheckMode

```javascript
// domain/value-objects/check-mode.vo.js

const VALID_MODES = ['manual', 'interval', 'wish_price'];
const FREE_INTERVALS = [12, 24];
const PREMIUM_INTERVALS = [6, 12, 24];

export class CheckMode {
  static MANUAL = 'manual';
  static INTERVAL = 'interval';
  static WISH_PRICE = 'wish_price';

  static isValid(mode) {
    return VALID_MODES.includes(mode);
  }

  static isValidInterval(interval, subscriptionTier) {
    const allowed = subscriptionTier === 'premium' ? PREMIUM_INTERVALS : FREE_INTERVALS;
    return allowed.includes(interval);
  }

  static isAutoMode(mode) {
    return mode === this.INTERVAL || mode === this.WISH_PRICE;
  }
}
```

### Domain Rules Example: Auto-Check Slot Limit

This is the GAP relating to the "max 2 auto-check slots for free tier" rule — pure logic, testable without any database.

```javascript
// domain/rules/auto-check-slot.rules.js

import { AutoSlotsFullError } from '../errors/auto-slots-full-error.js';

const FREE_TIER_AUTO_SLOTS_LIMIT = 2;

export function assertCanActivateAutoCheck({ subscriptionTier, currentActiveAutoChecks, isNewSlot }) {
  if (subscriptionTier !== 'free') return;   // Premium: unlimited slots
  if (!isNewSlot) return;                     // Switching interval ↔ wish_price doesn't use a new slot

  if (currentActiveAutoChecks >= FREE_TIER_AUTO_SLOTS_LIMIT) {
    throw new AutoSlotsFullError(currentActiveAutoChecks, FREE_TIER_AUTO_SLOTS_LIMIT);
  }
}
```

### Domain Rules Example: Downgrade

```javascript
// domain/rules/downgrade.rules.js

export function partitionProductsForDowngrade(productsOrderedByNewest) {
  const keepCount = Math.min(productsOrderedByNewest.length, 5);
  return {
    toKeepVisible: productsOrderedByNewest.slice(0, keepCount),
    toHide: productsOrderedByNewest.slice(keepCount)
  };
}
```

---

## Layer 2 — Application (Use Cases)

Each use case is a single class with one public method (`execute`). It orchestrates domain entities and calls infrastructure **through ports (interfaces)** — never directly importing Prisma, Stripe, etc.

### Port Example: ProductRepository (interface)

```javascript
// application/ports/product-repository.port.js

/**
 * @interface ProductRepository
 * Implemented by infrastructure/persistence/repositories/prisma-product.repository.js
 */
export class ProductRepository {
  async findById(productId) { throw new Error('Not implemented'); }
  async findByUserAndMercadolibreId(userId, mercadolibreId) { throw new Error('Not implemented'); }
  async findVisibleByUser(userId) { throw new Error('Not implemented'); }
  async countVisibleByUser(userId) { throw new Error('Not implemented'); }
  async countActiveAutoChecksByUser(userId) { throw new Error('Not implemented'); }
  async save(product) { throw new Error('Not implemented'); }
  async delete(productId) { throw new Error('Not implemented'); }
}
```

### Port Example: ScraperGateway (Decodo interface)

```javascript
// application/ports/scraper-gateway.port.js

/**
 * @interface ScraperGateway
 * Implemented by infrastructure/gateways/decodo-scraper.gateway.js
 */
export class ScraperGateway {
  /**
   * @returns {{ success, is_available, title, price, image_url, seller_id, seller_name }}
   */
  async scrapeProduct(url) { throw new Error('Not implemented'); }
}
```

### Use Case Example: AddProduct

```javascript
// application/use-cases/products/add-product.use-case.js

import { Product } from '../../../domain/entities/product.entity.js';
import { TracklistFullError } from '../../../domain/errors/tracklist-full-error.js';
import { ProductUnavailableError } from '../../../domain/errors/product-unavailable-error.js';
import { AlreadyTrackingError } from '../../../domain/errors/already-tracking-error.js';

export class AddProductUseCase {
  /**
   * @param {ProductRepository} productRepository
   * @param {UserRepository} userRepository
   * @param {ScraperGateway} scraperGateway
   * @param {UrlValidator} urlValidator
   */
  constructor(productRepository, userRepository, scraperGateway, urlValidator) {
    this.productRepository = productRepository;
    this.userRepository = userRepository;
    this.scraperGateway = scraperGateway;
    this.urlValidator = urlValidator;
  }

  async execute({ userId, url }) {
    // Layer 2 URL validation (security, before any DB/Decodo call)
    const validation = this.urlValidator.validate(url);
    if (!validation.valid) {
      throw validation.toDomainError();
    }

    const user = await this.userRepository.findById(userId);
    const limit = user.subscriptionTier === 'premium' ? 20 : 5;
    const visibleCount = await this.productRepository.countVisibleByUser(userId);

    if (visibleCount >= limit) {
      throw new TracklistFullError(visibleCount, limit);
    }

    const existing = await this.productRepository.findByUserAndMercadolibreId(
      userId, validation.mercadolibreId
    );
    if (existing) {
      throw new AlreadyTrackingError(existing);
    }

    const scraped = await this.scraperGateway.scrapeProduct(validation.normalizedUrl);
    if (!scraped.success || !scraped.is_available) {
      throw new ProductUnavailableError();
    }

    const product = new Product({
      userId,
      mercadolibreId: validation.mercadolibreId,
      url: validation.normalizedUrl,
      title: scraped.title,
      currentPrice: scraped.price,
      lastKnownPrice: scraped.price,
      checkMode: 'manual',          // Default — always starts manual
      checkEnabled: false,
      isVisible: true,
      isAvailable: true,
      imageUrl: scraped.image_url,
      sellerId: scraped.seller_id,
      sellerName: scraped.seller_name
    });

    return this.productRepository.save(product);
  }
}
```

### Use Case Example: SetCheckMode (with slot rule)

```javascript
// application/use-cases/products/set-check-mode.use-case.js

import { CheckMode } from '../../../domain/value-objects/check-mode.vo.js';
import { assertCanActivateAutoCheck } from '../../../domain/rules/auto-check-slot.rules.js';
import { InvalidIntervalError } from '../../../domain/errors/invalid-interval-error.js';
import { InvalidWishPriceError } from '../../../domain/errors/invalid-wish-price-error.js';

export class SetCheckModeUseCase {
  constructor(productRepository, userRepository) {
    this.productRepository = productRepository;
    this.userRepository = userRepository;
  }

  async execute({ userId, productId, checkMode, checkInterval, wishPrice }) {
    const product = await this.productRepository.findById(productId);
    if (!product || product.userId !== userId) {
      throw new ProductNotFoundError();
    }

    const user = await this.userRepository.findById(userId);

    if (CheckMode.isAutoMode(checkMode)) {
      if (!CheckMode.isValidInterval(checkInterval, user.subscriptionTier)) {
        throw new InvalidIntervalError(user.subscriptionTier);
      }

      if (checkMode === CheckMode.WISH_PRICE) {
        this._validateWishPrice(wishPrice);   // GAP-12 fix lives here, domain-validated
      }

      const isNewSlot = product.checkMode === CheckMode.MANUAL;
      const activeSlots = await this.productRepository.countActiveAutoChecksByUser(userId);

      assertCanActivateAutoCheck({
        subscriptionTier: user.subscriptionTier,
        currentActiveAutoChecks: activeSlots,
        isNewSlot
      });

      product.checkMode = checkMode;
      product.checkInterval = checkInterval;
      product.wishPrice = checkMode === CheckMode.WISH_PRICE ? wishPrice : null;
      product.checkEnabled = true;
      product.nextCheckAt = new Date(Date.now() + checkInterval * 60 * 60 * 1000);
    } else {
      product.switchToManualMode();
    }

    return this.productRepository.save(product);
  }

  _validateWishPrice(wishPrice) {
    const price = parseFloat(wishPrice);
    if (isNaN(price)) throw new InvalidWishPriceError('El precio deseado debe ser un número válido.');
    if (price <= 0) throw new InvalidWishPriceError('El precio deseado debe ser mayor a cero.');
    if (price > 9999999) throw new InvalidWishPriceError('El precio deseado es demasiado alto.');
  }
}
```

### Use Case Example: RunHourlyPriceCheck (the cron job, refactored)

```javascript
// application/use-cases/jobs/run-hourly-price-check.use-case.js

export class RunHourlyPriceCheckUseCase {
  constructor(productRepository, priceHistoryRepository, scraperGateway, notificationGateway) {
    this.productRepository = productRepository;
    this.priceHistoryRepository = priceHistoryRepository;
    this.scraperGateway = scraperGateway;
    this.notificationGateway = notificationGateway;
  }

  async execute() {
    const dueProducts = await this.productRepository.findDueForCheck();

    for (const product of dueProducts) {
      try {
        await this._checkOne(product);
      } catch (err) {
        await this._handleFailure(product, err);
      }
    }
  }

  async _checkOne(product) {
    const scraped = await this.scraperGateway.scrapeProduct(product.url);

    if (!scraped.success || !scraped.is_available) {
      product.markUnavailable();
      await this.productRepository.save(product);
      await this.notificationGateway.notify(
        product.userId, '⚠️ Producto no disponible',
        `${product.title} ya no está disponible en Mercadolibre.`
      );
      return;
    }

    const direction = product.getPriceDirection(scraped.price);
    await this.priceHistoryRepository.create({
      productId: product.productId, price: scraped.price,
      previousPrice: product.currentPrice, priceChange: direction,
      checkType: product.checkMode
    });

    if (product.checkMode === 'interval' && direction !== 'same') {
      const emoji = direction === 'up' ? '📈' : '📉';
      await this.notificationGateway.notify(
        product.userId, `${product.title} ${emoji}`,
        `Precio: $${product.currentPrice} → $${scraped.price}`
      );
    }

    if (product.checkMode === 'wish_price' && product.hasReachedWishPrice(scraped.price)) {
      product.checkEnabled = false;   // Pause — domain rule, not infra detail
      await this.notificationGateway.notify(
        product.userId, '🎯 ¡Precio deseado alcanzado!',
        `${product.title} ahora $${scraped.price}. Abre la app para continuar.`
      );
    }

    product.lastKnownPrice = product.currentPrice;
    product.currentPrice = scraped.price;
    if (product.checkEnabled) {
      product.nextCheckAt = new Date(Date.now() + product.checkInterval * 60 * 60 * 1000);
    }

    await this.productRepository.save(product);
  }

  async _handleFailure(product, err) {
    // GAP-07 fix: push next check forward instead of retrying every hour
    product.nextCheckAt = new Date(Date.now() + product.checkInterval * 60 * 60 * 1000);
    await this.productRepository.save(product);
    console.error(`[PriceCheck] Error for product ${product.productId}:`, err);
  }
}
```

> Full Stripe webhook use cases, downgrade use case, and Clerk webhook use cases follow the same pattern. See `Mapping: Existing Code → New Structure` below for where each piece of `backend_technical.md` code gets refactored to.

---

## Layer 3 — Infrastructure

Implements the ports defined in Application. This is where Prisma, Stripe SDK, Clerk SDK, Decodo HTTP calls, and Firebase Admin SDK actually live.

### Repository Implementation Example

```javascript
// infrastructure/persistence/repositories/prisma-product.repository.js

import { ProductRepository } from '../../../application/ports/product-repository.port.js';
import { Product } from '../../../domain/entities/product.entity.js';
import { prisma } from '../prisma/client.js';

export class PrismaProductRepository extends ProductRepository {
  async findById(productId) {
    const row = await prisma.userProducts.findUnique({ where: { product_id: productId } });
    return row ? this._toDomain(row) : null;
  }

  async countVisibleByUser(userId) {
    return prisma.userProducts.count({ where: { user_id: userId, is_visible: true } });
  }

  async countActiveAutoChecksByUser(userId) {
    return prisma.userProducts.count({
      where: { user_id: userId, check_mode: { in: ['interval', 'wish_price'] }, check_enabled: true }
    });
  }

  async findDueForCheck() {
    const rows = await prisma.userProducts.findMany({
      where: { check_enabled: true, is_visible: true, check_mode: { in: ['interval', 'wish_price'] },
               next_check_at: { lte: new Date() } }
    });
    return rows.map(this._toDomain);
  }

  async save(product) {
    const row = await prisma.userProducts.upsert({
      where: { product_id: product.productId ?? -1 },
      update: this._toRow(product),
      create: this._toRow(product)
    });
    return this._toDomain(row);
  }

  // Maps DB row ↔ Domain entity — isolates Prisma's shape from business logic
  _toDomain(row) {
    return new Product({
      productId: row.product_id, userId: row.user_id, mercadolibreId: row.mercadolibre_id,
      url: row.url, title: row.title, currentPrice: row.current_price,
      lastKnownPrice: row.last_known_price, checkMode: row.check_mode,
      checkInterval: row.check_interval, wishPrice: row.wish_price,
      checkEnabled: row.check_enabled, isVisible: row.is_visible, isAvailable: row.is_available
    });
  }

  _toRow(product) {
    return {
      user_id: product.userId, mercadolibre_id: product.mercadolibreId, url: product.url,
      title: product.title, current_price: product.currentPrice, last_known_price: product.lastKnownPrice,
      check_mode: product.checkMode, check_interval: product.checkInterval, wish_price: product.wishPrice,
      check_enabled: product.checkEnabled, is_visible: product.isVisible, is_available: product.isAvailable
    };
  }
}
```

### Gateway Implementation Example: Decodo

```javascript
// infrastructure/gateways/decodo-scraper.gateway.js

import axios from 'axios';
import { ScraperGateway } from '../../application/ports/scraper-gateway.port.js';

export class DecodoScraperGateway extends ScraperGateway {
  constructor(apiKey, apiUrl) {
    super();
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
  }

  async scrapeProduct(url) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/scrape`,
        { url, render_js: true, timeout: 30000 },
        { headers: { Authorization: `Bearer ${this.apiKey}` } }
      );
      const data = response.data;
      if (!data || data.status !== 'success') return { success: false, is_available: false };

      const availability = data.data?.availability?.toLowerCase();
      const isAvailable = !['unavailable', 'out_of_stock', 'removed'].includes(availability)
        && data.data?.price != null;
      if (!isAvailable) return { success: true, is_available: false };

      return {
        success: true, is_available: true,
        title: data.data.title || null,
        price: parseFloat(data.data.price.toString().replace(/[$,]/g, '')),
        image_url: data.data.image_url || null,
        seller_id: data.data.seller_id || null,
        seller_name: data.data.seller_name || null
      };
    } catch (err) {
      return { success: false, is_available: false, error: err.message };
    }
  }
}
```

> This is the exact same logic from `backend_technical.md → Data Collection — Decodo → Scrape Function` — only wrapped in a class implementing the `ScraperGateway` port. **No business logic changed, only organization.**

### Gateway Implementation Example: Firebase (with GAP-11 fix)

```javascript
// infrastructure/gateways/firebase-notification.gateway.js

import admin from 'firebase-admin';
import { NotificationGateway } from '../../application/ports/notification-gateway.port.js';

export class FirebaseNotificationGateway extends NotificationGateway {
  constructor(notificationTokenRepository) {
    super();
    this.notificationTokenRepository = notificationTokenRepository;
  }

  async notify(userId, title, body) {
    const tokens = await this.notificationTokenRepository.findByUser(userId);
    for (const token of tokens) {
      try {
        await admin.messaging().send({ token: token.fcmToken, notification: { title, body } });
      } catch (err) {
        const invalidCodes = ['messaging/invalid-registration-token', 'messaging/registration-token-not-registered'];
        if (invalidCodes.includes(err.code)) {
          await this.notificationTokenRepository.delete(token.tokenId);   // GAP-11 fix
        }
      }
    }
  }
}
```

---

## Layer 4 — Presentation

Express routes, controllers, and middleware. Thin layer — controllers only translate HTTP ↔ use case calls. No business logic here.

### Controller Example

```javascript
// presentation/http/controllers/products.controller.js

export class ProductsController {
  constructor(addProductUseCase, setCheckModeUseCase, manualCheckUseCase, getTracklistUseCase) {
    this.addProductUseCase = addProductUseCase;
    this.setCheckModeUseCase = setCheckModeUseCase;
    this.manualCheckUseCase = manualCheckUseCase;
    this.getTracklistUseCase = getTracklistUseCase;
  }

  async addProduct(req, res) {
    try {
      const product = await this.addProductUseCase.execute({
        userId: req.user.id, url: req.body.url
      });
      res.json({ success: true, data: this._toDTO(product) });
    } catch (err) {
      this._handleError(res, err);
    }
  }

  async setCheckMode(req, res) {
    try {
      const product = await this.setCheckModeUseCase.execute({
        userId: req.user.id,
        productId: parseInt(req.params.product_id),
        checkMode: req.body.check_mode,
        checkInterval: req.body.check_interval,
        wishPrice: req.body.wish_price
      });
      res.json({ success: true, data: this._toDTO(product) });
    } catch (err) {
      this._handleError(res, err);
    }
  }

  _toDTO(product) {
    return {
      product_id: product.productId, title: product.title,
      current_price: product.currentPrice, check_mode: product.checkMode,
      check_interval: product.checkInterval, wish_price: product.wishPrice,
      check_enabled: product.checkEnabled, next_check_at: product.nextCheckAt
    };
  }

  _handleError(res, err) {
    // Maps domain errors → HTTP status codes, centralizes error → response logic
    const errorMap = {
      TracklistFullError: 400, AlreadyTrackingError: 400, ProductUnavailableError: 200,
      AutoSlotsFullError: 400, InvalidIntervalError: 400, InvalidWishPriceError: 400,
      ProductNotFoundError: 404
    };
    const status = errorMap[err.constructor.name] || 500;
    res.status(status).json({ success: false, error: err.code, message: err.message });
  }
}
```

### Routes Example

```javascript
// presentation/http/routes/products.routes.js

import { Router } from 'express';

export function createProductsRouter(productsController, rateLimiter) {
  const router = Router();

  router.post('/add-product', rateLimiter.addProduct, (req, res) => productsController.addProduct(req, res));
  router.get('/tracklist', (req, res) => productsController.getTracklist(req, res));
  router.get('/products/:product_id', (req, res) => productsController.getProduct(req, res));
  router.delete('/products/:product_id', (req, res) => productsController.deleteProduct(req, res));
  router.put('/products/:product_id/mode', (req, res) => productsController.setCheckMode(req, res));
  router.post('/products/:product_id/check', rateLimiter.manualCheck, (req, res) => productsController.manualCheck(req, res));
  router.post('/products/:product_id/reward-check', (req, res) => productsController.rewardCheck(req, res));
  router.get('/products/:product_id/history', (req, res) => productsController.getHistory(req, res));

  return router;
}
```

---

## Dependency Injection Setup

A single file wires everything together at startup — this is the **only** place that knows about both interfaces and implementations.

```javascript
// di-container.js

import { PrismaProductRepository } from './infrastructure/persistence/repositories/prisma-product.repository.js';
import { PrismaUserRepository } from './infrastructure/persistence/repositories/prisma-user.repository.js';
import { PrismaNotificationTokenRepository } from './infrastructure/persistence/repositories/prisma-notification-token.repository.js';
import { DecodoScraperGateway } from './infrastructure/gateways/decodo-scraper.gateway.js';
import { StripePaymentGateway } from './infrastructure/gateways/stripe-payment.gateway.js';
import { ClerkAuthGateway } from './infrastructure/gateways/clerk-auth.gateway.js';
import { FirebaseNotificationGateway } from './infrastructure/gateways/firebase-notification.gateway.js';
import { UrlValidator } from './infrastructure/security/url-validator.js';

import { AddProductUseCase } from './application/use-cases/products/add-product.use-case.js';
import { SetCheckModeUseCase } from './application/use-cases/products/set-check-mode.use-case.js';
import { RunHourlyPriceCheckUseCase } from './application/use-cases/jobs/run-hourly-price-check.use-case.js';

import { ProductsController } from './presentation/http/controllers/products.controller.js';

export function buildContainer(env) {
  // Infrastructure
  const productRepository = new PrismaProductRepository();
  const userRepository = new PrismaUserRepository();
  const notificationTokenRepository = new PrismaNotificationTokenRepository();
  const scraperGateway = new DecodoScraperGateway(env.DECODO_API_KEY, env.DECODO_API_URL);
  const paymentGateway = new StripePaymentGateway(env.STRIPE_SECRET_KEY);
  const authGateway = new ClerkAuthGateway(env.CLERK_SECRET_KEY);
  const notificationGateway = new FirebaseNotificationGateway(notificationTokenRepository);
  const urlValidator = new UrlValidator();

  // Use cases (depend only on ports — Infrastructure instances satisfy them)
  const addProductUseCase = new AddProductUseCase(productRepository, userRepository, scraperGateway, urlValidator);
  const setCheckModeUseCase = new SetCheckModeUseCase(productRepository, userRepository);
  const runHourlyPriceCheckUseCase = new RunHourlyPriceCheckUseCase(
    productRepository, /* priceHistoryRepository */ null, scraperGateway, notificationGateway
  );

  // Presentation
  const productsController = new ProductsController(addProductUseCase, setCheckModeUseCase, null, null);

  return {
    productsController,
    runHourlyPriceCheckUseCase,
    authGateway,
    // ...rest wired the same way
  };
}
```

```javascript
// presentation/server.js

import express from 'express';
import cron from 'node-cron';
import { buildContainer } from '../di-container.js';
import { createProductsRouter } from './http/routes/products.routes.js';
import { verifyClerkTokenMiddleware } from './http/middleware/verify-clerk-token.middleware.js';

const app = express();
const container = buildContainer(process.env);

app.use(express.json({ limit: '10kb' }));
app.use('/api', verifyClerkTokenMiddleware(container.authGateway));
app.use('/api/user', createProductsRouter(container.productsController, container.rateLimiter));

// GAP-03 fix: concurrency lock stays at this orchestration level
let jobRunning = false;
cron.schedule('0 * * * *', async () => {
  if (jobRunning) return;
  jobRunning = true;
  try {
    await container.runHourlyPriceCheckUseCase.execute();
  } finally {
    jobRunning = false;
  }
});

app.listen(process.env.PORT || 3000);
```

---

## Mapping: Existing Code → New Structure

Every piece of logic documented in `backend_technical.md` maps to a specific layer. Nothing is lost — it's reorganized.

| Existing in `backend_technical.md` | New Location | Layer |
|--------------------------------------|---------------|-------|
| JWT Verification Middleware | `presentation/http/middleware/verify-clerk-token.middleware.js` | Presentation |
| Clerk webhook handler (svix) | `presentation/http/webhooks/clerk-webhook.controller.js` calls `application/use-cases/webhooks/handle-clerk-user-created.use-case.js` | Presentation + Application |
| URL Validation Layer 1 + 2 | `infrastructure/security/url-validator.js` | Infrastructure |
| Stripe webhook handler | `presentation/http/webhooks/stripe-webhook.controller.js` + 3 use cases (`handle-stripe-*`) | Presentation + Application |
| Automatic Downgrade Job | `application/use-cases/jobs/run-downgrade-expired-users.use-case.js` + `domain/rules/downgrade.rules.js` | Application + Domain |
| Firebase backend setup (`notifyUser`) | `infrastructure/gateways/firebase-notification.gateway.js` | Infrastructure |
| Hourly Price Check Job | `application/use-cases/jobs/run-hourly-price-check.use-case.js` (orchestration in `server.js`) | Application |
| Decodo scrape function | `infrastructure/gateways/decodo-scraper.gateway.js` | Infrastructure |
| Manual Check Handler | `application/use-cases/products/manual-check-product.use-case.js` | Application |
| Auto-check slot logic | `domain/rules/auto-check-slot.rules.js` | Domain |
| `wish_price` validation (GAP-12) | `domain/value-objects/check-mode.vo.js` validation called from use case | Domain |
| Security middleware (helmet, cors, rate-limit) | `presentation/http/middleware/` | Presentation |
| Database schema (Prisma) | `infrastructure/persistence/prisma/schema.prisma` (unchanged) | Infrastructure |

**Pending gaps (GAP-04, GAP-16, GAP-17, GAP-20, GAP-21) slot into this structure as:**
- GAP-04 (reward check) → `application/use-cases/products/reward-check-product.use-case.js`
- GAP-20 (downgrade batching) → optimization inside `application/use-cases/jobs/run-downgrade-expired-users.use-case.js`
- GAP-21 (GET /products/:id) → `application/use-cases/products/get-product.use-case.js`
- GAP-16, GAP-17 are mobile/build concerns, not backend — unaffected by this refactor

---

## Example: Full Vertical Slice

Tracing `POST /api/user/add-product` through all 4 layers:

```
1. PRESENTATION
   products.routes.js → POST /add-product
   → products.controller.js → addProduct(req, res)
       extracts { userId: req.user.id, url: req.body.url }

2. APPLICATION
   AddProductUseCase.execute({ userId, url })
       → calls urlValidator.validate(url)              [Infrastructure, via port]
       → calls userRepository.findById(userId)          [Infrastructure, via port]
       → calls productRepository.countVisibleByUser()   [Infrastructure, via port]
       → throws TracklistFullError if over limit          [Domain error]
       → calls scraperGateway.scrapeProduct(url)         [Infrastructure, via port]
       → constructs new Product(...)                      [Domain entity]
       → calls productRepository.save(product)           [Infrastructure, via port]

3. INFRASTRUCTURE
   PrismaProductRepository.save() → Prisma → Supabase Postgres
   DecodoScraperGateway.scrapeProduct() → axios → Decodo API

4. PRESENTATION (response)
   controller catches result → maps Product entity to DTO
       → res.json({ success: true, data: {...} })
   OR catches domain error → _handleError() maps to HTTP status
       → res.status(400).json({ success: false, error: 'tracklist_full', ... })
```

Every arrow only points toward Domain — Presentation never touches Prisma directly, Application never imports Express.

---

## Testing Strategy by Layer

| Layer | Test Type | What You Test | Mocking Needed |
|-------|-----------|----------------|-----------------|
| **Domain** | Unit | Entity methods, value objects, rules | None — pure functions/classes |
| **Application** | Unit | Use case orchestration logic | Mock ports (in-memory fakes, no real DB/Stripe/Decodo) |
| **Infrastructure** | Integration | Repository ↔ real Prisma/Supabase, Gateway ↔ real or sandboxed Stripe/Decodo | Test database, Stripe test mode, Decodo sandbox if available |
| **Presentation** | E2E | Full HTTP request → response, with real DI container | Supertest against running Express app |

**Example — Domain test (no mocks needed at all):**
```javascript
import { assertCanActivateAutoCheck } from '../../domain/rules/auto-check-slot.rules.js';

test('free user with 2 active slots cannot activate a 3rd', () => {
  expect(() => assertCanActivateAutoCheck({
    subscriptionTier: 'free', currentActiveAutoChecks: 2, isNewSlot: true
  })).toThrow('AutoSlotsFullError');
});
```

**Example — Application test (fake repository, no real DB):**
```javascript
class FakeProductRepository {
  constructor() { this.products = []; }
  async countVisibleByUser() { return this.products.length; }
  async save(p) { this.products.push(p); return p; }
}

test('AddProductUseCase rejects when tracklist is full', async () => {
  const fakeRepo = new FakeProductRepository();
  fakeRepo.products = [/* 5 fake products */];
  const useCase = new AddProductUseCase(fakeRepo, fakeUserRepo, fakeScraperGateway, fakeUrlValidator);

  await expect(useCase.execute({ userId: 'u1', url: 'https://...' }))
    .rejects.toThrow('TracklistFullError');
});
```

This is the core payoff of Clean Architecture: **business rules are tested in milliseconds with zero infrastructure**, while integration/E2E tests cover the wiring separately.

---

## Migration Plan

Since `backend_technical.md` already documents working code, this is a **refactor**, not a rewrite. Suggested order:

### Phase 1 — Domain extraction (1-2 days)
- Create `Product`, `User`, `Subscription` entities
- Extract `auto-check-slot.rules.js`, `downgrade.rules.js`, `tracklist-limit.rules.js`
- Write unit tests for domain rules (fast feedback loop established early)

### Phase 2 — Ports + Infrastructure wrapping (2-3 days)
- Define all ports (interfaces) in `application/ports/`
- Wrap existing Prisma calls into repository classes
- Wrap existing Decodo/Stripe/Clerk/Firebase code into gateway classes
- **No logic changes** — pure code organization

### Phase 3 — Use cases (2-3 days)
- Move business orchestration out of Express route handlers into use case classes
- One use case per existing endpoint/job/webhook handler

### Phase 4 — Presentation cleanup (1 day)
- Slim down controllers to pure HTTP ↔ use case translation
- Centralize error → HTTP status mapping

### Phase 5 — DI wiring + cutover (1 day)
- Build `di-container.js`
- Update `server.js` to use container
- Run full regression test against `mercadolibre_tracker_simplified.md` API spec

**Total estimated effort:** 7-10 days for a solo developer, can run in parallel with feature work since each phase is independently shippable (start with new endpoints in Clean Architecture, migrate old ones incrementally).

---

**Document version:** 1.0
**Last updated:** June 18, 2026
**Status:** Architecture defined — ready for incremental migration
