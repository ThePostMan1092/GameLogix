import { Outlet, useParams, useNavigate, NavLink  } from 'react-router-dom';
import { Box, IconButton, Grid, Typography, Avatar, Button } from '@mui/material';
import SettingsApplicationsIcon from '@mui/icons-material/SettingsApplications';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const tabPages = [
  { label: 'League', path: 'Scoreboard' },
  { label: 'Record', path: 'record' },
  { label: 'Schedule', path: 'schedule' }
];

const LeagueLayout = () => {
    const { LeagueId } = useParams();
    const navigate = useNavigate();

    // Placeholder for league name and logo, replace with actual data fetch if needed
    const leagueName = `League ${LeagueId}`;
    const leagueLogoUrl = ''; // Add logo URL if available

    return (
        <Box sx={{ p: 2 }}>
            <Grid container alignItems="center" spacing={2} sx={{ mb: 2 }}>
                <Grid>
                    <IconButton onClick={() => navigate('/dashboard')} color="primary">
                        <ArrowBackIcon />
                    </IconButton>
                </Grid>
                <Grid>
                    <Avatar src={leagueLogoUrl}>{leagueName[0]}</Avatar>
                </Grid>
                <Grid>
                    <Typography variant="h5" fontWeight={600}>
                        {leagueName}
                    </Typography>
                </Grid>
                <Grid>
                    <IconButton
                        onClick={() => navigate(`/League/${LeagueId}/leagueSettings`)}
                        size="large"
                        color ="primary"
                    >
                        <SettingsApplicationsIcon />
                    </IconButton>
                </Grid>
            </Grid>
            
            {/* Tab Navigation */}
            <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, p: 1 }}>
                <Box display="flex" gap={20} justifyContent="center" my={1} mb={2}>
                    {tabPages.map(tab => (
                    <Button
                        key={tab.path}
                        component={NavLink}
                        to={`/League/${LeagueId}/${tab.path}`}
                        sx={{
                        color: 'text.primary',
                        bgcolor: '#f43d0a27',
                        '&.active': {
                            bgcolor: 'primary.main',
                            color: 'primary.contrastText',
                        },
                        borderRadius: 2,
                        px: 3,
                        py: 0.5,
                        fontWeight: 600,
                        textTransform: 'none',
                        }}
                    >
                        {tab.label}
                    </Button>
                    ))}
                </Box>
                <Box sx={{ flexGrow: 1 }} >
                    <Outlet />
                </Box>
            </Box>
            
        </Box>
    );
};

export default LeagueLayout;