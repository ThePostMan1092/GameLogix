import React from 'react';
import { Box, Typography, Container, Grid, Card, CardContent, CardMedia } from '@mui/material';
import { 
  EmojiEvents, Analytics, Groups, SportsSoccer, 
  Timeline, Security, PhoneIphone, IntegrationInstructions
} from '@mui/icons-material';

const FeaturesPage: React.FC = () => {
  const features = [
    {
      icon: <EmojiEvents sx={{ fontSize: 48 }} />,
      title: 'Advanced League Management',
      description: 'Create and manage multiple leagues with custom rules, tournament brackets, and playoff systems.',
      details: [
        'Custom scoring systems',
        'Tournament brackets',
        'Playoff management',
        'Season scheduling'
      ]
    },
    {
      icon: <Analytics sx={{ fontSize: 48 }} />,
      title: 'Comprehensive Analytics',
      description: 'Track detailed statistics and performance metrics for every player and team.',
      details: [
        'Player performance tracking',
        'Historical data analysis',
        'Custom stat categories',
        'Performance trends'
      ]
    },
    {
      icon: <Groups sx={{ fontSize: 48 }} />,
      title: 'Team & Player Management',
      description: 'Efficiently manage team rosters, player profiles, and league memberships.',
      details: [
        'Player profile management',
        'Team roster control',
        'Join request handling',
        'Role-based permissions'
      ]
    },
    {
      icon: <SportsSoccer sx={{ fontSize: 48 }} />,
      title: 'Multi-Sport Support',
      description: 'Support for any sport with customizable rules and scoring systems.',
      details: [
        'Ping pong, foosball, pool',
        'Custom sport creation',
        'Flexible scoring rules',
        'Sport-specific statistics'
      ]
    },
    {
      icon: <Timeline sx={{ fontSize: 48 }} />,
      title: 'Real-Time Scoreboards',
      description: 'Live scoreboards with rankings, statistics, and match results.',
      details: [
        'Live ranking updates',
        'Match result tracking',
        'Performance metrics',
        'Historical records'
      ]
    },
    {
      icon: <Security sx={{ fontSize: 48 }} />,
      title: 'Enterprise Security',
      description: 'Bank-level security with data encryption and privacy controls.',
      details: [
        'Data encryption',
        'Secure authentication',
        'Privacy controls',
        'Compliance ready'
      ]
    },
    {
      icon: <PhoneIphone sx={{ fontSize: 48 }} />,
      title: 'Mobile Responsive',
      description: 'Access GameLogix from any device with our responsive web interface.',
      details: [
        'Mobile-first design',
        'Cross-platform compatibility',
        'Offline capabilities',
        'Progressive web app'
      ]
    },
    {
      icon: <IntegrationInstructions sx={{ fontSize: 48 }} />,
      title: 'Easy Integration',
      description: 'Integrate with your existing tools and workflows seamlessly.',
      details: [
        'API access',
        'Webhook support',
        'Third-party integrations',
        'Custom solutions'
      ]
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Box textAlign="center" sx={{ mb: 8 }}>
        <Typography variant="h2" gutterBottom>
          Powerful Features for Modern Workplaces
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto' }}>
          GameLogix provides everything you need to run professional sports leagues in your organization.
        </Typography>
      </Box>

      {/* Main Features Grid */}
      <Grid container spacing={4} sx={{ mb: 12 }}>
        {features.map((feature, index) => (
          <Grid size={6}>
            <Card sx={{ height: '100%', p: 3, textAlign: 'center' }}>
              <Box sx={{ color: 'primary.main', mb: 2 }}>
                {feature.icon}
              </Box>
              <Typography variant="h6" gutterBottom>
                {feature.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {feature.description}
              </Typography>
              <Box sx={{ textAlign: 'left' }}>
                {feature.details.map((detail, idx) => (
                  <Typography key={idx} variant="body2" sx={{ fontSize: '0.875rem', mb: 0.5 }}>
                    • {detail}
                  </Typography>
                ))}
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Feature Spotlight */}
      <Box sx={{ mb: 8 }}>
        <Typography variant="h3" textAlign="center" gutterBottom>
          Why Companies Choose GameLogix
        </Typography>
        <Grid container spacing={6} sx={{ mt: 4 }}>
          <Grid size={6}>
            <Box sx={{ height: 300, bgcolor: 'grey.100', borderRadius: 2, mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Built for Scale
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Whether you have 10 employees or 10,000, GameLogix scales with your organization. 
              Our enterprise-grade infrastructure ensures reliable performance at any size.
            </Typography>
          </Grid>
          <Grid size={6}>
            <Box sx={{ height: 300, bgcolor: 'grey.100', borderRadius: 2, mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Easy Setup & Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Get your leagues up and running in minutes. Our intuitive interface makes it easy 
              for anyone to manage competitions without technical expertise.
            </Typography>
          </Grid>
        </Grid>
      </Box>

      {/* Integration Section */}
      <Box sx={{ textAlign: 'center', py: 6, bgcolor: 'grey.50', borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom>
          Integrates with Your Favorite Tools
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Connect GameLogix with the tools your team already uses
        </Typography>
        <Grid container spacing={4} justifyContent="center">
          <Grid size={6}>
            <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 1, minWidth: 120 }}>
              <Typography variant="body2">Slack</Typography>
            </Box>
          </Grid>
          <Grid size={6}>
            <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 1, minWidth: 120 }}>
              <Typography variant="body2">Microsoft Teams</Typography>
            </Box>
          </Grid>
          <Grid size={6}>
            <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 1, minWidth: 120 }}>
              <Typography variant="body2">Google Workspace</Typography>
            </Box>
          </Grid>
          <Grid size={6}>
            <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 1, minWidth: 120 }}>
              <Typography variant="body2">Discord</Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default FeaturesPage;