import React from 'react';
import { Link } from 'react-router-dom';
import './style.css';

export default function ResetSuccess() {
  return (
    <div className="reset-password-page">
      <div className="reset-card">
        <h2>Contraseña restablecida</h2>
        <p>Tu contraseña se ha actualizado correctamente.</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/login"><button>Ir al login</button></Link>
        </div>
      </div>
    </div>
  );
}
