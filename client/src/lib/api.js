const LIVE_API = 'https://smit-hackathon-02-kl52.vercel.app';
const API_BASE = (import.meta.env.VITE_API_URL || LIVE_API).replace(/\/$/, '') + '/api';

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('hcm_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(json?.error?.message || 'Something went wrong');
    error.status = response.status;
    error.code = json?.error?.code;
    error.details = json?.error?.details;
    if (response.status === 401) {
      localStorage.removeItem('hcm_token');
      localStorage.removeItem('hcm_user');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    throw error;
  }

  return json?.data;
}
