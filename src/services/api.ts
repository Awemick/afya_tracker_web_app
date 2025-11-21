import axios from 'axios';
import { db, storage } from '../firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { Task, Reminder } from '../types/index';

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

export const patientAPI = {
  // Firebase Firestore methods for real-time data sync
  getAll: async () => {
    try {
      if (!db) {
        // Fallback to REST API when Firestore is not available
        return api.get('/patients');
      }
      const patientsRef = collection(db as any, 'patients');
      const querySnapshot = await getDocs(patientsRef);
      const patients = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { data: patients };
    } catch (error) {
      console.error('Error fetching patients from Firebase:', error);
      // Fallback to REST API
      return api.get('/patients');
    }
  },
  getById: async (id: string) => {
    try {
      if (!db) {
        // Fallback to REST API when Firestore is not available
        return api.get(`/patients/${id}`);
      }
      const patientDoc = await getDoc(doc(db as any, 'patients', id));
      if (patientDoc.exists()) {
        return { data: { id: patientDoc.id, ...patientDoc.data() } };
      }
      throw new Error('Patient not found');
    } catch (error) {
      console.error('Error fetching patient from Firebase:', error);
      // Fallback to REST API
      return api.get(`/patients/${id}`);
    }
  },
  getKickSessions: (patientId: string) => api.get(`/patients/${patientId}/kick-sessions`),
  createConsultation: async (data: any) => {
    try {
      if (!db) {
        // Fallback to REST API when Firestore is not available
        return api.post('/consultations', data);
      }
      const docRef = await addDoc(collection(db as any, 'consultations'), {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return { data: { id: docRef.id, ...data } };
    } catch (error) {
      console.error('Error creating consultation in Firebase:', error);
      // Fallback to REST API
      return api.post('/consultations', data);
    }
  },
};

export const alertAPI = {
  getAll: async () => {
    try {
      const alertsRef = collection(db as any, 'alerts');
      const q = query(alertsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const alerts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { data: alerts };
    } catch (error) {
      console.error('Error fetching alerts from Firebase:', error);
      return api.get('/alerts');
    }
  },
  getActive: async () => {
    try {
      const alertsRef = collection(db as any, 'alerts');
      const q = query(alertsRef, where('status', '==', 'active'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const alerts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { data: alerts };
    } catch (error) {
      console.error('Error fetching active alerts from Firebase:', error);
      return api.get('/alerts/active');
    }
  },
  resolve: async (alertId: string, data: any) => {
    try {
      const alertRef = doc(db as any, 'alerts', alertId);
      await updateDoc(alertRef, {
        ...data,
        status: 'resolved',
        resolvedAt: new Date(),
        updatedAt: new Date()
      });
      return { data: { id: alertId, ...data } };
    } catch (error) {
      console.error('Error resolving alert in Firebase:', error);
      return api.patch(`/alerts/${alertId}/resolve`, data);
    }
  },
};

export const authAPI = {
  login: async (credentials: { email: string; password: string }) => {
    try {
      // For now, keep the REST API for authentication
      // Firebase Auth can be integrated later if needed
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

export const messagingAPI = {
  getConversations: async (userId: string) => {
    try {
      const conversationsRef = collection(db as any, 'conversations');
      const q = query(
        conversationsRef,
        where('patientId', '==', userId),
        orderBy('updatedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const conversations = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { data: conversations };
    } catch (error) {
      console.error('Error fetching conversations from Firebase:', error);
      return api.get(`/conversations?userId=${userId}`);
    }
  },
  getMessages: async (conversationId: string) => {
    try {
      const messagesRef = collection(db as any, 'messages');
      const q = query(
        messagesRef,
        where('conversationId', '==', conversationId),
        orderBy('timestamp', 'asc')
      );
      const querySnapshot = await getDocs(q);
      const messages = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { data: messages };
    } catch (error) {
      console.error('Error fetching messages from Firebase:', error);
      return api.get(`/messages?conversationId=${conversationId}`);
    }
  },
  sendMessage: async (message: any) => {
    try {
      const docRef = await addDoc(collection(db as any, 'messages'), {
        ...message,
        timestamp: new Date(),
        read: false
      });
      // Update conversation's last message and updatedAt
      const conversationRef = doc(db as any, 'conversations', message.conversationId);
      await updateDoc(conversationRef, {
        lastMessage: { id: docRef.id, ...message, timestamp: new Date() },
        updatedAt: new Date()
      });
      return { data: { id: docRef.id, ...message } };
    } catch (error) {
      console.error('Error sending message in Firebase:', error);
      return api.post('/messages', message);
    }
  },
  markAsRead: async (messageId: string) => {
    try {
      const messageRef = doc(db as any, 'messages', messageId);
      await updateDoc(messageRef, { read: true });
      return { data: { id: messageId, read: true } };
    } catch (error) {
      console.error('Error marking message as read in Firebase:', error);
      return api.patch(`/messages/${messageId}/read`);
    }
  },
};

export const notificationAPI = {
  getNotifications: async (userId: string) => {
    try {
      const notificationsRef = collection(db as any, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const notifications = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { data: notifications };
    } catch (error) {
      console.error('Error fetching notifications from Firebase:', error);
      return api.get(`/notifications?userId=${userId}`);
    }
  },
  markAsRead: async (notificationId: string) => {
    try {
      const notificationRef = doc(db as any, 'notifications', notificationId);
      await updateDoc(notificationRef, { read: true });
      return { data: { id: notificationId, read: true } };
    } catch (error) {
      console.error('Error marking notification as read in Firebase:', error);
      return api.patch(`/notifications/${notificationId}/read`);
    }
  },
  createNotification: async (notification: any) => {
    try {
      const docRef = await addDoc(collection(db as any, 'notifications'), {
        ...notification,
        timestamp: new Date(),
        read: false
      });
      return { data: { id: docRef.id, ...notification } };
    } catch (error) {
      console.error('Error creating notification in Firebase:', error);
      return api.post('/notifications', notification);
    }
  },
};

export const appointmentAPI = {
  getAppointments: async (userId: string, userRole: 'patient' | 'provider') => {
    try {
      const appointmentsRef = collection(db as any, 'appointments');
      const field = userRole === 'patient' ? 'patientId' : 'doctorId';
      const q = query(
        appointmentsRef,
        where(field, '==', userId),
        orderBy('scheduledTime', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const appointments = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { data: appointments };
    } catch (error) {
      console.error('Error fetching appointments from Firebase:', error);
      return api.get(`/appointments?${userRole}Id=${userId}`);
    }
  },
  createAppointment: async (appointment: any) => {
    try {
      const docRef = await addDoc(collection(db as any, 'appointments'), {
        ...appointment,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return { data: { id: docRef.id, ...appointment } };
    } catch (error) {
      console.error('Error creating appointment in Firebase:', error);
      return api.post('/appointments', appointment);
    }
  },
  updateAppointment: async (appointmentId: string, updates: any) => {
    try {
      const appointmentRef = doc(db as any, 'appointments', appointmentId);
      await updateDoc(appointmentRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      return { data: { id: appointmentId, ...updates } };
    } catch (error) {
      console.error('Error updating appointment in Firebase:', error);
      return api.patch(`/appointments/${appointmentId}`, updates);
    }
  },
  cancelAppointment: async (appointmentId: string) => {
    try {
      const appointmentRef = doc(db as any, 'appointments', appointmentId);
      await updateDoc(appointmentRef, {
        status: 'cancelled',
        updatedAt: new Date().toISOString()
      });
      return { data: { id: appointmentId, status: 'cancelled' } };
    } catch (error) {
      console.error('Error cancelling appointment in Firebase:', error);
      return api.patch(`/appointments/${appointmentId}/cancel`);
    }
  },
};

export const doctorAvailabilityAPI = {
  getAvailability: async (doctorId: string) => {
    try {
      const availabilityRef = collection(db as any, 'doctor_availability');
      const q = query(availabilityRef, where('doctorId', '==', doctorId));
      const querySnapshot = await getDocs(q);
      const availability = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { data: availability };
    } catch (error) {
      console.error('Error fetching doctor availability from Firebase:', error);
      return api.get(`/doctor-availability?doctorId=${doctorId}`);
    }
  },
  updateAvailability: async (availability: any) => {
    try {
      const availabilityRef = collection(db as any, 'doctor_availability');
      const q = query(
        availabilityRef,
        where('doctorId', '==', availability.doctorId),
        where('dayOfWeek', '==', availability.dayOfWeek)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Update existing
        const docId = querySnapshot.docs[0].id;
        await updateDoc(doc(db as any, 'doctor_availability', docId), availability);
        return { data: { id: docId, ...availability } };
      } else {
        // Create new
        const docRef = await addDoc(collection(db as any, 'doctor_availability'), availability);
        return { data: { id: docRef.id, ...availability } };
      }
    } catch (error) {
      console.error('Error updating doctor availability in Firebase:', error);
      return api.post('/doctor-availability', availability);
    }
  },
  blockTimeSlot: async (doctorId: string, dateTime: string) => {
    try {
      // Find the availability for this doctor and day
      const dayOfWeek = new Date(dateTime).getDay();
      const availabilityRef = collection(db as any, 'doctor_availability');
      const q = query(
        availabilityRef,
        where('doctorId', '==', doctorId),
        where('dayOfWeek', '==', dayOfWeek)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docId = querySnapshot.docs[0].id;
        const currentData = querySnapshot.docs[0].data();
        const blockedSlots = currentData.blockedSlots || [];
        if (!blockedSlots.includes(dateTime)) {
          blockedSlots.push(dateTime);
          await updateDoc(doc(db as any, 'doctor_availability', docId), {
            blockedSlots
          });
        }
      }
      return { data: { success: true } };
    } catch (error) {
      console.error('Error blocking time slot in Firebase:', error);
      return api.post(`/doctor-availability/block`, { doctorId, dateTime });
    }
  },
};

export const prescriptionAPI = {
  getPrescriptions: async (userId: string, userRole: 'patient' | 'provider') => {
    try {
      const prescriptionsRef = collection(db as any, 'prescriptions');
      const field = userRole === 'patient' ? 'patientId' : 'doctorId';
      const q = query(
        prescriptionsRef,
        where(field, '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const prescriptions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { data: prescriptions };
    } catch (error) {
      console.error('Error fetching prescriptions from Firebase:', error);
      return api.get(`/prescriptions?${userRole}Id=${userId}`);
    }
  },
  getPrescriptionById: async (prescriptionId: string) => {
    try {
      const prescriptionDoc = await getDoc(doc(db as any, 'prescriptions', prescriptionId));
      if (prescriptionDoc.exists()) {
        return { data: { id: prescriptionDoc.id, ...prescriptionDoc.data() } };
      }
      throw new Error('Prescription not found');
    } catch (error) {
      console.error('Error fetching prescription from Firebase:', error);
      return api.get(`/prescriptions/${prescriptionId}`);
    }
  },
  createPrescription: async (prescription: any) => {
    try {
      const docRef = await addDoc(collection(db as any, 'prescriptions'), {
        ...prescription,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active'
      });
      return { data: { id: docRef.id, ...prescription } };
    } catch (error) {
      console.error('Error creating prescription in Firebase:', error);
      return api.post('/prescriptions', prescription);
    }
  },
  updatePrescription: async (prescriptionId: string, updates: any) => {
    try {
      const prescriptionRef = doc(db as any, 'prescriptions', prescriptionId);
      await updateDoc(prescriptionRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      return { data: { id: prescriptionId, ...updates } };
    } catch (error) {
      console.error('Error updating prescription in Firebase:', error);
      return api.patch(`/prescriptions/${prescriptionId}`, updates);
    }
  },
  deletePrescription: async (prescriptionId: string) => {
    try {
      await deleteDoc(doc(db as any, 'prescriptions', prescriptionId));
      return { data: { id: prescriptionId, deleted: true } };
    } catch (error) {
      console.error('Error deleting prescription in Firebase:', error);
      return api.delete(`/prescriptions/${prescriptionId}`);
    }
  },
  getPatientPrescriptions: async (patientId: string) => {
    try {
      const prescriptionsRef = collection(db as any, 'prescriptions');
      const q = query(
        prescriptionsRef,
        where('patientId', '==', patientId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const prescriptions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { data: prescriptions };
    } catch (error) {
      console.error('Error fetching patient prescriptions from Firebase:', error);
      return api.get(`/patients/${patientId}/prescriptions`);
    }
  },
};

export const progressNotesAPI = {
  // Get all notes for a patient
  getPatientNotes: async (patientId: string) => {
    try {
      const notesRef = collection(db as any, 'progress_notes');
      const q = query(
        notesRef,
        where('patientId', '==', patientId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const notes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { data: notes };
    } catch (error) {
      console.error('Error fetching patient notes from Firebase:', error);
      return api.get(`/patients/${patientId}/progress-notes`);
    }
  },

  // Get all notes for a doctor
  getDoctorNotes: async (doctorId: string) => {
    try {
      const notesRef = collection(db as any, 'progress_notes');
      const q = query(
        notesRef,
        where('doctorId', '==', doctorId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const notes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { data: notes };
    } catch (error) {
      console.error('Error fetching doctor notes from Firebase:', error);
      return api.get(`/doctors/${doctorId}/progress-notes`);
    }
  },

  // Get a single note by ID
  getNoteById: async (noteId: string) => {
    try {
      const noteDoc = await getDoc(doc(db as any, 'progress_notes', noteId));
      if (noteDoc.exists()) {
        return { data: { id: noteDoc.id, ...noteDoc.data() } };
      }
      throw new Error('Note not found');
    } catch (error) {
      console.error('Error fetching note from Firebase:', error);
      return api.get(`/progress-notes/${noteId}`);
    }
  },

  // Create a new note
  createNote: async (note: any) => {
    try {
      const docRef = await addDoc(collection(db as any, 'progress_notes'), {
        ...note,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return { data: { id: docRef.id, ...note } };
    } catch (error) {
      console.error('Error creating note in Firebase:', error);
      return api.post('/progress-notes', note);
    }
  },

  // Update a note
  updateNote: async (noteId: string, updates: any) => {
    try {
      const noteRef = doc(db as any, 'progress_notes', noteId);
      await updateDoc(noteRef, {
        ...updates,
        updatedAt: new Date()
      });
      return { data: { id: noteId, ...updates } };
    } catch (error) {
      console.error('Error updating note in Firebase:', error);
      return api.patch(`/progress-notes/${noteId}`, updates);
    }
  },

  // Delete a note
  deleteNote: async (noteId: string) => {
    try {
      await deleteDoc(doc(db as any, 'progress_notes', noteId));
      return { data: { id: noteId, deleted: true } };
    } catch (error) {
      console.error('Error deleting note in Firebase:', error);
      return api.delete(`/progress-notes/${noteId}`);
    }
  },

  // Approve a note for patient visibility
  approveNote: async (noteId: string, approvedBy: string) => {
    try {
      const noteRef = doc(db as any, 'progress_notes', noteId);
      await updateDoc(noteRef, {
        status: 'approved',
        approvedAt: new Date(),
        approvedBy,
        updatedAt: new Date()
      });
      return { data: { id: noteId, status: 'approved', approvedAt: new Date(), approvedBy } };
    } catch (error) {
      console.error('Error approving note in Firebase:', error);
      return api.patch(`/progress-notes/${noteId}/approve`, { approvedBy });
    }
  },

  // Make note visible to patient
  makeNoteVisible: async (noteId: string) => {
    try {
      const noteRef = doc(db as any, 'progress_notes', noteId);
      await updateDoc(noteRef, {
        status: 'visible',
        updatedAt: new Date()
      });
      return { data: { id: noteId, status: 'visible' } };
    } catch (error) {
      console.error('Error making note visible in Firebase:', error);
      return api.patch(`/progress-notes/${noteId}/visible`);
    }
  },
};

export const recommendationsAPI = {
  // Get recommendations for a note
  getNoteRecommendations: async (noteId: string) => {
    try {
      const recommendationsRef = collection(db as any, 'recommendations');
      const q = query(
        recommendationsRef,
        where('noteId', '==', noteId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const recommendations = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { data: recommendations };
    } catch (error) {
      console.error('Error fetching recommendations from Firebase:', error);
      return api.get(`/progress-notes/${noteId}/recommendations`);
    }
  },

  // Get all recommendations for a patient
  getPatientRecommendations: async (patientId: string) => {
    try {
      // First get all notes for the patient
      const notesRef = collection(db as any, 'progress_notes');
      const notesQuery = query(
        notesRef,
        where('patientId', '==', patientId)
      );
      const notesSnapshot = await getDocs(notesQuery);
      const noteIds = notesSnapshot.docs.map(doc => doc.id);

      if (noteIds.length === 0) {
        return { data: [] };
      }

      // Then get recommendations for those notes
      const recommendationsRef = collection(db as any, 'recommendations');
      const recommendationsQuery = query(
        recommendationsRef,
        where('noteId', 'in', noteIds.slice(0, 10)), // Firestore 'in' limit is 10
        orderBy('createdAt', 'desc')
      );
      const recommendationsSnapshot = await getDocs(recommendationsQuery);
      const recommendations = recommendationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { data: recommendations };
    } catch (error) {
      console.error('Error fetching patient recommendations from Firebase:', error);
      return api.get(`/patients/${patientId}/recommendations`);
    }
  },

  // Create a recommendation
  createRecommendation: async (recommendation: any) => {
    try {
      const docRef = await addDoc(collection(db as any, 'recommendations'), {
        ...recommendation,
        createdAt: new Date()
      });
      return { data: { id: docRef.id, ...recommendation } };
    } catch (error) {
      console.error('Error creating recommendation in Firebase:', error);
      return api.post('/recommendations', recommendation);
    }
  },

  // Update a recommendation
  updateRecommendation: async (recommendationId: string, updates: any) => {
    try {
      const recommendationRef = doc(db as any, 'recommendations', recommendationId);
      await updateDoc(recommendationRef, updates);
      return { data: { id: recommendationId, ...updates } };
    } catch (error) {
      console.error('Error updating recommendation in Firebase:', error);
      return api.patch(`/recommendations/${recommendationId}`, updates);
    }
  },

  // Complete a recommendation
  completeRecommendation: async (recommendationId: string) => {
    try {
      const recommendationRef = doc(db as any, 'recommendations', recommendationId);
      await updateDoc(recommendationRef, {
        status: 'completed',
        completedAt: new Date()
      });
      return { data: { id: recommendationId, status: 'completed', completedAt: new Date() } };
    } catch (error) {
      console.error('Error completing recommendation in Firebase:', error);
      return api.patch(`/recommendations/${recommendationId}/complete`);
    }
  },

  // Delete a recommendation
  deleteRecommendation: async (recommendationId: string) => {
    try {
      await deleteDoc(doc(db as any, 'recommendations', recommendationId));
      return { data: { id: recommendationId, deleted: true } };
    } catch (error) {
      console.error('Error deleting recommendation in Firebase:', error);
      return api.delete(`/recommendations/${recommendationId}`);
    }
  },
};

export const institutionAPI = {
  // Get all institutions
  getAll: async () => {
    try {
      const institutionsRef = collection(db as any, 'institutions');
      const querySnapshot = await getDocs(institutionsRef);
      const institutions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { data: institutions };
    } catch (error) {
      console.error('Error fetching institutions from Firebase:', error);
      return api.get('/institutions');
    }
  },

  // Get institution by ID
  getById: async (id: string) => {
    try {
      const institutionDoc = await getDoc(doc(db as any, 'institutions', id));
      if (institutionDoc.exists()) {
        return { data: { id: institutionDoc.id, ...institutionDoc.data() } };
      }
      throw new Error('Institution not found');
    } catch (error) {
      console.error('Error fetching institution from Firebase:', error);
      return api.get(`/institutions/${id}`);
    }
  },

  // Create institution
  create: async (institution: any) => {
    try {
      const docRef = await addDoc(collection(db as any, 'institutions'), {
        ...institution,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return { data: { id: docRef.id, ...institution } };
    } catch (error) {
      console.error('Error creating institution in Firebase:', error);
      return api.post('/institutions', institution);
    }
  },

  // Update institution
  update: async (id: string, updates: any) => {
    try {
      const institutionRef = doc(db as any, 'institutions', id);
      await updateDoc(institutionRef, {
        ...updates,
        updatedAt: new Date()
      });
      return { data: { id, ...updates } };
    } catch (error) {
      console.error('Error updating institution in Firebase:', error);
      return api.patch(`/institutions/${id}`, updates);
    }
  },

  // Delete institution
  delete: async (id: string) => {
    try {
      await deleteDoc(doc(db as any, 'institutions', id));
      return { data: { id, deleted: true } };
    } catch (error) {
      console.error('Error deleting institution in Firebase:', error);
      return api.delete(`/institutions/${id}`);
    }
  },
};

export const staffAPI = {
  // Get staff by institution
  getByInstitution: async (institutionId: string) => {
    try {
      const staffRef = collection(db as any, 'staff_members');
      const q = query(staffRef, where('institutionId', '==', institutionId));
      const querySnapshot = await getDocs(q);
      const staff = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { data: staff };
    } catch (error) {
      console.error('Error fetching staff from Firebase:', error);
      return api.get(`/institutions/${institutionId}/staff`);
    }
  },

  // Get staff member by ID
  getById: async (id: string) => {
    try {
      const staffDoc = await getDoc(doc(db as any, 'staff_members', id));
      if (staffDoc.exists()) {
        return { data: { id: staffDoc.id, ...staffDoc.data() } };
      }
      throw new Error('Staff member not found');
    } catch (error) {
      console.error('Error fetching staff member from Firebase:', error);
      return api.get(`/staff/${id}`);
    }
  },

  // Create staff member
  create: async (staff: any) => {
    try {
      const docRef = await addDoc(collection(db as any, 'staff_members'), {
        ...staff,
        joinedAt: new Date()
      });
      return { data: { id: docRef.id, ...staff } };
    } catch (error) {
      console.error('Error creating staff member in Firebase:', error);
      return api.post('/staff', staff);
    }
  },

  // Update staff member
  update: async (id: string, updates: any) => {
    try {
      const staffRef = doc(db as any, 'staff_members', id);
      await updateDoc(staffRef, updates);
      return { data: { id, ...updates } };
    } catch (error) {
      console.error('Error updating staff member in Firebase:', error);
      return api.patch(`/staff/${id}`, updates);
    }
  },

  // Delete staff member
  delete: async (id: string) => {
    try {
      await deleteDoc(doc(db as any, 'staff_members', id));
      return { data: { id, deleted: true } };
    } catch (error) {
      console.error('Error deleting staff member in Firebase:', error);
      return api.delete(`/staff/${id}`);
    }
  },
};

export const patientLinksAPI = {
  // Get all links for a patient
  getPatientLinks: async (patientId: string) => {
    try {
      const linksRef = collection(db as any, 'patient_links');
      const q = query(
        linksRef,
        where('patientId', '==', patientId),
        orderBy('linkedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const links = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { data: links };
    } catch (error) {
      console.error('Error fetching patient links from Firebase:', error);
      return api.get(`/patients/${patientId}/links`);
    }
  },

  // Get all links for an institution
  getInstitutionLinks: async (institutionId: string) => {
    try {
      const linksRef = collection(db as any, 'patient_links');
      const q = query(
        linksRef,
        where('institutionId', '==', institutionId),
        orderBy('linkedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const links = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { data: links };
    } catch (error) {
      console.error('Error fetching institution links from Firebase:', error);
      return api.get(`/institutions/${institutionId}/links`);
    }
  },

  // Get link by ID
  getLinkById: async (linkId: string) => {
    try {
      const linkDoc = await getDoc(doc(db as any, 'patient_links', linkId));
      if (linkDoc.exists()) {
        return { data: { id: linkDoc.id, ...linkDoc.data() } };
      }
      throw new Error('Link not found');
    } catch (error) {
      console.error('Error fetching link from Firebase:', error);
      return api.get(`/links/${linkId}`);
    }
  },

  // Create a new patient link
  createLink: async (link: any) => {
    try {
      const docRef = await addDoc(collection(db as any, 'patient_links'), {
        ...link,
        linkedAt: new Date(),
        status: 'pending'
      });
      return { data: { id: docRef.id, ...link } };
    } catch (error) {
      console.error('Error creating link in Firebase:', error);
      return api.post('/links', link);
    }
  },

  // Update a link
  updateLink: async (linkId: string, updates: any) => {
    try {
      const linkRef = doc(db as any, 'patient_links', linkId);
      await updateDoc(linkRef, updates);
      return { data: { id: linkId, ...updates } };
    } catch (error) {
      console.error('Error updating link in Firebase:', error);
      return api.patch(`/links/${linkId}`, updates);
    }
  },

  // Delete a link
  deleteLink: async (linkId: string) => {
    try {
      await deleteDoc(doc(db as any, 'patient_links', linkId));
      return { data: { id: linkId, deleted: true } };
    } catch (error) {
      console.error('Error deleting link in Firebase:', error);
      return api.delete(`/links/${linkId}`);
    }
  },

  // Generate QR code for institution
  generateQRCode: async (institutionId: string) => {
    try {
      // Generate a unique code
      const linkCode = `QR_${institutionId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const docRef = await addDoc(collection(db as any, 'patient_links'), {
        institutionId,
        linkType: 'qr',
        linkCode,
        linkedAt: new Date(),
        status: 'pending',
        permissions: {
          viewRecords: false,
          createConsultations: false,
          managePrescriptions: false,
          sendNotifications: false,
          shareData: false,
        },
        metadata: {
          source: 'online',
          tags: ['qr_generated']
        }
      });
      return { data: { id: docRef.id, linkCode } };
    } catch (error) {
      console.error('Error generating QR code in Firebase:', error);
      return api.post('/links/generate-qr', { institutionId });
    }
  },

  // Generate referral code
  generateReferralCode: async (institutionId: string, referrerId?: string) => {
    try {
      const linkCode = `REF_${institutionId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const docRef = await addDoc(collection(db as any, 'patient_links'), {
        institutionId,
        linkType: 'referral',
        linkCode,
        linkedAt: new Date(),
        status: 'pending',
        permissions: {
          viewRecords: false,
          createConsultations: false,
          managePrescriptions: false,
          sendNotifications: false,
          shareData: false,
        },
        metadata: {
          source: 'referral',
          referrer: referrerId,
          tags: ['referral_generated']
        }
      });
      return { data: { id: docRef.id, linkCode } };
    } catch (error) {
      console.error('Error generating referral code in Firebase:', error);
      return api.post('/links/generate-referral', { institutionId, referrerId });
    }
  },

  // Validate and link using code
  validateAndLink: async (linkCode: string, patientId: string) => {
    try {
      const linksRef = collection(db as any, 'patient_links');
      const q = query(
        linksRef,
        where('linkCode', '==', linkCode),
        where('status', '==', 'pending')
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error('Invalid or expired link code');
      }

      const linkDoc = querySnapshot.docs[0];
      const linkData = linkDoc.data();

      // Update the link with patient info
      await updateDoc(doc(db as any, 'patient_links', linkDoc.id), {
        patientId,
        status: 'active',
        linkedBy: patientId
      });

      return { data: { id: linkDoc.id, ...linkData, patientId, status: 'active' } };
    } catch (error) {
      console.error('Error validating link code in Firebase:', error);
      return api.post('/links/validate', { linkCode, patientId });
    }
  },
};


export const analyticsAPI = {
  // Get analytics data for an institution
  getAnalyticsData: async (institutionId: string, filters?: any) => {
    try {
      const analyticsRef = collection(db as any, 'analytics_data');
      let q = query(analyticsRef, where('institutionId', '==', institutionId));

      if (filters?.dateRange) {
        q = query(q, where('date', '>=', filters.dateRange.startDate));
        q = query(q, where('date', '<=', filters.dateRange.endDate));
      }

      if (filters?.metricType) {
        q = query(q, where('metricType', '==', filters.metricType));
      }

      const querySnapshot = await getDocs(q);
      const analyticsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { data: analyticsData };
    } catch (error) {
      console.error('Error fetching analytics data from Firebase:', error);
      return api.get(`/institutions/${institutionId}/analytics`, { params: filters });
    }
  },

  // Get reports for an institution
  getReports: async (institutionId: string) => {
    try {
      const reportsRef = collection(db as any, 'reports');
      const q = query(
        reportsRef,
        where('institutionId', '==', institutionId),
        orderBy('generatedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const reports = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { data: reports };
    } catch (error) {
      console.error('Error fetching reports from Firebase:', error);
      return api.get(`/institutions/${institutionId}/reports`);
    }
  },

  // Generate a new report
  generateReport: async (reportData: any) => {
    try {
      const docRef = await addDoc(collection(db as any, 'reports'), {
        ...reportData,
        generatedAt: new Date(),
        status: 'generating'
      });
      return { data: { id: docRef.id, ...reportData } };
    } catch (error) {
      console.error('Error generating report in Firebase:', error);
      return api.post('/reports/generate', reportData);
    }
  },

  // Get report by ID
  getReportById: async (reportId: string) => {
    try {
      const reportDoc = await getDoc(doc(db as any, 'reports', reportId));
      if (reportDoc.exists()) {
        return { data: { id: reportDoc.id, ...reportDoc.data() } };
      }
      throw new Error('Report not found');
    } catch (error) {
      console.error('Error fetching report from Firebase:', error);
      return api.get(`/reports/${reportId}`);
    }
  },

  // Update report status
  updateReportStatus: async (reportId: string, status: string, fileUrl?: string) => {
    try {
      const updateData: any = { status };
      if (fileUrl) updateData.fileUrl = fileUrl;
      await updateDoc(doc(db as any, 'reports', reportId), updateData);
      return { data: { id: reportId, status, fileUrl } };
    } catch (error) {
      console.error('Error updating report status in Firebase:', error);
      return api.patch(`/reports/${reportId}/status`, { status, fileUrl });
    }
  },

  // Add analytics data point
  addAnalyticsData: async (data: any) => {
    try {
      const docRef = await addDoc(collection(db as any, 'analytics_data'), {
        ...data,
        createdAt: new Date()
      });
      return { data: { id: docRef.id, ...data } };
    } catch (error) {
      console.error('Error adding analytics data in Firebase:', error);
      return api.post('/analytics/data', data);
    }
  },

  // Get aggregated analytics for dashboard
  getDashboardAnalytics: async (institutionId: string, dateRange?: any) => {
    try {
      const analyticsRef = collection(db as any, 'analytics_data');
      let q = query(analyticsRef, where('institutionId', '==', institutionId));

      if (dateRange) {
        q = query(q, where('date', '>=', dateRange.startDate));
        q = query(q, where('date', '<=', dateRange.endDate));
      }

      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Aggregate data by metric type
      const aggregated = data.reduce((acc: any, item: any) => {
        const type = item.metricType;
        if (!acc[type]) acc[type] = 0;
        acc[type] += item.value;
        return acc;
      }, {});

      return { data: aggregated };
    } catch (error) {
      console.error('Error fetching dashboard analytics from Firebase:', error);
      return api.get(`/institutions/${institutionId}/dashboard-analytics`, { params: { dateRange } });
    }
  },
};

export const medicalRecordsAPI = {
  // Upload a file to Firebase Storage and create record metadata
  uploadFile: async (file: File, metadata: any, onProgress?: (progress: number) => void) => {
    try {
      // Create unique file path
      const fileExtension = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
      const filePath = `medical_records/${metadata.patientId}/${fileName}`;

      // Upload to Firebase Storage
      const storageRef = ref(storage as any, filePath);
      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress?.(progress);
          },
          (error) => {
            console.error('Error uploading file:', error);
            reject(error);
          },
          async () => {
            try {
              // Get download URL
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

              // Create record in Firestore
              const recordData = {
                ...metadata,
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
                storageUrl: downloadURL,
                uploadedAt: new Date(),
                lastAccessed: null,
                version: 1,
              };

              const docRef = await addDoc(collection(db as any, 'medical_records'), recordData);
              resolve({ data: { id: docRef.id, ...recordData } });
            } catch (error) {
              console.error('Error creating record metadata:', error);
              reject(error);
            }
          }
        );
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },

  // Get all records for a patient (with permission check)
  getPatientRecords: async (patientId: string, userId?: string, userRole?: string) => {
    try {
      const recordsRef = collection(db as any, 'medical_records');
      const q = query(
        recordsRef,
        where('patientId', '==', patientId),
        orderBy('uploadedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      let records = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

      // Filter records based on user permissions
      if (userId && userRole !== 'admin') {
        records = records.filter((record: any) =>
          record.accessPermissions?.view?.includes(userId) ||
          record.uploadedBy === userId
        );
      }

      return { data: records };
    } catch (error) {
      console.error('Error fetching patient records from Firebase:', error);
      return api.get(`/patients/${patientId}/medical-records`);
    }
  },

  // Get all records for an institution
  getInstitutionRecords: async (institutionId: string, filters?: any) => {
    try {
      const recordsRef = collection(db as any, 'medical_records');
      let q = query(
        recordsRef,
        where('institutionId', '==', institutionId),
        orderBy('uploadedAt', 'desc')
      );

      if (filters?.category) {
        q = query(q, where('category', '==', filters.category));
      }

      if (filters?.limit) {
        q = query(q, limit(filters.limit));
      }

      const querySnapshot = await getDocs(q);
      const records = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { data: records };
    } catch (error) {
      console.error('Error fetching institution records from Firebase:', error);
      return api.get(`/institutions/${institutionId}/medical-records`, { params: filters });
    }
  },

  // Get record by ID
  getRecordById: async (recordId: string) => {
    try {
      const recordDoc = await getDoc(doc(db as any, 'medical_records', recordId));
      if (recordDoc.exists()) {
        // Update last accessed
        await updateDoc(doc(db as any, 'medical_records', recordId), {
          lastAccessed: new Date()
        });
        return { data: { id: recordDoc.id, ...recordDoc.data() } };
      }
      throw new Error('Medical record not found');
    } catch (error) {
      console.error('Error fetching record from Firebase:', error);
      return api.get(`/medical-records/${recordId}`);
    }
  },

  // Update record metadata
  updateRecord: async (recordId: string, updates: any) => {
    try {
      const recordRef = doc(db as any, 'medical_records', recordId);
      await updateDoc(recordRef, updates);
      return { data: { id: recordId, ...updates } };
    } catch (error) {
      console.error('Error updating record in Firebase:', error);
      return api.patch(`/medical-records/${recordId}`, updates);
    }
  },

  // Update record permissions
  updateRecordPermissions: async (recordId: string, permissions: any) => {
    try {
      const recordRef = doc(db as any, 'medical_records', recordId);
      await updateDoc(recordRef, { accessPermissions: permissions });
      return { data: { id: recordId, accessPermissions: permissions } };
    } catch (error) {
      console.error('Error updating record permissions in Firebase:', error);
      return api.patch(`/medical-records/${recordId}/permissions`, { permissions });
    }
  },

  // Delete record and file
  deleteRecord: async (recordId: string) => {
    try {
      // Get record data first to get storage URL
      const recordDoc = await getDoc(doc(db as any, 'medical_records', recordId));
      if (recordDoc.exists()) {
        const recordData = recordDoc.data();

        // Delete from Storage if URL exists
        if (recordData.storageUrl) {
          try {
            const fileRef = ref(storage as any, recordData.storageUrl);
            await deleteObject(fileRef);
          } catch (storageError) {
            console.warn('Error deleting file from storage:', storageError);
          }
        }

        // Delete from Firestore
        await deleteDoc(doc(db as any, 'medical_records', recordId));
        return { data: { id: recordId, deleted: true } };
      }
      throw new Error('Medical record not found');
    } catch (error) {
      console.error('Error deleting record from Firebase:', error);
      return api.delete(`/medical-records/${recordId}`);
    }
  },

  // Search records
  searchRecords: async (institutionId: string, searchTerm: string, filters?: any) => {
    try {
      const recordsRef = collection(db as any, 'medical_records');
      let q = query(
        recordsRef,
        where('institutionId', '==', institutionId),
        orderBy('uploadedAt', 'desc')
      );

      // Note: Firebase doesn't support full-text search natively
      // This is a basic implementation - you might want to use Algolia or similar
      const querySnapshot = await getDocs(q);
      let records = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

      // Client-side filtering
      if (searchTerm) {
        records = records.filter(record =>
          record.fileName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }

      if (filters?.category) {
        records = records.filter(record => record.category === filters.category);
      }

      if (filters?.patientId) {
        records = records.filter(record => record.patientId === filters.patientId);
      }

      return { data: records };
    } catch (error) {
      console.error('Error searching records from Firebase:', error);
      return api.get(`/institutions/${institutionId}/medical-records/search`, {
        params: { searchTerm, ...filters }
      });
    }
  },

  // Get records by category
  getRecordsByCategory: async (institutionId: string, category: string) => {
    try {
      const recordsRef = collection(db as any, 'medical_records');
      const q = query(
        recordsRef,
        where('institutionId', '==', institutionId),
        where('category', '==', category),
        orderBy('uploadedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const records = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { data: records };
    } catch (error) {
      console.error('Error fetching records by category from Firebase:', error);
      return api.get(`/institutions/${institutionId}/medical-records/category/${category}`);
    }
  },
};


export const referralAPI = {
  // Get all referrals for a user (patient or provider)
  getReferrals: async (userId: string, userRole: 'patient' | 'provider') => {
    try {
      const referralsRef = collection(db as any, 'referrals');
      let q;

      if (userRole === 'patient') {
        q = query(
          referralsRef,
          where('patientId', '==', userId),
          orderBy('createdAt', 'desc')
        );
      } else {
        // For providers, get referrals they created or are assigned to
        q = query(
          referralsRef,
          where('referringDoctorId', '==', userId),
          orderBy('createdAt', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);
      const referrals = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { data: referrals };
    } catch (error) {
      console.error('Error fetching referrals from Firebase:', error);
      return api.get(`/referrals?userId=${userId}&userRole=${userRole}`);
    }
  },

  // Get referrals for an institution
  getInstitutionReferrals: async (institutionId: string, filters?: any) => {
    try {
      const referralsRef = collection(db as any, 'referrals');
      let q = query(
        referralsRef,
        where('referringInstitutionId', '==', institutionId),
        orderBy('createdAt', 'desc')
      );

      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }

      if (filters?.limit) {
        q = query(q, limit(filters.limit));
      }

      const querySnapshot = await getDocs(q);
      const referrals = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { data: referrals };
    } catch (error) {
      console.error('Error fetching institution referrals from Firebase:', error);
      return api.get(`/institutions/${institutionId}/referrals`, { params: filters });
    }
  },

  // Get a single referral by ID
  getReferralById: async (referralId: string) => {
    try {
      const referralDoc = await getDoc(doc(db as any, 'referrals', referralId));
      if (referralDoc.exists()) {
        return { data: { id: referralDoc.id, ...referralDoc.data() } };
      }
      throw new Error('Referral not found');
    } catch (error) {
      console.error('Error fetching referral from Firebase:', error);
      return api.get(`/referrals/${referralId}`);
    }
  },

  // Create a new referral
  createReferral: async (referral: any) => {
    try {
      const docRef = await addDoc(collection(db as any, 'referrals'), {
        ...referral,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'pending'
      });
      return { data: { id: docRef.id, ...referral } };
    } catch (error) {
      console.error('Error creating referral in Firebase:', error);
      return api.post('/referrals', referral);
    }
  },

  // Update a referral
  updateReferral: async (referralId: string, updates: any) => {
    try {
      const referralRef = doc(db as any, 'referrals', referralId);
      await updateDoc(referralRef, {
        ...updates,
        updatedAt: new Date()
      });
      return { data: { id: referralId, ...updates } };
    } catch (error) {
      console.error('Error updating referral in Firebase:', error);
      return api.patch(`/referrals/${referralId}`, updates);
    }
  },

  // Accept a referral
  acceptReferral: async (referralId: string, acceptingDoctorId: string, notes?: string) => {
    try {
      const referralRef = doc(db as any, 'referrals', referralId);
      await updateDoc(referralRef, {
        status: 'accepted',
        receivingDoctorId: acceptingDoctorId,
        acceptedAt: new Date(),
        updatedAt: new Date(),
        responseNotes: notes
      });
      return { data: { id: referralId, status: 'accepted', receivingDoctorId: acceptingDoctorId } };
    } catch (error) {
      console.error('Error accepting referral in Firebase:', error);
      return api.patch(`/referrals/${referralId}/accept`, { acceptingDoctorId, notes });
    }
  },

  // Reject a referral
  rejectReferral: async (referralId: string, rejectingDoctorId: string, notes: string) => {
    try {
      const referralRef = doc(db as any, 'referrals', referralId);
      await updateDoc(referralRef, {
        status: 'rejected',
        receivingDoctorId: rejectingDoctorId,
        updatedAt: new Date(),
        responseNotes: notes
      });
      return { data: { id: referralId, status: 'rejected', receivingDoctorId: rejectingDoctorId } };
    } catch (error) {
      console.error('Error rejecting referral in Firebase:', error);
      return api.patch(`/referrals/${referralId}/reject`, { rejectingDoctorId, notes });
    }
  },

  // Complete a referral
  completeReferral: async (referralId: string, completionNotes?: string) => {
    try {
      const referralRef = doc(db as any, 'referrals', referralId);
      await updateDoc(referralRef, {
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date(),
        responseNotes: completionNotes
      });
      return { data: { id: referralId, status: 'completed', completedAt: new Date() } };
    } catch (error) {
      console.error('Error completing referral in Firebase:', error);
      return api.patch(`/referrals/${referralId}/complete`, { completionNotes });
    }
  },

  // Cancel a referral
  cancelReferral: async (referralId: string, reason?: string) => {
    try {
      const referralRef = doc(db as any, 'referrals', referralId);
      await updateDoc(referralRef, {
        status: 'cancelled',
        updatedAt: new Date(),
        responseNotes: reason
      });
      return { data: { id: referralId, status: 'cancelled' } };
    } catch (error) {
      console.error('Error cancelling referral in Firebase:', error);
      return api.patch(`/referrals/${referralId}/cancel`, { reason });
    }
  },

  // Get referral responses for a referral
  getReferralResponses: async (referralId: string) => {
    try {
      const responsesRef = collection(db as any, 'referral_responses');
      const q = query(
        responsesRef,
        where('referralId', '==', referralId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const responses = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { data: responses };
    } catch (error) {
      console.error('Error fetching referral responses from Firebase:', error);
      return api.get(`/referrals/${referralId}/responses`);
    }
  },

  // Create a referral response
  createReferralResponse: async (response: any) => {
    try {
      const docRef = await addDoc(collection(db as any, 'referral_responses'), {
        ...response,
        createdAt: new Date()
      });
      return { data: { id: docRef.id, ...response } };
    } catch (error) {
      console.error('Error creating referral response in Firebase:', error);
      return api.post('/referral-responses', response);
    }
  },

  // Get facility network for referrals
  getFacilityNetwork: async (institutionId: string) => {
    try {
      const institutionsRef = collection(db as any, 'institutions');
      const querySnapshot = await getDocs(institutionsRef);
      const facilities = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(facility => facility.id !== institutionId); // Exclude current institution
      return { data: facilities };
    } catch (error) {
      console.error('Error fetching facility network from Firebase:', error);
      return api.get(`/institutions/${institutionId}/network`);
    }
  },

  // Search referrals
  searchReferrals: async (institutionId: string, searchTerm: string, filters?: any) => {
    try {
      const referralsRef = collection(db as any, 'referrals');
      let q = query(
        referralsRef,
        where('referringInstitutionId', '==', institutionId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      let referrals = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

      // Client-side filtering (Firebase doesn't support full-text search natively)
      if (searchTerm) {
        referrals = referrals.filter(referral =>
          referral.patientId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          referral.specialty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          referral.reason?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (filters?.status) {
        referrals = referrals.filter(referral => referral.status === filters.status);
      }

      if (filters?.urgency) {
        referrals = referrals.filter(referral => referral.urgency === filters.urgency);
      }

      return { data: referrals };
    } catch (error) {
      console.error('Error searching referrals from Firebase:', error);
      return api.get(`/institutions/${institutionId}/referrals/search`, {
        params: { searchTerm, ...filters }
      });
    }
  },
};

export const tasksAPI = {
  // Get all tasks for a user (patient or provider)
  getTasks: async (userId: string, userRole: 'patient' | 'provider', filters?: any) => {
    try {
      const tasksRef = collection(db as any, 'tasks');
      let q;

      if (userRole === 'patient') {
        q = query(
          tasksRef,
          where('patientId', '==', userId),
          orderBy('createdAt', 'desc')
        );
      } else {
        // For providers, get tasks they created or are assigned to
        q = query(
          tasksRef,
          where('assignedTo', '==', userId),
          orderBy('createdAt', 'desc')
        );
      }

      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }

      if (filters?.priority) {
        q = query(q, where('priority', '==', filters.priority));
      }

      if (filters?.category) {
        q = query(q, where('category', '==', filters.category));
      }

      if (filters?.limit) {
        q = query(q, limit(filters.limit));
      }

      const querySnapshot = await getDocs(q);
      const tasks = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { data: tasks };
    } catch (error) {
      console.error('Error fetching tasks from Firebase:', error);
      return api.get(`/tasks?userId=${userId}&userRole=${userRole}`, { params: filters });
    }
  },

  // Get tasks for an institution
  getInstitutionTasks: async (institutionId: string, filters?: any) => {
    try {
      const tasksRef = collection(db as any, 'tasks');
      let q = query(
        tasksRef,
        where('institutionId', '==', institutionId),
        orderBy('createdAt', 'desc')
      );

      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }

      if (filters?.priority) {
        q = query(q, where('priority', '==', filters.priority));
      }

      if (filters?.assignedTo) {
        q = query(q, where('assignedTo', '==', filters.assignedTo));
      }

      if (filters?.limit) {
        q = query(q, limit(filters.limit));
      }

      const querySnapshot = await getDocs(q);
      const tasks = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { data: tasks };
    } catch (error) {
      console.error('Error fetching institution tasks from Firebase:', error);
      return api.get(`/institutions/${institutionId}/tasks`, { params: filters });
    }
  },

  // Get a single task by ID
  getTaskById: async (taskId: string) => {
    try {
      const taskDoc = await getDoc(doc(db as any, 'tasks', taskId));
      if (taskDoc.exists()) {
        return { data: { id: taskDoc.id, ...taskDoc.data() } };
      }
      throw new Error('Task not found');
    } catch (error) {
      console.error('Error fetching task from Firebase:', error);
      return api.get(`/tasks/${taskId}`);
    }
  },

  // Create a new task
  createTask: async (task: any) => {
    try {
      const docRef = await addDoc(collection(db as any, 'tasks'), {
        ...task,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: task.status || 'pending'
      });
      return { data: { id: docRef.id, ...task } };
    } catch (error) {
      console.error('Error creating task in Firebase:', error);
      return api.post('/tasks', task);
    }
  },

  // Update a task
  updateTask: async (taskId: string, updates: any) => {
    try {
      const taskRef = doc(db as any, 'tasks', taskId);
      await updateDoc(taskRef, {
        ...updates,
        updatedAt: new Date()
      });
      return { data: { id: taskId, ...updates } };
    } catch (error) {
      console.error('Error updating task in Firebase:', error);
      return api.patch(`/tasks/${taskId}`, updates);
    }
  },

  // Delete a task
  deleteTask: async (taskId: string) => {
    try {
      await deleteDoc(doc(db as any, 'tasks', taskId));
      return { data: { id: taskId, deleted: true } };
    } catch (error) {
      console.error('Error deleting task in Firebase:', error);
      return api.delete(`/tasks/${taskId}`);
    }
  },

  // Complete a task
  completeTask: async (taskId: string) => {
    try {
      const taskRef = doc(db as any, 'tasks', taskId);
      await updateDoc(taskRef, {
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date()
      });
      return { data: { id: taskId, status: 'completed', completedAt: new Date() } };
    } catch (error) {
      console.error('Error completing task in Firebase:', error);
      return api.patch(`/tasks/${taskId}/complete`);
    }
  },

  // Update task status
  updateTaskStatus: async (taskId: string, status: string) => {
    try {
      const taskRef = doc(db as any, 'tasks', taskId);
      const updates: any = {
        status,
        updatedAt: new Date()
      };

      if (status === 'completed') {
        updates.completedAt = new Date();
      }

      await updateDoc(taskRef, updates);
      return { data: { id: taskId, status, completedAt: status === 'completed' ? new Date() : undefined } };
    } catch (error) {
      console.error('Error updating task status in Firebase:', error);
      return api.patch(`/tasks/${taskId}/status`, { status });
    }
  },

  // Get reminders for a task
  getTaskReminders: async (taskId: string) => {
    try {
      const remindersRef = collection(db as any, 'reminders');
      const q = query(
        remindersRef,
        where('taskId', '==', taskId),
        orderBy('scheduledFor', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const reminders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { data: reminders };
    } catch (error) {
      console.error('Error fetching task reminders from Firebase:', error);
      return api.get(`/tasks/${taskId}/reminders`);
    }
  },

  // Create a reminder
  createReminder: async (reminder: any) => {
    try {
      const docRef = await addDoc(collection(db as any, 'reminders'), {
        ...reminder,
        status: 'scheduled'
      });
      return { data: { id: docRef.id, ...reminder } };
    } catch (error) {
      console.error('Error creating reminder in Firebase:', error);
      return api.post('/reminders', reminder);
    }
  },

  // Update a reminder
  updateReminder: async (reminderId: string, updates: any) => {
    try {
      const reminderRef = doc(db as any, 'reminders', reminderId);
      await updateDoc(reminderRef, updates);
      return { data: { id: reminderId, ...updates } };
    } catch (error) {
      console.error('Error updating reminder in Firebase:', error);
      return api.patch(`/reminders/${reminderId}`, updates);
    }
  },

  // Delete a reminder
  deleteReminder: async (reminderId: string) => {
    try {
      await deleteDoc(doc(db as any, 'reminders', reminderId));
      return { data: { id: reminderId, deleted: true } };
    } catch (error) {
      console.error('Error deleting reminder in Firebase:', error);
      return api.delete(`/reminders/${reminderId}`);
    }
  },

  // Mark reminder as sent
  markReminderSent: async (reminderId: string) => {
    try {
      const reminderRef = doc(db as any, 'reminders', reminderId);
      await updateDoc(reminderRef, {
        status: 'sent',
        sentAt: new Date()
      });
      return { data: { id: reminderId, status: 'sent', sentAt: new Date() } };
    } catch (error) {
      console.error('Error marking reminder as sent in Firebase:', error);
      return api.patch(`/reminders/${reminderId}/sent`);
    }
  },

  // Get overdue tasks
  getOverdueTasks: async (userId: string, userRole: 'patient' | 'provider') => {
    try {
      const tasksRef = collection(db as any, 'tasks');
      const now = new Date();
      let q;

      if (userRole === 'patient') {
        q = query(
          tasksRef,
          where('patientId', '==', userId),
          where('status', 'in', ['pending', 'in_progress']),
          where('dueDate', '<', now),
          orderBy('dueDate', 'asc')
        );
      } else {
        q = query(
          tasksRef,
          where('assignedTo', '==', userId),
          where('status', 'in', ['pending', 'in_progress']),
          where('dueDate', '<', now),
          orderBy('dueDate', 'asc')
        );
      }

      const querySnapshot = await getDocs(q);
      const tasks = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

      // Update status to overdue
      for (const task of tasks) {
        if (task.status !== 'overdue') {
          await updateDoc(doc(db as any, 'tasks', task.id), {
            status: 'overdue',
            updatedAt: new Date()
          });
          task.status = 'overdue';
        }
      }

      return { data: tasks };
    } catch (error) {
      console.error('Error fetching overdue tasks from Firebase:', error);
      return api.get(`/tasks/overdue?userId=${userId}&userRole=${userRole}`);
    }
  },

  // Search tasks
  searchTasks: async (institutionId: string, searchTerm: string, filters?: any) => {
    try {
      const tasksRef = collection(db as any, 'tasks');
      let q = query(
        tasksRef,
        where('institutionId', '==', institutionId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      let tasks = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

      // Client-side filtering (Firebase doesn't support full-text search natively)
      if (searchTerm) {
        tasks = tasks.filter(task =>
          task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }

      if (filters?.status) {
        tasks = tasks.filter(task => task.status === filters.status);
      }

      if (filters?.priority) {
        tasks = tasks.filter(task => task.priority === filters.priority);
      }

      if (filters?.category) {
        tasks = tasks.filter(task => task.category === filters.category);
      }

      if (filters?.assignedTo) {
        tasks = tasks.filter(task => task.assignedTo === filters.assignedTo);
      }

      return { data: tasks };
    } catch (error) {
      console.error('Error searching tasks from Firebase:', error);
      return api.get(`/institutions/${institutionId}/tasks/search`, {
        params: { searchTerm, ...filters }
      });
    }
  },
};

export default api;
