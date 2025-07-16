import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../Backend/AuthProvider';
import { db } from '../Backend/firebase';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';

// --- League and Member Types ---
// Represents a league in Firestore
export interface League {
  id: string;
  name: string;
  adminId: string;
  members: string[];
  [key: string]: any;
}

// Represents a user/member in a league
export interface LeagueMember {
  id: string;
  displayName: string;
  email: string;
  [key: string]: any;
}

// Context value type for LeagueContext
interface LeagueContextType {
  leagues: League[]; // All leagues the user is a member of
  selectedLeague: League | null; // The currently selected league
  setSelectedLeague: (league: League | null) => void; // Setter for selected league
  leagueMembers: LeagueMember[]; // Members of the selected league
  loading: boolean; // Loading state for async operations
  isLeagueAdmin: boolean; // Whether the user is admin of the selected league
  refreshLeagues: () => Promise<void>; // Function to refresh league data
}

// Create the context (undefined by default for error checking)
const LeagueContext = createContext<LeagueContextType | undefined>(undefined);

// Custom hook to use the LeagueContext
export const useLeagueContext = () => {
  const ctx = useContext(LeagueContext);
  if (!ctx) throw new Error('useLeagueContext must be used within a LeagueProvider');
  return ctx;
};

// Provider component to wrap your app or layout
export const LeagueProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const [leagueMembers, setLeagueMembers] = useState<LeagueMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLeagueAdmin, setIsLeagueAdmin] = useState(false);

  // Fetch all leagues the current user is a member of
  const fetchLeagues = async () => {
    if (!user) {
      setLeagues([]);
      setSelectedLeague(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(collection(db, 'leagues'), where('members', 'array-contains', user.uid));
    const snap = await getDocs(q);
    const leaguesData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as League));
    setLeagues(leaguesData);
    // Auto-select the first league if none selected
    if (!selectedLeague && leaguesData.length > 0) {
      setSelectedLeague(leaguesData[0]);
    }
    setLoading(false);
  };

  // Fetch all members for the selected league
  const fetchLeagueMembers = async (league: League | null) => {
    if (!league) {
      setLeagueMembers([]);
      setIsLeagueAdmin(false);
      return;
    }
    if (!league.members || league.members.length === 0) {
      setLeagueMembers([]);
      setIsLeagueAdmin(false);
      return;
    }
    // Firestore 'in' query supports max 10 items, so only fetch first 10 for now
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('__name__', 'in', league.members.slice(0, 10)));
    const snap = await getDocs(q);
    const membersData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as LeagueMember));
    setLeagueMembers(membersData);
    setIsLeagueAdmin(!!user && league.adminId === user.uid);
  };

  // Fetch leagues when user changes (login/logout)
  useEffect(() => {
    fetchLeagues();
    // eslint-disable-next-line
  }, [user]);

  // Fetch league members when selectedLeague changes
  useEffect(() => {
    fetchLeagueMembers(selectedLeague);
    // eslint-disable-next-line
  }, [selectedLeague]);

  // Refresh leagues and update selectedLeague if needed
  const refreshLeagues = async () => {
    await fetchLeagues();
    if (selectedLeague) {
      const docSnap = await getDoc(doc(db, 'leagues', selectedLeague.id));
      if (docSnap.exists()) {
        setSelectedLeague({ id: docSnap.id, ...docSnap.data() } as League);
      }
    }
  };

  // Provide all context values to children
  return (
    <LeagueContext.Provider
      value={{
        leagues,
        selectedLeague,
        setSelectedLeague,
        leagueMembers,
        loading,
        isLeagueAdmin,
        refreshLeagues,
      }}
    >
      {children}
    </LeagueContext.Provider>
  );
};