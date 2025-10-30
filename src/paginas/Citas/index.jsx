import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './style.css';
import { useAuth } from '../../context/AuthContextDefinition';
import usuariosService from '../../services/usuarios';

const Citas = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (user?.id) {
          const perfil = await usuariosService.getUsuarioById(user.id);
          if (!mounted) return;
          if (perfil?.rol === 'especialista') {
            // Si es especialista, redirigir directamente a la gestión de citas
            navigate('/citas-registradas');
            return;
          }
        }
      } catch (err) {
        console.error('Error comprobando rol en Citas index:', err);
      } finally {
        if (mounted) setChecking(false);
      }
    })();

    return () => { mounted = false; };
  }, [user?.id, navigate]);

  if (checking) return null;

  return (
    <main className="citas">
      <div className="citas-center">
        <button className="big-btn" onClick={() => navigate('/citas-registradas')}>🔹 Ver Citas Agendadas</button>
        <button className="big-btn" onClick={() => navigate('/agendar-cita')}>🔹 Agendar Nueva Cita</button>
      </div>
    </main>
  );
};

export default Citas;
