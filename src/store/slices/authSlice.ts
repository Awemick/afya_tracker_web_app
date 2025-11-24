import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { User } from '../../types';
import { AuthUser, refreshUserData } from '../../services/authService';
import { auth } from '../../firebase';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
};

// Async thunk for refreshing user data
export const refreshUserDataAsync = createAsyncThunk(
  'auth/refreshUserData',
  async (_, { rejectWithValue }) => {
    try {
      if (!auth) {
        throw new Error('Firebase auth not initialized');
      }

      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      const authUser = await refreshUserData(currentUser);
      // Extract User data from AuthUser, excluding firebaseUser
      const { firebaseUser, ...userData } = authUser;
      return userData;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to refresh user data');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    setAuthUser: (state, action: PayloadAction<AuthUser>) => {
      // Extract User data from AuthUser, excluding firebaseUser
      const { firebaseUser, ...userData } = action.payload;
      state.user = userData;
      state.isAuthenticated = true;
    },
    updateUserData: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(refreshUserDataAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(refreshUserDataAsync.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
      })
      .addCase(refreshUserDataAsync.rejected, (state) => {
        state.loading = false;
      });
  },
});

export const { setUser, setAuthUser, updateUserData, logout, clearUser, setLoading } = authSlice.actions;
export default authSlice.reducer;