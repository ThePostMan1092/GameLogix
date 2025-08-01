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
      return [userPlayer, ...filtered];
    });
  }, [user, selectedSport.playersPerTeam]);

  // Separate useEffect to notify parent of player changes
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(players);
    }
  }, [players, onSelectionChange]);
  
  const selectedPlayerIds = players.map(p => p.playerId);

  const handleSelectPlayer = (playerId: string, teamId: number, position: number) => {
    setPlayers(prevPlayers => {
      const filtered = prevPlayers.filter(p => !(p.teamid === teamId && p.teamPosition === position));
      const selectedMember = leagueMembers.find(member => member.id === playerId);
      const newPlayer: teamPostitioning = {
        teamid: teamId,
        teamPosition: position,
        playerId: playerId,
        displayName: selectedMember?.displayName || selectedMember?.email || ''
      };
      return [...filtered, newPlayer];
    });
  };

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
              key={`team1-player-${i}`}
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
                  member.id !== user?.uid && // Prevent user from being selected again
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
          <Box key={`team-${x + 2}`} alignItems="center" display="flex" flexDirection="column" sx={{ flex: 1, mx: 2 }}>
            <Typography variant="h4" sx={{ mb: 0 }}>
              Team {x + 2}
            </Typography>
            {Array.from({ length: selectedSport.playersPerTeam ? selectedSport.playersPerTeam  : 1 }).map((_, i) => (
              <TextField
                key={`team${x + 2}-player-${i}`}
                select
                label={`Opponent ${i+1}`}
                fullWidth
                margin="normal"
                value={players.find(p => p.teamid === x + 2 && p.teamPosition === i + 1)?.playerId || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  handleSelectPlayer(e.target.value, x + 2, i + 1);
                }}
              >
                {leagueMembers
                .filter(member => 
                  !selectedPlayerIds.includes(member.id) ||
                  players.find(p => p.teamid === x + 2 && p.teamPosition === i + 1)?.playerId === member.id
                )
                .map((member) => (
                  <MenuItem key={member.id} value={member.id}>
                    {member.displayName || member.email || member.id}
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