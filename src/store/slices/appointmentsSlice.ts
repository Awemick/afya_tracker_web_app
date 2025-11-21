import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Appointment, DoctorAvailability } from '../../types';

interface AppointmentsState {
  appointments: Appointment[];
  doctorAvailability: DoctorAvailability[];
  loading: boolean;
  error: string | null;
}

const initialState: AppointmentsState = {
  appointments: [],
  doctorAvailability: [],
  loading: false,
  error: null,
};

const appointmentsSlice = createSlice({
  name: 'appointments',
  initialState,
  reducers: {
    fetchAppointmentsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchAppointmentsSuccess: (state, action: PayloadAction<Appointment[]>) => {
      state.loading = false;
      state.appointments = action.payload;
      state.error = null;
    },
    fetchAppointmentsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    fetchDoctorAvailabilityStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchDoctorAvailabilitySuccess: (state, action: PayloadAction<DoctorAvailability[]>) => {
      state.loading = false;
      state.doctorAvailability = action.payload;
      state.error = null;
    },
    fetchDoctorAvailabilityFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    addAppointment: (state, action: PayloadAction<Appointment>) => {
      state.appointments.push(action.payload);
    },
    updateAppointment: (state, action: PayloadAction<Appointment>) => {
      const index = state.appointments.findIndex(a => a.id === action.payload.id);
      if (index !== -1) {
        state.appointments[index] = action.payload;
      }
    },
    cancelAppointment: (state, action: PayloadAction<string>) => {
      const appointment = state.appointments.find(a => a.id === action.payload);
      if (appointment) {
        appointment.status = 'cancelled';
        appointment.updatedAt = new Date().toISOString();
      }
    },
    updateDoctorAvailability: (state, action: PayloadAction<DoctorAvailability>) => {
      const index = state.doctorAvailability.findIndex(
        da => da.doctorId === action.payload.doctorId && da.dayOfWeek === action.payload.dayOfWeek
      );
      if (index !== -1) {
        state.doctorAvailability[index] = action.payload;
      } else {
        state.doctorAvailability.push(action.payload);
      }
    },
    blockTimeSlot: (state, action: PayloadAction<{ doctorId: string; dateTime: string }>) => {
      const availability = state.doctorAvailability.find(
        da => da.doctorId === action.payload.doctorId
      );
      if (availability && !availability.blockedSlots.includes(action.payload.dateTime)) {
        availability.blockedSlots.push(action.payload.dateTime);
      }
    },
    unblockTimeSlot: (state, action: PayloadAction<{ doctorId: string; dateTime: string }>) => {
      const availability = state.doctorAvailability.find(
        da => da.doctorId === action.payload.doctorId
      );
      if (availability) {
        availability.blockedSlots = availability.blockedSlots.filter(
          slot => slot !== action.payload.dateTime
        );
      }
    },
  },
});

export const {
  fetchAppointmentsStart,
  fetchAppointmentsSuccess,
  fetchAppointmentsFailure,
  fetchDoctorAvailabilityStart,
  fetchDoctorAvailabilitySuccess,
  fetchDoctorAvailabilityFailure,
  addAppointment,
  updateAppointment,
  cancelAppointment,
  updateDoctorAvailability,
  blockTimeSlot,
  unblockTimeSlot,
} = appointmentsSlice.actions;

export default appointmentsSlice.reducer;