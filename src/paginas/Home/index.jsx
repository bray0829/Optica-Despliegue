import "./style.css";
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContextDefinition';
import usuariosService from '../../services/usuarios';

function Home() {
  const { user, loading } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user) return;
      try {
        const p = await usuariosService.getUsuarioById(user.id);
        if (!mounted) return;
        setPerfil(p);
      } catch (err) {
        console.error('Error cargando perfil en Home', err);
      }
    })();
    return () => { mounted = false; };
  }, [user]);

  if (loading) {
    return (
      <div className="home">
        <h2>Cargando...</h2>
      </div>
    );
  }

  const nombre = perfil?.nombre || user?.user_metadata?.full_name || user?.email || 'usuario';
  const rol = perfil?.rol || user?.rol || user?.user_metadata?.rol || user?.user_metadata?.role || 'invitado';

  const mensajes = {
    administrador: `Bienvenido, ${nombre}. Tienes acceso completo al panel administrativo.`,
    especialista: `Bienvenido, ${nombre}. Aquí puedes ver y gestionar exámenes y pacientes asignados.`,
    paciente: `Hola ${nombre}. Accede rápido a tus exámenes, citas y juegos.`,
    invitado: `Bienvenido al sistema. Por favor inicia sesión para acceder al panel.`,
  };

  const mensaje = mensajes[rol] || `Bienvenido, ${nombre}.`;

  const go = (path) => navigate(path);

  return (
    <div className="home">
      <h1>{mensaje}</h1>
      <p>Da click a una de los botones para acceder de manera rapida a la opcion de tu eleccion.</p>

      {rol === 'paciente' && (
        <div className="quick-actions" role="region" aria-label="Accesos rápidos">
          <button className="quick-btn" onClick={() => go('/examenes')}>🧾 Exámenes</button>
          <button className="quick-btn" onClick={() => go('/citas')}>📅 Citas</button>
          <button className="quick-btn" onClick={() => go('/juegos')}>🎮 Juegos</button>
        </div>
      )}

      {rol === 'especialista' && (
        <div className="quick-actions" role="region" aria-label="Accesos rápidos especialista">
          <button className="quick-btn" onClick={() => go('/pacientes')}>🧑‍⚕️ Pacientes</button>
          <button className="quick-btn" onClick={() => go('/examenes')}>🧾 Exámenes</button>
          <button className="quick-btn" onClick={() => go('/nuevo-examen')}>➕ Nuevo Examen</button>
          <button className="quick-btn" onClick={() => go('/citas')}>📅 Citas</button>
          <button className="quick-btn" onClick={() => go('/remisiones')}>📄 Remisiones</button>
        </div>
      )}
      {rol === 'administrador' && (
        <div className="quick-actions" role="region" aria-label="Accesos rápidos administrador">
          <button className="quick-btn" onClick={() => go('/')}>🏠 Inicio</button>
          <button className="quick-btn" onClick={() => go('/pacientes')}>🧑‍⚕️ Pacientes</button>
          <button className="quick-btn" onClick={() => go('/examenes')}>🧾 Exámenes</button>
          <button className="quick-btn" onClick={() => go('/nuevo-examen')}>➕ Nuevo Examen</button>
          <button className="quick-btn" onClick={() => go('/remisiones')}>📄 Remisiones</button>
          <button className="quick-btn" onClick={() => go('/citas')}>📅 Citas</button>
          <button className="quick-btn" onClick={() => go('/juegos')}>🎮 Juegos</button>
          <button className="quick-btn" onClick={() => go('/admin/users')}>👑 Admin</button>
          <button className="quick-btn" onClick={() => go('/ajustes')}>⚙️ Ajustes</button>
        </div>
      )}
    </div>
  );
}

export default Home;
