// filepath: /Users/nathanielpost/GameLogix/src/matches/RecordScoreBlocks/individualPoints.tsx
import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Divider, Stack, Button, Chip, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { type Sport, type CustomStat } from '../../types/sports';
import { v4 as uuidv4 } from 'uuid';
import { type teamPostitioning } from '../RecordGame';
import type { GameStats, Team, PlayerMatchStats, Match } from '../../types/matches';
import { Timestamp } from 'firebase/firestore';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../Backend/firebase';
import { useAuth } from '../../Backend/AuthProvider';

interface IndividualPointsProps {
  selectedSport: Sport;
  players: teamPostitioning[];
  leagueId: string;
  onSuccess?: () => void;
}

const IndividualPoints: React.FC<IndividualPointsProps> = ({ 
  selectedSport, 
  players, 
  leagueId, 
  onSuccess 
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Individual player scores and stats
  const [playerScores, setPlayerScores] = useState<{ [playerId: string]: number }>({});
  const [playerStats, setPlayerStats] = useState<{
    [playerId: string]: { [statName: string]: string | number }
  }>({});

  // Initialize scores and stats for all players
  useEffect(() => {
    const initialScores: { [playerId: string]: number } = {};
    const initialStats: { [playerId: string]: { [statName: string]: string | number } } = {};
    
    players.forEach(player => {
      if (player.playerId) {
        initialScores[player.playerId] = 0;
        initialStats[player.playerId] = {};
        
        // Initialize custom stats if any
        selectedSport.customStats?.forEach(stat => {
          initialStats[player.playerId][stat.name] = stat.dataType === 'number' ? 0 : '';
        });
      }
    });
    
    setPlayerScores(initialScores);
    setPlayerStats(initialStats);
  }, [players, selectedSport]);

  const handleScoreChange = (playerId: string, score: number) => {
    setPlayerScores(prev => ({
      ...prev,
      [playerId]: score
    }));
  };

  const handleStatChange = (
    playerId: string,
    statName: string,
    value: string | number
  ) => {
    setPlayerStats(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [statName]: value,
      },
    }));
  };

  const getScoreAffectingStats = () => {
    return selectedSport.customStats?.filter(stat => stat.affectsScore) || [];
  };

  const getNonScoreAffectingStats = () => {
    return selectedSport.customStats?.filter(stat => !stat.affectsScore) || [];
  };

  const getPlayerDisplayScore = (playerId: string) => {
    // Main score plus any score-affecting stats
    const mainScore = playerScores[playerId] || 0;
    const scoreAffectingStats = getScoreAffectingStats();
    
    let totalScore = mainScore;
    scoreAffectingStats.forEach(stat => {
      const statValue = playerStats[playerId]?.[stat.name];
      if (stat.dataType === 'number' && typeof statValue === 'number' && stat.pointValue) {
        totalScore += statValue * stat.pointValue;
      }
    });
    
    return totalScore;
  };

  const getPlayerRanking = () => {
    return players
      .filter(p => p.playerId)
      .sort((a, b) => getPlayerDisplayScore(b.playerId) - getPlayerDisplayScore(a.playerId))
      .map((player, index) => ({ ...player, rank: index + 1 }));
  };

  const buildGameStats = (): GameStats => {
    const rankedPlayers = getPlayerRanking();
    
    // Create a "team" for each individual player
    const teams: Team[] = players
      .filter(p => p.playerId)
      .map(player => ({
        teamId: `team${player.teamid}`,
        name: player.displayName,
        playerIds: [player.playerId],
        totalScore: getPlayerDisplayScore(player.playerId),
        roundsWon: 0 // Not applicable for individual scoring
      }));

    // Build player match stats
    const matchPlayerStats: { [playerId: string]: PlayerMatchStats } = {};
    players.forEach(player => {
      if (player.playerId) {
        matchPlayerStats[player.playerId] = {
          playerId: player.playerId,
          teamId: `team${player.teamid}`,
          totalStats: {
            score: getPlayerDisplayScore(player.playerId),
            ...playerStats[player.playerId]
          },
          roundStats: {} // No rounds in individual scoring
        };
      }
    });

    // Calculate total scores for the game
    const totalScores = players.reduce((acc, player, index) => {
      if (player.playerId) {
        acc[`team${index + 1}`] = getPlayerDisplayScore(player.playerId);
      }
      return acc;
    }, {} as { [key: string]: number });

    return {
      gameId: uuidv4(),
      sportId: selectedSport.id,
      date: Timestamp.now(),
      teams,
      playerStats: matchPlayerStats,
      finishingResults: rankedPlayers.map(p => `team${p.teamid}`),
      totalScore: totalScores as { team1: number; team2: number }, // Will be extended for more teams
      status: 'completed'
    };
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate that all players have been selected
      const unselectedPlayers = players.filter(p => !p.playerId || p.playerId === '');
      if (unselectedPlayers.length > 0) {
        throw new Error('Please select all players before submitting.');
      }

      // Validate that we have at least 2 players
      if (players.length < 2) {
        throw new Error('You need at least 2 players to record a match.');
      }

      if (!user) {
        throw new Error('You must be logged in to record a match.');
      }

      const gameStats = buildGameStats();
      
      const matchData: Omit<Match, 'id'> = {
        leagueId,
        sportId: selectedSport.id,
        createdAt: Timestamp.now(),
        status: 'completed',
        gameEvent: 'simpleMatch',
        gameStats
      };

      const docRef = await addDoc(collection(db, 'matches'), matchData);
      console.log('Match saved with ID:', docRef.id);
      
      setSuccess('Match recorded successfully!');
      onSuccess?.();
    } catch (err) {
      console.error('Error saving match:', err);
      setError(err instanceof Error ? err.message : 'Failed to save match');
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = players.every(p => p.playerId) && players.length >= 2;
  const rankedPlayers = getPlayerRanking();

  return (
    <>
      <Divider sx={{ mt: 3, mb: 2 }}>Score Recording</Divider>
      
      <Box sx={{ mt: 2, mb: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Record the final scores and stats for each player. Players will be ranked by their scores.
        </Typography>

        {error && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
            <Typography color="error.dark">{error}</Typography>
          </Box>
        )}

        {success && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
            <Typography color="success.dark">{success}</Typography>
          </Box>
        )}

        <Stack spacing={2}>
          {players.map((player, index) => (
            <Accordion key={player.teamid} disabled={!player.playerId}
              >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls={`player-${player.teamid}-content`}
                id={`player-${player.teamid}-header`}
                sx={{
                  bgcolor: player.playerId ? 'background.default' : 'action.disabled',
                  '&:hover': {
                    bgcolor: player.playerId ? 'action.hover' : 'action.disabled'
                  }
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                  <Box display="flex" alignItems="center" gap={2}>
                    <Typography variant="h6">
                      {player.displayName || `Player ${index + 1}`}
                    </Typography>
                    {rankedPlayers.find(p => p.playerId === player.playerId) && (
                      <Chip 
                        label={`#${rankedPlayers.find(p => p.playerId === player.playerId)?.rank}`} 
                        color="primary" 
                        size="small" 
                      />
                    )}
                  </Box>
                  
                  <Box display="flex" alignItems="center" gap={2} sx={{ mr: 2 }}>
                    
                    {getScoreAffectingStats().map((stat: CustomStat) => (
                      <TextField
                        key={stat.name}
                        label={stat.name}
                        type={stat.dataType === 'number' ? 'number' : 'text'}
                        value={playerStats[player.playerId]?.[stat.name] || (stat.dataType === 'number' ? 0 : '')}
                        onChange={(e) => {
                          const value = stat.dataType === 'number' 
                            ? parseInt(e.target.value) || 0 
                            : e.target.value;
                          handleStatChange(player.playerId, stat.name, value);
                        }}
                        disabled={!player.playerId}
                        size="small"
                        sx={{ width: 120 }}
                        inputProps={stat.dataType === 'number' ? { min: 0 } : {}}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ))}
                    
                    <Chip 
                      label={`Total: ${getPlayerDisplayScore(player.playerId)}`}
                      color="secondary"
                      variant="outlined"
                    />
                  </Box>
                </Box>
              </AccordionSummary>
              
              <AccordionDetails>
                <Box sx={{ p: 2 }}>
                  <Typography variant="subtitle1" sx={{ mb: 2 }}>
                    Additional Statistics for {player.displayName}
                  </Typography>
                  
                  {getNonScoreAffectingStats().length > 0 ? (
                    <Stack spacing={2}>
                      {getNonScoreAffectingStats().map((stat: CustomStat) => (
                        <TextField
                          key={stat.name}
                          label={stat.name}
                          type={stat.dataType === 'number' ? 'number' : 'text'}
                          value={playerStats[player.playerId]?.[stat.name] || (stat.dataType === 'number' ? 0 : '')}
                          onChange={(e) => {
                            const value = stat.dataType === 'number' 
                              ? parseInt(e.target.value) || 0 
                              : e.target.value;
                            handleStatChange(player.playerId, stat.name, value);
                          }}
                          disabled={!player.playerId}
                          size="small"
                          fullWidth
                          inputProps={stat.dataType === 'number' ? { min: 0 } : {}}
                          helperText={stat.description}
                        />
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No additional statistics configured for this sport.
                    </Typography>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>

        {/* Leaderboard Preview */}
        {rankedPlayers.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Current Standings</Typography>
            <Stack spacing={1}>
              {rankedPlayers.map((player) => (
                <Box 
                  key={player.playerId}
                  display="flex" 
                  justifyContent="space-between" 
                  alignItems="center"
                  sx={{ 
                    p: 1, 
                    bgcolor: player.rank === 1 ? 'gold' : player.rank === 2 ? 'silver' : player.rank === 3 ? '#CD7F32' : 'grey.100',
                    borderRadius: 1,
                    color: player.rank <= 3 ? 'white' : 'text.primary'
                  }}
                >
                  <Typography variant="body1">
                    #{player.rank} {player.displayName}
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {getPlayerDisplayScore(player.playerId)} points
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
            size="large"
            sx={{ minWidth: 200 }}
          >
            {loading ? 'Recording Match...' : 'Record Match Results'}
          </Button>
        </Box>

        {!canSubmit && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
            <Typography variant="body2" color="warning.dark" textAlign="center">
              {players.length < 2 
                ? 'You need at least 2 players to record a match.'
                : 'Please ensure all player slots are filled before submitting.'
              }
            </Typography>
          </Box>
        )}
      </Box>
    </>
  );
};

export default IndividualPoints;