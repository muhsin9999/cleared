# PayPal SDK plan: Add Tracking

Written with APIMatic's PayPal Context Plugin (0.4.1, `typescript-integrate-paypal` workflow) on 22 Oct 2026.
Scope: Cleared's existing Add Tracking integration, `src/server/paypal/tracking.ts`, called from
`addTrackingProof` in `src/server/actions/proofs.ts`. The seller types a carrier and tracking number for a
paid physical sale; Cleared sends it to PayPal so the payment hold releases about 24 h after delivery.

Honest note: the first version of `tracking.ts` on this SDK was written before this sheet existed. This
sheet is the review the plugin requires; the gaps it found are listed under **Changes from this review**
and are fixed in the same commit.

## Repo survey

| Fact | Value | Exemplar |
| --- | --- | --- |
| Module format | ESM (`"type": "module"`), Next.js 16 bundler resolution; the SDK is loaded through one dialect only, so `instanceof` on its errors is reliable | `src/server/paypal/client.ts` |
| Runtime | Node 22 (server actions and Render Workflow tasks), never the browser or edge | `src/server/actions/proofs.ts` |
| tsconfig | `strict: true`; no `exactOptionalPropertyTypes`, no `verbatimModuleSyntax` (absent optionals are still spread, not set to `undefined`) | `tsconfig.json` |
| Package | `paypal` 2.29.0 from `github:context-plugins/paypal-typescript-sdk#v2.29.0`; resolves to `node_modules/paypal/package.json`, `sdk-map.md` present | `package.json` |
| Checks | `npx tsc --noEmit` · `npx eslint src tests` · `npx vitest run` · `npm run build` | — |
| Error type at our boundary | `PayPalError(status, debugId, body, message)` | `src/server/paypal/client.ts` |
| Store | Neon Postgres via Drizzle; proofs live in `proofs` | `src/db/schema.ts` |

## Host and credentials

- One environment in the SDK, so the host is a `serverOptions.baseUrl` override: `https://api-m.sandbox.paypal.com` unless `PAYPAL_ENV=live`, then `https://api-m.paypal.com`. Set in `trackingClient()`. Cleared only ever runs against the sandbox.
- `oauth2: { clientId, clientSecret }` from `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET`; construction throws if either is unset (the SDK itself would send unauthenticated requests).
- Read-only smoke against the real sandbox credential (22 Oct): `payments.getCapturedPayment` returned the order behind a paid invoice's capture; `orders.getOrder` returned `COMPLETED` with 0 trackers. No 403s.

## Contract sheet

Sources: `node_modules/paypal/sdk-map.md`, `map/operations/orders.md`, `map/operations/payments.md`, and the model files the **Type sources** tables name.

### `client.payments.getCapturedPayment`

- Signature: `getCapturedPayment(request: Payments.GetCapturedPaymentRequest, options?: RequestOptions): ApiPromise<CapturedPayment, Payments.GetCapturedPaymentError>` · `GET /v2/payments/captures/{capture_id}` · auth `oauth2` · no body
- Fields: `captureId` → path `capture_id`, `string`, required · `payPalMockResponse` → header `PayPal-Mock-Response`, optional (not set)
- Returns `CapturedPayment`; we read `supplementaryData?.relatedIds?.orderId` (`src/models/payment-supplementary-data.ts`, `related-identifiers.ts`; every member optional, so a missing order id is checked, not assumed)
- Error arms: `"error"` [401] `Error` · `"error2"` [403] `Error` · `"error3"` [404] `Error` · `"error500"` [500] no body · `"error4"` [default] `Error` · `"undeclared"`

### `client.orders.createOrderTracking` (the one write)

