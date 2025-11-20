// import { Paystack } from 'paystack-js';
import { doc, setDoc, collection, query, where, getDocs, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

const PAYSTACK_PUBLIC_KEY = 'pk_test_9cb47519d44bdb60a211df4ae6a6e20282994433'; // Paystack test public key

export class PaystackService {
  private paystack: any = null;

  constructor() {
    this.initializePaystack();
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

  async initializeTransaction(config: {
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

    return handler;
  }

  async verifyPayment(reference: string): Promise<boolean> {
    try {
      // In a real app, you'd call Paystack's verify endpoint from your backend
      // For now, we'll simulate verification and store in Firestore
      await setDoc(doc(db!, 'payments', reference), {
        reference,
        userId: auth!.currentUser?.uid,
        status: 'verified',
        timestamp: new Date(),
      });

      return true;
    } catch (error) {
      console.error('Payment verification failed:', error);
      return false;
    }
  }

  async createSubscription(data: {
    email: string;
    amount: number; // Monthly amount in kobo
    planName: string;
  }) {
    const subscriptionData = {
      userId: auth!.currentUser?.uid,
      email: data.email,
      planName: data.planName,
      amount: data.amount,
      currency: 'KES',
      status: 'active',
      createdAt: new Date(),
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    };

    await setDoc(doc(collection(db!, 'subscriptions')), subscriptionData);
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