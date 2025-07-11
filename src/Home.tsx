import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';
import { InternalBox } from './Backend/InternalBox';
import type { Player } from './users/playerDb';

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <InternalBox sx={{ p: 4, maxWidth: 500, mx: 'auto', mt: 8, textAlign: 'center', }}>
      <Typography variant="h4" gutterBottom>
        Welcome to GameLogix!
      </Typography>
      <Typography variant="body1" sx={{ mb: 4 }}>
        Track your company sports, join or create leagues, and compete with coworkers!
      </Typography>
      <Box display="flex" flexDirection="column" gap={3}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          component={Link}
          to="/leagues/join"
        >
          Join a League
        </Button>
        <Button
          variant="outlined"
          color="primary"
          size="large"
          component={Link}
          to="/leagues/create"
        >
          Create a League
        </Button>
      </Box>
    </InternalBox>
  );
};

export default Home;
