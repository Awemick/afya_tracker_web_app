import React, { useEffect } from 'react';

interface PaystackPaymentProps {
  amount: number; // Amount in kobo (smallest currency unit)
  email: string;
  onSuccess: (reference: string) => void;
  onClose: () => void;
  children?: React.ReactNode;
}

declare global {
  interface Window {
    PaystackPop: any;
  }
}

const PaystackPayment: React.FC<PaystackPaymentProps> = ({
  amount,
  email,
  onSuccess,
  onClose,
  children,
}) => {
  useEffect(() => {
    // Load Paystack script if not already loaded
    if (!window.PaystackPop) {
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const handlePayment = () => {
    if (!window.PaystackPop) {
      alert('Paystack is not loaded yet. Please try again.');
      return;
    }

    const paystack = window.PaystackPop.setup({
      key: process.env.REACT_APP_PAYSTACK_PUBLIC_KEY,
      email,
      amount,
      currency: 'KES', // Kenyan Shillings
      callback: (response: any) => {
        onSuccess(response.reference);
      },
      onClose: () => {
        onClose();
      },
    });

    paystack.openIframe();
  };

  return (
    <div onClick={handlePayment} style={{ cursor: 'pointer' }}>
      {children || <button>Pay Now</button>}
    </div>
  );
};

export default PaystackPayment;