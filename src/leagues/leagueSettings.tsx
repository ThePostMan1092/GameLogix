import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper,  Button, Alert, CircularProgress, Card, CardContent, Avatar, Chip, TextField, Badge, Grid,
  FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel, Accordion, AccordionSummary, AccordionDetails, IconButton
} from '@mui/material';
import { 
  ExpandMore as ExpandMoreIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Settings as SettingsIcon,
  People as PeopleIcon,
  SportsEsports as SportsIcon,
  Security as SecurityIcon,
  Palette as PaletteIcon,
  EmojiEvents as TrophyIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuth } from '../Backend/AuthProvider';
import { db } from '../Backend/firebase';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  arrayUnion,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
} from 'firebase/firestore';
import { type LeagueSettings as LeagueSettingsType } from './league';
import { sendSystemMessage } from '../Inbox';
import type { LeagueSettings, SportSettings, SpikeballSettings, PingPongSettings, CustomSportSettings } from './league';




interface JoinRequest {
  id: string;
  playerId: string;
  playerName: string;
  playerEmail: string;
  requestedAt: any;
  LeagueId: string;
}

interface EditingSection {
  basicInfo: boolean;
  accessSettings: boolean;
  gameplaySettings: boolean;
  memberSettings: boolean;
  customization: boolean;
  rankingSettings: boolean;
}

