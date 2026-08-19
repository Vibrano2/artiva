import { AuthService } from './authService';
import { ArtisanService } from './artisanService';
import { JobService } from './jobService';
import { PaymentService } from './paymentService';
import { AdminService } from './adminService';
import { ChatService } from './chatService';
import { ProformaService } from './proformaService';

export * from './apiConfig';
export * from './authService';
export * from './artisanService';
export * from './jobService';
export * from './paymentService';
export * from './adminService';
export * from './chatService';
export * from './proformaService';
export * from './constants';

export const ALL_TRADES = [
  'Plumber', 'Electrician', 'Carpenter', 'AC Technician',
  'Painter', 'Mason', 'Welder', 'Cleaner', 'Generator Mechanic'
];

export const TARGET_LOCATIONS = [
  'Life Camp (Abuja)'
];

export const ApiService = {
  ...AuthService,
  ...ArtisanService,
  ...JobService,
  ...PaymentService,
  ...AdminService,
  ...ChatService,
  ...ProformaService,
  init: () => {},
};

