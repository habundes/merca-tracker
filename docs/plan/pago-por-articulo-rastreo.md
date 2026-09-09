# Plan — Agregar "Pago por artículo de rastreo" (compra por ítem) a la documentación

## Contexto

Merca-tracker es **spec-driven**: los archivos de `docs/` son la autoridad de diseño; **aún no hay código de pagos en la app** (`PaymentSettings.tsx` es un placeholder; el único límite real es `MAX_TRACKED = 5` en `src/features/search/domain/entities/tracklist.ts`). Hoy la monetización documentada es **solo** free+ads y una **suscripción premium** ($5.99/mes · $49.99/año).

El usuario quiere una nueva opción de pago que **coexista**: **pagar por artículo de rastreo** — una **compra única** que desbloquea comportamiento premium para **un artículo rastreado específico**. Decisiones ya fijadas (preguntas de aclaración):

- **Modelo:** compra única → desbloquea funciones premium (auto-check activo, intervalos 6/12/24 h, sin candado de slot) **solo para ese ítem**.
- **Bypass total:** un ítem pagado **no** cuenta contra el tope free de **5 productos** ni contra los **2 slots de auto-check**; auto-check + intervalos quedan libres en él.
- **Coexiste** con free+ads y con la suscripción premium (aditivo, no reemplaza).
- **Precio:** debe **derivarse de un análisis de costos** para que cubra el costo continuo de servicio (scrapes) que el rastreo del ítem genera y sea justo para ambas partes.
- **Alcance:** actualizar `pricing_models.md` (autoridad) **+ docs relacionados** para mantener consistencia.

Esto es un **cambio solo de documentación** — no se toca código de app/backend (no existe).

---

## Análisis de costos → precio recomendado

**Base canónica** (los docs son inconsistentes entre sí — la nueva sección debe anclarse a un set y marcar el resto como superado):
`$5.99/mes · $49.99/año` premium · **5** productos free · **2** slots auto free · **20** productos premium · **$0.002/check** (Decodo) · **$45** infra fija. Valor tope implícito de la suscripción = **$5.99 ÷ 20 = $0.30/producto/mes** (el ancla de justicia).

**Costo mensual de servicio por ítem (solo Decodo):** 24 h = $0.06 · 12 h = $0.12 · **6 h = $0.24**.

**Riel de pago — decisivo:** la comisión fija de **Stripe $0.30/txn** destruye un micro-cargo (−33% sobre $0.99), y Apple/Google **exigen IAP** para desbloqueos digitales in-app (usar Stripe para bienes digitales = riesgo de rechazo en App Store). → **Enrutar el desbloqueo por ítem vía StoreKit 2 / Play Billing (IAP), no Stripe.** Neto tras 15% Apple/Google (Small-Business): $0.99→$0.84, $1.99→$1.69, $2.99→$2.54.

**Precio recomendado: `$2.99` USD compra única, vía IAP** (≈ tier de tienda MXN $59). Neto $2.54:

| Intervalo | Decodo/mes | Runway sobre $2.54 (break-even variable) | = meses de valor justo $0.30 |
|---|---|---|---|
| 24 h | $0.06 | 42 meses | 8.5 meses |
| **12 h (default)** | $0.12 | 21 meses | 8.5 meses |
| 6 h (peor caso) | $0.24 | ~11 meses | 8.5 meses |

Justificación: cubre el costo variable incluso en el peor caso de 6 h por **~11 meses** (> vida realista de un ítem de 2–6 meses); equivale a **8.5 meses** de valor justo de suscripción (financia costo fijo + margen, no solo Decodo); se mantiene como compra de impulso bajo la sub de $5.99, con un **cruce à-la-carte↔suscripción a ~2–3 ítems** ($5.98–$8.97) que empuja a los usuarios intensivos a suscribirse. ($1.99 es la alternativa orientada a crecimiento; $0.99 es una trampa — runway delgado + comido por comisiones.)

