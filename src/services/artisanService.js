import { mockDb } from '../data/mockDatabase';
import { AuthService } from './authService';

export const ArtisanService = {
  /**
   * Register a new artisan locally
   */
  async signupArtisan(data) {
    return AuthService.registerArtisan(data);
  },

  /**
   * Search and filter artisans from local database
   */
  async getArtisans(filter = {}) {
    return mockDb.getArtisans(filter);
  },

  /**
   * Fetch specific artisan profile details
   */
  async getArtisanProfile(uid) {
    return mockDb.getArtisanById(uid);
  },

  /**
   * Get reviews for a specific artisan
   */
  async getArtisanReviews(uid) {
    return [
      {
        id: 'rev_1',
        reviewer_name: 'Mrs. Amaka',
        rating: 5,
        comment: 'Fixed our leaking kitchen pipes in less than 30 minutes! Very neat and professional.',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString()
      },
      {
        id: 'rev_2',
        reviewer_name: 'Dr. Chidi',
        rating: 5,
        comment: 'Great craftsmanship and honest pricing. Highly recommended in Life Camp.',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString()
      }
    ];
  },

  /**
   * Auto-match artisans for a job based on trade
   */
  async matchArtisans(jobId) {
    const job = mockDb.getJobById(jobId);
    const trade = job?.trade || 'Plumbing';
    const matches = mockDb.getArtisans({ trade, available: true });

    return {
      success: true,
      data: {
        matches: (matches.length > 0 ? matches : mockDb.getArtisans()).map((artisan, index) => ({
          match_id: `match_${jobId || 'job'}_${artisan.uid}`,
          artisan: {
            uid: artisan.uid,
            id: artisan.uid,
            first_name: artisan.first_name,
            last_name: artisan.last_name,
            trade: artisan.trade,
            reputation_score: artisan.reputation_score || 4.9,
            completed_jobs: artisan.completed_jobs || 30,
            location: artisan.location,
            work_photos: artisan.work_photos,
            verified: artisan.verified || artisan.is_verified,
            match_fee: 500
          }
        })),
        count: matches.length
      }
    };
  },

  /**
   * Update current artisan profile
   */
  async updateMyProfile(updateData) {
    const user = AuthService.getCurrentUser();
    if (user?.uid) {
      return mockDb.updateArtisan(user.uid, updateData);
    }
    return updateData;
  },

  /**
   * Update artisan availability status
   */
  async updateAvailability(uid, available) {
    return mockDb.updateArtisan(uid, { available, is_available: available });
  },

  /**
   * Upload artisan profile photo
   */
  async uploadProfilePhoto(uid, file) {
    return {
      success: true,
      url: typeof file === 'string' ? file : 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=600&q=80'
    };
  },

  /**
   * Upload artisan ID document & NIN
   */
  async uploadIdDocument(uid, nin, file) {
    mockDb.updateArtisan(uid, { nin });
    return {
      success: true,
      message: 'ID document uploaded successfully'
    };
  },

  /**
   * Fetch artisan dashboard metrics
   */
  async getArtisanDashboard(uid) {
    const artisan = mockDb.getArtisanById(uid);
    return {
      held_total: 15000,
      released_total: 85000,
      completed_jobs: artisan?.completed_jobs || 34,
      reputation_score: artisan?.reputation_score || 4.9,
      is_verified: artisan?.is_verified ?? true
    };
  }
};
