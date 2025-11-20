import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Referral, ReferralResponse } from '../../types';

interface ReferralsState {
  referrals: Referral[];
  referralResponses: ReferralResponse[];
  selectedReferral: Referral | null;
  loading: boolean;
  error: string | null;
}

const initialState: ReferralsState = {
  referrals: [],
  referralResponses: [],
  selectedReferral: null,
  loading: false,
  error: null,
};

const referralsSlice = createSlice({
  name: 'referrals',
  initialState,
  reducers: {
    // Referral CRUD operations
    fetchReferralsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchReferralsSuccess: (state, action: PayloadAction<Referral[]>) => {
      state.loading = false;
      state.referrals = action.payload;
      state.error = null;
    },
    fetchReferralsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Single referral operations
    selectReferral: (state, action: PayloadAction<Referral>) => {
      state.selectedReferral = action.payload;
    },
    clearSelectedReferral: (state) => {
      state.selectedReferral = null;
    },

    // Create referral
    createReferralStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    createReferralSuccess: (state, action: PayloadAction<Referral>) => {
      state.loading = false;
      state.referrals.push(action.payload);
      state.error = null;
    },
    createReferralFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Update referral
    updateReferralStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    updateReferralSuccess: (state, action: PayloadAction<Referral>) => {
      state.loading = false;
      const index = state.referrals.findIndex(r => r.id === action.payload.id);
      if (index !== -1) {
        state.referrals[index] = action.payload;
      }
      if (state.selectedReferral?.id === action.payload.id) {
        state.selectedReferral = action.payload;
      }
      state.error = null;
    },
    updateReferralFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Referral responses
    fetchReferralResponsesStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchReferralResponsesSuccess: (state, action: PayloadAction<ReferralResponse[]>) => {
      state.loading = false;
      state.referralResponses = action.payload;
      state.error = null;
    },
    fetchReferralResponsesFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Create referral response
    createReferralResponseStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    createReferralResponseSuccess: (state, action: PayloadAction<ReferralResponse>) => {
      state.loading = false;
      state.referralResponses.push(action.payload);
      state.error = null;
    },
    createReferralResponseFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Filter referrals by status
    filterReferralsByStatus: (state, action: PayloadAction<string>) => {
      // This could be used for local filtering if needed
      // For now, just a placeholder for future enhancement
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  fetchReferralsStart,
  fetchReferralsSuccess,
  fetchReferralsFailure,
  selectReferral,
  clearSelectedReferral,
  createReferralStart,
  createReferralSuccess,
  createReferralFailure,
  updateReferralStart,
  updateReferralSuccess,
  updateReferralFailure,
  fetchReferralResponsesStart,
  fetchReferralResponsesSuccess,
  fetchReferralResponsesFailure,
  createReferralResponseStart,
  createReferralResponseSuccess,
  createReferralResponseFailure,
  filterReferralsByStatus,
  clearError,
} = referralsSlice.actions;

export default referralsSlice.reducer;