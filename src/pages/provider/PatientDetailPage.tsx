import React from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Chip,
  Button,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Person,
  CalendarToday,
  Phone,
  Email,
  TrendingUp,
  Warning,
  MedicalServices,
} from '@mui/icons-material';
import { Patient, Prescription } from '../../types';
import PatientHealthTimeline from '../../components/common/PatientHealthTimeline';
import ProgressNotes from '../../components/common/ProgressNotes';
import DigitalRecordStorage from '../../components/common/DigitalRecordStorage';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';

const PatientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useSelector((state: RootState) => state.auth);

  // Mock patient data - replace with actual API call
  const patient: Patient = {
    id: '1',
    name: 'Mary Wanjiku',
    email: 'mary@example.com',
    phone: '+254712345678',
    pregnancyWeek: 28,
    dueDate: '2024-02-15',
    lastCheckup: '2024-01-10',
    riskLevel: 'low' as const,
    kickSessions: [
      {
        id: '1',
        patientId: '1',
        date: '2024-01-10',
        duration: 30,
        kickCount: 12,
        position: 'sitting' as const,
        intensity: 'medium' as const,
        notes: 'Regular movement observed',
      },
      {
        id: '2',
        patientId: '1',
        date: '2024-01-08',
        duration: 25,
        kickCount: 8,
        position: 'lying' as const,
        intensity: 'low' as const,
        notes: 'Less active than usual',
      },
    ],
  };

  // Mock prescription data
  const prescriptions: Prescription[] = [
    {
      id: '1',
      patientId: '1',
      doctorId: 'doc1',
      medications: [
        { id: 'med1', name: 'Prenatal Vitamins', genericName: 'Multivitamin', dosage: '1 tablet', frequency: 'Once daily', duration: 90, instructions: 'Take with food', refills: 3 },
        { id: 'med2', name: 'Iron Supplement', genericName: 'Ferrous Sulfate', dosage: '65mg', frequency: 'Once daily', duration: 90, instructions: 'Take on empty stomach', refills: 3 },
      ],
      diagnosis: 'Routine prenatal care',
      instructions: 'Take medications as prescribed. Follow up in 4 weeks.',
      status: 'active',
      createdAt: '2024-01-10T10:00:00Z',
      updatedAt: '2024-01-10T10:00:00Z',
      validUntil: '2024-04-10T10:00:00Z',
    },
    {
      id: '2',
      patientId: '1',
      doctorId: 'doc1',
      medications: [
        { id: 'med3', name: 'Paracetamol', genericName: 'Acetaminophen', dosage: '500mg', frequency: 'As needed', duration: 30, instructions: 'Take for pain relief, max 4 times daily', refills: 1 },
      ],
      diagnosis: 'Mild headache',
      instructions: 'Take as needed for headache. Contact if symptoms worsen.',
      status: 'completed',
      createdAt: '2024-01-05T14:30:00Z',
      updatedAt: '2024-01-05T14:30:00Z',
      validUntil: '2024-02-05T14:30:00Z',
    },
  ];

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={4}>
        <Avatar
          sx={{
            width: 64,
            height: 64,
            backgroundColor: 'primary.main',
            mr: 3,
          }}
        >
          <Person sx={{ fontSize: 32 }} />
        </Avatar>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            {patient.name}
          </Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <Chip
              label={`Week ${patient.pregnancyWeek}`}
              color="primary"
              variant="outlined"
            />
            <Chip
              label={patient.riskLevel.toUpperCase()}
              color={getRiskColor(patient.riskLevel)}
            />
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3 }}>
        {/* Patient Info */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Contact Information
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Email sx={{ mr: 2, color: 'text.secondary' }} />
            <Typography variant="body2">{patient.email}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Phone sx={{ mr: 2, color: 'text.secondary' }} />
            <Typography variant="body2">{patient.phone}</Typography>
          </Box>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <CalendarToday sx={{ mr: 2, color: 'text.secondary' }} />
            <Typography variant="body2">
              Due: {new Date(patient.dueDate).toLocaleDateString()}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CalendarToday sx={{ mr: 2, color: 'text.secondary' }} />
            <Typography variant="body2">
              Last Checkup: {new Date(patient.lastCheckup).toLocaleDateString()}
            </Typography>
          </Box>
        </Paper>

        {/* Kick Sessions */}
        <Paper sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6" fontWeight="bold">
              Recent Kick Sessions
            </Typography>
            <Button variant="contained" startIcon={<TrendingUp />}>
              Record New Session
            </Button>
          </Box>

          {patient.kickSessions.length === 0 ? (
            <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
              No kick sessions recorded yet.
            </Typography>
          ) : (
            patient.kickSessions.map((session) => (
              <Card key={session.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {new Date(session.date).toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" mb={1}>
                        Duration: {session.duration} minutes | Position: {session.position}
                      </Typography>
                      <Box display="flex" gap={1} mb={1}>
                        <Chip
                          label={`${session.kickCount} kicks`}
                          size="small"
                          color="primary"
                        />
                        <Chip
                          label={session.intensity}
                          size="small"
                          color="secondary"
                        />
                      </Box>
                      {session.notes && (
                        <Typography variant="body2">
                          {session.notes}
                        </Typography>
                      )}
                    </Box>
                    {session.intensity === 'low' && (
                      <Warning sx={{ color: 'warning.main' }} />
                    )}
                  </Box>
                </CardContent>
              </Card>
            ))
          )}
        </Paper>

        {/* Prescriptions */}
        <Paper sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6" fontWeight="bold">
              Prescription History
            </Typography>
            <Button variant="contained" startIcon={<MedicalServices />}>
              Write New Prescription
            </Button>
          </Box>

          {prescriptions.length === 0 ? (
            <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
              No prescriptions recorded yet.
            </Typography>
          ) : (
            prescriptions.map((prescription) => (
              <Card key={prescription.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box flex={1}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {prescription.diagnosis}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" mb={1}>
                        {new Date(prescription.createdAt).toLocaleDateString()} •
                        Status: <Chip
                          label={prescription.status}
                          size="small"
                          color={prescription.status === 'active' ? 'success' : 'default'}
                        />
                      </Typography>
                      <Typography variant="body2" color="text.secondary" mb={2}>
                        Valid until: {new Date(prescription.validUntil).toLocaleDateString()}
                      </Typography>

                      <Typography variant="body2" fontWeight="bold" mb={1}>
                        Medications:
                      </Typography>
                      {prescription.medications.map((medication, index) => (
                        <Box key={medication.id} sx={{ mb: 1, pl: 2 }}>
                          <Typography variant="body2">
                            <strong>{medication.name}</strong> ({medication.genericName})
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {medication.dosage} • {medication.frequency} • {medication.duration} days • {medication.refills} refills
                          </Typography>
                          {medication.instructions && (
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                              {medication.instructions}
                            </Typography>
                          )}
                        </Box>
                      ))}

                      {prescription.instructions && (
                        <Box mt={2}>
                          <Typography variant="body2" fontWeight="bold">
                            Instructions:
                          </Typography>
                          <Typography variant="body2">
                            {prescription.instructions}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))
          )}
        </Paper>
      </Box>

      {/* Medical Records */}
      <Box sx={{ mt: 4 }}>
        <DigitalRecordStorage
          patientId={id || '1'}
          institutionId="institution1" // This should come from user context
          userRole="provider"
          userId={user?.id || 'provider1'}
        />
      </Box>

      {/* Progress Notes & Recommendations */}
      <Box sx={{ mt: 4 }}>
        <ProgressNotes
          patientId={id || '1'}
          userRole="provider"
          userId={user?.id || 'provider1'}
        />
      </Box>

      {/* Health Timeline */}
      <Box sx={{ mt: 4 }}>
        <PatientHealthTimeline patientId={id || '1'} patientData={patient} />
      </Box>
    </Box>
  );
};

export default PatientDetailPage;