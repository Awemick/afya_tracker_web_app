// Mock authentication service for development when Firebase is not available
import { User } from '../types';

export interface AuthUser extends User {
  firebaseUser?: any;
  phone?: string;
  dueDate?: string;
  pregnancyWeek?: number;
}

// Mock user database - Empty in production, only for development testing
const mockUsers: AuthUser[] = [];

let currentUser: AuthUser | null = null;
const authListeners: ((user: AuthUser | null) => void)[] = [];

export const loginWithEmailAndPassword = async (
  email: string,
  password: string
): Promise<AuthUser> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const user = mockUsers.find(u => u.email === email);
  if (!user) {
    throw new Error('User not found');
  }

  // In production, this would validate against Firebase Auth
  // For mock service, any password is accepted for existing users
  currentUser = user;
  authListeners.forEach(listener => listener(user));

  return user;
};

export const signupWithEmailAndPassword = async (
  email: string,
  password: string,
  userData: Partial<User> & { role: 'patient' | 'provider' | 'admin' } & Record<string, any>
): Promise<AuthUser> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Check if user already exists
  const existingUser = mockUsers.find(u => u.email === email);
  if (existingUser) {
    throw new Error('User already exists');
  }

  const newUser: AuthUser = {
    id: Date.now().toString(),
    name: userData.name || '',
    email: userData.email || '',
    ...userData,
  };

  mockUsers.push(newUser);
  currentUser = newUser;
  authListeners.forEach(listener => listener(newUser));

  return newUser;
};

export const logoutUser = async (): Promise<void> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  currentUser = null;
  authListeners.forEach(listener => listener(null));
};

export const onAuthStateChange = (
  callback: (user: AuthUser | null) => void
): (() => void) => {
  authListeners.push(callback);

  // Return current user immediately if logged in
  if (currentUser) {
    callback(currentUser);
  }

  // Return unsubscribe function
  return () => {
    const index = authListeners.indexOf(callback);
    if (index > -1) {
      authListeners.splice(index, 1);
    }
  };
};