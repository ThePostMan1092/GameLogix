import React, { useState, useEffect } from 'react';
import { Typography, Box, Button, MenuItem, TextField, CircularProgress, Alert } from '@mui/material';
import { collection, addDoc, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../Backend/firebase';
import { useAuth } from '../Backend/AuthProvider';
import { InternalBox } from '../Backend/InternalBox';

export interface Score {
  player1: number;
  player2: number;
}

export interface Match {
  id?: string;
  player1Id: string;
  player2Id: string;
  sport: string;
  score: Score;
  winnerId: string;
  createdAt: Timestamp;
  status: 'completed';
}

// Available sports for company leagues
const sports = ['Ping Pong', 'Foosball', 'Pool', 'Basketball', 'Air Hockey'];

const RecordGame: React.FC = () => {
  const { user } = useAuth();
  const [opponents, setOpponents] = useState<any[]>([]);
  const [sport, setSport] = useState('');
  const [opponentId, setOpponentId] = useState('');
  const [score, setScore] = useState<Score>({ player1: 0, player2: 0 });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOpponents = async () => {
      if (!user) return;
      
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const allUsers = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Filter out current user
        const opponents = allUsers.filter(u => u.id !== user.uid);
        setOpponents(opponents);
      } catch (err) {
        console.error('Error fetching opponents:', err);
        setError('Failed to load opponents');
      }
    };

    fetchOpponents();
  }, [user]);

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
        player1Id: user.uid,
        player2Id: opponentId,
        sport,
        score,
        winnerId,
        createdAt: Timestamp.now(),
        status: 'completed'
      };

      await addDoc(collection(db, 'matches'), match);
      
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

  return (
    <InternalBox sx={{ p: 4, maxWidth: 600, mx: 'auto', mt: 4 }}>
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
        {/* Sport Selection */}
        <TextField
          select
          label="Sport"
          fullWidth
          margin="normal"
          value={sport}
          onChange={(e) => setSport(e.target.value)}
          required
        >
          {sports.map((sportOption) => (
            <MenuItem key={sportOption} value={sportOption}>
              {sportOption}
            </MenuItem>
          ))}
        </TextField>

        {/* Opponent Selection */}
        <TextField
          select
          label="Opponent"
          fullWidth
          margin="normal"
          value={opponentId}
          onChange={(e) => setOpponentId(e.target.value)}
          required
          disabled={opponents.length === 0}
        >
          {opponents.map((opponent) => (
            <MenuItem key={opponent.id} value={opponent.id}>
              {opponent.displayName || opponent.email || opponent.id}
            </MenuItem>
          ))}
        </TextField>

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
