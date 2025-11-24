import React, { useEffect } from 'react';
import './firebase'; // Initialize Firebase
import { Provider, useSelector, useDispatch } from 'react-redux';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { store } from './store/store';
import { RootState } from './store/store';
import { ThemeMode } from './store/slices/themeSlice';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { setAuthUser, setLoading, clearUser } from './store/slices/authSlice';
import { refreshUserData } from './services/authService';

// Components
import NavigationWrapper from './components/layout/NavigationWrapper';
import PatientNavigation from './components/layout/PatientNavigation';
import AuthRedirect from './components/auth/AuthRedirect';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import PatientLogin from './pages/patient/PatientLogin';
import PatientSignupPage from './pages/PatientSignupPage';
import ProviderSignupPage from './pages/ProviderSignupPage';
import PendingReviewPage from './pages/provider/PendingReviewPage';
import AdminLoginPage from './pages/AdminLoginPage';
import PatientDashboard from './pages/patient/PatientDashboard';
import PatientAppointmentsPage from './pages/patient/PatientAppointmentsPage';
import PatientTimelinePage from './pages/patient/PatientTimelinePage';
import PatientTasksPage from './pages/patient/PatientTasksPage';
import PatientConnectionsPage from './pages/patient/PatientConnectionsPage';
import PatientRecordsPage from './pages/patient/PatientRecordsPage';
import PatientCareTeamPage from './pages/patient/PatientCareTeamPage';
import ProfileSetupPage from './pages/ProfileSetupPage';
import ProviderDashboard from './pages/provider/ProviderDashboard';
import PatientListPage from './pages/provider/PatientListPage';
import PatientDetailPage from './pages/provider/PatientDetailPage';
import EmergencyAlertsPage from './pages/provider/EmergencyAlertsPage';
import MessagingPage from './pages/provider/MessagingPage';
import InstitutionDashboard from './pages/admin/InstitutionDashboard';

// Create theme function
const createAppTheme = (mode: ThemeMode) => createTheme({
  palette: {
    mode,
    primary: {
      main: '#0A8D92', // Your seed color
      light: '#4FB3B7',
      dark: '#066368',
    },
    secondary: {
      main: '#FFB6C1', // Soft pink
      light: '#FFE4E9',
      dark: '#FF91A4',
    },
    background: {
      default: mode === 'dark' ? '#121212' : '#F8F9FA',
      paper: mode === 'dark' ? '#1e1e1e' : '#FFFFFF',
    },
  },
  typography: {
    fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
});

// Authentication provider component
const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Only set up listener if auth is available
    if (!auth) {
      dispatch(setLoading(false));
      return;
    }

    // Set up Firebase auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // User is signed in, get their data from Firestore
          const authUser = await refreshUserData(firebaseUser);
          dispatch(setAuthUser(authUser));
        } catch (error) {
          console.error('Error loading user data:', error);
          // Still set basic user data even if Firestore fails
          const basicUser = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email || '',
            email: firebaseUser.email || '',
            role: 'patient' as const,
            status: 'active' as const,
            firebaseUser
          };
          dispatch(setAuthUser(basicUser));
        }
      } else {
        // User is signed out - clear user data
        dispatch(clearUser());
      }
      dispatch(setLoading(false));
    });

    return () => unsubscribe();
  }, [dispatch]);

  return <>{children}</>;
};

// Theme wrapper component
const ThemeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const themeMode = useSelector((state: RootState) => state.theme.mode);
  const theme = createAppTheme(themeMode);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <ThemeWrapper>
          <Router>
            <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/patient/login" element={<PatientLogin />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/patient/signup" element={<PatientSignupPage />} />
            <Route path="/provider/signup" element={<ProviderSignupPage />} />
            <Route path="/redirect" element={<AuthRedirect />} />

            {/* Dashboard redirect route */}
            <Route path="/dashboard" element={<AuthRedirect />} />

            {/* Patient routes */}
            <Route path="/patient/*" element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientNavigation>
                  <Routes>
                    <Route path="dashboard" element={<PatientDashboard />} />
                    <Route path="appointments" element={<PatientAppointmentsPage />} />
                    <Route path="timeline" element={<PatientTimelinePage />} />
                    <Route path="tasks" element={<PatientTasksPage />} />
                    <Route path="connections" element={<PatientConnectionsPage />} />
                    <Route path="records" element={<PatientRecordsPage />} />
                    <Route path="care-team" element={<PatientCareTeamPage />} />
                  </Routes>
                </PatientNavigation>
              </ProtectedRoute>
            } />

            {/* Patient profile setup (only for patients) */}
            <Route path="/profile-setup" element={
              <ProtectedRoute allowedRoles={['patient']}>
                <ProfileSetupPage />
              </ProtectedRoute>
            } />

            {/* Provider/Institution routes (shared portal) */}
            <Route path="/provider/*" element={
              <ProtectedRoute allowedRoles={['provider', 'institution']} requireVerification>
                <NavigationWrapper>
                  <Routes>
                    <Route path="dashboard" element={<ProviderDashboard />} />
                    <Route path="patients" element={<PatientListPage />} />
                    <Route path="patients/:id" element={<PatientDetailPage />} />
                    <Route path="alerts" element={<EmergencyAlertsPage />} />
                    <Route path="messages" element={<MessagingPage />} />
                    <Route path="pending-review" element={<PendingReviewPage />} />
                  </Routes>
                </NavigationWrapper>
              </ProtectedRoute>
            } />

            {/* Institution-specific routes */}
            <Route path="/institution/*" element={
              <ProtectedRoute allowedRoles={['institution']} requireVerification>
                <NavigationWrapper>
                  <Routes>
                    <Route path="dashboard" element={<InstitutionDashboard />} />
                    <Route path="staff" element={<InstitutionDashboard />} /> {/* Placeholder */}
                    <Route path="analytics" element={<InstitutionDashboard />} /> {/* Placeholder */}
                  </Routes>
                </NavigationWrapper>
              </ProtectedRoute>
            } />

            {/* Admin routes */}
            <Route path="/admin/*" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <NavigationWrapper>
                  <Routes>
                    <Route path="dashboard" element={<InstitutionDashboard />} />
                  </Routes>
                </NavigationWrapper>
              </ProtectedRoute>
            } />

            {/* Verification pending page */}
            <Route path="/verification-pending" element={<PendingReviewPage />} />
          </Routes>
        </Router>
      </ThemeWrapper>
      </AuthProvider>
    </Provider>
  );
}

export default App;
