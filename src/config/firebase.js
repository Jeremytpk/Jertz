// Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDVuJsuztOLvtA6_vhwI2v3HEI582roo5g",
  authDomain: "jertz-4d3f9.firebaseapp.com",
  projectId: "jertz-4d3f9",
  storageBucket: "jertz-4d3f9.firebasestorage.app",
  messagingSenderId: "730515541241",
  appId: "1:730515541241:web:4f38230247e30cba4ea628",
  measurementId: "G-JK75MPLCT9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services (using getAuth instead of initializeAuth for compatibility)
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
