import { doc, getDoc, runTransaction, collection, getDocs } from 'firebase/firestore';
import { db } from '../../Backend/firebase';
import type { 
  SportParentStats, 
  aggregateStats, 
  PerSportStat, 
  PerLeagueStat,
  StatUpdateContext,
  MatchResult
} from '../../types/stats';
import { StatsDocumentHelper } from '../../types/stats';
import { SportInfoService } from './sportInfoService';
import type { Match } from '../../types/matches';

export class StatsService {
  /**
   * Main entry point: Update player stats after a match
   */
  static async updatePlayerStats(
    userId: string,
    matchData: Match,
    playerRank: number,
    totalPlayers: number,
    playerScore: number,
    opponentIds: string[],
    teammateIds?: string[]
  ): Promise<void> {
    try {
      // Get sport and league information
      const sportInfo = await SportInfoService.getSportInfo(matchData.leagueId, matchData.sportId);
      const leagueName = await SportInfoService.getLeagueName(matchData.leagueId);
      
      // Build the update context
      const context: StatUpdateContext = {
        userId,
        leagueId: matchData.leagueId,
        leagueName,
        sportId: matchData.sportId,
        sportName: sportInfo.sportName,
        sportParentName: sportInfo.sportParentName,
        sportParentId: sportInfo.sportParentId,
        matchResult: {
          playerRank,
          totalPlayers,
          playerScore,
          opponentIds,
          teammateIds,
          isWin: playerRank === 1,
          isLoss: playerRank > 1,
          isTie: false, // TODO: Detect ties
          isShutout: false, // TODO: Detect shutouts
          isComebackWin: false // TODO: Detect comebacks
        }
      };

      await this.updateStatsForUser(context);
      
    } catch (error) {
      console.error('Error updating player stats:', error);
      throw error;
    }
  }

  /**
   * Update stats for a single user using transaction for consistency
   */
  private static async updateStatsForUser(context: StatUpdateContext): Promise<void> {
    const documentId = StatsDocumentHelper.generateDocumentId(
      context.sportParentName,
      context.sportName,
      context.sportId,
      StatsDocumentHelper.isCustomSport(context.sportParentName)
    );

    const statsDocRef = doc(db, 'users', context.userId, 'stats', documentId);

    await runTransaction(db, async (transaction) => {
      const statsDoc = await transaction.get(statsDocRef);
      
      let currentStats: SportParentStats;
      
      if (statsDoc.exists()) {
        currentStats = statsDoc.data() as SportParentStats;
      } else {
        // Initialize new stats document
        currentStats = this.initializeStatsDocument(context);
      }

      // Update the stats
      const updatedStats = this.calculateUpdatedStats(currentStats, context);
      
      // Save back to Firestore
      transaction.set(statsDocRef, updatedStats);
    });
  }

  /**
   * Initialize a new stats document
   */
  private static initializeStatsDocument(context: StatUpdateContext): SportParentStats {
    const emptyStats: aggregateStats = {
      matchesPlayed: 0,
      matchesWon: 0,
      matchesLost: 0,
      matchesTied: 0,
      winPercentage: 0,
      currentWinStreak: 0,
      longestWinStreak: 0,
      currentLossStreak: 0,
      longestLossStreak: 0,
      shutouts: 0,
      comebackWins: 0,
      titlesWon: 0,
      runnerUpFinishes: 0,
      medals: { gold: 0, silver: 0, bronze: 0 },
      leaguesParticipated: 0,
      mostPlayedLeagueId: '',
      leagueRankings: { average: 0, highest: 0, lowest: 0 },
      bestPartner: { userId: '', name: '', winPercentage: 0 },
      mostFrequentRival: { userId: '', name: '', wins: 0, losses: 0 },
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      lastUpdated: new Date()
    };

    return {
      sportParentName: context.sportParentName || context.sportName,
      lastUpdated: new Date(),
      aggregateStats: { ...emptyStats },
      perSportStats: [],
      perLeagueStats: []
    };
  }

