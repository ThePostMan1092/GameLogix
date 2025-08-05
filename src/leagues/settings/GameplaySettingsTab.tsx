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
  const [editingSport, setEditingSport] = useState<any>(null);

  const availableSportTypes = ['Ping Pong', 'Spikeball', 'Custom'] as const;

  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!leagueId) return;
    fetchLeagueData();
    fetchLeagueSports();
  }, [leagueId]);

const openSavedSport = (sport: any) => {
  setEditingSport(sport);
  setDialogOpen(true);
};


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
                    <Accordion key={sport.id} sx={{ mb: 1 }}>
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls={`sport-${sport.id}-content`}
                        id={`sport-${sport.id}-header`}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Chip
                            color={sport.type === 'Custom' ? 'secondary' : 'primary'}
                            label={sport.type}
                            size="small"
                          />
                          <Typography variant="h6">{sport.name}</Typography>
                        </Box>
                      </AccordionSummary>
                        <AccordionDetails>
                        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <Typography variant="h6">{sport.displayName}</Typography>
                          
                          {/* Comprehensive Sport Settings Display */}
                          <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                              Sport Configuration:
                            </Typography>
                            
                            {/* Competition Structure */}
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', display: 'block', mb: 1 }}>
                                Competition Structure:
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                                <Chip size="small" label={`Game Type: ${sport.gameType || 'Competition'}`} color="primary" variant="outlined" />
                                <Chip size="small" label={`Format: ${sport.teamFormat || 'Teams'}`} color="primary" variant="outlined" />
                                {sport.numberOfTeams && (
                                  <Chip size="small" label={`${sport.numberOfTeams} Teams`} color="info" variant="outlined" />
                                )}
                                {sport.playersPerTeam && (
                                  <Chip size="small" label={`${sport.playersPerTeam} Players per Team`} color="info" variant="outlined" />
                                )}
                                {sport.playStyle && (
                                  <Chip size="small" label={`${sport.playStyle} Play`} color="secondary" variant="outlined" />
                                )}
                              </Box>
                            </Box>

                            {/* Win Conditions */}
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', display: 'block', mb: 1 }}>
                                Win Conditions:
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                                {sport.winCondition && (
                                  <Chip size="small" label={sport.winCondition} color="success" variant="outlined" />
                                )}
                                {sport.winPoints && sport.winPoints > 0 && (
                                  <Chip size="small" label={`${sport.winPoints} Points to Win`} color="success" variant="outlined" />
                                )}
                                {sport.winRounds && sport.winRounds > 0 && (
                                  <Chip size="small" label={`${sport.winRounds} Rounds to Win`} color="success" variant="outlined" />
                                )}
                                {sport.winBy && sport.winBy > 0 && (
                                  <Chip size="small" label={`Win by ${sport.winBy}`} color="warning" variant="outlined" />
                                )}
                                <Chip 
                                  size="small" 
                                  label={sport.cannotTie ? "No Ties" : "Ties Allowed"} 
                                  color={sport.cannotTie ? "error" : "info"} 
                                  variant="outlined" 
                                />
                              </Box>
                            </Box>

                            {/* Round System */}
                            {sport.useRounds && (
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', display: 'block', mb: 1 }}>
                                  Round System:
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                                  <Chip size="small" label="Uses Rounds" color="primary" variant="outlined" />
                                  {sport.roundsName && (
                                    <Chip size="small" label={`Called: ${sport.roundsName}`} color="primary" variant="outlined" />
                                  )}
                                  {sport.maxRounds && sport.maxRounds > 0 && (
                                    <Chip size="small" label={`Max: ${sport.maxRounds} Rounds`} color="primary" variant="outlined" />
                                  )}
                                  {sport.trackPerRound && (
                                    <Chip size="small" label="Track Per Round" color="secondary" variant="outlined" />
                                  )}
                                </Box>
                              </Box>
                            )}

                            {/* Tracking Options */}
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', display: 'block', mb: 1 }}>
                                Tracking Options:
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                                <Chip 
                                  size="small" 
                                  label={sport.trackByPlayer ? "Track by Player" : "Track by Team"} 
                                  color={sport.trackByPlayer ? "primary" : "default"} 
                                  variant="outlined" 
                                />
                                <Chip 
                                  size="small" 
                                  label={sport.activeTrack ? "Active Tracking" : "Post-Game Entry"} 
                                  color={sport.activeTrack ? "success" : "default"} 
                                  variant="outlined" 
                                />
                                {sport.recordLayout && (
                                  <Chip size="small" label={`${sport.recordLayout} Layout`} color="info" variant="outlined" />
                                )}
                              </Box>
                            </Box>

                            {/* Custom Statistics */}
                            {sport.customStats?.length > 0 && (
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', display: 'block', mb: 1 }}>
                                  Custom Statistics ({sport.customStats.length} total):
                                </Typography>
                                
                                {/* Score-affecting stats */}
                                {sport.customStats.filter((stat: any) => stat.affectsScore).length > 0 && (
                                  <Box sx={{ mb: 1 }}>
                                    <Typography variant="caption" color="success.main" sx={{ fontSize: '0.7rem', display: 'block', mb: 0.5 }}>
                                      Score-Affecting Stats:
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                                      {sport.customStats.filter((stat: any) => stat.affectsScore).map((stat: any, index: number) => (
                                        <Chip 
                                          key={index}
                                          size="small" 
                                          label={`${stat.name}${stat.pointValue ? ` (+${stat.pointValue})` : ''}`}
                                          color="success" 
                                          variant="filled"
                                          sx={{ fontSize: '0.7rem', height: '20px' }}
                                        />
                                      ))}
                                    </Box>
                                  </Box>
                                )}

                                {/* Non-score-affecting stats */}
                                {sport.customStats.filter((stat: any) => !stat.affectsScore).length > 0 && (
                                  <Box sx={{ mb: 1 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block', mb: 0.5 }}>
                                      Tracking-Only Stats:
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                      {sport.customStats.filter((stat: any) => !stat.affectsScore).map((stat: any, index: number) => (
                                        <Chip 
                                          key={index}
                                          size="small" 
                                          label={stat.name}
                                          color="default" 
                                          variant="outlined"
                                          sx={{ fontSize: '0.7rem', height: '20px' }}
                                        />
                                      ))}
                                    </Box>
                                  </Box>
                                )}
                              </Box>
                            )}

                            {/* Special Rules */}
                            {sport.customSpecialRules?.length > 0 && (
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', display: 'block', mb: 1 }}>
                                  Special Rules ({sport.customSpecialRules.length}):
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {sport.customSpecialRules.map((rule: any, index: number) => (
                                    <Chip 
                                      key={index}
                                      size="small" 
                                      label={rule.name}
                                      color="warning" 
                                      variant="outlined"
                                      title={rule.description}
                                      sx={{ fontSize: '0.7rem', height: '20px' }}
                                    />
                                  ))}
                                </Box>
                              </Box>
                            )}

                            {/* Tiebreaker Stats */}
                            {sport.cannotTie && sport.tiebreakerStats?.length > 0 && (
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', display: 'block', mb: 1 }}>
                                  Tiebreaker Rules ({sport.tiebreakerStats.length}):
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                  {sport.tiebreakerStats.map((tiebreaker: any, index: number) => (
                                    <Box key={index} sx={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      gap: 1, 
                                      p: 1, 
                                      bgcolor: 'grey.50', 
                                      borderRadius: 1,
                                      border: '1px solid',
                                      borderColor: 'secondary.main'
                                    }}>
                                      <Typography variant="caption" sx={{ 
                                        minWidth: 20, 
                                        fontWeight: 'bold', 
                                        color: 'primary.main',
                                        fontSize: '0.65rem' 
                                      }}>
                                        #{index + 1}
                                      </Typography>
                                      <Typography variant="caption" sx={{ 
                                        flex: 1, 
                                        fontSize: '0.7rem',
                                        fontWeight: 'medium'
                                      }}>
                                        {tiebreaker.statName}
                                      </Typography>
                                      <Chip 
                                        size="small"
                                        label={tiebreaker.tiebreakerValue > 0 ? 'Higher wins' : 'Lower wins'}
                                        color={tiebreaker.tiebreakerValue > 0 ? 'success' : 'warning'}
                                        variant="outlined"
                                        sx={{ fontSize: '0.65rem', height: '18px' }}
                                      />
                                    </Box>
                                  ))}
                                </Box>
                              </Box>
                            )}

                            {/* Default message - updated condition */}
                            {!sport.useRounds && 
                             !sport.trackByPlayer && 
                             (!sport.customStats || sport.customStats.length === 0) &&
                             (!sport.customSpecialRules || sport.customSpecialRules.length === 0) &&
                             (!sport.tiebreakerStats || sport.tiebreakerStats.length === 0) &&
                             !sport.winCondition &&
                             !sport.numberOfTeams &&
                             !sport.playersPerTeam && (
                              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                Using default settings - no custom configuration applied
                              </Typography>
                            )}
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Button
                          size="small"
                          color="primary"
                          startIcon={<ExpandMoreIcon />}
                          onClick={() => {
                            openSavedSport(sport);

                          }}
                          sx={{ mt: 2 }}
                          >
                          Edit / View Stats
                          </Button>
                          <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleRemoveSport(sport.id)}
                          sx={{ mt: 2 }}
                          >
                          Delete
                          </Button>
                          </Box>
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
                onClose={() => {setDialogOpen(false);
                  setEditingSport(null);
                }} 
                  onSportAdded={() => {
                  fetchLeagueSports();
                  setEditingSport(null);
                }}
                editingSport={editingSport}
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