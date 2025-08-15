import React from 'react';
import { Box, Typography, Container, Grid, Card, CardContent, Avatar } from '@mui/material';
import { LinkedIn, Email } from '@mui/icons-material';

const AboutPage: React.FC = () => {
  const teamMembers = [
    {
      name: 'Nathaniel Post',
      role: 'CEO & Founder',
      bio: 'Passionate about workplace culture and competitive gaming. 10+ years in tech.',
      avatar: '/avatars/nathaniel.jpg',
      linkedin: 'https://www.linkedin.com/in/nathaniel-post-20562a273/',
      email: 'nathanielp645@gmail.com'
    },
    {
      name: 'Jane Smith',
      role: 'CTO',
      bio: 'Full-stack developer with expertise in React, TypeScript, and Firebase.',
      avatar: '/avatars/jane.jpg',
      linkedin: 'https://linkedin.com/in/janesmith',
      email: 'jane@gamelogix.com'
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      {/* Company Story */}
      <Box textAlign="center" sx={{ mb: 8 }}>
        <Typography variant="h2" gutterBottom>
          About GameLogix
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto', mb: 4 }}>
          Born from a simple need to organize office ping pong tournaments, GameLogix has evolved into 
          the premier platform for corporate sports competition.
        </Typography>
      </Box>

      {/* Mission Section */}
      <Grid container spacing={4} sx={{ mb: 8 }}>
        <Grid size={6} sx={{ md: 4 }}>
          <Card sx={{ height: '100%', p: 3 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom color="primary">
                Our Mission
              </Typography>
              <Typography variant="body1">
                To foster workplace camaraderie and healthy competition through organized sports leagues 
                that bring colleagues together and create lasting memories.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={6}  sx={{ md: 4 }}>
          <Card sx={{ height: '100%', p: 3 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom color="primary">
                Our Vision
              </Typography>
              <Typography variant="body1">
                To be the go-to platform for corporate sports management, helping companies worldwide 
                build stronger teams through friendly competition.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={6} sx={{ md: 4 }}>
          <Card sx={{ height: '100%', p: 3 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom color="primary">
                Our Values
              </Typography>
              <Typography variant="body1">
                Fair play, innovation, community building, and making workplace interactions more 
                engaging and enjoyable for everyone.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Team Section */}
      <Box sx={{ mb: 8 }}>
        <Typography variant="h3" textAlign="center" gutterBottom>
          Meet Our Team
        </Typography>
        <Grid container spacing={4} justifyContent="center">
          {teamMembers.map((member) => (
            <Grid size={6} sx={{ md: 4 }} key={member.name}>
              <Card sx={{ textAlign: 'center', p: 3 }}>
                <Avatar 
                  sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
                  src={member.avatar}
                  alt={member.name}
                >
                  {member.name.split(' ').map(n => n[0]).join('')}
                </Avatar>
                <Typography variant="h6" gutterBottom>
                  {member.name}
                </Typography>
                <Typography variant="subtitle1" color="primary" gutterBottom>
                  {member.role}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {member.bio}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                  <LinkedIn sx={{ cursor: 'pointer', color: 'primary.main' }} />
                  <Email sx={{ cursor: 'pointer', color: 'primary.main' }} />
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Company Stats */}
      <Box textAlign="center" sx={{ py: 6, bgcolor: 'grey.50', borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom>
          GameLogix by the Numbers
        </Typography>
        <Grid container spacing={4}>
          <Grid size={6}>
            <Typography variant="h3" color="primary" gutterBottom>
              500+
            </Typography>
            <Typography variant="h6">
              Companies
            </Typography>
          </Grid>
          <Grid size={6}>
            <Typography variant="h3" color="primary" gutterBottom>
              10K+
            </Typography>
            <Typography variant="h6">
              Active Players
            </Typography>
          </Grid>
          <Grid size={6}>
            <Typography variant="h3" color="primary" gutterBottom>
              100K+
            </Typography>
            <Typography variant="h6">
              Matches Played
            </Typography>
          </Grid>
          <Grid size={6}>
            <Typography variant="h3" color="primary" gutterBottom>
              50+
            </Typography>
            <Typography variant="h6">
              Sports Supported
            </Typography>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default AboutPage;