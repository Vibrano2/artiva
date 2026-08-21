import { fetchWithAuth } from './apiConfig';

const STORAGE_KEYS = {
  CURRENT_USER: 'artiva_current_user',
};

export const AuthService = {
  /**
   * Register a standard client user
   */
  async register(idToken, first_name, last_name, role = 'client') {
    let data;
    try {
      data = await fetchWithAuth('/api/auth/register/client', {
        method: 'POST',
        body: JSON.stringify({ idToken, first_name, last_name, role: 'client' })
      });
    } catch (err) {
      // Fallback to /api/auth/register
      data = await fetchWithAuth('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ idToken, first_name, last_name, role })
      });
    }
    
    const user = {
      ...(data.data || data.user || data),
      token: idToken,
    };
    
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    return { token: idToken, user };
  },

  /**
   * Register a client user (alias with object payload)
   */
  async registerClient({ idToken, first_name, last_name }) {
    return this.register(idToken, first_name, last_name, 'client');
  },

  /**
   * Register an artisan with profile, skills, banking info, and verification documents
   */
  async registerArtisan(artisanData) {
    const payload = {
      first_name: artisanData.first_name,
      last_name: artisanData.last_name,
      trade: artisanData.trade,
      skills: artisanData.skills || artisanData.services || [],
      location: typeof artisanData.location === 'object' ? artisanData.location : {
        address: artisanData.location || artisanData.address || 'Life Camp, Abuja',
        city: artisanData.city || 'Abuja',
        state: artisanData.state || 'FCT',
        lga: artisanData.lga || 'Abuja Municipal'
      },
      hourly_rate: Number(artisanData.hourly_rate) || 5000,
      experience_years: Number(artisanData.experience_years) || 5,
      nin: artisanData.nin || '',
      bank_details: artisanData.bank_details || {
        account_number: artisanData.account_number || '',
        bank_code: artisanData.bank_code || '058'
      },
      id_document_base64: artisanData.id_document_base64 || artisanData.id_photo || '',
      work_photos_base64: artisanData.work_photos_base64 || artisanData.work_photos || []
    };

    let res;
    try {
      res = await fetchWithAuth('/api/auth/register/artisan', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } catch {
      res = await fetchWithAuth('/api/artisans', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    }

    const created = res.data || res.artisan || res;
    return { success: true, data: created, uid: created.uid || created.id };
  },

  /**
   * Authenticate and verify user session with a Firebase ID token
   */
  async login(idToken, role = 'client') {
    let data;
    try {
      data = await fetchWithAuth('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ idToken, role })
      });
    } catch {
      data = await fetchWithAuth('/api/auth/firebase/verify', {
        method: 'POST',
        body: JSON.stringify({ idToken, role })
      });
    }
    
    const user = {
      ...(data.data || data.user || data),
      token: idToken,
    };
    
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    return { token: idToken, user };
  },

  /**
   * Verify Firebase Token (alias for login)
   */
  async verifyFirebaseToken(idToken, role = 'client') {
    return this.login(idToken, role);
  },

  /**
   * Send phone OTP
   */
  async sendPhoneOtp(phone) {
    return await fetchWithAuth('/api/auth/phone/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone })
    });
  },

  /**
   * Verify phone OTP
   */
  async verifyPhoneOtp(phone, otp, role = 'client') {
    let data;
    try {
      data = await fetchWithAuth('/api/auth/phone/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ phone, otp, role })
      });
    } catch {
      data = await fetchWithAuth('/api/auth/verify', {
        method: 'POST',
        body: JSON.stringify({ phone, otp, role })
      });
    }
    
    const user = {
      ...(data.data || data.user || data),
      token: data.token || data.data?.token,
    };
    
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    return user;
  },

  /**
   * Send password recovery email
   */
  async resetPassword(email) {
    return await fetchWithAuth('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  },

  /**
   * Fetch current authenticated user's profile and assigned role
   */
  async getMe() {
    let res;
    try {
      res = await fetchWithAuth('/api/users/me');
    } catch {
      res = await fetchWithAuth('/api/auth/me');
    }
    const user = res.user || res.data || res;
    if (user) {
      const stored = this.getCurrentUser() || {};
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify({ ...stored, ...user }));
    }
    return user;
  },

  logout() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  getCurrentUser() {
    const userStr = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return userStr ? JSON.parse(userStr) : null;
  }
};
