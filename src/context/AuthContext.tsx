import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  signInAnonymously,
  onAuthStateChanged,
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from '../lib/firebase';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  isAnonymous?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  // Sync user profile with Firestore
  const syncUserProfile = async (firebaseUser: User, customDisplayName?: string) => {
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const snap = await getDoc(userRef);

      const name = customDisplayName || firebaseUser.displayName || (firebaseUser.isAnonymous ? 'Guest User' : 'ATS Professional');
      const email = firebaseUser.email || (firebaseUser.isAnonymous ? `guest-${firebaseUser.uid.slice(0, 6)}@paused.ai` : '');

      if (!snap.exists()) {
        const newProfile: Record<string, any> = {
          id: firebaseUser.uid,
          email,
          displayName: name,
          photoURL: firebaseUser.photoURL || '',
          isAnonymous: Boolean(firebaseUser.isAnonymous),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          serverCreatedAt: serverTimestamp()
        };
        await setDoc(userRef, newProfile);
        setUserProfile({
          id: firebaseUser.uid,
          email,
          displayName: name,
          photoURL: firebaseUser.photoURL || '',
          isAnonymous: Boolean(firebaseUser.isAnonymous)
        });
      } else {
        const data = snap.data();
        setUserProfile({
          id: firebaseUser.uid,
          email: data.email || email,
          displayName: data.displayName || name,
          photoURL: data.photoURL || firebaseUser.photoURL || '',
          isAnonymous: Boolean(firebaseUser.isAnonymous)
        });
      }
    } catch (err) {
      console.warn('Unable to sync user document to Firestore (using auth fallback):', err);
      // Fallback to auth profile in case of permissions or offline
      setUserProfile({
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: customDisplayName || firebaseUser.displayName || (firebaseUser.isAnonymous ? 'Guest User' : 'ATS Professional'),
        photoURL: firebaseUser.photoURL || '',
        isAnonymous: Boolean(firebaseUser.isAnonymous)
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await syncUserProfile(currentUser);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const formatAuthError = (err: any): string => {
    const code = err?.code || '';
    switch (code) {
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Incorrect email or password. Please try again.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists. Try signing in.';
      case 'auth/weak-password':
        return 'Password is too weak. Please use at least 6 characters.';
      case 'auth/popup-closed-by-user':
        return 'Sign-in popup was closed before completing.';
      case 'auth/popup-blocked':
        return 'Popup was blocked by your browser. Please allow popups for this site.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection.';
      default:
        return err?.message || 'An error occurred during authentication. Please try again.';
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setError(null);
    try {
      const res = await signInWithEmailAndPassword(auth, email.trim(), pass);
      await syncUserProfile(res.user);
    } catch (err: any) {
      const msg = formatAuthError(err);
      setError(msg);
      throw new Error(msg);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, displayName: string) => {
    setError(null);
    try {
      const res = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      if (displayName.trim()) {
        await updateProfile(res.user, { displayName: displayName.trim() });
      }
      await syncUserProfile(res.user, displayName.trim());
    } catch (err: any) {
      const msg = formatAuthError(err);
      setError(msg);
      throw new Error(msg);
    }
  };

  const signInWithGoogle = async () => {
    setError(null);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      await syncUserProfile(res.user);
    } catch (err: any) {
      const msg = formatAuthError(err);
      setError(msg);
      throw new Error(msg);
    }
  };

  const signInAsGuest = async () => {
    setError(null);
    try {
      const res = await signInAnonymously(auth);
      await syncUserProfile(res.user, 'Guest Professional');
    } catch (err: any) {
      const msg = formatAuthError(err);
      setError(msg);
      throw new Error(msg);
    }
  };

  const logout = async () => {
    setError(null);
    try {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
    } catch (err: any) {
      const msg = formatAuthError(err);
      setError(msg);
      throw new Error(msg);
    }
  };

  const resetPassword = async (email: string) => {
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err: any) {
      const msg = formatAuthError(err);
      setError(msg);
      throw new Error(msg);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signInAsGuest,
        logout,
        resetPassword,
        error,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
