import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Alert, 
  CircularProgress, 
  Divider,
  Card,
  CardContent,
  Avatar,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  Badge
} from '@mui/material';
import { 
  ExpandMore as ExpandMoreIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  People as PeopleIcon,
  SportsEsports as SportsIcon,
  Security as SecurityIcon,
  Palette as PaletteIcon,
  EmojiEvents as TrophyIcon,
  Info as InfoIcon
} from '@mui/icons-material';
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
  deleteDoc
} from 'firebase/firestore';
import { type LeagueSettings as LeagueSettingsType } from './league';
import { sendSystemMessage } from '../Inbox';

interface JoinRequest {
  id: string;
  playerId: string;
  playerName: string;
  playerEmail: string;
  requestedAt: any;
  leagueId: string;
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
  const { leagueId } = useParams<{ leagueId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [league, setLeague] = useState<LeagueSettingsType | null>(null);
  const [editedLeague, setEditedLeague] = useState<LeagueSettingsType | null>(null);
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

  useEffect(() => {
    if (!leagueId || !user) return;
    
    const fetchData = async () => {
      try {
        // Fetch league data
        const leagueDoc = await getDoc(doc(db, 'leagues', leagueId));
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
          if (data.actionUrl?.includes(leagueId)) {
            // Extract player info from message content or fetch from users collection
            requests.push({
              id: doc.id,
              playerId: data.senderId || '', // You may need to add senderId to your message structure
              playerName: data.content.split(' ')[0] || 'Unknown Player',
              playerEmail: '',
              requestedAt: data.createdAt,
              leagueId: leagueId
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
  }, [leagueId, user]);

  const handleApproveRequest = async (request: JoinRequest) => {
    if (!league) return;
    
    try {
      // Add user to league members
      await updateDoc(doc(db, 'leagues', leagueId!), {
        members: arrayUnion(request.playerId)
      });
      
      // Send approval notification to player
      await sendSystemMessage({
        recipientId: request.playerId,
        type: 'notification',
        subject: 'League Join Request Approved',
        content: `Your request to join "${league.name}" has been approved! Welcome to the league.`,
        actionLabel: 'View League',
        actionUrl: `/leagues/${leagueId}`

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
    if (!editedLeague || !leagueId) return;
    
    try {
      // Only update the changed fields, not the whole object
      await updateDoc(doc(db, 'leagues', leagueId), { ...editedLeague });
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

  if (loading) return <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>;
  if (error && !league) return <Alert severity="error">{error}</Alert>;
  if (!league || !editedLeague) return <Alert severity="info">League not found.</Alert>;

  return (
    <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
      <Box display="flex" alignItems="center" gap={2} mb={4}>
        <SettingsIcon fontSize="large" />
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
                      <IconButton onClick={() => handleSaveSection('gameplaySettings')} color="primary">
                        <SaveIcon />
                      </IconButton>
                      <IconButton onClick={() => handleCancelEdit('gameplaySettings')} color="secondary">
                        <CancelIcon />
                      </IconButton>
                    </>
                  ) : (
                    <IconButton onClick={() => handleEditToggle('gameplaySettings')}>
                      <EditIcon />
                    </IconButton>
                  )}
                </Box>
              </Box>
              
              {editing.gameplaySettings ? (
                <Box display="flex" flexDirection="column" gap={2}>
                  <FormControl fullWidth>
                    <InputLabel>Sports</InputLabel>
                    <Select
                      multiple
                      value={editedLeague.sports}
                      onChange={(e) => setEditedLeague({...editedLeague, sports: e.target.value as string[]})}
                    >
                      <MenuItem value="Ping Pong">Ping Pong</MenuItem>
                      <MenuItem value="Foosball">Foosball</MenuItem>
                      <MenuItem value="Pool">Pool</MenuItem>
                      <MenuItem value="Air Hockey">Air Hockey</MenuItem>
                      <MenuItem value="Darts">Darts</MenuItem>
                      <MenuItem value="Chess">Chess</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <TextField
                    label="Scoring Format"
                    value={editedLeague.scoringFormat}
                    onChange={(e) => setEditedLeague({...editedLeague, scoringFormat: e.target.value})}
                    placeholder="e.g., 'First to 11', 'Best of 3'"
                  />
                  
                  <FormControl fullWidth>
                    <InputLabel>Match Verification</InputLabel>
                    <Select
                      value={editedLeague.matchVerification}
                      onChange={(e) => setEditedLeague({...editedLeague, matchVerification: e.target.value as 'manual' | 'automatic' | 'both-confirm'})}
                    >
                      <MenuItem value="manual">Manual - Admin verifies results</MenuItem>
                      <MenuItem value="automatic">Automatic - Results auto-approved</MenuItem>
                      <MenuItem value="both-confirm">Both Confirm - Both players must confirm</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <TextField
                    label="Match Frequency Cap (per week)"
                    type="number"
                    value={editedLeague.matchFrequencyCap || ''}
                    onChange={(e) => setEditedLeague({...editedLeague, matchFrequencyCap: e.target.value ? parseInt(e.target.value) : undefined})}
                    placeholder="Leave empty for no limit"
                  />
                  
                  <TextField
                    label="Match Expiration (hours)"
                    type="number"
                    value={editedLeague.matchExpirationHours || ''}
                    onChange={(e) => setEditedLeague({...editedLeague, matchExpirationHours: e.target.value ? parseInt(e.target.value) : undefined})}
                    placeholder="Hours before unconfirmed matches expire"
                  />
                </Box>
              ) : (
                <Box display="flex" flexDirection="column" gap={1}>
                  <Typography><strong>Sports:</strong></Typography>
                  <Box display="flex" gap={1} flexWrap="wrap" mb={1}>
                    {league.sports.map(sport => (
                      <Chip key={sport} label={sport} />
                    ))}
                  </Box>
                  <Typography><strong>Scoring Format:</strong> {league.scoringFormat}</Typography>
                  <Typography><strong>Match Verification:</strong> {league.matchVerification}</Typography>
                  <Typography><strong>Match Frequency Cap:</strong> {league.matchFrequencyCap || 'Unlimited'} per week</Typography>
                  <Typography><strong>Match Expiration:</strong> {league.matchExpirationHours || 'Never'} hours</Typography>
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
                      <TextField
                        label="Points per Win"
                        type="number"
                        value={editedLeague.pointsPerWin || ''}
                        onChange={(e) => setEditedLeague({...editedLeague, pointsPerWin: e.target.value ? parseInt(e.target.value) : undefined})}
                      />
                      <TextField
                        label="Points per Tie"
                        type="number"
                        value={editedLeague.pointsPerTie || ''}
                        onChange={(e) => setEditedLeague({...editedLeague, pointsPerTie: e.target.value ? parseInt(e.target.value) : undefined})}
                      />
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
                      <Typography><strong>Points per Win:</strong> {league.pointsPerWin || 'N/A'}</Typography>
                      <Typography><strong>Points per Tie:</strong> {league.pointsPerTie || 'N/A'}</Typography>
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
          onClick={() => navigate(`/leagues/${leagueId}`)}
          size="large"
        >
          View League
        </Button>
      </Box>
    </Box>
  );
};

export default LeagueSettings;