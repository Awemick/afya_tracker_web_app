import axios from 'axios';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: async (credentials: { email: string; password: string }) => {
    try {
      return api.post('/auth/login', credentials);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  logout: async () => {
    try {
      return api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },
};

export const providerApprovalAPI = {
  // Get all pending provider approvals
  getPendingProviders: async () => {
    try {
      const usersRef = collection(db as any, 'users');
      const q = query(
        usersRef,
        where('role', '==', 'provider'),
        where('status', '==', 'pending_approval')
      );
      const querySnapshot = await getDocs(q);
      const providers = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { data: providers };
    } catch (error) {
      console.error('Error fetching pending providers from Firebase:', error);
      return api.get('/providers/pending');
    }
  },

  // Approve a provider
  approveProvider: async (providerId: string) => {
    try {
      const providerRef = doc(db as any, 'users', providerId);
      await updateDoc(providerRef, {
        status: 'active',
        approvedAt: new Date().toISOString(),
        approvedBy: 'admin' // In real app, get admin ID from auth
      });
      return { data: { id: providerId, status: 'active', approvedAt: new Date().toISOString(), approvedBy: 'admin' } };
    } catch (error) {
      console.error('Error approving provider in Firebase:', error);
      return api.patch(`/providers/${providerId}/approve`, { adminId: 'admin' });
    }
  },

  // Reject a provider
  rejectProvider: async (providerId: string, reason: string) => {
    try {
      const providerRef = doc(db as any, 'users', providerId);
      await updateDoc(providerRef, {
        status: 'rejected',
        rejectionReason: reason,
        approvedBy: 'admin',
        updatedAt: new Date().toISOString()
      });
      return { data: { id: providerId, status: 'rejected', rejectionReason: reason, approvedBy: 'admin' } };
    } catch (error) {
      console.error('Error rejecting provider in Firebase:', error);
      return api.patch(`/providers/${providerId}/reject`, { adminId: 'admin', reason });
    }
  },

  // Get all providers with their approval status
  getAllProviders: async () => {
    try {
      const usersRef = collection(db as any, 'users');
      const q = query(
        usersRef,
        where('role', '==', 'provider')
      );
      const querySnapshot = await getDocs(q);
      const providers = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { data: providers };
    } catch (error) {
      console.error('Error fetching all providers from Firebase:', error);
      return api.get('/providers');
    }
  },
};

export default api;