- Signature: `createOrderTracking(request: Orders.CreateOrderTrackingRequest, options?: RequestOptions): ApiPromise<Order, Orders.CreateOrderTrackingError>` · `POST /v2/checkout/orders/{id}/track` · auth `oauth2` · body `application/json` · SDK-sent `Idempotency-Key`, minted per call
- Fields: `id` → path, `string`, required · `payPalAuthAssertion` → header `PayPal-Auth-Assertion`, optional (not set) · `body` → body, `OrderTrackerRequest`, required
- `OrderTrackerRequest` (`src/models/order-tracker-request.ts`): `captureId: string` (required) · `trackingNumber?: string` · `carrier?: ShipmentCarrier` · `carrierNameOther?: string` · `notifyPayer?: boolean` · `items?: OrderTrackerItem[]`
- `ShipmentCarrier` (open enum, `src/models/shipment-carrier.ts`): members used `Ups` = `"UPS"`, `Usps` = `"USPS"`, `Fedex` = `"FEDEX"`, `DhlApi` = `"DHL_API"`, `Other` = `"OTHER"`
- Returns `Order`; we read `purchaseUnits[0].shipping.trackers[]` (`OrderTrackerResponse`: `id?`, `status?`, both optional, so the new tracker is asserted present)
- Error arms: `"error"` [400] `Error` · `"error2"` [403] `Error` · `"error3"` [404] `Error` · `"error4"` [422] `Error` · `"error5"` [500] `Error` · `"error6"` [default] `Error` · `"undeclared"`

### `client.orders.getOrder` (the re-read that settles an unknown outcome)

- Signature: `getOrder(request: Orders.GetOrderRequest, options?: RequestOptions): ApiPromise<Order, Orders.GetOrderError>` · `GET /v2/checkout/orders/{id}` · auth `oauth2` · no body
- Fields used: `id` → path, required; nothing else set
- Error arms: `"error"` [401] `Error` · `"error2"` [404] `Error` · `"error3"` [default] `Error` · `"undeclared"`

`Error` (`src/models/error.ts`): `name: string` · `message: string` · `debugId: string` · `details?: ErrorDetails[]` (`issue`, `description`). Never imported unaliased; our code reads the body structurally and never imports the type.

Arm tags differ per operation (`"error2"` is 403 on one, 404 on another), so no code switches on `payload.kind`; the status comes from `err.status` and the reason from the body's `details[0].description`, `details[0].issue` or `message`.

## 1b.1 Durable writes

**DUPLICATE CLAIMS**

| Write | Where the claim is stored | What rejects the second one | Where that rejection is caught | Where in the code |
| --- | --- | --- | --- | --- |
| `createOrderTracking` | a `proofs` row (`kind = 'tracking'`, `meta.status = 'sending'`) inserted before the SDK call | unique index `proofs_tracking_unique` on `(sale_id, meta->>'trackingNumber') WHERE kind = 'tracking'` (migration `drizzle/0006_tracking_claim.sql`) | `addTrackingProof`: the claim insert uses `ON CONFLICT DO NOTHING`, so the second caller gets no row back; it then reads the existing claim and answers "already on this sale" (or settles an `unconfirmed` one) | `addTrackingProof` in `src/server/actions/proofs.ts`: the claim insert, then `addTracking()`; the `catch` deletes the claim when PayPal refuses |

The SDK's `Idempotency-Key` only makes its own re-sends safe; a second click is a new call with a new key, so the claim is what stops it.

**UNKNOWN OUTCOMES**

| Write | The operation you re-read with | The reference you search by | Where in the code | The test that fails the connection |
| --- | --- | --- | --- | --- |
| `createOrderTracking` | `orders.getOrder` (`settleTracking()`) | the order id plus a tracker whose id ends with our tracking number | the `catch` in `addTracking()` and `settle()` (`src/server/paypal/tracking.ts`) return `{ outcome: "unknown" }` when the re-read can't confirm it; `addTrackingProof` keeps the claim as `unconfirmed`, and the next attempt calls `settleTracking()` before sending again | `tests/tracking.test.ts`: "a dropped connection is settled by re-reading the order", "a dropped connection that can't be settled is unknown, never failed", "an unreadable 2xx reply is unknown too"; never-sent: "a credential that can't be obtained is never re-read" |

Unknown outcomes: a timeout, a dropped connection, or an unreadable reply on a 2xx. A 5xx is an answer, but it is re-read too: a 500 on a write doesn't prove the write didn't land, and the re-read is a cheap GET. Never-sent failures (`auth`, `encode`) are not re-read.

## 1b.2 Cross-operation invariants

