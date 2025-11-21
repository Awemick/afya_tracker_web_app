import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { Box, CircularProgress, Typography } from '@mui/material';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { auth } from '../../firebase';

const AuthRedirect: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      // Wait for auth loading to complete
      if (loading) return;

      if (!user) {
        // User not signed in, go to login
        navigate('/login');
        return;
      }

      // User is signed in, check if profile is completed
      try {
        if (!db) {
          console.error('Firestore not initialized');
          navigate('/profile-setup');
          return;
        }

        const docRef = doc(db, 'users', user.id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const userData = docSnap.data();
          if (userData?.profileCompleted) {
            // Profile completed, redirect based on role
            const role = userData.role || 'patient';
            if (role === 'provider') {
              navigate('/provider/dashboard');
            } else {
              navigate('/patient/dashboard');
            }
          } else {
            // Profile not completed, go to profile setup
            navigate('/profile-setup');
          }
        } else {
          // No profile data, go to profile setup
          navigate('/profile-setup');
        }
      } catch (error) {
        console.error('Error checking profile:', error);
        // On error, go to profile setup to be safe
        navigate('/profile-setup');
      }
    };

    checkAuthAndRedirect();
  }, [user, loading, navigate]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      sx={{
        background: 'linear-gradient(135deg, #F8F9FA 0%, #E9ECEF 100%)',
      }}
    >
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #FFB6C1 0%, #FF69B4 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h4" color="white">👶</Typography>
      </Box>
      <Typography variant="h5" gutterBottom fontWeight="bold">
        Afya Tracker
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Your Pregnancy Companion
      </Typography>
      <CircularProgress />
    </Box>
  );
};

export default AuthRedirect;