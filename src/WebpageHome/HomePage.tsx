import React from 'react';
import { Box, Typography, Button, Container, Card, CardContent } from '@mui/material';
import Grid from '@mui/material/Grid';
import { useNavigate } from 'react-router-dom';
import { SportsSoccer, EmojiEvents, Groups, Analytics } from '@mui/icons-material';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box textAlign="center" sx={{ mb: 8 }}>
          <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            GameLogix
          </Typography>
          <Typography variant="h5" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
            The ultimate corporate sports competition platform. Transform your workplace into a competitive arena.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button 
              variant="contained" 
              size="large" 
              onClick={() => navigate('/register')}
              sx={{ px: 4, py: 1.5 }}
            >
              Get Started Free
            </Button>
            <Button 
              variant="outlined" 
              size="large"
              onClick={() => navigate('/dashboard')}
              sx={{ px: 4, py: 1.5 }}
            >
              View Demo
            </Button>
          </Box>
        </Box>

        {/* Features Section */}
        <Typography variant="h3" textAlign="center" sx={{ mb: 6 }}>
          Why Choose GameLogix?
        </Typography>
        
        <Grid container spacing={4} sx={{ mb: 8 }}>
          <Grid item xs={12} md={6} lg={3}>
            <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
              <CardContent>
                <EmojiEvents sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Competitive Leagues
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Create custom leagues with advanced ranking systems, tournaments, and ELO ratings.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6} lg={3}>
            <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
              <CardContent>
                <Analytics sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Advanced Analytics
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Track detailed statistics, performance metrics, and historical data for every player.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6} lg={3}>
            <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
              <CardContent>
                <Groups sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Team Management
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Easily manage members, handle join requests, and customize league settings.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6} lg={3}>
            <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
              <CardContent>
                <SportsSoccer sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Multi-Sport Support
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Support for ping pong, foosball, pool, and any custom sport your office enjoys.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* CTA Section */}
        <Box textAlign="center" sx={{ py: 6, bgcolor: 'primary.main', borderRadius: 2, color: 'white' }}>
          <Typography variant="h4" gutterBottom>
            Ready to Transform Your Workplace?
          </Typography>
          <Typography variant="h6" sx={{ mb: 3, opacity: 0.9 }}>
            Join thousands of companies already using GameLogix
          </Typography>
          <Button 
            variant="contained" 
            color="secondary" 
            size="large"
            onClick={() => navigate('/register')}
            sx={{ px: 4, py: 1.5 }}
          >
            Start Your Free Trial
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default HomePage;
