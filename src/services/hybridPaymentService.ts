// import { Paystack } from 'paystack-js';
// import { Daraja } from 'daraja-js';
import { doc, setDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

export enum PaymentMethod {
  PAYSTACK = 'paystack',
  MPESA = 'mpesa'
}

const PAYSTACK_PUBLIC_KEY = process.env.REACT_APP_PAYSTACK_PUBLIC_KEY;
const PAYSTACK_SECRET_KEY = process.env.REACT_APP_PAYSTACK_SECRET_KEY;

// M-Pesa Daraja credentials
const MPESA_CONSUMER_KEY = process.env.REACT_APP_MPESA_CONSUMER_KEY;
const MPESA_CONSUMER_SECRET = process.env.REACT_APP_MPESA_CONSUMER_SECRET;
const MPESA_SHORT_CODE = process.env.REACT_APP_MPESA_SHORT_CODE;
const MPESA_PASS_KEY = process.env.REACT_APP_MPESA_PASS_KEY;

export class HybridPaymentService {
  private paystack: any = null;
  private daraja: any = null;

  constructor() {
    this.initializePaystack();
    this.initializeDaraja();
  }

  private async initializePaystack() {
    try {
      // const { default: paystack } = await import('paystack-js');
      // this.paystack = paystack(PAYSTACK_PUBLIC_KEY);
      console.log('Paystack initialization skipped');
    } catch (error) {
      console.error('Failed to initialize Paystack:', error);
    }
  }

  private async initializeDaraja() {
    try {
      // const { Daraja } = await import('daraja-js');
      // this.daraja = new Daraja({
      //   consumerKey: MPESA_CONSUMER_KEY,
      //   consumerSecret: MPESA_CONSUMER_SECRET,
      //   shortCode: MPESA_SHORT_CODE,
      //   passKey: MPESA_PASS_KEY,
      // });
      console.log('Daraja initialization skipped');
    } catch (error) {
      console.error('Failed to initialize Daraja:', error);
    }
  }

  // Paystack WebView Payment
  async initiatePaystackPayment(config: {
    amount: number; // Amount in kobo
    email: string;
    reference: string;
    currency?: string;
    callback?: (response: any) => void;
    onClose?: () => void;
  }) {
    if (!this.paystack) {
      throw new Error('Paystack not initialized');
    }

    const handler = this.paystack.popup({
      key: PAYSTACK_PUBLIC_KEY,
      email: config.email,
      amount: config.amount,
      currency: config.currency || 'KES',
      ref: config.reference,
      callback: config.callback,
      onClose: config.onClose,
    });

    // Store payment request
    await this.storePaymentRequest({
      reference: config.reference,
      method: PaymentMethod.PAYSTACK,
      amount: config.amount,
      email: config.email,
    });

    return handler;
  }

  // M-Pesa STK Push Payment
  async initiateMpesaPayment(data: {
    phoneNumber: string;
    amount: number; // Amount in KES
    accountReference: string;
    transactionDesc: string;
  }): Promise<any> {
    if (!this.daraja) {
      throw new Error('Daraja not initialized');
    }

    try {
      const response = await this.daraja.stkPush({
        phoneNumber: data.phoneNumber,
        amount: data.amount,
        accountReference: data.accountReference,
        transactionDesc: data.transactionDesc,
      });

      // Store payment request
      await this.storePaymentRequest({
        reference: response.CheckoutRequestID,
        method: PaymentMethod.MPESA,
        amount: data.amount,
        phoneNumber: data.phoneNumber,
      });

      return {
        success: true,
        checkoutRequestId: response.CheckoutRequestID,
        responseCode: response.ResponseCode,
        responseDescription: response.ResponseDescription,
      };
    } catch (error) {
      console.error('M-Pesa payment error:', error);
      return {
        success: false,
        error: (error as Error).message || 'M-Pesa payment failed',
      };
    }
  }

  // Check M-Pesa payment status
  async checkMpesaPaymentStatus(checkoutRequestId: string): Promise<any> {
    if (!this.daraja) {
      throw new Error('Daraja not initialized');
    }

    try {
      const response = await this.daraja.stkQuery(checkoutRequestId);

      const resultCode = response.ResultCode;
      const resultDesc = response.ResultDesc;

      // Update payment status
      await this.updatePaymentStatus(checkoutRequestId, resultCode === '0' ? 'completed' : 'failed');

      return {
        success: resultCode === '0',
        status: resultCode === '0' ? 'completed' : 'failed',
        message: resultDesc,
      };
    } catch (error) {
      console.error('M-Pesa status check error:', error);
      return {
        success: false,
        error: (error as Error).message || 'Status check failed',
      };
    }
  }

  // Verify Paystack payment
  async verifyPaystackPayment(reference: string): Promise<boolean> {
    try {
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

        // Update payment status
        await this.updatePaymentStatus(reference, status === 'success' ? 'completed' : 'failed');

        return status === 'success';
      }

      return false;
    } catch (error) {
      console.error('Paystack verification error:', error);
      return false;
    }
  }

  // Store payment request
  private async storePaymentRequest(data: {
    reference: string;
    method: PaymentMethod;
    amount: number;
    phoneNumber?: string;
    email?: string;
  }) {
    if (!db) return;
    await setDoc(doc(db, 'payment_requests', data.reference), {
      reference: data.reference,
      method: data.method,
      amount: data.amount,
      phoneNumber: data.phoneNumber,
      email: data.email,
      userId: auth!.currentUser?.uid,
      status: 'pending',
      createdAt: new Date(),
    });
  }

  // Update payment status
  private async updatePaymentStatus(reference: string, status: string) {
    const paymentRef = doc(db!, 'payment_requests', reference);
    await updateDoc(paymentRef, {
      status,
      updatedAt: new Date(),
    });

    // If payment completed, create a payment record
    if (status === 'completed') {
      const paymentDoc = await getDocs(query(
        collection(db!, 'payment_requests'),
        where('reference', '==', reference)
      ));

      if (!paymentDoc.empty) {
        const data = paymentDoc.docs[0].data();
        await setDoc(doc(collection(db!, 'payments')), {
          reference,
          method: data.method,
          amount: data.amount,
          userId: data.userId,
          status: 'completed',
          completedAt: new Date(),
        });
      }
    }
  }

  // Get user payment history
  async getUserPayments(): Promise<any[]> {
    if (!auth!.currentUser) return [];

    const q = query(
      collection(db!, 'payments'),
      where('userId', '==', auth!.currentUser!.uid)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  // Create subscription
  async createSubscription(data: {
    email: string;
    amount: number;
    planName: string;
    method: PaymentMethod;
  }) {
    const subscriptionData = {
      userId: auth!.currentUser?.uid,
      email: data.email,
      planName: data.planName,
      amount: data.amount,
      method: data.method,
      currency: 'KES',
      status: 'active',
      createdAt: new Date(),
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    };

    await setDoc(doc(collection(db!, 'subscriptions')), subscriptionData);
  }

  // Process commission
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
}

export const hybridPaymentService = new HybridPaymentService();