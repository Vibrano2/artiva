/**
 * Client-Side Standalone API Config
 * Disconnects remote backend servers and provides safe local simulation.
 */

export const apiClient = {
  get: async (url) => ({ data: { success: true } }),
  post: async (url, data) => ({ data: { success: true, data } }),
  put: async (url, data) => ({ data: { success: true, data } }),
  patch: async (url, data) => ({ data: { success: true, data } }),
  delete: async (url) => ({ data: { success: true } }),
};

export async function fetchWithAuth(url, options = {}) {
  // Return simulated successful response if called directly
  return {
    success: true,
    message: 'Local mock response',
    data: options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : {}
  };
}
