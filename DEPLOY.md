# Artiva frontend deployment

Artiva is the browser application. The Verifix repository is the only backend and owns Firebase Functions, Firestore rules and indexes, Storage rules, Paystack integration, and the ML service.

## Required configuration

Use Node.js 20. Copy `.env.example` to `.env` for local development and fill in the Firebase web application values. Firebase web configuration is public application metadata, but production values should still be managed as deployment variables so each environment is explicit.

The recommended production setup serves the frontend and Verifix API from the same Firebase project. The hosting rewrite in `firebase.json` sends `/api/**` to the `api` function in `us-central1`. Leave `VITE_API_BASE_URL` empty in that setup.

For local emulator development, run the Verifix emulators first, then set:

```dotenv
VITE_USE_FIREBASE_EMULATOR=true
VITE_FIREBASE_PROJECT_ID=your-emulator-project-id
```

The frontend expects Auth on port 9095, Firestore on 8085, and the Verifix API function on 5005.

## CI and production deployment

Configure these GitHub repository variables:

- `GCP_PROJECT_ID`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID` (optional)

Configure these GitHub secrets for Workload Identity Federation:

- `WIF_PROVIDER`
- `WIF_SERVICE_ACCOUNT`

The service account needs only the IAM permissions required to deploy Firebase Hosting. Protect the `main` branch and require the frontend quality job before merge. A push to `main` builds the application and deploys only Hosting. Deploy the Verifix backend separately before publishing a frontend that depends on a new API contract.

For a controlled local deployment:

```bash
npm ci
npm run check
npm run deploy -- --project your-project-id
```

Do not deploy Functions or security rules from this repository.
