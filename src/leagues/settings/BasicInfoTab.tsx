import React, { useState, useEffect } from 'react';
// import useAuth from its correct location
import { useAuth } from '../../Backend/AuthProvider';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
// Adjust the path below if your firebase file is in a different location
import { db } from '../../Backend/firebase';
import { useParams } from 'react-router-dom';
import { Box, Paper, Typography, Divider, Grid, TextField, Alert, Button, Table, TableContainer, 
  TableRow, TableCell, TableHead, TableBody, Menu, MenuItem, IconButton, Chip,
  Stack} from '@mui/material';
import { getUserConversations, addUserToLeagueConversations,  updateJoinRequestStatus, sendMessage } from '../../messaging';
import MoreVertIcon from '@mui/icons-material/MoreVert';

interface LeagueMember {
  uid: string;
  email: string;
  displayName?: string;
  isAdmin: boolean;
}

const BasicInfoTab: React.FC = () => {
  const { leagueId } = useParams();
  const [league, setLeague] = useState<any>(null);
  const [editLeague, setEditLeague] = useState<any>(null);
  const { user } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [members, setMembers] = useState<LeagueMember[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  console.log(loading, error)

    useEffect(() => {
    if (league && league.members) {
      fetchMembers();
    }
  }, [league]);

  const fetchMembers = async () => {
    if (!league || !league.members) return;
    
    try {
      const memberPromises = league.members.map(async (memberId: string) => {
        const userRef = doc(db, 'users', memberId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          return {
            uid: memberId,
            email: userData.email || 'No email',
            displayName: userData.displayName,
            isAdmin: memberId === league.adminId
          };
        }
        return null;
      });

      const membersData = await Promise.all(memberPromises);
      setMembers(membersData.filter(member => member !== null) as LeagueMember[]);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, memberId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedMember(memberId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedMember(null);
  };

  const handleKickMember = async (memberId: string) => {
    if (!leagueId || !user || memberId === league.adminId) return;
    
    try {
      const leagueRef = doc(db, 'leagues', leagueId);
      await updateDoc(leagueRef, {
        members: arrayRemove(memberId)
      });
      
      // Send notification to league inbox
      await sendMessage(league.inboxConvoId, {
        conversationId: league.inboxConvoId,
        senderId: user.uid,
        subject: `Member Removed from ${league.name}`,
        content: `A member has been removed from the league: "${league.name}".`,
        messageType: "notification",
        read: false
      });

      // Refresh data
      const updatedLeague = { ...league, members: league.members.filter((id: string) => id !== memberId) };
      setLeague(updatedLeague);
      fetchMembers();
    } catch (error) {
      console.error('Error kicking member:', error);
    }
    handleMenuClose();
  };

  const handlePromoteToAdmin = async (memberId: string) => {
    if (!leagueId || !user) return;
    
    try {
      const leagueRef = doc(db, 'leagues', leagueId);
      await updateDoc(leagueRef, {
        adminId: memberId
      });
      
      // Send notification
      await sendMessage(league.inboxConvoId, {
        conversationId: league.inboxConvoId,
        senderId: user.uid,
        subject: `New Admin Promoted in ${league.name}`,
        content: `A new admin has been promoted in the league: "${league.name}".`,
        messageType: "notification",
        read: false
      });

      // Refresh data
      const updatedLeague = { ...league, adminId: memberId };
      setLeague(updatedLeague);
      fetchMembers();
    } catch (error) {
      console.error('Error promoting member:', error);
    }
    handleMenuClose();
  };

  const handleViewProfile = (memberId: string) => {
    // TODO: Navigate to profile page when implemented
    console.log('View profile for:', memberId);
    handleMenuClose();
  };

  useEffect(() => {
    if (!leagueId) return;
    const fetchLeague = async () => {
      if (!leagueId) return;
      const leagueRef = doc(db, 'leagues', leagueId as string);
      const leagueSnap = await getDoc(leagueRef);
      if (leagueSnap.exists()) {
        setLeague(leagueSnap.data());
        setEditLeague(leagueSnap.data());
      }
    };
    fetchLeague();
  }, [leagueId]);

  // Fetch messages when component mounts and user is available
  useEffect(() => {
    if (user) {
      fetchMessages();
    }
  }, [user]);

  // Helper to refresh review messages
  const fetchMessages = async () => {
    if (!user) return; // This fixes the null check issue
    
    try {
      const convos = await getUserConversations(user.uid);

      const reviewConvos = convos.filter(c => c.type === 'review');

      const allReviewConvosMessages = await Promise.all(
        reviewConvos.map(async convo => {
          const baseCollection = collection(db, `conversations/${convo.id}/messages`);
          let q;
          const recipientIds = (convo as any).recipientIds;
          console.log("recipientIds:", recipientIds);
          if (recipientIds && Array.isArray(recipientIds) && recipientIds.length > 0) {
            q = query(baseCollection, where('recipientIds', 'array-contains', user.uid), where('meta.status', '==', 'pending'));
          } else {
            q = query(baseCollection, where('meta.status', '==', 'pending'));
          }
          const snap = await getDocs(q);
          return snap.docs.map(doc => ({
            id: doc.id,
            conversationId: convo.id,
            ...doc.data()
          }));
        })
      );
      
      const flattenedReviews = allReviewConvosMessages.flat();
      // Fix: Sort and set state properly
      // const sortedReviews = flattenedReviews.sort((a, b) => a.timestamp - b.timestamp);
      setReviews(flattenedReviews);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('Failed to load conversations. Please try again later.');
      setLoading(false);
    }
  };

  const handleApproveRequest = async (messageId: string, conversationId: string, targetUserId: string) => {
    if (!user || !leagueId) return; // Add null checks
    // Fetch the target user object from Firestore
    let targetUser: any = null;
    try {
      const userRef = doc(db, 'users', targetUserId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
      targetUser = userSnap.data();
      }
    } catch (err) {
      console.error('Error fetching target user:', err);
    }
    try {
      await updateJoinRequestStatus(conversationId, messageId, 'approved', user.uid);
      await addUserToLeagueConversations(targetUserId, leagueId);
      
      const leagueRef = doc(db, 'leagues', leagueId);
      await updateDoc(leagueRef, {
        members: arrayUnion(targetUserId)
      });
      await sendMessage(league.inboxConvoId, {
        conversationId: league.inboxConvoId,
        senderId: user.uid,
        subject: `New Member in ${league.name}`,
        content: `${targetUser?.displayName || targetUser?.email || targetUser?.uid} has joined the league: "${league.name}".`,
        messageType: "notification",
        read: false
      });
      fetchMessages();
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handleDenyRequest = async (messageId: string, conversationId: string) => {
    if (!user) return; // Add null check
    
    try {
      await updateJoinRequestStatus(conversationId, messageId, 'rejected', user.uid);
      fetchMessages();
    } catch (error) {
      console.error('Error denying request:', error);
    }
  };

  const handleChange = (field: string, value: string) => {
    setEditLeague((prev: any) => ({
      ...prev,
      [field]: value
    }));
  }

  // Show loading state while user is being determined
  if (!user) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Paper elevation={3} style={{ padding: '16px', margin: '16px 0' }}>
      <Box>
        <Typography variant="h2">Basic Information</Typography>
        <Typography variant="body2">Adjust basic info about the league</Typography>
      </Box>

      <Divider style={{ marginTop: 10, marginBottom: 5 }} />

      <Grid container sx={{spacing: 2, px: 4}} >
        <Grid size={3} sx={{ display: 'flex', alignItems: 'center', marginLeft: 2, marginTop: 1 }}>
          <Typography variant="h4">Identification</Typography>
        </Grid>
        <Grid size={8}>
            <TextField
              label="League Name"
              variant="outlined"
              value={editLeague?.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              fullWidth
              margin="normal"
              size="small"
            />
        </Grid>
      </Grid>
      <Stack spacing={3} sx={{ px: 4 }}>    
            <TextField
              label="League Description"
              variant="outlined"
              multiline
              rows={3}
              value={editLeague?.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              fullWidth
              margin="normal"
              sx={{ height: 50, fontSize: '.5rem', pb: 12, mt: 1}}
              size="small"
              maxRows={3}
            />
            <TextField

              label="League Identifier"
              variant="outlined"
              helperText="Unique ID is uneditable"
              value={editLeague?.id || 'Loading...'}
              fullWidth
              margin="normal"
              disabled
              size="small"
            />
      </Stack>
        
      

      <Divider style={{ margin: '16px 0' }} />

      <Grid container sx={{spacing: 2, px: 4}} >
        <Grid size={3}>
          <Typography variant="h4">Membership</Typography>
        </Grid>
        <Grid size={9}>
          {reviews.length === 0 ? (
            <Alert severity="info">No messages in your inbox.</Alert>
          ) : (
            reviews.map(msg => (
              <Box key={msg.id} p={2} borderBottom="1px solid #eee">
                <Box justifyContent={'space-between'} display="flex" flexDirection="column" height="100%">
                  <Typography variant="subtitle2">{msg.subject}</Typography>
                  <Button variant="outlined" size="small" onClick={() => handleApproveRequest(msg.id, msg.conversationId, msg.senderId)}>
                    Approve Join
                  </Button>
                  <Button variant="outlined" size="small" onClick={() => handleDenyRequest(msg.id, msg.conversationId)}>
                    Deny Join
                  </Button>
                </Box>
                <Typography variant="body2">{msg.content}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(msg.timestamp?.toDate()).toLocaleString()}
                </Typography>
              </Box>
            ))
          )}
        </Grid>
      </Grid>

      {/* Members Management Table */}
      <Box sx={{ mt: 2, mx: 4, mb: 1 }}>
        <Typography variant="h6" sx={{ mb: 0.5 }}>Current Members</Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.uid}>
                  <TableCell>
                    {member.displayName || 'No name'}
                  </TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <Chip 
                      label={member.isAdmin ? 'Admin' : 'Member'} 
                      color={member.isAdmin ? 'primary' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, member.uid)}
                      disabled={member.uid === user?.uid && member.isAdmin} // Can't action on yourself if you're admin
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Action Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => selectedMember && handleViewProfile(selectedMember)}>
            View Profile
          </MenuItem>
          {selectedMember !== league?.adminId && (
            <>
              <MenuItem onClick={() => selectedMember && handlePromoteToAdmin(selectedMember)}>
                Promote to Admin
              </MenuItem>
              <MenuItem 
                onClick={() => selectedMember && handleKickMember(selectedMember)}
                sx={{ color: 'error.main' }}
              >
                Remove from League
              </MenuItem>
            </>
          )}
        </Menu>
      </Box>

      <Divider style={{ margin: '16px 0' }} />

      <Grid container sx={{spacing: 2, px: 4}} >
        <Grid size={3}>
          <Typography variant="h4">Joining settings</Typography>
        </Grid>
        <Grid size={9}>
          <Box justifyContent={'space-between'} display="flex" flexDirection="column" height="100%">
            <TextField
              select
              label="Visibility"
              variant="outlined"
              value={editLeague?.visibility || 'public'}
              onChange={(e) => handleChange('visibility', e.target.value)}
              fullWidth
              margin="normal"
              size="small"
            >
              <MenuItem value="public">Public</MenuItem>
              <MenuItem value="private">Private</MenuItem>
            </TextField>
            
            <TextField
              select
              label="Join Process"
              variant="outlined"
              value={editLeague?.joinType || 'open'}
              onChange={(e) => handleChange('joinType', e.target.value)}
              fullWidth
              margin="normal"
              size="small"
            >
              <MenuItem value="open">Open</MenuItem>
              <MenuItem value="password">Password Required</MenuItem>
              <MenuItem value="approval">Approval Required</MenuItem>
              <MenuItem value="invite">Invite Only</MenuItem>
            </TextField>

            {editLeague?.joinType === 'password' && (
              <TextField
                label="Join Password"
                variant="outlined"
                value={editLeague?.joinPasscode || ''}
                onChange={(e) => handleChange('joinPasscode', e.target.value)}
                fullWidth
                margin="normal"
                size="small"
                helperText="Users will need this password to join the league"
              />
            )}
          </Box>
        </Grid>
      </Grid>

      <Divider style={{ margin: '16px 0' }} />
      
    </Paper>
  );
};

export default BasicInfoTab;

