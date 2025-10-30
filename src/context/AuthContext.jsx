import React, { useEffect, useState } from 'react';
import supabase from '../lib/supabaseClient';
import { AuthContext } from './AuthContextDefinition';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const getSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        setUser(data?.session?.user ?? null);
      } catch (err) {
          console.error('Auth getSession error', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  const value = {
    user,
    loading,
    signIn: (opts) => supabase.auth.signInWithPassword(opts),
    signUp: (opts) => supabase.auth.signUp(opts),
    signOut: () => supabase.auth.signOut(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}


