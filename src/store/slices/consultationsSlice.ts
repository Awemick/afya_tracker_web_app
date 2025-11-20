import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Consultation } from '../../types';

interface ConsultationsState {
  consultations: Consultation[];
  loading: boolean;
  error: string | null;
}

const initialState: ConsultationsState = {
  consultations: [],
  loading: false,
  error: null,
};

const consultationsSlice = createSlice({
  name: 'consultations',
  initialState,
  reducers: {
    fetchConsultationsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchConsultationsSuccess: (state, action: PayloadAction<Consultation[]>) => {
      state.loading = false;
      state.consultations = action.payload;
      state.error = null;
    },
    fetchConsultationsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    addConsultation: (state, action: PayloadAction<Consultation>) => {
      state.consultations.push(action.payload);
    },
    updateConsultation: (state, action: PayloadAction<Consultation>) => {
      const index = state.consultations.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.consultations[index] = action.payload;
      }
    },
    cancelConsultation: (state, action: PayloadAction<string>) => {
      const consultation = state.consultations.find(c => c.id === action.payload);
      if (consultation) {
        consultation.status = 'cancelled';
      }
    },
  },
});

export const {
  fetchConsultationsStart,
  fetchConsultationsSuccess,
  fetchConsultationsFailure,
  addConsultation,
  updateConsultation,
  cancelConsultation,
} = consultationsSlice.actions;

export default consultationsSlice.reducer;