**Salvaguardas (para que ítems de 6 h abandonados no corran a pérdida para siempre):**
1. Los desbloqueos por ítem **usan 12 h por default** (6 h/24 h siguen seleccionables).
2. **Rastreo con sesión activa (heartbeat + confirmación):** el auto-check de un ítem pagado corre solo mientras la cuenta esté **activa**. La app actualiza `last_active_at` cada vez que se abre (foreground). Si pasan **14 días sin abrir la app**, el backend envía un **push de aviso** (*"abre la app para seguir rastreando [producto]"*, con acción rápida "Seguir rastreando" que renueva sin navegar). Si tras el aviso pasan **~3 días más** sin abrir ni confirmar → **pausa** el auto-check (`unlock_paused_at`; no borra, no reembolsa). Se **reanuda automático** al abrir la app o tocar "Reactivar". Ventana ajustable (14 + 3 días es el default propuesto).

---

## Plan de edición de docs (por archivo)

### `docs/pricing_models.md` (autoridad)
- Nueva sección **"Option D — Per-Item Unlock (à la carte)"** después de Option C (~L161).
- Tabla Subscription Tiers (L167–174): agregar fila por-ítem "$2.99 compra única / ítem" + nota de que hace bypass del tope de 5 y de los 2 slots.
- Nueva subsección **"Per-Item Economics & Amortization"** cerca de Break-Even (~L224): las tres tablas de arriba (Decodo-por-intervalo, comisiones IAP-vs-Stripe, runway de recuperación) + la reconciliación con $0.30.
- Corregir **$32 → $45** en Costs/Break-Even (L206–207, 227–230) para que el margen cuadre.
- Agregar flujos "Purchase Per-Item Unlock" + "Restore Purchases" (~L296); en "Subscription Ends" (L372–395) agregar: los ítems con desbloqueo por-ítem quedan **exentos** de ocultarse y de detener el auto-check.
- Agregar nota de **política / riesgo (D7)** en la sección por-ítem: la compra no reembolsa si el producto se finaliza/elimina en Mercado Libre; el desbloqueo no garantiza la vida del listing.
- Timeline Semana 5 (L493–503): agregar integración IAP, `UnlockProductUseCase`, handler de App Store Server Notifications / Google RTDN, revocación por reembolso, job de auto-pausa por inactividad.

### `docs/backend_technical.md` (esquema + endpoints)
- `user_products` (L75–115): agregar `premium_unlocked BOOLEAN DEFAULT FALSE`, `unlock_purchase_id VARCHAR`, `unlock_paused_at TIMESTAMP NULL` + índice; nota "Key field" (siempre visible, siempre con auto-check, hace bypass de topes).
- Nueva tabla **`item_purchases`** (entitlements) después de `stripe_events` (L188): `purchase_id`, `user_id`, `product_id`, `platform` (apple|google), `platform_product_id`, `platform_transaction_id UNIQUE` (idempotencia), `original_transaction_id`, `amount`, `currency`, `status` (active|refunded), `purchased_at`.
- Endpoints (L509–543): `POST /api/user/products/:id/unlock`, `POST /api/user/restore-purchases`, `GET /api/user/purchases`; nuevos **webhooks IAP** `POST /webhooks/apple` (ASSN V2) + `POST /webhooks/google` (RTDN) → en REFUND/REVOKE poner entitlement `refunded`, `premium_unlocked=false`.
- Sección Payments (L826): agregar nota **"IAP vs Stripe"** (el por-ítem DEBE usar IAP; la suscripción sigue en Stripe *por ahora* — marcar la deuda latente de IAP en iOS).
- **Job de downgrade (L896–935): agregar `WHERE premium_unlocked = false`** en los pasos de ocultar/limpiar/particionar para que los ítems pagados conserven `check_enabled`/`is_visible` y queden fuera del conteo "keep last 5".
- Job por hora (L999–1076): tratar `premium_unlocked` como premium para retención de historial; **gatear el auto-check por sesión activa** (heartbeat `last_active_at`): correr solo si la cuenta abrió la app dentro de la ventana; al vencer la ventana enviar push de aviso y, si no reabre/confirma, **pausar** (`unlock_paused_at`). Requiere: campo `users.last_active_at`, endpoint de heartbeat (`POST /api/user/heartbeat` al abrir la app), acción de push "Seguir rastreando" que renueva `last_active_at`, y campo `unlock_paused_at`.
- Handler de manual-check (L1117–1166): tratar el producto desbloqueado como premium (intervalo 6/12/24; ver Decisión D3).
- **Producto no disponible + desbloqueado (`Product.markUnavailable()`):** al detectar que el listing ya no existe en ML, detener el auto-check del ítem pagado y conservar el entitlement como `active` (no `refunded`) — **sin reembolso** (Decisión D7). Documentar que el desbloqueo no garantiza disponibilidad del producto.

