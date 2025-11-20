import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Container,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setAuthUser } from '../store/slices/authSlice';
import { sendSignInLinkToEmailAddress } from '../services/authService';

const ProviderSignupPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    specialty: '',
    licenseNumber: '',
    institution: '',
    phone: '',
    agreeToTerms: false,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData({ ...formData, [field]: event.target.value });
  };

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, agreeToTerms: event.target.checked });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (!formData.agreeToTerms) {
      setError('You must agree to the terms and conditions');
      setLoading(false);
      return;
    }

    try {
      // Store signup data in localStorage for later use
      const signupData = {
        name: formData.name,
        email: formData.email,
        role: 'provider',
        phone: formData.phone,
        specialty: formData.specialty,
        licenseNumber: formData.licenseNumber,
        institution: formData.institution,
      };
      window.localStorage.setItem('pendingSignupData', JSON.stringify(signupData));

      await sendSignInLinkToEmailAddress(formData.email);
      setSuccess('Check your email for the verification link! Your account will be reviewed by administrators before approval.');
    } catch (err: any) {
      setError(err.message || 'Failed to send verification link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="md">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Paper
          elevation={8}
          sx={{
            p: 6,
            width: '100%',
            borderRadius: 3,
          }}
        >
          <Box textAlign="center" mb={4}>
            <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
              Join Afya Tracker
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Healthcare Provider Registration
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Your account will be reviewed by our administrators before approval
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}

          <form onSubmit={handleSignup}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
              <TextField
                fullWidth
                label="Full Name"
                value={formData.name}
                onChange={handleInputChange('name')}
                required
                disabled={loading}
              />
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                required
                disabled={loading}
                helperText="We'll send you a verification link"
              />
              <TextField
                fullWidth
                label="Phone Number"
                value={formData.phone}
                onChange={handleInputChange('phone')}
                required
                disabled={loading}
              />
              <TextField
                fullWidth
                label="Medical Specialty"
                value={formData.specialty}
                onChange={handleInputChange('specialty')}
                required
                disabled={loading}
              />
              <TextField
                fullWidth
                label="License Number"
                value={formData.licenseNumber}
                onChange={handleInputChange('licenseNumber')}
                required
                disabled={loading}
              />
              <TextField
                fullWidth
                label="Institution/Hospital"
                value={formData.institution}
                onChange={handleInputChange('institution')}
                required
                disabled={loading}
              />
            </Box>

            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.agreeToTerms}
                  onChange={handleCheckboxChange}
                  color="primary"
                  disabled={loading}
                />
              }
              label="I agree to the Terms and Conditions and Privacy Policy"
              sx={{ mt: 2, mb: 2 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading || !formData.agreeToTerms}
              sx={{ mt: 3, mb: 2, py: 1.5 }}
            >
              {loading ? 'Sending Link...' : 'Send Verification Link'}
            </Button>
          </form>

          <Box textAlign="center" mt={3}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?{' '}
              <Button
                variant="text"
                onClick={() => navigate('/login')}
                sx={{ p: 0, minWidth: 'auto', textTransform: 'none' }}
              >
                Sign In
              </Button>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ProviderSignupPage;