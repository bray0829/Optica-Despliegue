import React from 'react';

const Logout = () => {
  // Aquí podrías agregar lógica de cierre de sesión real
  React.useEffect(() => {
    // Por ejemplo, limpiar tokens, redirigir, etc.
    window.location.href = '/login';
  }, []);

  return (
    <main style={{ padding: '2em', textAlign: 'center' }}>
      <h2>Sesión cerrada</h2>
      <p>Redirigiendo al inicio de sesión...</p>
    </main>
  );
};

export default Logout;
