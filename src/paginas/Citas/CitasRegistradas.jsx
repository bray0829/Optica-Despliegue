import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContextDefinition';
import especialistasService from '../../services/especialistas';
import usuariosService from '../../services/usuarios';
import DetailModal from '../../Componentes/DetailModal';
import ModalCancelarCita from '../../Componentes/ModalCancelarCita';
import './style.css';

const CitasRegistradas = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [citas, setCitas] = useState([]);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [selectedCancel, setSelectedCancel] = useState(null);

  const isSpecialist = perfil?.rol === 'especialista';
  const isPaciente = perfil?.rol === 'paciente';
  const isAdmin = perfil?.rol === 'admin';

  // === Cargar perfil del usuario autenticado ===
  useEffect(() => {
    let mounted = true;
    const fetchPerfil = async () => {
      try {
        if (user?.id) {
          const p = await usuariosService.getUsuarioById(user.id);
          if (mounted) setPerfil(p);
        }
      } catch (err) {
        console.error('Error cargando perfil en CitasRegistradas:', err);
      }
    };
    fetchPerfil();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  // === Cargar citas según rol ===
  useEffect(() => {
    if (!user?.id || !perfil) return;

    let mounted = true;
    const fetchCitas = async () => {
      setLoading(true);
      try {
        let query = supabase.from('citas').select('*').order('fecha', { ascending: true });

        // 👩‍⚕️ Especialista: solo sus citas
        if (perfil.rol === 'especialista') {
          const especialista = await especialistasService.getEspecialistaByUsuarioId(user.id);
          if (especialista?.id) query = query.eq('especialista_id', especialista.id);
        }

        // 🧍‍♂️ Paciente: solo sus citas
        else if (perfil.rol === 'paciente') {
          const { data: paciente, error } = await supabase
            .from('pacientes')
            .select('id')
            .eq('usuario_id', user.id)
            .maybeSingle();
          if (error) console.warn('Error buscando paciente', error);
          if (paciente?.id) query = query.eq('paciente_id', paciente.id);
        }

        // 👑 Admin: ve todas (no filtramos nada)

        const { data, error } = await query;
        if (error) throw error;
        const rows = data || [];

        // Enriquecer datos con nombres de pacientes y especialistas
        const pacienteIds = [...new Set(rows.map(r => r.paciente_id).filter(Boolean))];
        const especialistaIds = [...new Set(rows.map(r => r.especialista_id).filter(Boolean))];

        const pacientesMap = {};
        if (pacienteIds.length > 0) {
          const { data: pacientesData } = await supabase
            .from('pacientes')
            .select('id,nombre')
            .in('id', pacienteIds);
          pacientesData?.forEach(p => (pacientesMap[p.id] = p));
        }

        const especialistasMap = {};
        const usuarioIds = [];
        if (especialistaIds.length > 0) {
          const { data: eps } = await supabase
            .from('especialistas')
            .select('id,usuario_id,especialidad')
            .in('id', especialistaIds);
          eps?.forEach(e => {
            especialistasMap[e.id] = e;
            if (e.usuario_id) usuarioIds.push(e.usuario_id);
          });
        }

        const usuariosMap = {};
        if (usuarioIds.length > 0) {
          const { data: usuariosData } = await supabase
            .from('usuarios')
            .select('id,nombre')
            .in('id', usuarioIds);
          usuariosData?.forEach(u => (usuariosMap[u.id] = u));
        }

        const enriched = rows.map(r => {
          const paciente = pacientesMap[r.paciente_id];
          const especialista = especialistasMap[r.especialista_id];
          const especialistaUsuario = especialista ? usuariosMap[especialista.usuario_id] : null;
          return {
            ...r,
            paciente_nombre: paciente?.nombre || '',
            doctor: especialistaUsuario?.nombre || '',
            especialidad: especialista?.especialidad || '',
          };
        });

        if (mounted) setCitas(enriched);
      } catch (err) {
        console.error('Error cargando citas:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchCitas();
    return () => {
      mounted = false;
    };
  }, [user?.id, perfil]);

  // === Filtro de búsqueda ===
  const filtradas = citas.filter(c => {
    if (!filtro) return true;
    const b = filtro.toLowerCase();
    return (
      (c.doctor && c.doctor.toLowerCase().includes(b)) ||
      (c.fecha && c.fecha.includes(b))
    );
  });

  // === Funciones para modales ===
  const handleView = (c) => {
    setDetailItem(c);
    setDetailOpen(true);
  };

  const handleCancel = (c) => {
    setSelectedCancel(c);
    setCancelOpen(true);
  };

  const submitCancel = async (motivo) => {
    if (!motivo.trim()) {
      alert('Por favor ingresa un motivo para la cancelación.');
      return;
    }
    if (supabase) {
      const { error } = await supabase.from('citas').delete().eq('id', selectedCancel.id);
      if (error) {
        alert('Error al cancelar la cita');
        console.error(error);
        return;
      }
      setCitas(prev => prev.filter(x => x.id !== selectedCancel.id));
    } else {
      setCitas(prev => prev.filter(x => x.id !== selectedCancel.id));
    }
    alert('Cita cancelada correctamente');
    setCancelOpen(false);
    setSelectedCancel(null);
  };

  // === Renderizado ===
  return (
    <main className="citas-registradas">
      <header className="header">
        <h2>Gestión de Citas</h2>
        <p className="descripcion">
          {isAdmin
            ? 'Visualización completa de todas las citas registradas.'
            : 'Consulta los registros de tus citas agendadas.'}
        </p>
      </header>

      <div className="acciones-citas">
        <input
          className="input-busqueda"
          placeholder="Buscar por fecha o doctor..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
        {!isSpecialist && (
          <button
            className="boton-nuevo"
            onClick={() => navigate('/agendar-cita')}
          >
            + Agendar Cita
          </button>
        )}
      </div>

      {loading ? (
        <div className="sin-datos-card">
          <p>Cargando...</p>
        </div>
      ) : filtradas.length === 0 ? (
        <div className="sin-datos-card">
          <p>📅 No hay citas registradas</p>
        </div>
      ) : (
        <div className="grid-citas">
          {filtradas.map(c => (
            <div key={c.id} className="card-cita">
              <h3 className="card-title">
                {c.paciente_nombre || 'Paciente sin nombre'}
              </h3>

              <div className="card-subtitle">
                <span className="fecha">{c.fecha}</span>
                {c.doctor && <span className="dot">·</span>}
                <span className="doctor-name">{c.doctor || 'Sin doctor'}</span>
              </div>

              <div className="card-meta">
                <span className="hora"><strong>Hora:</strong> {c.hora}</span>
                <span className="motivo"><strong>Motivo:</strong> {c.motivo}</span>
              </div>

              <div className="acciones-card">
                <button className="btn-ver" onClick={() => handleView(c)}>Ver</button>
                {!isAdmin && (
                  <button className="btn-eliminar" onClick={() => handleCancel(c)}>Cancelar</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {detailOpen && (
        <DetailModal
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          item={detailItem}
          tableName="citas"
          fields={['fecha', 'hora', 'paciente_nombre', 'doctor', 'motivo']}
        />
      )}

      <ModalCancelarCita
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onSubmit={submitCancel}
      />
    </main>
  );
};

export default CitasRegistradas;
