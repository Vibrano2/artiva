# Artiva — Deployment Guide

## Prerequisites

- Node 20 +  
- Firebase CLI ≥ 13: `npm install -g firebase-tools`  
- Logged in: `firebase login`  
- Project selected: `firebase use <your-project-id>`

---

## 1. Frontend environment variables

Copy `.env.example` → `.env` and fill in your Firebase project values.

```
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_USE_FIREBASE_EMULATOR=false
```

---

## 2. Firebase Functions secrets & params

### 2a. Paystack secret key (Firebase Secret — encrypted at rest)

```bash
firebase functions:secrets:set PAYSTACK_SECRET_KEY
# paste your Paystack secret key (sk_test_... or sk_live_...) when prompted
```

> The secret is referenced in `functions/index.js` via `defineSecret('PAYSTACK_SECRET_KEY')`.  
> Every function that uses Paystack declares `secrets: [paystackSecretKey]` in its config.

To verify it was stored:
```bash
firebase functions:secrets:access PAYSTACK_SECRET_KEY
```

### 2b. Admin UID param (plain string — not sensitive)

`ADMIN_UID` is the Firebase Auth UID of the account that should receive the first admin custom claim.

```bash
# Find the UID in Firebase Console → Authentication → Users
# Then set it as a Functions param:
firebase functions:params:set ADMIN_UID=<uid-of-admin-user>
```

> Alternatively, set it in the Firebase Console under  
> **Functions → Configuration → Environment variables**.

---

## 3. Deploy

### Functions only
```bash
npm run deploy:functions
# or: firebase deploy --only functions
```

### Firestore rules + indexes
```bash
firebase deploy --only firestore
```

### Storage rules
```bash
firebase deploy --only storage
```

### Everything at once
```bash
npm run deploy
# or: firebase deploy
```

---

## 4. Bootstrap the first admin

After deploying functions:

1. Sign in to the app with the account whose UID you set as `ADMIN_UID`.
2. Navigate to **Admin Dashboard**.
3. Tap **Bootstrap Admin Claim**.
4. Sign out, then sign back in — the admin custom claim is now active.

> The `bootstrapAdmin` Cloud Function verifies that the caller's UID matches `ADMIN_UID` before granting the claim.  
> Use `setAdminClaim` (also on the Admin Dashboard) to add additional admins afterward.

---

## 5. Paystack webhook

Configure the Paystack webhook in your Paystack dashboard:

- **URL**: `https://<region>-<project-id>.cloudfunctions.net/paystackWebhook`  
- **Events**: `charge.success`, `transfer.success`

The function validates the `x-paystack-signature` HMAC-SHA512 header against your `PAYSTACK_SECRET_KEY`.

---

## 6. Local development (emulators)

```bash
# Start all emulators
firebase emulators:start

# In a separate terminal, start Vite dev server
npm run dev
```

Set `VITE_USE_FIREBASE_EMULATOR=true` in `.env` to route all SDK calls to localhost emulators.

---

## 7. Scheduled functions

`checkNoResponseTimers` runs every 5 minutes.  
`dailyMaintenance` runs every 24 hours.

Both are deployed automatically with `firebase deploy --only functions`.  
No additional setup required — Firebase Scheduler handles them.
