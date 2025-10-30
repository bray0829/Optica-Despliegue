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
  const isSpecialist = perfil?.rol === 'especialista';
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [selectedCancel, setSelectedCancel] = useState(null);

  useEffect(() => {
    let mountedPerfil = true;
    (async () => {
      try {
        if (user?.id) {
          const p = await usuariosService.getUsuarioById(user.id);
          if (mountedPerfil) setPerfil(p);
        }
      } catch (err) {
        console.error('Error cargando perfil en CitasRegistradas', err);
      }
    })();

    const ejemplo = [
      { id: 1, fecha: '2025-10-20', hora: '09:00', doctor: 'Dr. Ruiz', motivo: 'Consulta general' },
      { id: 2, fecha: '2025-10-20', hora: '10:00', doctor: 'Dra. Morales', motivo: 'Control' },
      { id: 3, fecha: '2025-10-21', hora: '14:30', doctor: 'Dr. Torres', motivo: 'Seguimiento' },
    ];

    let mounted = true;
    const fetch = async () => {
      if (!supabase) {
        if (mounted) { setCitas(ejemplo); setLoading(false); }
        return;
      }
      try {
        setLoading(true);
        const { data, error } = await supabase.from('citas').select('*').order('fecha', { ascending: true });
        if (error) {
          console.error(error);
          if (mounted) setCitas(ejemplo);
        } else {
          const rows = data || ejemplo;

          // Enriquecer citas: resolver nombre de paciente y nombre del especialista (doctor)
          const pacienteIds = Array.from(new Set(rows.map(r => r.paciente_id).filter(Boolean)));
          const especialistaIds = Array.from(new Set(rows.map(r => r.especialista_id).filter(Boolean)));

          // Traer pacientes
          let pacientesMap = {};
          if (pacienteIds.length > 0) {
            const { data: pacientesData, error: pacError } = await supabase.from('pacientes').select('id,nombre').in('id', pacienteIds);
            if (pacError) console.warn('Error cargando pacientes para citas', pacError);
            (pacientesData || []).forEach(p => { pacientesMap[p.id] = p; });
          }

          // Traer especialistas
          let especialistasMap = {};
          let usuarioIdsForEspecialistas = [];
          if (especialistaIds.length > 0) {
            const { data: eps, error: espError } = await supabase.from('especialistas').select('id,usuario_id,especialidad').in('id', especialistaIds);
            if (espError) console.warn('Error cargando especialistas para citas', espError);
            (eps || []).forEach(e => { especialistasMap[e.id] = e; if (e.usuario_id) usuarioIdsForEspecialistas.push(e.usuario_id); });
          }

          // Traer usuarios para nombres de especialistas
          let usuariosMap = {};
          if (usuarioIdsForEspecialistas.length > 0) {
            const { data: usuariosData, error: usuError } = await supabase.from('usuarios').select('id,nombre').in('id', usuarioIdsForEspecialistas);
            if (usuError) console.warn('Error cargando usuarios para especialistas', usuError);
            (usuariosData || []).forEach(u => { usuariosMap[u.id] = u; });
          }

          const enriched = rows.map(r => {
            const paciente = pacientesMap[r.paciente_id];
            const especialista = especialistasMap[r.especialista_id];
            const especialistaUsuario = especialista ? usuariosMap[especialista.usuario_id] : null;

            return {
              ...r,
              paciente_nombre: paciente?.nombre || r.paciente_nombre || '',
              doctor: especialistaUsuario?.nombre || r.doctor || '',
              especialidad: especialista?.especialidad || r.especialidad || ''
            };
          });

          // Si el usuario autenticado es un especialista, mostrar sólo sus citas
          let finalRows = enriched;
          try {
            if (user?.id) {
              const esp = await especialistasService.getEspecialistaByUsuarioId(user.id);
              if (esp && esp.id) {
                finalRows = enriched.filter(r => String(r.especialista_id) === String(esp.id));
              }
            }
          } catch (err) {
            console.warn('No se pudo filtrar por especialista:', err);
          }

          // Si el usuario autenticado es un paciente, mostrar sólo sus propias citas
          try {
            if (user?.id) {
              const { data: pacienteData, error: pacienteError } = await supabase.from('pacientes').select('id,usuario_id').eq('usuario_id', user.id).maybeSingle();
              if (pacienteError) console.warn('Error buscando paciente por usuario_id', pacienteError);
              if (pacienteData && pacienteData.id) {
                finalRows = finalRows.filter(r => String(r.paciente_id) === String(pacienteData.id));
              }
            }
          } catch (err) {
            console.warn('No se pudo filtrar por paciente:', err);
          }

          if (mounted) setCitas(finalRows);
        }
      } catch (err) {
        console.error(err); if (mounted) setCitas(ejemplo);
      } finally { if (mounted) setLoading(false); }
    };
    fetch();
    return () => { mounted = false; mountedPerfil = false; };
  }, [user?.id]);

  const filtradas = citas.filter(c => {
    if (!filtro) return true;
    const b = filtro.toLowerCase();
    return (c.doctor && c.doctor.toLowerCase().includes(b)) || (c.fecha && c.fecha.includes(b));
  });

  const handleView = (c) => { setDetailItem(c); setDetailOpen(true); };
  const handleCancel = (c) => { setSelectedCancel(c); setCancelOpen(true); };

  const submitCancel = async (motivo) => {
    if (!motivo.trim()) {
      alert('Por favor ingresa un motivo para la cancelación.');
      return;
    }
    if (supabase) {
      const { error } = await supabase.from('citas').delete().eq('id', selectedCancel.id);
      if (error) { alert('Error al cancelar la cita'); console.error(error); return; }
      setCitas(prev => prev.filter(x => x.id !== selectedCancel.id));
    } else {
      setCitas(prev => prev.filter(x => x.id !== selectedCancel.id));
    }
    alert('Cita cancelada correctamente');
    setCancelOpen(false);
    setSelectedCancel(null);
  };

  return (
    <main className="citas-registradas">
      <header className="header">
        <h2>Gestión de Citas</h2>
        <p className="descripcion">Consulta los registros de citas agendadas.</p>
      </header>

      <div className="acciones-citas">
        <input
          className="input-busqueda"
          placeholder="Buscar por fecha o doctor..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
        {!isSpecialist && (
          <button className="boton-nuevo" onClick={() => navigate('/agendar-cita')}>+ Agendar Cita</button>
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
              <h3 className="card-title">{c.paciente_nombre || c.paciente || 'Paciente'}</h3>

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
                <button className="btn-eliminar" onClick={() => handleCancel(c)}>Cancelar</button>
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
          fields={[ 'fecha', 'hora', 'paciente_nombre', 'doctor', 'motivo' ]}
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
