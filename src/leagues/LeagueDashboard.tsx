import { Outlet, useParams, NavLink  } from 'react-router-dom';
import { Box, Button } from '@mui/material';

const tabPages = [
  { label: 'League', path: 'Scoreboard' },
  { label: 'Record', path: 'record' },
  { label: 'Schedule', path: 'schedule' }
];

const LeagueDashboard = () => {
    const { leagueId } = useParams();
    return (
        <Box 
            data-testid="league-dashboard"
            className="league-dashboard"
            sx={{ bgcolor: 'background.paper', borderRadius: 2, p: 1 }}
        >
            <Box 
                data-testid="dashboard-tabs"
                className="dashboard-tabs"
                display="flex" 
                gap={20} 
                justifyContent="center" 
                my={1} 
                mb={2}
            >
                {tabPages.map(tab => (
                <Button
                    key={tab.path}
                    component={NavLink}
                    to={`/League/${leagueId}/dashboard/${tab.path}`}
                    data-testid={`tab-${tab.path.toLowerCase()}`}
                    className={`dashboard-tab tab-${tab.path.toLowerCase()}`}
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
            <Box 
                data-testid="dashboard-content"
                className="dashboard-content"
                sx={{ flexGrow: 1 }}
            >
                <Outlet />
            </Box>
        </Box>
    );
};

export default LeagueDashboard;
