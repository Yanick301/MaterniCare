import { useState, useEffect, useCallback } from 'react';
import type { ReponseSFE, ReponsePatiente, User } from '@/lib/index';
import { supabase } from '@/lib/supabase';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

const STORAGE_KEYS = {
  SFE: 'maternicare_sfe',
  PATIENTES: 'maternicare_patientes',
  USER: 'maternicare_user',
  OFFLINE_QUEUE: 'maternicare_offline_queue',
  IS_ONLINE: 'maternicare_online',
};

// ─── Mapping Utilities ───────────────────────────────────────
const toSnakeCase = (obj: Record<string, unknown>): Record<string, unknown> => {
  const snake: Record<string, unknown> = {};
  for (const key in obj) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    snake[snakeKey] = obj[key];
  }
  return snake;
};

const toCamelCase = (obj: Record<string, unknown>): Record<string, unknown> => {
  const camel: Record<string, unknown> = {};
  for (const key in obj) {
    const camelKey = key.replace(/([-_][a-z])/g, group =>
      group.toUpperCase().replace('-', '').replace('_', '')
    );
    camel[camelKey] = obj[key];
  }
  return camel;
};

// ─── useLocalStorage ─────────────────────────────────────────
function getFromStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    console.warn('localStorage unavailable');
  }
}

// ─── Helper: extract User from Supabase session ──────────────
function userFromSession(session: Session | null): User | null {
  if (!session?.user) return null;
  const meta = session.user.user_metadata;
  return {
    id: session.user.id,
    email: session.user.email || '',
    nom: (meta?.nom as string) || 'Utilisateur',
    prenom: (meta?.prenom as string) || '',
    role: (meta?.role as User['role']) || 'sage-femme',
    centre: (meta?.centre as string) || 'Non défini',
  };
}

// ─── useSFEData ───────────────────────────────────────────────
export function useSFEData() {
  const [responses, setResponses] = useState<ReponseSFE[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchResponses = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('surveys_sfe')
      .select('*')
      .order('date', { ascending: false });

    if (!error && data) {
      setResponses(data.map(r => toCamelCase(r)) as unknown as ReponseSFE[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchResponses();
  }, [fetchResponses]);

  const save = useCallback(async (r: ReponseSFE) => {
    const { error } = await supabase
      .from('surveys_sfe')
      .upsert(toSnakeCase(r as unknown as Record<string, unknown>));

    if (error) throw error;
    fetchResponses();
  }, [fetchResponses]);

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('surveys_sfe')
      .delete()
      .eq('id', id);

    if (error) throw error;
    fetchResponses();
  }, [fetchResponses]);

  return { responses, save, remove, loading, refresh: fetchResponses };
}

// ─── usePatientesData ──────────────────────────────────────────
export function usePatientesData() {
  const [responses, setResponses] = useState<ReponsePatiente[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchResponses = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('surveys_patientes')
      .select('*')
      .order('date', { ascending: false });

    if (!error && data) {
      setResponses(data.map(r => toCamelCase(r)) as unknown as ReponsePatiente[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchResponses();
  }, [fetchResponses]);

  const save = useCallback(async (r: ReponsePatiente) => {
    const { error } = await supabase
      .from('surveys_patientes')
      .upsert(toSnakeCase(r as unknown as Record<string, unknown>));

    if (error) throw error;
    fetchResponses();
  }, [fetchResponses]);

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('surveys_patientes')
      .delete()
      .eq('id', id);

    if (error) throw error;
    fetchResponses();
  }, [fetchResponses]);

  return { responses, save, remove, loading, refresh: fetchResponses };
}

// ─── useAuth ──────────────────────────────────────────────────
export function useAuth() {
  const [user, setUser] = useState<User | null>(() =>
    getFromStorage<User | null>(STORAGE_KEYS.USER, null)
  );
  const [loading, setLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = userFromSession(session);
      if (u) {
        setUser(u);
        saveToStorage(STORAGE_KEYS.USER, u);
      }
      setLoading(false);
      setIsReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        const u = userFromSession(session);
        if (u) {
          setUser(u);
          saveToStorage(STORAGE_KEYS.USER, u);
        } else {
          setUser(null);
          localStorage.removeItem(STORAGE_KEYS.USER);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return !!data.user;
  }, []);

  const signup = useCallback(async (email: string, password: string, metadata: Partial<User>) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          nom: metadata.nom,
          prenom: metadata.prenom,
          role: metadata.role || 'sage-femme',
          centre: metadata.centre,
        }
      }
    });

    if (error) throw error;

    const needsConfirmation = !data.session && data.user && !data.user.email_confirmed_at;
    return { user: !!data.user, needsConfirmation };
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/#/reset-password`,
    });
    if (error) throw error;
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem(STORAGE_KEYS.USER);
  }, []);

  return { user, login, signup, resetPassword, updatePassword, logout, isAuthenticated: !!user, loading, isReady };
}

// ─── useOnlineStatus ──────────────────────────────────────────
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
