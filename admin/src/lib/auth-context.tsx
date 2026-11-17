'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from './firebase';

export interface AdminUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'super_admin' | 'content_manager' | 'moderator';
}

interface AuthContextType {
  user: AdminUser | null;
  firebaseUser: FirebaseUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  token: null,
  loading: true,
  error: null,
  loginWithEmail: async () => {},
  loginWithGoogle: async () => {},
  logout: async () => {},
});

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Validate admin token against Go backend RBAC
  const verifyAdminToken = async (idToken: string, fbUser: FirebaseUser): Promise<AdminUser> => {
    const res = await fetch(`${API_BASE}/v1/admin/overview`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      if (res.status === 403 || res.status === 401) {
        throw new Error(
          'Access Denied: This account is not registered in admin_roles. Administrative privileges required.'
        );
      }
      throw new Error(`Admin verification failed with status ${res.status}`);
    }

    const adminUser: AdminUser = {
      uid: fbUser.uid,
      email: fbUser.email,
      displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Administrator',
      photoURL: fbUser.photoURL,
      role: 'super_admin',
    };

    return adminUser;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setLoading(true);
      setError(null);

      if (fbUser) {
        try {
          const idToken = await fbUser.getIdToken();
          const verifiedAdmin = await verifyAdminToken(idToken, fbUser);

          setToken(idToken);
          setFirebaseUser(fbUser);
          setUser(verifiedAdmin);
          localStorage.setItem('melo_admin_token', idToken);
          localStorage.setItem('melo_admin_user', JSON.stringify(verifiedAdmin));
        } catch (err: any) {
          console.error('Admin authentication verification failed:', err);
          await signOut(auth);
          setToken(null);
          setFirebaseUser(null);
          setUser(null);
          localStorage.removeItem('melo_admin_token');
          localStorage.removeItem('melo_admin_user');
          setError(err.message || 'Unauthorized admin access');
        }
      } else {
        // Fallback for dev environment if token is explicitly in localStorage
        const storedToken = localStorage.getItem('melo_admin_token');
        const storedUser = localStorage.getItem('melo_admin_user');
        if (storedToken && storedUser && storedToken.startsWith('dev-')) {
          try {
            const parsed = JSON.parse(storedUser);
            setUser(parsed);
            setToken(storedToken);
          } catch {
            localStorage.removeItem('melo_admin_token');
            localStorage.removeItem('melo_admin_user');
          }
        } else {
          setToken(null);
          setFirebaseUser(null);
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    setError(null);
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      const idToken = await cred.user.getIdToken();
      const verified = await verifyAdminToken(idToken, cred.user);

      setToken(idToken);
      setFirebaseUser(cred.user);
      setUser(verified);
      localStorage.setItem('melo_admin_token', idToken);
      localStorage.setItem('melo_admin_user', JSON.stringify(verified));
    } catch (err: any) {
      await signOut(auth);
      setToken(null);
      setFirebaseUser(null);
      setUser(null);
      localStorage.removeItem('melo_admin_token');
      localStorage.removeItem('melo_admin_user');
      const msg = err.message?.includes('auth/invalid-credential')
        ? 'Invalid email or password.'
        : err.message || 'Login failed';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const cred = await signInWithPopup(auth, provider);
      const idToken = await cred.user.getIdToken();
      const verified = await verifyAdminToken(idToken, cred.user);

      setToken(idToken);
      setFirebaseUser(cred.user);
      setUser(verified);
      localStorage.setItem('melo_admin_token', idToken);
      localStorage.setItem('melo_admin_user', JSON.stringify(verified));
    } catch (err: any) {
      await signOut(auth);
      setToken(null);
      setFirebaseUser(null);
      setUser(null);
      localStorage.removeItem('melo_admin_token');
      localStorage.removeItem('melo_admin_user');
      const msg = err.message || 'Google authentication failed';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } finally {
      setToken(null);
      setFirebaseUser(null);
      setUser(null);
      setError(null);
      localStorage.removeItem('melo_admin_token');
      localStorage.removeItem('melo_admin_user');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        token,
        loading,
        error,
        loginWithEmail,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
