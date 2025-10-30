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
    <div
      className="home"
      style={{
        backgroundImage: `url('https://wallpapers.com/images/hd/rinnegan-1920-x-1080-n619iwueli7docp7.jpg')`, // 🌄 Cambia esta URL por la que quieras
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        textShadow: '1px 1px 4px rgba(0,0,0,0.8)',
      }}
    >
      <div className="bg-black/60 p-8 rounded-2xl text-center max-w-3xl backdrop-blur-sm">
        <h1 className="text-3xl font-bold mb-3">{mensaje}</h1>
        <p className="text-lg mb-6">
          Da click a uno de los botones para acceder rápidamente a la opción de tu elección.
        </p>

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
            <button className="quick-btn" onClick={() => go('/citas')}>📅 Citas</button>
            <button className="quick-btn" onClick={() => go('/remisiones')}>📄 Remisiones</button>
          </div>
        )}

        {rol === 'administrador' && (
          <div className="quick-actions" role="region" aria-label="Accesos rápidos administrador">
            <button className="quick-btn" onClick={() => go('/')}>🏠 Inicio</button>
            <button className="quick-btn" onClick={() => go('/pacientes')}>🧑‍⚕️ Pacientes</button>
            <button className="quick-btn" onClick={() => go('/examenes')}>🧾 Exámenes</button>
            <button className="quick-btn" onClick={() => go('/remisiones')}>📄 Remisiones</button>
            <button className="quick-btn" onClick={() => go('/citas')}>📅 Citas</button>
            <button className="quick-btn" onClick={() => go('/juegos')}>🎮 Juegos</button>
            <button className="quick-btn" onClick={() => go('/admin/users')}>👑 Admin</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
