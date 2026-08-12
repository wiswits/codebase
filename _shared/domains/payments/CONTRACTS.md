# Payments domain — contracts & coupling map

One shared folder (`_shared/domains/payments/`) serves **two product-modules**.
Grounded in snapshot code.

## Route surfaces (from `payments.module.js`)
| Descriptor | Mount | Surface |
|---|---|---|
| `payments.payments` | `/api/payments`       | School fee payment orders (Razorpay), reconcile, refunds |
| `payments.config`   | `/api/payment-config` | Owner-set gateway keys/credentials |
| `payments.billing`  | `/api/billing`        | WisWits charging institutions (SaaS subscriptions) |

`payment-integrity.js` = webhook/signature integrity helper (not a route).

## Product-module → surface
| Module | Owns | Note |
|---|---|---|
| **41-Fee-Gateway** | `payments.payments` + `payments.config` | student/parent fee checkout + gateway keys |
| **43-SaaS-Billing** | `payments.billing` | WisWits→institution subscription billing |

## Tables
**Owned:** `client_payment_orders`, `client_payment_transactions`, `client_payment_refunds`, `client_payment_config`
**Read from other domains — cannot be cut:**
- `client_fee_payments`, `client_fee_assignments` → **Fees (39/40)** — the gateway reconciles what Fee-Collection recorded
- `client_students`, `client_parents`, `client_parent_students`, `client_users` → **People/Core identity**

## Core dependencies
`config/db` · `auth` · `rbac` · `utils/{audit,logger,response}` and services:
`razorpayService` · `pricing` · `feeLedger` · `payments/credentials` ·
`payments/subscriptions` · `notificationService` · `ai/crypto`.

## Key coupling
**41-Fee-Gateway cannot be separated from Fees (39/40):** it reads
`client_fee_payments`/`client_fee_assignments` and writes back via `feeLedger`.
Fees records the charge; the gateway settles it. Two names, one money flow.
