// src/lib/api.js — one place that knows where the API lives and who is signed in
//
// Every page and component should go through this module instead of pasting a
// backend hostname. Tokens are stored per portal: patients and pharmacists have
// separate sessions and separate JWT scopes on the backend.

const FALLBACK_BASE = 'https://medimap-backend-ygqj.onrender.com/api';

export const API_BASE = (import.meta.env.VITE_API_URL || FALLBACK_BASE).replace(/\/+$/, '');

const SESSION_KEYS = {
  patient: { token: 'medimap_token', profile: 'medimap_user' },
  pharmacist: { token: 'pharmacist_token', profile: 'pharmacist_info' },
};

export class ApiError extends Error {
  constructor(message, { status = 0, data = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/** True when the request never reached the server (offline, DNS, timeout). */
export function isNetworkError(error) {
  return error instanceof ApiError && error.status === 0;
}

export function getToken(scope = 'patient') {
  try {
    return localStorage.getItem(SESSION_KEYS[scope]?.token || '') || '';
  } catch {
    return '';
  }
}

export function getProfile(scope = 'patient') {
  try {
    const raw = localStorage.getItem(SESSION_KEYS[scope]?.profile || '');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSession(scope, { token, profile, demo = false }) {
  const keys = SESSION_KEYS[scope];
  if (!keys) return;
  try {
    if (token) localStorage.setItem(keys.token, token);
    if (profile) localStorage.setItem(keys.profile, JSON.stringify(profile));
    if (demo) localStorage.setItem('medimap_demo_session', '1');
    else localStorage.removeItem('medimap_demo_session');
  } catch {
    /* private mode: the session simply won't survive a reload */
  }
}

export function clearSession(scope) {
  const keys = SESSION_KEYS[scope];
  if (!keys) return;
  try {
    localStorage.removeItem(keys.token);
    localStorage.removeItem(keys.profile);
    localStorage.removeItem('medimap_demo_session');
  } catch {
    /* nothing to clear */
  }
}

export function isDemoSession() {
  try {
    return localStorage.getItem('medimap_demo_session') === '1';
  } catch {
    return false;
  }
}

/** Turns a stored `/uploads/x.png` path into an absolute URL on the API host. */
export function apiAssetUrl(path) {
  if (!path || /^https?:\/\//i.test(path) || path.startsWith('data:')) return path || '';
  return `${API_BASE.replace(/\/api$/, '')}${path.startsWith('/') ? '' : '/'}${path}`;
}

/**
 * Calls the API and returns parsed JSON.
 *
 * @param {string} path e.g. '/pharmacist/stock'
 * @param {object} [options]
 * @param {string} [options.method]
 * @param {object|FormData} [options.body] JSON is serialised automatically
 * @param {string} [options.token] bearer token; omit for public routes
 * @param {number} [options.timeout] milliseconds before aborting
 */
export async function api(path, { method = 'GET', body, token, timeout = 10000, headers = {} } = {}) {
  const url = /^https?:\/\//i.test(path) ? path : `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
  const requestHeaders = { Accept: 'application/json', ...headers };
  let payload = body;

  if (body && !(body instanceof FormData)) {
    requestHeaders['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  if (token) requestHeaders.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: payload,
      signal: AbortSignal.timeout(timeout),
    });
  } catch (error) {
    const timedOut = error?.name === 'TimeoutError' || error?.name === 'AbortError';
    throw new ApiError(
      timedOut ? 'The server took too long to respond.' : 'Could not reach the MediMap API.',
      { status: 0 },
    );
  }

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text.slice(0, 200) };
    }
  }

  if (!response.ok) {
    throw new ApiError(data?.error || `Request failed (${response.status})`, {
      status: response.status,
      data,
    });
  }

  return data;
}
