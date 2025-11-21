import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Container,
  Button,
  Alert,
} from '@mui/material';
import { CheckCircleOutline, Schedule } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const PendingReviewPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper
          elevation={8}
          sx={{
            p: 6,
            width: '100%',
            borderRadius: 3,
            textAlign: 'center',
          }}
        >
          <Schedule
            sx={{
              fontSize: 80,
              color: 'warning.main',
              mb: 3,
            }}
          />

          <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
            Account Under Review
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Thank you for registering with Afya Tracker! Your healthcare provider account is currently under review by our administrators.
          </Typography>

          <Alert severity="info" sx={{ mb: 4, textAlign: 'left' }}>
            <Typography variant="body2">
              <strong>What happens next?</strong>
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              • Our team will verify your credentials and license information
            </Typography>
            <Typography variant="body2">
              • We'll contact you if we need any additional information
            </Typography>
            <Typography variant="body2">
              • You'll receive an email notification once your account is approved
            </Typography>
            <Typography variant="body2">
              • The review process typically takes 1-3 business days
            </Typography>
          </Alert>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            In the meantime, you can explore our patient portal or contact support if you have any questions.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/patient/login')}
              sx={{ minWidth: 120 }}
            >
              Patient Portal
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate('/')}
              sx={{ minWidth: 120 }}
            >
              Back to Home
            </Button>
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 3, display: 'block' }}>
            Need help? Contact us at support@afyatracker.com
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default PendingReviewPage;