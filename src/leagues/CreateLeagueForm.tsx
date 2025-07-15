import React, { useState } from 'react';
import {
  Button,
  TextField,
  Typography,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Box,
} from '@mui/material';
import { type LeagueSettings } from './league';
import { useAuth } from '../Backend/AuthProvider';
import { InternalBox } from '../Backend/InternalBox';
import { db } from '../Backend/firebase';
import { setDoc, doc, Timestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

const supportedSports = ['Ping Pong', 'Foosball', 'Pool'];

const defaultSettings: Omit<LeagueSettings, 'id' | 'name' | 'adminId' | 'members' | 'createdAt' | 'joinPasscode' | 'joinDeadline' | 'joinType' | 'maxMembers' | 'sports' | 'visibility' | 'sportsSettings'> = {
  matchVerification: 'manual',
  rankingSystem: 'elo',
  scheduleType: 'open',
  tournamentMode: 'none'
};

const CreateLeagueForm: React.FC = () => {
  const { user } = useAuth();
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

  const handleSportChange = (sport: string) => {
    setSports(prev =>
      prev.includes(sport) ? prev.filter(s => s !== sport) : [...prev, sport]
    );
  };

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
    if (sports.length === 0) {
      setError('Please select at least one sport.');
      setSubmitting(false);
      return;
    }

    // Generate custom document ID: league name + UUID
    const uuid = uuidv4();
    const docId = `${name} - ${uuid}`;

    // Build the League document based on league.ts structure
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
      // Gameplay Settings (auto-set)
      matchVerification: defaultSettings.matchVerification,
      rankingSystem: defaultSettings.rankingSystem,
      scheduleType: defaultSettings.scheduleType,
      tournamentMode: defaultSettings.tournamentMode,
      // Optional/advanced fields can be added here as needed
    };

    try {
      await setDoc(doc(db, 'leagues', docId), leagueDoc); // Ensure the document is created with the custom ID
      setSuccess(true);
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
    <InternalBox sx={{ p: 4, maxWidth: 500, mx: 'auto', mt: 8 }}>
      <Typography variant="h4" gutterBottom>
        Create a League
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          label="League Name"
          value={name}
          onChange={e => setName(e.target.value)}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
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
        <TextField
          label="Max Members"
          type="number"
          value={maxMembers}
          onChange={e => setMaxMembers(e.target.value === '' ? '' : Number(e.target.value))}
          fullWidth
          sx={{ mb: 2 }}
          inputProps={{ min: 1 }}
        />
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Sports
          </Typography>
          {supportedSports.map(sport => (
            <Button
              key={sport}
              variant={sports.includes(sport) ? 'contained' : 'outlined'}
              color="primary"
              onClick={() => handleSportChange(sport)}
              sx={{ mr: 1, mb: 1 }}
            >
              {sport}
            </Button>
          ))}
        </Box>
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        {success && (
          <Typography color="success.main" sx={{ mb: 2 }}>
            League created successfully!
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
  );
};

export default CreateLeagueForm;