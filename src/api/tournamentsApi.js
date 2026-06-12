import { API_ENDPOINTS } from '../config/apiConfig.js';
import { apiRequest } from './client.js';

export const getTournaments = () => apiRequest(API_ENDPOINTS.tournaments.list);
export const getTournamentPass = () => apiRequest(API_ENDPOINTS.tournaments.pass);

export const enterTournament = (tournamentId) => apiRequest(API_ENDPOINTS.tournaments.enter(tournamentId), {
  method: 'POST',
});

export const upgradePass = () => apiRequest(API_ENDPOINTS.tournaments.upgradePass, { method: 'POST' });
