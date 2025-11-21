import React from 'react';
import { Box, Typography } from '@mui/material';
import PatientLinkingPortal from '../../components/common/PatientLinkingPortal';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';

const PatientConnectionsPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Care Connections
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Connect with family members and healthcare providers
      </Typography>

      <PatientLinkingPortal
        userId={user?.id || '1'}
        userRole="patient"
      />
    </Box>
  );
};

export default PatientConnectionsPage;