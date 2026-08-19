export const TRADE_CATEGORIES = {
  HOME_MAINTENANCE_REPAIR: [
    'Electricians',
    'Plumbers',
    'Carpenters',
    'AC technicians',
    'Generator repairers',
    'Borehole repair technicians',
    'Welders',
    'Tilers',
    'PoP',
    'Aluminium fabricators'
  ],
  VEHICLE: [
    'Mechanics'
  ],
  HOME_SERVICES: [
    'Home cleaners',
    'Laundry services',
    'Movers',
    'Gardeners',
    'CCTV installers'
  ],
  PERSONAL_CARE: [
    'Barbers',
    'Hairdressers',
    'Makeup artists',
    'Tailors'
  ],
  PROFESSIONAL_CARE: [
    'Tutors',
    'Nurses',
    'Caregivers'
  ],
  EVENTS: [
    'Event photographers',
    'Painters'
  ]
};

export const ALL_TRADES = [
  ...TRADE_CATEGORIES.HOME_MAINTENANCE_REPAIR,
  ...TRADE_CATEGORIES.VEHICLE,
  ...TRADE_CATEGORIES.HOME_SERVICES,
  ...TRADE_CATEGORIES.PERSONAL_CARE,
  ...TRADE_CATEGORIES.PROFESSIONAL_CARE,
  ...TRADE_CATEGORIES.EVENTS
];

export const TARGET_LOCATIONS = [
  'Life Camp (Abuja)'
];

export const TradeServicesMap = {
  'Plumbing': ['Leak Repair', 'Pipe Installation'],
  'Electrical': ['Inverter & Solar Setup', 'Meter Installation'],
  'Carpentry': ['Cabinet Repair', 'Door Lock Fitting'],
  'AC Repair': ['Gas Refilling', 'AC Cleaning & Servicing'],
  'Painting': ['Wall Screeding', 'Interior Painting'],
  'Generators': ['Engine Servicing', 'Oil Change & Tuning']
};

export const LifeCampLocations = [
  'Life Camp'
];
