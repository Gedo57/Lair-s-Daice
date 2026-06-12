import { getFromApi, postToApi } from './api.js';
import { normalizeRoomList, normalizeRoom } from './gameNormalizers.js';

export async function getFeaturedRooms() {
  const response = await getFromApi('/rooms/featured', (mockApi) => mockApi.getFeaturedRooms());
  return normalizeRoomList(response);
}

export async function getRooms() {
  const response = await getFromApi('/rooms', (mockApi) => mockApi.getRooms());
  return normalizeRoomList(response);
}

export async function createRoom(payload) {
  const response = await postToApi('/rooms', payload, (mockApi) => mockApi.createRoom(payload));
  return normalizeRoom(response);
}

export async function joinRoom(roomId) {
  const response = await postToApi(`/rooms/${encodeURIComponent(roomId)}/join`, undefined, (mockApi) => mockApi.joinRoom(roomId));
  return normalizeRoom(response);
}
