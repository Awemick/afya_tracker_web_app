import React from 'react';
import { Box, Typography } from '@mui/material';
import ProgressNotes from '../../components/common/ProgressNotes';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';

const PatientCareTeamPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Care Team
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        View progress notes and communicate with your healthcare team
      </Typography>

      <ProgressNotes
        patientId={user?.id || '1'}
        userRole="patient"
        userId={user?.id || '1'}
      />
    </Box>
  );
};

export default PatientCareTeamPage;