import axios from 'axios';
import { auth } from '../config/firebase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://us-central1-artiva-f24a8.cloudfunctions.net/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

apiClient.interceptors.request.use(
  async (config) => {
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

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('Session expired or unauthorized. Redirecting to login...');
    }
    return Promise.reject(error);
  }
);

export async function fetchWithAuth(url, options = {}) {
  const method = options.method || 'GET';
  let data;
  
  if (options.body instanceof FormData) {
    data = options.body;
  } else if (typeof options.body === 'string') {
    try {
      data = JSON.parse(options.body);
    } catch {
      data = options.body;
    }
  } else {
    data = options.body;
  }
  
  const headers = { ...(options.headers || {}) };
  if (data instanceof FormData) {
    delete headers['Content-Type'];
  }

  try {
    const response = await apiClient({
      url,
      method,
      data,
      headers
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
       const errorMessage = error.response.data.error?.message || 
                            error.response.data.error || 
                            error.response.data.message || 
                            'API request failed';
       const err = new Error(errorMessage);
       err.status = error.response.status;
       err.data = error.response.data;
       throw err;
    }
    throw error;
  }
}

