import React, { Suspense, useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './Backend/AuthProvider';
import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { Divider, Badge, Typography, Button, Container, Box, CssBaseline, ThemeProvider, createTheme, CircularProgress } from '@mui/material';
import Grid from '@mui/material/Grid';
import MailIcon from '@mui/icons-material/Mail';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './Backend/firebase';

//making sidebar layout
interface MainLayoutProps {
  children: React.ReactNode;
  leftSidebar?: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, leftSidebar }) => (
  <Box sx={{ display: 'flex', width: 1, minHeight: '100vh', bgcolor: '#1C2A25' }}>
    {/* Left Sidebar */}
    {leftSidebar && (
      <Box
        sx={{
          width: 350,
          bgcolor: '#2E3A35',
          borderRight: '1px solid #222', // Correct: border on the right for left sidebar
          boxShadow: '2px 0 8px 0 rgba(0,0,0,0.08)', // Correct: shadow to the right
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        {leftSidebar}
      </Box>
    )}
    {/* Main Content */}
    <Box sx={{ flex: 1, p: 0, overflow: 'auto', width: 1}}>
      {children}
    </Box>
  </Box>
);

export { MainLayout };

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#F43C0A', contrastText: '#fff' }, // Scarlet for highlights/buttons
    secondary: { main: '#E2B5A6', contrastText: '#1C2A25' }, // Middle Red for secondary highlights
    background: { default: '#1C2A25', paper: '#232f2a' }, // Deep dark for bg, slightly lighter for paper/cards
    divider: '#A7A29C', // Cinder
    text: {
      primary: '#E2B5A6', // Powder Blue for main text
      secondary: '#A7A29C', // Cinder for secondary text
    },
  },
  typography: {
    fontWeightLight: 400,
    fontWeightRegular: 500,
    fontWeightMedium: 600,
    fontWeightBold: 800,
    allVariants: {
      fontWeight: 500,
    },
    fontSize: 20, // base font size (default is 16, so 16*1.25=20)
    h1: { fontSize: '3.75rem' }, // 3rem * 1.25
    h2: { fontSize: '3rem' },    // 2.4rem * 1.25
    h3: { fontSize: '2.25rem' }, // 1.8rem * 1.25
    h4: { fontSize: '1.75rem' }, // 1.4rem * 1.25
    h5: { fontSize: '1.5rem' },  // 1.2rem * 1.25
    h6: { fontSize: '1.25rem' }, // 1rem * 1.25
    body1: { fontSize: '1.25rem' }, // 1rem * 1.25
    body2: { fontSize: '1.125rem' }, // 0.9rem * 1.25
    subtitle1: { fontSize: '1.125rem' }, // 0.9rem * 1.25
    subtitle2: { fontSize: '1rem' }, // 0.8rem * 1.25
    button: { fontSize: '1.125rem' }, // 0.9rem * 1.25
    caption: { fontSize: '0.875rem' }, // 0.7rem * 1.25
    overline: { fontSize: '0.75rem' }, // 0.6rem * 1.25
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1C2A25',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1201,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          '&.MuiButton-colorInherit:hover': {
            backgroundColor: '#F43C0A', // Scarlet highlight on hover
            color: '#fff',
          },
          '&.MuiButton-containedPrimary': {
            backgroundColor: '#F43C0A',
            color: '#fff',
            '&:hover': {
              backgroundColor: '#E2B5A6', // Middle Red highlight
              color: '#1C2A25',
            },
          },
          '&.MuiButton-containedSecondary': {
            backgroundColor: '#E2B5A6',
            color: '#1C2A25',
            '&:hover': {
              backgroundColor: '#F43C0A', // Scarlet highlight
              color: '#fff',
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#232f2a', // Slightly lighter than bg
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#232f2a', // Slightly lighter than bg
          border: '1px solid #A7A29C', // Cinder border
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          color: '#A8B2BA', // Powder Blue for all text
          fontWeight: 500, // Make all text a bit bolder
        },
      },
    },
      MuiContainer: {
        styleOverrides: {
          root: {
            padding: '0px', // Consistent padding
          },
        },
      },
    }
  });


