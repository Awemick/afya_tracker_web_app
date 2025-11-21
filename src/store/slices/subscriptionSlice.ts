import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { paystackService } from '../../services/paystackService';

interface Subscription {
  id: string;
  userId: string;
  planName: string;
  amount: number;
  currency: string;
  status: 'active' | 'inactive' | 'cancelled';
  createdAt: Date;
  nextBillingDate: Date;
}

interface Payment {
  id: string;
  reference: string;
  userId: string;
  amount: number;
  status: 'verified' | 'pending' | 'failed';
  timestamp: Date;
}

interface SubscriptionState {
  currentSubscription: Subscription | null;
  payments: Payment[];
  loading: boolean;
  error: string | null;
}

const initialState: SubscriptionState = {
  currentSubscription: null,
  payments: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchUserSubscription = createAsyncThunk(
  'subscription/fetchUserSubscription',
  async () => {
    const subscription = await paystackService.getUserSubscription();
    return subscription;
  }
);

export const fetchUserPayments = createAsyncThunk(
  'subscription/fetchUserPayments',
  async () => {
    const payments = await paystackService.getUserPayments();
    return payments;
  }
);

export const createSubscription = createAsyncThunk(
  'subscription/createSubscription',
  async (data: {
    email: string;
    amount: number;
    planName: string;
  }) => {
    await paystackService.createSubscription(data);
    return await paystackService.getUserSubscription();
  }
);

export const initializePaystackTransaction = createAsyncThunk(
  'subscription/initializePaystackTransaction',
  async (config: {
    amount: number;
    email: string;
    reference: string;
    currency?: string;
    callback?: (response: any) => void;
    onClose?: () => void;
  }) => {
    const handler = await paystackService.initializeTransaction(config);
    return handler;
  }
);

export const verifyPayment = createAsyncThunk(
  'subscription/verifyPayment',
  async (reference: string) => {
    const success = await paystackService.verifyPayment(reference);
    return { success, reference };
  }
);

const subscriptionSlice = createSlice({
  name: 'subscription',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSubscription: (state, action: PayloadAction<Subscription | null>) => {
      state.currentSubscription = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch user subscription
      .addCase(fetchUserSubscription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserSubscription.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSubscription = action.payload;
      })
      .addCase(fetchUserSubscription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch subscription';
      })
      // Fetch user payments
      .addCase(fetchUserPayments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.payments = action.payload;
      })
      .addCase(fetchUserPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch payments';
      })
      // Create subscription
      .addCase(createSubscription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSubscription.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSubscription = action.payload;
      })
      .addCase(createSubscription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create subscription';
      })
      // Verify payment
      .addCase(verifyPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyPayment.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) {
          // Refresh subscription data
          // This would typically trigger a refetch
        }
      })
      .addCase(verifyPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Payment verification failed';
      });
  },
});

export const { clearError, setSubscription } = subscriptionSlice.actions;
export default subscriptionSlice.reducer;