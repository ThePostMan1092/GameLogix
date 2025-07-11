import React, { useState, useEffect } from 'react';
import { Typography, Box, Button, MenuItem, TextField, CircularProgress, Alert, ToggleButton, ToggleButtonGroup, IconButton, Autocomplete } from '@mui/material';
import { Add, Remove } from '@mui/icons-material';
import { collection, addDoc, getDocs, Timestamp, doc, updateDoc, arrayUnion, setDoc } from 'firebase/firestore';
import { db } from '../Backend/firebase';
import { useAuth } from '../Backend/AuthProvider';
import { InternalBox } from '../Backend/InternalBox';

export interface Score {
  player1: number;
  player2: number;
}

export interface PingPongRound {
  round: number;
  player1: number;
  player2: number;
}

export interface Match {
  id?: string;
  player1Id: string;
  player2Id: string;
  teammateId?: string;
  opponent2Id?: string;
  sport: string;
  mode?: 'singles' | 'doubles';
  score?: Score;
  rounds?: PingPongRound[];
  roundsType?: 'points' | 'sets';
  winnerId: string;
  createdAt: Timestamp;
  status: 'completed';
}

const sports = ['Ping Pong', 'Foosball', 'Pool'];

const RecordGame: React.FC = () => {
  const { user } = useAuth();
  const [opponents, setOpponents] = useState<any[]>([]);
  console.log(opponents)
  const [sport, setSport] = useState('');
  // Ping Pong specific
  const [ppMode, setPpMode] = useState<'singles' | 'doubles'>('singles');
  const [teammateId, setTeammateId] = useState('');
  const [opponent2Id, setOpponent2Id] = useState('');
  const [roundsType, setRoundsType] = useState<'points' | 'sets'>('sets');
  const [ppRounds, setPpRounds] = useState<PingPongRound[]>([{ round: 1, player1: 0, player2: 0 }]);
  const [ppSets, setPpSets] = useState<{ player1: number; player2: number }>({ player1: 0, player2: 0 });
  // General
  const [opponentId, setOpponentId] = useState('');
  const [score, setScore] = useState<Score>({ player1: 0, player2: 0 });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOpponents = async () => {
      if (!user) return;
      const q = collection(db, 'users');
      const snap = await getDocs(q);
      const allDocs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log('All users from Firestore:', allDocs);
      console.log('Current user UID:', user.uid);
      const loaded = allDocs.filter(o => o.id !== user.uid);
      setOpponents(loaded);
      console.log('Loaded opponents (excluding self):', loaded);
    };
    fetchOpponents();
  }, [user]);

  // --- Ping Pong helpers ---
  const availableOpponents = opponents.filter(o => o.id !== teammateId);
  const availableTeammates = opponents.filter(o => o.id !== opponentId && o.id !== opponent2Id);
  const availableOpponent2 = opponents.filter(o => o.id !== opponentId && o.id !== teammateId);

  const handleAddRound = () => {
    setPpRounds([...ppRounds, { round: ppRounds.length + 1, player1: 0, player2: 0 }]);
  };
  const handleRemoveRound = (idx: number) => {
    setPpRounds(ppRounds.filter((_, i) => i !== idx));
  };
  const handleRoundChange = (idx: number, field: 'player1' | 'player2', value: number) => {
    setPpRounds(ppRounds.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!user) {
      setError('You must be logged in to record a match.');
      return;
    }
    if (!sport) {
      setError('Please select a sport.');
      return;
    }
    // --- Ping Pong ---
    if (sport === 'Ping Pong') {
      if (ppMode === 'singles') {
        if (!opponentId || opponentId === user.uid) {
          setError('Select a valid opponent.');
          return;
        }
      } else {
        if (!teammateId || !opponentId || !opponent2Id || new Set([user.uid, teammateId, opponentId, opponent2Id]).size !== 4) {
          setError('Select all players (no duplicates).');
          return;
        }
      }
      if (roundsType === 'sets') {
        if (ppSets.player1 < 0 || ppSets.player2 < 0) {
          setError('Enter valid set counts.');
          return;
        }
      } else {
        if (ppRounds.some(r => r.player1 < 0 || r.player2 < 0)) {
          setError('All round scores must be positive.');
          return;
        }
      }
      setLoading(true);
      let winnerId = '';
      if (roundsType === 'sets') {
        winnerId = ppSets.player1 > ppSets.player2 ? user.uid : (ppMode === 'singles' ? opponentId : (ppSets.player2 > ppSets.player1 ? opponentId : opponent2Id));
      } else {
        const p1Wins = ppRounds.filter(r => r.player1 > r.player2).length;
        const p2Wins = ppRounds.filter(r => r.player2 > r.player1).length;
        winnerId = p1Wins > p2Wins ? user.uid : (ppMode === 'singles' ? opponentId : (p2Wins > p1Wins ? opponentId : opponent2Id));
      }
      // Get display names for all players
      const getDisplayName = (id: string) => {
        if (id === user.uid) return user.displayName || user.email || user.uid;
        const found = opponents.find(o => o.id === id);
        return found ? found.displayName || found.email || found.id : id;
      };
      // Sanitize display name for Firestore document ID
      const sanitizeId = (name: string) => name.replace(/[^a-zA-Z0-9_-]/g, '');
      const now = new Date();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const time = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0') + String(now.getSeconds()).padStart(2, '0');
      const winnerName = sanitizeId(getDisplayName(winnerId));
      // Determine loserId
      let loserId = '';
      if (winnerId === user.uid) {
        loserId = opponentId;
      } else if (winnerId === opponentId) {
        loserId = user.uid;
      } else if (ppMode === 'doubles') {
        // For doubles, loser is the other team (teammateId or opponent2Id)
        loserId = [user.uid, teammateId].includes(winnerId) ? opponentId : user.uid;
      }
      const loserName = sanitizeId(getDisplayName(loserId));
      const matchDocId = `${month}${day}${time}-${winnerName}VS${loserName}`;
      // Build match object without undefined fields
      const match: any = {
        player1Id: user.uid,
        player1Name: getDisplayName(user.uid),
        player2Id: opponentId,
        player2Name: getDisplayName(opponentId),
        sport,
        mode: ppMode,
        roundsType,
        winnerId,
        winnerName: getDisplayName(winnerId),
        createdAt: Timestamp.now(),
        status: 'completed',
        ...(ppMode === 'doubles' && teammateId ? { teammateId, teammateName: getDisplayName(teammateId) } : {}),
        ...(ppMode === 'doubles' && opponent2Id ? { opponent2Id, opponent2Name: getDisplayName(opponent2Id) } : {}),
        ...(roundsType === 'sets' ? { score: { player1: ppSets.player1, player2: ppSets.player2 } } : {}),
        ...(roundsType === 'points' ? { rounds: ppRounds } : {}),
      };
      try {
        const matchRef = doc(collection(db, 'matcheData'), matchDocId);
        await setDoc(matchRef, match);
        // --- Update user stats and matches ---
        const statKey = sport === 'Ping Pong' ? (ppMode === 'singles' ? 'Ping Pong Singles' : 'Ping Pong Doubles') : sport;
        const playerIds = [user.uid, opponentId];
        if (ppMode === 'doubles') {
          playerIds.push(teammateId, opponent2Id);
        }
        for (const pid of playerIds) {
          // Fetch user doc
          const userSnap = await getDocs(collection(db, 'users'));
          const userDoc = userSnap.docs.find(d => d.id === pid);
          if (!userDoc) continue;
          const stats = userDoc.data().stats || {};
          const stat = stats[statKey] || { gamesPlayed: 0, wins: 0, losses: 0, pointDiff: 0 };
          const isWinner = match.winnerId === pid;
          let pointDiff = stat.pointDiff;
          if (roundsType === 'sets' && match.score) {
            pointDiff += pid === user.uid ? (ppSets.player1 - ppSets.player2) : (ppSets.player2 - ppSets.player1);
          } else if (roundsType === 'points' && match.rounds) {
            let p1 = 0, p2 = 0;
            match.rounds.forEach((r: PingPongRound) => { p1 += r.player1; p2 += r.player2; });
            pointDiff += pid === user.uid ? (p1 - p2) : (p2 - p1);
          }
          stats[statKey] = {
            gamesPlayed: stat.gamesPlayed + 1,
            wins: stat.wins + (isWinner ? 1 : 0),
            losses: stat.losses + (isWinner ? 0 : 1),
            pointDiff,
          };
          await updateDoc(doc(db, 'users', pid), {
            stats,
            matches: arrayUnion(matchRef.id),
          });
        }
        setSuccess('Match recorded successfully!');
        setSport('');
        setOpponentId('');
        setTeammateId('');
        setOpponent2Id('');
        setPpSets({ player1: 0, player2: 0 });
        setPpRounds([{ round: 1, player1: 0, player2: 0 }]);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
      return;
    }
    // --- Other sports fallback ---
    if (!opponentId || score.player1 < 0 || score.player2 < 0) {
      setError('Please select a sport, opponent, and enter valid scores.');
      return;
    }
    if (user.uid === opponentId) {
      setError('You cannot play against yourself.');
      return;
    }
    setLoading(true);
    const winnerId = score.player1 > score.player2 ? user.uid : opponentId;
    const match: Match = {
      player1Id: user.uid,
      player2Id: opponentId,
      sport,
      score,
      winnerId,
      createdAt: Timestamp.now(),
      status: 'completed',
    };
    try {
      await addDoc(collection(db, 'matches'), match);
      setSuccess('Match recorded successfully!');
      setSport('');
      setOpponentId('');
      setScore({ player1: 0, player2: 0 });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <InternalBox sx={{ p: 4, maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom>Record a Match</Typography>
      {opponents.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No opponents found. Make sure other users are registered in the system.
        </Alert>
      )}
      <form onSubmit={handleSubmit}>
        <TextField select label="Sport" fullWidth margin="normal" value={sport} onChange={e => setSport(e.target.value)} required>
          {sports.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>
        {sport === 'Ping Pong' && (
          <>
            <Box mt={2} mb={2}>
              <ToggleButtonGroup
                value={ppMode}
                exclusive
                onChange={(_, v) => v && setPpMode(v)}
                aria-label="Mode"
              >
                <ToggleButton value="singles">Singles</ToggleButton>
                <ToggleButton value="doubles">Doubles</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            {ppMode === 'singles' ? (
              <Autocomplete
                options={availableOpponents}
                getOptionLabel={o => o.displayName || o.email || ''}
                value={availableOpponents.find(o => o.id === opponentId) || null}
                onChange={(_, v) => setOpponentId(v ? v.id : '')}
                renderInput={params => <TextField {...params} label="Opponent" fullWidth margin="normal" required />}
                isOptionEqualToValue={(option, value) => option.id === value.id}
              />
            ) : (
              <>
                <Autocomplete
                  options={availableTeammates}
                  getOptionLabel={o => o.displayName || o.email || ''}
                  value={availableTeammates.find(o => o.id === teammateId) || null}
                  onChange={(_, v) => setTeammateId(v ? v.id : '')}
                  renderInput={params => <TextField {...params} label="Teammate" fullWidth margin="normal" required />}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                />
                <Autocomplete
                  options={availableOpponents}
                  getOptionLabel={o => o.displayName || o.email || ''}
                  value={availableOpponents.find(o => o.id === opponentId) || null}
                  onChange={(_, v) => setOpponentId(v ? v.id : '')}
                  renderInput={params => <TextField {...params} label="Opponent 1" fullWidth margin="normal" required />}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                />
                <Autocomplete
                  options={availableOpponent2}
                  getOptionLabel={o => o.displayName || o.email || ''}
                  value={availableOpponent2.find(o => o.id === opponent2Id) || null}
                  onChange={(_, v) => setOpponent2Id(v ? v.id : '')}
                  renderInput={params => <TextField {...params} label="Opponent 2" fullWidth margin="normal" required />}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                />
              </>
            )}
            <Box mt={2} mb={2}>
              <ToggleButtonGroup
                value={roundsType}
                exclusive
                onChange={(_, v) => v && setRoundsType(v)}
                aria-label="Scoring Type"
              >
                <ToggleButton value="sets">By Rounds (Sets)</ToggleButton>
                <ToggleButton value="points">By Points (Multiple Rounds)</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            {roundsType === 'sets' ? (
              <Box display="flex" gap={2} mt={2}>
                <TextField label="Your Sets Won" type="number" fullWidth value={ppSets.player1} onChange={e => setPpSets({ ...ppSets, player1: Number(e.target.value) })} required />
                <TextField label="Opponent Sets Won" type="number" fullWidth value={ppSets.player2} onChange={e => setPpSets({ ...ppSets, player2: Number(e.target.value) })} required />
              </Box>
            ) : (
              <Box>
                {ppRounds.map((r, idx) => (
                  <Box key={r.round} display="flex" alignItems="center" gap={1} mt={1}>
                    <Typography>Round {r.round}:</Typography>
                    <TextField label="You" type="number" size="small" value={r.player1} onChange={e => handleRoundChange(idx, 'player1', Number(e.target.value))} sx={{ width: 90 }} />
                    <TextField label={ppMode === 'singles' ? 'Opponent' : idx % 2 === 0 ? 'Opponents' : 'Opponents'} type="number" size="small" value={r.player2} onChange={e => handleRoundChange(idx, 'player2', Number(e.target.value))} sx={{ width: 90 }} />
                    <IconButton onClick={() => handleRemoveRound(idx)} disabled={ppRounds.length === 1} size="small"><Remove /></IconButton>
                  </Box>
                ))}
                <Button startIcon={<Add />} onClick={handleAddRound} sx={{ mt: 1 }}>
                  Add Round
                </Button>
              </Box>
            )}
          </>
        )}
        {/* Fallback for other sports */}
        {sport && sport !== 'Ping Pong' && (
          <TextField select label="Opponent" fullWidth margin="normal" value={opponentId} onChange={e => setOpponentId(e.target.value)} required>
            {opponents.map(o => <MenuItem key={o.id} value={o.id}>{o.displayName || o.email}</MenuItem>)}
          </TextField>
        )}
        {sport && sport !== 'Ping Pong' && (
          <Box display="flex" gap={2} mt={2}>
            <TextField label="Your Score" type="number" fullWidth value={score.player1} onChange={e => setScore({ ...score, player1: Number(e.target.value) })} required />
            <TextField label="Opponent's Score" type="number" fullWidth value={score.player2} onChange={e => setScore({ ...score, player2: Number(e.target.value) })} required />
          </Box>
        )}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
        <Box mt={3}>
          <Button type="submit" variant="contained" color="primary" fullWidth disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Record Match'}
          </Button>
        </Box>
      </form>
    </InternalBox>
  );
};

export default RecordGame;
