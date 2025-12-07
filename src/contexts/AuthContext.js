import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for guest mode
    const checkGuestMode = async () => {
      const guestMode = await AsyncStorage.getItem('guestMode');
      if (guestMode === 'true') {
        setIsGuest(true);
        setLoading(false);
      }
    };

    checkGuestMode();

    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log('AuthContext: User state changed - User logged in');
        console.log('Logged in user:', {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL
        });
        
        // Fetch additional user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};
        
        const fullUserData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          ...userData,
        };
        
        console.log('Full user data with Firestore:', fullUserData);
        setUser(fullUserData);
        setIsGuest(false);
      } else {
        console.log('AuthContext: User state changed - User logged out');
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = async (email, password, displayName) => {
    try {
      console.log('AuthContext: Creating new account for:', email, 'with display name:', displayName);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const { user: firebaseUser } = userCredential;
      console.log('AuthContext: Firebase user created with UID:', firebaseUser.uid);

      // Update profile with display name
      await updateProfile(firebaseUser, { displayName });
      console.log('AuthContext: Profile updated with display name:', displayName);

      // Create user document in Firestore
      const userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName,
        createdAt: new Date().toISOString(),
        photoURL: null,
        uploadedTracks: [],
        rooms: [],
      };
      
      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      console.log('AuthContext: User document created in Firestore:', userData);

      return { success: true };
    } catch (error) {
      console.log('AuthContext: Sign up error:', error.message);
      return { success: false, error: error.message };
    }
  };

  const signIn = async (email, password) => {
    try {
      console.log('AuthContext: Signing in user with email:', email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('AuthContext: Sign in successful');
      console.log('User UID:', userCredential.user.uid);
      console.log('User Email:', userCredential.user.email);
      console.log('User Display Name:', userCredential.user.displayName);
      await AsyncStorage.removeItem('guestMode');
      return { success: true };
    } catch (error) {
      console.log('AuthContext: Sign in error:', error.message);
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      await AsyncStorage.removeItem('guestMode');
      setIsGuest(false);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const continueAsGuest = async () => {
    try {
      await AsyncStorage.setItem('guestMode', 'true');
      setIsGuest(true);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    isGuest,
    loading,
    signUp,
    signIn,
    signOut,
    continueAsGuest,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
