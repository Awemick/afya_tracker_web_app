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
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
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