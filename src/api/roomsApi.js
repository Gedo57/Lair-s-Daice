import { API_ENDPOINTS } from '../config/apiConfig.js';
import { apiRequest } from './client.js';

export const getRooms = () => apiRequest(API_ENDPOINTS.rooms.list);

export const createRoom = (settings) => apiRequest(API_ENDPOINTS.rooms.create, {
  method: 'POST',
  body: settings,
});

export const joinRoom = (roomId) => apiRequest(API_ENDPOINTS.rooms.join(roomId), {
  method: 'POST',
});
