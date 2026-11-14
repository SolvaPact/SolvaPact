# SolvaPact Firestore Security Specification

## 1. Data Invariants
1. **Strict PII Isolation**: Publicly browsable `dossiers/{dossierId}` records must never expose user emails, phone numbers, or private contact credentials. Creator PII lives solely inside `users/{userId}` (`isOwner || isAdmin`) and `dossiers/{dossierId}/privateContact/{docId}` (`isDossierOwner || isAdmin`).
2. **Verified Identity Enforcement**: Every authenticated write requires `request.auth != null && request.auth.token.email_verified == true`.
3. **Immutable Ownership & Timestamps**: `ownerUid`, `userId`, `creatorUid`, `investorUid`, and `createdAt` (`== request.time`) are immutable after creation. `updatedAt` must equal `request.time`.
4. **Master Gate on Subcollections**: `dossiers/{dossierId}/privateContact`, `dossiers/{dossierId}/attachments`, and `negotiations/{threadId}/messages` verify parent existence and membership via `get()`/`exists()`.
5. **Bounded Anti-Abuse Payloads**: All IDs match `^[a-zA-Z0-9_\-]+$` (`<= 128` chars), every string has explicit `.size()` bounds, arrays are strictly bounded (`documents.size() <= 10`), and non-admin EXP updates are bounded monotonically (`<= +10 EXP` per update).
6. **Terminal State Locking**: Once a dossier reaches `funded` or a negotiation reaches `agreement_signed`, only an admin can alter it.
7. **Admin Privilege Restriction**: Only verified accounts matching the bootstrapped admin emails (`hugolaumonier@gmail.com` or `solvapact.vercel.app@gmail.com`) or existing `/admins/{uid}` documents qualify as `isAdmin()`. Analytics read/list is strictly admin-only.

## 2. The "Dirty Dozen" Adversarial Payloads (All Must Return PERMISSION_DENIED)
1. **Unverified Admin Email Spoof**: User signs in with `email: "hugolaumonier@gmail.com"` and `email_verified: false` -> attempts `list` on `analytics_events`.
2. **Ghost Field / Shadow Update on User**: Owner updates `users/{uid}` injecting `{ isAdmin: true }` alongside `updatedAt`.
3. **EXP Inflation Attack**: Non-admin user updates `users/{uid}` setting `loyaltyExp: 500` in one step from `0`.
4. **PII Blanket Scrape on Users**: Signed-in non-admin user runs `list` on `/users` or `get` on `/users/{otherUid}`.
5. **PII Blanket Scrape on Dossier Contact**: Signed-in non-owner user attempts `get` on `/dossiers/{dossierId}/privateContact/info`.
6. **Impersonated Dossier Creation**: Signed-in user attempts `create` on `/dossiers/d-evil` with `ownerUid: "someone-else"`.
7. **Backdated / Forged Timestamp**: User creates a dossier with `createdAt` set to a client-chosen past timestamp instead of `request.time`.
8. **Oversized String / Resource Poisoning**: Attacker submits `/dossiers/{200-char-id}` or sets `title` to 5,000 characters.
9. **Unauthorized Negotiation Eavesdrop**: Signed-in third party (neither `creatorUid` nor `investorUid`) attempts `get` or `list` on `/negotiations/{threadId}` or its `messages`.
10. **Forged Negotiation Creator Mapping**: Investor creates `/negotiations/{threadId}` with a fake `creatorUid` that does not match `get(/dossiers/{dossierId}).data.ownerUid`.
11. **Terminal State Tampering**: Dossier owner tries to modify `amountRequested` after dossier `status == 'funded'` or after negotiation `status == 'agreement_signed'`.
12. **Analytics Exfiltration**: Regular authenticated member tries `list` on `/analytics_events` to read revenue and private customer reviews.
