import React, { useEffect, useState } from 'react';
import supabase from '../lib/supabaseClient';
import { AuthContext } from './AuthContextDefinition';

/**
 * Contexto de autenticación extendido:
 * - Guarda tanto el usuario autenticado (auth.user)
 * - Como el perfil en tu tabla `usuarios`
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);          // Usuario de Supabase Auth
  const [userProfile, setUserProfile] = useState(null); // Perfil en tabla `usuarios`
  const [loading, setLoading] = useState(true);

  // Carga sesión inicial y escucha cambios
  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;

        const authUser = data?.session?.user ?? null;
        setUser(authUser);

        if (authUser?.id) {
          // Busca el perfil en tu tabla `usuarios` usando auth_id
          const { data: perfil, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('auth_id', authUser.id)
            .single();

          if (!error && perfil) setUserProfile(perfil);
        } else {
          setUserProfile(null);
        }
      } catch (err) {
        console.error('Error cargando sesión:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadSession();

    // Escuchar cambios en sesión (login/logout)
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      const authUser = session?.user ?? null;
      setUser(authUser);

      if (authUser?.id) {
        const { data: perfil } = await supabase
          .from('usuarios')
          .select('*')
          .eq('auth_id', authUser.id)
          .single();
        setUserProfile(perfil ?? null);
      } else {
        setUserProfile(null);
      }
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  const value = {
    user,           // Usuario de auth
    userProfile,    // Perfil en la tabla `usuarios`
    loading,
    signIn: (opts) => supabase.auth.signInWithPassword(opts),
    signUp: (opts) => supabase.auth.signUp(opts),
    signOut: () => supabase.auth.signOut(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