const Login = React.lazy(() => import('./users/Login'));
const Register = React.lazy(() => import('./users/Register'));
const Dashboard = React.lazy(() => import('./Dashboard'));
const RecordGame = React.lazy(() => import('./matches/RecordGame'));
const Scoreboard = React.lazy(() => import('./matches/Scoreboard'));
const ScheduleGame = React.lazy(() => import('./matches/ScheduleGame'));
const Home = React.lazy(() => import('./Home'));
const CreateLeagueForm = React.lazy(() => import('./leagues/CreateLeagueForm'));
const JoinLeague = React.lazy(() => import('./leagues/JoinLeague'));
const NewLeague = React.lazy(() => import('./leagues/NewLeague'));
const Inbox = React.lazy(() => import('./Inbox'));
const LeagueSettings = React.lazy(() => import('./leagues/leagueSettings'));
const LeagueLayout = React.lazy(() => import('./leagues/LeagueLayout'));
const NewTournament = React.lazy(() => import('./tournaments/NewTourny'));
const LeagueDashboard = React.lazy(() => import('./leagues/LeagueDashboard'));
/*const Scoreboards = React.lazy(() => import('./Scoreboards'));
const TournamentMaker = React.lazy(() => import('./TournamentMaker'));*/
  

function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const { user, loading } = useAuth();
  if (loading) return <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

