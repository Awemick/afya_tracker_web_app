import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import patientsReducer from './slices/patientsSlice';
import consultationsReducer from './slices/consultationsSlice';
import messagingReducer from './slices/messagingSlice';
import notificationsReducer from './slices/notificationsSlice';
import appointmentsReducer from './slices/appointmentsSlice';
import prescriptionsReducer from './slices/prescriptionsSlice';
import progressNotesReducer from './slices/progressNotesSlice';
import institutionsReducer from './slices/institutionsSlice';
import patientLinksReducer from './slices/patientLinksSlice';
import analyticsReducer from './slices/analyticsSlice';
import medicalRecordsReducer from './slices/medicalRecordsSlice';
import referralsReducer from './slices/referralsSlice';
import tasksReducer from './slices/tasksSlice';
import themeReducer from './slices/themeSlice';
import subscriptionReducer from './slices/subscriptionSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    patients: patientsReducer,
    consultations: consultationsReducer,
    messaging: messagingReducer,
    notifications: notificationsReducer,
    appointments: appointmentsReducer,
    prescriptions: prescriptionsReducer,
    progressNotes: progressNotesReducer,
    institutions: institutionsReducer,
    patientLinks: patientLinksReducer,
    analytics: analyticsReducer,
    medicalRecords: medicalRecordsReducer,
    referrals: referralsReducer,
    tasks: tasksReducer,
    theme: themeReducer,
    subscription: subscriptionReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;