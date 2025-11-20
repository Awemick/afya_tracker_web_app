import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Container,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setAuthUser, setLoading } from '../store/slices/authSlice';
import { sendSignInLinkToEmailAddress, onAuthStateChange, isSignInWithEmailLinkUrl, signInWithEmailLinkUrl } from '../services/authService';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoadingState] = useState(false);

  useEffect(() => {
    // Check if this is an email link sign-in
    if (isSignInWithEmailLinkUrl(window.location.href)) {
      // Get email from localStorage
      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
        // If email is not found, prompt user
        email = window.prompt('Please provide your email for confirmation');
      }

      if (email) {
        // Complete the sign-in
        completeSignIn(email);
      }
    }

    // Listen for authentication state changes
    const unsubscribe = onAuthStateChange((user) => {
      if (user) {
        dispatch(setAuthUser(user));
        // Redirect to auth redirect component to handle profile completion check
        navigate('/redirect');
      }
    });

    return () => unsubscribe();
  }, [dispatch, navigate]);

  const completeSignIn = async (email: string) => {
    setLoadingState(true);
    setError('');
    dispatch(setLoading(true));

    try {
      const user = await signInWithEmailLinkUrl(email, window.location.href);
      dispatch(setAuthUser(user));

      // Check if this was a signup completion
      const wasSignup = window.localStorage.getItem('pendingSignupData') !== null;

      // Navigate to auth redirect to handle profile completion check
      navigate('/redirect');
    } catch (err: any) {
      setError(err.message || 'Sign-in failed. Please try again.');
    } finally {
      setLoadingState(false);
      dispatch(setLoading(false));
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingState(true);
    setError('');
    setSuccess('');
    dispatch(setLoading(true));

    try {
      await sendSignInLinkToEmailAddress(email);
      setSuccess('Check your email for the sign-in link!');
      setEmail(''); // Clear the email field
    } catch (err: any) {
      setError(err.message || 'Failed to send sign-in link. Please try again.');
    } finally {
      setLoadingState(false);
      dispatch(setLoading(false));
    }
  };

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
          }}
        >
          <Box textAlign="center" mb={4}>
            <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
              Afya Tracker
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Healthcare Provider Portal
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

          <form onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              disabled={loading}
              helperText="We'll send you a secure sign-in link"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading || !email}
              sx={{ mt: 3, mb: 2, py: 1.5 }}
            >
              {loading ? 'Sending Link...' : 'Send Sign-In Link'}
            </Button>
          </form>

          <Box textAlign="center" mt={3}>
            <Typography variant="body2" color="text.secondary">
              Don't have an account? Contact system administrator
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default LoginPage;