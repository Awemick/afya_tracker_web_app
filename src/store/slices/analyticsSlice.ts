import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AnalyticsData, Report, DateRange } from '../../types';

interface AnalyticsState {
  analyticsData: AnalyticsData[];
  reports: Report[];
  loading: boolean;
  error: string | null;
  dateRange: DateRange | null;
  generatingReport: boolean;
}

const initialState: AnalyticsState = {
  analyticsData: [],
  reports: [],
  loading: false,
  error: null,
  dateRange: null,
  generatingReport: false,
};

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    fetchAnalyticsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchAnalyticsSuccess: (state, action: PayloadAction<AnalyticsData[]>) => {
      state.loading = false;
      state.analyticsData = action.payload;
      state.error = null;
    },
    fetchAnalyticsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    fetchReportsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchReportsSuccess: (state, action: PayloadAction<Report[]>) => {
      state.loading = false;
      state.reports = action.payload;
      state.error = null;
    },
    fetchReportsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    generateReportStart: (state) => {
      state.generatingReport = true;
      state.error = null;
    },
    generateReportSuccess: (state, action: PayloadAction<Report>) => {
      state.generatingReport = false;
      state.reports.push(action.payload);
      state.error = null;
    },
    generateReportFailure: (state, action: PayloadAction<string>) => {
      state.generatingReport = false;
      state.error = action.payload;
    },
    setDateRange: (state, action: PayloadAction<DateRange>) => {
      state.dateRange = action.payload;
    },
    clearAnalyticsError: (state) => {
      state.error = null;
    },
    addAnalyticsData: (state, action: PayloadAction<AnalyticsData>) => {
      state.analyticsData.push(action.payload);
    },
    updateAnalyticsData: (state, action: PayloadAction<AnalyticsData>) => {
      const index = state.analyticsData.findIndex(data => data.id === action.payload.id);
      if (index !== -1) {
        state.analyticsData[index] = action.payload;
      }
    },
  },
});

export const {
  fetchAnalyticsStart,
  fetchAnalyticsSuccess,
  fetchAnalyticsFailure,
  fetchReportsStart,
  fetchReportsSuccess,
  fetchReportsFailure,
  generateReportStart,
  generateReportSuccess,
  generateReportFailure,
  setDateRange,
  clearAnalyticsError,
  addAnalyticsData,
  updateAnalyticsData,
} = analyticsSlice.actions;

export default analyticsSlice.reducer;

export {};