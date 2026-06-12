import { API_ENDPOINTS } from '../config/apiConfig.js';
import { apiRequest } from './client.js';

export const getMatchState = () => apiRequest(API_ENDPOINTS.match.state);

export const submitMatchAction = (action) => apiRequest(API_ENDPOINTS.match.action, {
  method: 'POST',
  body: action,
});

export const getMatchResult = () => apiRequest(API_ENDPOINTS.match.result);
