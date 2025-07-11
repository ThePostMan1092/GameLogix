import React, { useState } from 'react';
import { TextField, Button, Paper, Typography, Box, CircularProgress } from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../Backend/firebase';
import { serverTimestamp, doc, setDoc } from 'firebase/firestore';

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName });
      // Create user doc with UID as doc ID (idempotent)
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email,
        name,
        displayName,
        joinedAt: serverTimestamp(),
        rank: 0,
        stats: {
          'Ping Pong Singles': { gamesPlayed: 0, wins: 0, losses: 0, pointDiff: 0 },
          'Ping Pong Doubles': { gamesPlayed: 0, wins: 0, losses: 0, pointDiff: 0 },
          'Foosball': { gamesPlayed: 0, wins: 0, losses: 0, pointDiff: 0 },
          'Pool': { gamesPlayed: 0, wins: 0, losses: 0, pointDiff: 0 }
        },
        matches: [] // will store match IDs or match objects if you want
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 4, maxWidth: 400, mx: 'auto', mt: 6 }}>
      <Typography variant="h5" gutterBottom>Register</Typography>
      <form onSubmit={handleSubmit}>
        <TextField label="Name" fullWidth margin="normal" value={name} onChange={e => setName(e.target.value)} required />
        <TextField label="Display Name" fullWidth margin="normal" value={displayName} onChange={e => setDisplayName(e.target.value)} required />
        <TextField label="Email" type="email" fullWidth margin="normal" value={email} onChange={e => setEmail(e.target.value)} required />
        <TextField label="Password" type="password" fullWidth margin="normal" value={password} onChange={e => setPassword(e.target.value)} required />
        {error && <Typography color="error">{error}</Typography>}
        <Box mt={2}>
          <Button type="submit" variant="contained" color="primary" fullWidth disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Register'}
          </Button>
        </Box>
      </form>
      <Box mt={2}>
        <Typography variant="body2">Already have an account? <Link to="/login">Login</Link></Typography>
      </Box>
    </Paper>
  );
};

export default Register;
