/**
 * src/services/index.js
 *
 * Single entry point. All screens import from here via:
 *   import { ApiService, TradeServicesMap, LifeCampLocations, ALL_TRADES, TARGET_LOCATIONS } from '../services';
 */

import { AuthService } from './authService';
import { ArtisanService } from './artisanService';
import { JobService } from './jobService';
import { PaymentService } from './paymentService';
import { AdminService } from './adminService';
import { AdminAuthService } from './adminAuthService';
import { ChatService } from './chatService';
import { ProformaService } from './proformaService';
import { AnalyticsService, NotificationService } from './analyticsService';

export * from './authService';
export * from './artisanService';
export * from './jobService';
export * from './paymentService';
export * from './adminService';
export * from './adminAuthService';
export * from './chatService';
export * from './proformaService';
export * from './analyticsService';
export * from './constants';
export * from './firebaseData';

/**
 * ApiService
 *
 * Flat merge of all service objects. Every screen calls ApiService.xxx().
 * Method resolution order (later entries win on collision):
 *   Auth → Artisan → Job → Payment → Admin → AdminAuth → Chat → Proforma → Analytics → Notifications
 */
export const ApiService = {
  ...AuthService,
  ...ArtisanService,
  ...JobService,
  ...PaymentService,
  ...AdminService,
  ...AdminAuthService,
  ...ChatService,
  ...ProformaService,
  ...AnalyticsService,
  ...NotificationService,
  init: () => {}, // called by AppContext on mount
};

export default ApiService;
