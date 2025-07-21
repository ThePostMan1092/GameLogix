
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