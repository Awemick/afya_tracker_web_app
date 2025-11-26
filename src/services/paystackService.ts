import { doc, setDoc, collection, query, where, getDocs, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

const PAYSTACK_SECRET_KEY = 'sk_test_5272a88368a3366346c09a66e192a57fffe7d3e3';

export class PaystackService {
  async initializeTransaction(config: {
    amount: number; // Amount in kobo
    email: string;
    planName: string;
    callback?: (response: any) => void;
    onClose?: () => void;
  }): Promise<string | null> {
    try {
      console.log('Initializing Paystack transaction...');
      console.log('Email:', config.email, 'Amount:', config.amount, 'Plan:', config.planName);

      const requestBody = JSON.stringify({
        email: config.email,
        amount: config.amount,
        currency: 'KES',
        callback_url: 'https://afya-tracker-25392.web.app/payment/callback',
        metadata: {
          plan_name: config.planName,
          user_id: auth?.currentUser?.uid,
        },
      });

      console.log('Request body:', requestBody);

      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: requestBody,
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Response data:', data);

        if (data.status === true) {
          const paymentUrl = data.data.authorization_url;
          console.log('Payment URL:', paymentUrl);
          return paymentUrl;
        } else {
          console.error('Paystack API returned status false:', data.message);
          return null;
        }
      } else {
        const errorText = await response.text();
        console.error('HTTP error:', response.status, '-', errorText);
        return null;
      }
    } catch (error) {
      console.error('Paystack initialization error:', error);
      return null;
    }
  }

  async openPaymentWindow(paymentUrl: string): Promise<boolean> {
    return new Promise((resolve) => {
      // Open payment URL in new window
      const paymentWindow = window.open(
        paymentUrl,
        'paystack-payment',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      if (!paymentWindow) {
        console.error('Failed to open payment window - popup blocked?');
        resolve(false);
        return;
      }

      // Check if payment window is closed
      const checkClosed = setInterval(() => {
        if (paymentWindow.closed) {
          clearInterval(checkClosed);
          resolve(false); // User closed window without completing payment
        }
      }, 1000);

      // Listen for messages from payment window (if implemented)
      const messageHandler = (event: MessageEvent) => {
        if (event.origin.includes('paystack.co') || event.origin.includes('afya-tracker-25392.web.app')) {
          if (event.data === 'payment_success') {
            clearInterval(checkClosed);
            window.removeEventListener('message', messageHandler);
            paymentWindow.close();
            resolve(true);
          }
        }
      };

      window.addEventListener('message', messageHandler);

      // Fallback: check URL changes (limited by CORS)
      // This is a simplified approach - in production, you'd want a more robust solution
    });
  }

  async storePaymentRecord(reference: string, amount: number, email: string, planName: string): Promise<void> {
    try {
      await setDoc(doc(db!, 'payments', reference), {
        reference,
        userId: auth?.currentUser?.uid,
        email,
        amount,
        currency: 'KES',
        planName,
        status: 'completed',
        timestamp: new Date(),
      });

      // Also create/update subscription
      await setDoc(doc(collection(db!, 'subscriptions')), {
        userId: auth?.currentUser?.uid,
        planName,
        amount,
        currency: 'KES',
        status: 'active',
        createdAt: new Date(),
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      });

      console.log('Payment record and subscription stored successfully');
    } catch (error) {
      console.error('Error storing payment record:', error);
      throw error;
    }
  }

  async verifyPayment(reference: string): Promise<boolean> {
    try {
      // Call Paystack's verify endpoint
      const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const status = data.data.status;
        console.log('Payment verification result:', status);
        return status === 'success';
      }

      return false;
    } catch (error) {
      console.error('Payment verification failed:', error);
      return false;
    }
  }

  async processCommission(data: {
    appointmentId: string;
    totalAmount: number;
    commissionRate: number;
  }) {
    const commission = Math.round(data.totalAmount * data.commissionRate);

    await setDoc(doc(collection(db!, 'commissions')), {
      appointmentId: data.appointmentId,
      totalAmount: data.totalAmount,
      commissionRate: data.commissionRate,
      commissionAmount: commission,
      timestamp: new Date(),
    });
  }

  async getUserPayments(): Promise<any[]> {
    if (!auth!.currentUser) return [];

    const q = query(
      collection(db!, 'payments'),
      where('userId', '==', auth!.currentUser!.uid)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async getUserSubscription(): Promise<any | null> {
    if (!auth!.currentUser) return null;

    const q = query(
      collection(db!, 'subscriptions'),
      where('userId', '==', auth!.currentUser!.uid),
      where('status', '==', 'active')
    );

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    return null;
  }
}

export const paystackService = new PaystackService();