/**
 * Artiva Standalone Client-Side Mock Database
 * Provides persistent local state for Artisans, Jobs, Chat, Proformas, Escrow, and Admin operations
 * without requiring any external backend API connection.
 */

const STORAGE_KEYS = {
  ARTISANS: 'artiva_mock_artisans',
  JOBS: 'artiva_mock_jobs',
  PROFORMAS: 'artiva_mock_proformas',
  MESSAGES: 'artiva_mock_messages',
  TRANSACTIONS: 'artiva_mock_transactions',
  ADMIN_QUEUE: 'artiva_mock_admin_queue',
  CURRENT_USER: 'artiva_current_user',
};

// Initial Seed Artisans based on Artiva PRD v1.9 & Life Camp location
const INITIAL_ARTISANS = [
  {
    uid: 'art_emeka_01',
    id: 'art_emeka_01',
    first_name: 'Mr. Emeka',
    last_name: 'Okonkwo',
    trade: 'Electrician',
    location: 'Life Camp, Abuja',
    tagline: 'Master Electrician in Life Camp & Gwarinpa',
    bio: 'Over 8 years experience in commercial & domestic wiring, fault detection, inverter setups, and electrical repairs.',
    skills: ['Wiring', 'Fault Detection', 'Inverter Setup', 'Meter Installation'],
    services: ['Wiring', 'Fault Detection', 'Inverter Setup', 'Meter Installation'],
    hourly_rate: 5000,
    experience_years: 8,
    reputation_score: 4.9,
    completed_jobs: 42,
    is_verified: true,
    verified: true,
    available: true,
    is_available: true,
    match_fee: 500,
    nin: '12345678901',
    work_photos: [
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=600&q=80'
    ]
  },
  {
    uid: 'art_sunday_02',
    id: 'art_sunday_02',
    first_name: 'Sunday',
    last_name: 'Okafor',
    trade: 'Plumbing',
    location: 'Life Camp, Abuja',
    tagline: 'Expert Plumber • Burst Pipes, Water Heaters, Drain Unclogging',
    bio: 'Fast-response certified plumber serving Life Camp, Jabi, and Kado estates. Available 24/7 for emergency repairs.',
    skills: ['Leak Repair', 'Pipe Fitting', 'Water Heaters', 'Drain Cleaning'],
    services: ['Leak Repair', 'Pipe Fitting', 'Water Heaters', 'Drain Cleaning'],
    hourly_rate: 4500,
    experience_years: 6,
    reputation_score: 4.8,
    completed_jobs: 38,
    is_verified: true,
    verified: true,
    available: true,
    is_available: true,
    match_fee: 500,
    nin: '23456789012',
    work_photos: [
      'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80'
    ]
  },
  {
    uid: 'art_ibrahim_03',
    id: 'art_ibrahim_03',
    first_name: 'Ibrahim',
    last_name: 'Musa',
    trade: 'AC Repair',
    location: 'Life Camp, Abuja',
    tagline: 'Cooling & HVAC Specialist • Fast Gas Refill & Servicing',
    bio: 'Professional AC technician specialized in split units, inverter ACs, gas refilling, PCB repairs, and duct maintenance.',
    skills: ['AC Servicing', 'Gas Refilling', 'PCB Board Repair', 'Compressor Replacement'],
    services: ['AC Servicing', 'Gas Refilling', 'PCB Board Repair', 'Compressor Replacement'],
    hourly_rate: 6000,
    experience_years: 7,
    reputation_score: 4.9,
    completed_jobs: 54,
    is_verified: true,
    verified: true,
    available: true,
    is_available: true,
    match_fee: 500,
    nin: '34567890123',
    work_photos: [
      'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=600&q=80'
    ]
  },
  {
    uid: 'art_blessing_04',
    id: 'art_blessing_04',
    first_name: 'Blessing',
    last_name: 'Adebayo',
    trade: 'Carpentry',
    location: 'Life Camp, Abuja',
    tagline: 'Custom Furniture, Roof Trusses & Lock Fittings',
    bio: 'Artisan carpenter with 10 years experience creating bespoke kitchen cabinets, wardrobe fittings, and door lock installations.',
    skills: ['Cabinet Repair', 'Door Lock Fitting', 'Roof Trusses', 'Wood Polishing'],
    services: ['Cabinet Repair', 'Door Lock Fitting', 'Roof Trusses', 'Wood Polishing'],
    hourly_rate: 5500,
    experience_years: 10,
    reputation_score: 4.7,
    completed_jobs: 29,
    is_verified: true,
    verified: true,
    available: true,
    is_available: true,
    match_fee: 500,
    nin: '45678901234',
    work_photos: [
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80'
    ]
  },
  {
    uid: 'art_tunde_05',
    id: 'art_tunde_05',
    first_name: 'Tunde',
    last_name: 'Bakare',
    trade: 'Generators',
    location: 'Life Camp, Abuja',
    tagline: 'Diesel & Petrol Gen Mechanic • Mikano, Kipor, Tiger, Firman',
    bio: 'Heavy equipment & domestic generator specialist. Servicing, rewiring, carburetor tuning, and diesel injection maintenance.',
    skills: ['Engine Servicing', 'Oil Change & Tuning', 'Carburetor Overhaul', 'Starter Motor Repair'],
    services: ['Engine Servicing', 'Oil Change & Tuning', 'Carburetor Overhaul', 'Starter Motor Repair'],
    hourly_rate: 5000,
    experience_years: 9,
    reputation_score: 4.8,
    completed_jobs: 47,
    is_verified: true,
    verified: true,
    available: true,
    is_available: true,
    match_fee: 500,
    nin: '56789012345',
    work_photos: [
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80'
    ]
  },
  {
    uid: 'art_chidi_06',
    id: 'art_chidi_06',
    first_name: 'Chidi',
    last_name: 'Nnamdi',
    trade: 'Painting',
    location: 'Life Camp, Abuja',
    tagline: 'Interior & Exterior House Screeding & Painting',
    bio: 'Flawless wall finishes, POP screeding, waterproofing, and satin/matte painting for apartments and duplexes.',
    skills: ['Wall Screeding', 'Interior Painting', 'Exterior Painting', 'Waterproofing'],
    services: ['Wall Screeding', 'Interior Painting', 'Exterior Painting', 'Waterproofing'],
    hourly_rate: 4000,
    experience_years: 5,
    reputation_score: 4.6,
    completed_jobs: 21,
    is_verified: true,
    verified: true,
    available: true,
    is_available: true,
    match_fee: 500,
    nin: '67890123456',
    work_photos: [
      'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80'
    ]
  }
];

