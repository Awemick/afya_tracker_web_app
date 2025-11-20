import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  Card,
  CardContent,
  Alert,
} from '@mui/material';
import { Grid } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';

import { RootState } from '../../store/store';
import { doctorAvailabilityAPI } from '../../services/api';
import { updateDoctorAvailability } from '../../store/slices/appointmentsSlice';

interface DoctorScheduleProps {
  doctorId: string;
}

const DoctorSchedule: React.FC<DoctorScheduleProps> = ({ doctorId }) => {
  const dispatch = useDispatch();
  const { doctorAvailability, loading } = useSelector((state: RootState) => state.appointments);

  const [schedule, setSchedule] = useState({
    monday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
    tuesday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
    wednesday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
    thursday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
    friday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
    saturday: { isAvailable: false, startTime: '09:00', endTime: '13:00' },
    sunday: { isAvailable: false, startTime: '09:00', endTime: '13:00' },
  });

  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    loadDoctorAvailability();
  }, [doctorId]);

  const loadDoctorAvailability = async () => {
    try {
      const response = await doctorAvailabilityAPI.getAvailability(doctorId);
      const availability = response.data;

      // Update schedule state with loaded data
      const newSchedule = { ...schedule };
      availability.forEach((avail: any) => {
        const dayName = getDayName(avail.dayOfWeek);
        if (dayName in newSchedule) {
          newSchedule[dayName as keyof typeof newSchedule] = {
            isAvailable: avail.isAvailable,
            startTime: avail.startTime,
            endTime: avail.endTime,
          };
        }
      });
      setSchedule(newSchedule);
    } catch (error) {
      console.error('Error loading doctor availability:', error);
    }
  };

  const getDayName = (dayOfWeek: number): string => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[dayOfWeek];
  };

  const getDayNumber = (dayName: string): number => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days.indexOf(dayName);
  };

  const handleScheduleChange = (day: string, field: string, value: any) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day as keyof typeof prev],
        [field]: value,
      },
    }));
  };

  const handleSaveSchedule = async () => {
    try {
      // Save each day's availability
      for (const [dayName, daySchedule] of Object.entries(schedule)) {
        const availabilityData = {
          doctorId,
          dayOfWeek: getDayNumber(dayName),
          startTime: daySchedule.startTime,
          endTime: daySchedule.endTime,
          isAvailable: daySchedule.isAvailable,
          blockedSlots: [], // Will be managed separately
        };

        await doctorAvailabilityAPI.updateAvailability(availabilityData);
        dispatch(updateDoctorAvailability(availabilityData));
      }

      setSaveMessage('Schedule saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error saving schedule:', error);
      setSaveMessage('Failed to save schedule. Please try again.');
    }
  };

  const days = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
  ];

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom fontWeight="bold">
        Doctor Schedule Management
      </Typography>

      {saveMessage && (
        <Alert
          severity={saveMessage.includes('successfully') ? 'success' : 'error'}
          sx={{ mb: 2 }}
        >
          {saveMessage}
        </Alert>
      )}

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Set your weekly availability. Patients can only book appointments during your available hours.
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {days.map(({ key, label }) => {
          const daySchedule = schedule[key as keyof typeof schedule];
          return (
            <Card key={key} variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ minWidth: 100 }}>
                    {label}
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={daySchedule.isAvailable}
                        onChange={(e) => handleScheduleChange(key, 'isAvailable', e.target.checked)}
                      />
                    }
                    label={daySchedule.isAvailable ? 'Available' : 'Unavailable'}
                  />
                </Box>

                {daySchedule.isAvailable && (
                  <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                    <TextField
                      fullWidth
                      label="Start Time"
                      type="time"
                      value={daySchedule.startTime}
                      onChange={(e) => handleScheduleChange(key, 'startTime', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      fullWidth
                      label="End Time"
                      type="time"
                      value={daySchedule.endTime}
                      onChange={(e) => handleScheduleChange(key, 'endTime', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          );
        })}
      </Box>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          onClick={handleSaveSchedule}
          disabled={loading}
        >
          Save Schedule
        </Button>
      </Box>
    </Paper>
  );
};

export default DoctorSchedule;