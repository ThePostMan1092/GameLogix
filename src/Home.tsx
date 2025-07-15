import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Box, Button, Typography, Card, CardContent, Chip, CircularProgress } from '@mui/material';
import { InternalBox } from './Backend/InternalBox';
import { useAuth } from './Backend/AuthProvider';
import { db } from './Backend/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const Home: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userLeagues, setUserLeagues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Fetch leagues the user is a member of
    const fetchUserLeagues = async () => {
      try {
        const q = query(collection(db, 'leagues'), where('members', 'array-contains', user.uid));
        const snap = await getDocs(q);
        const leagues = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUserLeagues(leagues);
        
        // Redirect to new league page if user has no leagues
        if (leagues.length === 0) {
          navigate('/leagues/new');
        }
      } catch (error) {
        console.error('Error fetching user leagues:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserLeagues();
  }, [user, navigate]);

  if (loading) {
    return (
      <InternalBox sx={{ p: 4, maxWidth: 500, mx: 'auto', mt: 8, textAlign: 'center' }}>
        <CircularProgress />
      </InternalBox>
    );
  }

  // This page is only for users who have leagues (others are redirected to /leagues/new)
  return (
    <InternalBox sx={{ p: 4, maxWidth: 900, mx: 'auto', mt: 4 }}>
      <Typography variant="h3" gutterBottom align="center" sx={{ mb: 2 }}>
        Welcome back to GameLogix!
      </Typography>
      
      <Typography variant="h6" align="center" color="text.secondary" sx={{ mb: 4 }}>
        Your corporate sports competition platform
      </Typography>

      {/* User's Leagues Overview */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h5" gutterBottom>
          Your Leagues ({userLeagues.length})
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={2}>
          {userLeagues.map(league => (
            <Box key={league.id} sx={{ minWidth: 280, flex: '1 1 280px', maxWidth: 350 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {league.emoji} {league.name}
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                    {league.sports?.map((sport: string) => (
                      <Chip key={sport} label={sport} size="small" />
                    ))}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {league.members?.length || 0} members
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Quick Actions */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h5" gutterBottom>
          Quick Actions
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={2}>
          <Box sx={{ minWidth: 200, flex: '1 1 200px' }}>
            <Button 
              variant="contained" 
              fullWidth 
              size="large"
              component={Link}
              to="/record"
              sx={{ py: 2 }}
            >
              Record Game
            </Button>
          </Box>
          <Box sx={{ minWidth: 200, flex: '1 1 200px' }}>
            <Button 
              variant="outlined" 
              fullWidth 
              size="large"
              component={Link}
              to="/schedule"
              sx={{ py: 2 }}
            >
              Schedule Game
            </Button>
          </Box>
          <Box sx={{ minWidth: 200, flex: '1 1 200px' }}>
            <Button 
              variant="outlined" 
              fullWidth 
              size="large"
              component={Link}
              to="/scoreboard"
              sx={{ py: 2 }}
            >
              View Scoreboard
            </Button>
          </Box>
          <Box sx={{ minWidth: 200, flex: '1 1 200px' }}>
            <Button 
              variant="outlined" 
              fullWidth 
              size="large"
              component={Link}
              to="/leagues/join"
              sx={{ py: 2 }}
            >
              Join New League
            </Button>
          </Box>
        </Box>
      </Box>

      {/* App Features Overview */}
      <Box>
        <Typography variant="h5" gutterBottom>
          GameLogix Features
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={3}>
          <Box sx={{ minWidth: 280, flex: '1 1 280px' }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  🏆 Competitive Leagues
                </Typography>
                <Typography variant="body2">
                  Create or join leagues with customizable rules, ranking systems, and tournament modes. 
                  Track your progress with ELO ratings or point systems.
                </Typography>
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ minWidth: 280, flex: '1 1 280px' }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  📊 Match Tracking
                </Typography>
                <Typography variant="body2">
                  Record game results, schedule matches, and view detailed scoreboards. 
                  Optional match verification ensures fair play.
                </Typography>
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ minWidth: 280, flex: '1 1 280px' }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  👥 Team Management
                </Typography>
                <Typography variant="body2">
                  Manage league members, handle join requests, and customize league settings. 
                  Perfect for office ping pong, foosball, and more!
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Box>
    </InternalBox>
  );
};

export default Home;
