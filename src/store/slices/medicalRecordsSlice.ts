import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MedicalRecord, FilePermissions } from '../../types';

interface MedicalRecordsState {
  records: MedicalRecord[];
  selectedRecord: MedicalRecord | null;
  loading: boolean;
  error: string | null;
  uploadProgress: { [key: string]: number };
}

const initialState: MedicalRecordsState = {
  records: [],
  selectedRecord: null,
  loading: false,
  error: null,
  uploadProgress: {},
};

const medicalRecordsSlice = createSlice({
  name: 'medicalRecords',
  initialState,
  reducers: {
    fetchRecordsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchRecordsSuccess: (state, action: PayloadAction<MedicalRecord[]>) => {
      state.loading = false;
      state.records = action.payload;
      state.error = null;
    },
    fetchRecordsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    selectRecord: (state, action: PayloadAction<MedicalRecord>) => {
      state.selectedRecord = action.payload;
    },
    clearSelectedRecord: (state) => {
      state.selectedRecord = null;
    },
    uploadRecordStart: (state, action: PayloadAction<string>) => {
      state.uploadProgress[action.payload] = 0;
    },
    uploadRecordProgress: (state, action: PayloadAction<{ id: string; progress: number }>) => {
      state.uploadProgress[action.payload.id] = action.payload.progress;
    },
    uploadRecordSuccess: (state, action: PayloadAction<MedicalRecord>) => {
      state.records.push(action.payload);
      delete state.uploadProgress[action.payload.id];
    },
    uploadRecordFailure: (state, action: PayloadAction<{ id: string; error: string }>) => {
      delete state.uploadProgress[action.payload.id];
      state.error = action.payload.error;
    },
    deleteRecord: (state, action: PayloadAction<string>) => {
      state.records = state.records.filter(record => record.id !== action.payload);
      if (state.selectedRecord?.id === action.payload) {
        state.selectedRecord = null;
      }
    },
    updateRecordPermissions: (state, action: PayloadAction<{ id: string; permissions: FilePermissions }>) => {
      const record = state.records.find(r => r.id === action.payload.id);
      if (record) {
        record.accessPermissions = action.payload.permissions;
      }
      if (state.selectedRecord?.id === action.payload.id) {
        state.selectedRecord.accessPermissions = action.payload.permissions;
      }
    },
    updateRecordTags: (state, action: PayloadAction<{ id: string; tags: string[] }>) => {
      const record = state.records.find(r => r.id === action.payload.id);
      if (record) {
        record.tags = action.payload.tags;
      }
      if (state.selectedRecord?.id === action.payload.id) {
        state.selectedRecord.tags = action.payload.tags;
      }
    },
    updateRecordCategory: (state, action: PayloadAction<{ id: string; category: MedicalRecord['category'] }>) => {
      const record = state.records.find(r => r.id === action.payload.id);
      if (record) {
        record.category = action.payload.category;
      }
      if (state.selectedRecord?.id === action.payload.id) {
        state.selectedRecord.category = action.payload.category;
      }
    },
    updateRecordDescription: (state, action: PayloadAction<{ id: string; description: string }>) => {
      const record = state.records.find(r => r.id === action.payload.id);
      if (record) {
        record.description = action.payload.description;
      }
      if (state.selectedRecord?.id === action.payload.id) {
        state.selectedRecord.description = action.payload.description;
      }
    },
    markRecordAccessed: (state, action: PayloadAction<string>) => {
      const record = state.records.find(r => r.id === action.payload);
      if (record) {
        record.lastAccessed = new Date().toISOString();
      }
      if (state.selectedRecord?.id === action.payload) {
        state.selectedRecord.lastAccessed = new Date().toISOString();
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  fetchRecordsStart,
  fetchRecordsSuccess,
  fetchRecordsFailure,
  selectRecord,
  clearSelectedRecord,
  uploadRecordStart,
  uploadRecordProgress,
  uploadRecordSuccess,
  uploadRecordFailure,
  deleteRecord,
  updateRecordPermissions,
  updateRecordTags,
  updateRecordCategory,
  updateRecordDescription,
  markRecordAccessed,
  clearError,
} = medicalRecordsSlice.actions;

export default medicalRecordsSlice.reducer;

export {};