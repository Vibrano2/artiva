export function displayLocation(location) {
  if (!location) return '';
  if (typeof location === 'string') return location;
  return [location.address, location.city, location.state].filter(Boolean).join(', ');
}

export function normalizeLocation(location) {
  if (location && typeof location === 'object') {
    return {
      city: String(location.city || '').trim(),
      state: String(location.state || '').trim(),
      lga: String(location.lga || '').trim(),
      ...(location.address ? { address: String(location.address).trim() } : {}),
    };
  }
  const address = String(location || '').trim();
  return {
    address,
    city: 'Abuja',
    state: 'Federal Capital Territory',
    lga: 'Abuja Municipal Area Council',
  };
}

export function normalizeArtisan(raw = {}) {
  const locationDetails = raw.location_details || raw.location || null;
  return {
    ...raw,
    uid: raw.uid || raw.id,
    first_name: raw.first_name || raw.user?.first_name || '',
    last_name: raw.last_name || raw.user?.last_name || '',
    location_details: locationDetails,
    location: displayLocation(locationDetails),
    available: raw.is_available ?? raw.available ?? false,
    is_available: raw.is_available ?? raw.available ?? false,
    verified: raw.is_verified ?? raw.verified ?? false,
    isVerified: raw.is_verified ?? raw.verified ?? false,
    services: Array.isArray(raw.services) ? raw.services : (Array.isArray(raw.skills) ? raw.skills : []),
    skills: Array.isArray(raw.skills) ? raw.skills : (Array.isArray(raw.services) ? raw.services : []),
    work_photos: Array.isArray(raw.work_photos) ? raw.work_photos : [],
  };
}

export function normalizeJob(raw = {}) {
  const locationDetails = raw.location_details || raw.location || null;
  const budget = Number(raw.budget ?? raw.job_value ?? raw.locked_job_value ?? 0);
  return {
    ...raw,
    job_id: raw.job_id || raw.id,
    id: raw.job_id || raw.id,
    trade: raw.trade || raw.trade_needed || '',
    trade_needed: raw.trade_needed || raw.trade || '',
    budget: Number.isFinite(budget) ? budget : 0,
    job_value: Number.isFinite(budget) ? budget : 0,
    location_details: locationDetails,
    location: displayLocation(locationDetails),
    matched_artisan_id: raw.matched_artisan_uid || raw.assigned_artisan_uid || null,
    noResponseDeadline: raw.no_response_timer_expiry || null,
  };
}

export function normalizeProforma(raw = {}) {
  return {
    ...raw,
    id: raw.id,
    job_id: raw.job_id,
    artisan_uid: raw.artisan_uid,
    amount: Number(raw.total_amount || 0),
    materials: Array.isArray(raw.items) ? raw.items : [],
  };
}
