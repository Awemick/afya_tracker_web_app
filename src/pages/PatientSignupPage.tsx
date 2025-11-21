import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Container,
  Alert,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setAuthUser } from '../store/slices/authSlice';
import { signupWithEmailAndPassword } from '../services/authService';

const PatientSignupPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    dueDate: null as Date | null,
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

  const handleDateChange = (date: Date | null) => {
    setFormData({ ...formData, dueDate: date });
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

    if (!formData.dueDate) {
      setError('Please select your due date');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const userData = {
        name: formData.name,
        email: formData.email,
        role: 'patient',
        phone: formData.phone,
        dueDate: formData.dueDate.toISOString(),
        pregnancyWeek: 0, // Will be calculated based on due date
      };

      const user = await signupWithEmailAndPassword(formData.email, formData.password, userData);
      dispatch(setAuthUser(user));
      setSuccess('Account created successfully! Welcome to Afya Tracker.');
      // Navigation will be handled by the auth state listener
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container component="main" maxWidth="sm">
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
                Start your pregnancy journey with us
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
              <TextField
                fullWidth
                label="Full Name"
                value={formData.name}
                onChange={handleInputChange('name')}
                margin="normal"
                required
                disabled={loading}
              />
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                margin="normal"
                required
                disabled={loading}
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={formData.password}
                onChange={handleInputChange('password')}
                margin="normal"
                required
                disabled={loading}
                helperText="Password must be at least 6 characters"
              />
              <TextField
                fullWidth
                label="Phone Number"
                value={formData.phone}
                onChange={handleInputChange('phone')}
                margin="normal"
                required
                disabled={loading}
              />

              <DatePicker
                label="Due Date"
                value={formData.dueDate}
                onChange={handleDateChange}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    margin: 'normal',
                    required: true,
                    disabled: loading,
                  },
                }}
              />

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
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            <Box textAlign="center" mt={3}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Button
                  variant="text"
                  onClick={() => navigate('/patient/login')}
                  sx={{ p: 0, minWidth: 'auto', textTransform: 'none' }}
                >
                  Sign In
                </Button>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Are you a healthcare provider?{' '}
                <Button
                  variant="text"
                  onClick={() => navigate('/provider/signup')}
                  sx={{ p: 0, minWidth: 'auto', textTransform: 'none' }}
                >
                  Provider Signup
                </Button>
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Container>
    </LocalizationProvider>
  );
};

export default PatientSignupPage;