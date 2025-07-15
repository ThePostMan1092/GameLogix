import { Outlet, useParams, useNavigate } from 'react-router-dom';
import { Box, IconButton, Grid, Typography, Avatar, Button } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

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
                    <Button
                        variant="outlined"
                        startIcon={<SettingsIcon />}
                        onClick={() => navigate(`/League/${LeagueId}/leagueSettings`)}
                        size="small"
                    >
                        Settings
                    </Button>
                </Grid>
            </Grid>
            <Outlet />
        </Box>
    );
};

export default LeagueLayout;