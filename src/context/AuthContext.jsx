import React, { createContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase/firebase';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true); // Loading state while Firebase restores auth

  // Email/Password Sign-Up
  const signup = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  // Email/Password Login
  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Google Sign-In
  const loginWithGoogle = () => {
    return signInWithPopup(auth, googleProvider);
  };

  // Used only when the browser blocks a popup. Firebase completes this flow
  // in the current tab and restores the user through onAuthStateChanged.
  const loginWithGoogleRedirect = () => {
    return signInWithRedirect(auth, googleProvider);
  };

  // Logout
  const logout = () => {
    return signOut(auth);
  };

  // Persist authentication across page refreshes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false); // Authentication state restored
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    loginWithGoogle,
    loginWithGoogleRedirect,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="loading-container" style={{ height: '100vh' }}>
          <span className="loader"></span>
          <div className="loading-text">Loading authentication...</div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
