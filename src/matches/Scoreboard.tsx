import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../Backend/firebase';
import { Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Select, MenuItem, FormControl, InputLabel, CircularProgress, Button } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { InternalBox } from '../Backend/InternalBox';

interface PlayerStats {
  uid: string;
  displayName: string;
  email: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winPct: number;
  pointDiff: number;
  rankScore: number;
}



const sports = ['Ping Pong Singles', 'Ping Pong Doubles', 'Foosball', 'Pool'];

const Scoreboard: React.FC = () => {
  const [players, setPlayers] = useState<any[]>([]);
  const [sport, setSport] = useState('Ping Pong Singles');
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  // Refetch data every time the Scoreboard tab is entered
  const fetchData = async () => {
    setLoading(true);
    const usersSnap = await getDocs(collection(db, 'users'));
    const users = usersSnap.docs.map(doc => ({ ...doc.data(), uid: doc.id }));
    setPlayers(users);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [sport, location.pathname]);

  // Calculate stats for each player from user stats
  const playerStats: PlayerStats[] = players.map(player => {
    // Aggregate stats for the selected sport
    const statKey = sport;
    const stats = player.stats && player.stats[statKey] ? player.stats[statKey] : { gamesPlayed: 0, wins: 0, losses: 0, pointDiff: 0 };
    const gamesPlayed = stats.gamesPlayed || 0;
    const wins = stats.wins || 0;
    const losses = stats.losses || 0;
    const winPct = gamesPlayed > 0 ? wins / gamesPlayed : 0;
    const pointDiff = stats.pointDiff || 0;
    return {
      uid: player.uid,
      displayName: player.displayName || player.email,
      email: player.email,
      gamesPlayed,
      wins,
      losses,
      winPct,
      pointDiff,
      rankScore: 0, // to be set after normalization
    };
  });

  // Normalize and rank
  const maxGames = Math.max(...playerStats.map(p => p.gamesPlayed), 1);
  const maxDiff = Math.max(...playerStats.map(p => Math.abs(p.pointDiff)), 1);
  playerStats.forEach(p => {
    p.rankScore = p.winPct * 0.6 + (p.gamesPlayed / maxGames) * 0.2 + (maxDiff ? (p.pointDiff / maxDiff) * 0.2 : 0);
  });
  const ranked = [...playerStats].sort((a, b) => b.rankScore - a.rankScore);

  return (
    <InternalBox sx={{ p: 3, mb: 4 }}>
      <Box sx={{ p: 4, maxWidth: 900, mx: 'auto', mt: 4 }}>
        <Typography variant="h4" gutterBottom>Scoreboard</Typography>
        <Box display="flex" alignItems="center" mb={2} gap={2}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Sport</InputLabel>
            <Select value={sport} label="Sport" onChange={e => setSport(e.target.value)}>
              {sports.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
          <Button variant="outlined" onClick={fetchData} disabled={loading} sx={{ height: 40 }}>
            {loading ? <CircularProgress size={20} /> : 'Refresh'}
          </Button>
        </Box>
        {loading ? <CircularProgress /> : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Rank</TableCell>
                  <TableCell>Player</TableCell>
                  <TableCell>Games</TableCell>
                  <TableCell>Wins</TableCell>
                  <TableCell>Losses</TableCell>
                  <TableCell>Win %</TableCell>
                  <TableCell>Point Diff</TableCell>
                  <TableCell>Score</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ranked.map((p, i) => (
                  <TableRow key={p.uid}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>{p.displayName}</TableCell>
                    <TableCell>{p.gamesPlayed}</TableCell>
                    <TableCell>{p.wins}</TableCell>
                    <TableCell>{p.losses}</TableCell>
                    <TableCell>{(p.winPct * 100).toFixed(1)}%</TableCell>
                    <TableCell>{p.pointDiff}</TableCell>
                    <TableCell>{p.rankScore.toFixed(3)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </InternalBox>
  );
};

export default Scoreboard;