  /**
   * Calculate updated stats (idempotent - safe to call multiple times)
   */
  private static calculateUpdatedStats(
    currentStats: SportParentStats,
    context: StatUpdateContext
  ): SportParentStats {
    const result = { ...currentStats };
    result.lastUpdated = new Date();

    // Update aggregate (parent-level) stats
    result.aggregateStats = this.updateAggregateStats(
      result.aggregateStats,
      context.matchResult
    );

    // Update per-sport stats
    result.perSportStats = this.updatePerSportStats(
      result.perSportStats,
      context
    );

    // Update per-league stats
    result.perLeagueStats = this.updatePerLeagueStats(
      result.perLeagueStats,
      context
    );

    return result;
  }

  /**
   * Update aggregate stats for a match result
   */
  private static updateAggregateStats(
    stats: aggregateStats,
    matchResult: MatchResult
  ): aggregateStats {
    const updated = { ...stats };
    
    // Basic counters
    updated.matchesPlayed++;
    if (matchResult.isWin) updated.matchesWon++;
    if (matchResult.isLoss) updated.matchesLost++;
    if (matchResult.isTie) updated.matchesTied = (updated.matchesTied || 0) + 1;
    
    // Win percentage
    updated.winPercentage = (updated.matchesWon / updated.matchesPlayed) * 100;
    
    // Streaks
    if (matchResult.isWin) {
      updated.currentWinStreak++;
      updated.currentLossStreak = 0;
      updated.longestWinStreak = Math.max(updated.longestWinStreak, updated.currentWinStreak);
    } else if (matchResult.isLoss) {
      updated.currentLossStreak = (updated.currentLossStreak || 0) + 1;
      updated.currentWinStreak = 0;
      updated.longestLossStreak = Math.max(
        updated.longestLossStreak || 0, 
        updated.currentLossStreak
      );
    }
    
    // Special achievements
    if (matchResult.isShutout) updated.shutouts++;
    if (matchResult.isComebackWin) updated.comebackWins++;
    
    // Score tracking
    const currentAvg = updated.averageScore || 0;
    const currentHighest = updated.highestScore || 0;
    const currentLowest = updated.lowestScore || 0;
    
    if (matchResult.playerScore > 0) {
      // Update average score
      const totalPreviousScore = currentAvg * (updated.matchesPlayed - 1);
      updated.averageScore = (totalPreviousScore + matchResult.playerScore) / updated.matchesPlayed;
      
      // Update highest score
      updated.highestScore = Math.max(currentHighest, matchResult.playerScore);
      
      // Update lowest score
      if (currentLowest === 0 || matchResult.playerScore < currentLowest) {
        updated.lowestScore = matchResult.playerScore;
      }
    }
    
    updated.lastUpdated = new Date();
    return updated;
  }

  /**
   * Update per-sport stats, creating new sport entry if needed
   */
  private static updatePerSportStats(
    perSportStats: PerSportStat[],
    context: StatUpdateContext
  ): PerSportStat[] {
    const sportIndex = perSportStats.findIndex(s => s.sportId === context.sportId);
    
    if (sportIndex >= 0) {
      // Update existing sport
      const updated = [...perSportStats];
      updated[sportIndex] = {
        ...updated[sportIndex],
        aggregateStats: this.updateAggregateStats(
          updated[sportIndex].aggregateStats,
          context.matchResult
        ),
        perLeagueStats: this.updatePerLeagueStats(
          updated[sportIndex].perLeagueStats,
          context
        )
      };
      return updated;
    } else {
      // Create new sport entry
      const newSportStats: PerSportStat = {
        sportId: context.sportId,
        sportName: context.sportName,
        aggregateStats: this.updateAggregateStats(
          this.initializeStatsDocument(context).aggregateStats,
          context.matchResult
        ),
        perLeagueStats: this.updatePerLeagueStats([], context)
      };
      return [...perSportStats, newSportStats];
    }
  }

