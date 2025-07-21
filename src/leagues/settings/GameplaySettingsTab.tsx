import React, { useState, useEffect } from 'react';
// import useAuth from its correct location
import { useAuth } from '../../Backend/AuthProvider';
import { doc, getDoc, collection, getDocs, addDoc, deleteDoc, updateDoc } from 'firebase/firestore';
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
  AccordionDetails,
  FormControlLabel,
  Switch
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon, Delete as DeleteIcon } from '@mui/icons-material';
import type { SportSettings, PingPongSettings, SpikeballSettings, CustomSportSettings } from '../../types/sports';

const GameplayTab: React.FC = () => {
  const { leagueId } = useParams();
  const [editLeague, setEditLeague] = useState<any>(null);
  const { user } = useAuth();
  const [error, setError] = useState('');
  const [leagueSports, setLeagueSports] = useState<SportSettings[]>([]);
  const [showAddSport, setShowAddSport] = useState(false);
  const [selectedSportType, setSelectedSportType] = useState<'Ping Pong' | 'Spikeball' | 'Custom'>('Ping Pong');
  const [newSportDisplayName, setNewSportDisplayName] = useState('');
  const [expandedSport, setExpandedSport] = useState<string | false>(false);
  const [pendingChanges, setPendingChanges] = useState<Record<string, Partial<SportSettings>>>({});

  const availableSportTypes = ['Ping Pong', 'Spikeball', 'Custom'] as const;

  useEffect(() => {
    if (!leagueId) return;
    fetchLeagueData();
    fetchLeagueSports();
  }, [leagueId]);

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
      const sportsRef = collection(db, 'leagues', leagueId as string, 'sports');
      const sportsSnap = await getDocs(sportsRef);
      const sports = sportsSnap.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as SportSettings[];
      setLeagueSports(sports);
    } catch (err) {
      console.error('Error fetching league sports:', err);
    }
  };

  const handleAddSport = async () => {
    if (!newSportDisplayName.trim()) {
      setError('Sport display name is required');
      return;
    }

    try {
      let sportData: Omit<SportSettings, 'id'>;
      
      if (selectedSportType === 'Ping Pong') {
        sportData = {
          type: 'Ping Pong',
          displayName: newSportDisplayName.trim(),
          trackedValue: 'points',
          trackSets: false,
          trackIndividualPoints: true,
          trackMistakes: false,
          adjustableSettings: true,
          pointsTo: 21,
          serveRotation: 2
        } as PingPongSettings;
      } else if (selectedSportType === 'Spikeball') {
        sportData = {
          type: 'Spikeball',
          displayName: newSportDisplayName.trim(),
          trackedValue: 'points',
          trackPoints: true,
          trackMistakes: false,
          adjustableSettings: true,
          pointsTo: 21,
          serveRotation: 4,
          sixFootRule: true
        } as SpikeballSettings;
      } else {
        sportData = {
          type: 'Custom',
          displayName: newSportDisplayName.trim(),
          description: '',
          scoringRules: {
            label: 'Points',
            maxScore: 21
          }
        } as CustomSportSettings;
      }

      const sportsRef = collection(db, 'leagues', leagueId as string, 'sports');
      await addDoc(sportsRef, {
        ...sportData,
        createdAt: new Date(),
        createdBy: user?.uid
      });
      
      // Reset form
      setNewSportDisplayName('');
      setSelectedSportType('Ping Pong');
      setShowAddSport(false);
      setError('');
      
      // Refresh sports list
      fetchLeagueSports();
    } catch (err) {
      console.error('Error adding sport:', err);
      setError('Failed to add sport');
    }
  };

  const handleRemoveSport = async (sportId: string) => {
    try {
      const sportRef = doc(db, 'leagues', leagueId as string, 'sports', sportId);
      await deleteDoc(sportRef);
      fetchLeagueSports();
    } catch (err) {
      console.error('Error removing sport:', err);
      setError('Failed to remove sport');
    }
  };

  const handleChange = (field: string, value: string) => {
    setEditLeague((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAccordionChange = (sportId: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedSport(isExpanded ? sportId : false);
  };

  const saveSportChanges = async (sportId: string) => {
    const changes = pendingChanges[sportId];
    console.log('Attempting to save changes for sport:', sportId, 'Changes:', changes);
    
    if (!changes || Object.keys(changes).length === 0) {
      console.log('No changes to save');
      return; // No changes to save
    }

    try {
      const sportRef = doc(db, 'leagues', leagueId as string, 'sports', sportId);
      console.log('Updating Firestore document with:', changes);
      await updateDoc(sportRef, changes);
      
      // Clear pending changes for this sport
      setPendingChanges(prev => {
        const updated = { ...prev };
        delete updated[sportId];
        return updated;
      });
      
      // Refresh sports list
      fetchLeagueSports();
      setError('');
      console.log('Sport changes saved successfully');
    } catch (err) {
      console.error('Error saving sport changes:', err);
      setError('Failed to save sport changes');
    }
  };

  const renderSportSettings = (sport: SportSettings) => {
    // Get current values (either from pending changes or original sport data)
    const currentValues = { ...sport, ...(pendingChanges[sport.id] || {}) };
    
    const updateField = (field: string, value: any) => {
      console.log('Updating field:', field, 'with value:', value, 'for sport:', sport.id);
      setPendingChanges(prev => ({
        ...prev,
        [sport.id]: {
          ...prev[sport.id],
          [field]: value
        }
      }));
    };

    const updateNestedField = (parentField: string, field: string, value: any) => {
      const currentParent = (sport as any)[parentField] || {};
      const pendingParent = (pendingChanges[sport.id] as any)?.[parentField] || {};
      
      setPendingChanges(prev => ({
        ...prev,
        [sport.id]: {
          ...prev[sport.id],
          [parentField]: {
            ...currentParent,
            ...pendingParent,
            [field]: value
          }
        }
      }));
    };

    const hasChanges = !!(pendingChanges[sport.id] && Object.keys(pendingChanges[sport.id]).length > 0);
    console.log('Has changes for sport:', Object.keys(pendingChanges[sport.id]? pendingChanges[sport.id] : {}));
    console.log("has changes", hasChanges);

    switch (sport.type) {
      case 'Ping Pong':
        const pingPongSport = currentValues as PingPongSettings;
        return (
          <Box>
            <Grid container spacing={3}>
              <Grid size={6}>
                <TextField
                  label="Display Name"
                  value={pingPongSport.displayName}
                  onChange={(e) => updateField('displayName', e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  select
                  label="Tracked Value"
                  value={pingPongSport.trackedValue}
                  onChange={(e) => updateField('trackedValue', e.target.value)}
                  fullWidth
                  size="small"
                >
                  <MenuItem value="points">Points</MenuItem>
                  <MenuItem value="sets">Sets</MenuItem>
                  <MenuItem value="games">Games</MenuItem>
                </TextField>
              </Grid>
              <Grid size={6}>
                <TextField
                  label="Points To Win"
                  type="number"
                  value={pingPongSport.pointsTo}
                  onChange={(e) => updateField('pointsTo', Number(e.target.value))}
                  fullWidth
                  size="small"
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  label="Serve Rotation"
                  type="number"
                  value={pingPongSport.serveRotation}
                  onChange={(e) => updateField('serveRotation', Number(e.target.value))}
                  fullWidth
                  size="small"
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid size={12}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  {pingPongSport.trackedValue !== 'winner' && (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={pingPongSport.trackSets}
                        onChange={(e) => updateField('trackSets', e.target.checked)}
                      />
                    }
                    label="Track Sets"
                  />
                  )}
                  {pingPongSport.trackedValue === 'points' && (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={pingPongSport.trackIndividualPoints}
                        onChange={(e) => updateField('trackIndividualPoints', e.target.checked)}
                      />
                    }
                    label="Track Individual Points"
                  />
                  )}
                  {pingPongSport.trackIndividualPoints  && (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={pingPongSport.trackMistakes}
                        onChange={(e) => updateField('trackMistakes', e.target.checked)}
                      />
                    }
                    label="Track Mistakes"
                  />
                  )}
                  <FormControlLabel
                    control={
                      <Switch
                        checked={pingPongSport.adjustableSettings}
                        onChange={(e) => updateField('adjustableSettings', e.target.checked)}
                      />
                    }
                    label="Allow Adjustable Settings"
                  />
                </Box>
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button
                variant={hasChanges ? 'contained' : 'outlined'}
                onClick={() => saveSportChanges(sport.id)}
                disabled={!hasChanges}
                color={hasChanges ? 'primary' : 'inherit'}
              >
                Save Sport
              </Button>
            </Box>
          </Box>
        );

      case 'Spikeball':
        const spikeballSport = currentValues as SpikeballSettings;
        return (
          <Box>
            <Grid container spacing={3}>
              <Grid size={6}>
                <TextField
                  label="Display Name"
                  value={spikeballSport.displayName}
                  onChange={(e) => updateField('displayName', e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  select
                  label="Tracked Value"
                  value={spikeballSport.trackedValue}
                  onChange={(e) => updateField('trackedValue', e.target.value)}
                  fullWidth
                  size="small"
                >
                  <MenuItem value="points">Points</MenuItem>
                  <MenuItem value="sets">Sets</MenuItem>
                  <MenuItem value="games">Games</MenuItem>
                </TextField>
              </Grid>
              <Grid size={6}>
                <TextField
                  label="Points To Win"
                  type="number"
                  value={spikeballSport.pointsTo}
                  onChange={(e) => updateField('pointsTo', Number(e.target.value))}
                  fullWidth
                  size="small"
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  label="Serve Rotation"
                  type="number"
                  value={spikeballSport.serveRotation}
                  onChange={(e) => updateField('serveRotation', Number(e.target.value))}
                  fullWidth
                  size="small"
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid size={12}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={spikeballSport.trackPoints}
                        onChange={(e) => updateField('trackPoints', e.target.checked)}
                      />
                    }
                    label="Track Points"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={spikeballSport.trackMistakes}
                        onChange={(e) => updateField('trackMistakes', e.target.checked)}
                      />
                    }
                    label="Track Mistakes"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={spikeballSport.adjustableSettings}
                        onChange={(e) => updateField('adjustableSettings', e.target.checked)}
                      />
                    }
                    label="Allow Adjustable Settings"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={spikeballSport.sixFootRule}
                        onChange={(e) => updateField('sixFootRule', e.target.checked)}
                      />
                    }
                    label="Six Foot Rule"
                  />
                </Box>
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button
                variant={hasChanges ? 'contained' : 'outlined'}
                onClick={() => saveSportChanges(sport.id)}
                disabled={!hasChanges}
                color={hasChanges ? 'primary' : 'inherit'}
              >
                Save Sport
              </Button>
            </Box>
          </Box>
        );

      case 'Custom':
        const customSport = currentValues as CustomSportSettings;
        return (
          <Box>
            <Grid container spacing={3}>
              <Grid size={6}>
                <TextField
                  label="Display Name"
                  value={customSport.displayName}
                  onChange={(e) => updateField('displayName', e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  label="Scoring Label"
                  value={customSport.scoringRules.label}
                  onChange={(e) => updateNestedField('scoringRules', 'label', e.target.value)}
                  fullWidth
                  size="small"
                  placeholder="e.g., Points, Goals, Rounds"
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  label="Max Score"
                  type="number"
                  value={customSport.scoringRules.maxScore}
                  onChange={(e) => updateNestedField('scoringRules', 'maxScore', Number(e.target.value))}
                  fullWidth
                  size="small"
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  label="Description"
                  value={customSport.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  fullWidth
                  multiline
                  rows={3}
                  size="small"
                  placeholder="Describe the rules and how this sport is played..."
                />
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button
                variant={hasChanges ? 'contained' : 'outlined'}
                onClick={() => saveSportChanges(sport.id)}
                disabled={!hasChanges}
                color={hasChanges ? 'primary' : 'inherit'}
              >
                Save Sport
              </Button>
            </Box>
          </Box>
        );

      default:
        return <Typography>Unknown sport type</Typography>;
    }
  };

  return (
    <Paper elevation={3} style={{ padding: '16px', margin: '16px 0' }}>
      <Box>
        <Typography variant="h2">Gameplay Settings</Typography>
        <Typography variant="body2">Select which sports are available for this league, adjust them to fit your style and preferences for recording and tracking stats</Typography>
      </Box>

      <Divider style={{ margin: '16px 0' }} />

      <Grid container sx={{spacing: 2, px: 4}} >
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
                      expanded={expandedSport === sport.id}
                      onChange={handleAccordionChange(sport.id)}
                      sx={{ mb: 1 }}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls={`sport-${sport.id}-content`}
                        id={`sport-${sport.id}-header`}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="h6">{sport.displayName}</Typography>
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
                          {renderSportSettings(sport)}
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              )}

              <Button
                variant="outlined"
                onClick={() => setShowAddSport(!showAddSport)}
                sx={{ mb: 2 }}
              >
                {showAddSport ? 'Cancel' : 'Add Sport'}
              </Button>

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
                      variant="contained"
                      onClick={handleAddSport}
                      disabled={!newSportDisplayName.trim()}
                    >
                      Save Sport
                    </Button>
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

      <Grid container sx={{spacing: 2, px: 4}} >
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