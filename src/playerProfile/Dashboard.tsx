import React, { useEffect, useState } from 'react';
import { Box, Button, Typography, LinearProgress, Stack, IconButton } from '@mui/material';
import { useAuth } from '../Backend/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { usePlayerStats } from '../hooks/usePlayerStats';
import { PlayerProfileHero } from './PlayerProfileHero';
import { PlayerStatsDeepDive } from './PlayerStatsDeepDive';
import type { SportParentStats } from '../types/stats';
import SettingsApplicationsIcon from '@mui/icons-material/SettingsApplications';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { getUserStats } = usePlayerStats();
  const [allStats, setAllStats] = useState<SportParentStats[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    const { signOut } = await import('firebase/auth');
    const { auth } = await import('../Backend/firebase');
    await signOut(auth);
    navigate('/login');
  };

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const stats = await getUserStats(user.uid);
        setAllStats(stats);
      } catch (error) {
        console.error('Failed to fetch user stats:', error);
        setAllStats([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, getUserStats]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Box textAlign="center">
          <LinearProgress sx={{ width: 300, mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Loading your player profile...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      {/* Header with Sign Out */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Stack direction="row" spacing={0}>
          <IconButton 
          onClick={() => navigate(`/playerProfile/${user?.uid}/userSettings`)}
          color="primary" size="large">
            <SettingsApplicationsIcon />
          </IconButton>
          <Box>
            <Typography variant="h6" fontWeight="bold" color="text.secondary">
              Welcome, {user?.displayName || 'Player'}
            </Typography>
            <Typography variant="h3" fontWeight="bold" color="primary">
            Player Dashboard
            </Typography>
          </Box>
        </Stack>

        <Button 
          variant="outlined" 
          onClick={handleSignOut}
          sx={{ 
            textTransform: 'none',
            fontWeight: 'bold',
            px: 3
          }}
        >
          Sign Out
        </Button>
      </Box>

      {/* Hero Section */}
      <PlayerProfileHero 
        user={user}
        allStats={allStats}
        loading={loading}
      />

      {/* Deep Dive Section */}
      <PlayerStatsDeepDive 
        allStats={allStats}
        loading={loading}
      />
    </Box>
  );
};

export default Dashboard;
