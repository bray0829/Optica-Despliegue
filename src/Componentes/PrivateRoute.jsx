import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContextDefinition';
import Layout from '../components/Layout'; // asegúrate que exista esta ruta

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  // Mientras se carga la info del usuario, muestra un indicador
  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px'
      }}>
        Cargando...
      </div>
    );
  }

  // Si no hay usuario autenticado, redirige al login
  if (!user) return <Navigate to="/login" replace />;

  // Si el usuario está autenticado, muestra la interfaz dentro del layout
  return <Layout>{children}</Layout>;
}

export default PrivateRoute;
