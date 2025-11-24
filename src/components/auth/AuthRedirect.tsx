import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { Box, CircularProgress, Typography } from '@mui/material';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { auth } from '../../firebase';
import { updateUserData } from '../../store/slices/authSlice';

const AuthRedirect: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
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
          // Use role from Redux as fallback
          const role = user.role || 'patient';
          navigate(role === 'provider' ? '/provider/dashboard' : '/patient/dashboard');
          return;
        }

        const docRef = doc(db, 'users', user.id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const userData = docSnap.data();

          // Update Redux store with latest user data from Firestore
          dispatch(updateUserData({
            role: userData.role,
            status: userData.status,
            // Add other fields that might have changed
          }));

          if (userData?.profileCompleted) {
            // Profile completed, redirect based on role
            const role = userData.role || user.role || 'patient';
            if (role === 'provider' || role === 'institution' || role === 'admin') {
              navigate(`/${role}/dashboard`);
            } else {
              navigate('/patient/dashboard');
            }
          } else {
            // Profile not completed - only patients need profile setup
            const role = userData.role || user.role || 'patient';
            if (role === 'patient') {
              navigate('/profile-setup');
            } else {
              // Providers/institutions/admins go to their dashboard even without completed profile
              navigate(`/${role}/dashboard`);
            }
          }
        } else {
          // No profile data - only patients need profile setup
          const role = user.role || 'patient';
          if (role === 'patient') {
            navigate('/profile-setup');
          } else {
            // Providers/institutions/admins go to their dashboard
            navigate(`/${role}/dashboard`);
          }
        }
      } catch (error) {
        console.error('Error checking profile:', error);
        // On error (like offline), use role from Redux to determine dashboard
        const role = user.role || 'patient';
        if (role === 'provider' || role === 'institution' || role === 'admin') {
          navigate(`/${role}/dashboard`);
        } else {
          navigate('/patient/dashboard');
        }
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