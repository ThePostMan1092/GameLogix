import React from 'react';
// import useAuth from its correct location
import { Box, Paper, Typography, Divider, Grid} from '@mui/material';


const CustomizationTab: React.FC = () => {
  return (
    <Paper elevation={3} style={{ padding: '16px', margin: '16px 0' }}>
      <Box>
        <Typography variant="h2">League Customization</Typography>
        <Typography variant="body2">Make the league your own!</Typography>
      </Box>

      <Divider style={{ margin: '16px 0' }} />

      <Grid container sx={{spacing: 2, px: 4}} >
        <Grid size={3}>
          <Typography variant="h4">Sport Selection</Typography>
        </Grid>
        <Grid size={9}>
          <Box justifyContent={'space-between'} display="flex" flexDirection="column" height="100%">
          </Box>
        </Grid>
      </Grid>

      <Divider style={{ margin: '16px 0' }} />
    </Paper>
  );
};

export default CustomizationTab;
