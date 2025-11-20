import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Chip,
  Fab,
} from '@mui/material';
import { Add, CalendarToday } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { Appointment } from '../../types';
import { appointmentAPI } from '../../services/api';
import AppointmentBooking from '../../components/appointments/AppointmentBooking';

const PatientAppointmentsPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadAppointments();
    }
  }, [user]);

  const loadAppointments = async () => {
    if (!user?.id) return;
    setAppointmentsLoading(true);
    try {
      const response = await appointmentAPI.getAppointments(user.id, 'patient');
      setAppointments(response.data);
    } catch (error) {
      console.error('Failed to load appointments:', error);
    } finally {
      setAppointmentsLoading(false);
    }
  };

  const handleAppointmentBooked = () => {
    setBookingDialogOpen(false);
    loadAppointments(); // Refresh appointments
  };

  const upcomingAppointments = appointments.filter(appointment =>
    new Date(appointment.scheduledTime) > new Date()
  );

  const pastAppointments = appointments.filter(appointment =>
    new Date(appointment.scheduledTime) <= new Date()
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            My Appointments
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your healthcare appointments
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setBookingDialogOpen(true)}
          sx={{ borderRadius: 2 }}
        >
          Book Appointment
        </Button>
      </Box>

      {/* Upcoming Appointments */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Upcoming Appointments
        </Typography>
        {appointmentsLoading ? (
          <Typography>Loading appointments...</Typography>
        ) : upcomingAppointments.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
            <CalendarToday sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No upcoming appointments
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Book your first appointment to get started
            </Typography>
          </Paper>
        ) : (
          <Box sx={{ display: 'grid', gap: 2 }}>
            {upcomingAppointments
              .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime())
              .map((appointment) => (
                <Paper
                  key={appointment.id}
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'grey.200',
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="start">
                    <Box>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        {appointment.type} Consultation
                      </Typography>
                      <Typography variant="body1" color="text.secondary" gutterBottom>
                        {appointment.reason}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Doctor: {appointment.doctorId}
                      </Typography>
                    </Box>
                    <Box textAlign="right">
                      <Typography variant="h6" fontWeight="bold">
                        {new Date(appointment.scheduledTime).toLocaleDateString()}
                      </Typography>
                      <Typography variant="body1">
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
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  </Box>
                </Paper>
              ))}
          </Box>
        )}
      </Box>

      {/* Past Appointments */}
      {pastAppointments.length > 0 && (
        <Box>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Past Appointments
          </Typography>
          <Box sx={{ display: 'grid', gap: 2 }}>
            {pastAppointments
              .sort((a, b) => new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime())
              .slice(0, 5)
              .map((appointment) => (
                <Paper
                  key={appointment.id}
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'grey.200',
                    opacity: 0.7,
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="start">
                    <Box>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        {appointment.type} Consultation
                      </Typography>
                      <Typography variant="body1" color="text.secondary" gutterBottom>
                        {appointment.reason}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Doctor: {appointment.doctorId}
                      </Typography>
                    </Box>
                    <Box textAlign="right">
                      <Typography variant="body1">
                        {new Date(appointment.scheduledTime).toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(appointment.scheduledTime).toLocaleTimeString()}
                      </Typography>
                      <Chip
                        label={appointment.status}
                        size="small"
                        color="default"
                        variant="outlined"
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  </Box>
                </Paper>
              ))}
          </Box>
        </Box>
      )}

      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
        }}
        onClick={() => setBookingDialogOpen(true)}
      >
        <Add />
      </Fab>

      {/* Appointment Booking Dialog */}
      <Dialog
        open={bookingDialogOpen}
        onClose={() => setBookingDialogOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Book Appointment</Typography>
            <Button onClick={() => setBookingDialogOpen(false)}>Close</Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          <AppointmentBooking
            open={bookingDialogOpen}
            onClose={() => setBookingDialogOpen(false)}
            patientId={user?.id || ''}
            onAppointmentBooked={handleAppointmentBooked}
            onCancel={() => setBookingDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default PatientAppointmentsPage;