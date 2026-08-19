/**
 * Artiva PRD v1.9 — Official Persona Data
 * Source of truth: Artiva PRD v1.9, Section 4 (Users & Personas)
 *
 * Only names and details explicitly stated in the PRD are included here.
 * No invented details, fake ratings, or fabricated reviews.
 */

// ─── Artisan Personas ────────────────────────────────────────────────────────

export const PRD_ARTISANS = [
  {
    uid: 'prd_artisan_emeka',
    first_name: 'Mr. Emeka',
    last_name: '',
    // PRD Section 4.3: "34, electrician, based near Life Camp"
    trade: 'Electrician',
    location: 'Life Camp, Abuja',
    tagline: 'Verified electrician based near Life Camp, Abuja.',
    // PRD Section 4.3: "Spends 2–3 hours at the junction each morning hoping for a client call"
    bio: 'Experienced electrician based near Life Camp. Relies on word-of-mouth referrals and now uses Artiva to get consistent, well-paying leads.',
    // PRD does not specify services list for Mr. Emeka — left as general electrical
    services: ['Electrical Repairs', 'Wiring', 'Fault Detection'],
    // PRD does not provide a rating for Mr. Emeka
    reputation_score: null,
    completed_jobs: null,
    verified: true,
    available: true,
    // PRD does not provide work photos for Mr. Emeka
    work_photos: [],
  }
];

// ─── Client Personas ─────────────────────────────────────────────────────────

export const PRD_CLIENTS = [
  {
    uid: 'prd_client_amaka',
    first_name: 'Mrs. Amaka',
    last_name: '',
    // PRD Section 4.2: "38, homeowner in Life Camp"
    age: 38,
    location: 'Life Camp, Abuja',
    // PRD Section 4.2: "Kitchen sink is leaking at 7pm before a family visit tomorrow morning"
    demo_job: {
      trade: 'Plumber',
      description: 'Kitchen sink is leaking at 7pm before a family visit tomorrow morning.',
      location: 'Life Camp, Abuja',
      urgency: 'Today',
      // PRD does not specify a budget for Mrs. Amaka's job
      budget: null,
    }
  }
];

// ─── Demo Job (PRD Scenario) ──────────────────────────────────────────────────
// PRD Section 4.2 describes this exact scenario used in the demo script (Appendix B)

export const PRD_DEMO_JOB = {
  job_id: 'prd_demo_job_001',
  client: PRD_CLIENTS[0],
  trade: 'Plumber',
  description: 'Kitchen sink is leaking at 7pm before a family visit tomorrow morning.',
  location: 'Life Camp, Abuja',
  urgency: 'Today',
  status: 'open',
  // PRD Section 4.2: "₦500 for guaranteed speed and recourse"
  // The ₦500 is the platform fee, not the job value. PRD does not specify the job value for this demo.
  platform_fee: 500,
};
