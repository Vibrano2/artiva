const unsupportedRequest = () => {
  throw new Error('Direct HTTP API calls are not configured. Use the Firebase-backed service methods instead.');
};

export const apiClient = {
  get: unsupportedRequest,
  post: unsupportedRequest,
  put: unsupportedRequest,
  patch: unsupportedRequest,
  delete: unsupportedRequest,
};

export async function fetchWithAuth(url, options = {}) {
  return unsupportedRequest();
}
