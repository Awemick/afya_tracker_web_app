import React from 'react';
import { Box, Typography } from '@mui/material';
import TaskReminderSystem from '../../components/common/TaskReminderSystem';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';

const PatientTasksPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Tasks & Reminders
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Stay on top of your pregnancy care tasks and reminders
      </Typography>

      <TaskReminderSystem
        patientId={user?.id || '1'}
        userRole="patient"
        compact={false}
      />
    </Box>
  );
};

export default PatientTasksPage;