### `docs/clean_architecture.md` (domain/use-cases/ports)
- Agregar en `domain` `premiumUnlocked` en `Product` + `isPremiumUnlocked()` / `effectiveTier()`; ports `purchase-gateway.port.js` (verificación IAP) + `purchase-repository.port.js`; use cases `unlock-product.use-case.js` + `handle-iap-notification.use-case.js`; infra `iap-purchase.gateway.js` (StoreKit/Play o RevenueCat).
- **Las reglas deben excluir ítems pagados:** `tracklist-limit.rules.js` (no contarlos en el tope de 5), `auto-check-slot.rules.js` `assertCanActivateAutoCheck` (early-return, no consume slot), `downgrade.rules.js` `partitionProductsForDowngrade` (filtrarlos antes de particionar).
- `CheckMode.isValidInterval` + `SetCheckModeUseCase` derivan el **tier efectivo por-producto** (`product.premiumUnlocked || user.tier`), default 12 h.
- Cablear el nuevo gateway/repo/use cases en la lista de Ports, el contenedor DI y la tabla de mapeo.

### `docs/mercadolibre_tracker_simplified.md` (spec resumen)
- Monetization (L46–49) + Feature Matrix (L54–64): agregar fila/columna por-ítem; sección downgrade (L66–76): los ítems pagados sobreviven intactos; mode rules (L118–143): topes/slots excluyen ítems pagados.
- Schema key-fields (L267–273): agregar `premium_unlocked`, `unlock_purchase_id`, `item_purchases`; endpoints (L343–358): agregar las nuevas rutas/webhooks.
- **Corregir precios viejos $3.99/$35.88 → $5.99/$49.99** (L399–401) + agregar línea IAP por-ítem; actualizar resumen de Pricing/Free-Limits (L564–579).

### `docs/ux_spec.md` (UI de compra, en español)
- Pantalla Configure Mode (L545–606): agregar CTA **"Desbloquear este producto ⭐"**, mostrado sobre todo en el estado bloqueado 2/2 (L584–591) y cuando un usuario free toca 6 h. Copy del paywall p.ej. *"Desbloquea verificación automática (6/12/24 h) solo para este producto — pago único $59 MXN. No cuenta para tu límite de 5 ni tus 2 espacios."* + **aviso de riesgo obligatorio (D7)** p.ej. *"El desbloqueo es único y no se reembolsa si el producto se finaliza o elimina de Mercado Libre."* + badge de estado desbloqueado "⭐ Premium — desbloqueado".
- Cards (L386–458) + barra de estado (L363–376): badge "⭐ desbloqueado"; excluir ítems pagados de los contadores 5/5 y 2/2 (p.ej. `5/5 · 2/2 🔄 · 3 ⭐`).
- Nuevo **mockup de bottom-sheet de paywall** (precio, qué se desbloquea, "Comprar" / "Restaurar compras", estados éxito/pendiente/error).
- Pantalla de pagos (L108–113): agregar historial de compras + **"Restaurar compras"** (requerido por Apple).
- Estados de downgrade/productos ocultos (L980–992): los ítems pagados nunca se ocultan.
- **Estado "rastreo pausado por inactividad":** badge/aviso en la card y en Configure (*"⏸ Rastreo pausado — abre para reactivar"*), más el copy del **push de aviso** previo a la pausa y su acción "Seguir rastreando". Reactivación con un toque; el desbloqueo nunca se pierde por la pausa.

