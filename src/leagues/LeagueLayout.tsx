import { Outlet, useParams, useNavigate } from 'react-router-dom';
import { Box, IconButton, Grid, Typography, Avatar } from '@mui/material';
import SettingsApplicationsIcon from '@mui/icons-material/SettingsApplications';
import LeagueChat from '../components/LeagueChat';

const LeagueLayout = () => {
    const { leagueId } = useParams();
    const navigate = useNavigate();

    // Placeholder for league name and logo, replace with actual data fetch if needed
    const leagueName = `League ${leagueId}`;
    const leagueLogoUrl = ''; // Add logo URL if available

    return (
        <Grid 
            container
            data-testid="league-layout-container"
            className="league-layout-container"
        >
            <Grid 
                size={8}
                data-testid="league-main-content"
                className="league-main-content"
            >
                <Box 
                    data-testid="league-content-wrapper"
                    className="league-content-wrapper"
                    sx={{ p: 0 }}
                >
                    <Grid 
                        container 
                        alignItems="center" 
                        spacing={2} 
                        sx={{ mb: 2 }}
                        data-testid="league-header"
                        className="league-header"
                    >
                        <Grid>
                            <Avatar 
                                src={leagueLogoUrl}
                                data-testid="league-avatar"
                                className="league-avatar"
                            >
                                {leagueName[0]}
                            </Avatar>
                        </Grid>
                        <Grid>
                            <Typography 
                                variant="h5" 
                                fontWeight={600}
                                data-testid="league-name"
                                className="league-name"
                            >
                                {leagueName}
                            </Typography>
                        </Grid>
                        <Grid>
                            <IconButton
                                onClick={() => navigate(`/league/${leagueId}/LeagueSettings`)}
                                size="large"
                                color="primary"
                                data-testid="league-settings-button"
                                className="league-settings-button"
                            >
                                <SettingsApplicationsIcon />
                            </IconButton>
                        </Grid>
                    </Grid>
                    <Box
                        data-testid="league-outlet"
                        className="league-outlet"
                    >
                        <Outlet />
                    </Box>
                </Box>
            </Grid>
            <Grid 
                size={4}
                data-testid="league-chat-sidebar"
                className="league-chat-sidebar"
            >
                <Box 
                    data-testid="league-chat-container"
                    className="league-chat-container"
                    sx={{ 
                        position: 'sticky', 
                        top: 0, 
                        height: '100vh', 
                        overflow: 'hidden',
                        p: 1 
                    }}
                >
                    <LeagueChat />
                </Box>
            </Grid>
        </Grid>
    );
};


export default LeagueLayout;