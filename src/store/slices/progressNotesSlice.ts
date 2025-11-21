import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ProgressNote, Recommendation } from '../../types';

interface ProgressNotesState {
  notes: ProgressNote[];
  recommendations: Recommendation[];
  selectedNote: ProgressNote | null;
  loading: boolean;
  error: string | null;
}

const initialState: ProgressNotesState = {
  notes: [],
  recommendations: [],
  selectedNote: null,
  loading: false,
  error: null,
};

const progressNotesSlice = createSlice({
  name: 'progressNotes',
  initialState,
  reducers: {
    // Notes reducers
    fetchNotesStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchNotesSuccess: (state, action: PayloadAction<ProgressNote[]>) => {
      state.loading = false;
      state.notes = action.payload;
      state.error = null;
    },
    fetchNotesFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    addNote: (state, action: PayloadAction<ProgressNote>) => {
      state.notes.push(action.payload);
    },
    updateNote: (state, action: PayloadAction<ProgressNote>) => {
      const index = state.notes.findIndex(n => n.id === action.payload.id);
      if (index !== -1) {
        state.notes[index] = action.payload;
      }
    },
    deleteNote: (state, action: PayloadAction<string>) => {
      state.notes = state.notes.filter(n => n.id !== action.payload);
    },
    selectNote: (state, action: PayloadAction<ProgressNote>) => {
      state.selectedNote = action.payload;
    },
    clearSelectedNote: (state) => {
      state.selectedNote = null;
    },

    // Recommendations reducers
    fetchRecommendationsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchRecommendationsSuccess: (state, action: PayloadAction<Recommendation[]>) => {
      state.loading = false;
      state.recommendations = action.payload;
      state.error = null;
    },
    fetchRecommendationsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    addRecommendation: (state, action: PayloadAction<Recommendation>) => {
      state.recommendations.push(action.payload);
    },
    updateRecommendation: (state, action: PayloadAction<Recommendation>) => {
      const index = state.recommendations.findIndex(r => r.id === action.payload.id);
      if (index !== -1) {
        state.recommendations[index] = action.payload;
      }
    },
    deleteRecommendation: (state, action: PayloadAction<string>) => {
      state.recommendations = state.recommendations.filter(r => r.id !== action.payload);
    },
    completeRecommendation: (state, action: PayloadAction<string>) => {
      const recommendation = state.recommendations.find(r => r.id === action.payload);
      if (recommendation) {
        recommendation.status = 'completed';
        recommendation.completedAt = new Date();
      }
    },
  },
});

export const {
  fetchNotesStart,
  fetchNotesSuccess,
  fetchNotesFailure,
  addNote,
  updateNote,
  deleteNote,
  selectNote,
  clearSelectedNote,
  fetchRecommendationsStart,
  fetchRecommendationsSuccess,
  fetchRecommendationsFailure,
  addRecommendation,
  updateRecommendation,
  deleteRecommendation,
  completeRecommendation,
} = progressNotesSlice.actions;

export default progressNotesSlice.reducer;