import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { db } from '../Backend/firebase';
import { InternalBox } from '../Backend/InternalBox';
import { FormControl, InputLabel, Select, MenuItem, Typography, Button, CircularProgress, Box, TextField } from '@mui/material';
import { type LeagueSettings } from '../types/league';
import { useAuth } from '../Backend/AuthProvider';

import { sendMessage, addUserToLeagueConversations} from '../messaging';

const JoinLeague: React.FC = () => {
  const [leagues, setLeagues] = useState<LeagueSettings[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState<string>('');
  const [passcodeInput, setPasscodeInput] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { user } = useAuth();
  
  

  useEffect(() => {
    const fetchLeagues = async () => {
      setLoading(true);
      const q = query(
        collection(db, 'leagues'),
        where('visibility', '==', 'public'),
        where('joinType', 'in', ['open', 'approval']),
      );
      const snap = await getDocs(q);
      const filteredLeagues = snap.docs.map(doc => ({ ...doc.data(), id: doc.id }) as LeagueSettings)
        .filter(l => user?.uid && !l.members?.includes(user.uid));
      setLeagues(filteredLeagues);
      setLoading(false); // <-- Add this line
    };
    fetchLeagues();
  }, []);

  // Fetch admin display name when league is selected
  useEffect(() => {
    const fetchAdminName = async () => {
      if (!selectedLeague) { setAdminName(''); return; }
      const league = leagues.find(l => l.id === selectedLeague);
      if (!league || !league.adminId) { setAdminName(''); return; }
      // Try to get admin display name from users collection
      const userSnap = await getDocs(query(collection(db, 'users'), where('uid', '==', league.adminId)));
      if (!userSnap.empty) {
        const adminDoc = userSnap.docs[0].data();
        setAdminName(adminDoc.displayName || adminDoc.email || league.adminId);
      } else {
        setAdminName(league.adminId);
      }
    };
    fetchAdminName();
  }, [selectedLeague, leagues]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    if (!user) {
      setError('You must be logged in to join a league.');
      return;
    }
    const league = leagues.find(l => l.id === selectedLeague);
    console.log('league', league);
    if (!league) {
      setError('Please select a league.');
      return;
    }
    // If league requires a passcode, check it
    if (league.joinPasscode && league.joinPasscode !== passcodeInput) {
      setError('Incorrect join passcode.');
      return;
    }
    try {
      if (league.joinType === 'open') {
        // For open leagues, add user directly
        const leagueRef = doc(db, 'leagues', league.id!);
        await updateDoc(leagueRef, {
          members: arrayUnion(user.uid)
        });
        if (!user?.uid || !league?.id) {
          setError('User or league ID is missing.');
          return;
        }
        await addUserToLeagueConversations(user.uid, league.id!);
        await sendMessage(league.inboxConvoId, {
          conversationId: league.inboxConvoId,
          senderId: user.uid,
          subject: `New Member in ${league.name}`,
          content: `${user.displayName || user.email || user.uid} has joined the league: "${league.name}".`,
          messageType: "notification",
          read: false
        });
        setSuccess(true);
        setError('');
      } else if (league.joinType === 'approval') {
        // For approval leagues, send request to admin
        if (!league.inboxConvoId) {
          console.error('League conversation ID is missing.');
          setError('League conversation ID is missing.');
          return;
        }
        await sendMessage(league.inboxConvoId, {
          conversationId: league.inboxConvoId,
          senderId: user.uid,
          subject: `Join Request: ${league.name}`,
          content: `${user.displayName || user.email || user.uid} has requested to join the league "${league.name}".`,
          recipientIds: [league.adminId],
          messageType: "notification",
          read: false,
          meta: {
            leagueId: league.id
          }
        });
        await sendMessage(league.reviewConvoId, {
          conversationId: league.reviewConvoId,
          senderId: user.uid,
          subject: `Join Request: ${league.name}`,
          content: `${user.displayName || user.email || user.uid} has requested to join the league "${league.name}".`,
          recipientIds: [league.adminId],
          messageType: "request",
          read: false,
          meta: {
            leagueId: league.id,
            actionRequiredBy: league.adminId,
            targetUserId: user.uid,
            status: 'pending'
          }
        });
        setSuccess(true);
        setError('Request sent to league admin for approval.');
      }
    } catch (error: any) {
      setError('Failed to join league. Please try again.');
      console.error('Error joining league:', error);
    }
  };

  const selected = leagues.find(l => l.id === selectedLeague);
  

  return (
    <InternalBox sx={{ p: 4, maxWidth: 500, mx: 'auto', mt: 8 }}>
      <Typography variant="h4" gutterBottom>Join a League</Typography>
      <Typography variant="body1" sx={{ mb: 4 }}>
        Bellow are all public leagues 
      </Typography>
      {loading ? (
        <CircularProgress />
      ) : (
        <form onSubmit={handleSubmit}>
          <FormControl fullWidth sx={{ minWidth: 300, mb: 3 }}>
            <InputLabel>{leagues.length === 0 ? 'No Leagues Available' : 'Select League'}</InputLabel>
            <Select
              value={selectedLeague}
              label={leagues.length === 0 ? 'No Leagues Available' : 'Select League'}
              onChange={e => setSelectedLeague(e.target.value)}
            >
              {leagues.map(league => (
                <MenuItem key={league.id} value={league.id}>
                  {league.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {selected && (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle1"><b>Admin:</b> {adminName || 'Loading...'}</Typography>
              <Typography variant="subtitle1"><b>Members:</b> {selected.members?.length ?? 0}</Typography>
              <Typography variant="subtitle1"><b>Sports:</b> {selected.sports?.join(', ')}</Typography>
            </Box>
          )}
          {selectedLeague && selected?.joinPasscode !== '' && (
            <TextField
              label="Join Passcode"
              value={passcodeInput}
              onChange={e => setPasscodeInput(e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
            />
          )}
          {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
          {success && 
            <Typography color="success.main" sx={{ mb: 2 }}>Successfully joined the league!</Typography>

          }
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={!selectedLeague}
          >
            {selected?.joinType === 'approval' ? 'Request to Join' : 'Join League'}
          </Button>
        </form>
      )}
    </InternalBox>
  );
};

export default JoinLeague;
