import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import {
  isSupabaseConfigured,
  supabase,
  SUPABASE_NOT_CONFIGURED_MESSAGE,
  SUPABASE_TABLES,
} from './supabase';

/**
 * Authentification administrateur — Supabase Auth.
 *
 * Sécurité (remplace l'ancien mot de passe partagé codé dans Firebase) :
 *  1. L'admin se connecte avec un compte créé dans Supabase
 *     (Dashboard → Authentication → Users → Add user).
 *  2. Son email doit figurer dans la table « admin_users » : c'est elle
 *     qui autorise les écritures (politiques RLS `public.is_admin()`).
 *     Un compte connecté mais absent de cette table n'est PAS admin.
 *  3. Désactivez les inscriptions publiques dans Supabase pour qu'un
 *     visiteur ne puisse pas créer de compte (voir SUPABASE_SETUP.md).
 */

interface AuthContextType {
  currentUser: User | null;
  session: Session | null;
  /** Connecté à Supabase Auth (pas forcément administrateur). */
  isAuthenticated: boolean;
  /** Connecté ET présent dans admin_users. */
  isAdmin: boolean;
  isLoading: boolean;
  isSupabaseConfigured: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  /** @deprecated Ancien accès par mot de passe seul (Firebase). Utilisez login(email, motDePasse). */
  loginWithPassword: (pass: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function translateAuthError(err: any): string {
  const msg = String(err?.message || err || '');
  if (/Invalid login credentials/i.test(msg)) {
    return 'Identifiants invalides. Vérifiez l’adresse email et le mot de passe du compte administrateur créé dans Supabase.';
  }
  if (/Email not confirmed/i.test(msg)) {
    return 'Adresse email non confirmée. Dans Supabase (Authentication → Users), confirmez le compte ou recréez-le avec « Auto Confirm User » coché.';
  }
  if (/Invalid email/i.test(msg)) return 'Format d’adresse email invalide.';
  if (/rate limit|too many/i.test(msg)) return 'Trop de tentatives. Veuillez réessayer dans quelques instants.';
  if (/Failed to fetch|NetworkError/i.test(msg)) return 'Impossible de contacter Supabase. Vérifiez votre connexion et VITE_SUPABASE_URL.';
  if (/Invalid API key/i.test(msg)) return 'Clé Supabase invalide : vérifiez VITE_SUPABASE_ANON_KEY.';
  if (/provider is not enabled|Unsupported provider/i.test(msg)) {
    return 'La connexion Google n’est pas activée dans Supabase (Authentication → Providers → Google). Utilisez l’email + mot de passe.';
  }
  return msg || 'Échec de la connexion.';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const checkingRef = useRef(0);

  const checkAdmin = async (user: User | null) => {
    const token = ++checkingRef.current;
    if (!supabase || !user) {
      setIsAdmin(false);
      return;
    }
    try {
      // La RLS ne laisse voir à un utilisateur que SA ligne admin_users :
      // inutile de filtrer par email (et insensible à la casse).
      const { data, error } = await supabase
        .from(SUPABASE_TABLES.ADMIN_USERS)
        .select('email')
        .limit(1)
        .maybeSingle();
      if (token !== checkingRef.current) return; // session déjà remplacée
      if (error) {
        console.warn('Vérification admin Supabase :', error.message);
        setIsAdmin(false);
        return;
      }
      setIsAdmin(Boolean(data));
    } catch (err) {
      console.warn('Vérification admin Supabase :', err);
      if (token === checkingRef.current) setIsAdmin(false);
    }
  };

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }
    let mounted = true;

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (!mounted) return;
        setSession(data.session);
        setCurrentUser(data.session?.user ?? null);
        await checkAdmin(data.session?.user ?? null);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setCurrentUser(newSession?.user ?? null);
      if (!newSession?.user) setIsAdmin(false);
      // Différé : ne jamais appeler Supabase directement dans ce callback
      // (risque de verrou mort documenté par Supabase Auth).
      setTimeout(() => {
        void checkAdmin(newSession?.user ?? null);
      }, 0);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const login = async (emailInput: string, passInput: string) => {
    if (!supabase) return { success: false, error: SUPABASE_NOT_CONFIGURED_MESSAGE };
    const email = emailInput.trim().toLowerCase();
    const password = passInput ?? '';
    if (!email || !password) {
      return { success: false, error: 'Veuillez saisir votre adresse email et votre mot de passe.' };
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setSession(data.session);
      setCurrentUser(data.user);
      await checkAdmin(data.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: translateAuthError(err) };
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithPassword = async (_pass: string) => {
    return {
      success: false,
      error:
        'La connexion par mot de passe seul a été remplacée par Supabase Auth : connectez-vous avec l’adresse email et le mot de passe du compte administrateur créé dans Supabase.',
    };
  };

  const loginWithGoogle = async () => {
    if (!supabase) return { success: false, error: SUPABASE_NOT_CONFIGURED_MESSAGE };
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/admin` },
      });
      if (error) throw error;
      return { success: true }; // redirection vers Google en cours
    } catch (err: any) {
      return { success: false, error: translateAuthError(err) };
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      if (supabase) await supabase.auth.signOut();
    } catch (err) {
      console.warn('Déconnexion Supabase :', err);
    }
    setCurrentUser(null);
    setSession(null);
    setIsAdmin(false);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        session,
        isAuthenticated: Boolean(currentUser),
        isAdmin,
        isLoading,
        isSupabaseConfigured,
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
