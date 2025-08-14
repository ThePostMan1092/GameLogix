import React, { useState, useEffect } from 'react';
import { Typography, Alert, FormControl, InputLabel, Select, MenuItem,
 } from '@mui/material';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../Backend/firebase';
import { useAuth } from '../Backend/AuthProvider';
import { InternalBox } from '../Backend/InternalBox';
import { useParams } from 'react-router-dom';
import { type Sport } from '../types/sports.ts';
import SmallTeam from './PlayerSelectionBlocks/smallTeam.tsx';
import RoundBased from './RecordScoreBlocks/roundBased.tsx';
import IndividualComp from './PlayerSelectionBlocks/individualComp.tsx';
import IndividualPoints from './RecordScoreBlocks/individualPoints.tsx';

export interface teamPostitioning {
  teamid: number;
  teamPosition: number;
  playerId: string;
  displayName: string;
}

const RecordGame: React.FC = () => {
  const { leagueId } = useParams<{ leagueId: string }>();
  const { user } = useAuth();
  const [opponents, setOpponents] = useState<any[]>([]);
  const [success, setSuccess] = useState('');
  const [league, setLeague] = useState<any>(null);
  const [sports, setSports] = useState<Sport[]>([]);
  const [selectedSport, setSelectedSport] = useState<Sport | null>(null);
  const [players, setPlayers] = useState<teamPostitioning[]>([]);

  useEffect(() => {
    const fetchLeague = async () => {
      if (!leagueId) return;

      try {
        const leagueRef = doc(db, 'leagues', leagueId);
        const leagueSnap = await getDoc(leagueRef);
        if (!leagueSnap.exists()) {
          return;
        }
        const leagueData = leagueSnap.data();
        setLeague(leagueData);
        const sportsRef = collection(db, 'leagues', leagueId, 'sports');
        const sportsSnap = await getDocs(sportsRef);
        const sportsData: Sport[] = sportsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sport));
        setSports(sportsData);
        if (sportsData.length > 0) {
          setSelectedSport(sportsData[0]);
        }
      } catch (err) {
        console.error('Failed to fetch league:', err);
      }
    };

    fetchLeague();
  }, [leagueId]);
  



  useEffect(() => {
    const fetchOpponents = async () => {
      if (!user || !league || !league.members) return;
      
      try {
        // Fetch only league members as opponents
        const memberPromises = league.members.map(async (memberId: string) => {
          const userRef = doc(db, 'users', memberId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            return {
              id: memberId,
              ...userSnap.data()
            };
          }
          return null;
        });
        
        const allMembers = (await Promise.all(memberPromises)).filter(Boolean);
        
        // Filter out current user
        const opponents = allMembers.filter(u => u.id !== user.uid);
        setOpponents(opponents);
        console.log('Fetched opponents:', opponents);
      } catch (err) {
        console.error('Error fetching opponents:', err);
      }
    };

    fetchOpponents();
  }, [user, league]);

  const handleSuccess = () => {
    // Reset form after successful submission
    setPlayers([]);
    setSelectedSport(sports.length > 0 ? sports[0] : null);
    setSuccess('Match recorded successfully!');
  };

  const logValue = (value: any) => {
    console.log('Value changed:', value);
  }

  
  
  return (
    <InternalBox sx={{ p: 4, maxWidth: 900, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Record a Match
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Record the results of a match you've played against a coworker.
      </Typography>

      {opponents.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No opponents found. Make sure other users are registered in the system.
        </Alert>
      )}

        <FormControl fullWidth>
          <InputLabel>Sport</InputLabel>
          <Select 
            value={selectedSport?.name || ''} 
            label="Sport" 
            onChange={e => setSelectedSport(sports.find(s => s.name === e.target.value) || null)}
            fullWidth>
            {sports.map(s => <MenuItem key={s.id} value={s.name}>{s.name}</MenuItem>)}
          </Select>
        </FormControl>

        {selectedSport && selectedSport.sportParent.playerFormat === 'freeForAllSmall' && selectedSport.sportParent.scoringFormat === 'simpleScore' && (
          <IndividualComp
            selectedSport={selectedSport}
            leagueMembers={[
              {
                id: user?.uid,
                displayName: user?.displayName || user?.email || 'You',
                email: user?.email,
              },
              ...opponents
            ]}
            onSelectionChange={players => {
              setPlayers(players);
            }}
          />
        
        )}

        {selectedSport?.sportParent.playerFormat === 'smallTeam' &&  (
          logValue(selectedSport),
          <SmallTeam
            selectedSport={selectedSport}
            leagueMembers={[ // <-- include the user!
              {
                id: user?.uid,
              displayName: user?.displayName || user?.email || 'You',
              email: user?.email,
            },
            ...opponents
          ]}
          onSelectionChange={players => {
            setPlayers(players);
          }}
        />
        )}

        {/* Score Inputs */}
        {selectedSport?.sportParent.scoringFormat === 'roundWins' && leagueId && (
          <RoundBased
            selectedSport={selectedSport}
            players={players}
            leagueId={leagueId}
            onSuccess={handleSuccess}
          />
        )}

        {selectedSport && selectedSport.teamFormat === 'individuals' && !selectedSport.useRounds && leagueId && (
          <IndividualPoints
            selectedSport={selectedSport}
            players={players}
            leagueId={leagueId}
            onSuccess={handleSuccess}
          />
        )}


       {/* Success Message */}
      {success && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {success}
        </Alert>
      )}
    </InternalBox>
  );
};

export default RecordGame;
