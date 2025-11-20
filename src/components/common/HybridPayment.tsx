import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { PaymentMethod, hybridPaymentService } from '../../services/hybridPaymentService';

interface HybridPaymentProps {
  open: boolean;
  onClose: () => void;
  amount: number;
  description: string;
  onSuccess: (reference: string) => void;
  onError: (error: string) => void;
}

const HybridPayment: React.FC<HybridPaymentProps> = ({
  open,
  onClose,
  amount,
  description,
  onSuccess,
  onError,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.PAYSTACK);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [mpesaStatus, setMpesaStatus] = useState<string | null>(null);

  const handlePayment = async () => {
    setLoading(true);
    setMpesaStatus(null);

    try {
      const reference = `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      if (paymentMethod === PaymentMethod.PAYSTACK) {
        if (!email) {
          onError('Please enter your email address');
          setLoading(false);
          return;
        }

        await hybridPaymentService.initiatePaystackPayment({
          amount: amount * 100, // Convert to kobo
          email,
          reference,
          currency: 'KES',
          callback: (response) => {
            if (response.status === 'success') {
              onSuccess(reference);
            } else {
              onError('Payment failed');
            }
            onClose();
          },
          onClose: () => {
            onError('Payment cancelled');
            onClose();
          },
        });
      } else if (paymentMethod === PaymentMethod.MPESA) {
        if (!phoneNumber) {
          onError('Please enter your M-Pesa phone number');
          setLoading(false);
          return;
        }

        const result = await hybridPaymentService.initiateMpesaPayment({
          phoneNumber,
          amount,
          accountReference: reference,
          transactionDesc: description,
        });

        if (result.success) {
          setMpesaStatus('Payment request sent. Please check your phone and complete the payment.');

          // Poll for payment status
          const checkStatus = async () => {
            const statusResult = await hybridPaymentService.checkMpesaPaymentStatus(result.checkoutRequestId);
            if (statusResult.success) {
              onSuccess(reference);
              onClose();
            } else if (statusResult.error) {
              onError(statusResult.error);
              onClose();
            } else {
              // Continue polling
              setTimeout(checkStatus, 5000);
            }
          };

          setTimeout(checkStatus, 10000); // Start checking after 10 seconds
        } else {
          onError(result.error || 'M-Pesa payment failed');
        }
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6" component="div">
          Choose Payment Method
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Amount: KES {amount.toLocaleString()}
          </Typography>
        </Box>

        <RadioGroup
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
        >
          <FormControlLabel
            value={PaymentMethod.PAYSTACK}
            control={<Radio />}
            label={
              <Box>
                <Typography variant="body1">Paystack (Card/Transfer)</Typography>
                <Typography variant="body2" color="text.secondary">
                  Pay with credit/debit card, bank transfer, or mobile money
                </Typography>
              </Box>
            }
          />

          <FormControlLabel
            value={PaymentMethod.MPESA}
            control={<Radio />}
            label={
              <Box>
                <Typography variant="body1">M-Pesa</Typography>
                <Typography variant="body2" color="text.secondary">
                  Pay directly from your M-Pesa account
                </Typography>
              </Box>
            }
          />
        </RadioGroup>

        {paymentMethod === PaymentMethod.PAYSTACK && (
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Box>
        )}

        {paymentMethod === PaymentMethod.MPESA && (
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="M-Pesa Phone Number"
              placeholder="254712345678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              helperText="Enter your M-Pesa registered phone number"
            />
          </Box>
        )}

        {mpesaStatus && (
          <Alert severity="info" sx={{ mt: 2 }}>
            {mpesaStatus}
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handlePayment}
          variant="contained"
          disabled={loading || (paymentMethod === PaymentMethod.PAYSTACK && !email) || (paymentMethod === PaymentMethod.MPESA && !phoneNumber)}
        >
          {loading ? <CircularProgress size={20} /> : 'Pay Now'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default HybridPayment;