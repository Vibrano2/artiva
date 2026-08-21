import { RecaptchaVerifier } from 'firebase/auth';
import { auth } from '../config/firebase';

/**
 * Normalizes any Nigerian phone number input to strict E.164 international format (+234XXXXXXXXXX).
 * 
 * Handles:
 * - 08031234567 -> +2348031234567
 * - 8031234567  -> +2348031234567
 * - +2348031234567 -> +2348031234567
 * - 2348031234567 -> +2348031234567
 * - 070, 080, 081, 090, 091 prefixes
 */
export function formatNigerianPhoneNumber(rawPhone) {
  if (!rawPhone) {
    return { formatted: '', isValid: false, cleanDigits: '' };
  }

  // Strip all non-digit characters except leading +
  let cleaned = rawPhone.toString().trim().replace(/[^\d+]/g, '');

  if (cleaned.startsWith('+234')) {
    cleaned = cleaned.substring(4);
  } else if (cleaned.startsWith('234')) {
    cleaned = cleaned.substring(3);
  }

  // Remove leading 0 if present (e.g. 0803... -> 803...)
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  // Valid Nigerian local phone numbers have 10 digits after removing leading 0 / +234
  const isValid = /^[789][01]\d{8}$/.test(cleaned);
  const formatted = `+234${cleaned}`;

  return {
    formatted,
    isValid,
    cleanDigits: cleaned
  };
}

/**
 * Clears and re-creates a clean Firebase RecaptchaVerifier instance.
 * Prevents "auth/invalid-app-credential" caused by duplicate, unmounted, or corrupted verifier state.
 */
export function getOrCreateRecaptchaVerifier(containerId = 'recaptcha-container', onExpired = null) {
  if (typeof window === 'undefined') return null;

  // Clear existing verifier if present
  if (window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier.clear();
    } catch (e) {
      console.warn('[RecaptchaVerifier] Clear warning:', e);
    }
    window.recaptchaVerifier = null;
  }

  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`[RecaptchaVerifier] Container element #${containerId} not found in DOM.`);
    throw new Error(`Security verification container (#${containerId}) is missing.`);
  }

  window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved
    },
    'expired-callback': () => {
      console.warn('[RecaptchaVerifier] reCAPTCHA session expired');
      if (typeof onExpired === 'function') onExpired();
    }
  });

  return window.recaptchaVerifier;
}

/**
 * Formats Firebase authentication errors into clear, actionable messages for end users
 * while logging structured diagnostics for developers.
 */
export function formatAuthError(error) {
  if (!error) return 'An unexpected error occurred. Please try again.';

  const code = error.code || '';
  const message = error.message || '';

  // Log full diagnostic in development
  console.error('[FirebaseAuth Diagnostic]', {
    code,
    message,
    name: error.name,
    rawError: error
  });

  switch (code) {
    case 'auth/invalid-app-credential':
    case 'auth/missing-app-credential':
    case 'auth/app-not-authorized':
      return 'Authentication verification failed. Please ensure your domain is added to Firebase Authorized Domains or that test phone numbers are used during development.';

    case 'auth/invalid-verification-code':
    case 'auth/invalid-otp':
      return 'The verification code you entered is invalid. Please check the 6-digit code and try again.';

    case 'auth/code-expired':
      return 'This verification code has expired. Please request a new OTP.';

    case 'auth/invalid-phone-number':
      return 'Please enter a valid Nigerian mobile phone number (e.g. 0803 123 4567).';

    case 'auth/captcha-check-failed':
      return 'Security verification check failed. Please refresh the page and try again.';

    case 'auth/quota-exceeded':
    case 'auth/too-many-requests':
      return 'Too many SMS requests sent. Please wait a few minutes before trying again or use a configured test phone number.';

    case 'auth/popup-closed-by-user':
      return 'Sign-in window was closed before completion. Please try again.';

    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked by the browser. Please allow popups for this site and retry.';

    case 'auth/unauthorized-domain':
      return 'This domain is not authorized in Firebase Authentication settings. Add localhost/127.0.0.1 in the Firebase Console.';

    case 'auth/operation-not-allowed':
      return 'This sign-in provider is not enabled in Firebase Authentication console.';

    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with the same email using a different sign-in method.';

    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact platform support.';

    case 'auth/network-request-failed':
      return 'Network connection error. Please check your internet connectivity and try again.';

    default: {
      // Strip generic Firebase internal prefixes
      const clean = message
        .replace(/^Firebase:\s*/i, '')
        .replace(/\s*\(auth\/[a-z0-9-]+\)\.?$/i, '')
        .trim();
      return clean || 'Authentication failed. Please try again.';
    }
  }
}
