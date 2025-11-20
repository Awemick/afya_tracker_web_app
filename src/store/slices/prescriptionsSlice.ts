import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Prescription, Medication } from '../../types';

interface PrescriptionsState {
  prescriptions: Prescription[];
  selectedPrescription: Prescription | null;
  loading: boolean;
  error: string | null;
}

const initialState: PrescriptionsState = {
  prescriptions: [],
  selectedPrescription: null,
  loading: false,
  error: null,
};

const prescriptionsSlice = createSlice({
  name: 'prescriptions',
  initialState,
  reducers: {
    fetchPrescriptionsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchPrescriptionsSuccess: (state, action: PayloadAction<Prescription[]>) => {
      state.loading = false;
      state.prescriptions = action.payload;
      state.error = null;
    },
    fetchPrescriptionsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    selectPrescription: (state, action: PayloadAction<Prescription>) => {
      state.selectedPrescription = action.payload;
    },
    createPrescriptionStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    createPrescriptionSuccess: (state, action: PayloadAction<Prescription>) => {
      state.loading = false;
      state.prescriptions.push(action.payload);
      state.error = null;
    },
    createPrescriptionFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    updatePrescription: (state, action: PayloadAction<Prescription>) => {
      const index = state.prescriptions.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.prescriptions[index] = action.payload;
      }
      if (state.selectedPrescription?.id === action.payload.id) {
        state.selectedPrescription = action.payload;
      }
    },
    deletePrescription: (state, action: PayloadAction<string>) => {
      state.prescriptions = state.prescriptions.filter(p => p.id !== action.payload);
      if (state.selectedPrescription?.id === action.payload) {
        state.selectedPrescription = null;
      }
    },
    clearSelectedPrescription: (state) => {
      state.selectedPrescription = null;
    },
  },
});

export const {
  fetchPrescriptionsStart,
  fetchPrescriptionsSuccess,
  fetchPrescriptionsFailure,
  selectPrescription,
  createPrescriptionStart,
  createPrescriptionSuccess,
  createPrescriptionFailure,
  updatePrescription,
  deletePrescription,
  clearSelectedPrescription,
} = prescriptionsSlice.actions;

export default prescriptionsSlice.reducer;