import React, { useState, useEffect } from 'react';
import { Paper, Typography, Box, Button, MenuItem, FormControl, InputLabel, Select, List, ListItem, ListItemText, Divider } from '@mui/material';
import { collection, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../Backend/firebase';
import { useAuth } from '../Backend/AuthProvider';
import { InternalBox } from '../Backend/InternalBox';

const sports = ['Ping Pong Singles', 'Ping Pong Doubles', 'Foosball', 'Pool'];
const ppTables = ['Main Ping Pong Table', 'Backroom Ping Pong Table'];
const foosTablle = ['Foosball Table'];
const poolTable = ['Pool Table']
const durations = [10,20,30,40,50,60]; // Duration options in minutes



// Helper to get next 7 days as { label, value } objects
const getNext7Days = () => {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const value = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    days.push({ label, value });
  }
  return days;
};

const getTimeSlots = () => {
  const slots = [];
  for (let h = 8; h < 22; h++) {
    for (let m = 0; m < 60; m += 10) {
      slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    }
  }
  return slots;
};

const getTablesForSport = (sport: string) => {
  if (sport === 'Ping Pong Singles' || sport === 'Ping Pong Doubles') return ppTables;
  if (sport === 'Foosball') return foosTablle;
  if (sport === 'Pool') return poolTable;
  return [];
};

