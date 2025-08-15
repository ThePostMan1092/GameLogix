import React, { useState } from 'react';
import {Button, TextField, Typography, MenuItem, Select, InputLabel, FormControl, Box,
  Divider, Paper, Stack
} from '@mui/material';
import { type LeagueSettings } from '../types/league';
import { useAuth } from '../Backend/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { InternalBox } from '../Backend/InternalBox';
import { db } from '../Backend/firebase';
import { setDoc, doc, Timestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

import {createConversation, sendMessage } from '../messaging';

const defaultSettings: Omit<LeagueSettings, 'id' | 'name' | 'adminId' | 'members' | 'createdAt' | 'joinPasscode' | 'joinDeadline' | 'joinType' | 'maxMembers' | 'sports' | 'visibility' | 'sportsSettings' | 'inboxConvoId' | 'dmConvoId' | 'reviewConvoId'> = {
  matchVerification: 'manual',
  rankingSystem: 'elo',
  scheduleType: 'open',
  tournamentMode: 'none',
  competitionLevel: 'casual',
  matchReporting: 'anyone',
  // or another appropriate default value
};

const CreateLeagueForm: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [joinType, setJoinType] = useState<'open' | 'invite' | 'approval'>('open');
  const [joinPasscode, setJoinPasscode] = useState('');
  const [joinDeadline, setJoinDeadline] = useState('');
  const [maxMembers, setMaxMembers] = useState<number | ''>('');
  const [sports, setSports] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess(false);

    if (!user) {
      setError('You must be logged in to create a league.');
      setSubmitting(false);
      return;
    }
    if (!name.trim()) {
      setError('League name is required.');
      setSubmitting(false);
      return;
    }

    // Generate custom document ID: league name + UUID
    const uuid = uuidv4();
    const docId = `${name} - ${uuid}`;

    try {
      // Create conversations first
      const conversationInboxId = await createConversation(`${name} - league Inbox`, [user.uid], 'inbox');
      const conversationDMId = await createConversation(`${name} - league DM`, [user.uid], 'direct');
      const conversationReviewId = await createConversation(`${name} - league Review`, [user.uid], 'review');


      // Build the League document with the actual conversation IDs
      const leagueDoc = {
        id: docId,
        name,
        adminId: user.uid,
        members: [user.uid],
        createdAt: Timestamp.now(),
        visibility,
        joinType,
        joinPasscode: joinPasscode || '',
        ...(joinDeadline ? { joinDeadline: Timestamp.fromDate(new Date(joinDeadline)) } : {}),
        maxMembers: maxMembers === '' ? 1000000 : Number(maxMembers),
        sports,
        matchVerification: defaultSettings.matchVerification,
        rankingSystem: defaultSettings.rankingSystem,
        scheduleType: defaultSettings.scheduleType,
        tournamentMode: defaultSettings.tournamentMode,
        inboxConvoId: conversationInboxId || '',
        dmConvoId: conversationDMId || '',
        reviewConvoId: conversationReviewId || '',
        // Optional/advanced fields can be added here as needed
      };

      await setDoc(doc(db, 'leagues', docId), leagueDoc); // Ensure the document is created with the custom ID
      
      setSuccess(true);

      console.log('Conversation created for league:', name);
      if (conversationInboxId) {
        await sendMessage(conversationInboxId, {
          conversationId: conversationInboxId,
          senderId: user.uid,
          subject: `Created League: ${name}`,
          content: `Congrats, you have created a new league: ${name}!`,
          messageType: "notification",
          read: false
        });
      }
      if (conversationDMId) {
        await sendMessage(conversationDMId, {
          conversationId: conversationDMId,
          senderId: user.uid,
          subject: `Created League: ${name}`,
          content: `Welcome to the league chat for: ${name}!`,
          messageType: "notification",
          read: false
        });
      }
      console.log('inbox, DM, and review conversations created:', conversationInboxId, conversationDMId, conversationReviewId);
      
      // Navigate to the newly created league after a brief delay
      setTimeout(() => {
        navigate(`/league/${docId}/Scoreboard`);
      }, 1500);
      
      setName('');
      setVisibility('public');
      setJoinType('open');
      setJoinPasscode('');
      setJoinDeadline('');
      setMaxMembers('');
      setSports([]);
    } catch (err: any) {
      setError('Failed to create league. Please try again.');
      console.error(err);
    }
    setSubmitting(false);
  };

  return (
    <Paper elevation={3}>
      <Typography variant="h3" color="primary.main" sx={{ pt: '2%', pl: '2%' }}>
        Create a League
      </Typography>
      <InternalBox sx={{ p: 4, maxWidth: '80%', mx: 'auto', mt: 2 }}>
        <form onSubmit={handleSubmit}>
          <Divider textAlign="left">General Info</Divider>
          <Box px={2}>
            <TextField
              label="League Name"
              variant="standard"
              value={name}
              onChange={e => setName(e.target.value)}
              fullWidth
              required
              sx={{ mb: 2 }}
            />
          </Box>
          <Divider textAlign="left">Join Rules</Divider>
          <Stack direction="row" gap={2} mt={2} px={2}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Visibility</InputLabel>
              <Select
                value={visibility}
                label="Visibility"
                onChange={e => setVisibility(e.target.value as 'public' | 'private')}
              >
                <MenuItem value="public">Public</MenuItem>
                <MenuItem value="private">Private</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Join Type</InputLabel>
              <Select
                value={joinType}
                label="Join Type"
                onChange={e => setJoinType(e.target.value as 'open' | 'invite' | 'approval')}
              >
                <MenuItem value="open">Open</MenuItem>
                <MenuItem value="invite">Invite Only</MenuItem>
                <MenuItem value="approval">Approval Required</MenuItem>
              </Select>
            </FormControl>
          </Stack>
          <Stack direction="row" gap={2} px={2}>
            <TextField
              label="Join Passcode (optional)"
              value={joinPasscode}
              onChange={e => setJoinPasscode(e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
            />
            <TextField
              label="Join Deadline"
              type="date"
              value={joinDeadline}
              onChange={e => setJoinDeadline(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />
          </Stack>
          {success && (
            <Typography color="success.main" sx={{ mb: 2 }}>
              League created successfully! Redirecting to league dashboard...
            </Typography>
          )}
          {error && (
            <Typography color="error.main" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={submitting}
          >
            {submitting ? 'Creating...' : 'Create League'}
          </Button>
        </form>
      </InternalBox>
    </Paper>
  );
};

export default CreateLeagueForm;