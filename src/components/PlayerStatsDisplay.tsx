import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Chip, 
  CircularProgress,
  Tab,
  Tabs
} from '@mui/material';
import { usePlayerStats } from '../hooks/usePlayerStats';
import type { SportParentStats, aggregateStats } from '../types/stats';

interface PlayerStatsDisplayProps {
  playerId: string;
  playerName?: string;
}

const PlayerStatsDisplay: React.FC<PlayerStatsDisplayProps> = ({ 
  playerId, 
  playerName = 'Player' 
}) => {
  const { getUserStats } = usePlayerStats();
  const [statsDocuments, setStatsDocuments] = useState<SportParentStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const userStats = await getUserStats(playerId);
        setStatsDocuments(userStats);
      } catch (err) {
        setError('Failed to load player stats');
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };

    if (playerId) {
      fetchStats();
    }
  }, [playerId, getUserStats]);

  const StatCard: React.FC<{ title: string; value: string | number; color?: string }> = ({ 
    title, 
    value, 
    color = 'primary' 
  }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" component="div" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h4" color={color}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );

  const renderAggregateStats = (aggregateStats: aggregateStats) => (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
      <StatCard title="Matches Played" value={aggregateStats.matchesPlayed} />
      <StatCard title="Matches Won" value={aggregateStats.matchesWon} color="success.main" />
      <StatCard title="Matches Lost" value={aggregateStats.matchesLost} color="error.main" />
      <StatCard 
        title="Win Percentage" 
        value={`${aggregateStats.winPercentage.toFixed(1)}%`} 
        color="info.main" 
      />
      <StatCard title="Current Win Streak" value={aggregateStats.currentWinStreak} />
      <StatCard title="Longest Win Streak" value={aggregateStats.longestWinStreak} />
      <StatCard title="Shutouts" value={aggregateStats.shutouts} />
      <StatCard title="Comeback Wins" value={aggregateStats.comebackWins} />

      <Box sx={{ gridColumn: '1 / -1' }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Achievements
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip 
                label={`🏆 ${aggregateStats.titlesWon} Titles`} 
                color="warning" 
                variant="outlined" 
              />
              <Chip 
                label={`🥈 ${aggregateStats.runnerUpFinishes} Runner-ups`} 
                color="default" 
                variant="outlined" 
              />
              <Chip 
                label={`🥇 ${aggregateStats.medals.gold} Gold`} 
                color="warning" 
                variant="filled" 
              />
              <Chip 
                label={`🥈 ${aggregateStats.medals.silver} Silver`} 
                color="default" 
                variant="filled" 
              />
              <Chip 
                label={`🥉 ${aggregateStats.medals.bronze} Bronze`} 
                color="error" 
                variant="filled" 
              />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {aggregateStats.bestPartner.userId && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Best Partner
            </Typography>
            <Typography variant="body1">
              {aggregateStats.bestPartner.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Win Rate: {aggregateStats.bestPartner.winPercentage.toFixed(1)}%
            </Typography>
          </CardContent>
        </Card>
      )}

      {aggregateStats.mostFrequentRival.userId && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Most Frequent Rival
            </Typography>
            <Typography variant="body1">
              {aggregateStats.mostFrequentRival.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Record: {aggregateStats.mostFrequentRival.wins}W - {aggregateStats.mostFrequentRival.losses}L
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!statsDocuments || statsDocuments.length === 0) {
    return (
      <Box p={4}>
        <Typography>No statistics available for {playerName}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {playerName} Statistics
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={selectedTab} onChange={(_, newValue) => setSelectedTab(newValue)}>
          <Tab label="All Sports Combined" />
          {statsDocuments.map((doc) => (
            <Tab key={doc.sportParentName} label={doc.sportParentName} />
          ))}
        </Tabs>
      </Box>

      {selectedTab === 0 && (
        <Box>
          <Typography variant="h5" gutterBottom>
            Combined Statistics Across All Sports
          </Typography>
          {/* TODO: Combine stats from all sport parent documents */}
          <Typography>Combined view coming soon...</Typography>
        </Box>
      )}

      {selectedTab > 0 && selectedTab <= statsDocuments.length && (
        <Box>
          <Typography variant="h5" gutterBottom>
            {statsDocuments[selectedTab - 1].sportParentName} Statistics
          </Typography>
          {renderAggregateStats(statsDocuments[selectedTab - 1].aggregateStats)}
        </Box>
      )}
    </Box>
  );
};

export default PlayerStatsDisplay;