| Invariant | Where the legal set comes from | Enforced where | The test that proves it |
| --- | --- | --- | --- |
| The capture is this sale's own payment | the sale row (`paypalCaptureId`, or the paid invoice's `paypalPaymentId`); never from the form | `addTrackingProof` reads it from the sale owned by the signed-in seller | `e2e/unhappy-paths.spec.ts` "tracking needs a real-looking number" accepts the "real payment" refusal; it is skipped in CI because it needs a paid physical sale, so this row has no automated test yet |
| The carrier is one Cleared offers | `CARRIERS` in `tracking.ts` (UPS, USPS, FedEx, DHL, Other) | `addTrackingProof`, before the claim | the same skipped e2e test; no automated test yet |

## 1b.3 Optional request fields (`createOrderTracking`)

| Field | What requires it | Set it? |
| --- | --- | --- |
| `trackingNumber` | the task: the seller's tracking number; also the UNKNOWN OUTCOMES row searches by it | ✅ |
| `carrier` | the task: the carrier the seller picks | ✅ |
| `carrierNameOther` | the task, only when the carrier is Other | ✅ only for `OTHER` |
| `notifyPayer` | YOUR CALL, decided: the product promise is that the client is told the goods shipped (docs/PRODUCT.md, F3) | ✅ `true` |
| `items` | nothing | ❌ |
| `payPalAuthAssertion` | nothing (Cleared acts for its own sandbox seller, not a partner's) | ❌ |

## 1b.4 When the API says no (`createOrderTracking`, `getCapturedPayment`)

| status | Cleared answers | the seller reads | test |
| --- | --- | --- | --- |
| 4xx other than 401 / 403 / 429 | the action returns an error and releases the claim | PayPal's own reason (`details[0].description`, then `issue`, then `message`) | "turns a 422 into PayPal's own words, with its debug id" |
| 401 / 403 | error | fixed: "Cleared couldn’t connect to your PayPal account. Try again later." | "a 403 is our credentials, not the seller's mistake" |
| 429 | error | fixed: "PayPal is busy. Try again in a minute." | — |
| 5xx | error, after the re-read (or added, if the re-read finds the tracker) | fixed: "PayPal had a problem adding the tracking. Try again in a minute." | "a 500 whose tracker didn't land…", "a 500 whose tracker landed counts as added…" |
| no response, on the write | per UNKNOWN OUTCOMES | "PayPal didn’t confirm the tracking yet. Cleared will check PayPal before sending it again." | see UNKNOWN OUTCOMES |
| no response, on a read | error | fixed: "PayPal didn't answer. Try again in a minute." | — |

PayPal's `debugId` is kept on `PayPalError.debugId` and written to the audit log; it is never shown as the message.

## Retry and logging

- Retry: SDK defaults kept for reads (GET retried on 408/429/5xx, connection and timeout), `maxRetries: 2`, `timeout: 20_000` ms per attempt. `httpMethodsToRetry` is not widened, so the write is sent once. No hand-written retry layer.
- Logging: off, and set explicitly (`logging: { level: "off" }`), so `PAYPAL_CLIENT_LOG` can't turn it on from outside. Request bodies carry no card or personal data, but the posture stays off.
- No pagination or streaming in scope; the `fetch` seam is used only by tests.

## Changes from this review

1. A duplicate claim (unique index + claim row) before the write, released when PayPal refuses.
2. Unknown outcomes are reported as unknown, never failed; an unreadable 2xx reply is unknown too; a stored `unconfirmed` claim is settled by re-reading, not by re-sending.
3. Error statuses mapped per 1b.4 (fixed messages for 401/403/429/5xx; PayPal's reason only for the seller's own 4xx).
4. The new tracker is asserted present in the reply; a reply without it is an unknown outcome.
5. Logging pinned off.
6. A claim that is `sending` or `unconfirmed` is not evidence: it is left out of the agent's exhibits and the sale's proof coverage (`src/lib/proof-status.ts`).

## Assumptions & Blockers

- None blocking. Minor: the tracking number is compared case-insensitively with spaces removed (Cleared normalises it before the claim).

## REQUIRED READING

- MUST load `typescript-error-handling`: the one error family, `err.kind`, unknown vs failed (loaded)
- MUST load `typescript-client-initialization`: the long-lived client and its token cache (loaded)
- MUST load `typescript-testing`: the `fetch` seam, wire-shape replies, asserting on the request the SDK built (loaded)
- MUST load `typescript-configuration-resilience`: what is retried, what the timeout bounds, logging (loaded)
