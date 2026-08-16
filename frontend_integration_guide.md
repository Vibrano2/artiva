# Artiva Frontend Integration Guide

This document provides everything the frontend team needs to connect to the Artiva backend. 

## 1. Interactive API Documentation (Swagger)

The backend is self-documenting. The most up-to-date, interactive API documentation is available via Swagger UI.

- **Local:** [http://localhost:5001/verifix-app/us-central1/api/api/docs](http://localhost:5001/verifix-app/us-central1/api/api/docs)
- **Production:** `https://us-central1-verifix.cloudfunctions.net/api/api/docs` *(Replace with your actual deployed URL if different)*

You can use the Swagger UI to see all available routes, required parameters, and test endpoints directly.

## 2. Base URLs

The API exposes the following base URLs depending on the environment:

- **Local Emulator:** `http://localhost:5001/verifix-app/us-central1/api`
- **Production Cloud Functions:** `https://us-central1-verifix.cloudfunctions.net/api`

## 3. CORS Configuration

The backend allows requests from the following origins:
- `http://localhost:3000`
- `http://localhost:5000`
- `http://localhost:5173` (Vite)
- `https://verifix.app`
- `https://www.verifix.app`

If you are developing locally on a different port, make sure to update the CORS whitelist in the backend (`functions/src/index.ts`).

## 4. Authentication

The backend uses **Firebase Authentication**. Once the user authenticates on the frontend (e.g., via Phone OTP), you must retrieve the Firebase ID token and include it in the `Authorization` header for protected routes.

**Format:**
```http
Authorization: Bearer <FIREBASE_ID_TOKEN>
```

> [!WARNING]
> Firebase ID tokens expire after 1 hour. Ensure you refresh the token before sending requests (e.g., by using `auth.currentUser.getIdToken(true)` in the Firebase Client SDK).

## 5. Main Route Prefixes

All routes are prefixed with `/api`. The main resource categories are:

- `/api/auth` - Authentication and user profile management.
- `/api/artisans` - Artisan discovery, profile, and status management.
- `/api/jobs` - Job posting, prioritization, matching, and lifecycle.
- `/api/payments` - Escrow payments, payout processing (Paystack), and refunds.
- `/api/admin` - Administrative actions and oversight.

## 6. Standard Error Handling

The API returns errors in a consistent JSON format:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired authentication token."
  }
}
```

## 7. Recommended Axios Setup

Here is a recommended setup using `axios` that automatically attaches the Firebase ID Token to outgoing requests.

```typescript
import axios from 'axios';
import { getAuth } from 'firebase/auth'; // Firebase client SDK

const apiClient = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://us-central1-verifix.cloudfunctions.net/api' 
    : 'http://localhost:5001/verifix-app/us-central1/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // Important for CORS if using cookies/sessions
});

// Add a request interceptor to attach the Firebase ID token
apiClient.interceptors.request.use(
  async (config) => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor for global error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle specific errors like 401 Unauthorized globally
    if (error.response?.status === 401) {
      console.warn('Session expired. Redirecting to login...');
      // Implement your logout/redirect logic here
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

> [!TIP]
> If you have the backend running locally, you can view the full Swagger documentation for exact payload shapes, required fields, and more examples.
