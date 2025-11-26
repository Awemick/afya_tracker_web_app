import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import { PaystackService } from '../../services/paystackService';

interface HybridPaymentProps {
  open: boolean;
  onClose: () => void;
  amount: number;
  planName: string;
  description: string;
  onSuccess: (reference: string) => void;
  onError: (error: string) => void;
}

const HybridPayment: React.FC<HybridPaymentProps> = ({
  open,
  onClose,
  amount,
  planName,
  description,
  onSuccess,
  onError,
}) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const paystackService = new PaystackService();

  const handlePayment = async () => {
    if (!email) {
      onError('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      console.log('Starting Paystack payment process...');

      // Initialize transaction with Paystack API (like Flutter app)
      const paymentUrl = await paystackService.initializeTransaction({
        amount: amount * 100, // Convert to kobo
        email,
        planName,
      });

      if (!paymentUrl) {
        onError('Failed to initialize payment');
        return;
      }

      console.log('Payment URL obtained:', paymentUrl);

      // Open payment window (like Flutter WebView)
      const success = await paystackService.openPaymentWindow(paymentUrl);

      if (success) {
        // Generate reference and store payment record (like Flutter app)
        const reference = `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await paystackService.storePaymentRecord(reference, amount * 100, email, planName);
        console.log('Payment completed successfully');
        onSuccess(reference);
        onClose();
      } else {
        console.log('Payment was cancelled or failed');
        onError('Payment cancelled');
        onClose();
      }
    } catch (error) {
      console.error('Payment error:', error);
      onError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6" component="div">
          Complete Payment
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Amount: KES {(amount * 100 / 100).toFixed(0)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Plan: {planName}
          </Typography>
        </Box>

        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            helperText="Enter your email address for payment confirmation"
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handlePayment}
          variant="contained"
          disabled={loading || !email}
        >
          {loading ? <CircularProgress size={20} /> : 'Pay Now'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default HybridPayment;