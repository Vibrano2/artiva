import { AuthService } from './authService';
import { ArtisanService } from './artisanService';
import { JobService } from './jobService';
import { PaymentService } from './paymentService';
import { AdminService } from './adminService';

export * from './apiConfig';
export * from './authService';
export * from './artisanService';
export * from './jobService';
export * from './paymentService';
export * from './adminService';
export * from './constants';

export const ALL_TRADES = [
  'Plumber', 'Electrician', 'Carpenter', 'AC Technician',
  'Painter', 'Mason', 'Welder', 'Cleaner', 'Generator Mechanic'
];

export const TARGET_LOCATIONS = [
  'Lekki Phase 1', 'VGC', 'Ikota Villa', 'Chevron Drive',
  'Maitama (Abuja)', 'Wuse 2 (Abuja)', 'Asokoro (Abuja)', 'Gwarinpa (Abuja)'
];

export const ApiService = {
  ...AuthService,
  ...ArtisanService,
  ...JobService,
  ...PaymentService,
  ...AdminService,
  init: () => {},
};

