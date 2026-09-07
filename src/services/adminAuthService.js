/**
 * adminAuthService.js
 *
 * Bootstrap first admin, grant/revoke admin claims.
 * Called by admin setup flow (one-time, not from production screens).
 */

import { functions } from '../config/firebase';
import { httpsCallable } from 'firebase/functions';

export const AdminAuthService = {
  /**
   * bootstrapAdmin()
   *
   * Signed-in UID must match the ADMIN_UID Firebase Functions param.
   * Grants admin custom claim. Call once from the admin's browser.
   */
  async bootstrapAdmin() {
    const fn = httpsCallable(functions, 'bootstrapAdmin');
    const res = await fn({});
    return res.data;
  },

  /**
   * setAdminClaim(targetUid, isAdmin)
   *
   * Grant or revoke admin claim on another user.
   * Requires the caller to already have admin claim.
   */
  async setAdminClaim(targetUid, isAdmin = true) {
    const fn = httpsCallable(functions, 'setAdminClaim');
    const res = await fn({ targetUid, isAdmin });
    return res.data;
  },
};
