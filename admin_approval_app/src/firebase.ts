// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, Analytics } from "firebase/analytics";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

// Check if we should use mock authentication for development
const useMockAuth = process.env.REACT_APP_USE_MOCK_AUTH === 'true' || false; // Use real Firebase now

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyDvVxtrwdX4ht8scA3pc_TetjdEJG1_Iyw",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "afya-tracker-25392.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "afya-tracker-25392",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "afya-tracker-25392.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "887398886408",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:887398886408:web:236c851ad384bffa8ff5bd",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-WH1PDQBVEH"
};

// Gemini API configuration
export const geminiConfig = {
  apiKey: process.env.REACT_APP_GEMINI_API_KEY,
  useFirebaseAI: process.env.REACT_APP_USE_FIREBASE_AI === 'true',
};

// Initialize Firebase only if not using mock auth
let app: any, auth: Auth | undefined, db: Firestore | undefined, storage: FirebaseStorage | undefined, analytics: Analytics | undefined;

if (!useMockAuth) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

  // Initialize Analytics (only in production)
  if (typeof window !== 'undefined') {
    try {
      analytics = getAnalytics(app);
    } catch (error) {
      console.warn('Analytics initialization failed:', error);
    }
  }
}

export { auth, db, storage, analytics };
export default app;