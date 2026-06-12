import { API_ENDPOINTS } from '../config/apiConfig.js';
import { apiRequest, setAccessToken } from './client.js';

export async function loginUser(credentials) {
  const payload = await apiRequest(API_ENDPOINTS.auth.login, {
    method: 'POST',
    body: credentials,
  });
  setAccessToken(payload.accessToken);
  return payload;
}

export async function registerUser(data) {
  return apiRequest(API_ENDPOINTS.auth.register, {
    method: 'POST',
    body: data,
  });
}

export async function refreshToken() {
  const payload = await apiRequest(API_ENDPOINTS.auth.refresh, { method: 'POST' });
  setAccessToken(payload.accessToken);
  return payload;
}

export async function loginAsGuest() {
  const payload = await apiRequest(API_ENDPOINTS.auth.guest, { method: 'POST' });
  setAccessToken(payload.accessToken);
  return payload;
}

export async function logoutUser() {
  const payload = await apiRequest(API_ENDPOINTS.auth.logout, { method: 'POST' });
  setAccessToken(null);
  return payload;
}
