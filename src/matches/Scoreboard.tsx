import React, { useEffect, useState } from 'react';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../Backend/firebase';
import { Typography, Box, Select, MenuItem, FormControl, InputLabel, CircularProgress, Button } from '@mui/material';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import { useLocation, useParams } from 'react-router-dom';
import { InternalBox } from '../Backend/InternalBox';
import { type Sport } from '../types/sports.ts';
import { type Match } from '../types/matches';

interface PlayerStatsRow {
  id: string;
  rank: number;
  playerName: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  ties: number;
  winPct: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDiff: number;
  avgPointsFor: number;
  avgPointsAgainst: number;
  gamesLast30Days: number;
  winStreakCurrent: number;
  winStreakBest: number;
  lossStreakCurrent: number;
  biggestWin: number;
  biggestLoss: number;
  avgGameDuration: number; // in minutes
  rankScore: number;
  customStats?: { [statName: string]: { total: number; highest: number; average: number } };
}

const Scoreboard: React.FC = () => {
  const { leagueId } = useParams<{ leagueId: string }>();
  const [league, setLeague] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const [sports, setSports] = useState<Sport[]>([]);
  const [selectedSport, setSelectedSport] = useState<Sport | null>(null);

  const fetchData = async () => {
    if (!leagueId) return;

    try {
      setLoading(true);
      // Fetch league
      const leagueRef = doc(db, 'leagues', leagueId);
      const leagueSnap = await getDoc(leagueRef);
      if (leagueSnap.exists()) {
        setLeague(leagueSnap.data());
      }

      // Fetch sports for this league
      const sportsRef = collection(db, 'leagues', leagueId, 'sports');
      const sportsSnap = await getDocs(sportsRef);
      const sportsData: Sport[] = sportsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sport));
      setSports(sportsData);
      if (sportsData.length > 0 && !selectedSport) {
        setSelectedSport(sportsData[0]);
      }

      // Fetch matches for this league
      const matchesRef = collection(db, 'matches');
      const matchesSnap = await getDocs(matchesRef);
      const matchesData: Match[] = matchesSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Match))
        .filter(match => match.leagueId === leagueId);
      setMatches(matchesData);
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

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
            ...userData
          };
        }
        return null;
      });
      const users = (await Promise.all(memberPromises)).filter(Boolean);
      setPlayers(users);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [location.pathname, leagueId]);

  useEffect(() => {
    if (league && league.members) {
      fetchMembers();
    }
  }, [league]);

  // Calculate comprehensive stats for each player
  const calculatePlayerStats = (): PlayerStatsRow[] => {
    return players.map((player) => {
      // Filter matches for current sport and player
      const playerMatches = matches.filter(match => 
        selectedSport && 
        match.sportId === selectedSport.id &&
        match.gameStats?.teams?.some(team => team.playerIds.includes(player.uid))
      );

      let wins = 0, losses = 0, ties = 0;
      let pointsFor = 0, pointsAgainst = 0;
      let currentStreak = 0;
      let maxWinStreak = 0, maxLossStreak = 0;
      let biggestWin = 0, biggestLoss = 0;
      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);
      let gamesLast30Days = 0;

      const customStatTotals: { [statName: string]: { values: number[], total: number } } = {};

      playerMatches.forEach(match => {
        const playerTeam = match.gameStats?.teams?.find(team => team.playerIds.includes(player.uid));
        const opponentTeam = match.gameStats?.teams?.find(team => !team.playerIds.includes(player.uid));
        
        if (!playerTeam || !opponentTeam) return;

        const teamScore = playerTeam.totalScore;
        const opponentScore = opponentTeam.totalScore;
        pointsFor += teamScore;
        pointsAgainst += opponentScore;

        // Determine win/loss/tie
        if (teamScore > opponentScore) {
          wins++;
          currentStreak = currentStreak >= 0 ? currentStreak + 1 : 1;
          maxWinStreak = Math.max(maxWinStreak, currentStreak);
          biggestWin = Math.max(biggestWin, teamScore - opponentScore);
        } else if (teamScore < opponentScore) {
          losses++;
          currentStreak = currentStreak <= 0 ? currentStreak - 1 : -1;
          maxLossStreak = Math.max(maxLossStreak, Math.abs(currentStreak));
          biggestLoss = Math.max(biggestLoss, opponentScore - teamScore);
        } else {
          ties++;
          currentStreak = 0;
        }

        // Check if match is in last 30 days
        if (match.createdAt.toDate() >= last30Days) {
          gamesLast30Days++;
        }

        // Calculate custom stats if sport tracks by player
        if (selectedSport?.trackByPlayer && selectedSport?.customStats && match.gameStats?.playerStats) {
          const playerStats = match.gameStats.playerStats[player.uid];
          if (playerStats) {
            selectedSport.customStats.forEach(stat => {
              if (!customStatTotals[stat.name]) {
                customStatTotals[stat.name] = { values: [], total: 0 };
              }
              const value = Number(playerStats.totalStats[stat.name]) || 0;
              customStatTotals[stat.name].values.push(value);
              customStatTotals[stat.name].total += value;
            });
          }
        }
      });

      const gamesPlayed = wins + losses + ties;
      const winPct = gamesPlayed > 0 ? wins / gamesPlayed : 0;
      const avgPointsFor = gamesPlayed > 0 ? pointsFor / gamesPlayed : 0;
      const avgPointsAgainst = gamesPlayed > 0 ? pointsAgainst / gamesPlayed : 0;
      const pointDiff = pointsFor - pointsAgainst;
      
      // Calculate current streaks
      const winStreak = currentStreak > 0 ? currentStreak : 0;
      const lossStreak = currentStreak < 0 ? Math.abs(currentStreak) : 0;

      // Process custom stats
      const customStats: { [statName: string]: { total: number; highest: number; average: number } } = {};
      Object.entries(customStatTotals).forEach(([statName, data]) => {
        customStats[statName] = {
          total: data.total,
          highest: Math.max(...data.values, 0),
          average: data.values.length > 0 ? data.total / data.values.length : 0
        };
      });

      // Calculate rank score (weighted formula)
      const maxGamesPlayed = Math.max(...players.map(p => 
        matches.filter(m => 
          selectedSport && 
          m.sportId === selectedSport.id &&
          m.gameStats?.teams?.some(t => t.playerIds.includes(p.uid))
        ).length
      ), 1);
      
      const rankScore = (
        winPct * 0.4 + 
        (gamesPlayed / maxGamesPlayed) * 0.2 +
        (pointDiff / Math.max(Math.abs(pointDiff), 1)) * 0.2 +
        (gamesLast30Days / Math.max(gamesLast30Days, 1)) * 0.1 +
        (maxWinStreak / Math.max(maxWinStreak, 1)) * 0.1
      );

      return {
        id: player.uid,
        rank: 0, // Will be set after sorting
        playerName: player.displayName || player.email || 'Unknown',
        gamesPlayed,
        wins,
        losses,
        ties,
        winPct,
        pointsFor,
        pointsAgainst,
        pointDiff,
        avgPointsFor,
        avgPointsAgainst,
        gamesLast30Days,
        winStreakCurrent: winStreak,
        winStreakBest: maxWinStreak,
        lossStreakCurrent: lossStreak,
        biggestWin,
        biggestLoss,
        avgGameDuration: 0, // TODO: Calculate if needed
        rankScore,
        customStats: Object.keys(customStats).length > 0 ? customStats : undefined
      };
    }).sort((a, b) => b.rankScore - a.rankScore).map((player, index) => ({
      ...player,
      rank: index + 1
    }));
  };

  const playerStats = calculatePlayerStats();

  // Define DataGrid columns
  const columns: GridColDef[] = [
    { field: 'rank', headerName: 'Rank', width: 100, type: 'number' },
    { field: 'playerName', headerName: 'Player', width: 200 },
    { field: 'gamesPlayed', headerName: 'Games Played', width: 140, type: 'number' },
    { field: 'wins', headerName: 'Wins', width: 100, type: 'number' },
    { field: 'losses', headerName: 'Losses', width: 100, type: 'number' },
    { field: 'ties', headerName: 'Ties', width: 100, type: 'number' },
    { 
      field: 'winPct', 
      headerName: 'Win %', 
      width: 120, 
      type: 'number',
      renderCell: (params: GridRenderCellParams) => `${(params.value * 100).toFixed(1)}%`
    },
    { field: 'pointsFor', headerName: 'Points For', width: 130, type: 'number' },
    { field: 'pointsAgainst', headerName: 'Points Against', width: 150, type: 'number' },
    { field: 'pointDiff', headerName: 'Point Diff', width: 130, type: 'number' },
    { 
      field: 'avgPointsFor', 
      headerName: 'Avg Points For', 
      width: 150, 
      type: 'number',
      renderCell: (params: GridRenderCellParams) => params.value.toFixed(1)
    },
    { 
      field: 'avgPointsAgainst', 
      headerName: 'Avg Points Against', 
      width: 170, 
      type: 'number',
      renderCell: (params: GridRenderCellParams) => params.value.toFixed(1)
    },
    { field: 'gamesLast30Days', headerName: '30 Day Games', width: 140, type: 'number' },
    { field: 'winStreakCurrent', headerName: 'Current Streak', width: 140, type: 'number' },
    { field: 'winStreakBest', headerName: 'Best Streak', width: 130, type: 'number' },
    { field: 'biggestWin', headerName: 'Biggest Win', width: 130, type: 'number' },
    { field: 'biggestLoss', headerName: 'Biggest Loss', width: 130, type: 'number' },
    { 
      field: 'rankScore', 
      headerName: 'Rank Score', 
      width: 130, 
      type: 'number',
      renderCell: (params: GridRenderCellParams) => params.value.toFixed(3)
    }
  ];

  // Add custom stat columns if sport has custom stats
  if (selectedSport?.trackByPlayer && selectedSport?.customStats) {
    selectedSport.customStats.forEach(stat => {
      columns.push({
        field: `${stat.name}_total`,
        headerName: `${stat.name} Total`,
        width: 140,
        type: 'number',
        renderCell: (params: GridRenderCellParams) => {
          const row = params.row as PlayerStatsRow;
          return row.customStats?.[stat.name]?.total?.toFixed(stat.dataType === 'number' ? 1 : 0) || '0';
        }
      });
      columns.push({
        field: `${stat.name}_highest`,
        headerName: `${stat.name} Highest`,
        width: 150,
        type: 'number',
        renderCell: (params: GridRenderCellParams) => {
          const row = params.row as PlayerStatsRow;
          return row.customStats?.[stat.name]?.highest?.toFixed(stat.dataType === 'number' ? 1 : 0) || '0';
        }
      });
      columns.push({
        field: `${stat.name}_avg`,
        headerName: `${stat.name} Average`,
        width: 150,
        type: 'number',
        renderCell: (params: GridRenderCellParams) => {
          const row = params.row as PlayerStatsRow;
          return row.customStats?.[stat.name]?.average?.toFixed(1) || '0.0';
        }
      });
    });
  }

  return (
    <InternalBox sx={{ p: 3, mb: 4 }}>
      <Box sx={{ p: 4, maxWidth: '100%', mx: 'auto', mt: 4 }}>
        <Typography variant="h4" gutterBottom>Scoreboard</Typography>
        <Box display="flex" alignItems="center" mb={2} gap={2}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Sport</InputLabel>
            <Select 
              value={selectedSport?.name || ''} 
              label="Sport" 
              onChange={e => setSelectedSport(sports.find(s => s.name === e.target.value) || null)}
            >
              {sports.map(s => <MenuItem key={s.id} value={s.name}>{s.name}</MenuItem>)}
            </Select>
          </FormControl>
          <Button variant="outlined" onClick={fetchData} disabled={loading} sx={{ height: 40 }}>
            {loading ? <CircularProgress size={20} /> : 'Refresh'}
          </Button>
        </Box>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={playerStats}
              columns={columns}
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 25 },
                },
              }}
              pageSizeOptions={[10, 25, 50]}
              disableRowSelectionOnClick
              sx={{
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid rgba(224, 224, 224, 1)',
                },
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  borderBottom: '2px solid rgba(224, 224, 224, 1)',
                  minHeight: '60px !important',
                },
                '& .MuiDataGrid-columnHeader': {
                  padding: '0 8px',
                  display: 'flex',
                  alignItems: 'center',
                  '& .MuiDataGrid-columnHeaderTitleContainer': {
                    display: 'flex',
                    alignItems: 'center',
                    flex: 1,
                    minWidth: 0,
                  },
                  '& .MuiDataGrid-columnHeaderTitle': {
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    marginRight: '4px',
                  },
                  '& .MuiDataGrid-sortIcon': {
                    width: '16px',
                    height: '16px',
                    marginLeft: '2px',
                  },
                  '& .MuiDataGrid-iconButtonContainer': {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '100%',
                    marginLeft: 'auto',
                    '& .MuiIconButton-root': {
                      padding: '4px',
                      fontSize: '1rem',
                    },
                  },
                  '& .MuiDataGrid-menuIcon': {
                    width: '16px',
                    height: '16px',
                  },
                },
                '& .MuiDataGrid-row:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                },
              }}
            />
          </Box>
        )}
      </Box>
    </InternalBox>
  );
};

export default Scoreboard;
