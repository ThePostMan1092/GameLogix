export interface Match {
  id: string;
  date: string; // ISO format
  leagueId: string;
  createdBy: string;
  sportId: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  teams: MatchTeam[];
  customScoringData?: any; // if you want to allow custom per-match scoring
}

export interface MatchTeam {
  players: string[];
  score: number; // total score for the team
  winner: boolean; // whether this team won the match
}