const ScheduleGame: React.FC = () => {
  const { user } = useAuth();
  const [opponents, setOpponents] = useState<any[]>([]);
  const [selectedSport, setSelectedSport] = useState('Ping Pong Singles');
  const [selectedTable, setSelectedTable] = useState('');
  const [selectedTime, setSelectedTime] = useState('08:00');
  const [duration, setDuration] = useState(30);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getNext7Days()[0].value);

  useEffect(() => {
    const fetchOpponents = async () => {
      if (!user) return;
      const q = collection(db, 'users');
      const snap = await getDocs(q);
      const allDocs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOpponents(allDocs.filter(o => o.id !== user.uid));
    };
    fetchOpponents();
  }, [user]);

  useEffect(() => {
    const fetchSchedule = async () => {
      // For demo, just fetch all scheduled games for today and selected table
      const q = collection(db, 'scheduledGames');
      const snap = await getDocs(q);
      setSchedule(
        snap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((g: any) => g.table === selectedTable && g.date === selectedDate)
      );
    };
    fetchSchedule();
  }, [selectedTable, selectedDate]);

  useEffect(() => {
    // Auto-select table based on sport
    if (selectedSport === 'Ping Pong Singles' || selectedSport === 'Ping Pong Doubles') {
      setSelectedTable('Ping Pong Table');
    } else if (selectedSport === 'Foosball') {
      setSelectedTable('Foosball Table');
    } else if (selectedSport === 'Pool') {
      setSelectedTable('Pool Table');
    }
    // else leave as is
  }, [selectedSport]);

  // Helper to check for overlapping time slots
  const isTimeSlotOverlapping = (time: string, duration: number, table: string, date: string) => {
    const [startH, startM] = time.split(":").map(Number);
    const start = startH * 60 + startM;
    const end = start + duration;
    return schedule.some((g: any) => {
      if (g.table !== table || g.date !== date) return false;
      const [gH, gM] = g.time.split(":").map(Number);
      const gStart = gH * 60 + gM;
      const gEnd = gStart + (g.duration || 0);
      // Overlap if start < gEnd and end > gStart
      return start < gEnd && end > gStart;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setLoading(false);
      return;
    }
    // Validation: prevent overlapping matches
    if (isTimeSlotOverlapping(selectedTime, duration, selectedTable, selectedDate)) {
      alert('A match is already scheduled for this table that overlaps with your selected time and duration. Please choose another time.');
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, 'scheduledGames'), {
        createdBy: user.uid,
        players: [user.uid, ...selectedPlayers],
        sport: selectedSport,
        table: selectedTable,
        time: selectedTime,
        duration,
        date: selectedDate,
        createdAt: Timestamp.now(),
      });
      setSelectedPlayers([]);
      setSelectedTime('10:00');
      setDuration(20);
      setSelectedSport('Ping Pong Singles');
      setLoading(false);
      // Optionally refetch schedule
    } catch (err) {
      setLoading(false);
    }
  };

  const timeSlots = getTimeSlots().filter(t => {
    if (selectedDate !== getNext7Days()[0].value) return true; // not today, allow all
    const now = new Date();
    const [h, m] = t.split(":").map(Number);
    const slot = new Date();
    slot.setHours(h, m, 0, 0);
    return slot > now;
  });

  const availableTables = getTablesForSport(selectedSport);

  return (
    <InternalBox sx={{ p: 3, mb: 4 }}>
      <Box sx={{ display: { xs: 'block', md: 'flex' }, gap: 4 }}>
        <Box sx={{ flex: 1, minWidth: 320, mb: { xs: 3, md: 0 } }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>Schedule a Game</Typography>
            <form onSubmit={handleSubmit}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Sport</InputLabel>
                <Select value={selectedSport} label="Sport" onChange={e => setSelectedSport(e.target.value)}>
                  {sports.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth margin="normal">
                <InputLabel>Table</InputLabel>
                <Select value={selectedTable} label="Table" onChange={e => setSelectedTable(e.target.value)}>
                  {availableTables.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth margin="normal">
                <InputLabel>Date</InputLabel>
                <Select value={selectedDate} label="Date" onChange={e => setSelectedDate(e.target.value)}>
                  {getNext7Days().map(d => <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth margin="normal">
                <InputLabel>Time</InputLabel>
                <Select value={selectedTime} label="Time" onChange={e => setSelectedTime(e.target.value)}>
                  {timeSlots.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth margin="normal">
                <InputLabel>Duration (min)</InputLabel>
                <Select value={duration} label="Duration (min)" onChange={e => setDuration(Number(e.target.value))}>
                  {durations.map(d => <MenuItem key={d} value={d}>{d} min</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth margin="normal">
                <InputLabel>Players</InputLabel>
                <Select
                  multiple
                  value={selectedPlayers}
                  onChange={e => setSelectedPlayers(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                  renderValue={selected => selected.map(id => {
                    const found = opponents.find(o => o.id === id);
                    return found ? found.displayName || found.email : id;
                  }).join(', ')}
                >
                  {opponents.map(o => (
                    <MenuItem key={o.id} value={o.id}>{o.displayName || o.email}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button type="submit" variant="contained" color="primary" fullWidth disabled={loading} sx={{ mt: 2 }}>
                {loading ? 'Scheduling...' : 'Schedule Game'}
              </Button>
            </form>
          </Paper>
        </Box>
        <Box sx={{ flex: 1, minWidth: 320 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Schedule for {selectedTable} ({getNext7Days().find(d => d.value === selectedDate)?.label})</Typography>
            <Divider sx={{ mb: 2 }} />
            <List>
              {schedule.length === 0 && <ListItem><ListItemText primary="No games scheduled." /></ListItem>}
              {[...schedule]
                .sort((a, b) => {
                  // Compare by time string (HH:mm)
                  const [ah, am] = a.time.split(":").map(Number);
                  const [bh, bm] = b.time.split(":").map(Number);
                  return ah !== bh ? ah - bh : am - bm;
                })
                .map((g: any) => {
                  // Map player IDs to display names for this game
                  const playerNames = g.players.map((id: string) => {
                    const found = opponents.find(o => o.id === id) || (user && user.uid === id ? user : null);
                    return found ? found.displayName || found.email : id;
                  });
                  return (
                    <ListItem key={g.id}>
                      <ListItemText
                        primary={`${g.time} (${g.duration} min) - ${g.sport}`}
                        secondary={`Players: ${playerNames.join(', ')}`}
                      />
                    </ListItem>
                  );
                })}
            </List>
          </Paper>
        </Box>
      </Box>
    </InternalBox>
  );
};

export default ScheduleGame;
