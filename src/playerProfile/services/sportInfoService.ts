import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../Backend/firebase';
import type { Sport } from '../../types/sports';

export class SportInfoService {
  /**
   * Get sport information including parent details
   */
  static async getSportInfo(leagueId: string, sportId: string): Promise<{
    sportName: string;
    sportParentName?: string;
    sportParentId?: string;
  }> {
    try {
      const sportRef = doc(db, 'leagues', leagueId, 'sports', sportId);
      const sportDoc = await getDoc(sportRef);
      
      if (sportDoc.exists()) {
        const sport = sportDoc.data() as Sport;
        return {
          sportName: sport.name,
          sportParentName: sport.sportParent.name,
        };
      }
      
      // Fallback if sport not found
      return {
        sportName: sportId,
        sportParentName: 'Custom',
        sportParentId: undefined
      };
    } catch (error) {
      console.error('Error fetching sport info:', error);
      // Return fallback info
      return {
        sportName: sportId,
        sportParentName: 'Custom',
        sportParentId: undefined
      };
    }
  }

  /**
   * Get league name
   */
  static async getLeagueName(leagueId: string): Promise<string> {
    try {
      const leagueRef = doc(db, 'leagues', leagueId);
      const leagueDoc = await getDoc(leagueRef);
      
      if (leagueDoc.exists()) {
        const league = leagueDoc.data();
        return league.name || leagueId;
      }
      
      return leagueId;
    } catch (error) {
      console.error('Error fetching league name:', error);
      return leagueId;
    }
  }
}
