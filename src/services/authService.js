import { mockDb } from '../data/mockDatabase';

const STORAGE_KEYS = {
  CURRENT_USER: 'artiva_current_user',
};

export const AuthService = {
  /**
   * Register a standard client user
   */
  async register(idToken, first_name, last_name, role = 'client') {
    const user = {
      uid: `usr_${Date.now()}`,
      first_name: first_name || 'Client',
      last_name: last_name || 'User',
      email: `${(first_name || 'user').toLowerCase()}@artiva.app`,
      role: role || 'client',
      token: idToken || `mock_token_${Date.now()}`
    };

    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    return { token: user.token, user };
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
    const uid = `art_${Date.now()}`;
    const newArtisan = mockDb.saveArtisan({
      ...artisanData,
      uid,
      id: uid,
      first_name: artisanData.first_name || 'Artisan',
      last_name: artisanData.last_name || 'Professional',
      trade: artisanData.trade || 'Plumbing',
      location: typeof artisanData.location === 'object' ? (artisanData.location.address || 'Life Camp, Abuja') : (artisanData.location || 'Life Camp, Abuja'),
      hourly_rate: Number(artisanData.hourly_rate) || 5000,
      experience_years: Number(artisanData.experience_years) || 5,
      skills: artisanData.skills || artisanData.services || ['General Maintenance'],
      services: artisanData.skills || artisanData.services || ['General Maintenance'],
      is_verified: false,
      verified: false
    });

    const user = {
      uid,
      first_name: newArtisan.first_name,
      last_name: newArtisan.last_name,
      trade: newArtisan.trade,
      location: newArtisan.location,
      role: 'artisan',
      token: `mock_art_token_${Date.now()}`
    };

    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    return { success: true, data: newArtisan, uid, artisanId: uid, user };
  },

  /**
   * Authenticate and verify user session
   */
  async login(idToken, role = 'client') {
    const existing = this.getCurrentUser();
    const user = existing || {
      uid: role === 'artisan' ? 'art_emeka_01' : `usr_${Date.now()}`,
      first_name: role === 'artisan' ? 'Mr. Emeka' : 'Chioma',
      last_name: role === 'artisan' ? 'Okonkwo' : 'Eze',
      email: role === 'artisan' ? 'emeka@artiva.app' : 'chioma@example.com',
      role: role || 'client',
      token: idToken || `mock_token_${Date.now()}`
    };

    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    return { token: user.token, user };
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
    return {
      success: true,
      message: `OTP sent successfully to ${phone}`,
      data: { phone }
    };
  },

  /**
   * Verify phone OTP
   */
  async verifyPhoneOtp(phone, otp, role = 'client') {
    const cleanPhone = phone || '+2348012345678';
    const user = {
      uid: role === 'artisan' ? 'art_emeka_01' : `usr_${Date.now()}`,
      first_name: role === 'artisan' ? 'Mr. Emeka' : 'Verified User',
      last_name: role === 'artisan' ? 'Okonkwo' : '',
      phoneNumber: cleanPhone,
      phone: cleanPhone,
      role: role || 'client',
      token: `mock_otp_token_${Date.now()}`
    };

    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    return user;
  },

  /**
   * Send password recovery email
   */
  async resetPassword(email) {
    return {
      success: true,
      message: `Password reset link sent to ${email}`
    };
  },

  /**
   * Fetch current authenticated user's profile and assigned role
   */
  async getMe() {
    return this.getCurrentUser();
  },

  logout() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  getCurrentUser() {
    const userStr = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return userStr ? JSON.parse(userStr) : null;
  }
};
