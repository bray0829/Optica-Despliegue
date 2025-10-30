import React from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../lib/supabaseClient';
import './style.css';
import ModalEdit from '../../Componentes/ModalEdit';
import DetailModal from '../../Componentes/DetailModal';

const Remisiones = () => {
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = React.useState('');
  const [remisiones, setRemisiones] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [filtro, setFiltro] = React.useState('todos'); // 🔹 Nuevo estado para el filtro

  React.useEffect(() => {
    let mounted = true;

    const fetchRemisiones = async () => {
      if (!supabase) {
        if (mounted) {
          setRemisiones([]);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        const { data: remData, error: remError } = await supabase
          .from('remisiones')
          .select('*')
          .order('fecha', { ascending: false });

        if (remError) {
          console.error('Error cargando remisiones:', remError);
          if (mounted) setRemisiones([]);
        } else {
          const rows = remData || [];

          // Traer pacientes
          const pacienteIds = Array.from(new Set(rows.map(r => r.paciente_id).filter(Boolean)));
          const especialistaIds = Array.from(new Set(rows.map(r => r.especialista_id).filter(Boolean)));

          let pacientesMap = {};
          if (pacienteIds.length > 0) {
            const { data: pacientesData } = await supabase
              .from('pacientes')
              .select('id,nombre')
              .in('id', pacienteIds);
            (pacientesData || []).forEach(p => { pacientesMap[p.id] = p; });
          }

          // Traer especialistas
          let especialistasMap = {};
          let usuarioIdsForEspecialistas = [];
          if (especialistaIds.length > 0) {
            const { data: eps } = await supabase
              .from('especialistas')
              .select('id,usuario_id,especialidad')
              .in('id', especialistaIds);
            (eps || []).forEach(e => {
              especialistasMap[e.id] = e;
              if (e.usuario_id) usuarioIdsForEspecialistas.push(e.usuario_id);
            });
          }

          // Traer usuarios
          let usuariosMap = {};
          if (usuarioIdsForEspecialistas.length > 0) {
            const { data: usuariosData } = await supabase
              .from('usuarios')
              .select('id,nombre')
              .in('id', usuarioIdsForEspecialistas);
            (usuariosData || []).forEach(u => { usuariosMap[u.id] = u; });
          }

          const enriched = rows.map(r => {
            const paciente = pacientesMap[r.paciente_id];
            const especialista = especialistasMap[r.especialista_id];
            const especialistaUsuario = especialista ? usuariosMap[especialista.usuario_id] : null;

            return {
              ...r,
              nombre: paciente?.nombre || r.nombre || '',
              especialidad: especialista?.especialidad || r.especialidad || '',
              especialista_nombre: especialistaUsuario?.nombre || r.especialista_nombre || ''
            };
          });

          if (mounted) setRemisiones(enriched);
        }
      } catch (err) {
        console.error('Excepción al cargar remisiones:', err);
        if (mounted) setRemisiones([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchRemisiones();
    return () => { mounted = false; };
  }, []);

  // 🔍 Filtro de búsqueda y por estado
  const filtradas = remisiones.filter((r) => {
    const b = busqueda.toLowerCase();
    const cumpleBusqueda =
      !busqueda ||
      (r.nombre && r.nombre.toLowerCase().includes(b)) ||
      (r.especialidad && r.especialidad.toLowerCase().includes(b)) ||
      (r.motivo && r.motivo.toLowerCase().includes(b));

    // 🔹 Filtrado por estado
    if (filtro === 'todos') return cumpleBusqueda;
    if (filtro === 'pendientes') return cumpleBusqueda && r.estado === 'pendiente';
    if (filtro === 'enviadas') return cumpleBusqueda && r.estado === 'enviada';
    if (filtro === 'resueltas') return cumpleBusqueda && r.estado === 'resuelta';
    if (filtro === 'finalizadas') return cumpleBusqueda && r.estado === 'finalizada';
    return cumpleBusqueda;
  });

  // 🔧 Modales
  const [modalOpen, setModalOpen] = React.useState(false);
  const [selected, setSelected] = React.useState(null);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [detailItem, setDetailItem] = React.useState(null);

  const handleEdit = (r) => {
    setSelected(r);
    setModalOpen(true);
  };

  const handleView = (r) => {
    setDetailItem(r);
    setDetailOpen(true);
  };

  const handleSaved = ({ action, item, id }) => {
    if (action === 'saved') {
      setRemisiones((prev) => prev.map((p) => (p.id === item.id ? item : p)));
    } else if (action === 'deleted') {
      setRemisiones((prev) => prev.filter((p) => p.id !== id));
    }
  };

  if (loading) {
    return (
      <main className="pacientes">
        <header className="header">
          <h2>Cargando remisiones...</h2>
        </header>
      </main>
    );
  }

  return (
    <main className="pacientes">
      <header className="header">
        <h2>Gestión de Remisiones</h2>
        <p className="descripcion">Consulta los registros de remisiones realizadas.</p>
      </header>

      <div className="acciones-pacientes">
        <input
          type="text"
          placeholder="Buscar por nombre, especialidad o motivo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="input-busqueda"
        />

        {/* 🔘 Botones de filtro */}
        <div className="botones-filtro">
          {['todos', 'pendientes', 'enviadas', 'resueltas', 'finalizadas'].map((estado) => (
            <button
              key={estado}
              className={`boton-filtro ${filtro === estado ? 'activo' : ''}`}
              onClick={() => setFiltro(estado)}
            >
              {estado.charAt(0).toUpperCase() + estado.slice(1)}
            </button>
          ))}
        </div>

        <button className="boton-nuevo" onClick={() => navigate('/nuevo-remision')}>
          + Nueva Remisión
        </button>
      </div>

      {filtradas.length === 0 ? (
        <div className="sin-datos-card">
          <p>🧾 No hay remisiones registradas</p>
        </div>
      ) : (
        <div className="grid-pacientes">
          {filtradas.map((r, index) => (
            <div key={r.id ?? index} className="card-paciente">
              <h3 className="card-title">{r.nombre || 'Paciente'}</h3>

              <div className="card-subtitle">
                <span className="fecha">{r.fecha}</span>
                {r.especialidad && <span className="dot">·</span>}
                <span className="doctor-name">{r.especialidad || 'Sin especialidad'}</span>
              </div>

              <div className="card-meta">
                <span className="motivo"><strong>Motivo:</strong> {r.motivo}</span>
                <span className="estado"><strong>Estado:</strong> {r.estado || 'Sin estado'}</span>
              </div>

              <div className="acciones-card">
                <button className="btn-ver" onClick={() => handleView(r)}>Ver</button>
                <button className="btn-editar" onClick={() => handleEdit(r)}>Editar</button>
                <button
                  className="btn-eliminar"
                  onClick={async () => {
                    if (!confirm('¿Eliminar remisión?')) return;
                    if (supabase) {
                      const { error } = await supabase.from('remisiones').delete().eq('id', r.id);
                      if (error) {
                        console.error(error);
                        alert('Error al eliminar');
                        return;
                      }
                      setRemisiones((prev) => prev.filter(p => p.id !== r.id));
                    } else {
                      setRemisiones((prev) => prev.filter(p => p.id !== r.id));
                    }
                  }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="paginacion">
        <button>Anterior</button>
        <span>1</span>
        <button>Siguiente</button>
      </div>

      {modalOpen && (
        <ModalEdit
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          item={selected}
          tableName="remisiones"
          fields={['nombre', 'fecha', 'especialidad', 'motivo', 'estado']}
          onSaved={handleSaved}
        />
      )}
      {detailOpen && (
        <DetailModal
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          item={detailItem}
          tableName="remisiones"
          fields={['nombre', 'fecha', 'especialidad', 'especialista_nombre', 'motivo', 'estado']}
          onSaved={(res) => { handleSaved(res); setDetailOpen(false); }}
        />
      )}
    </main>
  );
};

export default Remisiones;
