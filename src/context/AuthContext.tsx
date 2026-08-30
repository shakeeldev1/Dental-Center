import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { UserProfile } from '@/types';

interface AuthContextValue {
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authReady, setAuthReady] = useState(false); // initial session resolved
  const [profileResolved, setProfileResolved] = useState(false); // profile fetch settled

  const loadProfile = useCallback(async (userId: string) => {
    if (!supabase) return;
    // Ensure the client has finished restoring the session so the request is
    // authenticated — otherwise a cold-load race queries RLS unauthenticated.
    await supabase.auth.getSession();
    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, is_active')
      .eq('id', userId)
      .maybeSingle();
    setProfile(error ? null : ((data as UserProfile) ?? null));
  }, []);

  // Subscribe to auth changes. The callback stays synchronous (no awaited
  // supabase calls) to avoid the GoTrue auth-lock deadlock — profile loading
  // happens in the effect below instead.
  useEffect(() => {
    if (!supabase) {
      setAuthReady(true);
      setProfileResolved(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load (or clear) the profile whenever the signed-in user changes.
  const userId = session?.user?.id;
  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setProfileResolved(true);
      return;
    }
    let active = true;
    setProfileResolved(false);
    loadProfile(userId).finally(() => {
      if (active) setProfileResolved(true);
    });
    return () => {
      active = false;
    };
  }, [userId, loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      throw new Error('Supabase is not configured yet. Add credentials to client/.env');
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const loading = !authReady || !profileResolved;

  const value = useMemo(
    () => ({
      session,
      profile,
      loading,
      configured: isSupabaseConfigured,
      signIn,
      signOut,
    }),
    [session, profile, loading, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
