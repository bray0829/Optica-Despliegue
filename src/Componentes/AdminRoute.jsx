import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContextDefinition';
import usuariosService from '../services/usuarios';

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(null);

  useEffect(() => {
    let mounted = true;
    if (!user) {
      setIsAdmin(false);
      return;
    }
    (async () => {
      try {
        const perfil = await usuariosService.getUsuarioById(user.id);
        if (!mounted) return;
        setIsAdmin(perfil?.rol === 'administrador');
      } catch (err) {
        console.error('Error checking admin role', err);
        if (mounted) setIsAdmin(false);
      }
    })();

    return () => { mounted = false; };
  }, [user]);

  if (loading) return null;
  if (isAdmin === null) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return children;
}

export default AdminRoute;