// Sidebar navigation and info panel
const LeftSidebar: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userLeagues, setUserLeagues] = useState<any[]>([]);
  const [userTournaments, setUserTournaments] = useState<any[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!user) {
      setUserLeagues([]);
      setUserTournaments([]);
      setUnreadMessages(0);
      return;
    }
    // Fetch leagues the user is a member of
    const fetchLeagues = async () => {
      const q = query(collection(db, 'leagues'), where('members', 'array-contains', user.uid));
      const snap = await getDocs(q);
      setUserLeagues(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    // Fetch tournaments the user is a participant in
    const fetchTournaments = async () => {
      const q = query(collection(db, 'tournaments'), where('participants', 'array-contains', user.uid));
      const snap = await getDocs(q);
      setUserTournaments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    // Fetch unread messages count
    const fetchUnreadMessages = async () => {
      const q = query(collection(db, 'messages'), where('recipientId', '==', user.uid), where('read', '==', false));
      const snap = await getDocs(q);
      setUnreadMessages(snap.docs.length);
    };
    
    fetchLeagues();
    fetchTournaments();
    fetchUnreadMessages();
  }, [user]);

  // You can expand this with league info, chat, etc.
  return (
    <Box sx={{ p: 3, color: 'text.primary', flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Button component={Link} to="/Home"><Typography variant="h5" color="primary.main" fontSize={48} fontWeight={1000} mb={2}>Game Logix</Typography></Button> 
      <Box display="flex" flexDirection="column" gap={2} mb={4}>
        <Badge
          color="primary"
          badgeContent={unreadMessages}
          onClick={() => navigate('/inbox')}
        >
          <MailIcon color="secondary" />
        </Badge>
      </Box>
      <Divider color="text.secondary" variant="middle" />
      <Box display="flex" justifyContent="space-between" alignItems="center" my={1}>
        <Typography variant="h6" fontWeight={700} color="text.primary">
          Leagues
        </Typography>
        <Badge
          color="primary"
          onClick={() => navigate('/leagues/new')}
        >
          <AddCircleIcon color="secondary" />
        </Badge>
      </Box>
        <Box mb={5}>
          {userLeagues.length === 0 ? (
            <Box display="flex" flexDirection="column" gap={1}>
              <Button
                variant="outlined"
                color="primary"
                size="small"
                component={Link as any}
                to="/leagues/join"
              >
                Join a League
              </Button>
              <Button
                variant="outlined"
                color="primary"
                size="small"
                component={Link as any}
                to="/leagues/create"
              >
                Create a League
              </Button>
            </Box>
          ) : (
            <Box display="flex" flexWrap="wrap" gap={2}>
              {userLeagues.map(league => (
                <Box key={league.id} sx={{ p: 2, border: '1px solid #A7A29C', borderRadius: 2, bgcolor: 'background.paper', minWidth: 220 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid>
                      <Button
                        component={Link as any}
                        to={`/league/${league.id}/dashboard/Scoreboard`}
                        sx={{
                          textTransform: 'none',
                          p: 0,
                          minWidth: 'unset',
                          '&.active': {
                            bgcolor: 'primary.main',
                            color: 'primary.contrastText',
                          },
                        }}
                      >
                        <Typography variant="subtitle1" fontWeight={700}>{league.name}</Typography>
                        <Typography variant="body2" color="text.secondary">Sports: {league.sports?.join(', ')}</Typography>
                      </Button>
                    </Grid>
                  </Grid>
                  </Box>
              ))}
            </Box>
          )}
        </Box>
        <Box>
        <Divider color="text.secondary" variant="middle" />
        <Box display="flex" justifyContent="space-between" alignItems="center" my={1}>
          <Typography variant="h6" fontWeight={700} color="text.primary">
            Tournaments
          </Typography>
          <Badge
            color="primary"
            onClick={() => navigate('/tournaments/new')}
          >
            <AddCircleIcon color="secondary" />
          </Badge>
        </Box>
        <Box mb={4}>
          {userTournaments.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No tournaments joined yet.</Typography>
          ) : (
            <Box display="flex" flexWrap="wrap" gap={2}>
              {userTournaments.map(tournament => (
                <Box key={tournament.id} sx={{ p: 2, border: '1px solid #A7A29C', borderRadius: 2, bgcolor: 'background.paper', minWidth: 220 }}>
                  <Grid container spacing={2} alignItems="center">
                      <Typography variant="subtitle1" fontWeight={700}>{tournament.name}</Typography>
                      <Typography variant="body2" color="text.secondary">Sport: {tournament.sport}</Typography>
                  </Grid>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>
      <Divider color="text.secondary" variant="middle" />
      {user ? (
        <Box justifyContent="space-between" alignItems="left" my={1}>
          <Button fullWidth sx={{ display: 'flex' }} onClick={() => navigate('/dashboard')}>
            <AccountCircleRoundedIcon fontSize="large" color="secondary" />
              <Box pl={2} justifyContent="left">
                <Typography variant="h5" fontWeight={500} color="text.primary">
                  {user ? user.displayName || user.email : 'Guest'}
                </Typography>
                {user && <Typography variant="caption" color="text.secondary">{user.email}</Typography>}
              </Box>
          </Button> 
        </Box>
      ) : (
        <Button variant="contained" color="primary" fullWidth onClick={() => navigate('/login')}>Sign In</Button>
      )}
      <Box flex={1}>
        {/* Add more navigation as needed */}
      </Box>
    </Box>
  );
};

function DashboardWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        maxWidth: 1100,
        mx: 'auto',
        my: 4,
        p: { xs: 2, md: 4 },
        bgcolor: 'background.paper',
        borderRadius: 4,
        boxShadow: 6,
        border: '1.5px solid',
        borderColor: 'divider',
        minHeight: '80vh',
      }}
    >
      {children}
    </Box>
  );
};

import type { User } from 'firebase/auth';

const globalRoutes = (user: User | null) => [
  <Route path="/dashboard" element={<ProtectedRoute><DashboardWrapper><Dashboard /></DashboardWrapper></ProtectedRoute>} />,
  <Route path="/Home" element={<ProtectedRoute><Home /></ProtectedRoute>} />,
  <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />,
  <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register />} />,
  <Route path="/leagues/create" element={<ProtectedRoute><CreateLeagueForm /></ProtectedRoute>} />,
  <Route path="/leagues/join" element={<ProtectedRoute><JoinLeague /></ProtectedRoute>} />,
  <Route path="/leagues/new" element={<ProtectedRoute><NewLeague /></ProtectedRoute>} />,
  <Route path="/Inbox" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />,
  <Route path="/tournaments/new" element={<ProtectedRoute><NewTournament /></ProtectedRoute>} />,
];

const LeagueRoutes = () => {
  return (
    <Route path="league/:leagueId" element={<LeagueLayout />}>
      <Route index element={<ProtectedRoute><LeagueDashboard /></ProtectedRoute>} />
        <Route path="dashboard" element={<ProtectedRoute><LeagueDashboard /></ProtectedRoute>}>
        <Route path="schedule" element={<ProtectedRoute><ScheduleGame /></ProtectedRoute>} />
        <Route path="record" element={<ProtectedRoute><RecordGame /></ProtectedRoute>} />
        <Route path="scoreboard" element={<ProtectedRoute><Scoreboard /></ProtectedRoute>} />
      </Route>
      <Route path="LeagueSettings/*" element={<ProtectedRoute><LeagueSettings /></ProtectedRoute>} />
    </Route>
  )
};

 

function AppContent() {
  const { user } = useAuth();
  return (
    <MainLayout leftSidebar={<LeftSidebar />}>
      <Container sx={{ mt: 4, mb: 4, maxWidth: 'lg' }}>
        <Suspense fallback={<Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>}>
          <Routes>
            {globalRoutes(user)}
            {LeagueRoutes()}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Container>
    </MainLayout>
  );
}

// NotFound page fallback
const NotFound: React.FC = () => (
  <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh">
    <Typography variant="h2" color="primary" gutterBottom>404</Typography>
    <Typography variant="h5" color="text.secondary" gutterBottom>Page Not Found</Typography>
    <Button variant="contained" color="primary" component={Link} to="/dashboard">Go to Dashboard</Button>
  </Box>
);

// Note: Remember to add top padding to the main content if needed to account for the fixed AppBar height.
export default App;
