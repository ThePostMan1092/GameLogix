import React, { useState } from 'react';
import { Box, Typography, TextField, Accordion, AccordionSummary, AccordionDetails, MenuItem, Divider, Stack, Button } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { type Sport, type CustomStat } from '../../types/sports';

interface RoundBasedProps {
  selectedSport: Sport;
  leagueMembers: Array<{ id: string; displayName?: string; email?: string }>;
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


interface TeamScore {
  team1: number[];
  team2: number[];
}

const RoundBased: React.FC<RoundBasedProps> = ({ selectedSport, leagueMembers }) => {
  const [teamScores, setTeamScores] = useState<TeamScore>({
    team1: Array(selectedSport.maxRounds || 3).fill(0),
    team2: Array(selectedSport.maxRounds || 3).fill(0),
  });

  const team1Players = leagueMembers.slice(0, selectedSport.playersPerTeam || 1);
  const team2Players = leagueMembers.slice(selectedSport.playersPerTeam || 1, (selectedSport.playersPerTeam || 1) * 2);

  const [roundPlayerStats, setRoundPlayerStats] = useState<
  { [roundIdx: number]: { [playerId: string]: { [statName: string]: string | number } } }
>(
  // Initialize for each round and player
  Array(selectedSport.maxRounds || 3)
    .fill(null)
    .reduce((acc, _, roundIdx) => {
      acc[roundIdx] = {};
      [...team1Players, ...team2Players].forEach(player => {
        acc[roundIdx][player.id] = {};
      });
      return acc;
    }, {} as { [roundIdx: number]: { [playerId: string]: { [statName: string]: string | number } } })
);

  const [playerStats, setPlayerStats] = useState<{ [playerId: string]: { [statName: string]: string | number } }>({});


  const handleScoreChange = (team: 'team1' | 'team2', roundIdx: number, value: number) => {
    setTeamScores(prev => ({
      ...prev,
      [team]: prev[team].map((score, idx) => (idx === roundIdx ? value : score)),
    }));
  };

  const handleRoundStatChange = (
    roundIdx: number,
    playerId: string,
    statName: string,
    value: string | number
  ) => {
    setRoundPlayerStats(prev => ({
      ...prev,
      [roundIdx]: {
        ...prev[roundIdx],
        [playerId]: {
          ...(prev[roundIdx]?.[playerId] || {}),
          [statName]: value,
        },
      },
    }));
  };

  // Example: Construct GameStats object for submission
  const buildGameStats = (): GameStats => {
    const teams: Team[] = [
      {
        teamId: 'team1',
        name: 'Team 1',
        playerIds: team1Players.map(p => p.id),
        score: teamScores.team1.reduce((a, b) => a + b, 0),
      },
      {
        teamId: 'team2',
        name: 'Team 2',
        playerIds: team2Players.map(p => p.id),
        score: teamScores.team2.reduce((a, b) => a + b, 0),
      },
    ];

    const rounds: Round[] = (teamScores.team1.map((_, idx) => ({
      roundNumber: idx + 1,
      teamScores: {
        team1: teamScores.team1[idx],
        team2: teamScores.team2[idx],
      },
      playerStats: [...team1Players, ...team2Players].map(player => ({
        playerId: player.id,
        teamId: teams.find(t => t.playerIds.includes(player.id))?.teamId || '',
        stats: playerStats[player.id] || {},
      })),
    })));

    // Determine winner team by total score
    let winnerTeamId: string | undefined;
    if (teams[0].score !== undefined && teams[1].score !== undefined) {
      winnerTeamId = teams[0].score > teams[1].score ? teams[0].teamId : teams[1].teamId;
    }

    return {
      gameId: '', // Fill as needed
      sportId: selectedSport.id,
      date: new Date().toISOString(),
      teams,
      rounds,
      winnerTeamId,
      status: 'completed',
    };
  };


  return (
    <Box>
      <Divider sx={{mt:2}}>Score Inputs</Divider>
      <Typography variant="h5" gutterBottom>
        {selectedSport.name} - Round Based Scoring
      </Typography>
      <Divider sx={{ mb: 2 }} />

      {/* Team Scores by Round */}
      <Stack direction="row" gap={4} sx={{ mb: 3 }}>
        {['team1', 'team2'].map((team, tIdx) => (
          <Box key={team} sx={{ flex: 1 }}>
            <Typography variant="h6">{`Team ${tIdx + 1} Scores`}</Typography>
            {teamScores[team as keyof TeamScore].map((score, roundIdx) => (
              <TextField
                key={roundIdx}
                label={`Round ${roundIdx + 1}`}
                type="number"
                value={score}
                onChange={e => handleScoreChange(team as 'team1' | 'team2', roundIdx, Number(e.target.value))}
                fullWidth
                margin="normal"
                inputProps={{ min: 0 }}
              />
            ))}
          </Box>
        ))}
      </Stack>

      {/* Individual Player Stats */}
      <Divider sx={{ mb: 2 }}>Player Stats Per Round</Divider>
      {Array.from({ length: selectedSport.maxRounds || 3 }).map((_, roundIdx) => (
        <Box key={roundIdx} sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            {`Round ${roundIdx + 1}`}
          </Typography>
          {[...team1Players, ...team2Players].map(player => (
            <Accordion key={player.id + '-' + roundIdx}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>
                  {player.displayName || player.email || player.id}
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
                    value={roundPlayerStats[roundIdx]?.[player.id]?.[stat.name] ?? ''}
                    onChange={e =>
                      handleRoundStatChange(
                        roundIdx,
                        player.id,
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
      ))}
    </Box>
  );
}

export default RoundBased;