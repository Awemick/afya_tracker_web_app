import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
} from '@mui/material';
import {
  People,
  Warning,
  TrendingUp,
  CalendarToday,
  Notifications,
  Message,
  MedicalServices,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import PrescriptionWriter from '../../components/common/PrescriptionWriter';
import PatientLinkingPortal from '../../components/common/PatientLinkingPortal';
import DigitalRecordStorage from '../../components/common/DigitalRecordStorage';
import ReferralSystem from '../../components/common/ReferralSystem';
import TaskReminderSystem from '../../components/common/TaskReminderSystem';
import { Prescription, Appointment } from '../../types';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { appointmentAPI } from '../../services/api';

const ProviderDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [prescriptionDialogOpen, setPrescriptionDialogOpen] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);

  // Mock data - replace with actual API calls where possible
  const dashboardData = {
    totalPatients: 42,
    activeConsultations: appointments.filter(a => a.status === 'confirmed').length,
    highRiskPatients: 3,
    todayAppointments: appointments.filter(a =>
      new Date(a.scheduledTime).toDateString() === new Date().toDateString()
    ).length,
    unreadMessages: 7,
    activePrescriptions: 12,
    recentAlerts: [
      { id: 1, patient: 'Mary Wanjiku', type: 'reduced_movement', time: '2 hours ago' },
      { id: 2, patient: 'Sarah Omondi', type: 'pain', time: '4 hours ago' },
    ],
    kickTrends: [
      { day: 'Mon', kicks: 45 },
      { day: 'Tue', kicks: 52 },
      { day: 'Wed', kicks: 38 },
      { day: 'Thu', kicks: 48 },
      { day: 'Fri', kicks: 55 },
      { day: 'Sat', kicks: 42 },
      { day: 'Sun', kicks: 47 },
    ],
  };

  useEffect(() => {
    if (user?.id) {
      loadAppointments();
    }
  }, [user]);

  const loadAppointments = async () => {
    if (!user?.id) return;
    setAppointmentsLoading(true);
    try {
      const response = await appointmentAPI.getAppointments(user.id, 'provider');
      setAppointments(response.data);
    } catch (error) {
      console.error('Failed to load appointments:', error);
    } finally {
      setAppointmentsLoading(false);
    }
  };

  const handlePrescriptionSave = (prescription: Prescription) => {
    setPrescriptionDialogOpen(false);
    // Could show a success message or update dashboard stats
    console.log('Prescription saved:', prescription);
  };

  const StatCard = ({ title, value, icon, color, onClick }: any) => (
    <Card
      sx={{
        cursor: 'pointer',
        transition: 'transform 0.2s',
        '&:hover': { transform: 'translateY(-4px)' }
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4" fontWeight="bold" color={color}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
          <Box
            sx={{
              backgroundColor: `${color}20`,
              borderRadius: '50%',
              p: 1,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Welcome, Dr. Wanjiku
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Here's your maternal health overview
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="contained"
            startIcon={<MedicalServices />}
            onClick={() => setPrescriptionDialogOpen(true)}
            sx={{ backgroundColor: 'success.main', '&:hover': { backgroundColor: 'success.dark' } }}
          >
            Write Prescription
          </Button>
          <IconButton
            sx={{
              backgroundColor: 'secondary.main',
              '&:hover': { backgroundColor: 'secondary.dark' }
            }}
            onClick={() => navigate('/provider/alerts')}
          >
            <Notifications sx={{ color: 'white' }} />
          </IconButton>
        </Box>
      </Box>

      {/* Stats Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3, mb: 4 }}>
        <StatCard
          title="Total Patients"
          value={dashboardData.totalPatients}
          icon={<People sx={{ color: 'primary.main' }} />}
          color="primary.main"
          onClick={() => navigate('/provider/patients')}
        />
        <StatCard
          title="Active Consultations"
          value={dashboardData.activeConsultations}
          icon={<CalendarToday sx={{ color: 'info.main' }} />}
          color="info.main"
        />
        <StatCard
          title="High Risk Cases"
          value={dashboardData.highRiskPatients}
          icon={<Warning sx={{ color: 'error.main' }} />}
          color="error.main"
        />
        <StatCard
          title="Unread Messages"
          value={dashboardData.unreadMessages}
          icon={<Message sx={{ color: 'secondary.main' }} />}
          color="secondary.main"
          onClick={() => navigate('/provider/messages')}
        />
        <StatCard
          title="Active Prescriptions"
          value={dashboardData.activePrescriptions}
          icon={<MedicalServices sx={{ color: 'success.main' }} />}
          color="success.main"
          onClick={() => setPrescriptionDialogOpen(true)}
        />
      </Box>

      {/* Patient Linking Portal */}
      <Box sx={{ mb: 4 }}>
        <PatientLinkingPortal
          userId={user?.id || '1'}
          userRole="provider"
          institutionId="inst1" // Mock institution ID - replace with actual user institution
        />
      </Box>

      {/* Medical Records Management */}
      <Box sx={{ mb: 4 }}>
        <DigitalRecordStorage
          patientId="" // Empty for institution-wide view
          institutionId="inst1"
          userRole="provider"
          userId={user?.id || 'provider1'}
        />
      </Box>

      {/* Referral System */}
      <Box sx={{ mb: 4 }}>
        <ReferralSystem
          userId={user?.id || 'provider1'}
          userRole="provider"
        />
      </Box>

      {/* Task & Reminder System */}
      <Box sx={{ mb: 4 }}>
        <TaskReminderSystem
          userId={user?.id || 'provider1'}
          userRole="provider"
        />
      </Box>

      {/* Upcoming Appointments */}
      <Box sx={{ mb: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Upcoming Appointments
          </Typography>
          {appointmentsLoading ? (
            <Typography>Loading appointments...</Typography>
          ) : appointments.length === 0 ? (
            <Typography color="text.secondary">No upcoming appointments</Typography>
          ) : (
            <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
              {appointments
                .filter(appointment => new Date(appointment.scheduledTime) > new Date())
                .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime())
                .slice(0, 10)
                .map((appointment) => (
                  <Box
                    key={appointment.id}
                    sx={{
                      p: 2,
                      mb: 1,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'grey.200',
                      '&:hover': {
                        backgroundColor: 'grey.50',
                        cursor: 'pointer',
                      },
                    }}
                    onClick={() => navigate(`/provider/patients/${appointment.patientId}`)}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          Patient {appointment.patientId}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {appointment.type} - {appointment.reason}
                        </Typography>
                      </Box>
                      <Box textAlign="right">
                        <Typography variant="body2">
                          {new Date(appointment.scheduledTime).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(appointment.scheduledTime).toLocaleTimeString()}
                        </Typography>
                        <Chip
                          label={appointment.status}
                          size="small"
                          color={
                            appointment.status === 'confirmed' ? 'success' :
                            appointment.status === 'pending' ? 'warning' : 'default'
                          }
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                  </Box>
                ))}
            </Box>
          )}
        </Paper>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 3 }}>
        {/* Recent Alerts */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Recent Emergency Alerts
          </Typography>
          {dashboardData.recentAlerts.map((alert) => (
            <Box
              key={alert.id}
              sx={{
                p: 2,
                mb: 1,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'grey.200',
                '&:hover': {
                  backgroundColor: 'grey.50',
                  cursor: 'pointer',
                },
              }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {alert.patient}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {alert.type.replace('_', ' ')}
                  </Typography>
                </Box>
                <Box textAlign="right">
                  <Chip
                    label={alert.time}
                    size="small"
                    color="warning"
                    variant="outlined"
                  />
                </Box>
              </Box>
            </Box>
          ))}
        </Paper>

        {/* Kick Trends */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Weekly Kick Trends
          </Typography>
          <Box sx={{ height: 200, mt: 2 }}>
            {/* Simple bar chart - replace with Recharts later */}
            <Box display="flex" alignItems="end" justifyContent="space-around" height="100%">
              {dashboardData.kickTrends.map((day, index) => (
                <Box key={day.day} textAlign="center">
                  <Box
                    sx={{
                      height: `${(day.kicks / 60) * 100}%`,
                      backgroundColor: 'primary.main',
                      borderRadius: 1,
                      width: 20,
                      mb: 1,
                    }}
                  />
                  <Typography variant="caption" display="block">
                    {day.day}
                  </Typography>
                  <Typography variant="caption" fontWeight="bold">
                    {day.kicks}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Prescription Writer Dialog */}
      <Dialog
        open={prescriptionDialogOpen}
        onClose={() => setPrescriptionDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        fullScreen
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Write Prescription</Typography>
            <Button onClick={() => setPrescriptionDialogOpen(false)}>Close</Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          <PrescriptionWriter
            onSave={handlePrescriptionSave}
            onCancel={() => setPrescriptionDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ProviderDashboard;