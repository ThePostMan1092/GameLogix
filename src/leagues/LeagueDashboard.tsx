import { Outlet, useParams, NavLink  } from 'react-router-dom';
import { Box, Button } from '@mui/material';

const tabPages = [
  { label: 'League', path: 'Scoreboard' },
  { label: 'Record', path: 'record' },
  { label: 'Schedule', path: 'schedule' }
];

const LeagueDashboard = () => {
    const { LeagueId } = useParams();
    return (
        <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, p: 1 }}>
            <Box display="flex" gap={20} justifyContent="center" my={1} mb={2}>
                {tabPages.map(tab => (
                <Button
                    key={tab.path}
                    component={NavLink}
                    to={`/League/${LeagueId}/dashboard/${tab.path}`}
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
    );
};

export default LeagueDashboard;
