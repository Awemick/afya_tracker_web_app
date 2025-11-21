import React from 'react';
import { Box, Typography } from '@mui/material';
import PatientHealthTimeline from '../../components/common/PatientHealthTimeline';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';

const PatientTimelinePage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  // Mock data - replace with API calls
  const patientData = {
    id: '1',
    name: 'Mary Wanjiku',
    email: 'mary@example.com',
    phone: '+254712345678',
    pregnancyWeek: 28,
    dueDate: '2024-03-15',
    lastCheckup: '2024-01-10',
    riskLevel: 'low' as const,
    kickSessions: [
      {
        id: '1',
        patientId: '1',
        date: '2024-01-14',
        duration: 12,
        kickCount: 8,
        position: 'sitting' as const,
        intensity: 'medium' as const,
        notes: '',
      },
      {
        id: '2',
        patientId: '1',
        date: '2024-01-13',
        duration: 15,
        kickCount: 10,
        position: 'lying' as const,
        intensity: 'low' as const,
        notes: '',
      },
      {
        id: '3',
        patientId: '1',
        date: '2024-01-12',
        duration: 10,
        kickCount: 7,
        position: 'standing' as const,
        intensity: 'high' as const,
        notes: '',
      },
    ],
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Health Timeline
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Track your pregnancy progress and health milestones
      </Typography>

      <PatientHealthTimeline
        patientId={user?.id || '1'}
        patientData={patientData}
      />
    </Box>
  );
};

export default PatientTimelinePage;