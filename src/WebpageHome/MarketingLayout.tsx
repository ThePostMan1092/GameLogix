import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Container } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';

interface MarketingLayoutProps {
  children: React.ReactNode;
}

const MarketingLayout: React.FC<MarketingLayoutProps> = ({ children }) => {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Top Navigation Bar */}
      <AppBar position="static" sx={{ bgcolor: 'background.default', boxShadow: 1 }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          {/* Logo/Brand */}
          <Typography 
            variant="h4" 
            component={Link} 
            to="/" 
            sx={{ 
              textDecoration: 'none', 
              color: 'primary.main', 
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            GameLogix
          </Typography>

          {/* Navigation Links */}
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
            <Button color="inherit" component={Link} to="/">
              Home
            </Button>
            <Button color="inherit" component={Link} to="/features">
              Features
            </Button>
            <Button color="inherit" component={Link} to="/pricing">
              Pricing
            </Button>
            <Button color="inherit" component={Link} to="/about">
              About
            </Button>
            <Button color="inherit" component={Link} to="/contact">
              Contact
            </Button>
            
            {/* Auth Buttons */}
            <Button 
              variant="outlined" 
              color="primary" 
              onClick={() => navigate('/login')}
              sx={{ ml: 2 }}
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

      {/* Main Content */}
      <Box sx={{ flex: 1 }}>
        {children}
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: 'background.paper', mt: 8, py: 4, borderTop: '1px solid', borderColor: 'divider' }}>
        <Container maxWidth="lg">
          <Box textAlign="center">
            <Typography variant="body2" color="text.secondary">
              © 2025 GameLogix. All rights reserved.
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 3 }}>
              <Button color="inherit" size="small" component={Link} to="/privacy">
                Privacy Policy
              </Button>
              <Button color="inherit" size="small" component={Link} to="/terms">
                Terms of Service
              </Button>
              <Button color="inherit" size="small" component={Link} to="/support">
                Support
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default MarketingLayout;
