// Imports
import React from 'react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../Backend/AuthProvider';
import { Box, Typography, TextField, MenuItem, Divider, Stack } from '@mui/material';
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
  onSelectionChange?: (players: teamPostitioning[]) => void;
}

const SmallTeam: React.FC<SmallTeamProps> = ({leagueMembers, selectedSport, onSelectionChange}) => {
  const {user} = useAuth();
  const [opponents] = useState<Player[]>(leagueMembers.filter(member => member.id !== user?.uid));
  const [players, setPlayers] = useState<teamPostitioning[]>([]);
  useEffect(() => {
    if (!user) return;
    setPlayers(prevPlayers => {
      // If user is already present, do nothing
      if (prevPlayers.some(p => p.playerId === user.uid && p.teamid === 1 && p.teamPosition === 0)) {
        return prevPlayers;
      }
      // Add user as first player on team 1
      const userPlayer: teamPostitioning = {
        teamid: 1,
        teamPosition: 0,
        playerId: user.uid,
        displayName: user.displayName || user.email || 'You'
      };
      // Remove any duplicate user entry
      const filtered = prevPlayers.filter(p => p.playerId !== user.uid);
      const updated = [userPlayer, ...filtered];
      if (onSelectionChange) onSelectionChange(updated);
      return updated;
    });
  }, [user, selectedSport.playersPerTeam, onSelectionChange]);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([user?.uid ?? '']);
  const selectedPlayerIds = players.map(p => p.playerId);

  const handleSelectPlayer = (playerId: string, teamId: number, position: number) => {
    setPlayers(prevPlayers => {
      const filtered = prevPlayers.filter(p => !(p.teamid === teamId && p.teamPosition === position));
      const newPlayer: teamPostitioning = {
        teamid: teamId,
        teamPosition: position,
        playerId: playerId,
        displayName: opponents.find(opponent => opponent.id === playerId)?.displayName || ''
      };
      const updated = [...filtered, newPlayer];
      if (onSelectionChange) onSelectionChange(updated);
      console.log(players);
      return updated;
    });
  };

  useEffect(() => {
    console.log('opponents:', selectedPlayers);
    setSelectedPlayers(prev => [user?.uid ?? '', ...prev.slice(1, selectedSport.playersPerTeam)]);
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
              {leagueMembers
                .filter(member => 
                  !selectedPlayerIds.includes(member.id) ||
                  players.find(p => p.teamid === 1 && p.teamPosition === i + 1)?.playerId === member.id
                )
                .map((member) => (
                  <MenuItem key={member.id} value={member.id}>
                    {member.displayName || member.email || member.id}
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