export interface LeagueSettings {
  // Basic Info
  id?: string;
  name: string;
  adminId: string;
  members: string[];
  createdAt: any; // Firestore Timestamp

  // 🔐 Access & Visibility
  visibility: 'public' | 'private';
  joinType: 'open' | 'invite' | 'approval';
  joinPasscode?: string;
  joinDeadline?: any; // Firestore Timestamp
  maxMembers?: number;

  // 🕹️ Gameplay Settings
  sports: string[]; // e.g. ['Ping Pong', 'Foosball']
  scoringFormat: string; // e.g. 'first to 11', 'best of 3'
  matchFrequencyCap?: number; // e.g. 1 (per week)
  winConditions?: string; // e.g. 'win by 2', 'allow ties'
  maxMatchesPerDay?: number;
  maxMatchesPerWeek?: number;
  matchExpirationHours?: number;
  overtimeRule?: string;
  matchVerification: 'manual' | 'automatic' | 'both-confirm';

  // 👥 Member & Admin Controls
  allowMultipleAdmins?: boolean;
  allowModerators?: boolean;
  allowMemberScoreReporting?: boolean;
  requireBothConfirm?: boolean;

  // 🎨 Customization
  logoUrl?: string;
  bannerUrl?: string;
  themeColor?: string;
  emoji?: string;
  description?: string;
  pinnedMessage?: string;

  // 📊 Competition Format & Ranking
  rankingSystem: 'elo' | 'winPct' | 'points';
  pointsPerWin?: number;
  pointsPerTie?: number;
  seasonStart?: any; // Firestore Timestamp
  seasonEnd?: any;   // Firestore Timestamp
  resetStatsEachSeason?: boolean;
  scheduleType: 'auto' | 'open';
  tournamentMode?: 'none' | 'single-elim' | 'double-elim';

  // ⚠️ Other
  allowSmurfing?: boolean;
  showFullMatchHistory?: boolean;
  anonymousStats?: boolean;
  bannedUsers?: string[];
  allowedDepartments?: string[];
}
