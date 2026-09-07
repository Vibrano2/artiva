/**
 * Artiva – Firebase Cloud Functions (v2)
 *
 * All callable functions match the exact shape expected by the frontend
 * services in src/services/*.js which are consumed by the React screens.
 *
 * Collections used:
 *   users            – auth profile (role: client | artisan | admin)
 *   artisanProfiles  – public artisan data
 *   privateArtisans  – NIN, ID doc, bank details (admin-only read)
 *   jobs             – job postings
 *   jobs/{id}/messages – chat sub-collection
 *   jobs/{id}/tracking – GPS sub-collection
 *   proformas        – supplier proforma invoices
 *   payments         – escrow payment records (written only by Functions)
 *   ratings          – job ratings (written by Functions)
 *   notifications    – in-app notifications
 *   analyticsEvents  – event stream
 */

import { getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { HttpsError, onCall, onRequest } from 'firebase-functions/v2/https';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { defineSecret, defineString } from 'firebase-functions/params';
import { createHmac, timingSafeEqual } from 'node:crypto';

if (!getApps().length) initializeApp();

const db = getFirestore();
const paystackSecretKey = defineSecret('PAYSTACK_SECRET_KEY');
const adminUidParam = defineString('ADMIN_UID', { default: '' });

// ─── Auth guards ──────────────────────────────────────────────────────────────

function requireAuth(request) {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in required.');
  return request.auth.uid;
}

function requireAdmin(request) {
  requireAuth(request);
  if (request.auth.token.admin !== true)
    throw new HttpsError('permission-denied', 'Admin access required.');
  return request.auth.uid;
}

// ─── Paystack helper ─────────────────────────────────────────────────────────

async function paystackRequest(path, options = {}) {
  const res = await fetch(`https://api.paystack.co${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${paystackSecretKey.value()}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const body = await res.json();
  if (!res.ok || !body.status)
    throw new HttpsError('internal', body.message || 'Paystack request failed.');
  return body.data;
}

// ─── Shared: mark payment as paid and fund escrow on job ─────────────────────

async function markPaymentPaid(reference, transaction = null) {
  const payRef = db.collection('payments').doc(reference);
  const paySnap = await payRef.get();
  if (!paySnap.exists || paySnap.data().status === 'paid') return;
  const payment = paySnap.data();
  if (transaction && (
    transaction.reference !== reference ||
    transaction.currency !== payment.currency ||
    transaction.amount !== Math.round(Number(payment.amount) * 100)
  )) {
    throw new HttpsError('failed-precondition', 'Payment confirmation did not match the expected transaction.');
  }
  const noResponseDeadline = new Date(Date.now() + 4 * 60 * 60 * 1000);

  await db.runTransaction(async (tx) => {
    const currentPayment = await tx.get(payRef);
    if (!currentPayment.exists || currentPayment.data().status === 'paid') return;
    tx.update(payRef, {
      status: 'paid',
      paidAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    tx.update(db.collection('jobs').doc(payment.jobId), {
      escrowStatus: 'funded',
      paymentReference: reference,
      paymentInitializationReference: FieldValue.delete(),
      noResponseDeadline,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
}

// ─── Shared: recalculate artisan reputation & priority scores ─────────────────

async function recalcReputation(artisanId) {
  const [ratingsSnap, jobsSnap, artisanSnap] = await Promise.all([
    db.collection('ratings').where('artisanId', '==', artisanId).get(),
    db.collection('jobs').where('artisanId', '==', artisanId).where('status', '==', 'completed').get(),
    db.collection('artisanProfiles').doc(artisanId).get(),
  ]);

  if (!artisanSnap.exists) return;
  const artisan = artisanSnap.data();

  const scores = ratingsSnap.docs.map((d) => d.data().score).filter(Number.isFinite);
  const avgRating = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const completedJobs = jobsSnap.size;

  const verificationBonus = artisan.isVerified ? 1.0 : 0.3;
  const responseSpeedScore = artisan.responseSpeedScore ?? 0.5;

  // PRD Section 7.2 priority algorithm
  const priorityScore =
    avgRating * 0.4 +
    (Math.min(completedJobs, 50) / 50) * 0.3 +
    responseSpeedScore * 0.2 +
    verificationBonus * 0.1;

  await db.collection('artisanProfiles').doc(artisanId).update({
    reputation_score: parseFloat(avgRating.toFixed(2)),
    completed_jobs: completedJobs,
    priority_score: parseFloat(priorityScore.toFixed(4)),
    updatedAt: FieldValue.serverTimestamp(),
  });
}

async function finalizeSupplierSettlement(jobId) {
  const jobRef = db.collection('jobs').doc(jobId);
  const jobSnap = await jobRef.get();
  if (!jobSnap.exists || !jobSnap.data().paymentReference) return false;

  const [paymentSnap, proformasSnap] = await Promise.all([
    db.collection('payments').doc(jobSnap.data().paymentReference).get(),
    db.collection('proformas').where('jobId', '==', jobId).get(),
  ]);
  if (!paymentSnap.exists || paymentSnap.data().status !== 'paid') return false;

  const proformas = proformasSnap.docs.map((snap) => snap.data());
  if (proformas.some((proforma) => proforma.payoutStatus !== 'confirmed')) return false;

  const supplierPayoutTotal = proformas.reduce(
    (sum, proforma) => sum + Number(proforma.total_amount || 0),
    0
  );
  const jobValue = Number(paymentSnap.data().jobValue);

  await db.runTransaction(async (tx) => {
    const paymentRef = paymentSnap.ref;
    const currentPayment = await tx.get(paymentRef);
    if (!currentPayment.exists || currentPayment.data().payoutStatus === 'released') return;
    tx.update(paymentRef, {
      payoutStatus: 'released',
      supplierPayoutTotal,
      platformRetained: Math.round((jobValue - supplierPayoutTotal + Number(currentPayment.data().platformFee || 0)) * 100) / 100,
      releasedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    tx.update(jobRef, { escrowStatus: 'released', updatedAt: FieldValue.serverTimestamp() });
  });

  return true;
}

async function claimSupplierPayout(proformaRef) {
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(proformaRef);
    if (!snap.exists) return null;
    const proforma = snap.data();
    if (proforma.payoutStatus !== 'pending') return null;
    if (!proforma.supplierRecipientCode)
      throw new HttpsError('failed-precondition', 'An approved supplier is missing a payout recipient.');

    const payoutReference = `artiva_supplier_${snap.id}`;
    tx.update(proformaRef, {
      payoutStatus: 'processing',
      payoutReference,
      supplierPayoutInitiatedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { ...proforma, payoutReference };
  });
}

async function settleCompletedJob(jobId) {
  const jobRef = db.collection('jobs').doc(jobId);
  const jobSnap = await jobRef.get();
  if (!jobSnap.exists) return { settled: false, reason: 'job_not_found' };

  const job = jobSnap.data();
  if (job.status !== 'completed' || typeof job.rating !== 'number' || !job.paymentReference)
    return { settled: false, reason: 'job_not_ready' };

  const paymentRef = db.collection('payments').doc(job.paymentReference);
  const [paymentSnap, proformasSnap] = await Promise.all([
    paymentRef.get(),
    db.collection('proformas').where('jobId', '==', jobId).get(),
  ]);
  if (!paymentSnap.exists || paymentSnap.data().status !== 'paid')
    return { settled: false, reason: 'payment_not_funded' };

  const proformas = proformasSnap.docs.map((snap) => ({ ref: snap.ref, id: snap.id, ...snap.data() }));
  if (proformas.some((proforma) => proforma.status !== 'approved'))
    return { settled: false, reason: 'proformas_pending_review' };

  const totalSupplierPayout = proformas.reduce((sum, proforma) => sum + Number(proforma.total_amount || 0), 0);
  const jobValue = Number(paymentSnap.data().jobValue);
  if (totalSupplierPayout > jobValue)
    throw new HttpsError('failed-precondition', 'Approved supplier invoices exceed the job value.');

  for (const proforma of proformas) {
    if (['processing', 'confirmed'].includes(proforma.payoutStatus)) continue;
    if (proforma.payoutStatus === 'failed')
      throw new HttpsError('failed-precondition', 'A supplier transfer failed and requires review.');

    const payout = await claimSupplierPayout(proforma.ref);
    if (!payout) continue;

    await paystackRequest('/transfer', {
      method: 'POST',
      body: JSON.stringify({
        source: 'balance',
        amount: Math.round(Number(payout.total_amount) * 100),
        recipient: payout.supplierRecipientCode,
        reference: payout.payoutReference,
        reason: `Artiva supplier payment - job ${jobId}`,
      }),
    });
  }

  const settled = await finalizeSupplierSettlement(jobId);
  return { settled, supplierPayoutTotal: totalSupplierPayout, status: settled ? 'released' : 'awaiting_supplier_confirmation' };
}

// ═════════════════════════════════════════════════════════════════════════════
// PAYMENT FUNCTIONS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * initializePayment
 *
 * Called by: PaystackCheckoutModal → ApiService.initializePayment(jobId, email)
 * Returns:   { authorizationUrl, accessCode, reference, breakdown }
 *
 * Frontend reads:
 *   payment.data.authorization_url  ← transaction.authorizationUrl
 *   payment.data.reference
 */
export const initializePayment = onCall({ secrets: [paystackSecretKey] }, async (req) => {
  const clientId = requireAuth(req);
  const { jobId, email } = req.data || {};

  if (!jobId || typeof jobId !== 'string')
    throw new HttpsError('invalid-argument', 'jobId is required.');
  if (!email || typeof email !== 'string' || !email.includes('@'))
    throw new HttpsError('invalid-argument', 'A valid email is required for the receipt.');

  const jobSnap = await db.collection('jobs').doc(jobId).get();
  if (!jobSnap.exists) throw new HttpsError('not-found', 'Job not found.');
  const job = jobSnap.data();
  if (job.clientId !== clientId)
    throw new HttpsError('permission-denied', 'Only the job owner can pay.');

  const jobValue = Number(job.budget);
  if (!Number.isFinite(jobValue) || jobValue <= 0)
    throw new HttpsError('failed-precondition', 'Job must have a positive budget.');

  const PLATFORM_FEE = 500; // ₦500 match fee (PRD Section 12.1)
  const totalAmount = jobValue + PLATFORM_FEE;
  const reference = `artiva_${jobId}_${Date.now()}`;
  if (job.status !== 'matched' || !job.artisanId || job.escrowStatus !== 'unfunded')
    throw new HttpsError('failed-precondition', 'Select an artisan before paying for this job.');

  const jobRef = db.collection('jobs').doc(jobId);
  await db.runTransaction(async (tx) => {
    const currentJob = await tx.get(jobRef);
    if (!currentJob.exists || currentJob.data().clientId !== clientId)
      throw new HttpsError('permission-denied', 'Only the job owner can pay.');
    const current = currentJob.data();
    if (current.status !== 'matched' || !current.artisanId || current.escrowStatus !== 'unfunded')
      throw new HttpsError('failed-precondition', 'This job is no longer ready for payment.');
    if (current.paymentInitializationReference || current.paymentReference)
      throw new HttpsError('already-exists', 'A payment has already been initialized for this job.');
    tx.update(jobRef, {
      paymentInitializationReference: reference,
      paymentInitializedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  let txn;
  try {
    txn = await paystackRequest('/transaction/initialize', {
      method: 'POST',
      body: JSON.stringify({
        email,
        amount: Math.round(totalAmount * 100), // kobo
        reference,
        currency: 'NGN',
        metadata: {
          jobId,
          clientId,
          artisanId: job.artisanId || null,
          jobValue,
          platformFee: PLATFORM_FEE,
          custom_fields: [
            { display_name: 'Job Value', variable_name: 'job_value', value: `₦${jobValue.toLocaleString()}` },
            { display_name: 'Platform Fee', variable_name: 'platform_fee', value: `₦${PLATFORM_FEE}` },
          ],
        },
      }),
    });

    await db.collection('payments').doc(reference).set({
      reference,
      jobId,
      clientId,
      artisanId: job.artisanId || null,
      jobValue,
      platformFee: PLATFORM_FEE,
      amount: totalAmount,
      currency: 'NGN',
      status: 'pending',
      payoutStatus: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    await db.runTransaction(async (tx) => {
      const currentJob = await tx.get(jobRef);
      if (currentJob.exists && currentJob.data().paymentInitializationReference === reference) {
        tx.update(jobRef, {
          paymentInitializationReference: FieldValue.delete(),
          paymentInitializedAt: FieldValue.delete(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    });
    throw error;
  }

  return {
    reference,
    authorizationUrl: txn.authorization_url,
    accessCode: txn.access_code,
    breakdown: { jobValue, platformFee: PLATFORM_FEE, total: totalAmount },
  };
});

// ═════════════════════════════════════════════════════════════════════════════
// JOB LIFECYCLE FUNCTIONS
// ═════════════════════════════════════════════════════════════════════════════

export const selectArtisan = onCall(async (req) => {
  const clientId = requireAuth(req);
  const { jobId, artisanId } = req.data || {};
  if (!jobId || !artisanId)
    throw new HttpsError('invalid-argument', 'jobId and artisanId are required.');

  const jobRef = db.collection('jobs').doc(jobId);
  const artisanRef = db.collection('artisanProfiles').doc(artisanId);
  const [jobSnap, artisanSnap] = await Promise.all([jobRef.get(), artisanRef.get()]);

  if (!jobSnap.exists) throw new HttpsError('not-found', 'Job not found.');
  if (jobSnap.data().clientId !== clientId)
    throw new HttpsError('permission-denied', 'Only the job owner can select an artisan.');
  if (!artisanSnap.exists || !artisanSnap.data().isVerified || artisanSnap.data().available === false)
    throw new HttpsError('failed-precondition', 'The selected artisan is unavailable.');

  await db.runTransaction(async (tx) => {
    const current = await tx.get(jobRef);
    const job = current.data();
    if (!current.exists || !['open', 'requeued'].includes(job.status) || job.escrowStatus !== 'unfunded')
      throw new HttpsError('failed-precondition', 'This job can no longer be matched.');
    tx.update(jobRef, {
      artisanId,
      status: 'matched',
      matchId: `match_${jobId}_${artisanId}`,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  return { success: true, jobId, artisanId, status: 'matched' };
});

export const acceptJob = onCall(async (req) => {
  const artisanId = requireAuth(req);
  const { jobId } = req.data || {};
  if (!jobId) throw new HttpsError('invalid-argument', 'jobId is required.');

  const jobRef = db.collection('jobs').doc(jobId);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(jobRef);
    if (!snap.exists) throw new HttpsError('not-found', 'Job not found.');
    const job = snap.data();
    if (job.artisanId !== artisanId)
      throw new HttpsError('permission-denied', 'Only the assigned artisan can accept this job.');
    if (job.status !== 'matched' || job.escrowStatus !== 'funded')
      throw new HttpsError('failed-precondition', 'Only a funded offer can be accepted.');
    tx.update(jobRef, {
      status: 'accepted',
      acceptedAt: FieldValue.serverTimestamp(),
      noResponseDeadline: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  return { success: true, jobId, status: 'accepted' };
});

export const updateJobProgress = onCall(async (req) => {
  const artisanId = requireAuth(req);
  const { jobId, status, trackingStatus } = req.data || {};
  if (!jobId || !['in_progress', 'en_route', 'arrived'].includes(status || trackingStatus))
    throw new HttpsError('invalid-argument', 'A valid progress status is required.');

  const jobRef = db.collection('jobs').doc(jobId);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(jobRef);
    if (!snap.exists) throw new HttpsError('not-found', 'Job not found.');
    const job = snap.data();
    if (job.artisanId !== artisanId)
      throw new HttpsError('permission-denied', 'Only the assigned artisan can update progress.');
    if (!['accepted', 'in_progress'].includes(job.status))
      throw new HttpsError('failed-precondition', 'This job cannot be progressed yet.');

    const progress = trackingStatus || status;
    tx.update(jobRef, {
      status: status === 'in_progress' ? 'in_progress' : job.status,
      trackingStatus: progress,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  return { success: true, jobId, status: status === 'in_progress' ? 'in_progress' : trackingStatus };
});

export const completeJob = onCall(async (req) => {
  const clientId = requireAuth(req);
  const { jobId } = req.data || {};
  if (!jobId) throw new HttpsError('invalid-argument', 'jobId is required.');

  const jobRef = db.collection('jobs').doc(jobId);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(jobRef);
    if (!snap.exists) throw new HttpsError('not-found', 'Job not found.');
    const job = snap.data();
    if (job.clientId !== clientId)
      throw new HttpsError('permission-denied', 'Only the job owner can mark it complete.');
    if (!['accepted', 'in_progress'].includes(job.status) || job.escrowStatus !== 'funded')
      throw new HttpsError('failed-precondition', 'Only an accepted, funded job can be completed.');
    tx.update(jobRef, { status: 'completed', completedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
  });

  return { success: true, jobId, status: 'completed' };
});

export const submitRating = onCall({ secrets: [paystackSecretKey] }, async (req) => {
  const clientId = requireAuth(req);
  const { jobId, rating, review = '' } = req.data || {};
  if (!jobId || !Number.isFinite(rating) || rating < 1 || rating > 5)
    throw new HttpsError('invalid-argument', 'A rating from 1 to 5 is required.');
  if (typeof review !== 'string' || review.length > 2000)
    throw new HttpsError('invalid-argument', 'Review must be at most 2,000 characters.');

  const jobRef = db.collection('jobs').doc(jobId);
  await db.runTransaction(async (tx) => {
    const jobSnap = await tx.get(jobRef);
    if (!jobSnap.exists) throw new HttpsError('not-found', 'Job not found.');
    const job = jobSnap.data();
    if (job.clientId !== clientId)
      throw new HttpsError('permission-denied', 'Only the job owner can submit a rating.');
    if (job.status !== 'completed' || !job.artisanId)
      throw new HttpsError('failed-precondition', 'Only a completed job can be rated.');

    const ratingRef = db.collection('ratings').doc(jobId);
    const ratingSnap = await tx.get(ratingRef);
    if (ratingSnap.exists) throw new HttpsError('already-exists', 'A rating already exists for this job.');
    tx.create(ratingRef, {
      jobId,
      artisanId: job.artisanId,
      clientId,
      score: Number(rating),
      review: review.trim(),
      createdAt: FieldValue.serverTimestamp(),
    });
    tx.update(jobRef, { rating: Number(rating), review: review.trim(), ratedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
  });

  const settlement = await settleCompletedJob(jobId);
  return { success: true, jobId, rating: Number(rating), settlement };
});

/**
 * verifyPayment
 *
 * Called by: PaymentService.verifyPayment(reference)
 * Returns:   { status, reference, amount, currency }
 */
export const verifyPayment = onCall({ secrets: [paystackSecretKey] }, async (req) => {
  const clientId = requireAuth(req);
  const { reference } = req.data || {};
  if (!reference) throw new HttpsError('invalid-argument', 'reference is required.');

  const paySnap = await db.collection('payments').doc(reference).get();
  if (!paySnap.exists || paySnap.data().clientId !== clientId)
    throw new HttpsError('not-found', 'Payment not found.');

  const txn = await paystackRequest(`/transaction/verify/${encodeURIComponent(reference)}`);
  const payment = paySnap.data();
  const status = txn.status === 'success' ? 'paid' : txn.status;

  if (status === 'paid') {
    if (txn.reference !== reference || txn.currency !== payment.currency || txn.amount !== Math.round(payment.amount * 100))
      throw new HttpsError('failed-precondition', 'Payment verification did not match the expected transaction.');
    await markPaymentPaid(reference, txn);
  } else {
    await db.collection('payments').doc(reference).update({
      status,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  return { status, reference, amount: payment.amount, currency: payment.currency };
});

/**
 * paystackWebhook  (HTTP, public with HMAC verification)
 *
 * Handles:
 *   charge.success  → markPaymentPaid
 *   transfer.success → confirm payout
 */
export const paystackWebhook = onRequest({ secrets: [paystackSecretKey] }, async (req, res) => {
  if (req.method !== 'POST') { res.status(405).send('Method Not Allowed'); return; }

  const sig = req.get('x-paystack-signature') || '';
  const expected = createHmac('sha512', paystackSecretKey.value())
    .update(req.rawBody)
    .digest('hex');

  const sigBuf = Buffer.from(sig, 'hex');
  const expBuf = Buffer.from(expected, 'hex');
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    res.status(401).send('Invalid signature');
    return;
  }

  const { event, data } = req.body || {};

  if (event === 'charge.success' && data?.reference) {
    await markPaymentPaid(data.reference, data);

    // Log analytics event
    const paySnap = await db.collection('payments').doc(data.reference).get();
    if (paySnap.exists) {
      const p = paySnap.data();
      await db.collection('analyticsEvents').add({
        eventType: 'payment_success',
        userId: p.clientId,
        metadata: { reference: data.reference, jobId: p.jobId, amount: p.amount },
        timestamp: FieldValue.serverTimestamp(),
      });
    }
  }

  if (event === 'transfer.success' && data?.reference) {
    const snap = await db.collection('proformas').where('payoutReference', '==', data.reference).limit(1).get();
    if (!snap.empty) {
      const proforma = snap.docs[0];
      await proforma.ref.update({
        payoutStatus: 'confirmed',
        supplierPaidAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      await finalizeSupplierSettlement(proforma.data().jobId);
    }
  }

  if (event === 'transfer.failed' && data?.reference) {
    const snap = await db.collection('proformas').where('payoutReference', '==', data.reference).limit(1).get();
    if (!snap.empty) {
      await snap.docs[0].ref.update({
        payoutStatus: 'failed',
        payoutFailureReason: data.reason || 'Paystack transfer failed.',
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  }

  res.status(200).send('OK');
});

/**
 * releaseEscrowPayout
 *
 * Compatibility callable for the job owner. Settlement remains gated on a
 * paid, completed, rated job whose proformas have all been approved.
 */
export const releaseEscrowPayout = onCall({ secrets: [paystackSecretKey] }, async (req) => {
  const clientId = requireAuth(req);
  const { jobId } = req.data || {};
  if (!jobId) throw new HttpsError('invalid-argument', 'jobId is required.');

  const jobSnap = await db.collection('jobs').doc(jobId).get();
  if (!jobSnap.exists) throw new HttpsError('not-found', 'Job not found.');
  const job = jobSnap.data();
  if (job.clientId !== clientId)
    throw new HttpsError('permission-denied', 'Only the job owner can request settlement.');

  const settlement = await settleCompletedJob(jobId);
  if (!settlement.settled)
    throw new HttpsError('failed-precondition', 'Job requires completion, rating, and approved proformas before settlement.');
  return { jobId, status: 'RELEASED_TO_SUPPLIERS', ...settlement };
});

/**
 * refundPayment  (admin only)
 *
 * Used by admin "Refund" action and the no-response scheduler.
 */
export const refundPayment = onCall({ secrets: [paystackSecretKey] }, async (req) => {
  requireAdmin(req);
  const { jobId, reason = 'admin_refund' } = req.data || {};
  if (!jobId) throw new HttpsError('invalid-argument', 'jobId is required.');

  const jobSnap = await db.collection('jobs').doc(jobId).get();
  if (!jobSnap.exists) throw new HttpsError('not-found', 'Job not found.');
  const job = jobSnap.data();
  if (!job.paymentReference) throw new HttpsError('failed-precondition', 'No payment on this job.');

  const paySnap = await db.collection('payments').doc(job.paymentReference).get();
  if (!paySnap.exists) throw new HttpsError('not-found', 'Payment record not found.');
  if (paySnap.data().status !== 'paid')
    throw new HttpsError('failed-precondition', 'Only a paid payment can be refunded.');

  const payment = paySnap.data();
  const refund = await paystackRequest('/refund', {
    method: 'POST',
    body: JSON.stringify({
      transaction: payment.reference,
      merchant_note: `Artiva refund: ${reason} – job ${jobId}`,
    }),
  });

  await db.runTransaction(async (tx) => {
    tx.update(paySnap.ref, {
      status: 'refunded',
      refundReason: reason,
      refundedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    tx.update(jobSnap.ref, {
      escrowStatus: 'refunded',
      status: reason === 'no_response' ? 'refunded' : job.status,
      refundReason: reason,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  if (reason === 'no_response' && job.artisanId) {
    await db.collection('artisanProfiles').doc(job.artisanId).update({
      no_response_flags: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });
    await db.collection('notifications').add({
      userId: job.artisanId,
      type: 'no_response_flag',
      message: 'A job was refunded because you sent no message within 4 hours. Your profile has been flagged.',
      jobId,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  await db.collection('notifications').add({
    userId: job.clientId,
    type: 'refund_issued',
    message:
      reason === 'no_response'
        ? 'Your payment was refunded. The artisan did not respond within 4 hours.'
        : `Your payment was refunded. Reason: ${reason}`,
    jobId,
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  });

  return { success: true, jobId, reason, refundStatus: refund.status };
});

/**
 * registerPaystackRecipient
 *
 * Called by: ArtisanDashboard "Add Bank Account" form
 * Verifies NUBAN, creates Paystack recipient, stores code in privateArtisans.
 */
export const registerPaystackRecipient = onCall({ secrets: [paystackSecretKey] }, async (req) => {
  const uid = requireAuth(req);
  const { accountNumber, bankCode, accountName } = req.data || {};

  if (!accountNumber || !bankCode || !accountName)
    throw new HttpsError('invalid-argument', 'accountNumber, bankCode and accountName are required.');
  if (!/^\d{10}$/.test(accountNumber))
    throw new HttpsError('invalid-argument', 'Account number must be 10 digits.');

  const verification = await paystackRequest(
    `/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`
  );

  const recipient = await paystackRequest('/transferrecipient', {
    method: 'POST',
    body: JSON.stringify({
      type: 'nuban',
      name: accountName,
      account_number: accountNumber,
      bank_code: bankCode,
      currency: 'NGN',
      metadata: { artisanId: uid },
    }),
  });

  await db.collection('privateArtisans').doc(uid).set(
    {
      uid,
      paystackRecipientCode: recipient.recipient_code,
      bankAccountNumber: accountNumber,
      bankCode,
      accountName: verification.account_name || accountName,
      bankDetailsVerifiedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return {
    success: true,
    recipientCode: recipient.recipient_code,
    accountName: verification.account_name || accountName,
  };
});

// ═════════════════════════════════════════════════════════════════════════════
// PROFORMA AND SUPPLIER PAYOUT FUNCTIONS
// ═════════════════════════════════════════════════════════════════════════════

export const submitProforma = onCall(async (req) => {
  const artisanId = requireAuth(req);
  const { jobId, supplierName, totalAmount, receiptUrl, items = [], description = '' } = req.data || {};
  const amount = Number(totalAmount);
  if (!jobId || !supplierName || !receiptUrl || !Number.isFinite(amount) || amount <= 0)
    throw new HttpsError('invalid-argument', 'jobId, supplierName, receiptUrl, and a positive totalAmount are required.');
  if (!Array.isArray(items) || typeof description !== 'string' || description.length > 2000)
    throw new HttpsError('invalid-argument', 'Invalid proforma details.');

  const jobSnap = await db.collection('jobs').doc(jobId).get();
  if (!jobSnap.exists) throw new HttpsError('not-found', 'Job not found.');
  const job = jobSnap.data();
  if (job.artisanId !== artisanId)
    throw new HttpsError('permission-denied', 'Only the assigned artisan can submit a proforma.');
  if (!['accepted', 'in_progress'].includes(job.status) || job.escrowStatus !== 'funded')
    throw new HttpsError('failed-precondition', 'A proforma can only be submitted for an accepted, funded job.');

  const ref = await db.collection('proformas').add({
    jobId,
    job_id: jobId,
    artisanId,
    supplier_name: supplierName.trim(),
    total_amount: amount,
    items,
    receipt_url: receiptUrl,
    description: description.trim(),
    status: 'pending',
    payoutStatus: 'pending',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { success: true, id: ref.id, jobId, status: 'pending' };
});

export const approveProforma = onCall({ secrets: [paystackSecretKey] }, async (req) => {
  requireAdmin(req);
  const { proformaId, notes = 'Approved by admin', accountNumber, bankCode, accountName } = req.data || {};
  if (!proformaId || !/^\d{10}$/.test(String(accountNumber || '')) || !bankCode || !accountName)
    throw new HttpsError('invalid-argument', 'Proforma ID and verified supplier bank details are required.');

  const proformaRef = db.collection('proformas').doc(proformaId);
  const proformaSnap = await proformaRef.get();
  if (!proformaSnap.exists) throw new HttpsError('not-found', 'Proforma not found.');
  const proforma = proformaSnap.data();
  if (proforma.status !== 'pending')
    throw new HttpsError('failed-precondition', 'Only pending proformas can be approved.');

  const jobSnap = await db.collection('jobs').doc(proforma.jobId).get();
  if (!jobSnap.exists || !jobSnap.data().paymentReference)
    throw new HttpsError('failed-precondition', 'This job has no funded escrow payment.');
  const paymentSnap = await db.collection('payments').doc(jobSnap.data().paymentReference).get();
  if (!paymentSnap.exists || paymentSnap.data().status !== 'paid')
    throw new HttpsError('failed-precondition', 'A paid escrow payment is required.');

  const verification = await paystackRequest(
    `/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`
  );
  const recipient = await paystackRequest('/transferrecipient', {
    method: 'POST',
    body: JSON.stringify({
      type: 'nuban',
      name: verification.account_name || accountName,
      account_number: accountNumber,
      bank_code: bankCode,
      currency: 'NGN',
      metadata: { proformaId, jobId: proforma.jobId },
    }),
  });

  await db.runTransaction(async (tx) => {
    const [currentProforma, proformas] = await Promise.all([
      tx.get(proformaRef),
      tx.get(db.collection('proformas').where('jobId', '==', proforma.jobId)),
    ]);
    if (!currentProforma.exists || currentProforma.data().status !== 'pending')
      throw new HttpsError('failed-precondition', 'This proforma has already been reviewed.');
    const approvedTotal = proformas.docs
      .filter((snap) => snap.id !== proformaId && snap.data().status === 'approved')
      .reduce((sum, snap) => sum + Number(snap.data().total_amount || 0), 0);
    if (approvedTotal + Number(currentProforma.data().total_amount) > Number(paymentSnap.data().jobValue))
      throw new HttpsError('failed-precondition', 'The supplier payouts cannot exceed the job value.');

    tx.update(proformaRef, {
      status: 'approved',
      notes: String(notes).slice(0, 2000),
      supplierRecipientCode: recipient.recipient_code,
      supplierAccountName: verification.account_name || accountName,
      approvedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  const settlement = await settleCompletedJob(proforma.jobId);
  return { success: true, id: proformaId, status: 'approved', settlement };
});

export const rejectProforma = onCall(async (req) => {
  requireAdmin(req);
  const { proformaId, reason } = req.data || {};
  if (!proformaId || !reason || typeof reason !== 'string' || reason.length > 2000)
    throw new HttpsError('invalid-argument', 'Proforma ID and a rejection reason are required.');

  const ref = db.collection('proformas').doc(proformaId);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new HttpsError('not-found', 'Proforma not found.');
    if (snap.data().status !== 'pending')
      throw new HttpsError('failed-precondition', 'Only pending proformas can be rejected.');
    tx.update(ref, {
      status: 'rejected',
      notes: reason.trim(),
      rejectedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  return { success: true, id: proformaId, status: 'rejected' };
});

// ═════════════════════════════════════════════════════════════════════════════
// ADMIN AUTH FUNCTIONS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * bootstrapAdmin
 *
 * One-time call: signed-in UID must match ADMIN_UID env param.
 * Grants admin custom claim so the user can access admin screens.
 */
export const bootstrapAdmin = onCall(async (req) => {
  const uid = requireAuth(req);
  const envUid = adminUidParam.value();
  if (!envUid) throw new HttpsError('failed-precondition', 'ADMIN_UID not configured.');
  if (uid !== envUid) throw new HttpsError('permission-denied', 'UID does not match ADMIN_UID.');

  await getAuth().setCustomUserClaims(uid, { admin: true });
  await db.collection('users').doc(uid).set(
    { uid, role: 'admin', updatedAt: FieldValue.serverTimestamp() },
    { merge: true }
  );
  return { success: true, uid, admin: true };
});

/**
 * setAdminClaim
 *
 * Grant/revoke admin claim (existing admin only).
 */
export const setAdminClaim = onCall(async (req) => {
  const callerIsAdmin = req.auth?.token?.admin === true;
  const callerIsEnvAdmin = req.auth?.uid && req.auth.uid === adminUidParam.value();
  if (!callerIsAdmin && !callerIsEnvAdmin)
    throw new HttpsError('permission-denied', 'Admin-only action.');

  const { targetUid, isAdmin: grant = true } = req.data || {};
  if (!targetUid) throw new HttpsError('invalid-argument', 'targetUid is required.');

  await getAuth().setCustomUserClaims(targetUid, { admin: Boolean(grant) });
  await db.collection('users').doc(targetUid).update({
    role: grant ? 'admin' : 'client',
    updatedAt: FieldValue.serverTimestamp(),
  });
  return { success: true, targetUid, admin: Boolean(grant) };
});

// ═════════════════════════════════════════════════════════════════════════════
// ANALYTICS
// ═════════════════════════════════════════════════════════════════════════════

const VALID_EVENTS = new Set([
  'job_posted', 'artisan_matched', 'payment_initiated', 'payment_success',
  'message_sent', 'job_completed', 'rating_submitted',
  'artisan_signup_started', 'artisan_signup_completed',
  'match_list_viewed', 'artisan_profile_viewed', 'checkout_opened',
  'no_response_timer_started', 'no_response_refund_triggered',
  'proforma_submitted', 'proforma_approved', 'proforma_rejected',
  'notify_me_tapped', 'availability_toggled',
]);

export const logAnalyticsEvent = onCall(async (req) => {
  const uid = requireAuth(req);
  const { eventType, metadata = {} } = req.data || {};
  if (!eventType || !VALID_EVENTS.has(eventType))
    throw new HttpsError('invalid-argument', `Unknown event: ${eventType}`);

  await db.collection('analyticsEvents').add({
    eventType, userId: uid, metadata,
    timestamp: FieldValue.serverTimestamp(),
  });
  return { success: true };
});

// ═════════════════════════════════════════════════════════════════════════════
// FIRESTORE TRIGGERS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * When a rating is written → recalculate artisan reputation + priority score.
 */
export const onRatingWritten = onDocumentWritten('ratings/{ratingId}', async (event) => {
  const after = event.data?.after?.data();
  if (after?.artisanId) await recalcReputation(after.artisanId);
});

/**
 * When a job status changes to "completed":
 *  - persist rating document (if job has rating field)
 *  - log analytics event
 */
export const onJobStatusChanged = onDocumentWritten('jobs/{jobId}', async (event) => {
  const before = event.data?.before?.data();
  const after = event.data?.after?.data();
  if (!after || before?.status === after.status) return;
  if (after.status !== 'completed' || !after.artisanId) return;

  const jobId = event.params.jobId;

  if (typeof after.rating === 'number') {
    const existing = await db.collection('ratings').where('jobId', '==', jobId).limit(1).get();
    if (existing.empty) {
      await db.collection('ratings').add({
        jobId,
        artisanId: after.artisanId,
        clientId: after.clientId,
        score: after.rating,
        review: after.review || '',
        createdAt: FieldValue.serverTimestamp(),
      });
      // onRatingWritten will recalc reputation automatically
    }
  } else {
    await recalcReputation(after.artisanId);
  }

  await db.collection('analyticsEvents').add({
    eventType: 'job_completed',
    userId: after.clientId,
    metadata: { jobId, artisanId: after.artisanId },
    timestamp: FieldValue.serverTimestamp(),
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// SCHEDULED FUNCTIONS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * checkNoResponseTimers – runs every 5 minutes.
 *
 * Finds funded jobs past their 4-hour deadline where the artisan has not
 * accepted the offer → auto-refund via Paystack.
 * PRD Section 7.3: fires within 5 minutes of expiry.
 */
export const checkNoResponseTimers = onSchedule(
  { schedule: 'every 5 minutes', timeZone: 'Africa/Lagos', secrets: [paystackSecretKey] },
  async () => {
    const now = new Date();
    const snap = await db
      .collection('jobs')
      .where('escrowStatus', '==', 'funded')
      .where('noResponseDeadline', '<=', now)
      .get();

    for (const jobDoc of snap.docs) {
      const job = jobDoc.data();
      if (!job.paymentReference || !job.artisanId) continue;

      const paySnap = await db.collection('payments').doc(job.paymentReference).get();
      if (!paySnap.exists || paySnap.data().status !== 'paid') continue;
      const payment = paySnap.data();

      try {
        const refundRes = await fetch('https://api.paystack.co/refund', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${paystackSecretKey.value()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transaction: payment.reference,
            merchant_note: `Artiva auto-refund: no_response – job ${jobDoc.id}`,
          }),
        }).then((r) => r.json());

        if (!refundRes.status) continue;

        await db.runTransaction(async (tx) => {
          tx.update(paySnap.ref, {
            status: 'refunded',
            refundReason: 'no_response',
            refundedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });
          tx.update(jobDoc.ref, {
            escrowStatus: 'refunded',
            status: 'refunded',
            refundReason: 'no_response',
            noResponseDeadline: FieldValue.delete(),
            updatedAt: FieldValue.serverTimestamp(),
          });
        });

        await db.collection('artisanProfiles').doc(job.artisanId).update({
          no_response_flags: FieldValue.increment(1),
          updatedAt: FieldValue.serverTimestamp(),
        });

        await Promise.all([
          db.collection('notifications').add({
            userId: job.artisanId,
            type: 'no_response_flag',
            message: 'A job was refunded because you sent no message within 4 hours. Your profile has been flagged.',
            jobId: jobDoc.id,
            read: false,
            createdAt: FieldValue.serverTimestamp(),
          }),
          db.collection('notifications').add({
            userId: job.clientId,
            type: 'refund_issued',
            message: 'Your payment was refunded. The artisan did not respond within 4 hours.',
            jobId: jobDoc.id,
            read: false,
            createdAt: FieldValue.serverTimestamp(),
          }),
          db.collection('analyticsEvents').add({
            eventType: 'no_response_refund_triggered',
            userId: job.clientId,
            metadata: { jobId: jobDoc.id, artisanId: job.artisanId },
            timestamp: FieldValue.serverTimestamp(),
          }),
        ]);
      } catch (err) {
        console.error(`No-response refund failed for job ${jobDoc.id}:`, err);
      }
    }
  }
);

/**
 * dailyMaintenance – prunes analyticsEvents older than 90 days.
 */
export const dailyMaintenance = onSchedule(
  { schedule: 'every 24 hours', timeZone: 'Africa/Lagos' },
  async () => {
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const old = await db.collection('analyticsEvents').where('timestamp', '<', cutoff).limit(500).get();
    const batch = db.batch();
    old.docs.forEach((d) => batch.delete(d.ref));
    if (!old.empty) await batch.commit();
  }
);
