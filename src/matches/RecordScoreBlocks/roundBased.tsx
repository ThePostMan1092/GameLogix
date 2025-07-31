import React, { useState } from 'react';
import { Box, Typography, TextField, Accordion, AccordionSummary, AccordionDetails, Divider, Stack, Button } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { type Sport, type CustomStat } from '../../types/sports';
import CloseIcon from '@mui/icons-material/Close';
import { v4 as uuidv4 } from 'uuid'; // npm install uuid
// If teamPostitioning is a default export:
import{ type teamPostitioning } from '../RecordGame'; // adjust path as needed

// Define a type for players (adjust as needed based on your user structure)

interface RoundBasedProps {
  selectedSport: Sport;
  players: teamPostitioning[];
  onSubmit?: (data: GameStats) => void;
}

interface GameStats {
  gameId: string;
  sportId: string;
  date: string; // ISO or Firestore Timestamp
  teams: Team[];
  rounds: Round[];
  winnerTeamId?: string;
  winnerPlayerId?: string; // For solo sports
  status: 'completed' | 'pending' | 'cancelled';
}

interface Team {
  teamId: string;
  name: string;
  playerIds: string[];
  score?: number; // total score if needed
}

interface Round {
  roundNumber: number;
  teamScores: { [teamId: string]: number }; // supports any number of teams
  playerStats: PlayerStats[]; // stats for all players in this round
}

interface PlayerStats {
  playerId: string;
  teamId: string;
  stats: { [statName: string]: string | number };
}

const RoundBased: React.FC<RoundBasedProps> = ({ selectedSport, players}) => {
  type RoundMeta = { id: string; idx: number; label: string };
  const team1Players = (players ?? []).slice(0, selectedSport.playersPerTeam || 1);
  const team2Players = (players ?? []).slice(selectedSport.playersPerTeam || 1, (selectedSport.playersPerTeam || 1) * 2);
  const [rounds, setRounds] = useState<RoundMeta[]>([{ id: uuidv4(), idx: 0, label: 'Round 1' }]);

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
      setRounds(prev => [...prev, { id: newId, idx: prev.length, label: `Round ${prev.length + 1}` }]);
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
            {selectedSport.trackByPlayer && (
              <Box>
                <Divider sx={{ mb: 1 }}>Player Stats</Divider>
                {(players ?? []).map(player => (
                  <Accordion key={player.playerId + '-' + round.id}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography>
                        {player.displayName || player.playerId}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      {selectedSport.customStats?.map((stat: CustomStat) => (
                        <TextField
                          key={stat.name}
                          label={stat.name}
                          type={stat.dataType === 'number' ? 'number' : 'text'}
                          fullWidth
                          margin="normal"
                          value={roundPlayerStats[round.id]?.[player.playerId]?.[stat.name] ?? ''}
                          onChange={e =>
                            handleRoundStatChange(
                              round.id,
                              player.playerId,
                              stat.name,
                              e.target.value
                            )
                          }
                        />
                      ))}
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            )}
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}

export default RoundBased;