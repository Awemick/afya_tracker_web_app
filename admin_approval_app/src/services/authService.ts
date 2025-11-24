// Firebase Authentication Service (Email/Password)
import { User } from '../types';
import { auth, db } from '../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut,
  onAuthStateChanged,
  ActionCodeSettings,
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export interface AuthUser extends Omit<User, 'firebaseUser'> {
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

  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      let role: 'patient' | 'provider' | 'institution' | 'admin' = 'patient';
      if (db) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const userData = userDoc.data();
          const validRoles = ['patient', 'provider', 'institution', 'admin'];
          const fetchedRole = userData?.role;
          role = validRoles.includes(fetchedRole) ? (fetchedRole as typeof role) : 'patient';
        } catch (error) {
          console.error('Error fetching user role:', error);
        }
      }
      const authUser: AuthUser = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || firebaseUser.email || '',
        email: firebaseUser.email || '',
        role: role,
        firebaseUser
      };
      callback(authUser);
    } else {
      callback(null);
    }
  });
};

// Email/Password Authentication Functions
export const loginWithEmailAndPassword = async (email: string, password: string): Promise<AuthUser> => {
  if (!auth) {
    throw new Error('Firebase auth not initialized');
  }
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = result.user;

    // Fetch user role from Firestore
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    const userData = userDoc.data();
    const validRoles = ['patient', 'provider', 'institution', 'admin'];
    const fetchedRole = userData?.role;
    const role = validRoles.includes(fetchedRole) ? (fetchedRole as 'patient' | 'provider' | 'institution' | 'admin') : 'patient';

    // Create AuthUser object
    const authUser: AuthUser = {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || firebaseUser.email || '',
      email: firebaseUser.email || '',
      role: role,
      firebaseUser
    };

    return authUser;
  } catch (error) {
    console.error('Error signing in with email/password:', error);
    throw error;
  }
};

export const signupWithEmailAndPassword = async (
  email: string,
  password: string,
  userData: Partial<User> & { role: 'patient' | 'provider' | 'admin' } & Record<string, any>
): Promise<AuthUser> => {
  if (!auth) {
    throw new Error('Firebase auth not initialized');
  }

  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = result.user;

    // Update the user's display name if provided
    if (userData.name) {
      await updateProfile(firebaseUser, {
        displayName: userData.name
      });
    }

    // Create AuthUser object
    const authUser: AuthUser = {
      id: firebaseUser.uid,
      name: userData.name || firebaseUser.displayName || firebaseUser.email || '',
      email: firebaseUser.email || '',
      role: userData.role || 'patient',
      firebaseUser
    };

    return authUser;
  } catch (error) {
    console.error('Error signing up with email/password:', error);
    throw error;
  }
};