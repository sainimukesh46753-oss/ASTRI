# ASTRI customer platform — implementation status

This branch contains the first customer-platform and separate-admin UI foundation. It is intentionally not deployed.

## Included
- Royal Purple + Lavender visual theme retained.
- Customer storefront remains separate from the private admin route.
- Product cards render genuine image URLs from catalogue records only when a verified `imageUrl` field exists. Missing photos are not replaced with AI art or unrelated stock images.
- Optional `priceINR` catalogue field is supported; absent prices are shown as unconfirmed.
- Checkout page collects delivery details in the browser UI but does not submit orders or collect payment.
- Order tracking page explains that live tracking awaits the order database and delivery status API.
- Separate `/admin/` console shell is marked noindex and its sign-in is disabled until server-side authentication exists.

## Required before production
1. Add and verify licensed product image URLs (prefer manufacturer or authorised catalogue feeds); add `imageUrl` per exact SKU in `data/catalog.json`.
2. Configure a backend and database for customers, orders, inventory, payment records and delivery events. Never expose service-role or gateway secrets in browser code.
3. Implement server-verified admin authentication, secure HttpOnly sessions, role permissions, CSRF protection and audit logging. A static admin page alone is not security.
4. Select a payment provider (for India, e.g. Razorpay) and configure server-side order creation, webhook signature verification, refunds and reconciliation. Keep secrets in Vercel environment variables.
5. Implement order creation and tracking APIs with customer-scoped access and delivery-partner updates.
6. Add address validation, serviceable PIN-code checks, inventory reservation, taxes, delivery fees, cancellation/refund rules and operational readiness checks.

## Important
No real product image has been fabricated or substituted. No payment is accepted. No live tracking data is claimed. The admin console is only a UI shell until server authentication is implemented.
