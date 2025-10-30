import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContextDefinition';
import Layout from '../Componentes/Layout'; // usa 'Componentes' si tu carpeta se llama así

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
        }}
      >
        Cargando...
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return <Layout>{children}</Layout>;
}

export default PrivateRoute;
