import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Patient, KickSession } from '../../types';
import { assessFetalRisk, shouldNotifyDoctor } from '../../utils/riskAssessment';

interface PatientsState {
  patients: Patient[];
  selectedPatient: Patient | null;
  loading: boolean;
  error: string | null;
}

const initialState: PatientsState = {
  patients: [],
  selectedPatient: null,
  loading: false,
  error: null,
};

const patientsSlice = createSlice({
  name: 'patients',
  initialState,
  reducers: {
    fetchPatientsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchPatientsSuccess: (state, action: PayloadAction<Patient[]>) => {
      state.loading = false;
      state.patients = action.payload;
      state.error = null;
    },
    fetchPatientsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    selectPatient: (state, action: PayloadAction<Patient>) => {
      state.selectedPatient = action.payload;
    },
    addKickSession: (state, action: PayloadAction<{ patientId: string; session: KickSession }>) => {
      const { patientId, session } = action.payload;
      const patient = state.patients.find(p => p.id === patientId);
      if (patient) {
        patient.kickSessions.push(session);
        // Assess risk after adding session
        const newRisk = assessFetalRisk(patient.kickSessions);
        if (newRisk !== patient.riskLevel) {
          patient.riskLevel = newRisk;
          // Here we could dispatch a notification, but for now just update
        }
      }
    },
    updatePatient: (state, action: PayloadAction<Patient>) => {
      const index = state.patients.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.patients[index] = action.payload;
      }
    },
  },
});

export const {
  fetchPatientsStart,
  fetchPatientsSuccess,
  fetchPatientsFailure,
  selectPatient,
  addKickSession,
  updatePatient,
} = patientsSlice.actions;

export default patientsSlice.reducer;