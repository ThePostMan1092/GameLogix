// Player data model and local database service

export type GameType = 'pingpong' | 'foosball' | 'pool';

export interface Player {
  id: string;
  name: string;
  nickname?: string;
  email?: string;
  leagues?: string[];
  avatarUrl?: string;
}

const STORAGE_KEY = 'corporate-sports-players';
const CURRENT_USER_KEY = 'corporate-sports-current-user';

export function getPlayers(): Player[] {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function savePlayers(players: Player[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
}

export function addPlayer(player: Player) {
  const players = getPlayers();
  players.push(player);
  savePlayers(players);
}

export function updatePlayer(updated: Player) {
  const players = getPlayers().map(p => p.id === updated.id ? updated : p);
  savePlayers(players);
}

export function deletePlayer(id: string) {
  const players = getPlayers().filter(p => p.id !== id);
  savePlayers(players);
}

export function getCurrentUserId(): string | null {
  return localStorage.getItem(CURRENT_USER_KEY);
}

export function setCurrentUserId(id: string) {
  localStorage.setItem(CURRENT_USER_KEY, id);
}

export function getCurrentUser(): Player | null {
  const id = getCurrentUserId();
  if (!id) return null;
  return getPlayers().find(p => p.id === id) || null;
}
