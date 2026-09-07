# Artiva Firebase backend

## Prerequisites

- A Firebase project with Authentication, Firestore, Cloud Storage, and Cloud Functions enabled.
- Phone, Google, and Apple providers enabled in Firebase Authentication as applicable.
- Node.js 20 and Firebase CLI.
- A Paystack secret key. Keep it exclusively in Firebase Secret Manager; it must never be placed in a Vite environment file.

## Local setup

1. Copy `.env.example` to `.env` and fill in the Firebase web application values.
2. Install function dependencies with `npm install --prefix functions`.
3. To use emulators, set `VITE_USE_FIREBASE_EMULATOR=true`, then run `npm run backend:emulators` from the repository root. The Emulator Suite UI is available at `http://127.0.0.1:4000`.

The Vite application is separate from the emulators. Run `npm run dev` in another terminal after starting them.

## Deploy

1. Set the Paystack secret:

   ```powershell
   npx firebase-tools functions:secrets:set PAYSTACK_SECRET_KEY --project YOUR_FIREBASE_PROJECT_ID
   ```

2. Deploy rules and functions:

   ```powershell
   npx firebase-tools deploy --only firestore:rules,storage,functions --project YOUR_FIREBASE_PROJECT_ID
   ```

3. In the Paystack dashboard, configure the webhook endpoint shown after deployment for `paystackWebhook`. The handler validates Paystack's `x-paystack-signature` before funding a job escrow record.

## Operational setup

- Assign an `admin: true` Firebase custom claim through a trusted Admin SDK process before using administration screens.
- During proforma approval, an admin supplies the supplier's verified bank details. The backend creates a Paystack recipient and stores only its recipient code on the proforma. Once the job is completed and rated, approved proformas are paid directly to suppliers; artisans never receive a direct job-value payout.
- Do not store NINs, bank details, Paystack secrets, or Firebase Admin credentials in browser code or public Firestore documents.