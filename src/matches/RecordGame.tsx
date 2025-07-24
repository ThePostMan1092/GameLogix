import React, { useState, useEffect } from 'react';
import { Typography, Box, Button, MenuItem, TextField, CircularProgress, Alert, FormControl, InputLabel, Select,
  Divider, Stack
 } from '@mui/material';
import { collection, addDoc, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../Backend/firebase';
import { useAuth } from '../Backend/AuthProvider';
import { InternalBox } from '../Backend/InternalBox';
import type {Match} from '../types/matches';
import { useParams } from 'react-router-dom';
import { type Sport } from '../types/sports.ts';

// Available sports for company leagues
interface teamPostitioning {
  teamid: number;
  teamPosition: number;
  playerId: string;
  displayName: string;
}

const RecordGame: React.FC = () => {
  const { leagueId } = useParams<{ leagueId: string }>();
  const { user } = useAuth();
  const [opponents, setOpponents] = useState<any[]>([]);
  const [sport, setSport] = useState('');
  const [opponentId, setOpponentId] = useState('');
  const [score, setScore] = useState<{ player1: number; player2: number }>({ player1: 0, player2: 0 });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
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
          setLoading(false);
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
        setError('Unable to load league data.');
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
        setError('Failed to load league members');
      }
    };

    fetchOpponents();
  }, [user, league]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!user) {
      setError('You must be logged in to record a match.');
      return;
    }

    if (!sport) {
      setError('Please select a sport.');
      return;
    }

    if (!opponentId) {
      setError('Please select an opponent.');
      return;
    }

    if (user.uid === opponentId) {
      setError('You cannot play against yourself.');
      return;
    }

    if (score.player1 < 0 || score.player2 < 0) {
      setError('Scores must be positive numbers.');
      return;
    }

    // Auto-set winner based on score
    const winnerId = score.player1 > score.player2 ? user.uid : opponentId;

    setLoading(true);

    try {
      const match: Match = {
        id: '',
        date: new Date().toISOString(),
        leagueId: leagueId!,
        createdBy: user.uid,
        sportId: sport,
        status: 'completed',
        teams: [
          { players: [user.uid], score: score.player1, winner: winnerId === user.uid },
          { players: [opponentId], score: score.player2, winner: winnerId === opponentId }
        ]
      };

      const matchRef = collection(db, 'leagues', leagueId!, 'matches');
      await addDoc(matchRef, match);
      
      setSuccess('Match recorded successfully!');
      
      // Reset form
      setSport('');
      setOpponentId('');
      setScore({ player1: 0, player2: 0 });
      
    } catch (err: any) {
      setError(`Failed to record match: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };


  const handleSelectPlayer = (playerId: string, teamId: number, position: number) => {
    setPlayers(prevPlayers => {
      const updatedPlayers = [...prevPlayers];
      const newPlayer: teamPostitioning = {
        teamid: teamId,
        teamPosition: position,
        playerId: playerId,
        displayName: opponents.find(opponent => opponent.id === playerId)?.displayName || ''
      };
      updatedPlayers.push(newPlayer);
      return updatedPlayers;
    });
    setOpponents(prevOpponents => prevOpponents.filter(opponent => opponent.id !== playerId));
  };

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

      <form onSubmit={handleSubmit}>

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
        {selectedSport?.gameType === 'competition' && (
          <>
            <Divider sx={{mt:2}}>Player Selection</Divider>
            {selectedSport?.numberOfTeams && selectedSport?.numberOfTeams < 4 && (
              <Stack direction="row" gap={2} divider={<Divider orientation="vertical" flexItem sx={{ my: 1 }} />}>
                <Box alignItems="center" display="flex" flexDirection="column" sx={{ flex: 1, mx: 2 }}>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    Your Team
                  </Typography>
                  <TextField
                    label="User"
                    disabled
                    fullWidth
                    variant="outlined"
                    value={user?.displayName || user?.email || user?.uid}
                    sx={{ mt: 1.25, mb: 0.9 }}
                  />
                  {Array.from({ length: selectedSport.playersPerTeam ? selectedSport.playersPerTeam - 1 : 0 }).map((_, i) => (
                    <TextField
                      select
                      label={`Teammate ${i+1}`}
                      fullWidth
                      margin="normal"
                      value={players.find(p => p.teamid === 1 && p.teamPosition === i + 1)?.displayName || ''}
                      onChange={(e) => handleSelectPlayer(e.target.value, 1, i + 1)}
                    >
                      {opponents.map((opponent) => (
                        <MenuItem key={opponent.id} value={opponent.id}>
                          {opponent.displayName || opponent.email || opponent.id}
                        </MenuItem>
                      ))}
                    </TextField>

                  ))}
                </Box>
                  {Array.from({ length: selectedSport.numberOfTeams - 1 }).map((_, x) => (
                    <Box key={x} alignItems="center" display="flex" flexDirection="column" sx={{ flex: 1, mx: 2 }}>
                      <Typography variant="h4" sx={{ mb: 0 }}>
                        Team {x + 2}
                      </Typography>
                      {Array.from({ length: selectedSport.playersPerTeam ? selectedSport.playersPerTeam  : 1 }).map((_, i) => (
                        <TextField
                          select
                          label={`Opponent ${i+1}`}
                          fullWidth
                          margin="normal"
                          value={players.find(p => p.teamid === x + 2 && p.teamPosition === i + 1)?.displayName || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            handleSelectPlayer(e.target.value, x + 2, i + 1);
                            setOpponentId(e.target.value);
                          }}
                        >
                          {opponents.map((opponent) => (
                            <MenuItem key={opponent.id} value={opponent.id}>
                              {opponent.displayName || opponent.email || opponent.id}
                            </MenuItem>
                          ))}
                        </TextField>
                      ))}
                    </Box>
                  ))}

              </Stack>
            )}
          </>
        )}

        {/* Score Inputs */}
        <Box display="flex" gap={2} mt={2}>
          <TextField
            label="Your Score"
            type="number"
            fullWidth
            value={score.player1}
            onChange={(e) => setScore({ ...score, player1: Number(e.target.value) })}
            required
            inputProps={{ min: 0 }}
          />
          <TextField
            label="Opponent's Score"
            type="number"
            fullWidth
            value={score.player2}
            onChange={(e) => setScore({ ...score, player2: Number(e.target.value) })}
            required
            inputProps={{ min: 0 }}
          />
        </Box>

        {/* Winner Display */}
        {sport && opponentId && (score.player1 !== score.player2) && (
          <Box mt={2} p={2} bgcolor="background.paper" borderRadius={1}>
            <Typography variant="body2" color="text.secondary">
              Winner: {score.player1 > score.player2 ? 'You' : opponents.find(o => o.id === opponentId)?.displayName || 'Opponent'}
            </Typography>
          </Box>
        )}

        {/* Error and Success Messages */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {success}
          </Alert>
        )}

        {/* Submit Button */}
        <Box mt={3}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading || opponents.length === 0}
            size="large"
          >
            {loading ? <CircularProgress size={24} /> : 'Record Match'}
          </Button>
        </Box>
      </form>
    </InternalBox>
  );
};

export default RecordGame;