const INITIAL_ADMIN_QUEUE = [
  {
    uid: 'pending_art_01',
    id: 'pending_art_01',
    first_name: 'Kelechi',
    last_name: 'Nwosu',
    trade: 'Plumbing',
    location: 'Life Camp, Abuja',
    nin: '78901234567',
    experience_years: 4,
    hourly_rate: 4000,
    status: 'pending_review',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    id_photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80'
  },
  {
    uid: 'pending_art_02',
    id: 'pending_art_02',
    first_name: 'Aisha',
    last_name: 'Mohammed',
    trade: 'Tilers',
    location: 'Life Camp, Abuja',
    nin: '89012345678',
    experience_years: 6,
    hourly_rate: 5000,
    status: 'pending_review',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    id_photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80'
  }
];

const INITIAL_PROFORMAS = [
  {
    id: 'prof_001',
    job_id: 'job_sample_01',
    artisan_id: 'art_sunday_02',
    supplier_name: 'Life Camp Hardware & Pipes Mart',
    materials_cost: 25000,
    labor_cost: 10000,
    total_amount: 35000,
    items: [
      { name: 'PPR High-Pressure Pipes (3 pcs)', quantity: 3, unit_price: 5000, total: 15000 },
      { name: 'Brass Gate Valves (2 pcs)', quantity: 2, unit_price: 5000, total: 10000 }
    ],
    receipt_url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
    status: 'pending',
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString()
  }
];

// In-memory subscribers for real-time reactive events (Chat & GPS tracking)
const listeners = {
  chat: new Map(),
  tracking: new Map()
};

class MockDatabase {
  constructor() {
    this.init();
  }

