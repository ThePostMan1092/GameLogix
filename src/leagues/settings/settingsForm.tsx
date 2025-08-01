import { useState, useEffect} from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Select, Switch, Box, Typography, Grid,
  ToggleButton, ToggleButtonGroup, Accordion, AccordionSummary, AccordionDetails, Checkbox
} from '@mui/material';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import { type Sport, sportParent } from '../../types/sports.ts'; 
import sports from '../../types/sports.ts'; // Import the default export
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../Backend/firebase';
import { useAuth } from '../../Backend/AuthProvider';
import { useParams } from 'react-router-dom';

const steps = [
  'Game Type',
  'Basic Structure',
  'Scoring System',
  'Recording Structure',
  'Player/Team Data',
  'Special Rules'
];

interface SportSetupDialogProps {
  open: boolean;
  onClose: () => void;
  leagueId?: string;
  onSportAdded?: () => void;
  editingSport?: Sport;
}

export default function SportSetupDialog({ open, onClose, leagueId, onSportAdded, editingSport }: SportSetupDialogProps) {
  const { user } = useAuth();
  const params = useParams();
  const currentLeagueId = leagueId || params.leagueId;
  
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [sport, setSport] = useState<Sport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const openSavedSport = (savedSport: Sport) => {
    setSport(savedSport);
    setFormData({
      name: savedSport.name || '',
      sportParent: savedSport.sportParent || '',
      description: savedSport.description || '',
      gameType: savedSport.gameType || '',
      teamFormat: savedSport.teamFormat || '',
      recordLayout: savedSport.recordLayout || '',
      numberOfTeams: savedSport.numberOfTeams ?? 2,
      playersPerTeam: savedSport.playersPerTeam ?? 2,
      trackByPlayer: savedSport.trackByPlayer ?? false,
      useRounds: savedSport.useRounds ?? false,
      roundsName: savedSport.roundsName || '',
      winCondition: savedSport.winCondition || '',
      winPoints: savedSport.winPoints ?? '',
      winRounds: savedSport.winRounds ?? '',
      canTie: savedSport.canTie ?? false,
      winBy: savedSport.winBy || '',
      playStyle: savedSport.playStyle || '',
      customStats: savedSport.customStats ? savedSport.customStats : [],
      customSpecialRules: savedSport.customSpecialRules ? savedSport.customSpecialRules : [],
      adjustable: savedSport.adjustable ?? true,
      // Add any other fields you need to support editing
    });
    setStep(0); // Optionally reset to first step
  };

  // Fetch data when dialog opens
  useEffect(() => {
    if (open && editingSport) {
      openSavedSport(editingSport);
    } else if (open && !editingSport) {
      // Reset form for new sport
      setFormData({});
      setSport(null);
      setStep(0);
    }
  }, [open, editingSport]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSportSelection = (event: any) => {
    const selectedValue = event.target.value as string;
    
    if (selectedValue === 'custom') {
      // Reset to empty sport for custom configuration
      setSport(null);
      setFormData({});
    } else {
      // Find the predefined sport from sports.ts
      const predefinedSport = sports.find((s: Sport) => s.name === selectedValue);
      if (predefinedSport) {
        setSport(predefinedSport);
        console.log('Selected sport:', predefinedSport);
        // Pre-populate form data with the sport's preset configuration
        setFormData({
            name: predefinedSport.name || '',
            sportParent: predefinedSport.sportParent || '',
            description: predefinedSport.description || '',
            gameType: predefinedSport.gameType || '',
            teamFormat: predefinedSport.teamFormat || '',
            playerLayout: predefinedSport.playerLayout || '',
            recordLayout: predefinedSport.recordLayout || '',
            numberOfTeams: predefinedSport.numberOfTeams ?? 2,
            playersPerTeam: predefinedSport.playersPerTeam ?? 2,
            trackByPlayer: predefinedSport.trackByPlayer ?? false,
            useRounds: predefinedSport.useRounds ?? false,
            roundsName: predefinedSport.roundsName || '',
            winCondition: predefinedSport.winCondition || '',
            winPoints: predefinedSport.winPoints ?? '',
            winRounds: predefinedSport.winRounds ?? '',            
            canTie: predefinedSport.canTie ?? false,
            winBy: predefinedSport.winBy || '',
            playStyle: predefinedSport.playStyle || '',
            customStats: predefinedSport.customStats ? predefinedSport.customStats : [],
            customSpecialRules: predefinedSport.customSpecialRules ? predefinedSport.customSpecialRules: [],
            adjustable: predefinedSport.adjustable ?? true,
        });
      }
    }
  };

  const next = () => setStep(prev => Math.min(prev + 1, steps.length - 1));
  const back = () => setStep(prev => Math.max(prev - 1, 0));

  const handleSubmit = async () => {
    if (!currentLeagueId || !user || !formData) {
      setError('Missing required data for submission');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create the sport object to save - filter out undefined values
      const sportData: any = {
        name:  (formData as any).name || sport?.name || 'Custom Sport',
        sportParent: (formData as any).sportParent || 'Custom',
        description: (formData as any).description || '',
        gameType: (formData as any).gameType || 'competition',
        teamFormat: (formData as any).teamFormat || 'teams',
        numberOfTeams: parseInt((formData as any).numberOfTeams) || 2,
        playersPerTeam: parseInt((formData as any).playersPerTeam) || 2,
        trackByPlayer: (formData as any).trackByPlayer === true,
        useRounds: (formData as any).useRounds === true,
        roundsName: (formData as any).roundsName || 'Round',
        trackPerRound: (formData as any).trackPerRound === true,
        winCondition: (formData as any).winCondition || 'First to point limit',
        canTie: (formData as any).canTie === true,
        playStyle: (formData as any).playStyle || 'simultaneous',
        customStats: (formData as any).customStats || [],
        customSpecialRules: (formData as any).customSpecialRules || [],
        isActive: true,
        createdAt: new Date(),
        createdBy: user.uid,
        adjustable: (formData as any).adjustable === true
      };

      // Only add optional fields if they have valid values
      if ((formData as any).recordLayout && (formData as any).recordLayout !== '') {
        sportData.recordLayout = (formData as any).recordLayout;
      }

      const maxRoundsValue = parseInt((formData as any).maxRounds);
      if (!isNaN(maxRoundsValue) && maxRoundsValue > 0) {
        sportData.maxRounds = maxRoundsValue;
      }

      const winPointsValue = parseInt((formData as any).winPoints);
      if (!isNaN(winPointsValue) && winPointsValue > 0) {
        sportData.winPoints = winPointsValue;
      }

      const winRoundsValue = parseInt((formData as any).winRounds);
      if (!isNaN(winRoundsValue) && winRoundsValue > 0) {
        sportData.winRounds = winRoundsValue;
      }

      const winByValue = parseInt((formData as any).winBy);
      if (!isNaN(winByValue) && winByValue > 0) {
        sportData.winBy = winByValue;
      }

      console.log('Sport data to save:', sportData);

      const sportToSave = sportData;

      // Save to Firestore
      if (editingSport && editingSport.id) {
        // Update existing sport
        const sportRef = doc(db, 'leagues', currentLeagueId, 'sports', editingSport.id);
        await updateDoc(sportRef, sportToSave); // formValues = your updated sport data
      } else {
        // Create new sport
        const sportsRef = collection(db, 'leagues', currentLeagueId, 'sports');
        await addDoc(sportsRef, sportToSave);
      }

      // Reset form and close dialog
      setFormData({});
      setSport(null);
      setStep(0);
      onClose();
      
      // Refresh the sports list in the parent component
      if (onSportAdded) {
        onSportAdded();
      }
    } catch (err) {
      console.error('Error saving sport:', err);
      setError('Failed to save sport configuration');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <>
            <FormControl fullWidth margin="normal">
              <FormLabel>Select Game to add</FormLabel>
              <Select
                sx={{ mb: 1 }}
                value={sport?.name || ''}
                onChange={handleSportSelection}
              >
                {sports.map((sport: Sport) => (
                  <MenuItem key={sport.name} value={sport.name}>
                    {sport.name}
                  </MenuItem>
                ))}
                <MenuItem key="add-custom" value="custom">
                  Add Custom Game
                </MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <FormLabel>Select Game Parent</FormLabel>
              <Select
                value={(formData as any).sportParent || ''}
                onChange={e => handleChange('sportParent', e.target.value)}
                fullWidth
              >
                {(Array.isArray(sportParent) ? sportParent : []).map((Parent: string) => (
                  <MenuItem key={Parent} value={Parent}>
                    {Parent}
                  </MenuItem>
                ))} 
              </Select>
            </FormControl>

            <TextField
              label="Game Name"
              value={(formData as any).name || ''}
              onChange={e => handleChange('name', e.target.value)}
              fullWidth
              margin="normal"
            />
            
            <TextField
              label="Game Description"
              multiline
              rows={3}
              value={(formData as any).description || ''}    
              onChange={e => handleChange('description', e.target.value)}
              fullWidth
              margin="normal"
            />
          </>
        );
      case 1:
        return (
          <>
            <FormControl fullWidth margin="normal">
              <FormLabel>Is this a solo game or a competition?</FormLabel>
              <RadioGroup 
                value={(formData as any).gameType || ''}
                onChange={e => handleChange('gameType', e.target.value)}
              >
                <FormControlLabel value="solo" control={<Radio />} label="Solo" />
                <FormControlLabel value="competition" control={<Radio />} label="Competition" />
              </RadioGroup>
            </FormControl>
            
            {(formData as any).gameType === 'competition' && (
              <div>
                <FormControl fullWidth margin="normal">
                  <FormLabel>Are players on teams or individuals?</FormLabel>
                  <RadioGroup 
                    value={(formData as any).teamFormat || ''}
                    onChange={e => handleChange('teamFormat', e.target.value)}
                  >
                    <FormControlLabel value="individuals" control={<Radio />} label="Individuals" />
                    <FormControlLabel value="teams" control={<Radio />} label="Teams" />
                  </RadioGroup>
                </FormControl>
                <TextField
                      fullWidth
                      type="number"
                      label={`How many ${sport?.teamFormat || 'bobo'}?`}
                      value={(formData as any).numberOfTeams || ''}
                      onChange={e => handleChange('numberOfTeams', e.target.value)}
                      margin="normal"
                    />
                
                {(formData as any).teamFormat === 'teams' && (
                  <div>
                    <TextField
                      fullWidth
                      type="number"
                      label="How many players per team?"
                      value={(formData as any).playersPerTeam || ''}
                      onChange={e => handleChange('playersPerTeam', e.target.value)}
                      margin="normal"
                    />
                  </div>
                )}
              </div>
            )}
          </>
        );
      case 2:
        return (
          <>
            <FormControl fullWidth margin="normal">
              <FormLabel>Round information</FormLabel>
              <Box display="flex" justifyContent="space-between" alignItems="center" gap={2} px={3}>
                <Typography variant="body1">
                  Are there rounds?
                </Typography>
                <Switch
                  checked={(formData as any).useRounds}
                  onChange={e => handleChange('useRounds', e.target.checked)}
                />
              </Box>
              { (formData as any).useRounds && (
                <>
                  <Grid container gap={1} mt={.5} px={3}>
                      <Grid size={6}>
                          <TextField
                              fullWidth
                              size="small"
                              label="Name (e.g. Set, Match)"
                              type="text"
                              value={(formData as any).roundsName || ''}
                              onChange={e => handleChange('roundsName', e.target.value)}
                          />
                      </Grid>
                      <Grid size={5.5}>
                          <TextField
                              fullWidth
                              size="small"
                              label="Max number of rounds"
                              type="number"
                              value={(formData as any).maxRounds || ''}
                              onChange={e => handleChange('maxRounds', e.target.value)}
                          />
                      </Grid>
                  </Grid>
                
                </>
              )}
              
            </FormControl>

            <FormLabel>Win Conditions</FormLabel>
            <Box gap={2} px={3}>
                <Grid container gap={1} mt={.5}>
                    <Grid size={7.6}>
                        <Select
                            fullWidth
                            value={(formData as any).winCondition || ''}
                            onChange={e => handleChange('winCondition', e.target.value)}
                        >
                            { !(formData as any).useRounds && (
                              <MenuItem key="first-to-point-limit" value="First to point limit">
                                First to point limit
                              </MenuItem>
                            )}
                            { (formData as any).useRounds && (
                            <MenuItem key="first-to-round-limit" value="First to round limit">
                                First to round limit
                            </MenuItem>
                            )}
                            <MenuItem key="most-points" value="Most points">
                                Most points
                            </MenuItem>
                        </Select>
                    </Grid>
                    { (formData as any).winCondition === 'First to point limit' && (
                        <Grid size={4}>
                            <TextField
                                fullWidth
                                label="Point limit"
                                type="number"
                                value={(formData as any).winPoints || ''}
                                onChange={e => handleChange('winPoints', e.target.value)}
                            />
                        </Grid>
                    )}
                    { (formData as any).winCondition === 'First to round limit' && (
                        <Grid size={4}>
                            <TextField
                                fullWidth
                                label="Round limit"
                                type="number"
                                value={(formData as any).winRounds || ''}
                                onChange={e => handleChange('winRounds', e.target.value)}
                            />
                        </Grid>
                    )}
                </Grid>
                <Box display="flex" justifyContent="space-between" alignItems="center" gap={2} px={0}>
                    <Typography variant="body1">
                        Do not allow ties
                    </Typography>
                    <Switch
                    checked={(formData as any).canTie || false}
                    onChange={e => handleChange('canTie', e.target.checked)}
                    />
                </Box>
                { (formData as any).canTie && (
                    <Grid container gap={1} mt={.5} px={0}>
                        <Grid size={12}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Win by required amount? (optional)"
                                type="text"
                                value={(formData as any).winByAmount || ''}
                                onChange={e => handleChange('winByAmount', e.target.value)}
                            />
                        </Grid>
                    </Grid>
                )}
            </Box>
          </>
        );
      case 3:
        return (
            <>
            <ToggleButtonGroup
                exclusive
                fullWidth
                >
                <ToggleButton value="card" selected={(formData as any).recordLayout === 'cards'} onClick={() => handleChange('recordLayout', 'cards')}>
                    <Typography variant="h6">Card Layout</Typography>
                </ToggleButton>
                <ToggleButton value="sheet" selected={(formData as any).recordLayout === 'sheets'} onClick={() => handleChange('recordLayout', 'sheets')}>
                    <Typography variant="h6">Sheet Layout</Typography>
                </ToggleButton>
            </ToggleButtonGroup>
            
            <Box display="flex" justifyContent="space-between" alignItems="center" gap={2} px={3}>
                <Typography variant="body1">
                Would you like to track score for each round?
                </Typography>
                <Switch
                checked={(formData as any).trackPerRound || false}
                onChange={e => handleChange('trackPerRound', e.target.checked)}
                />
            </Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" gap={2} px={3}>
                <Typography variant="body1">
                Would you like to track stats for each player?
                </Typography>
                <Switch
                checked={(formData as any).trackByPlayer || false}
                onChange={e => handleChange('trackByPlayer', e.target.checked)}
                />
            </Box>
            

          </>
        );
      case 4:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Define Stats to Track
            </Typography>

            {/* Add new stat form */}
            <Box sx={{ border: 1, borderColor: 'grey.400', borderRadius: 1, p: 2, backgroundColor: 'grey.50' }}>
              <Typography variant="subtitle1" gutterBottom>Add New Stat</Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid size={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Stat Name"
                    placeholder="e.g. Goals, Assists, Time"
                    value={(formData as any).newStatName || ''}
                    onChange={e => handleChange('newStatName', e.target.value)}
                  />
                </Grid>
                <Grid size={6}>
                  <Select
                    fullWidth
                    size="small"
                    value={(formData as any).newStatDataType || ''}
                    onChange={e => handleChange('newStatDataType', e.target.value)}
                    displayEmpty
                  >
                    <MenuItem value="" disabled>Select Data Type</MenuItem>
                    <MenuItem value="number">Number</MenuItem>
                    <MenuItem value="time">Time (mm:ss)</MenuItem>
                    <MenuItem value="boolean">Yes/No</MenuItem>
                    <MenuItem value="text">Text</MenuItem>
                    <MenuItem value="counter">Counter</MenuItem>
                  </Select>
                </Grid>
                <Grid size={2}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={(formData as any).mainScore || false}
                        onChange={e => handleChange('mainScore', e.target.checked)}
                      />
                    }
                    label="Points"
                  />
                </Grid>
                <Grid size={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Unit (optional)"
                    placeholder="points, goals, seconds"
                    value={(formData as any).newStatUnit || ''}
                    onChange={e => handleChange('newStatUnit', e.target.value)}
                  />
                </Grid>
                <Grid size={7}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Description (optional)"
                    placeholder="Brief description of what this tracks"
                    value={(formData as any).newStatDescription || ''}
                    onChange={e => handleChange('newStatDescription', e.target.value)}
                  />
                </Grid>
                
                {/* Conditional fields based on data type */}
                {(formData as any).newStatDataType === 'number' && (
                  <>
                    <Grid size={3}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Min Value"
                        type="number"
                        value={(formData as any).newStatMin || ''}
                        onChange={e => handleChange('newStatMin', e.target.value)}
                      />
                    </Grid>
                    <Grid size={3}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Max Value"
                        type="number"
                        value={(formData as any).newStatMax || ''}
                        onChange={e => handleChange('newStatMax', e.target.value)}
                      />
                    </Grid>
                    <Grid size={3}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Default Value"
                        type="number"
                        value={(formData as any).newStatDefault || ''}
                        onChange={e => handleChange('newStatDefault', e.target.value)}
                      />
                    </Grid>
                    <Grid size={3}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Decimal Places"
                        type="number"
                        value={(formData as any).newStatDecimals || '0'}
                        onChange={e => handleChange('newStatDecimals', e.target.value)}
                      />
                    </Grid>
                  </>
                )}

                <Grid size={12}>
                  <Button
                    variant="contained"
                    fullWidth
                    disabled={!(formData as any).newStatName || !(formData as any).newStatDataType}
                    onClick={() => {
                      const newStat = {
                        name: (formData as any).newStatName,
                        dataType: (formData as any).newStatDataType,
                        unit: (formData as any).newStatUnit || null,
                        description: (formData as any).newStatDescription || null,
                        minValue: (formData as any).newStatMin ? Number((formData as any).newStatMin) : null,
                        maxValue: (formData as any).newStatMax ? Number((formData as any).newStatMax) : null,
                        defaultValue: (formData as any).newStatDefault || null,
                        decimalPlaces: (formData as any).newStatDecimals ? Number((formData as any).newStatDecimals) : 0,
                        affectsScore: (formData as any).mainScore || false
                      };
                      
                      const existingStats = (formData as any).customStats || [];
                      handleChange('customStats', [...existingStats, newStat]);
                      
                      // Clear form
                      handleChange('newStatName', '');
                      handleChange('newStatDataType', '');
                      handleChange('newStatUnit', '');
                      handleChange('newStatDescription', '');
                      handleChange('newStatMin', '');
                      handleChange('newStatMax', '');
                      handleChange('newStatDefault', '');
                      handleChange('newStatDecimals', '0');
                    }}
                  >
                    Add Stat
                  </Button>
                </Grid>
              </Grid>
            {/* Display existing stats as accordions */}
            {((formData as any).customStats || []).map((stat: any, index: number) => (
              <Box key={index} sx={{ my: 2 }}>
                <Accordion>
                  <AccordionSummary>
                    <Typography variant="body2" fontWeight="bold">{stat.name}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid size={6}>
                        <Typography variant="body2"><strong>Type:</strong> {stat.dataType}</Typography>
                      </Grid>
                      <Grid size={3}>
                        <Typography variant="body2"><strong>Unit:</strong> {stat.unit || 'N/A'}</Typography>
                      </Grid>
                       <Grid size={3}>
                        <Typography variant="body2"><strong>Affects Score:</strong> {stat.affectsScore ? 'Yes' : 'No'}</Typography>
                      </Grid>
                      <Grid size={12}>
                        <Typography variant="body2"><strong>Description:</strong> {stat.description || 'No description'}</Typography>
                      </Grid>
                      {stat.dataType === 'number' && (
                        <>
                          <Grid size={6}>
                            <Typography variant="body2"><strong>Min:</strong> {stat.minValue ?? 'N/A'}</Typography>
                          </Grid>
                          <Grid size={6}>
                            <Typography variant="body2"><strong>Max:</strong> {stat.maxValue ?? 'N/A'}</Typography>
                          </Grid>
                          <Grid size={6}>
                            <Typography variant="body2"><strong>Default:</strong> {stat.defaultValue ?? 'N/A'}</Typography>
                          </Grid>
                          <Grid size={6}>
                            <Typography variant="body2"><strong>Decimals:</strong> {stat.decimalPlaces ?? 0}</Typography>
                          </Grid>
                        </>
                      )}
                      <Grid size={12}>
                        <Button 
                          size="small" 
                          color="error"
                          onClick={() => {
                            const newStats = [...((formData as any).customStats || [])];
                            newStats.splice(index, 1);
                            handleChange('customStats', newStats);
                          }}
                        >
                          Remove
                        </Button>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Box>
            ))}

            
            </Box>
            </Box>
        );
      case 5:
        return (
          <>
            <Typography variant="h6" gutterBottom>
              Special Rules
            </Typography>

            {/* Display existing special rules */}
            {((formData as any).customSpecialRules || []).map((rule: any, index: number) => (
              <Box key={index} sx={{ border: 1, borderColor: 'grey.300', borderRadius: 1, p: 2, mb: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid size={3}>
                    <Typography variant="body2" fontWeight="bold">{rule.name}</Typography>
                  </Grid>
                  <Grid size={7}>
                    <Typography variant="body2">{rule.description}</Typography>
                  </Grid>
                  <Grid size={2}>
                    <Button 
                      size="small" 
                      color="error"
                      onClick={() => {
                        const newRules = [...((formData as any).customSpecialRules || [])];
                        newRules.splice(index, 1);
                        handleChange('customSpecialRules', newRules);
                      }}
                    >
                      Remove
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            ))}

            {/* Add new special rule form */}
            <Box sx={{ border: 1, borderColor: 'grey.400', borderRadius: 1, p: 2, backgroundColor: 'grey.50' }}>
              <Typography variant="subtitle1" gutterBottom>Add New Special Rule</Typography>
              <Grid container spacing={2}>
                <Grid size={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Rule Name"
                    placeholder="e.g. 6in Server, Double Bounce"
                    value={(formData as any).newRuleName || ''}
                    onChange={e => handleChange('newRuleName', e.target.value)}
                  />
                </Grid>
                <Grid size={8}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Rule Description"
                    placeholder="Describe how this rule works"
                    value={(formData as any).newRuleDescription || ''}
                    onChange={e => handleChange('newRuleDescription', e.target.value)}
                  />
                </Grid>
                <Grid size={12}>
                  <Button
                    variant="contained"
                    fullWidth
                    disabled={!(formData as any).newRuleName || !(formData as any).newRuleDescription}
                    onClick={() => {
                      const newRule = {
                        name: (formData as any).newRuleName,
                        description: (formData as any).newRuleDescription
                      };
                      
                      const existingRules = (formData as any).customSpecialRules || [];
                      handleChange('customSpecialRules', [...existingRules, newRule]);
                      
                      // Clear form
                      handleChange('newRuleName', '');
                      handleChange('newRuleDescription', '');
                    }}
                  >
                    Add Special Rule
                  </Button>
                </Grid>
              </Grid>
            </Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mt={1} gap={2} px={3}>
                <Typography variant="body1">
                  Should these rules be adjustable at time of recording?
                </Typography>
                <Switch
                  checked={(formData as any).adjustable || false}
                  onChange={e => handleChange('adjustable', e.target.checked)}
                />
            </Box>

          </>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{steps[step]}</DialogTitle>
      <DialogContent>
        {error && (
          <div style={{ color: 'red', marginBottom: '.5rem' }}>
            {error}
          </div>
        )}
        {renderStep()}
      </DialogContent>
      <DialogActions>
        <Button onClick={back} disabled={step === 0}>Back</Button>
        {step < steps.length - 1 ? (
          <Button onClick={next}>Next</Button>
        ) : (
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : 'Submit'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
