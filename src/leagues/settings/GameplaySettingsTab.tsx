import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
// Adjust the path below if your firebase file is in a different location
import { db } from '../../Backend/firebase';
import { useParams } from 'react-router-dom';
import { 
  Box, 
  Paper, 
  Typography, 
  Divider, 
  Grid, 
  TextField, 
  Alert, 
  Button, 
  MenuItem, 
  Chip, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon, Delete as DeleteIcon } from '@mui/icons-material';
import SettingsForm from './settingsForm';



const GameplayTab: React.FC = () => {
  const { leagueId } = useParams();
  const [editLeague, setEditLeague] = useState<any>(null);
  const [leagueSports, setLeagueSports] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [showAddSport, setShowAddSport] = useState(false);
  const [selectedSportType, setSelectedSportType] = useState<'Ping Pong' | 'Spikeball' | 'Custom'>('Ping Pong');
  const [newSportDisplayName, setNewSportDisplayName] = useState('');

  const availableSportTypes = ['Ping Pong', 'Spikeball', 'Custom'] as const;

  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!leagueId) return;
    fetchLeagueData();
    fetchLeagueSports();
  }, [leagueId]);

  const handleRemoveSport = async (sportId: string) => {
    try {
      await deleteDoc(doc(db, 'leagues', leagueId as string, 'sports', sportId));
      setLeagueSports(prev => prev.filter(sport => sport.id !== sportId));
    } catch (err) {
      console.error('Error removing sport:', err);
      setError('Failed to remove sport');
    }
  };

  const handleChange = (field: string, value: any) => {
    setEditLeague((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const fetchLeagueData = async () => {
    try {
      const leagueRef = doc(db, 'leagues', leagueId as string);
      const leagueSnap = await getDoc(leagueRef);
      if (leagueSnap.exists()) {
        setEditLeague(leagueSnap.data());
      }
    } catch (err) {
      console.error('Error fetching league:', err);
      setError('Failed to load league data');
    }
  };

  const fetchLeagueSports = async () => {
    try {
      const sportsQuery = collection(db, 'leagues', leagueId as string, 'sports');
      const sportsSnap = await getDocs(sportsQuery);
      const sportsData = sportsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLeagueSports(sportsData);
    } catch (err) {
      console.error('Error fetching league sports:', err);
      setError('Failed to load league sports');
    }
  };

  return (
    <Paper elevation={3} style={{ padding: '16px', margin: '16px 0' }}>
      <Box>
        <Typography variant="h2">Gameplay Settings</Typography>
        <Typography variant="body2">Select which sports are available for this league, adjust them to fit your style and preferences for recording and tracking stats</Typography>
      </Box>

      <Divider style={{ margin: '16px 0' }} />

      <Grid container spacing={2} sx={{ px: 4 }}>
        <Grid size={3}>
          <Typography variant="h4">Sport Selection</Typography>
        </Grid>
        <Grid size={9}>
          <Box justifyContent={'space-between'} display="flex" flexDirection="column" height="100%">
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>League Sports Configuration</Typography>
              
              {leagueSports.length === 0 ? (
                <Alert severity="info">No sports configured for this league yet.</Alert>
              ) : (
                <Box sx={{ mb: 2 }}>
                  {leagueSports.map((sport) => (
                    <Accordion
                      key={sport.id}
                      sx={{ mb: 1 }}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls={`sport-${sport.id}-content`}
                        id={`sport-${sport.id}-header`}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="h6">{sport.name}</Typography>
                            <Chip
                              label={sport.type}
                              color={sport.type === 'Custom' ? 'secondary' : 'primary'}
                              size="small"
                            />
                          </Box>
                          <Button
                            size="small"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveSport(sport.id);
                            }}
                            sx={{ ml: 'auto' }}
                          >
                            Delete
                          </Button>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box sx={{ p: 2 }}>
                          <h1>{sport.displayName}</h1>
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              )}
              <Button variant="contained" onClick={() => setDialogOpen(true)}>
                Configure Sport Settings
              </Button>
              <SettingsForm 
                open={dialogOpen} 
                onClose={() => setDialogOpen(false)} 
                onSportAdded={() => fetchLeagueSports()}
              />

              {showAddSport && (
                <Box sx={{ border: '1px solid #ccc', borderRadius: 2, p: 2, mt: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Add New Sport</Typography>
                  
                  <TextField
                    select
                    label="Select Sport Type"
                    value={selectedSportType}
                    onChange={(e) => setSelectedSportType(e.target.value as typeof selectedSportType)}
                    fullWidth
                    margin="normal"
                    size="small"
                  >
                    {availableSportTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    label="Display Name"
                    value={newSportDisplayName}
                    onChange={(e) => setNewSportDisplayName(e.target.value)}
                    fullWidth
                    margin="normal"
                    size="small"
                    placeholder="Enter display name for this sport"
                  />

                  {error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      {error}
                    </Alert>
                  )}

                  <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setShowAddSport(false);
                        setNewSportDisplayName('');
                        setSelectedSportType('Ping Pong');
                        setError('');
                      }}
                    >
                      Cancel
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        </Grid>
      </Grid>

      <Divider style={{ margin: '16px 0' }} />

      <Grid container spacing={2} sx={{ px: 4 }}>
        <Grid size={3}>
          <Typography variant="h4">Match Tracking</Typography>
        </Grid>
        <Grid size={9}>
          <Box justifyContent={'space-between'} display="flex" flexDirection="column" height="100%">
            <TextField
              label="Max Matches Per Week"
              type="number"
              variant="outlined"
              value={editLeague?.maxMatchesPerWeek || ''}
              onChange={(e) => handleChange('maxMatchesPerWeek', e.target.value)}
              fullWidth
              margin="normal"
              size="small"
              helperText="Maximum number of matches a player can participate in per week (leave empty for unlimited)"
              inputProps={{ min: 1 }}
            />
            
            <TextField
              label="Match Expiration Hours"
              type="number"
              variant="outlined"
              value={editLeague?.matchExpirationHours || ''}
              onChange={(e) => handleChange('matchExpirationHours', e.target.value)}
              fullWidth
              margin="normal"
              size="small"
              helperText="Hours after which unconfirmed matches automatically expire (leave empty for no expiration)"
              inputProps={{ min: 1 }}
            />
            
            <TextField
              select
              label="Match Verification"
              variant="outlined"
              value={editLeague?.matchVerification || 'manual'}
              onChange={(e) => handleChange('matchVerification', e.target.value)}
              fullWidth
              margin="normal"
              size="small"
              helperText="How match results are verified and recorded"
            >
              <MenuItem value="automatic">Automatic - Results are recorded immediately</MenuItem>
              <MenuItem value="manual">Manual - Admin must approve all results</MenuItem>
              <MenuItem value="both-confirm">Both Confirm - Both players must confirm the result</MenuItem>
            </TextField>
            
            <TextField
              select
              label="Match Reporting"
              variant="outlined"
              value={editLeague?.matchReporting || 'anyone'}
              onChange={(e) => handleChange('matchReporting', e.target.value)}
              fullWidth
              margin="normal"
              size="small"
              helperText="Who can report match results"
            >
              <MenuItem value="anyone">Anyone - Any league member can report results</MenuItem>
              <MenuItem value="admin-only">Admin Only - Only admins can report results</MenuItem>
              <MenuItem value="member-only">Member Only - Only participating players can report</MenuItem>
            </TextField>
          </Box>
        </Grid>
      </Grid>

      <Divider style={{ margin: '16px 0' }} />
      
    </Paper>
    
  );
};

export default GameplayTab;