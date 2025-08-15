import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Accordion, AccordionSummary, AccordionDetails, Divider, Stack, Button } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { type Sport, type CustomStat } from '../../types/sports';
import CloseIcon from '@mui/icons-material/Close';
import { v4 as uuidv4 } from 'uuid'; // npm install uuid
// If teamPostitioning is a default export:
import{ type teamPostitioning } from '../RecordGame'; // adjust path as needed
import { DataGrid, type GridColDef, type GridRowsProp } from '@mui/x-data-grid';
import type { GameStats, Team, Round, PlayerMatchStats, Match } from '../../types/matches';
import { Timestamp } from 'firebase/firestore';
import { collection, addDoc} from 'firebase/firestore';
import { db } from '../../Backend/firebase';
import { useAuth } from '../../Backend/AuthProvider';
import { usePlayerStats } from '../../hooks/usePlayerStats';

// Define a type for players (adjust as needed based on your user structure)

interface RoundBasedProps {
  selectedSport: Sport;
  players: teamPostitioning[];
  leagueId: string;
  onSuccess?: () => void;
}


const RoundBased: React.FC<RoundBasedProps> = ({ selectedSport, players, leagueId, onSuccess}) => {
  type RoundMeta = { id: string; idx: number; label: string };
  const team1Players = (players ?? []).slice(0, selectedSport.playersPerTeam || 1);
  const team2Players = (players ?? []).slice(selectedSport.playersPerTeam || 1, (selectedSport.playersPerTeam || 1) * 2);
  const [rounds, setRounds] = useState<RoundMeta[]>([{ id: uuidv4(), idx: 0, label: 'Round 1' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const user = useAuth().user;
  const { updateMatchStats } = usePlayerStats();


  const [teamScores, setTeamScores] = useState<{ [roundId: string]: { team1: number; team2: number } }>({
  [rounds[0].id]: { team1: 0, team2: 0 }
});

const [roundPlayerStats, setRoundPlayerStats] = useState<{
  [roundId: string]: { [playerId: string]: { [statName: string]: string | number } }
}>({
  [rounds[0].id]: Object.fromEntries(
    [...team1Players, ...team2Players].map(player => [player.playerId, {}])
  )
});
 
  const handleRoundStatChange = (
    roundId: string,
    playerId: string,
    statName: string,
    value: string | number
  ) => {
    setRoundPlayerStats(prev => ({
      ...prev,
      [roundId]: {
        ...prev[roundId],
        [playerId]: {
          ...(prev[roundId]?.[playerId] || {}),
          [statName]: value,
        },
      },
    }));
  };

  
  const addRound = () => {
    if (rounds.length < (selectedSport.maxRounds || 3)) {
      const newId = uuidv4();
      setRounds(prev => [...prev, { id: newId, idx: prev.length, label: `${selectedSport?.roundsName} ${prev.length + 1}` }]);
      setTeamScores(prev => ({
        ...prev,
        [newId]: { team1: 0, team2: 0 }
      }));
      setRoundPlayerStats(prev => ({
        ...prev,
        [newId]: Object.fromEntries(
          [...team1Players, ...team2Players].map(player => [player.playerId, {}])
        )
      }));
    }
  };


  const getRoundWins = (currentRoundIdx: number) => {
    let team1Wins = 0;
    let team2Wins = 0;
    rounds.forEach((roundMeta) => {
      if (roundMeta.idx <= currentRoundIdx) {
        const t1 = teamScores[roundMeta.id]?.team1 ?? 0;
        const t2 = teamScores[roundMeta.id]?.team2 ?? 0;
        if (t1 > t2) team1Wins += 1;
        else if (t2 > t1) team2Wins += 1;
        // ties are ignored
      }
    });
    return { team1Wins, team2Wins };
  };

  const buildGameStats = (): GameStats => {
    const team1PlayersFiltered = players.filter(p => p.teamid === 1);
    const team2PlayersFiltered = players.filter(p => p.teamid === 2);

    // Calculate team totals
    const team1Total = rounds.reduce((sum, round) => sum + (teamScores[round.id]?.team1 || 0), 0);
    const team2Total = rounds.reduce((sum, round) => sum + (teamScores[round.id]?.team2 || 0), 0);

    // Calculate rounds won
    const { team1Wins, team2Wins } = getRoundWins(rounds.length - 1);

    const teams: Team[] = [
      {
        teamId: 'team1',
        name: 'Team 1',
        playerIds: team1PlayersFiltered.map(p => p.playerId),
        totalScore: team1Total,
        roundsWon: team1Wins
      },
      {
        teamId: 'team2', 
        name: 'Team 2',
        playerIds: team2PlayersFiltered.map(p => p.playerId),
        totalScore: team2Total,
        roundsWon: team2Wins
      }
    ];

    const gameRounds: Round[] = rounds.map(round => ({
      roundId: round.id,
      roundNumber: round.idx + 1,
      teamScores: {
        team1: teamScores[round.id]?.team1 || 0,
        team2: teamScores[round.id]?.team2 || 0
      },
      playerStats: players.map(player => ({
        playerId: player.playerId,
        teamId: player.teamid === 1 ? 'team1' : 'team2',
        stats: roundPlayerStats[round.id]?.[player.playerId] || {}
      })),
      winnerId: (teamScores[round.id]?.team1 || 0) > (teamScores[round.id]?.team2 || 0) ? 'team1' : 
                (teamScores[round.id]?.team2 || 0) > (teamScores[round.id]?.team1 || 0) ? 'team2' : undefined
    }));

    // Build player match stats
    const playerStats: { [playerId: string]: PlayerMatchStats } = {};
    players.forEach(player => {
      const totalStats: { [statName: string]: string | number } = {};
      const roundStats: { [roundId: string]: { [statName: string]: string | number } } = {};
      
      // Aggregate stats across rounds
      selectedSport.customStats?.forEach(stat => {
        let total = 0;
        rounds.forEach(round => {
          const roundStat = roundPlayerStats[round.id]?.[player.playerId]?.[stat.name];
          roundStats[round.id] = roundStats[round.id] || {};
          roundStats[round.id][stat.name] = roundStat || (stat.dataType === 'number' ? 0 : '');
          
          if (stat.dataType === 'number' && typeof roundStat === 'number') {
            total += roundStat;
          }
        });
        totalStats[stat.name] = stat.dataType === 'number' ? total : '';
      });

      playerStats[player.playerId] = {
        playerId: player.playerId,
        teamId: player.teamid === 1 ? 'team1' : 'team2',
        totalStats,
        roundStats
      };
    });

    // Determine winner
    const finishingResults: string[] = teams.map(team => team.teamId);

    if (selectedSport.winCondition === 'First to round limit') {
      finishingResults.sort((a, b) => {
        const teamAWins = teams.find(team => team.teamId === a)?.roundsWon || 0;
        const teamBWins = teams.find(team => team.teamId === b)?.roundsWon || 0;
        return teamBWins - teamAWins; // Sort descending by rounds won
      });
    } else {
      finishingResults.sort((a, b) => {
        const teamAScore = teams.find(team => team.teamId === a)?.totalScore || 0;
        const teamBScore = teams.find(team => team.teamId === b)?.totalScore || 0;
        return teamBScore - teamAScore; // Sort descending by total score
      });
    }

    return {
      gameId: uuidv4(),
      sportId: selectedSport.id,
      date: Timestamp.now(),
      teams,
      rounds: gameRounds,
      playerStats: selectedSport.trackByPlayer ? playerStats : undefined,
      finishingResults,
      totalScore: { team1: team1Total, team2: team2Total },
      status: 'completed'
    };
  };

  const handleSubmit = async () => {
    if (players.length < 2) {
      setError('Please select all players before submitting.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    console.log(loading, error, success)

    try {
      const gameStats = buildGameStats();
      // Create match document for Firestore
      const match: Match = {
        id: `${user?.displayName} - ${selectedSport.name} - ${Timestamp.now().toMillis()}`,
        leagueId: leagueId,
        sportId: selectedSport.id,
        createdAt: Timestamp.now(),
        status: 'completed',
        gameEvent: 'simpleMatch',
        gameStats: gameStats
      };

      // Save to Firestore as subcollection within the sport
      await addDoc(collection(db, 'leagues', leagueId, 'sports', selectedSport.id, 'matches'), match);
      
      // Update player statistics
      try {
        await updateMatchStats(match);
        console.log('Player stats updated successfully');
      } catch (statsError) {
        console.error('Failed to update player stats:', statsError);
        // Don't fail the entire operation if stats update fails
      }
      
      setSuccess('Match recorded successfully!');
      
      // Reset all state after successful submission
      setTimeout(() => {
        const firstRoundId = uuidv4();
        setRounds([{ id: firstRoundId, idx: 0, label: 'Round 1' }]);
        setTeamScores({ [firstRoundId]: { team1: 0, team2: 0 } });
        setRoundPlayerStats({
          [firstRoundId]: Object.fromEntries(
            players.map(player => [player.playerId, {}])
          )
        });
        setError('');
        setSuccess('');
        onSuccess?.();
      }, 2000);

    } catch (err) {
      console.error('Error recording match:', err);
      setError('Failed to record match. Please try again.');
    } finally {
      setLoading(false);
    }
  };

    // Create DataGrid rows for player stats
  const createPlayerStatsRows = (roundId: string): GridRowsProp => {
    return players.map((player) => {
      const row: any = {
        id: player.playerId,
        playerName: player.displayName,
        teamId: player.teamid === 1 ? 'Team 1' : 'Team 2',
      };

      // Add custom stats as columns
      selectedSport.customStats?.forEach(stat => {
        row[stat.name] = roundPlayerStats[roundId]?.[player.playerId]?.[stat.name] ?? 
          (stat.dataType === 'number' ? 0 : '');
      });

      return row;
    });
  };

  // Create DataGrid columns for player stats
  const createPlayerStatsColumns = (): GridColDef[] => {
    const baseColumns: GridColDef[] = [
      {
        field: 'playerName',
        headerName: 'Player',
        width: 150,
        editable: false,
      },
      {
        field: 'teamId',
        headerName: 'Team',
        width: 100,
        editable: false,
      },
    ];

    const statColumns: GridColDef[] = selectedSport.customStats?.filter(stat => stat.affectsScore).map((stat: CustomStat) => ({
      field: stat.name,
      headerName: stat.name,
      width: 120,
      editable: true,
      type: stat.dataType === 'number' ? 'number' : 'string',
      headerAlign: 'center' as const,
      align: 'center' as const,
    })) || [];

    const otherColumns: GridColDef[] = selectedSport.customStats?.filter(stat => !stat.affectsScore).map((stat: CustomStat) => ({
      field: stat.name,
      headerName: stat.name,
      width: 120,
      editable: true,
      type: stat.dataType === 'number' ? 'number' : 'string',
      headerAlign: 'center' as const,
      align: 'center' as const,
    })) || [];

    return [...baseColumns, ...statColumns, ...otherColumns];
  };

  useEffect(() => {
    // Debug: show which stats are being summed
    const mainScoreStats = selectedSport.customStats?.filter(stat => stat.affectsScore) || [];
    console.log('Main score stats:', mainScoreStats);

    const updatedScores: { [roundId: string]: { team1: number; team2: number } } = {};
    rounds.forEach(round => {
      mainScoreStats.forEach(stat => {
        const allRows = players.map(player => {
          const playerStats = roundPlayerStats[round.id]?.[player.playerId] || {};
          let score = 0;
          if (stat.dataType === 'number') {
            score = Number(playerStats[stat.name]) || 0;
          } else if (stat.dataType === 'counter' && stat.pointValue) {
            score = Number(playerStats[stat.name]) * stat.pointValue || 0;
          }
          return {
            teamid: player.teamid,
            score: score
          };
        });

        console.log('All rows for round', round.id, allRows);
        updatedScores[round.id] = {
          team1: allRows.filter(r => r.teamid === 1).reduce((sum, r) => sum + r.score, 0),
          team2: allRows.filter(r => r.teamid === 2).reduce((sum, r) => sum + r.score, 0)
        };
        console.log(`Updated scores for round ${round.id}:`, updatedScores[round.id]);
      });
    });

    setTeamScores(updatedScores);
  }, [roundPlayerStats, rounds, players, selectedSport.customStats]);

  return (
    <Box>
      <Divider sx={{ mt: 2 }}>Score Inputs</Divider>
      <Button
        variant="contained"
        onClick={addRound}
        fullWidth
        size="small"
        disabled={rounds.length >= (selectedSport.maxRounds || 3)}
        data-testid="add-round-button"
        sx={{
          mb: 2,
          mt: 1,
          opacity: rounds.length >= (selectedSport.maxRounds || 3) ? 0.5 : 1,
          pointerEvents: rounds.length >= (selectedSport.maxRounds || 3) ? 'none' : 'auto',
          backgroundColor: rounds.length >= (selectedSport.maxRounds || 3) ? 'grey.400' : '#E2B5A6',
        }}
      >
        Add Round
      </Button>
      {rounds.map((round, displayIdx) => (
        <Accordion key={round.id}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <Button
                size="small"
                onClick={e => {
                  e.stopPropagation();
                    setRounds(prev => {
                    const filtered = prev.filter(r => r.id !== round.id);
                    // Re-label rounds to match new indices
                    return filtered.map((r, idx) => ({
                      ...r,
                      idx,
                      label: `Round ${idx + 1}`,
                    }));
                    });
                  setTeamScores(prev => {
                    const updated = { ...prev };
                    delete updated[round.id];
                    return updated;
                  });
                  setRoundPlayerStats(prev => {
                    const updated = { ...prev };
                    delete updated[round.id];
                    return updated;
                  });
                }}
                sx={{ minWidth: 0, ml: -2, color: '#E2B5A6' }}
                disabled={rounds.length <= 1}
              >
                <CloseIcon />
              </Button>
              <Typography sx={{ flex: 1 }}>{round.label}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '30%', gap: 0 }}>
                <Typography sx={{ flex: 1, textAlign: 'right', fontSize: '1rem', color: 'text.secondary', minWidth: 32 }}>
                  {teamScores[round.id]?.team1 ?? 0}
                </Typography>
                <Typography sx={{ flex: 1, textAlign: 'center', fontSize: '2.3rem', color: 'text.secondary', mx: 1, minWidth: 48 }}>
                  {/* You may need to update getRoundWins to accept round.id or displayIdx */}
                  {getRoundWins(displayIdx).team1Wins} - {getRoundWins(displayIdx).team2Wins}
                </Typography>
                <Typography sx={{ flex: 1, textAlign: 'left', fontSize: '1rem', color: 'text.secondary', minWidth: 32 }}>
                  {teamScores[round.id]?.team2 ?? 0}
                </Typography>
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ backgroundColor: 'background.paper', opacity: 0.85 }}>
            {(!selectedSport.trackByPlayer) && (
              <Stack direction="row" gap={4} sx={{ mb: 2 }}>
                {(['team1', 'team2'] as const).map((team, tIdx) => (
                  <Box key={team} sx={{ flex: 1 }}>
                    <TextField
                      label={`Team ${tIdx + 1} Score`}
                      type="number"
                      variant="standard"
                      value={teamScores[round.id]?.[team] ?? 0}
                      onChange={e => {
                        const value = Number(e.target.value);
                        setTeamScores(prev => ({
                          ...prev,
                          [round.id]: {
                            ...prev[round.id],
                            [team]: value
                          }
                        }));
                      }}
                      fullWidth
                      margin="normal"
                      inputProps={{ min: 0 }}
                    />
                  </Box>
                ))}
              </Stack>
            )}
            {selectedSport.trackByPlayer && selectedSport.customStats && selectedSport.customStats.length > 0 && (
              <Box>
                <Divider sx={{ mb: 2 }}>Player Stats</Divider>
                <Box sx={{ height: 300, width: '100%' }}>
                  <DataGrid
                    rows={createPlayerStatsRows(round.id)}
                    columns={createPlayerStatsColumns()}
                    processRowUpdate={(newRow, oldRow) => {
                      selectedSport.customStats?.forEach(stat => {
                        if (newRow[stat.name] !== oldRow[stat.name]) {
                          handleRoundStatChange(round.id, newRow.id, stat.name, newRow[stat.name]);
                        }
                      });
                      return newRow;
                    }}
                    hideFooter
                    disableColumnMenu
                    disableColumnSelector
                    disableRowSelectionOnClick
                    sx={{
                      '& .MuiDataGrid-cell': {
                        borderBottom: '1px solid rgba(224, 224, 224, 1)',
                      },
                      '& .MuiDataGrid-columnHeaders': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        borderBottom: '2px solid rgba(224, 224, 224, 1)',
                      },
                      '& .MuiDataGrid-cell:focus': {
                        outline: 'none',
                      },
                      '& .MuiDataGrid-row:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                      },
                    }}
                  />
                </Box>
              </Box>
            )}
          </AccordionDetails>
        </Accordion>
      ))}
      <Button
        variant="contained"
        onClick={handleSubmit}
        fullWidth
        size="large"
        sx={{ mt: 2, mb: 2, backgroundColor: '#E2B5A6' }}
      >
        Record Match Results
      </Button>
    </Box>
  );
}

export default RoundBased;