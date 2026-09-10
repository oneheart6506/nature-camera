/**
 * authManager.js - Manages Firebase user identity and session subscriptions.
 */
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { FIREBASE_CONFIG } from '../../constants/firebase.js';

// Initialize Firebase App instance
const app = initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);

export class AuthManager {
  /**
   * Register a new observer using email and password.
   */
  static async register(email, password) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  /**
   * Sign in an existing observer.
   */
  static async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  /**
   * Sign out the active user.
   */
  static async logout() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time authentication state transitions.
   * Callback receives the User object when logged in, or null when logged out.
   */
  static onAuthStateChange(callback) {
    return onAuthStateChanged(auth, callback);
  }

  /**
   * Returns current active user synchronously (null if not logged in).
   */
  static getCurrentUser() {
    return auth.currentUser;
  }
}
