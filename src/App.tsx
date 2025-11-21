import React from 'react';
import './firebase'; // Initialize Firebase
import { Provider, useSelector } from 'react-redux';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { store } from './store/store';
import { RootState } from './store/store';
import { ThemeMode } from './store/slices/themeSlice';

// Components
import NavigationWrapper from './components/layout/NavigationWrapper';
import PatientNavigation from './components/layout/PatientNavigation';
import AuthRedirect from './components/auth/AuthRedirect';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import PatientLogin from './pages/patient/PatientLogin';
import PatientSignupPage from './pages/PatientSignupPage';
import ProviderSignupPage from './pages/ProviderSignupPage';
import PendingReviewPage from './pages/provider/PendingReviewPage';
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
      <ThemeWrapper>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/patient/login" element={<PatientLogin />} />
            <Route path="/patient/signup" element={<PatientSignupPage />} />
            <Route path="/profile-setup" element={<ProfileSetupPage />} />
            <Route path="/provider/signup" element={<ProviderSignupPage />} />
            <Route path="/provider/pending-review" element={<PendingReviewPage />} />
            <Route path="/patient/*" element={
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
            } />
            <Route path="/provider/*" element={
              <NavigationWrapper>
                <Routes>
                  <Route path="dashboard" element={<ProviderDashboard />} />
                  <Route path="patients" element={<PatientListPage />} />
                  <Route path="patients/:id" element={<PatientDetailPage />} />
                  <Route path="alerts" element={<EmergencyAlertsPage />} />
                  <Route path="messages" element={<MessagingPage />} />
                </Routes>
              </NavigationWrapper>
            } />
            <Route path="/admin/*" element={
              <NavigationWrapper>
                <Routes>
                  <Route path="dashboard" element={<InstitutionDashboard />} />
                </Routes>
              </NavigationWrapper>
            } />
            <Route path="/redirect" element={<AuthRedirect />} />
            <Route path="/" element={<LandingPage />} />
          </Routes>
        </Router>
      </ThemeWrapper>
    </Provider>
  );
}

export default App;
