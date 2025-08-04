import React, { useState } from 'react';
import { Box, Typography, Container, Grid, Card, CardContent, TextField, Button, Alert } from '@mui/material';
import { Email, Phone, LocationOn, Schedule } from '@mui/icons-material';

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the form data to your backend
    console.log('Form submitted:', formData);
    setSubmitted(true);
    // Reset form after 3 seconds
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', company: '', subject: '', message: '' });
    }, 3000);
  };

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Box textAlign="center" sx={{ mb: 8 }}>
        <Typography variant="h2" gutterBottom>
          Get in Touch
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
          Have questions about GameLogix? Need help getting started? We'd love to hear from you.
        </Typography>
      </Box>

      <Grid container spacing={6}>
        {/* Contact Form */}
        <Grid size={6} sx={{ md: 8 }}>
          <Card sx={{ p: 4 }}>
            <Typography variant="h4" gutterBottom>
              Send us a Message
            </Typography>
            
            {submitted && (
              <Alert severity="success" sx={{ mb: 3 }}>
                Thank you for your message! We'll get back to you within 24 hours.
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Your Name"
                    value={formData.name}
                    onChange={handleChange('name')}
                    required
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    type="email"
                    value={formData.email}
                    onChange={handleChange('email')}
                    required
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Company Name"
                    value={formData.company}
                    onChange={handleChange('company')}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Subject"
                    value={formData.subject}
                    onChange={handleChange('subject')}
                    required
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Message"
                    multiline
                    rows={6}
                    value={formData.message}
                    onChange={handleChange('message')}
                    required
                  />
                </Grid>
                <Grid size={6}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    sx={{ px: 4, py: 1.5 }}
                  >
                    Send Message
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Card>
        </Grid>

        {/* Contact Information */}
        <Grid size={6} sx={{ md: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Card sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Email color="primary" sx={{ mr: 2 }} />
                <Typography variant="h6">Email</Typography>
              </Box>
              <Typography variant="body1">support@gamelogix.com</Typography>
              <Typography variant="body1">sales@gamelogix.com</Typography>
            </Card>

            <Card sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Phone color="primary" sx={{ mr: 2 }} />
                <Typography variant="h6">Phone</Typography>
              </Box>
              <Typography variant="body1">+1 (555) 123-4567</Typography>
              <Typography variant="body2" color="text.secondary">
                Monday - Friday, 9 AM - 6 PM EST
              </Typography>
            </Card>

            <Card sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LocationOn color="primary" sx={{ mr: 2 }} />
                <Typography variant="h6">Office</Typography>
              </Box>
              <Typography variant="body1">
                123 Innovation Drive<br />
                Tech City, TC 12345<br />
                United States
              </Typography>
            </Card>

            <Card sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Schedule color="primary" sx={{ mr: 2 }} />
                <Typography variant="h6">Business Hours</Typography>
              </Box>
              <Typography variant="body1">
                Monday - Friday: 9:00 AM - 6:00 PM<br />
                Saturday: 10:00 AM - 2:00 PM<br />
                Sunday: Closed
              </Typography>
            </Card>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ContactPage;