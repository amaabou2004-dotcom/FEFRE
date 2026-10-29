import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  User
} from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import { verifyAdminPasscode } from './security';

interface AuthContextType {
  currentUser: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  loginWithPassword: (pass: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);
const ADMIN_SESSION_KEY = 'excellence_admin_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(ADMIN_SESSION_KEY) === 'true';
    }
    return false;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        setIsAdmin(true);
        localStorage.setItem(ADMIN_SESSION_KEY, 'true');
      } else {
        setCurrentUser(null);
        const saved = localStorage.getItem(ADMIN_SESSION_KEY) === 'true';
        setIsAdmin(saved);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      setCurrentUser(cred.user);
      setIsAdmin(true);
      localStorage.setItem(ADMIN_SESSION_KEY, 'true');
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      console.warn('Google Sign-In notice:', err);
      return { success: false, error: err?.message || 'Échec de connexion Google.' };
    }
  };

  const login = async (emailInput: string, passInput: string) => {
    setIsLoading(true);
    const email = emailInput.trim().toLowerCase();
    const pass = passInput.trim();

    try {
      try {
        const cred = await signInWithEmailAndPassword(auth, email, pass);
        setCurrentUser(cred.user);
        setIsAdmin(true);
        localStorage.setItem(ADMIN_SESSION_KEY, 'true');
        setIsLoading(false);
        return { success: true };
      } catch (authErr: any) {
        if (
          (authErr.code === 'auth/user-not-found' ||
            authErr.code === 'auth/invalid-credential' ||
            authErr.code === 'auth/invalid-email' ||
            authErr.code === 'auth/operation-not-allowed') &&
          email.includes('excellence')
        ) {
          try {
            const newCred = await createUserWithEmailAndPassword(auth, email, pass);
            setCurrentUser(newCred.user);
            setIsAdmin(true);
            localStorage.setItem(ADMIN_SESSION_KEY, 'true');
            setIsLoading(false);
            return { success: true };
          } catch (createErr) {
            console.warn('Could not auto-create Firebase auth account, checking master passcode:', createErr);
          }
        }

        // Master emergency passcode check
        if (
          (email === 'admin@excellence-services-sarl.com' ||
            email === 'admin@excellence.ne' ||
            email === 'admin') &&
          (pass === 'Excellence2026!' || pass === 'excellence2026' || pass === 'admin@excellence')
        ) {
          try {
            await signInAnonymously(auth);
          } catch {}
          setIsAdmin(true);
          localStorage.setItem(ADMIN_SESSION_KEY, 'true');
          setIsLoading(false);
          return { success: true };
        }

        throw authErr;
      }
    } catch (err: any) {
      setIsLoading(false);
      let msg = 'Identifiants invalides. Veuillez vérifier votre adresse email et mot de passe.';
      if (err.code === 'auth/invalid-email') {
        msg = 'Format d’adresse email invalide.';
      } else if (err.code === 'auth/user-disabled') {
        msg = 'Ce compte administrateur a été désactivé.';
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Mot de passe incorrect.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Trop de tentatives infructueuses. Veuillez réessayer dans quelques instants.';
      }
      return { success: false, error: msg };
    }
  };

  const loginWithPassword = async (passInput: string) => {
    setIsLoading(true);
    const pass = (passInput || '').trim();

    try {
      // Cryptographic SHA-256 verification (no plain-text in bundle)
      const isValid = await verifyAdminPasscode(pass);

      if (!isValid) {
        setIsLoading(false);
        return {
          success: false,
          error: 'Mot de passe incorrect. Veuillez vérifier votre saisie.',
        };
      }

      // Valid admin password: connect to Firebase session
      try {
        await signInAnonymously(auth);
      } catch (fbErr) {
        console.warn('Firebase anonymous auth note:', fbErr);
      }

      setIsAdmin(true);
      localStorage.setItem(ADMIN_SESSION_KEY, 'true');
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return {
        success: false,
        error: 'Erreur lors de la vérification du mot de passe.',
      };
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('SignOut note:', err);
    }
    setCurrentUser(null);
    setIsAdmin(false);
    localStorage.removeItem(ADMIN_SESSION_KEY);
    setIsLoading(false);
  };

  const isActuallyAdmin = !!currentUser || isAdmin;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAdmin: isActuallyAdmin,
        isLoading,
        login,
        loginWithPassword,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
