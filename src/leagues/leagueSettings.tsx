import React, { Suspense } from 'react';
import { Box, Typography, Button, CircularProgress, Grid, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useParams, useNavigate } from 'react-router-dom';

const SettingsTabs = React.lazy(() => import('./settings/SettingsTabs'));

const LeagueSettings: React.FC = () => {
  const { LeagueId } = useParams();
  const navigate = useNavigate();

  return (
    <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
      <Box display="flex" alignItems="center" gap={2} mb={4}>
        <Grid>
          <IconButton onClick={() => navigate(`/League/${LeagueId}/dashboard/Scoreboard`)} color="primary">
            <ArrowBackIcon />
          </IconButton>
        </Grid>
        <Typography variant="h4">
          League Settings
        </Typography>
      </Box>
      <Suspense fallback={<Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>}>
        <SettingsTabs />
      </Suspense>
      <Box display="flex" gap={2} mt={4} justifyContent="center">
        <Button 
          variant="outlined" 
          onClick={() => navigate('/dashboard')}
          size="large"
        >
          Back to Dashboard
        </Button>
        <Button 
          variant="contained" 
          onClick={() => navigate(`/leagues/${LeagueId}`)}
          size="large"
        >
          View League
        </Button>
      </Box>
    </Box>
  );
};

export default LeagueSettings;