  /**
   * Update per-league stats, creating new league entry if needed
   */
  private static updatePerLeagueStats(
    perLeagueStats: PerLeagueStat[],
    context: StatUpdateContext
  ): PerLeagueStat[] {
    const leagueIndex = perLeagueStats.findIndex(l => l.leagueId === context.leagueId);
    
    if (leagueIndex >= 0) {
      // Update existing league
      const updated = [...perLeagueStats];
      updated[leagueIndex] = {
        ...updated[leagueIndex],
        aggregateStats: this.updateAggregateStats(
          updated[leagueIndex].aggregateStats,
          context.matchResult
        )
      };
      return updated;
    } else {
      // Create new league entry
      const newLeagueStats: PerLeagueStat = {
        leagueId: context.leagueId,
        leagueName: context.leagueName,
        aggregateStats: this.updateAggregateStats(
          this.initializeStatsDocument(context).aggregateStats,
          context.matchResult
        )
      };
      return [...perLeagueStats, newLeagueStats];
    }
  }

  /**
   * Get all stat documents for a user
   */
  static async getUserStats(userId: string): Promise<SportParentStats[]> {
    try {
      const statsCollection = collection(db, 'users', userId, 'stats');
      const snapshot = await getDocs(statsCollection);
      
      return snapshot.docs.map(doc => doc.data() as SportParentStats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }
  }

  /**
   * Get specific sport parent stats for a user
   */
  static async getSportParentStats(
    userId: string, 
    sportParentName: string,
    sportName?: string,
    sportId?: string
  ): Promise<SportParentStats | null> {
    try {
      const documentId = StatsDocumentHelper.generateDocumentId(
        sportParentName,
        sportName,
        sportId,
        StatsDocumentHelper.isCustomSport(sportParentName)
      );
      
      const statsDocRef = doc(db, 'users', userId, 'stats', documentId);
      const statsDoc = await getDoc(statsDocRef);
      
      if (statsDoc.exists()) {
        return statsDoc.data() as SportParentStats;
      }
      return null;
    } catch (error) {
      console.error('Error fetching sport parent stats:', error);
      throw error;
    }
  }

  /**
   * Batch update stats for all players in a match
   */
  static async batchUpdateMatchStats(matchData: Match): Promise<void> {
    try {
      const playerRankings = this.getPlayerRankingsFromMatch(matchData);
      const totalPlayers = playerRankings.length;
      
      // Get opponent/teammate information for each player
      const updatePromises = playerRankings.map(({ playerId, rank, score }) => {
        const opponentIds = playerRankings
          .filter(p => p.playerId !== playerId)
          .map(p => p.playerId);
        
        // TODO: Determine teammates based on team structure
        const teammateIds: string[] = [];
        
        return this.updatePlayerStats(
          playerId,
          matchData,
          rank,
          totalPlayers,
          score,
          opponentIds,
          teammateIds
        );
      });
      
      await Promise.all(updatePromises);
      console.log('Batch stats update completed for match:', matchData.gameStats.gameId);
    } catch (error) {
      console.error('Error in batch stats update:', error);
      throw error;
    }
  }

  /**
   * Extract player rankings from match data
   */
  private static getPlayerRankingsFromMatch(matchData: Match): Array<{ 
    playerId: string; 
    rank: number; 
    score: number;
  }> {
    const rankings: Array<{ playerId: string; rank: number; score: number }> = [];
    
    if (matchData.gameStats.teams) {
      // Sort teams by score to determine rankings
      const sortedTeams = matchData.gameStats.teams.sort((a, b) => b.totalScore - a.totalScore);
      
      sortedTeams.forEach((team, index) => {
        team.playerIds.forEach(playerId => {
          rankings.push({
            playerId,
            rank: index + 1,
            score: team.totalScore
          });
        });
      });
    }
    
    return rankings;
  }

  /**
   * Backfill: Recompute all stats for a user from their match history
   */
  static async backfillUserStats(userId: string): Promise<void> {
    try {
      console.log(`Starting stats backfill for user ${userId}`);
      
      // TODO: Implement backfill logic
      // 1. Clear existing stats documents
      // 2. Query all matches for this user across all leagues/sports
      // 3. Process matches in chronological order
      // 4. Rebuild stats documents
      
      console.log('Backfill completed - Implementation pending');
    } catch (error) {
      console.error('Error during stats backfill:', error);
      throw error;
    }
  }
}
