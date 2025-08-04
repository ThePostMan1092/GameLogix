// Imports
import React from 'react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../Backend/AuthProvider';
import { Box, Typography, TextField, MenuItem, Divider, Stack, Chip, IconButton } from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';
import { type Sport } from '../../types/sports';

// Types
interface Player {
  id: string;
  displayName: string;
  email?: string;
}

// Use team-based structure for consistency - each individual player is their own "team"
interface teamPostitioning {
  teamid: number;
  teamPosition: number; // Always 0 for individual competitions (1 player per team)
  playerId: string;
  displayName: string;
}

interface IndividualCompProps {
  leagueMembers: Player[];
  selectedSport: Sport;
  onSelectionChange?: (players: teamPostitioning[]) => void;
}

const IndividualComp: React.FC<IndividualCompProps> = ({
  leagueMembers,
  selectedSport,
  onSelectionChange
}) => {
  const { user } = useAuth();
  const [players, setPlayers] = useState<teamPostitioning[]>([]);
  const maxPlayers = selectedSport.numberOfTeams || 8; // Default to 8 if not specified

  useEffect(() => {
    if (!user) return;
    
    setPlayers(prevPlayers => {
      // If user is already present, do nothing
      if (prevPlayers.some(p => p.playerId === user.uid && p.teamid === 1 && p.teamPosition === 0)) {
        return prevPlayers;
      }
      // Add user as first player (team 1, position 0)
      const userPlayer: teamPostitioning = {
        teamid: 1,
        teamPosition: 0, // Always 0 for individual competitions
        playerId: user.uid,
        displayName: user.displayName || user.email || 'You'
      };
      // Remove any duplicate user entry
      const filtered = prevPlayers.filter(p => p.playerId !== user.uid);
      return [userPlayer, ...filtered];
    });
  }, [user]);

  // Separate useEffect to notify parent of player changes
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(players);
    }
  }, [players, onSelectionChange]);

  const selectedPlayerIds = players.map(p => p.playerId);

  const handleAddPlayer = () => {
    if (players.length >= maxPlayers) return;
    
    const nextTeamId = players.length + 1; // Each player gets their own team ID
    setPlayers(prev => [...prev, {
      teamid: nextTeamId,
      teamPosition: 0, // Always 0 for individual competitions
      playerId: '',
      displayName: ''
    }]);
  };

  const handleRemovePlayer = (teamId: number) => {
    if (teamId === 1) return; // Can't remove the user (team 1)
    
    setPlayers(prev => {
      const filtered = prev.filter(p => p.teamid !== teamId);
      // Reindex team IDs to maintain sequential order
      return filtered.map((p, index) => ({ ...p, teamid: index + 1 }));
    });
  };

  const handleSelectPlayer = (playerId: string, teamId: number) => {
    setPlayers(prevPlayers => {
      const selectedMember = leagueMembers.find(member => member.id === playerId);
      return prevPlayers.map(p => 
        p.teamid === teamId 
          ? {
              ...p,
              playerId,
              displayName: selectedMember?.displayName || selectedMember?.email || ''
            }
          : p
      );
    });
  };

  const availableMembers = leagueMembers.filter(member => 
    member.id !== user?.uid && !selectedPlayerIds.includes(member.id)
  );

  return (
    <>
      <Divider sx={{ mt: 2 }}>Player Selection</Divider>
      
      <Box sx={{ mt: 2, mb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h5">
            Individual Competition Players
          </Typography>
          <Box display="flex" alignItems="center" gap={1}>
            <Chip 
              label={`${players.length}/${maxPlayers} Players`} 
              color={players.length >= 2 ? "success" : "warning"}
              size="small"
            />
            <IconButton 
              onClick={handleAddPlayer}
              disabled={players.length >= maxPlayers}
              color="primary"
              size="small"
            >
              <AddIcon />
            </IconButton>
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Each player competes individually. Add up to {maxPlayers} players for this match.
        </Typography>

        <Stack spacing={2}>
          {players.map((player, index) => (
            <Box key={player.teamid} display="flex" alignItems="center" gap={2}>
              <Typography variant="body2" sx={{ minWidth: 60 }}>
                Player {index + 1}:
              </Typography>
              
              {player.teamid === 1 ? (
                // User's slot (non-editable)
                <TextField
                  disabled
                  fullWidth
                  variant="outlined"
                  value={user?.displayName || user?.email || user?.uid}
                  size="small"
                />
              ) : (
                // Selectable player slots
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={player.playerId}
                  onChange={(e) => handleSelectPlayer(e.target.value, player.teamid)}
                  placeholder="Select a player"
                >
                  <MenuItem value="">
                    <em>Select a player</em>
                  </MenuItem>
                  {availableMembers.map((member) => (
                    <MenuItem key={member.id} value={member.id}>
                      {member.displayName || member.email || member.id}
                    </MenuItem>
                  ))}
                  {/* Show currently selected player even if it would normally be filtered */}
                  {player.playerId && !availableMembers.find(m => m.id === player.playerId) && (
                    <MenuItem key={player.playerId} value={player.playerId}>
                      {player.displayName}
                    </MenuItem>
                  )}
                </TextField>
              )}

              {player.teamid > 1 && (
                <IconButton 
                  onClick={() => handleRemovePlayer(player.teamid)}
                  color="error"
                  size="small"
                >
                  <RemoveIcon />
                </IconButton>
              )}
            </Box>
          ))}
        </Stack>

        {players.length < 2 && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
            <Typography variant="body2" color="warning.dark">
              You need at least 2 players for a competition. Click the + button to add more players.
            </Typography>
          </Box>
        )}
      </Box>
    </>
  );
};

export default IndividualComp;