import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Institution, StaffMember } from '../../types';

interface InstitutionsState {
  institutions: Institution[];
  staff: StaffMember[];
  selectedInstitution: Institution | null;
  loading: boolean;
  error: string | null;
}

const initialState: InstitutionsState = {
  institutions: [],
  staff: [],
  selectedInstitution: null,
  loading: false,
  error: null,
};

const institutionsSlice = createSlice({
  name: 'institutions',
  initialState,
  reducers: {
    fetchInstitutionsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchInstitutionsSuccess: (state, action: PayloadAction<Institution[]>) => {
      state.loading = false;
      state.institutions = action.payload;
      state.error = null;
    },
    fetchInstitutionsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    selectInstitution: (state, action: PayloadAction<Institution>) => {
      state.selectedInstitution = action.payload;
    },
    updateInstitution: (state, action: PayloadAction<Institution>) => {
      const index = state.institutions.findIndex(i => i.id === action.payload.id);
      if (index !== -1) {
        state.institutions[index] = action.payload;
      }
      if (state.selectedInstitution?.id === action.payload.id) {
        state.selectedInstitution = action.payload;
      }
    },
    addInstitution: (state, action: PayloadAction<Institution>) => {
      state.institutions.push(action.payload);
    },
    fetchStaffStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchStaffSuccess: (state, action: PayloadAction<StaffMember[]>) => {
      state.loading = false;
      state.staff = action.payload;
      state.error = null;
    },
    fetchStaffFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    addStaffMember: (state, action: PayloadAction<StaffMember>) => {
      state.staff.push(action.payload);
    },
    updateStaffMember: (state, action: PayloadAction<StaffMember>) => {
      const index = state.staff.findIndex(s => s.id === action.payload.id);
      if (index !== -1) {
        state.staff[index] = action.payload;
      }
    },
    removeStaffMember: (state, action: PayloadAction<string>) => {
      state.staff = state.staff.filter(s => s.id !== action.payload);
    },
  },
});

export const {
  fetchInstitutionsStart,
  fetchInstitutionsSuccess,
  fetchInstitutionsFailure,
  selectInstitution,
  updateInstitution,
  addInstitution,
  fetchStaffStart,
  fetchStaffSuccess,
  fetchStaffFailure,
  addStaffMember,
  updateStaffMember,
  removeStaffMember,
} = institutionsSlice.actions;

export default institutionsSlice.reducer;

export {};