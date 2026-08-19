import { fetchWithAuth } from './apiConfig';

const STORAGE_KEYS = {
  CURRENT_USER: 'artiva_current_user',
};

export const AuthService = {
  async register(idToken, first_name, last_name, role = 'client') {
    const data = await fetchWithAuth('/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ idToken, first_name, last_name, role })
    });
    
    const user = {
      ...(data.data || data.user || data),
      token: idToken,
    };
    
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    return { token: idToken, user };
  },

  async verifyFirebaseToken(idToken, role = 'client') {
    const data = await fetchWithAuth('/v1/auth/firebase/verify', {
      method: 'POST',
      body: JSON.stringify({ idToken, role })
    });
    
    const user = {
      ...(data.data || data.user || data),
      token: idToken,
    };
    
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    return { token: idToken, user };
  },

  logout() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  getCurrentUser() {
    const userStr = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return userStr ? JSON.parse(userStr) : null;
  }
};
