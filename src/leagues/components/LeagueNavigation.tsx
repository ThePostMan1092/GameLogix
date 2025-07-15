import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EventIcon from '@mui/icons-material/Event';
import SportsScoreIcon from '@mui/icons-material/SportsScore';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SettingsIcon from '@mui/icons-material/Settings';

const LeagueNavigation: React.FC = () => {
  const navigate = useNavigate();
  const { leagueId } = useParams<{ leagueId: string }>();

  // Helper to build league-specific paths
  const leaguePath = (sub: string) => `/leagues/${leagueId}/${sub}`;

  return (
    <List>
      <ListItemButton onClick={() => navigate(leaguePath('scoreboard'))}>
        <ListItemIcon><SportsScoreIcon /></ListItemIcon>
        <ListItemText primary="My League" />
      </ListItemButton>
      <ListItemButton onClick={() => navigate(leaguePath('dashboard'))}>
        <ListItemIcon><DashboardIcon /></ListItemIcon>
        <ListItemText primary="Dashboard" />
      </ListItemButton>
      <ListItemButton onClick={() => navigate(leaguePath('schedule'))}>
        <ListItemIcon><EventIcon /></ListItemIcon>
        <ListItemText primary="Schedule Game" />
      </ListItemButton>
      <ListItemButton onClick={() => navigate(leaguePath('record'))}>
        <ListItemIcon><AssignmentIcon /></ListItemIcon>
        <ListItemText primary="Record Game" />
      </ListItemButton>
      <ListItemButton onClick={() => navigate(leaguePath('settings'))}>
        <ListItemIcon><SettingsIcon /></ListItemIcon>
        <ListItemText primary="Settings" />
      </ListItemButton>
    </List>
  );
};

export default LeagueNavigation;