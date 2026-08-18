import { fetchWithAuth } from './apiConfig';

const STORAGE_KEYS = {
  CURRENT_USER: 'artiva_current_user',
};

export const AuthService = {
  async sendOtp(email) {
    return await fetchWithAuth('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  },

  async verifyOtp(email, otp, role) {
    const data = await fetchWithAuth('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp, role })
    });
    
    const user = {
      ...data.user,
      token: data.token,
    };
    
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    return { token: user.token, user };
  },

  async authenticateWithEmail(idToken, role = 'client', userData = {}) {
    const data = await fetchWithAuth('/auth/email/verify', {
      method: 'POST',
      body: JSON.stringify({ idToken, role })
    });

    const user = {
      uid: data.data.uid,
      email: data.data.email || userData.email,
      first_name: data.data.first_name,
      last_name: data.data.last_name,
      role: data.data.role,
      token: idToken,
    };

    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    return { token: user.token, user };
  },

  logout() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  getCurrentUser() {
    const userStr = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return userStr ? JSON.parse(userStr) : null;
  }
};
