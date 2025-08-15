import { Timestamp } from 'firebase/firestore';

export interface Match {
  id: string;
  leagueId: string; // Optional, if matches can belong to leagues
  sportId: string;
  createdAt: Timestamp;
  status: 'completed' | 'upcoming' | 'active' | 'cancelled' | 'review';
  gameEvent: 'simpleMatch' | 'tournament';
  gameStats: GameStats; // For complex games with rounds/stats
}

export interface GameStats {
  gameId: string;
  sportId: string;
  date: Timestamp;
  teams: Team[];
  rounds?: Round[];
  playerStats?: { [playerId: string]: PlayerMatchStats };
  finishingResults: string[]; // team IDs in finishing order
  totalScore: { team1: number; team2: number };
  status: 'completed' | 'pending' | 'cancelled';
}

export interface Team {
  teamId: string;
  name: string;
  playerIds: string[];
  totalScore: number;
  roundsWon: number;
}

export interface Round {
  roundId: string;
  roundNumber: number;
  teamScores: { [teamId: string]: number };
  playerStats?: PlayerRoundStats[];
  winnerId?: string;
}

export interface PlayerRoundStats {
  playerId: string;
  teamId: string;
  stats: { [statName: string]: string | number };
}

export interface PlayerMatchStats {
  playerId: string;
  teamId: string;
  totalStats: { [statName: string]: string | number };
  roundStats: { [roundId: string]: { [statName: string]: string | number } };
}