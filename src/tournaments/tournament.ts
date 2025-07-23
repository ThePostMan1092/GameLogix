import { db } from '../Backend/firebase'; // Adjust the import based on your project structure
import { collection, addDoc, serverTimestamp} from 'firebase/firestore';
// import { shuffleArray } from '../lib/utils'; // Removed unused and unresolved import

export interface Tournament {
    id: string;
    name: string;
    description?: string;
    leagueId?: string;
    adminId: string[];
    participants: string[]; // user IDs
    sportId: string;
    competitionLevel: 'casual' | 'competitive' | 'pro';
    format: 'single-elim' | 'double-elim' | 'round-robin';  
    startDate: Date;
    endDate?: Date;
    location?: string;
    rules?: string;
    prizePool?: number; // in USD
    status: 'upcoming' | 'ongoing' | 'completed';
    createdAt: Date;
    updatedAt: Date;
    podiumSpots: number;
    seedingMethod: 'elo' | 'random' | 'custom';
}

export interface Match {
    id: string;
    tournamentId: string;
    matchNumber: number; // e.g. 1 for first match, 2 for second, etc.
    round: number; // 1 for first round, 2 for second, etc.
    team1: string[]; // user ID
    team2: string[]; // user ID
    score1?: number; // optional if match not yet played
    score2?: number; // optional if match not yet played
    winner?: string; // user ID of the winner, optional if match not yet played
    status: 'scheduled' | 'in-progress' | 'completed';
    scheduledTime?: Date; // when the match is scheduled to be played
    actualTime?: Date; // when the match was actually played
    results?: {
        scores: [number, number]; // [team1 score, team2 score]
        winnerId: string; // user ID of the winning team
    };
};

export async function createTournament(tournamentData: Partial<Tournament>): Promise<string> {
    const requiredData = ['name', 'sportId', 'adminId', 'format', ];
    if (requiredData.some(field => !(tournamentData as Record<string, unknown>)[field])) {
        throw new Error('Missing required fields for tournament creation.');
    }
    const tournamentRef = await addDoc(collection(db, "tournaments"), {
        ...tournamentData,
        participants: tournamentData.participants || [],
        status: tournamentData.status || 'upcoming',
        competitionLevel: tournamentData.competitionLevel || 'casual',
        podiumSpots: tournamentData.podiumSpots || 3,
        seedingMethod: tournamentData.seedingMethod || 'elo',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
    return tournamentRef.id;
};

