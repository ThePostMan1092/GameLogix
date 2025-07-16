import { Outlet, useParams, useNavigate, NavLink  } from 'react-router-dom';
import { Box, IconButton, Grid, Typography, Avatar, Button } from '@mui/material';
import SettingsApplicationsIcon from '@mui/icons-material/SettingsApplications';


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
                        color ="primary">
                        <SettingsApplicationsIcon />
                    </IconButton>
                </Grid>
            </Grid>
            <Box>
                <Outlet />
            </Box>
        </Box>
    );
};

export default LeagueLayout;