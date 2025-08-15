// Stats are grouped by sportParent, with one document per sportParent
// Custom sports get their own separate documents
export interface SportParentStats {
    sportParentName: string; // The parent sport name (e.g., "ping-pong", "basketball")
    lastUpdated: Date;
    aggregateStats: aggregateStats; // Combined stats across all sports in this parent
    perSportStats: PerSportStat[]; // Individual sport breakdowns within this parent
    perLeagueStats: PerLeagueStat[]; // League-specific breakdowns
}

export interface PerSportStat {
    sportId: string;
    sportName: string;
    aggregateStats: aggregateStats;
    perLeagueStats: PerLeagueStat[];
}

export interface PerLeagueStat {
    leagueId: string;
    leagueName: string;
    aggregateStats: aggregateStats;
}

export interface aggregateStats {
    matchesPlayed: number,
    matchesWon: number,
    matchesLost: number,
    matchesTied?: number, // For sports that allow ties
    winPercentage: number,
    currentWinStreak: number,
    longestWinStreak: number,
    currentLossStreak?: number,
    longestLossStreak?: number,
    shutouts: number,
    comebackWins: number,
    titlesWon: number, //tournaments only dont worry about for now
    runnerUpFinishes: number, //tournaments only dont worry about for now
    medals: { gold: number, silver: number, bronze: number }, //tournaments only dont worry about for now
    leaguesParticipated: number, 
    mostPlayedLeagueId: string,
    leagueRankings: leagueRanking,
    bestPartner: partner,
    mostFrequentRival: rival,
    averageScore?: number,
    highestScore?: number,
    lowestScore?: number,
    lastUpdated?: Date
}

export interface leagueRanking {
    average: number;
    highest: number;
    lowest: number;
}

export interface partner {
    userId: string;
    name: string;
    winPercentage: number;
}

export interface rival {
    userId: string;
    name: string;
    wins: number;
    losses: number;
}

// Helper types for stat updates
export interface StatUpdateContext {
    userId: string;
    leagueId: string;
    leagueName: string;
    sportId: string;
    sportName: string;
    sportParentName?: string;
    sportParentId?: string;
    matchResult: MatchResult;
}

export interface MatchResult {
    playerRank: number;
    totalPlayers: number;
    playerScore: number;
    opponentIds: string[];
    teammateIds?: string[];
    isWin: boolean;
    isLoss: boolean;
    isTie?: boolean;
    isShutout?: boolean;
    isComebackWin?: boolean;
}

export interface Badge {
    name: string;
    description: string;
    imageUrl: string;
    completion: number;
    progress: number;
    otherQualities?: {value: string, count: number}[];
}

export const generalBadges: Badge[] = [
  {
    name: "First Taste of Victory",
    description: "Win your first game.",
    imageUrl: "/badges/first-win.png",
    completion: 1,
    progress: 0
  },
  {
    name: "Hot Streak",
    description: "Win 5 games in a row.",
    imageUrl: "/badges/hot-streak.png",
    completion: 5,
    progress: 0
  },
  {
    name: "Unstoppable",
    description: "Win 10 games in a row.",
    imageUrl: "/badges/unstoppable.png",
    completion: 10,
    progress: 0
  },
  {
    name: "Marathon Winner",
    description: "Win 50 games total.",
    imageUrl: "/badges/marathon-winner.png",
    completion: 50,
    progress: 0
  },
  {
    name: "Century Club",
    description: "Win 100 games total.",
    imageUrl: "/badges/century-club.png",
    completion: 100,
    progress: 0
  },
  {
    name: "The Closer",
    description: "Win with a 70%+ win rate over 20+ games.",
    imageUrl: "/badges/the-closer.png",
    completion: 0.7,
    progress: 0
  },
  {
    name: "Mr./Ms. Consistent",
    description: "Maintain a 50%+ win rate over 50+ games.",
    imageUrl: "/badges/consistent.png",
    completion: 0.5,
    progress: 0
  },
  {
    name: "Ice Cold",
    description: "Lose 5 games in a row.",
    imageUrl: "/badges/ice-cold.png",
    completion: 5,
    progress: 0
  },
  {
    name: "Rock Bottom",
    description: "Lose 10 games in a row.",
    imageUrl: "/badges/rock-bottom.png",
    completion: 10,
    progress: 0
  },
  {
    name: "Revenge Arc",
    description: "Go from a 5-game losing streak to a 5-game winning streak.",
    imageUrl: "/badges/revenge-arc.png",
    completion: 1,
    progress: 0
  },
  {
    name: "Comeback Kid",
    description: "Win after being on match point or last place.",
    imageUrl: "/badges/comeback-kid.png",
    completion: 1,
    progress: 0
  },
  {
    name: "Weekend Warrior",
    description: "Play 10 games in a single day.",
    imageUrl: "/badges/weekend-warrior.png",
    completion: 10,
    progress: 0
  },
  {
    name: "Long Haul",
    description: "Play 100 games total.",
    imageUrl: "/badges/long-haul.png",
    completion: 100,
    progress: 0
  }
]

export interface roundWinsStats {
    rounds: {
        
    }
}

// Utility functions for document naming
export class StatsDocumentHelper {
    static sanitizeForFirestore(str: string): string {
        return str
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\-_]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    static generateDocumentId(
        sportParentName?: string,
        sportName?: string,
        sportId?: string,
        isCustom?: boolean
    ): string {
        const baseName = sportParentName || sportName || 'unknown-sport';
        const sanitizedBase = this.sanitizeForFirestore(baseName);
        
        if (isCustom || !sportParentName || sportParentName.toLowerCase() === 'custom') {
            // Custom sports get unique suffixes to prevent collisions
            const suffix = sportId || this.generateShortHash(sportName || 'unknown');
            return `custom-${sanitizedBase}-${suffix}`;
        }
        
        return sanitizedBase;
    }

    private static generateShortHash(input: string): string {
        let hash = 0;
        for (let i = 0; i < input.length; i++) {
            const char = input.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36).substring(0, 8);
    }

    static isCustomSport(sportParentName?: string): boolean {
        return !sportParentName || 
               sportParentName.toLowerCase() === 'custom' || 
               sportParentName.toLowerCase() === 'undefined' ||
               sportParentName.toLowerCase() === 'null';
    }
}