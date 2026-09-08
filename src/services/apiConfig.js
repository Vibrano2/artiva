import { auth } from '../config/firebase';

const configuredBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '');
const emulatorBaseUrl = import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true'
  ? `http://127.0.0.1:5005/${import.meta.env.VITE_FIREBASE_PROJECT_ID}/us-central1`
  : '';
const BASE_URL = configuredBaseUrl || emulatorBaseUrl;
const REQUEST_TIMEOUT_MS = 20_000;

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

function requestUrl(path) {
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) {
    throw new Error('API paths must be same-origin relative paths.');
  }
  return `${BASE_URL}${path}`;
}

async function parseResponse(response) {
  if (response.status === 204) return null;
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    if (!response.ok) throw new ApiError(`Request failed (${response.status})`, response.status);
    throw new ApiError('The server returned an invalid response.', response.status);
  }
  return response.json();
}

async function makeRequest(path, options, forceRefresh = false) {
  const headers = new Headers(options.headers || {});
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (options.body !== undefined && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const user = auth.currentUser;
  if (user) {
    headers.set('Authorization', `Bearer ${await user.getIdToken(forceRefresh)}`);
  } else {
    headers.delete('Authorization');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(requestUrl(path), {
      ...options,
      headers,
      credentials: 'same-origin',
      signal: options.signal || controller.signal,
    });
    if (response.status === 401 && user && !forceRefresh) {
      return makeRequest(path, options, true);
    }
    const body = await parseResponse(response);
    if (!response.ok) {
      throw new ApiError(
        body?.error || body?.message || `Request failed (${response.status})`,
        response.status,
        body?.code
      );
    }
    return body;
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new ApiError('The request timed out. Please try again.', 408, 'TIMEOUT');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchWithAuth(path, options = {}) {
  return makeRequest(path, options);
}

export function encodePath(value) {
  return encodeURIComponent(String(value));
}

export const apiClient = {
  get: (path) => fetchWithAuth(path),
  post: (path, data) => fetchWithAuth(path, { method: 'POST', body: JSON.stringify(data) }),
  put: (path, data) => fetchWithAuth(path, { method: 'PUT', body: JSON.stringify(data) }),
  patch: (path, data) => fetchWithAuth(path, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (path) => fetchWithAuth(path, { method: 'DELETE' }),
};
