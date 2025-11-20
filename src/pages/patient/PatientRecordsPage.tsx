import React from 'react';
import { Box, Typography, Paper, Card, CardContent } from '@mui/material';
import { MedicalServices } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';

const PatientRecordsPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  // Mock data - replace with API calls
  const prescriptions = [
    {
      id: '1',
      doctorId: 'doc1',
      medications: [
        { id: 'med1', name: 'Prenatal Vitamins', dosage: '1 tablet', frequency: 'Once daily', duration: 90, instructions: 'Take with food' },
        { id: 'med2', name: 'Iron Supplement', dosage: '65mg', frequency: 'Once daily', duration: 90, instructions: 'Take on empty stomach' },
      ],
      diagnosis: 'Routine prenatal care',
      status: 'active' as const,
      createdAt: '2024-01-10T10:00:00Z',
      validUntil: '2024-04-10T10:00:00Z',
    },
    {
      id: '2',
      doctorId: 'doc1',
      medications: [
        { id: 'med3', name: 'Paracetamol', dosage: '500mg', frequency: 'As needed', duration: 30, instructions: 'Take for pain relief, max 4 times daily' },
      ],
      diagnosis: 'Mild headache',
      status: 'active' as const,
      createdAt: '2024-01-05T14:30:00Z',
      validUntil: '2024-02-05T14:30:00Z',
    },
  ];

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Medical Records
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        View your prescriptions and medical records
      </Typography>

      {/* Prescriptions */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Active Prescriptions
        </Typography>
        {prescriptions.length > 0 ? (
          prescriptions.map((prescription) => (
            <Card key={prescription.id} sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6">{prescription.diagnosis}</Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Valid until: {new Date(prescription.validUntil).toLocaleDateString()}
                </Typography>
                {prescription.medications.map((med) => (
                  <Typography key={med.id} variant="body2">
                    • {med.name}: {med.dosage} - {med.frequency}
                  </Typography>
                ))}
              </CardContent>
            </Card>
          ))
        ) : (
          <Typography color="text.secondary">
            No active prescriptions
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default PatientRecordsPage;