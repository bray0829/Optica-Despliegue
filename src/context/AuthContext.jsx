import React, { useEffect, useState } from 'react';
import supabase from '../lib/supabaseClient';
import { AuthContext } from './AuthContextDefinition';
import usuariosService from '../services/usuarios';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadUserSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const sessionUser = data?.session?.user ?? null;

        if (!mounted) return;
        setUser(sessionUser);

        if (sessionUser) {
          // 🔹 Buscar perfil por el mismo id del usuario en supabase.auth
          const perfilData = await usuariosService.getUsuarioById(sessionUser.id);

          if (perfilData) {
            setPerfil(perfilData);
            console.log('✅ Perfil cargado correctamente:', perfilData);
          } else {
            console.warn('⚠️ No se encontró perfil en la tabla usuarios para este ID:', sessionUser.id);
          }
        } else {
          setPerfil(null);
        }
      } catch (err) {
        console.error('❌ Error cargando sesión AuthProvider:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadUserSession();

    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      loadUserSession();
    });

    return () => {
      mounted = false;
      subscription?.subscription?.unsubscribe?.();
    };
  }, []);

  const value = {
    user,
    perfil,
    loading,
    signIn: (opts) => supabase.auth.signInWithPassword(opts),
    signUp: (opts) => supabase.auth.signUp(opts),
    signOut: () => supabase.auth.signOut(),
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20%' }}>
        <p>Cargando...</p>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