---

## Decisiones asumidas (defaults — avísame si alguna está mal)

- **D1 Precio = $2.99 compra única vía IAP**, intervalo default 12 h + **rastreo con sesión activa** (heartbeat `last_active_at`: el auto-check corre mientras la cuenta esté activa; push de aviso a los 14 días sin abrir, pausa a los ~17 si no reabre/confirma, reanuda al abrir). Ventana ajustable — ver Salvaguardas.
- **D2 Riel = IAP StoreKit/Play** para el por-ítem (no Stripe). La suscripción sigue en Stripe por ahora; se anota la deuda latente de compliance IAP en iOS pero **no** se migra la suscripción en este cambio.
- **D3 "Funciones premium"** en un ítem desbloqueado = premium completo *para ese ítem*: auto-check, 6/12/24 h, manual checks ilimitados, historial completo (sin recorte). (La decisión fijada solo nombró auto-check/intervalos/sin-candado; se extiende a manual/historial por consistencia.)
- **D4 Reembolso** (notificación Apple/Google) → entitlement `refunded`, el ítem vuelve a comportamiento free.
- **D5 El entitlement queda atado al ítem.** Si el usuario borra un producto con desbloqueo por-ítem, el desbloqueo se consume/pierde (no es transferible). Documentado explícitamente.
- **D6 Los ads siguen a nivel cuenta** (un desbloqueo por-ítem no eleva la cuenta a premium); la pantalla Configure del producto desbloqueado solo suprime el interstitial previo a Configure.
- **D7 Sin reembolso por fin de vida del listing en Mercado Libre.** La compra por-ítem **no garantiza** cuánto dura el producto publicado en ML. Si el artículo se finaliza/elimina/agota en ML a los pocos días, el desbloqueo se considera **consumido**: se detiene el auto-check (ya no hay nada que rastrear), el entitlement queda intacto y **no hay reembolso**. Es un riesgo que asume el usuario y debe **divulgarse en el paywall antes de comprar**. (Distinto de D4: D4 = reembolso iniciado por el comprador vía Apple/Google, que sí revoca el entitlement; D7 = riesgo de disponibilidad del producto, sin reembolso de la app.)

---

## Verificación (cambio solo de docs)

Sin superficie de runtime. Verificar por **consistencia interna**:
1. Grep en los 5 docs tras editar por cifras viejas — que no quede `$3.99`, `$35.88`, `$39.99`, ni "2 max" de tope de producto en secciones canónicas; el precio por-ítem lee `$2.99` en todos lados.
2. Cross-check de que los nuevos campos de esquema (`premium_unlocked`, `unlock_purchase_id`, `item_purchases`) aparezcan en **ambos** `backend_technical.md` y el resumen de esquema en `simplified.md`, con listas de endpoints que coinciden.
3. Confirmar que cada regla "excluir ítems pagados" esté enunciada en los tres lugares que aplican límites (job de downgrade en backend, reglas de clean_architecture, mode-rules de simplified) — que ningún doc siga implicando que un ítem pagado cuenta contra los topes.
4. Releer las tablas de economía nuevas en `pricing_models.md` por aritmética ($0.002 × checks; neto-tras-comisión; runway) y que el fix de $45 se haya propagado a break-even.
5. Lectura de sanidad del copy español del paywall/UI por tono + corrección (los identificadores quedan en inglés).
