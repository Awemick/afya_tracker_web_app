import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Alert,
  Avatar,
  CircularProgress,
} from '@mui/material';
import {
  Person,
  AccessTime,
  CalendarToday,
  VideoCall,
  LocationOn,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { format, addDays, isBefore } from 'date-fns';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

import { RootState } from '../../store/store';
import { appointmentAPI, doctorAvailabilityAPI, notificationAPI } from '../../services/api';
import { addAppointment } from '../../store/slices/appointmentsSlice';
import { addNotification } from '../../store/slices/notificationsSlice';

interface AppointmentBookingProps {
  open: boolean;
  onClose: () => void;
  patientId: string;
  onAppointmentBooked?: () => void;
  onCancel?: () => void;
}

const AppointmentBooking: React.FC<AppointmentBookingProps> = ({
  open,
  onClose,
  patientId,
  onAppointmentBooked,
  onCancel,
}) => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state: RootState) => state.appointments);

  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [appointmentType, setAppointmentType] = useState<'virtual' | 'physical'>('virtual');
  const [notes, setNotes] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [bookingError, setBookingError] = useState('');

  const [doctors, setDoctors] = useState<any[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedDoctor, selectedDate]);

  const fetchDoctors = async () => {
    if (!db) {
      console.error('Firebase db not initialized');
      setLoadingDoctors(false);
      return;
    }
    try {
      setLoadingDoctors(true);
      const doctorsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'provider')
      );
      const querySnapshot = await getDocs(doctorsQuery);
      const doctorsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDoctors(doctorsData);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoadingDoctors(false);
    }
  };

  const loadAvailableSlots = async () => {
    if (!selectedDoctor || !selectedDate) return;

    try {
      const response = await doctorAvailabilityAPI.getAvailability(selectedDoctor);
      const availability = response.data;

      const selectedDateObj = new Date(selectedDate);
      const dayOfWeek = selectedDateObj.getDay();
      const dayAvailability = availability.find((a: any) => a.dayOfWeek === dayOfWeek);

      if (dayAvailability && dayAvailability.isAvailable) {
        const slots = generateTimeSlots(dayAvailability.startTime, dayAvailability.endTime);
        const blockedSlots = dayAvailability.blockedSlots || [];
        const availableSlots = slots.filter(slot => !blockedSlots.includes(slot));
        setAvailableSlots(availableSlots);
      } else {
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error('Error loading available slots:', error);
      setAvailableSlots([]);
    }
  };

  const generateTimeSlots = (startTime: string, endTime: string): string[] => {
    const slots: string[] = [];
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const selectedDateObj = new Date(selectedDate);
    const start = new Date(selectedDateObj);
    start.setHours(startHour, startMinute, 0, 0);

    const end = new Date(selectedDateObj);
    end.setHours(endHour, endMinute, 0, 0);

    const slotDuration = 30; // 30 minutes

    while (start < end) {
      slots.push(start.toISOString());
      start.setMinutes(start.getMinutes() + slotDuration);
    }

    return slots;
  };

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTime) {
      setBookingError('Please select a doctor, date, and time.');
      return;
    }

    const scheduledTime = new Date(`${selectedDate}T${selectedTime}`);

    if (isBefore(scheduledTime, new Date())) {
      setBookingError('Cannot book appointments in the past.');
      return;
    }

    try {
      const appointmentData = {
        patientId,
        doctorId: selectedDoctor,
        scheduledTime: scheduledTime.toISOString(),
        duration: 30,
        type: appointmentType,
        status: 'pending',
        notes,
      };

      const response = await appointmentAPI.createAppointment(appointmentData);
      dispatch(addAppointment(response.data));

      const selectedDoctorData = doctors.find(d => d.id === selectedDoctor);

      // Create notification for the patient
      await notificationAPI.createNotification({
        userId: patientId,
        type: 'appointment',
        title: 'Appointment Booked',
        message: `Your appointment with ${selectedDoctorData?.displayName || selectedDoctorData?.name || 'Dr. Unknown'} is scheduled for ${format(scheduledTime, 'PPP p')}`,
        relatedId: response.data.id,
      });

      // Create notification for the doctor
      await notificationAPI.createNotification({
        userId: selectedDoctor,
        type: 'appointment',
        title: 'New Appointment',
        message: `New appointment scheduled for ${format(scheduledTime, 'PPP p')}`,
        relatedId: response.data.id,
      });

      // Block the time slot
      await doctorAvailabilityAPI.blockTimeSlot(selectedDoctor, scheduledTime.toISOString());

      handleClose();
    } catch (error) {
      console.error('Error booking appointment:', error);
      setBookingError('Failed to book appointment. Please try again.');
    }
  };

  const handleClose = () => {
    setSelectedDoctor('');
    setSelectedDate('');
    setSelectedTime('');
    setAppointmentType('virtual');
    setNotes('');
    setAvailableSlots([]);
    setBookingError('');
    onClose();
  };

  const selectedDoctorData = doctors.find(d => d.id === selectedDoctor);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Book Appointment</DialogTitle>
      <DialogContent>
        {bookingError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {bookingError}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
          {/* Doctor Selection */}
          <FormControl fullWidth>
            <InputLabel>Select Doctor</InputLabel>
            <Select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              label="Select Doctor"
              disabled={loadingDoctors}
            >
              {loadingDoctors ? (
                <MenuItem disabled>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Loading doctors...
                </MenuItem>
              ) : doctors.length === 0 ? (
                <MenuItem disabled>No doctors available</MenuItem>
              ) : (
                doctors.map((doctor) => (
                  <MenuItem key={doctor.id} value={doctor.id}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        <Person />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2">
                          {doctor.displayName || doctor.name || 'Dr. Unknown'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {doctor.specialty || 'Healthcare Provider'}
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>

          {/* Date and Type Selection */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              label="Select Date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{
                min: new Date().toISOString().split('T')[0],
                max: addDays(new Date(), 90).toISOString().split('T')[0]
              }}
            />

            <FormControl fullWidth>
              <InputLabel>Appointment Type</InputLabel>
              <Select
                value={appointmentType}
                onChange={(e) => setAppointmentType(e.target.value as 'virtual' | 'physical')}
                label="Appointment Type"
              >
                <MenuItem value="virtual">
                  <Box display="flex" alignItems="center" gap={1}>
                    <VideoCall fontSize="small" />
                    Virtual Consultation
                  </Box>
                </MenuItem>
                <MenuItem value="physical">
                  <Box display="flex" alignItems="center" gap={1}>
                    <LocationOn fontSize="small" />
                    In-Person Visit
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Available Time Slots */}
          {selectedDoctor && selectedDate && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Available Time Slots
              </Typography>
              {availableSlots.length > 0 ? (
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {availableSlots.map((slot) => (
                    <Chip
                      key={slot}
                      label={format(new Date(slot), 'HH:mm')}
                      onClick={() => setSelectedTime(format(new Date(slot), 'HH:mm'))}
                      color={selectedTime === format(new Date(slot), 'HH:mm') ? 'primary' : 'default'}
                      variant={selectedTime === format(new Date(slot), 'HH:mm') ? 'filled' : 'outlined'}
                    />
                  ))}
                </Box>
              ) : (
                <Typography color="text.secondary">
                  No available slots for the selected date.
                </Typography>
              )}
            </Box>
          )}

          {/* Notes */}
          <TextField
            fullWidth
            label="Notes (optional)"
            multiline
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any specific concerns or questions..."
          />

          {/* Appointment Summary */}
          {selectedDoctor && selectedDate && selectedTime && (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Appointment Summary
                </Typography>
                <Box display="flex" flexDirection="column" gap={1}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Person fontSize="small" />
                    <Typography variant="body2">
                      Doctor: {selectedDoctorData?.displayName || selectedDoctorData?.name || 'Dr. Unknown'}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <CalendarToday fontSize="small" />
                    <Typography variant="body2">
                      Date: {format(new Date(selectedDate), 'PPP')}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <AccessTime fontSize="small" />
                    <Typography variant="body2">
                      Time: {selectedTime}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    {appointmentType === 'virtual' ? <VideoCall fontSize="small" /> : <LocationOn fontSize="small" />}
                    <Typography variant="body2">
                      Type: {appointmentType === 'virtual' ? 'Virtual Consultation' : 'In-Person Visit'}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleBookAppointment}
          variant="contained"
          disabled={!selectedDoctor || !selectedDate || !selectedTime || loading}
        >
          Book Appointment
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AppointmentBooking;