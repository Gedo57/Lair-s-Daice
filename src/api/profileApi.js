import { API_ENDPOINTS } from '../config/apiConfig.js';
import { apiRequest } from './client.js';

export const getProfile = () => apiRequest(API_ENDPOINTS.profile.me);
export const getWallet = () => apiRequest(API_ENDPOINTS.profile.wallet);

export const updateProfile = (payload) => apiRequest(API_ENDPOINTS.profile.update, { method: 'PATCH', body: payload });
