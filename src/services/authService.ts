// Firebase Email Link Authentication Service
import { User } from '../types';
import { auth } from '../firebase';
import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut,
  onAuthStateChanged,
  ActionCodeSettings,
  User as FirebaseUser
} from 'firebase/auth';

export interface AuthUser extends User {
  firebaseUser?: FirebaseUser;
}

// ActionCodeSettings for email link authentication
const actionCodeSettings: ActionCodeSettings = {
  url: process.env.NODE_ENV === 'production'
    ? 'https://afya-tracker-app.web.app/finishSignUp' // Replace with your production domain
    : 'http://localhost:3000/finishSignUp',
  handleCodeInApp: true,
};

// Send sign-in link to email
export const sendSignInLinkToEmailAddress = async (email: string): Promise<void> => {
  if (!auth) {
    throw new Error('Firebase auth not initialized');
  }

  try {
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    // Save email to localStorage for later use
    window.localStorage.setItem('emailForSignIn', email);
  } catch (error) {
    console.error('Error sending sign-in link:', error);
    throw error;
  }
};

// Check if the current URL is a sign-in with email link
export const isSignInWithEmailLinkUrl = (url: string): boolean => {
  if (!auth) return false;
  return isSignInWithEmailLink(auth, url);
};

// Complete sign-in with email link
export const signInWithEmailLinkUrl = async (email: string, emailLink: string): Promise<AuthUser> => {
  if (!auth) {
    throw new Error('Firebase auth not initialized');
  }

  try {
    const result = await signInWithEmailLink(auth, email, emailLink);
    const firebaseUser = result.user;

    // Clear email from localStorage
    window.localStorage.removeItem('emailForSignIn');

    // Check if there's pending signup data
    const pendingSignupData = window.localStorage.getItem('pendingSignupData');
    let userRole: 'patient' | 'provider' | 'admin' = 'patient'; // Default role

    if (pendingSignupData) {
      try {
        const signupData = JSON.parse(pendingSignupData);
        const role = signupData.role;
        if (role === 'patient' || role === 'provider' || role === 'admin') {
          userRole = role;
        }

        // Here you would typically save the user profile data to Firestore
        // For now, we'll just use the data to set the role
        console.log('Signup data found:', signupData);

        // Clear the pending signup data
        window.localStorage.removeItem('pendingSignupData');
      } catch (parseError) {
        console.error('Error parsing pending signup data:', parseError);
      }
    }

    // Create AuthUser object
    const authUser: AuthUser = {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || firebaseUser.email || '',
      email: firebaseUser.email || '',
      role: userRole,
      firebaseUser
    };

    return authUser;
  } catch (error) {
    console.error('Error signing in with email link:', error);
    throw error;
  }
};

// Logout user
export const logoutUser = async (): Promise<void> => {
  if (!auth) {
    throw new Error('Firebase auth not initialized');
  }

  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Listen for authentication state changes
export const onAuthStateChange = (
  callback: (user: AuthUser | null) => void
): (() => void) => {
  if (!auth) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      const authUser: AuthUser = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || firebaseUser.email || '',
        email: firebaseUser.email || '',
        role: 'patient', // Default role, will be updated based on user data
        firebaseUser
      };
      callback(authUser);
    } else {
      callback(null);
    }
  });
};

// Legacy functions for backward compatibility (redirect to email link flow)
export const loginWithEmailAndPassword = async (email: string): Promise<AuthUser> => {
  // For email link auth, we just send the link
  await sendSignInLinkToEmailAddress(email);
  throw new Error('Check your email for the sign-in link');
};

export const signupWithEmailAndPassword = async (
  email: string,
  password: string,
  userData: Partial<User> & { role: 'patient' | 'provider' | 'admin' } & Record<string, any>
): Promise<AuthUser> => {
  // For email link auth, we just send the link
  await sendSignInLinkToEmailAddress(email);
  throw new Error('Check your email for the sign-in link');
};