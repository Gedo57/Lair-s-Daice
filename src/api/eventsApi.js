import { API_ENDPOINTS } from '../config/apiConfig.js';
import { apiRequest } from './client.js';

export const getSpecialEvents = () => apiRequest(API_ENDPOINTS.events.list);
export const getEventMissions = () => apiRequest(API_ENDPOINTS.events.missions);

export const playSpecialEvent = (eventId) => apiRequest(API_ENDPOINTS.events.play(eventId), {
  method: 'POST',
});
