import React, { useState } from 'react';
import { PaystackService } from '../../services/paystackService';

interface PaystackPaymentProps {
  amount: number; // Amount in kobo (smallest currency unit)
  email: string;
  planName: string;
  onSuccess: (reference: string) => void;
  onClose: () => void;
  children?: React.ReactNode;
}

const PaystackPayment: React.FC<PaystackPaymentProps> = ({
  amount,
  email,
  planName,
  onSuccess,
  onClose,
  children,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const paystackService = new PaystackService();

  const handlePayment = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      console.log('Starting payment process...');

      // Initialize transaction with Paystack API
      const paymentUrl = await paystackService.initializeTransaction({
        amount,
        email,
        planName,
      });

      if (!paymentUrl) {
        console.error('Failed to initialize payment');
        onClose();
        return;
      }

      console.log('Payment URL obtained:', paymentUrl);

      // Open payment window
      const success = await paystackService.openPaymentWindow(paymentUrl);

      if (success) {
        // Generate reference and store payment record
        const reference = `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await paystackService.storePaymentRecord(reference, amount, email, planName);
        console.log('Payment completed successfully');
        onSuccess(reference);
      } else {
        console.log('Payment was cancelled or failed');
        onClose();
      }
    } catch (error) {
      console.error('Payment error:', error);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div onClick={handlePayment} style={{ cursor: isProcessing ? 'not-allowed' : 'pointer' }}>
      {children || (
        <button disabled={isProcessing}>
          {isProcessing ? 'Processing...' : `Pay KES ${(amount / 100).toFixed(0)}`}
        </button>
      )}
    </div>
  );
};

export default PaystackPayment;