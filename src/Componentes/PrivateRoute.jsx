import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContextDefinition';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null; // o un spinner

  if (!user) return <Navigate to="/login" replace />;

  return children;
}

export default PrivateRoute;