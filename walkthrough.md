# Security Summary

## Issues Found & Resolved

| Area | What Was Found | How It Was Fixed | Verification Status |
| :--- | :--- | :--- | :--- |
| Founder Analytics Access (`server.ts`) | The daily financial and satisfaction report routes previously checked a plain name query/body parameter instead of cryptographic credentials. | Replaced client-supplied name checks with cryptographic Google/Firebase ID token signature verification (RS256 against Google's public x509 keys) plus strict `email_verified` and owner-email checks (`401`/`403`). Updated the frontend modal to send a fresh `Authorization: Bearer` token. | Verified (HTTP `401` without valid signed token / rejected forged JWT) |
| Loyalty Discount & Checkout Integrity (`server.ts`, `api/payments/checkout.ts`) | Checkout pricing previously accepted loyalty tier flags, EXP points, and Diamond publication counts sent from the browser, and the serverless checkout handler carried outdated pricing (`80 €`) and old EXP thresholds. | Required a verified Firebase ID token (`401` if unauthenticated) and moved loyalty lookup to the server via the user's scoped Firestore REST profile (`users/{uid}`) and verified founder email check. Synced all tiers to `39,99 €` lifetime loyalty activation and `0 / 30 / 60 / 120 EXP`. | Verified (HTTP `401` on unauthenticated spoofed discount payload; frontend sends Bearer token) |
| Analytics Event Submission (`server.ts`) | Event recording accepted anonymous submissions without bounds on rating values, amounts, or text length. | Enforced valid Firebase ID token verification, bound `userEmail` from the verified token, restricted `rating` to integers `1–5`, bounded `amount` (`0–100 000`), and clamped string lengths. | Verified (HTTP `401` unauthenticated; input validation enforced) |
| Anti-Bot Rate Limiting & Input Bounds (`server.ts`, `api/*`) | Public AI chat, draft generation, company lookup, checkout, analytics, and support ticket endpoints lacked request-rate throttling, email format validation, PDF mime checks, and external fetch timeouts. | Added bounded sliding-window rate limiters (`20 req/min` on AI & sensitive endpoints, `30 req/min` on company verification returning HTTP `429` with `Retry-After`), strict email regex + control-character stripping, 4 000-character message/prompt limits, PDF mime & base64 validation, country allowlists, and 8-second upstream fetch timeouts. | Verified (HTTP `400` on invalid email / oversized prompt; HTTP `429` on burst traffic) |
| HTTP Security Headers (`server.ts`) | Express exposed the default `X-Powered-By` header and lacked baseline browser hardening headers. | Disabled `X-Powered-By`, configured `trust proxy`, and applied `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `Cross-Origin-Opener-Policy: same-origin-allow-popups` (preserving Google Sign-In popups and iframe embedding), `X-DNS-Prefetch-Control: off`, `X-Permitted-Cross-Domain-Policies: none`, and HTTPS `Strict-Transport-Security`. | Verified (`X-Powered-By` removed; headers confirmed on `/api/health`) |

## Verified Safeguards Already in Place

| Safeguard | Description | Status |
| :--- | :--- | :--- |
| Database Access Control & Field Isolation (`firestore.rules`) | Private contact details (emails, phones, guarantor phones) are isolated in `dossier_contacts` and only readable by authenticated members when creating or negotiating a dossier; owner-only rules protect `users`, `dossiers`, `negotiations`, `investor_directory`, and `direct_submissions`; field schemas validate types and numeric ranges. | Verified & Deployed |
| Secret Key Isolation | `GEMINI_API_KEY`, `STRIPE_SECRET_KEY`, and `RESEND_API_KEY` remain exclusively on the server side (`process.env`) and are never bundled into the client app. | Verified |
| Cross-Site Scripting (XSS) Protection | Zero `dangerouslySetInnerHTML`, `innerHTML`, `document.write`, `eval`, or `new Function` usage across the frontend and backend; React JSX auto-escaping handles all user content safely. | Verified (`0` unsafe sinks found) |
| AI Assistant Privacy Guardrails | SolvaSolution enforces strict prompt boundaries rejecting instruction-override attempts and blocking leakage of founder identity, business metrics, member contact info, or system configuration. | Verified |

---

## PoC Verification

All checks were executed non-destructively against the restarted local development server (`http://127.0.0.1:3000`):

1. **HTTP Security Headers & Fingerprint Removal**:
   - Request: `GET /api/health`
   - Result: `200 OK`, `X-Powered-By: null`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, `Cross-Origin-Opener-Policy: same-origin-allow-popups`.
2. **Founder Daily Report Protection**:
   - Request 1: `GET /api/analytics/daily?ownerName=Hugo%20Laumonier` (no `Authorization` header) -> `401 {"error":"Authentification requise."}`
   - Request 2: `POST /api/analytics/send-daily-report` with forged RS256 Bearer token and `{ "ownerName": "Hugo Laumonier" }` -> `401 {"error":"Authentification requise."}`
3. **Server-Side Checkout & Loyalty Anti-Spoofing**:
   - Request: `POST /api/payments/checkout` without authentication and with spoofed `{ "kind": "publication", "loyaltyActive": true, "loyaltyExp": 120, "diamondPublicationsCount": 4 }` -> `401 {"error":"Authentification requise pour initier un paiement."}`
4. **Analytics Event Authentication**:
   - Request: `POST /api/analytics/event` without authentication -> `401 {"error":"Authentification requise pour enregistrer un événement."}`
5. **Input Validation & Bounds**:
   - Support ticket with invalid email (`"invalid-email"`): `POST /api/support/ticket` -> `400`
   - AI chat prompt exceeding 4 000 characters: `POST /api/solvasolution/chat` -> `400`
   - Company registry lookup with >100 characters: `GET /api/company/verify?q=...` -> `400` (valid 10-digit Malagasy NIF returns `200`)
   - Normal AI chat query (`"Combien coûte le compte fidélité ?"`): `200 OK`, accurate `39,99 euros` response.
6. **Anti-Flood Rate Limiting**:
   - Burst of 21 requests in one window to `POST /api/support/ticket` -> trailing requests return `429 Too Many Requests` with `Retry-After` header.
