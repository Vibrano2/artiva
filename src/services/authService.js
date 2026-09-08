import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { fetchWithAuth } from './apiConfig';
import { normalizeLocation } from './normalizers';

function publicUser(value = {}) {
  return {
    uid: value.uid,
    first_name: value.first_name || '',
    last_name: value.last_name || '',
    email: value.email || auth.currentUser?.email || '',
    phone: value.phone || value.phone_number || auth.currentUser?.phoneNumber || '',
    phoneNumber: value.phone_number || value.phone || auth.currentUser?.phoneNumber || '',
    role: value.role || 'client',
  };
}

function persistUser(value) {
  return publicUser(value);
}

function fileFrom(value) {
  return value?.file || value;
}

export const AuthService = {
  async login(idToken, role = 'client') {
    const requestedRole = role === 'artisan' ? 'artisan' : 'client';
    const response = await fetchWithAuth('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ idToken, role: requestedRole }),
    });
    const user = persistUser(response.user || response.data || {});
    return { user };
  },

  async verifyFirebaseToken(idToken, role = 'client') {
    return this.login(idToken, role);
  },

  async register(idToken, firstName, lastName) {
    const response = await fetchWithAuth('/api/auth/register/client', {
      method: 'POST',
      body: JSON.stringify({
        idToken,
        first_name: String(firstName || '').trim(),
        last_name: String(lastName || '').trim(),
        role: 'client',
      }),
    });
    const user = persistUser(response.data || response.user || {});
    return { user };
  },

  async registerClient({ idToken, first_name, last_name }) {
    return this.register(idToken, first_name, last_name);
  },

  async registerArtisan(data) {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser?.uid || !firebaseUser.phoneNumber) {
      throw new Error('A verified phone sign-in is required before artisan registration.');
    }

    const idDocument = fileFrom(data.id_document || data.id_photo);
    const workPhotos = (data.work_photos || []).map(fileFrom).filter((file) => file instanceof File);
    if (!(idDocument instanceof File)) throw new Error('A valid identity document is required.');
    if (workPhotos.length < 3 || workPhotos.length > 5) {
      throw new Error('Upload between 3 and 5 work photos.');
    }
    if (!data.bank_details?.account_name || !data.bank_details?.account_number || !data.bank_details?.bank_code) {
      throw new Error('A verified payout account is required.');
    }

    const payload = {
      first_name: String(data.first_name || '').trim(),
      last_name: String(data.last_name || '').trim(),
      phone: firebaseUser.phoneNumber,
      trade: data.trade,
      location: normalizeLocation(data.location),
      tagline: String(data.tagline || '').trim(),
      experience_years: Number(data.experience_years || 0),
      hourly_rate: Number(data.hourly_rate || 0),
      services: data.services || data.skills || [],
      nin: String(data.nin || ''),
      bank_details: {
        account_name: data.bank_details.account_name,
        account_number: data.bank_details.account_number,
        bank_code: data.bank_details.bank_code,
      },
    };

    const response = await fetchWithAuth('/api/artisans', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const profile = response.data?.data || response.data?.profile || response.data || {};
    const uid = profile.uid || firebaseUser.uid;

    const idForm = new FormData();
    idForm.append('file', idDocument);
    await fetchWithAuth(`/api/artisans/${encodeURIComponent(uid)}/id-document`, {
      method: 'POST',
      body: idForm,
    });

    for (const file of workPhotos) {
      const photoForm = new FormData();
      photoForm.append('file', file);
      await fetchWithAuth(`/api/artisans/${encodeURIComponent(uid)}/photo`, {
        method: 'POST',
        body: photoForm,
      });
    }

    return { success: true, artisanId: uid, uid, data: profile };
  },

  async signupArtisan(data) {
    return this.registerArtisan(data);
  },

  async verifyPhoneOtp() {
    throw new Error('Complete phone verification with the Firebase SMS confirmation first.');
  },

  async resetPassword(email) {
    return fetchWithAuth('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email: String(email || '').trim() }),
    });
  },

  async getMe() {
    const response = await fetchWithAuth('/api/auth/me');
    const value = response.user || response.data || {};
    if (!['client', 'artisan', 'admin'].includes(value.role)) {
      throw new Error('Account setup is incomplete.');
    }
    return persistUser(value);
  },

  async logout() {
    await signOut(auth);
  },
};