  init() {
    if (!localStorage.getItem(STORAGE_KEYS.ARTISANS)) {
      localStorage.setItem(STORAGE_KEYS.ARTISANS, JSON.stringify(INITIAL_ARTISANS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ADMIN_QUEUE)) {
      localStorage.setItem(STORAGE_KEYS.ADMIN_QUEUE, JSON.stringify(INITIAL_ADMIN_QUEUE));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PROFORMAS)) {
      localStorage.setItem(STORAGE_KEYS.PROFORMAS, JSON.stringify(INITIAL_PROFORMAS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.JOBS)) {
      localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.MESSAGES)) {
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify({}));
    }
  }

  // --- Artisans ---
  getArtisans(filter = {}) {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.ARTISANS) || '[]');
    return list.filter(artisan => {
      if (filter.trade && filter.trade !== 'All') {
        const tradeMatch = artisan.trade.toLowerCase() === filter.trade.toLowerCase() ||
          artisan.trade.toLowerCase().includes(filter.trade.toLowerCase()) ||
          filter.trade.toLowerCase().includes(artisan.trade.toLowerCase());
        if (!tradeMatch) return false;
      }
      if (filter.location && filter.location !== 'All') {
        if (!artisan.location.toLowerCase().includes(filter.location.toLowerCase())) {
          return false;
        }
      }
      if (filter.available !== undefined && filter.available !== null) {
        if (artisan.available !== filter.available && artisan.is_available !== filter.available) {
          return false;
        }
      }
      return true;
    });
  }

  getArtisanById(uid) {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.ARTISANS) || '[]');
    return list.find(a => a.uid === uid || a.id === uid) || list[0];
  }

  saveArtisan(artisanData) {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.ARTISANS) || '[]');
    const uid = artisanData.uid || artisanData.id || `art_${Date.now()}`;
    const newArtisan = {
      ...artisanData,
      uid,
      id: uid,
      is_verified: artisanData.is_verified || false,
      reputation_score: artisanData.reputation_score || 5.0,
      completed_jobs: artisanData.completed_jobs || 0,
      available: true,
      is_available: true,
      created_at: new Date().toISOString()
    };

    const index = list.findIndex(a => a.uid === uid);
    if (index >= 0) {
      list[index] = { ...list[index], ...newArtisan };
    } else {
      list.unshift(newArtisan);
    }
    localStorage.setItem(STORAGE_KEYS.ARTISANS, JSON.stringify(list));
    return newArtisan;
  }

  updateArtisan(uid, updates) {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.ARTISANS) || '[]');
    const index = list.findIndex(a => a.uid === uid || a.id === uid);
    if (index >= 0) {
      list[index] = { ...list[index], ...updates };
      localStorage.setItem(STORAGE_KEYS.ARTISANS, JSON.stringify(list));
      return list[index];
    }
    return null;
  }

  // --- Jobs ---
  getJobs(filters = {}) {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.JOBS) || '[]');
    return list.filter(job => {
      if (filters.status && job.status !== filters.status) return false;
      if (filters.trade && job.trade !== filters.trade) return false;
      return true;
    });
  }

  getJobById(id) {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.JOBS) || '[]');
    return list.find(j => j.job_id === id || j.id === id) || null;
  }

  createJob(jobData) {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.JOBS) || '[]');
    const jobId = `job_${Date.now()}`;
    const newJob = {
      id: jobId,
      job_id: jobId,
      ...jobData,
      status: 'open',
      created_at: new Date().toISOString()
    };
    list.unshift(newJob);
    localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(list));
    localStorage.setItem('artiva_jobs', JSON.stringify(list));
    return newJob;
  }

  updateJob(jobId, updates) {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.JOBS) || '[]');
    const index = list.findIndex(j => j.job_id === jobId || j.id === jobId);
    if (index >= 0) {
      list[index] = { ...list[index], ...updates };
      localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(list));
      localStorage.setItem('artiva_jobs', JSON.stringify(list));
      return list[index];
    }
    return null;
  }

  // --- Proformas ---
  getProformas(jobId) {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFORMAS) || '[]');
    if (jobId) {
      return list.filter(p => p.job_id === jobId);
    }
    return list;
  }

  createProforma(data) {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFORMAS) || '[]');
    const id = `prof_${Date.now()}`;
    const newProf = {
      id,
      ...data,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    list.unshift(newProf);
    localStorage.setItem(STORAGE_KEYS.PROFORMAS, JSON.stringify(list));
    return newProf;
  }

  updateProformaStatus(id, status, notes = '') {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFORMAS) || '[]');
    const index = list.findIndex(p => p.id === id);
    if (index >= 0) {
      list[index] = { ...list[index], status, notes };
      localStorage.setItem(STORAGE_KEYS.PROFORMAS, JSON.stringify(list));
      return list[index];
    }
    return null;
  }

  // --- Messages & Chat ---
  getMessages(matchId) {
    const map = JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES) || '{}');
    return map[matchId] || [
      {
        id: 'msg_welcome',
        sender_uid: 'artisan',
        content: 'Hello! I have received your request and I am reviewing the details.',
        text: 'Hello! I have received your request and I am reviewing the details.',
        created_at: new Date().toISOString()
      }
    ];
  }

  addMessage(matchId, content, senderUid) {
    const map = JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES) || '{}');
    const list = map[matchId] || [];
    const newMsg = {
      id: `msg_${Date.now()}`,
      sender_uid: senderUid || 'user_demo_client',
      content,
      text: content,
      created_at: new Date().toISOString()
    };
    list.push(newMsg);
    map[matchId] = list;
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(map));

    // Notify listeners
    if (listeners.chat.has(matchId)) {
      listeners.chat.get(matchId)(list);
    }
    return newMsg;
  }

  subscribeChat(matchId, callback) {
    listeners.chat.set(matchId, callback);
    callback(this.getMessages(matchId));
    return () => {
      listeners.chat.delete(matchId);
    };
  }

  // --- Admin Queue ---
  getAdminQueue() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ADMIN_QUEUE) || '[]');
  }

  verifyArtisanInQueue(uid, verified = true, reason = '') {
    const queue = JSON.parse(localStorage.getItem(STORAGE_KEYS.ADMIN_QUEUE) || '[]');
    const index = queue.findIndex(a => a.uid === uid || a.id === uid);
    let item = null;
    if (index >= 0) {
      item = queue.splice(index, 1)[0];
      localStorage.setItem(STORAGE_KEYS.ADMIN_QUEUE, JSON.stringify(queue));
    }

    if (verified && item) {
      this.saveArtisan({
        ...item,
        is_verified: true,
        verified: true
      });
    }
    return { success: true, verified, reason };
  }
}

export const mockDb = new MockDatabase();
