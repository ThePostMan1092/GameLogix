import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tab,
  Tabs,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Tooltip,
  IconButton,
  keyframes
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  EmojiEvents as TrophyIcon,
  Groups as PartnersIcon,
  Visibility as ViewIcon,
  Star as StarIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import type { SportParentStats } from '../types/stats';

interface PlayerStatsDeepDiveProps {
  allStats: SportParentStats[];
  loading: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`sport-tabpanel-${index}`}
      aria-labelledby={`sport-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const glow = keyframes`
  0% { box-shadow: 0 0 5px rgba(76, 175, 80, 0.5); }
  50% { box-shadow: 0 0 20px rgba(76, 175, 80, 0.8); }
  100% { box-shadow: 0 0 5px rgba(76, 175, 80, 0.5); }
`;

export const PlayerStatsDeepDive: React.FC<PlayerStatsDeepDiveProps> = ({
  allStats,
  loading
}) => {
  const [selectedTab, setSelectedTab] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  // Generate mock historical data for trends (in real app, this would come from match history)
  const generateHistoricalData = (sportStats: SportParentStats) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    return months.slice(0, currentMonth + 1).map((month) => {
      const baseWinRate = sportStats.aggregateStats.winPercentage;
      const variance = (Math.random() - 0.5) * 30; // ±15% variance
      const winRate = Math.max(0, Math.min(100, baseWinRate + variance));
      
      return {
        month,
        winRate: Number(winRate.toFixed(1)),
        matchesPlayed: Math.floor(Math.random() * 10) + 1,
        avgScore: Math.floor(Math.random() * 21) + 10
      };
    });
  };

  // Generate partner/rival data (mock)
  const generatePartnerRivalData = () => {
    const partners = [
      { name: 'John Smith', gamesPlayed: 15, winRate: 68, lastPlayed: '2 days ago' },
      { name: 'Sarah Wilson', gamesPlayed: 12, winRate: 75, lastPlayed: '1 week ago' },
      { name: 'Mike Johnson', gamesPlayed: 8, winRate: 62, lastPlayed: '2 weeks ago' }
    ];

    const rivals = [
      { name: 'Alex Chen', gamesPlayed: 20, wins: 12, losses: 8, lastPlayed: '3 days ago' },
      { name: 'Lisa Davis', gamesPlayed: 15, wins: 8, losses: 7, lastPlayed: '1 week ago' },
      { name: 'Tom Brown', gamesPlayed: 10, wins: 4, losses: 6, lastPlayed: '2 weeks ago' }
    ];

    return { partners, rivals };
  };

  // Generate achievements with progress (mock)
  const generateAchievements = (sportStats: SportParentStats) => {
    const stats = sportStats.aggregateStats;
    
    return [
      {
        name: 'Century Club',
        description: 'Win 100 matches',
        current: stats.matchesWon,
        target: 100,
        icon: <TrophyIcon />
      },
      {
        name: 'Streak Master',
        description: 'Achieve a 10-game win streak',
        current: stats.longestWinStreak,
        target: 10,
        icon: <TrendingUpIcon />
      },
      {
        name: 'High Scorer',
        description: 'Score 50+ points in a match',
        current: stats.highestScore || 0,
        target: 50,
        icon: <StarIcon />
      },
      {
        name: 'Shutout King',
        description: 'Win 25 shutout matches',
        current: stats.shutouts,
        target: 25,
        icon: <TrophyIcon />
      }
    ];
  };

  // Generate records (mock)
  const generateRecords = (sportStats: SportParentStats) => {
    const stats = sportStats.aggregateStats;
    
    return [
      { category: 'Longest Win Streak', value: stats.longestWinStreak, rank: '#2 All-Time' },
      { category: 'Highest Score', value: stats.highestScore || 0, rank: '#5 All-Time' },
      { category: 'Most Shutouts', value: stats.shutouts, rank: '#3 This Season' },
      { category: 'Win Percentage', value: `${stats.winPercentage.toFixed(1)}%`, rank: '#7 Overall' },
      { category: 'Comeback Wins', value: stats.comebackWins, rank: '#1 This Month' }
    ];
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <LinearProgress sx={{ width: '50%' }} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (allStats.length === 0) {
    return (
      <Card>
        <CardContent>
          <Box textAlign="center" py={8}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No statistics available yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Play some games to see detailed analytics here!
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent sx={{ p: 0 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={selectedTab} 
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                minHeight: 72,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  transition: 'all 0.2s'
                }
              },
              '& .Mui-selected': {
                animation: `${glow} 2s infinite`,
                fontWeight: 'bold'
              }
            }}
          >
            {allStats.map((sportStats, index) => (
              <Tab
                key={sportStats.sportParentName}
                label={
                  <Box display="flex" flexDirection="column" alignItems="center">
                    <Typography variant="h6" fontWeight="bold">
                      {sportStats.sportParentName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {sportStats.aggregateStats.matchesPlayed} games • {sportStats.aggregateStats.winPercentage.toFixed(1)}% win rate
                    </Typography>
                  </Box>
                }
                id={`sport-tab-${index}`}
                aria-controls={`sport-tabpanel-${index}`}
              />
            ))}
          </Tabs>
        </Box>

        {allStats.map((sportStats, index) => (
          <TabPanel key={sportStats.sportParentName} value={selectedTab} index={index}>
            <Box display="flex" flexDirection="column" gap={4}>
              
              {/* Overview Chart Section */}
              <Card variant="outlined">
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={3}>
                    <TimelineIcon color="primary" />
                    <Typography variant="h6" fontWeight="bold">
                      Historical Trends
                    </Typography>
                    <Tooltip title="Track your performance over time">
                      <IconButton size="small">
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={generateHistoricalData(sportStats)}>
                      <defs>
                        <linearGradient id="winRateGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#4CAF50" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis dataKey="month" stroke="#666" />
                      <YAxis stroke="#666" />
                      <RechartsTooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="winRate" 
                        stroke="#4CAF50" 
                        strokeWidth={3}
                        fill="url(#winRateGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Partner/Rival Section */}
              <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={3}>
                <Card variant="outlined" sx={{ flex: 1 }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={3}>
                      <PartnersIcon color="success" />
                      <Typography variant="h6" fontWeight="bold">
                        Best Partners
                      </Typography>
                    </Box>
                    {generatePartnerRivalData().partners.map((partner, idx) => (
                      <Box 
                        key={idx} 
                        display="flex" 
                        justifyContent="space-between" 
                        alignItems="center" 
                        py={1}
                        sx={{ 
                          '&:hover': { 
                            backgroundColor: 'rgba(76, 175, 80, 0.1)',
                            borderRadius: 1,
                            transition: 'all 0.2s'
                          }
                        }}
                      >
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {partner.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {partner.gamesPlayed} games • Last: {partner.lastPlayed}
                          </Typography>
                        </Box>
                        <Chip 
                          label={`${partner.winRate}%`}
                          color="success"
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                      </Box>
                    ))}
                  </CardContent>
                </Card>

                <Card variant="outlined" sx={{ flex: 1 }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={3}>
                      <TrophyIcon color="warning" />
                      <Typography variant="h6" fontWeight="bold">
                        Top Rivals
                      </Typography>
                    </Box>
                    {generatePartnerRivalData().rivals.map((rival, idx) => (
                      <Box 
                        key={idx} 
                        display="flex" 
                        justifyContent="space-between" 
                        alignItems="center" 
                        py={1}
                        sx={{ 
                          '&:hover': { 
                            backgroundColor: 'rgba(255, 152, 0, 0.1)',
                            borderRadius: 1,
                            transition: 'all 0.2s'
                          }
                        }}
                      >
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {rival.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {rival.gamesPlayed} games • Last: {rival.lastPlayed}
                          </Typography>
                        </Box>
                        <Chip 
                          label={`${rival.wins}-${rival.losses}`}
                          color={rival.wins > rival.losses ? 'success' : 'error'}
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Box>

              {/* Achievements Section */}
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Achievement Progress
                  </Typography>
                  <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: 'repeat(2, 1fr)' }} gap={3}>
                    {generateAchievements(sportStats).map((achievement, idx) => {
                      const progress = Math.min((achievement.current / achievement.target) * 100, 100);
                      return (
                        <Box 
                          key={idx}
                          sx={{ 
                            '&:hover': { 
                              transform: 'scale(1.02)',
                              transition: 'all 0.2s'
                            }
                          }}
                        >
                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            {achievement.icon}
                            <Typography variant="body2" fontWeight="bold">
                              {achievement.name}
                            </Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                            {achievement.description}
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={progress}
                            sx={{ 
                              height: 8, 
                              borderRadius: 4,
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 4,
                                backgroundColor: progress === 100 ? '#4CAF50' : '#2196F3'
                              }
                            }}
                          />
                          <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
                            {achievement.current}/{achievement.target} {progress === 100 && '🏆'}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                </CardContent>
              </Card>

              {/* Records Section */}
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Personal Records & Rankings
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={2}>
                    {generateRecords(sportStats).map((record, idx) => (
                      <Box 
                        key={idx}
                        display="flex" 
                        justifyContent="space-between" 
                        alignItems="center"
                        p={2}
                        sx={{ 
                          backgroundColor: 'rgba(0, 0, 0, 0.02)',
                          borderRadius: 2,
                          '&:hover': { 
                            backgroundColor: 'rgba(0, 0, 0, 0.04)',
                            transition: 'all 0.2s'
                          }
                        }}
                      >
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {record.category}
                          </Typography>
                          <Typography variant="h6" color="primary" fontWeight="bold">
                            {record.value}
                          </Typography>
                        </Box>
                        <Chip 
                          label={record.rank}
                          color={record.rank.includes('#1') ? 'success' : 'default'}
                          sx={{ fontWeight: 'bold' }}
                        />
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </TabPanel>
        ))}
      </CardContent>
    </Card>
  );
};
