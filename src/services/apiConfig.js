import { getAuth } from 'firebase/auth';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Fetch wrapper that automatically attaches the Firebase ID token as a Bearer header.
 * Throws on non-2xx responses with the server error message when available.
 */
export async function fetchWithAuth(url, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };

  // Remove Content-Type for FormData so the browser sets the correct multipart boundary
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch {
    // No authenticated user — proceed unauthenticated (public endpoints)
  }

  if (!headers['Authorization'] && typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('artiva_current_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.token) {
          headers['Authorization'] = `Bearer ${parsed.token}`;
        } else if (parsed?.uid) {
          headers['Authorization'] = `Bearer session_${parsed.uid}_${Date.now()}`;
        }
      } else {
        // Guest session fallback so public onboarding job posting succeeds
        headers['Authorization'] = `Bearer session_client_guest_${Date.now()}`;
      }
    } catch {
      // ignore
    }
  }

  const res = await fetch(`${BASE_URL}${url}`, { ...options, headers });

  if (!res.ok) {
    let errMsg = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      errMsg = body.error || body.message || errMsg;
    } catch { /* non-JSON error body */ }
    throw new Error(errMsg);
  }

  return res.json();
}

export const apiClient = {
  get:    (url)       => fetchWithAuth(url),
  post:   (url, data) => fetchWithAuth(url, { method: 'POST',  body: JSON.stringify(data) }),
  put:    (url, data) => fetchWithAuth(url, { method: 'PUT',   body: JSON.stringify(data) }),
  patch:  (url, data) => fetchWithAuth(url, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (url)       => fetchWithAuth(url, { method: 'DELETE' }),
};