const LeagueSettings: React.FC = () => {
  console.log('LeagueSettings: component rendered');
  const { LeagueId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [league, setLeague] = useState<LeagueSettingsType | null>(null);
  const [editedLeague, setEditedLeague] = useState<LeagueSettingsType | null>(null);
  const [editedSportsSettings, setEditedSportsSettings] = useState<SportSettings[]>(editedLeague?.sports || []);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState<EditingSection>({
    basicInfo: false,
    accessSettings: false,
    gameplaySettings: false,
    memberSettings: false,
    customization: false,
    rankingSettings: false
  });
  const availableSports: SportSettings['type'][] = [
    'Ping Pong',
    'Spikeball',
    'Custom'
  ];


  useEffect(() => {
    console.log('LeagueId:', LeagueId);
    console.log('user:', user);
    console.log('LeagueSettings: useEffect called');
    if (!LeagueId || !user) return(setError('Invalid league or user.'));
    
    const fetchData = async () => {
      try {
        // Fetch league data
        const leagueDoc = await getDoc(doc(db, 'leagues', LeagueId));
        if (!leagueDoc.exists()) {
          setError('League not found.');
          return;
        }
        
        const leagueData = { id: leagueDoc.id, ...leagueDoc.data() } as LeagueSettingsType;
        
        // Check if user is admin
        if (leagueData.adminId !== user.uid) {
          setError('You are not authorized to manage this league.');
          return;
        }
        
        setLeague(leagueData);
        setEditedLeague(leagueData);
        
        // Fetch join requests (messages of type 'approval' for this league)
        const requestsQuery = query(
          collection(db, 'messages'),
          where('type', '==', 'approval'),
          where('recipientId', '==', user.uid)
        );
        const requestsSnap = await getDocs(requestsQuery);
        
        
        // Filter requests for this specific league and extract player info
        const requests: JoinRequest[] = [];
        for (const doc of requestsSnap.docs) {
          const data = doc.data();
          if (data.actionUrl?.includes(LeagueId)) {
            // Extract player info from message content or fetch from users collection
            requests.push({
              id: doc.id,
              playerId: data.senderId || '', // You may need to add senderId to your message structure
              playerName: data.content.split(' ')[0] || 'Unknown Player',
              playerEmail: '',
              requestedAt: data.createdAt,
              LeagueId: LeagueId
            });
          }
        }
        
        setJoinRequests(requests);
      } catch (err) {
        setError('Failed to load league data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [LeagueId, user]);

  const handleApproveRequest = async (request: JoinRequest) => {
    if (!league) return;
    
    try {
      // Add user to league members
      await updateDoc(doc(db, 'leagues', LeagueId!), {
        members: arrayUnion(request.playerId)
      });
      
      // Send approval notification to player
      await sendSystemMessage({
        recipientId: request.playerId,
        type: 'notification',
        subject: 'League Join Request Approved',
        content: `Your request to join "${league.name}" has been approved! Welcome to the league.`,
        actionLabel: 'View League',
        actionUrl: `/leagues/${LeagueId}`

      });
      
      // Delete the original request message
      await deleteDoc(doc(db, 'messages', request.id));
      
      // Update local state
      setJoinRequests(prev => prev.filter(r => r.id !== request.id));
      setLeague(prev => prev ? { ...prev, members: [...prev.members, request.playerId] } : null);
      setSuccess(`${request.playerName} has been added to the league.`);
    } catch (err) {
      setError('Failed to approve request.');
      console.error(err);
    }
  };

  const handleDenyRequest = async (request: JoinRequest) => {
    if (!league) return;
    
    try {
      // Send denial notification to player
      await sendSystemMessage({
        recipientId: request.playerId,
        type: 'notification',
        subject: 'League Join Request Denied',
        content: `Your request to join "${league.name}" has been denied.`
      });
      
      // Delete the original request message
      await deleteDoc(doc(db, 'messages', request.id));
      
      // Update local state
      setJoinRequests(prev => prev.filter(r => r.id !== request.id));
      setSuccess(`Request from ${request.playerName} has been denied.`);
    } catch (err) {
      setError('Failed to deny request.');
      console.error(err);
    }
  };

  const handleEditToggle = (section: keyof EditingSection) => {
    setEditing(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleSaveSection = async (section: keyof EditingSection) => {
    if (!editedLeague || !LeagueId) return;
    
    try {
      // Only update the changed fields, not the whole object
      await updateDoc(doc(db, 'leagues', LeagueId), { ...editedLeague });
      setLeague(editedLeague);
      setEditing(prev => ({ ...prev, [section]: false }));
      setSuccess('Settings updated successfully!');
    } catch (err) {
      setError('Failed to save settings.');
      console.error(err);
    }
  };

  const handleCancelEdit = (section: keyof EditingSection) => {
      setEditedLeague(league);
      setEditing(prev => ({ ...prev, [section]: false }));
    };
    const handleAddSport = () => {
    const unused = availableSports.find(
      s => !editedSportsSettings.some(ss => ss.type === s)
    );
    if (unused) {
      let newSport: SportSettings;
      if (unused === 'Ping Pong') {
        newSport = {
          id: crypto.randomUUID(),
          type: 'Ping Pong',
          displayName: 'Ping Pong',
          trackedValue: 'points',
          trackSets: false,
          winBy: 2,
          trackIndividualPoints: false,
          trackMistakes: false,
          maxSets: 5,
          pointsTo: 21,
          serveRotation: 2,
          adjustableSettings: true,
        } as PingPongSettings;
      } else if (unused === 'Spikeball') {
        newSport = {
          id: crypto.randomUUID(),
          type: 'Spikeball',
          displayName: 'Spikeball',
          trackedValue: 'points',
          winBy: 2,
          trackPoints: true,
          trackMistakes: false,
          pointsTo: 21,
          serveRotation: 5,
          sixFootRule: true,
          adjustableSettings: true,
        } as SpikeballSettings;
      } else {
        newSport = {
          id: crypto.randomUUID(),
          type: 'Custom',
          displayName: 'Custom',
          adjustableSettings: true,
          scoringRules: {
            label: 'Custom Scoring',
            pointsPerWin: 1,
            maxScore: 10
          }
        } as CustomSportSettings;
      }
      setEditedSportsSettings([...editedSportsSettings, newSport]);
    }
  };

  // Handler to remove a sport
  const handleRemoveSport = (id: string) => {
    setEditedSportsSettings(editedSportsSettings.filter(ss => ss.id !== id));
  };

  // Handler to update a sport's settings
  const handleSportSettingChange = (id: string, changes: Partial<SportSettings>) => {
    setEditedSportsSettings(editedSportsSettings.map(ss => {
      if (ss.id !== id) return ss;
      // Ensure all required boolean fields are set (not undefined)
      let updated = { ...ss, ...changes };
      if (ss.type === 'Ping Pong') {
        // PingPongSettings: ensure trackSets is boolean and always defined
        if (typeof (updated as any).trackSets !== 'boolean') {
          updated = { ...updated, trackSets: false };
        }
      }
      if (ss.type === 'Spikeball') {
        // SpikeballSettings: ensure sixFootRule is boolean and always defined
        if (typeof (updated as any).sixFootRule !== 'boolean') {
          updated = { ...updated, sixFootRule: false };
        }
      }
      return updated as SportSettings;
    }));
  };

  // When saving, update editedLeague.sports
  const handleSaveGameplaySettings = async () => {
    if (!editedLeague || !LeagueId) return;
    await updateDoc(doc(db, 'leagues', LeagueId), {
      ...editedLeague,
      sports: editedSportsSettings
    });
    setLeague({ ...editedLeague, sports: editedSportsSettings });
    setEditing(prev => ({ ...prev, gameplaySettings: false }));
    setSuccess('Gameplay settings updated!');
  };

  if (loading) return <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>;
  if (error && !league) return <Alert severity="error">{error}</Alert>;
  if (!league || !editedLeague) return <Alert severity="info">League not found.</Alert>;

  return (
    <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
      <Box display="flex" alignItems="center" gap={2} mb={4}>
          <Grid>
            <IconButton onClick={() => navigate(`/League/${league.id}/dashboard/Scoreboard`)} color="primary">
              <ArrowBackIcon />
            </IconButton>
          </Grid>
        <Typography variant="h4">
          League Settings: {league.name}
        </Typography>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {/* Join Requests Section - Always at the top */}
      <Paper sx={{ p: 3, mb: 4, border: joinRequests.length > 0 ? '2px solid #ff9800' : '1px solid #e0e0e0' }}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <PeopleIcon color={joinRequests.length > 0 ? 'warning' : 'inherit'} />
          <Typography variant="h5">
            Join Requests
          </Typography>
          <Badge badgeContent={joinRequests.length} color="warning" />
        </Box>
        
        {joinRequests.length === 0 ? (
          <Typography color="text.secondary">No pending join requests.</Typography>
        ) : (
          <Box display="flex" flexDirection="column" gap={2}>
            {joinRequests.map(request => (
              <Card key={request.id} sx={{ bgcolor: '#fff3e0' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Avatar>{request.playerName[0]?.toUpperCase()}</Avatar>
                    <Box>
                      <Typography variant="h6">{request.playerName}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {request.requestedAt && new Date(request.requestedAt.seconds * 1000).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>
                  <Box display="flex" gap={1}>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      size="small"
                      onClick={() => handleApproveRequest(request)}
                    >
                      Approve
                    </Button>
                    <Button 
                      variant="outlined" 
                      color="secondary" 
                      size="small"
                      onClick={() => handleDenyRequest(request)}
                    >
                      Deny
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Paper>

      {/* League Settings Sections */}
      <Box display="flex" flexDirection="column" gap={3}>
        
        {/* Basic Information */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center" gap={2}>
              <InfoIcon />
              <Typography variant="h6">Basic Information</Typography>
              {editing.basicInfo && <Chip label="Editing" color="primary" size="small" />}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box display="flex" flexDirection="column" gap={3}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1">League Details</Typography>
                <Box display="flex" gap={1}>
                  {editing.basicInfo ? (
                    <>
                      <IconButton onClick={() => handleSaveSection('basicInfo')} color="primary">
                        <SaveIcon />
                      </IconButton>
                      <IconButton onClick={() => handleCancelEdit('basicInfo')} color="secondary">
                        <CancelIcon />
                      </IconButton>
                    </>
                  ) : (
                    <IconButton onClick={() => handleEditToggle('basicInfo')}>
                      <EditIcon />
                    </IconButton>
                  )}
                </Box>
              </Box>
              
              {editing.basicInfo ? (
                <Box display="flex" flexDirection="column" gap={2}>
                  <TextField
                    label="League Name"
                    value={editedLeague.name}
                    onChange={(e) => setEditedLeague({...editedLeague, name: e.target.value})}
                    fullWidth
                  />
                  <TextField
                    label="Description"
                    value={editedLeague.description || ''}
                    onChange={(e) => setEditedLeague({...editedLeague, description: e.target.value})}
                    multiline
                    rows={3}
                    fullWidth
                  />
                  <TextField
                    label="Emoji"
                    value={editedLeague.emoji || ''}
                    onChange={(e) => setEditedLeague({...editedLeague, emoji: e.target.value})}
                    placeholder="🏓"
                  />
                </Box>
              ) : (
                <Box display="flex" flexDirection="column" gap={1}>
                  <Typography><strong>Name:</strong> {league.name}</Typography>
                  <Typography><strong>Description:</strong> {league.description || 'No description'}</Typography>
                  <Typography><strong>Emoji:</strong> {league.emoji || 'None'}</Typography>
                  <Typography><strong>Members:</strong> {league.members.length}</Typography>
                  <Typography><strong>Created:</strong> {league.createdAt ? new Date(league.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown'}</Typography>
                </Box>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Access & Visibility Settings */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center" gap={2}>
              <SecurityIcon />
              <Typography variant="h6">Access & Visibility</Typography>
              {editing.accessSettings && <Chip label="Editing" color="primary" size="small" />}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box display="flex" flexDirection="column" gap={3}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1">Who can join and see this league?</Typography>
                <Box display="flex" gap={1}>
                  {editing.accessSettings ? (
                    <>
                      <IconButton onClick={() => handleSaveSection('accessSettings')} color="primary">
                        <SaveIcon />
                      </IconButton>
                      <IconButton onClick={() => handleCancelEdit('accessSettings')} color="secondary">
                        <CancelIcon />
                      </IconButton>
                    </>
                  ) : (
                    <IconButton onClick={() => handleEditToggle('accessSettings')}>
                      <EditIcon />
                    </IconButton>
                  )}
                </Box>
              </Box>
              
              {editing.accessSettings ? (
                <Box display="flex" flexDirection="column" gap={2}>
                  <FormControl fullWidth>
                    <InputLabel>Visibility</InputLabel>
                    <Select
                      value={editedLeague.visibility}
                      onChange={(e) => setEditedLeague({...editedLeague, visibility: e.target.value as 'public' | 'private'})}
                    >
                      <MenuItem value="public">Public - Anyone can see this league</MenuItem>
                      <MenuItem value="private">Private - Only members can see this league</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <FormControl fullWidth>
                    <InputLabel>Join Type</InputLabel>
                    <Select
                      value={editedLeague.joinType}
                      onChange={(e) => setEditedLeague({...editedLeague, joinType: e.target.value as 'open' | 'invite' | 'approval'})}
                    >
                      <MenuItem value="open">Open - Anyone can join</MenuItem>
                      <MenuItem value="approval">Approval Required - Admin must approve requests</MenuItem>
                      <MenuItem value="invite">Invite Only - Admin must invite users</MenuItem>
                    </Select>
                  </FormControl>
                  
                  {editedLeague.joinType === 'invite' && (
                    <TextField
                      label="Join Passcode (optional)"
                      value={editedLeague.joinPasscode || ''}
                      onChange={(e) => setEditedLeague({...editedLeague, joinPasscode: e.target.value})}
                      placeholder="Enter a passcode for invites"
                    />
                  )}
                  
                  <TextField
                    label="Max Members (optional)"
                    type="number"
                    value={editedLeague.maxMembers || ''}
                    onChange={(e) => setEditedLeague({...editedLeague, maxMembers: e.target.value ? parseInt(e.target.value) : undefined})}
                    placeholder="Leave empty for no limit"
                  />
                </Box>
              ) : (
                <Box display="flex" flexDirection="column" gap={1}>
                  <Typography><strong>Visibility:</strong> <Chip label={league.visibility} size="small" /></Typography>
                  <Typography><strong>Join Type:</strong> <Chip label={league.joinType} size="small" /></Typography>
                  {league.joinPasscode && <Typography><strong>Join Passcode:</strong> {league.joinPasscode}</Typography>}
                  <Typography><strong>Max Members:</strong> {league.maxMembers || 'Unlimited'}</Typography>
                </Box>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Gameplay Settings */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center" gap={2}>
              <SportsIcon />
              <Typography variant="h6">Gameplay Settings</Typography>
              {editing.gameplaySettings && <Chip label="Editing" color="primary" size="small" />}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box display="flex" flexDirection="column" gap={3}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1">Game rules and scoring</Typography>
                <Box display="flex" gap={1}>
                  {editing.gameplaySettings ? (
                    <>
                      <IconButton onClick={handleSaveGameplaySettings} color="primary">
                        <SaveIcon />
                      </IconButton>
                      <IconButton onClick={() => handleCancelEdit('gameplaySettings')} color="secondary">
                        <CancelIcon />
                      </IconButton>
                    </>
                  ) : (
                    <IconButton onClick={() => setEditing(prev => ({ ...prev, gameplaySettings: true }))}>
                      <EditIcon />
                    </IconButton>
                  )}
                </Box>
              </Box>

              {editing.gameplaySettings ? (
                <Box display="flex" flexDirection="column" gap={2}>
                  {editedSportsSettings.map((ss) => (
                    <Accordion key={ss.type} sx={{ bgcolor: '#f5f5f5' }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>{ss.type}</Typography>
                        <Button
                          color="error"
                          size="small"
                          onClick={e => {
                            e.stopPropagation();
                            handleRemoveSport(ss.id);
                          }}
                          sx={{ ml: 2 }}
                        >
                          Remove
                        </Button>
                      </AccordionSummary>
                      <AccordionDetails>
                        {/* Example: Ping Pong settings */}
                        {ss.type === 'Ping Pong' && (
                          <Box display="flex" gap={2}>
                            <TextField
                              label="Points To"
                              type="number"
                              value={ss.pointsTo || ''}
                              onChange={e => handleSportSettingChange(ss.id, { pointsTo: parseInt(e.target.value) })}
                            />
                            <TextField
                              label="Win By"
                              type="number"
                              value={ss.winBy || ''}
                              onChange={e => handleSportSettingChange(ss.id, { winBy: parseInt(e.target.value) })}
                            />
                            {'trackSets' in ss && (
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={!!ss.trackSets}
                                    onChange={e => handleSportSettingChange(ss.id, { trackSets: e.target.checked })}
                                  />
                                }
                                label="Track Sets"
                              />
                            )}
                          </Box>
                        )}
                        {/* Add more sport-specific settings here */}
                      </AccordionDetails>
                    </Accordion>
                  ))}
                  <Button
                    variant="outlined"
                    onClick={handleAddSport}
                    disabled={editedSportsSettings.length >= availableSports.length}
                  >
                    Add Sport
                  </Button>
                </Box>
              ) : (
                <Box display="flex" flexDirection="column" gap={1}>
                  <Typography><strong>Sports:</strong></Typography>
                  <Box display="flex" gap={1} flexWrap="wrap" mb={1}>
                    {league.sports?.map((ss: SportSettings) => (
                      <Chip key={ss.id} label={ss.id} />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Ranking & Competition */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center" gap={2}>
              <TrophyIcon />
              <Typography variant="h6">Ranking & Competition</Typography>
              {editing.rankingSettings && <Chip label="Editing" color="primary" size="small" />}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box display="flex" flexDirection="column" gap={3}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1">How rankings and competitions work</Typography>
                <Box display="flex" gap={1}>
                  {editing.rankingSettings ? (
                    <>
                      <IconButton onClick={() => handleSaveSection('rankingSettings')} color="primary">
                        <SaveIcon />
                      </IconButton>
                      <IconButton onClick={() => handleCancelEdit('rankingSettings')} color="secondary">
                        <CancelIcon />
                      </IconButton>
                    </>
                  ) : (
                    <IconButton onClick={() => handleEditToggle('rankingSettings')}>
                      <EditIcon />
                    </IconButton>
                  )}
                </Box>
              </Box>
              
              {editing.rankingSettings ? (
                <Box display="flex" flexDirection="column" gap={2}>
                  <FormControl fullWidth>
                    <InputLabel>Ranking System</InputLabel>
                    <Select
                      value={editedLeague.rankingSystem}
                      onChange={(e) => setEditedLeague({...editedLeague, rankingSystem: e.target.value as 'elo' | 'winPct' | 'points'})}
                    >
                      <MenuItem value="elo">ELO Rating</MenuItem>
                      <MenuItem value="winPct">Win Percentage</MenuItem>
                      <MenuItem value="points">Points System</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <FormControl fullWidth>
                    <InputLabel>Schedule Type</InputLabel>
                    <Select
                      value={editedLeague.scheduleType}
                      onChange={(e) => setEditedLeague({...editedLeague, scheduleType: e.target.value as 'auto' | 'open'})}
                    >
                      <MenuItem value="open">Open Play - Members can play anytime</MenuItem>
                      <MenuItem value="auto">Scheduled - Auto-generated matchups</MenuItem>
                    </Select>
                  </FormControl>
                  
                  {editedLeague.rankingSystem === 'points' && (
                    <Box display="flex" gap={2}>
                    </Box>
                  )}
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={editedLeague.resetStatsEachSeason || false}
                        onChange={(e) => setEditedLeague({...editedLeague, resetStatsEachSeason: e.target.checked})}
                      />
                    }
                    label="Reset stats each season"
                  />
                </Box>
              ) : (
                <Box display="flex" flexDirection="column" gap={1}>
                  <Typography><strong>Ranking System:</strong> {league.rankingSystem}</Typography>
                  <Typography><strong>Schedule Type:</strong> {league.scheduleType}</Typography>
                  {league.rankingSystem === 'points' && (
                    <>
                    </>
                  )}
                  <Typography><strong>Reset Stats Each Season:</strong> {league.resetStatsEachSeason ? 'Yes' : 'No'}</Typography>
                </Box>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Member Management */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center" gap={2}>
              <PeopleIcon />
              <Typography variant="h6">Member Management</Typography>
              {editing.memberSettings && <Chip label="Editing" color="primary" size="small" />}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box display="flex" flexDirection="column" gap={3}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1">Member permissions and controls</Typography>
                <Box display="flex" gap={1}>
                  {editing.memberSettings ? (
                    <>
                      <IconButton onClick={() => handleSaveSection('memberSettings')} color="primary">
                        <SaveIcon />
                      </IconButton>
                      <IconButton onClick={() => handleCancelEdit('memberSettings')} color="secondary">
                        <CancelIcon />
                      </IconButton>
                    </>
                  ) : (
                    <IconButton onClick={() => handleEditToggle('memberSettings')}>
                      <EditIcon />
                    </IconButton>
                  )}
                </Box>
              </Box>
              
              {editing.memberSettings ? (
                <Box display="flex" flexDirection="column" gap={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={editedLeague.allowMultipleAdmins || false}
                        onChange={(e) => setEditedLeague({...editedLeague, allowMultipleAdmins: e.target.checked})}
                      />
                    }
                    label="Allow multiple admins"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={editedLeague.allowModerators || false}
                        onChange={(e) => setEditedLeague({...editedLeague, allowModerators: e.target.checked})}
                      />
                    }
                    label="Allow moderators"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={editedLeague.allowMemberScoreReporting || false}
                        onChange={(e) => setEditedLeague({...editedLeague, allowMemberScoreReporting: e.target.checked})}
                      />
                    }
                    label="Allow members to report scores"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={editedLeague.requireBothConfirm || false}
                        onChange={(e) => setEditedLeague({...editedLeague, requireBothConfirm: e.target.checked})}
                      />
                    }
                    label="Require both players to confirm match results"
                  />
                </Box>
              ) : (
                <Box display="flex" flexDirection="column" gap={1}>
                  <Typography><strong>Multiple Admins:</strong> {league.allowMultipleAdmins ? 'Allowed' : 'Not allowed'}</Typography>
                  <Typography><strong>Moderators:</strong> {league.allowModerators ? 'Allowed' : 'Not allowed'}</Typography>
                  <Typography><strong>Member Score Reporting:</strong> {league.allowMemberScoreReporting ? 'Allowed' : 'Not allowed'}</Typography>
                  <Typography><strong>Both Confirm Results:</strong> {league.requireBothConfirm ? 'Required' : 'Not required'}</Typography>
                </Box>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Customization */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center" gap={2}>
              <PaletteIcon />
              <Typography variant="h6">Customization</Typography>
              {editing.customization && <Chip label="Editing" color="primary" size="small" />}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box display="flex" flexDirection="column" gap={3}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1">League appearance and branding</Typography>
                <Box display="flex" gap={1}>
                  {editing.customization ? (
                    <>
                      <IconButton onClick={() => handleSaveSection('customization')} color="primary">
                        <SaveIcon />
                      </IconButton>
                      <IconButton onClick={() => handleCancelEdit('customization')} color="secondary">
                        <CancelIcon />
                      </IconButton>
                    </>
                  ) : (
                    <IconButton onClick={() => handleEditToggle('customization')}>
                      <EditIcon />
                    </IconButton>
                  )}
                </Box>
              </Box>
              
              {editing.customization ? (
                <Box display="flex" flexDirection="column" gap={2}>
                  <TextField
                    label="Logo URL"
                    value={editedLeague.logoUrl || ''}
                    onChange={(e) => setEditedLeague({...editedLeague, logoUrl: e.target.value})}
                    placeholder="https://example.com/logo.png"
                  />
                  <TextField
                    label="Banner URL"
                    value={editedLeague.bannerUrl || ''}
                    onChange={(e) => setEditedLeague({...editedLeague, bannerUrl: e.target.value})}
                    placeholder="https://example.com/banner.png"
                  />
                  <TextField
                    label="Theme Color"
                    value={editedLeague.themeColor || ''}
                    onChange={(e) => setEditedLeague({...editedLeague, themeColor: e.target.value})}
                    placeholder="#1976d2"
                  />
                  <TextField
                    label="Pinned Message"
                    value={editedLeague.pinnedMessage || ''}
                    onChange={(e) => setEditedLeague({...editedLeague, pinnedMessage: e.target.value})}
                    multiline
                    rows={3}
                    placeholder="Important message for all members"
                  />
                </Box>
              ) : (
                <Box display="flex" flexDirection="column" gap={1}>
                  <Typography><strong>Logo:</strong> {league.logoUrl ? 'Set' : 'Not set'}</Typography>
                  <Typography><strong>Banner:</strong> {league.bannerUrl ? 'Set' : 'Not set'}</Typography>
                  <Typography><strong>Theme Color:</strong> {league.themeColor || 'Default'}</Typography>
                  <Typography><strong>Pinned Message:</strong> {league.pinnedMessage || 'None'}</Typography>
                </Box>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>

      </Box>

      {/* Bottom Action Buttons */}
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