
/**
 * firebase.js - Single source of truth for Firebase initialization.
 */
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCXM5TO7fFkFh9oHW_7rlkgG0FEI9RnPMw",
  authDomain: "nature-camera-app.firebaseapp.com",
  projectId: "nature-camera-app",
  storageBucket: "nature-camera-app.firebasestorage.app",
  messagingSenderId: "493506280018",
  appId: "1:493506280018:web:f2be2a9bb98c6a8658fd8b",
};


// Initialize once and export shared instances
export const app = initializeApp(FIREBASE_CONFIG);
export const auth = getAuth(app);
export const db = getFirestore(app);



