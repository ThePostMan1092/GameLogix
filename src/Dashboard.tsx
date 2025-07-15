import React, { useEffect, useState } from 'react';
import { Typography, Box, Grid, Card, CardContent, LinearProgress, Chip, Avatar, Button} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SportsTennisIcon from '@mui/icons-material/SportsTennis';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import PoolIcon from '@mui/icons-material/Pool';
import StarIcon from '@mui/icons-material/Star';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAuth } from './Backend/AuthProvider';
import { getDoc, doc, collection, getDocs } from 'firebase/firestore';
import { db } from './Backend/firebase';
import { useNavigate } from 'react-router-dom';
import { getDoc as getUserDoc } from 'firebase/firestore';

const sportIcons: Record<string, React.ReactNode> = {
  'Ping Pong Singles': <SportsTennisIcon color="primary" />,
  'Ping Pong Doubles': <SportsTennisIcon color="secondary" />,
  'Foosball': <SportsSoccerIcon color="success" />,
  'Pool': <PoolIcon color="info" />,
};

const milestoneList = [
  { label: 'First Win!', icon: <EmojiEventsIcon color="warning" />, check: (stats: any) => stats.wins >= 1 },
  { label: '10 Games Played', icon: <StarIcon color="primary" />, check: (stats: any) => stats.gamesPlayed >= 10 },
  { label: 'Win Streak 3+', icon: <EmojiEventsIcon color="success" />, check: (stats: any) => stats.winStreak >= 3 },
  { label: 'Positive Point Diff', icon: <StarIcon color="secondary" />, check: (stats: any) => stats.pointDiff > 0 },
];

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userLeagues, setUserLeagues] = useState<any[]>([]);
  const [adminNames, setAdminNames] = useState<Record<string, string>>({});
  console.log('userLeagues', userLeagues);
  console.log(adminNames);

  const navigate = useNavigate();

  const handleSignOut = async () => {
    const { signOut } = await import('firebase/auth');
    const { auth } = await import('./Backend/firebase');
    await signOut(auth);
    navigate('/login');
  };

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      setUserStats(userDoc.data()?.stats || {});
      // Fetch leagues for this user
      const leaguesSnap = await getDocs(collection(db, 'leagues'));
      type League = {
        id: string;
        name?: string;
        adminId?: string;
        members?: string[];
        sports?: string[];
        [key: string]: any;
      };
      const leagues: League[] = leaguesSnap.docs
        .map(doc => ({ ...doc.data(), id: doc.id } as League))
        .filter((league: League) => league.members && league.members.includes(user.uid));
      setUserLeagues(leagues);
      // Fetch admin display names for each league
      const adminNameMap: Record<string, string> = {};
      for (const league of leagues) {
        if (league.adminId) {
          const adminDoc = await getUserDoc(doc(db, 'users', league.adminId));
          const adminData = adminDoc.data();
          adminNameMap[league.id] = adminData?.displayName || adminData?.email || league.adminId;
        }
      }
      setAdminNames(adminNameMap);
      setLoading(false);
    };
    fetchStats();
  }, [user]);

  if (loading) return <Box display="flex" justifyContent="center" mt={8}><LinearProgress /></Box>;

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', mt: 2, mb: 1 }}>
      <Grid container justifyContent="center" alignItems="center">
        <Typography mb={4} fontSize={"2.5rem"} variant="h4" gutterBottom>Welcome, {user?.displayName || user?.email}!</Typography>
        <Button color="inherit" onClick={handleSignOut} sx={{ m: 2, fontSize: '0.95rem', px: 2, minWidth: 0 }}>
          Sign Out
        </Button>
      </Grid>
      <Grid container spacing={3}>
        {Object.entries(userStats).map(([sport, stats]: any) => (
          <Box key={sport} sx={{}}>
            <Card sx={{ minHeight: 180 }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 1 }}>{sportIcons[sport]}</Avatar>
                  <Typography variant="h6">{sport}</Typography>
                </Box>
                <Typography>Games: {stats.gamesPlayed}</Typography>
                <Typography>Wins: {stats.wins}</Typography>
                <Typography>Losses: {stats.losses}</Typography>
                <Typography>Win %: {stats.gamesPlayed ? ((stats.wins / stats.gamesPlayed) * 100).toFixed(1) : 0}%</Typography>
                <Typography>Point Diff: {stats.pointDiff}</Typography>
                <Box mt={1} display="flex" gap={1} flexWrap="wrap">
                  {milestoneList.map(m => m.check(stats) && (
                    <Chip key={m.label} icon={m.icon} label={m.label} color="success" size="small" />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Grid>
      <Box mt={5}>
        <Typography variant="h5" gutterBottom>Win/Loss Breakdown</Typography>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={Object.entries(userStats).map(([sport, stats]: any) => ({
            sport,
            Wins: stats.wins,
            Losses: stats.losses,
          }))}>
            <XAxis dataKey="sport" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Wins" fill="#4caf50" />
            <Bar dataKey="Losses" fill="#f44336" />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default Dashboard;
