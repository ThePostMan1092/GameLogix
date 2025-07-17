import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
// Adjust the path below if your firebase file is in a different location
import { db } from '../../Backend/firebase';
import { useParams } from 'react-router-dom';
import { Box, Paper, Typography, Divider, Grid, TextField} from '@mui/material';

const BasicInfoTab: React.FC = () => {
  const { leagueId } = useParams();
  console.log('LeagueID:', leagueId);
  console.log('LeagueId type:', typeof leagueId);
  const [league, setLeague] = useState<any>(null);
  console.log('League state:', league);
  const [editLeague, setEditLeague] = useState<any>(null);

  useEffect(() => {
    if (!leagueId) return;
    const fetchLeague = async () => {
      const leagueRef = doc(db, 'leagues', leagueId);
      const leagueSnap = await getDoc(leagueRef);
      if (leagueSnap.exists()) {
        setLeague(leagueSnap.data());
        setEditLeague(leagueSnap.data());
      }
    };
    fetchLeague();
  }, [leagueId]);

  // Generic handler for text fields
  const handleChange = (field: string, value: any) => {
    setEditLeague((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Paper elevation={3} style={{ padding: '16px', margin: '16px 0' }}>
      <Box>
        <Typography variant="h2">Basic Information</Typography>
        <Typography variant="body2">Adjust basic info about the league</Typography>
      </Box>

      <Divider style={{ margin: '16px 0' }} />

      <Grid container sx={{spacing: 2, px: 4}} >
        <Grid size={4}>
          <Typography variant="h4">Identification</Typography>
        </Grid>
        <Grid size={8}>
          <Box justifyContent={'space-between'} display="flex" flexDirection="column" height="100%">
            <TextField
              label="League Name"
              variant="outlined"
              value={editLeague?.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              fullWidth
              margin="normal"
              size="small"
            />
            <TextField
              label="League Identifier"
              variant="outlined"
              helperText="Unique ID is uneditable"
              value={editLeague?.id}
              fullWidth
              margin="normal"
              disabled
              size="small"
            />
            <TextField
              label="League Description"
              variant="outlined"
              id="outlined-multiline-static"
              value={editLeague?.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              fullWidth
              margin="normal"
              sx={{ height: 50, fontSize: '.5rem' }}
              size="small"
              maxRows={3}
            />
          </Box>
        </Grid>
      </Grid>

      <Divider style={{ margin: '16px 0' }} />

      <Grid container sx={{spacing: 2, px: 4}} >
        <Grid size={5}>
          <Typography variant="h4">Membership</Typography>
        </Grid>
        <Grid size={7}>
          <Typography variant="h6">join requests</Typography>
          <Typography variant="body1">members management</Typography>
          <Typography variant="body2">edit member level, kick members</Typography>
        </Grid>
      </Grid>

      <Divider style={{ margin: '16px 0' }} />

      <Grid container sx={{spacing: 2, px: 4}} >
        <Grid size={5}>
          <Typography variant="h4">Joining settings</Typography>
        </Grid>
        <Grid size={7}>
          <Typography variant="h6">visibility(public | private)</Typography>
          <Typography variant="body1">Join Process(open | password | approval | invite only)</Typography>
          <Typography variant="body2">If password: set password</Typography>
        </Grid>
      </Grid>

      <Divider style={{ margin: '16px 0' }} />
      
    </Paper>
  );
};

export default BasicInfoTab;

