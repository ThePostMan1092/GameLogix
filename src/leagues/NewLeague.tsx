import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';
import { InternalBox } from '../Backend/InternalBox';

const NewLeague: React.FC = () => {
  return (
    <InternalBox sx={{ p: 4, maxWidth: 500, mx: 'auto', mt: 8, textAlign: 'center' }}>
      <Typography variant="h4" gutterBottom>
        Let the Games Begin!
      </Typography>
      <Typography variant="body1" sx={{ mb: 4 }}>
        Would you like to create a new league or join an existing one?
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
          variant="contained"
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

export default NewLeague;
