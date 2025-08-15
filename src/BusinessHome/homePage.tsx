
import React, { useState } from 'react';
import { Box, Typography, Button, Container, Grid, Card, CardContent, AppBar, Toolbar, Tabs, Tab } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { SportsSoccer, EmojiEvents, Groups, Analytics } from '@mui/icons-material';
import AboutPage from './aboutPage';
import PricingPage from './pricingPage';
import FeaturesPage from './featuresPage';
import ContactPage from './contactPage';
import { styled } from '@mui/material/styles';

interface StyledTabsProps {
  children?: React.ReactNode;
  value: number;
  onChange: (event: React.SyntheticEvent, newValue: number) => void;
}

interface StyledTabProps {
  label: string;
}

const StyledTabs = styled((props: StyledTabsProps) => (
  <Tabs
    {...props}
    TabIndicatorProps={{ children: <span className="MuiTabs-indicatorSpan" /> }}
  />
))({
  '& .MuiTabs-indicator': {
    display: 'flex',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  '& .MuiTabs-indicatorSpan': {
    maxWidth: 40,
    width: '100%',
    backgroundColor: '#E2B5A6',
  },
});

const StyledTab = styled((props: StyledTabProps) => (
  <Tab disableRipple {...props} />
))(({ theme }) => ({
  textTransform: 'none',
  fontWeight: theme.typography.fontWeightRegular,
  fontSize: theme.typography.pxToRem(15),
  marginRight: theme.spacing(5),
  color: theme.palette.primary.main,
  '&.Mui-selected': {
    color: '#E2B5A6',
  },
  '&.Mui-focusVisible': {
    backgroundColor: 'background.default',
    boxShadow: 'none',
    outline: 'none',
  },
  '&:focus': {
    backgroundColor: 'transparent', // Remove highlight on focus
    boxShadow: 'none',
    outline: 'none',
  },
}));

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const renderTabContent = () => {
    switch (currentTab) {
      case 0:
        return <HomeContent navigate={navigate} />;
      case 1:
        return <FeaturesPage />;
      case 2:
        return <PricingPage />;
      case 3:
        return <AboutPage />;
      case 4:
        return <ContactPage />;
      default:
        return <HomeContent navigate={navigate} />;
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Top Navigation Bar */}
      <AppBar position="static" sx={{ bgcolor: 'background.default', boxShadow: 1 }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          {/* Logo/Brand */}
          <Typography 
            variant="h4" 
            onClick={() => setCurrentTab(0)}
            sx={{ 
              color: 'primary.main', 
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            GameLogix
          </Typography>
          {/* Tab Navigation */}
          <Box>
            <StyledTabs 
              value={currentTab} 
              onChange={handleTabChange} 
            >
              <StyledTab label="Home" />
              <StyledTab label="Features" />
              <StyledTab label="Pricing" />
              <StyledTab label="About" />
              <StyledTab label="Contact" />
            </StyledTabs>
          </Box>

          {/* Auth Buttons */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button 
              variant="outlined" 
              color="primary" 
              onClick={() => navigate('/login')}
            >
              Sign In
            </Button>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => navigate('/register')}
            >
              Get Started
            </Button>
          </Box>
        </Toolbar>

        
      </AppBar>

      {/* Tab Content */}
      {renderTabContent()}

      {/* Footer */}
      <Box sx={{ bgcolor: 'background.paper', mt: 8, py: 4, borderTop: '1px solid', borderColor: 'divider' }}>
        <Container maxWidth="lg">
          <Box textAlign="center">
            <Typography variant="body2" color="text.secondary">
              © 2025 GameLogix. All rights reserved.
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 3 }}>
              <Button color="inherit" size="small">
                Privacy Policy
              </Button>
              <Button color="inherit" size="small">
                Terms of Service
              </Button>
              <Button color="inherit" size="small">
                Support
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

// Separate component for the main home content
const HomeContent: React.FC<{ navigate: any }> = ({ navigate }) => {
  return (
    <Box sx={{ minHeight: '70vh' }}>
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
          <Grid size={6}>
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
          
          <Grid size={6}>
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
          
          <Grid size={6}>
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
          
          <Grid size={6}>
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