import { useCallback } from 'react';
import { StatsService } from '../playerProfile/services/statsService';
import type { Match } from '../types/matches';
import type { SportParentStats } from '../types/stats';

/**
 * Hook for managing player statistics with the new grouped structure
 */
export const usePlayerStats = () => {
  
  /**
   * Update stats for all players after a match is completed
   */
  const updateMatchStats = useCallback(async (matchData: Match): Promise<void> => {
    try {
      await StatsService.batchUpdateMatchStats(matchData);
    } catch (error) {
      console.error('Failed to update match stats:', error);
      throw error;
    }
  }, []);

  /**
   * Get all stat documents for a user (grouped by sport parent)
   */
  const getUserStats = useCallback(async (userId: string): Promise<SportParentStats[]> => {
    try {
      return await StatsService.getUserStats(userId);
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
      throw error;
    }
  }, []);

  /**
   * Get specific sport parent stats for a user
   */
  const getSportParentStats = useCallback(async (
    userId: string,
    sportParentName: string,
    sportName?: string,
    sportId?: string
  ): Promise<SportParentStats | null> => {
    try {
      return await StatsService.getSportParentStats(userId, sportParentName, sportName, sportId);
    } catch (error) {
      console.error('Failed to fetch sport parent stats:', error);
      throw error;
    }
  }, []);

  /**
   * Backfill user stats from match history
   */
  const backfillUserStats = useCallback(async (userId: string): Promise<void> => {
    try {
      await StatsService.backfillUserStats(userId);
    } catch (error) {
      console.error('Failed to backfill user stats:', error);
      throw error;
    }
  }, []);

  return {
    updateMatchStats,
    getUserStats,
    getSportParentStats,
    backfillUserStats
  };
};
