// Imports
import React from 'react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../Backend/AuthProvider';
import { Box, Typography, TextField, Accordion, AccordionSummary, AccordionDetails, MenuItem, Divider, Stack } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { type Sport } from '../../types/sports';

// Types
interface Player {
  id: string;
  displayName: string;
  email?: string;
}

// Available sports for company leagues
interface teamPostitioning {
  teamid: number;
  teamPosition: number;
  playerId: string;
  displayName: string;
}

interface SmallTeamProps {
  leagueMembers: Player[];
  selectedSport: Sport;
}
const SmallTeam: React.FC<SmallTeamProps> = ({leagueMembers, selectedSport}) => {
  const {user} = useAuth();
  const [opponents, setOpponents] = useState<Player[]>(leagueMembers.filter(member => member.id !== user?.uid));
  const [opponentId, setOpponentId] = useState<string>('');
  const [players, setPlayers] = useState<teamPostitioning[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([user?.uid ?? '']);
  const selectedPlayerIds = players.map(p => p.playerId);

  // Prevent duplicate selection
  const availablePlayers = leagueMembers.filter(
    member => !selectedPlayers.includes(member.id) || selectedPlayers[0] === member.id
  );

  const handleSelectPlayer = (playerId: string, teamId: number, position: number) => {
    setPlayers(prevPlayers => {
      // Remove any previous selection for this slot
      const filtered = prevPlayers.filter(p => !(p.teamid === teamId && p.teamPosition === position));
      // Add new selection
      const newPlayer: teamPostitioning = {
        teamid: teamId,
        teamPosition: position,
        playerId: playerId,
        displayName: opponents.find(opponent => opponent.id === playerId)?.displayName || ''
      };
      return [...filtered, newPlayer];
    });
  };

  useEffect(() => {
    // Always include current user as first slot
    setSelectedPlayers(prev => [user?.uid ?? '', ...prev.slice(1, selectedSport.playersPerTeam)]);
    console.log('Selected Players:', selectedPlayers);
    console.log("opponents:", opponents);
  }, [user?.uid, selectedSport.playersPerTeam]);

  return (
    <>
      <Divider sx={{mt:2}}>Player Selection</Divider>
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
              value={players.find(p => p.teamid === 1 && p.teamPosition === i + 1)?.playerId || ''}
              onChange={(e) => {
                handleSelectPlayer(e.target.value, 1, i + 1);
              }}
            >
              {opponents
                .filter(opponent => 
                  !selectedPlayerIds.includes(opponent.id) ||
                  players.find(p => p.teamid === 1 && p.teamPosition === i + 1)?.playerId === opponent.id
                )
                .map((opponent) => (
                  <MenuItem key={opponent.id} value={opponent.id}>
                    {opponent.displayName || opponent.email || opponent.id}
                  </MenuItem>
              ))}
            </TextField>
          ))}
        </Box>
        {Array.from({ length: (selectedSport.numberOfTeams ?? 2) - 1 }).map((_, x) => (
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
                value={players.find(p => p.teamid === x + 2 && p.teamPosition === i + 1)?.playerId || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  handleSelectPlayer(e.target.value, x + 2, i + 1);
                  setOpponentId(e.target.value);
                }}
              >
                {opponents
                  .filter(opponent => !selectedPlayerIds.includes(opponent.id) ||
                    players.find(p => p.teamid === x + 2 && p.teamPosition === i + 1)?.playerId === opponent.id
                  )
                  .map((opponent) => (
                    <MenuItem key={opponent.id} value={opponent.id}>
                      {opponent.displayName || opponent.email || opponent.id}
                    </MenuItem>
                ))}
              </TextField>
            ))}
          </Box>
        ))}
      </Stack>
    </>
  );
};

export default SmallTeam;