import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PatientLink } from '../../types';

interface PatientLinksState {
  links: PatientLink[];
  selectedLink: PatientLink | null;
  loading: boolean;
  error: string | null;
}

const initialState: PatientLinksState = {
  links: [],
  selectedLink: null,
  loading: false,
  error: null,
};

const patientLinksSlice = createSlice({
  name: 'patientLinks',
  initialState,
  reducers: {
    fetchLinksStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchLinksSuccess: (state, action: PayloadAction<PatientLink[]>) => {
      state.loading = false;
      state.links = action.payload;
      state.error = null;
    },
    fetchLinksFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    createLink: (state, action: PayloadAction<PatientLink>) => {
      state.links.push(action.payload);
    },
    updateLink: (state, action: PayloadAction<PatientLink>) => {
      const index = state.links.findIndex(link => link.id === action.payload.id);
      if (index !== -1) {
        state.links[index] = action.payload;
      }
    },
    deleteLink: (state, action: PayloadAction<string>) => {
      state.links = state.links.filter(link => link.id !== action.payload);
    },
    selectLink: (state, action: PayloadAction<PatientLink>) => {
      state.selectedLink = action.payload;
    },
    clearSelectedLink: (state) => {
      state.selectedLink = null;
    },
  },
});

export const {
  fetchLinksStart,
  fetchLinksSuccess,
  fetchLinksFailure,
  createLink,
  updateLink,
  deleteLink,
  selectLink,
  clearSelectedLink,
} = patientLinksSlice.actions;

export default patientLinksSlice.reducer;