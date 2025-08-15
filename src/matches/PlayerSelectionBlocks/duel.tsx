// Imports
import React from 'react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../Backend/AuthProvider';
import { useUserProfile } from '../../hooks/useUserProfile';
import { Box, Typography, TextField, MenuItem, Divider, Avatar } from '@mui/material';
import { type Sport } from '../../types/sports';

// Types
interface Player {
  id: string;
  displayName: string;
  email?: string;
  photoURL?: string;
}

interface teamPostitioning {
  teamid: number;
  teamPosition: number;
  playerId: string;
  displayName: string;
  photoURL?: string;
}

interface DuelProps {
  leagueMembers: Player[];
  selectedSport?: Sport;
  onSelectionChange?: (players: teamPostitioning[]) => void;
}

const Duel: React.FC<DuelProps> = ({ leagueMembers, onSelectionChange }) => {
  const { user } = useAuth();
  const [players, setPlayers] = useState<teamPostitioning[]>([]);

  const opponent = players.find(p => p.teamid === 2);
  const opponentProfile = useUserProfile(opponent?.playerId);

  useEffect(() => {
    if (!user) return;
    
    setPlayers(prevPlayers => {
      // If user is already present, do nothing
      if (prevPlayers.some(p => p.playerId === user.uid && p.teamid === 1)) {
        return prevPlayers;
      }
      // Add user as player on team 1
      const userPlayer: teamPostitioning = {
        teamid: 1,
        teamPosition: 1,
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

  const handleSelectOpponent = (playerId: string) => {
    setPlayers(prevPlayers => {
      // Remove any existing opponent
      const filtered = prevPlayers.filter(p => p.teamid !== 2);
      
      if (playerId) {
        const selectedMember = leagueMembers.find(member => member.id === playerId);
        const newOpponent: teamPostitioning = {
          teamid: 2,
          teamPosition: 1,
          playerId: playerId,
          displayName: selectedMember?.displayName || selectedMember?.email || ''
        };
        return [...filtered, newOpponent];
      }
      
      return filtered;
    });
  };

  return (
    <>
      <Divider sx={{ mt: 2 }}>Player Selection</Divider>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, py: 3 }}>
        
        {/* Current User */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 200 }}>
          <Avatar
            src={user?.photoURL || ''}
            sx={{ width: 64, height: 64, mb: 2 }}
          >
            {user?.displayName?.[0] || user?.email?.[0] || 'U'}
          </Avatar>
          <Typography variant="h6" sx={{ mb: 1, textAlign: 'center' }}>
            You
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', my: 1 }}>
            {user?.displayName || user?.email || 'Current User'}
          </Typography>
        </Box>

        {/* VS Divider */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', px: 2 }}>
          <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
            VS
          </Typography>
        </Box>

        {/* Opponent Selection */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 200 }}>
          {opponent ? (
            <>
              <Avatar
                src={opponentProfile?.photoURL || opponentProfile?.avatarUrl || ''}
                sx={{ width: 64, height: 64, mb: 2, bgcolor: 'secondary.main' }}
              >
                {opponent.displayName[0] || 'O'}
              </Avatar>
              <Typography variant="h6" sx={{ mb: 1, textAlign: 'center' }}>
                Opponent
              </Typography>
            </>
          ) : (
            <>
              <Avatar
                sx={{ width: 64, height: 64, mb: 2, bgcolor: 'grey.300' }}
              >
                ?
              </Avatar>
              <Typography variant="h6" sx={{ mb: 1, textAlign: 'center' }}>
                Select Opponent
              </Typography>
            </>
          )}
          
          <TextField
            select
            label="Choose Opponent"
            value={opponent?.playerId || ''}
            onChange={(e) => handleSelectOpponent(e.target.value)}
            sx={{ minWidth: 200 }}
            size="small"
          >
            <MenuItem value="">
              <em>No opponent selected</em>
            </MenuItem>
            {leagueMembers
              .filter(member => member.id !== user?.uid) // Exclude current user
              .map((member) => (
                <MenuItem key={member.id} value={member.id}>
                  {member.displayName || member.email || member.id}
                </MenuItem>
              ))}
          </TextField>
        </Box>
      </Box>
    </>
  );
};

export default Duel;
