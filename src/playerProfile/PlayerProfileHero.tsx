import React from 'react';
import { 
  Box, 
  Typography, 
  Avatar, 
  Card, 
  CardContent, 
  Chip, 
  LinearProgress,
  IconButton,
  Tooltip,
  keyframes
} from '@mui/material';
import { 
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingUpIcon,
  Whatshot as FireIcon,
  Star as StarIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import type { SportParentStats } from '../types/stats';

interface PlayerProfileHeroProps {
  user: any;
  allStats: SportParentStats[];
  loading: boolean;
}

// Animation for rotating highlight moments
const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const slideIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;


// Sport background gradients
const sportBackgrounds = {
  'ping-pong': 'linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%)',
  'foosball': 'linear-gradient(135deg, #4CAF50 0%, #81C784 100%)',
  'pool': 'linear-gradient(135deg, #2196F3 0%, #64B5F6 100%)',
  'basketball': 'linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)',
  'default': 'linear-gradient(135deg, #9C27B0 0%, #BA68C8 100%)'
};

export const PlayerProfileHero: React.FC<PlayerProfileHeroProps> = ({ 
  user, 
  allStats, 
  loading 
}) => {
  const [currentHighlight, setCurrentHighlight] = React.useState(0);

  // Calculate impressive stats based on thresholds
  const getImpressiveStats = () => {
    const impressive: Array<{
      label: string;
      value: string | number;
      icon: React.ReactNode;
      color: string;
    }> = [];

    allStats.forEach(sportStats => {
      const stats = sportStats.aggregateStats;
      
      // High win percentage (>75%)
      if (stats.winPercentage >= 75 && stats.matchesPlayed >= 5) {
        impressive.push({
          label: `${sportStats.sportParentName} Win Rate`,
          value: `${stats.winPercentage.toFixed(1)}%`,
          icon: <TrophyIcon />,
          color: '#4CAF50'
        });
      }

      // Current win streak (>3)
      if (stats.currentWinStreak >= 3) {
        impressive.push({
          label: 'Current Streak',
          value: `${stats.currentWinStreak} wins`,
          icon: <FireIcon />,
          color: '#FF5722'
        });
      }

      // Longest win streak (>5)
      if (stats.longestWinStreak >= 5) {
        impressive.push({
          label: 'Best Streak',
          value: `${stats.longestWinStreak} wins`,
          icon: <TrendingUpIcon />,
          color: '#2196F3'
        });
      }

      // High number of matches in a sport (>20)
      if (stats.matchesPlayed >= 20) {
        impressive.push({
          label: `${sportStats.sportParentName} Veteran`,
          value: `${stats.matchesPlayed} games`,
          icon: <StarIcon />,
          color: '#9C27B0'
        });
      }

      // High shutout rate (>30% with 10+ games)
      if (stats.matchesPlayed >= 10 && (stats.shutouts / stats.matchesPlayed) >= 0.3) {
        impressive.push({
          label: 'Shutout Master',
          value: `${((stats.shutouts / stats.matchesPlayed) * 100).toFixed(0)}%`,
          icon: <TrophyIcon />,
          color: '#FF9800'
        });
      }
    });

    return impressive.slice(0, 3); // Top 3 most impressive
  };

  // Get favorite sport (most played)
  const getFavoriteSport = () => {
    if (allStats.length === 0) return { name: 'No games yet', matches: 0 };
    
    const favorite = allStats.reduce((prev, current) => 
      current.aggregateStats.matchesPlayed > prev.aggregateStats.matchesPlayed ? current : prev
    );
    
    return {
      name: favorite.sportParentName,
      matches: favorite.aggregateStats.matchesPlayed
    };
  };

  // Get all-time best stats
  const getAllTimeStats = () => {
    const totalMatches = allStats.reduce((sum, sport) => sum + sport.aggregateStats.matchesPlayed, 0);
    const totalWins = allStats.reduce((sum, sport) => sum + sport.aggregateStats.matchesWon, 0);
    const bestStreak = Math.max(...allStats.map(sport => sport.aggregateStats.longestWinStreak), 0);
    const highestScore = Math.max(...allStats.map(sport => sport.aggregateStats.highestScore || 0), 0);
    
    return {
      totalMatches,
      totalWins,
      overallWinRate: totalMatches > 0 ? ((totalWins / totalMatches) * 100).toFixed(1) : '0',
      bestStreak,
      highestScore
    };
  };

  // Recent achievements (mock for now - would be calculated from recent matches)
  const getRecentAchievements = () => [
    { label: 'Pool Shark', description: 'Won 5 pool games in a row', date: '2 days ago', icon: <TrophyIcon /> },
    { label: 'Comeback Kid', description: 'Won from 0-2 down', date: '1 week ago', icon: <TrendingUpIcon /> },
    { label: 'Perfect Game', description: 'Shutout victory in ping pong', date: '2 weeks ago', icon: <StarIcon /> }
  ].slice(0, 3);

  // Rotating highlight moments
  const highlightMoments = [
    'Dominated the league last month! 🏆',
    'On a 5-game winning streak! 🔥',
    'Undefeated in ping pong this week! 🏓',
    'Master of comebacks! 💪'
  ];

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHighlight((prev) => (prev + 1) % highlightMoments.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const favoriteSport = getFavoriteSport();
  const allTimeStats = getAllTimeStats();
  const impressiveStats = getImpressiveStats();
  const achievements = getRecentAchievements();

  const backgroundGradient = sportBackgrounds[favoriteSport.name as keyof typeof sportBackgrounds] || sportBackgrounds.default;

  if (loading) {
    return (
      <Card sx={{ mb: 4, minHeight: 300 }}>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="250px">
            <LinearProgress sx={{ width: '50%' }} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      sx={{ 
        mb: 4, 
        background: backgroundGradient,
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        minHeight: 350,
        animation: `${slideIn} 0.6s ease-out`
      }}
    >
      <CardContent sx={{ p: 4 }}>
        <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={4} alignItems="center">
          {/* Left Section - Avatar and Basic Info */}
          <Box flex={{ xs: '1', md: '0 0 300px' }} display="flex" flexDirection="column" alignItems="center" textAlign="center">
            <Avatar
              src={user?.photoURL}
              sx={{ 
                width: 120, 
                height: 120, 
                mb: 2,
                border: '4px solid rgba(255,255,255,0.3)',
                animation: `${pulse} 2s infinite`
              }}
            >
              {user?.displayName?.[0] || user?.email?.[0] || 'P'}
            </Avatar>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              {user?.displayName || user?.email?.split('@')[0] || 'Player'}
            </Typography>
            <Chip 
              label={`Favorite: ${favoriteSport.name}`}
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                color: 'white',
                fontWeight: 'bold'
              }}
            />
          </Box>

          {/* Center Section - All-Time Stats */}
          <Box flex="1" textAlign="center">
            <Typography variant="h6" gutterBottom fontWeight="bold">
              All-Time Performance
            </Typography>
            <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={2} mt={2}>
              <Box>
                <Typography variant="h3" fontWeight="bold">
                  {allTimeStats.totalWins}
                </Typography>
                <Typography variant="body2">Total Wins</Typography>
              </Box>
              <Box>
                <Typography variant="h3" fontWeight="bold">
                  {allTimeStats.overallWinRate}%
                </Typography>
                <Typography variant="body2">Win Rate</Typography>
              </Box>
              <Box>
                <Typography variant="h3" fontWeight="bold">
                  {allTimeStats.bestStreak}
                </Typography>
                <Typography variant="body2">Best Streak</Typography>
              </Box>
              <Box>
                <Typography variant="h3" fontWeight="bold">
                  {allTimeStats.highestScore}
                </Typography>
                <Typography variant="body2">High Score</Typography>
              </Box>
            </Box>
          </Box>

          {/* Right Section - Impressive Stats */}
          <Box flex={{ xs: '1', md: '0 0 300px' }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Standout Stats
            </Typography>
            {impressiveStats.length > 0 ? impressiveStats.map((stat, index) => (
              <Box 
                key={index} 
                display="flex" 
                alignItems="center" 
                mb={1}
                sx={{ animation: `${slideIn} 0.6s ease-out ${index * 0.1}s` }}
              >
                <Box sx={{ color: stat.color, mr: 1 }}>
                  {stat.icon}
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    {stat.value}
                  </Typography>
                  <Typography variant="caption">
                    {stat.label}
                  </Typography>
                </Box>
              </Box>
            )) : (
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Play more games to unlock impressive stats!
              </Typography>
            )}
          </Box>
        </Box>

        {/* Bottom Section - Recent Achievements & Highlight */}
        <Box mt={4}>
          <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={4}>
            <Box flex="1">
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Recent Achievements
              </Typography>
              <Box display="flex" gap={2} flexWrap="wrap">
                {achievements.map((achievement, index) => (
                  <Tooltip 
                    key={index}
                    title={`${achievement.description} - ${achievement.date}`}
                    arrow
                  >
                    <Chip
                      icon={achievement.icon}
                      label={achievement.label}
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        '&:hover': {
                          bgcolor: 'rgba(255,255,255,0.3)',
                          transform: 'scale(1.05)'
                        },
                        transition: 'all 0.2s'
                      }}
                    />
                  </Tooltip>
                ))}
              </Box>
            </Box>
            <Box flex={{ xs: '1', md: '0 0 300px' }} display="flex" alignItems="center" justifyContent="flex-end">
              <Typography 
                variant="h6" 
                sx={{ 
                  animation: `${pulse} 2s infinite`,
                  textAlign: 'right'
                }}
              >
                {highlightMoments[currentHighlight]}
              </Typography>
              <IconButton 
                onClick={() => setCurrentHighlight((prev) => (prev + 1) % highlightMoments.length)}
                sx={{ color: 'white', ml: 1 }}
              >
                <RefreshIcon />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
