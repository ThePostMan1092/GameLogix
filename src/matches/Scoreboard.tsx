import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../Backend/firebase';
import { Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Select, MenuItem, FormControl, InputLabel, CircularProgress, Button } from '@mui/material';
import { useLocation, useParams } from 'react-router-dom';
import { InternalBox } from '../Backend/InternalBox';
import { type Player } from '../types/playerDb';

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
  const { leagueId } = useParams<{ leagueId: string }>();
  const [league, setLeague] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [sport, setSport] = useState('Ping Pong Singles');
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const [members, setMembers] = useState<Player[]>([]);

  useEffect(() => {
    if (league && league.members) {
      fetchMembers();
    }
  }, [league]);
  
    const fetchMembers = async () => {
      if (!league || !league.members) return;
      
      try {
        const memberPromises = league.members.map(async (memberId: string) => {
          const userRef = doc(db, 'users', memberId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            return {
              uid: memberId,
              email: userData.email || 'No email',
              displayName: userData.displayName,
              isAdmin: memberId === league.adminId
            };
          }
          return null;
        });
  
        const membersData = await Promise.all(memberPromises);
        setMembers(membersData.filter(member => member !== null) as Player[]);
      } catch (error) {
        console.error('Error fetching members:', error);
      }
    };

  // Refetch data every time the Scoreboard tab is entered
  const fetchData = async () => {
    setLoading(true);
    if (!leagueId) {
      setPlayers([]);
      setLoading(false);
      return;
    }
    try {
      // Fetch the league document
      const leagueRef = doc(db, 'leagues', leagueId);
      const leagueSnap = await getDoc(leagueRef);
      if (!leagueSnap.exists()) {
        setPlayers([]);
        setLoading(false);
        return;
      }
      const leagueData = leagueSnap.data();
      setLeague(leagueData);

      // Fetch all member user documents
      const memberIds = leagueData.members || [];
      const memberPromises = memberIds.map(async (memberId: string) => {
        const userRef = doc(db, 'users', memberId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          return { ...userSnap.data(), uid: memberId };
        }
        return null;
      });
      const users = (await Promise.all(memberPromises)).filter(Boolean);
      setPlayers(users);

      // Optionally set the default sport
      setSport(sports[0]);
    } catch (error) {
      console.error('Error fetching data:', error);
      setPlayers([]);
    } finally {
      setLoading(false);
    }
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
