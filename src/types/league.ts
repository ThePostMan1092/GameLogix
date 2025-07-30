export interface LeagueSettings {
  // Basic Info
  id?: string;
  name: string;
  description?: string;
  competitionLevel: 'casual' | 'competitive' | 'pro';
  adminId: string;
  members: string[];
  createdAt: any; // Firestore Timestamp
  visibility: 'public' | 'private';
  joinType: 'open' | 'invite' | 'approval';
  joinPasscode?: string;
  joinDeadline?: any; // Firestore Timestamp
  maxMembers?: number;
  sports: SportSettings[]; // e.g. ['Ping Pong', 'Foosball']
  maxMatchesPerWeek?: number;
  matchExpirationHours?: number;
  matchVerification: 'manual' | 'automatic' | 'both-confirm';
  matchReporting: 'anyone' | 'admin-only' | 'member-only';
  allowMultipleAdmins?: boolean;
  allowModerators?: boolean;
  allowMemberScoreReporting?: boolean;
  requireBothConfirm?: boolean;
  logoUrl?: string;
  bannerUrl?: string;
  themeColor?: string;
  emoji?: string;
  pinnedMessage?: string;
  rankingSystem: 'elo' | 'winPct' | 'points';
  seasonStart?: any; // Firestore Timestamp
  seasonEnd?: any;   // Firestore Timestamp
  resetStatsEachSeason?: boolean;
  scheduleType: 'auto' | 'open';
  tournamentMode?: 'none' | 'single-elim' | 'double-elim';
  allowSmurfing?: boolean;
  showFullMatchHistory?: boolean;
  anonymousStats?: boolean;
  bannedUsers?: string[];
  allowedDepartments?: string[];
  inboxConvoId: string;
  dmConvoId: string;
  reviewConvoId: string;
}

type SportType = 'Ping Pong' | 'Foosball' | 'Pool' | 'Basketball' | 'Air Hockey' | 'Spikeball' | 'Custom';

interface BaseSportSettings {
  id: string; // unique per sport
  type: SportType;
  displayName: string;
  icon?: string;
}

export interface PingPongSettings extends BaseSportSettings {
  type: 'Ping Pong';
  trackedValue: 'points' | 'sets' | 'winner';
  trackSets: boolean;
  winBy?: number;
  trackIndividualPoints: boolean;
  trackMistakes: boolean;
  maxSets?: number;
  pointsTo?: number;
  serveRotation?: number;
  adjustableSettings: boolean;
}

export interface SpikeballSettings extends BaseSportSettings {
  type: 'Spikeball';
  trackedValue: 'points' | 'winner';
  winBy?: number;
  trackPoints: boolean;
  trackMistakes: boolean;
  pointsTo?: number;
  serveRotation?: number;
  sixFootRule?: boolean;
  adjustableSettings: boolean;
}

export interface CustomSportSettings extends BaseSportSettings {
  type: 'Custom';
  description?: string;
  scoringRules: {
    label: string;
    pointsPerWin?: number;
    maxScore?: number;
    [key: string]: any; // <-- allows arbitrary fields
  };
}

export type SportSettings = PingPongSettings | SpikeballSettings | CustomSportSettings;
