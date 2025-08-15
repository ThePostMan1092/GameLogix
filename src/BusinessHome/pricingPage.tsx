import React from 'react';
import { Box, Typography, Container, Grid, Card, CardContent, Button, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { Check, Star } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const PricingPage: React.FC = () => {
  const navigate = useNavigate();

  const plans = [
    {
      name: 'Starter',
      price: 'Free',
      period: 'Forever',
      description: 'Perfect for small teams getting started',
      features: [
        'Up to 10 players',
        'Basic match tracking',
        '1 league',
        'Standard sports support',
        'Basic analytics'
      ],
      buttonText: 'Get Started',
      buttonVariant: 'outlined' as const,
      popular: false
    },
    {
      name: 'Professional',
      price: '$9.99',
      period: 'per month',
      description: 'Ideal for growing teams and companies',
      features: [
        'Up to 100 players',
        'Advanced match tracking',
        'Unlimited leagues',
        'Custom sports configuration',
        'Advanced analytics',
        'Tournament mode',
        'Email support'
      ],
      buttonText: 'Start Free Trial',
      buttonVariant: 'contained' as const,
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'Contact us',
      description: 'For large organizations with special needs',
      features: [
        'Unlimited players',
        'All features included',
        'Custom integrations',
        'Dedicated support',
        'On-premise deployment',
        'Custom branding',
        'SLA guarantee'
      ],
      buttonText: 'Contact Sales',
      buttonVariant: 'outlined' as const,
      popular: false
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Box textAlign="center" sx={{ mb: 8 }}>
        <Typography variant="h2" gutterBottom>
          Simple, Transparent Pricing
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
          Choose the plan that fits your team size and needs. All plans include our core features.
        </Typography>
      </Box>

      <Grid container spacing={4} justifyContent="center">
        {plans.map((plan) => (
          <Grid size={6} key={plan.name}>
            <Card 
              sx={{ 
                height: '100%', 
                position: 'relative',
                border: plan.popular ? '2px solid' : '1px solid',
                borderColor: plan.popular ? 'primary.main' : 'divider',
                ...(plan.popular && {
                  transform: 'scale(1.05)',
                  boxShadow: 3
                })
              }}
            >
              {plan.popular && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: -12,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    bgcolor: 'primary.main',
                    color: 'white',
                    px: 3,
                    py: 1,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <Star sx={{ fontSize: 16 }} />
                  <Typography variant="caption" fontWeight="bold" mt={0.5}>
                    MOST POPULAR
                  </Typography>
                </Box>
              )}
              
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h4" gutterBottom>
                  {plan.name}
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h3" component="span" color="primary">
                    {plan.price}
                  </Typography>
                  {plan.period !== 'Contact us' && (
                    <Typography variant="body1" component="span" color="text.secondary">
                      /{plan.period}
                    </Typography>
                  )}
                </Box>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                  {plan.description}
                </Typography>

                <List sx={{ mb: 4 }}>
                  {plan.features.map((feature) => (
                    <ListItem key={feature} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <Check color="primary" />
                      </ListItemIcon>
                      <ListItemText primary={feature} />
                    </ListItem>
                  ))}
                </List>

                <Button
                  variant={plan.buttonVariant}
                  size="large"
                  fullWidth
                  onClick={() => {
                    if (plan.name === 'Enterprise') {
                      navigate('/contact');
                    } else {
                      navigate('/signup');
                    }
                  }}
                  sx={{ py: 1.5 }}
                >
                  {plan.buttonText}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* FAQ Section */}
      <Box sx={{ mt: 12, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Frequently Asked Questions
        </Typography>
        <Grid container spacing={4} sx={{ mt: 4 }}>
          <Grid size={6}>
            <Typography variant="h6" gutterBottom>
              Can I change my plan later?
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
            </Typography>
          </Grid>
          <Grid size={6}>
            <Typography variant="h6" gutterBottom>
              Is there a free trial?
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Yes, all paid plans include a 14-day free trial. No credit card required to start.
            </Typography>
          </Grid>
          <Grid size={6}>
            <Typography variant="h6" gutterBottom>
              What payment methods do you accept?
            </Typography>
            <Typography variant="body1" color="text.secondary">
              We accept all major credit cards, PayPal, and ACH transfers for Enterprise customers.
            </Typography>
          </Grid>
          <Grid size={6}>
            <Typography variant="h6" gutterBottom>
              Do you offer discounts for non-profits?
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Yes, we offer 50% discounts for qualified non-profit organizations. Contact us for details.
            </Typography>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default PricingPage;