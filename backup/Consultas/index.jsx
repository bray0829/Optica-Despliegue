import React from 'react';
import { useAuth } from '../../context/AuthContext';
import supabase from '../../lib/supabaseClient';
import './style.css';
import ModalEdit from '../../Componentes/ModalEdit';
import DetailModal from '../../Componentes/DetailModal';

const Consultas = () => {
  const { user, loading: authLoading } = useAuth();
  const [busqueda, setBusqueda] = React.useState('');
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;

    const fetchForEspecialista = async () => {
      if (!supabase) {
        if (mounted) { setItems([]); setLoading(false); }
        return;
      }

      if (authLoading) return;
      if (!user) {
        if (mounted) { setItems([]); setLoading(false); }
        return;
      }

      try {
        setLoading(true);

        const { data: espData, error: espError } = await supabase.from('especialistas').select('id').eq('usuario_id', user.id).limit(1).single();
        if (espError || !espData) {
          console.error('No se encontró especialista para el usuario:', espError || 'no data');
          if (mounted) { setItems([]); setLoading(false); }
          return;
        }
        const espId = espData.id;

        const { data: citasData, error: citasError } = await supabase.from('citas').select('*').eq('especialista_id', espId).order('fecha', { ascending: false });
        if (citasError) throw citasError;

        const { data: remData, error: remError } = await supabase.from('remisiones').select('*').eq('especialista', espId).order('fecha', { ascending: false });
        if (remError) throw remError;

        const { data: consData, error: consError } = await supabase.from('consultas').select('*').eq('especialista', espId).order('fecha', { ascending: false });
        if (consError) throw consError;

        const combined = [];
        if (citasData) combined.push(...citasData.map(r => ({ ...r, _type: 'cita' })));
        if (remData) combined.push(...remData.map(r => ({ ...r, _type: 'remision' })));
        if (consData) combined.push(...consData.map(r => ({ ...r, _type: 'consulta' })));

        if (mounted) setItems(combined);
      } catch (err) {
        console.error('Error cargando datos para especialista:', err);
        if (mounted) setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchForEspecialista();

    return () => { mounted = false; };
  }, [user, authLoading]);

  const filtradas = items.filter((c) => {
    if (!busqueda) return true;
    const b = busqueda.toLowerCase();
    return (
      (c.nombre && String(c.nombre).toLowerCase().includes(b)) ||
      (c.diagnostico && String(c.diagnostico).toLowerCase().includes(b)) ||
      (c.motivo && String(c.motivo).toLowerCase().includes(b)) ||
      (c.hora && String(c.hora).toLowerCase().includes(b))
    );
  });

  const [detailOpen, setDetailOpen] = React.useState(false);
  const [detailItem, setDetailItem] = React.useState(null);

  const handleSaved = ({ action, item, id }) => {
    if (action === 'saved') {
      setItems((prev) => prev.map((p) => (p.id === item.id ? item : p)));
    } else if (action === 'deleted') {
      setItems((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const handleView = (c) => { setDetailItem(c); setDetailOpen(true); };

  if (loading || authLoading) {
    return (
      <main className="pacientes">
        <header className="header">
          <h2>Cargando consultas...</h2>
        </header>
      </main>
    );
  }

  return (
    <main className="pacientes">
      <header className="header">
        <h2>Gestión de Consultas</h2>
        <p className="descripcion">Consulta los registros de consultas realizadas.</p>
      </header>

        <div className="acciones-pacientes">
        <input
          type="text"
          placeholder="Buscar por nombre, diagnóstico, motivo u hora..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="input-busqueda"
        />

        <div className="botones-filtro">
          <button className="boton-filtro activo">Todos</button>
          <button className="boton-filtro">Recientes</button>
        </div>
      </div>

      {filtradas.length === 0 ? (
        <div className="sin-datos-card">
          <p>🗂 No hay registros asignados a este especialista</p>
        </div>
      ) : (
        <div className="grid-pacientes">
          {filtradas.map((c, index) => (
            <div key={c.id ?? index} className="card-paciente">
              <h3>{c.nombre || (c.paciente_nombre || 'Sin nombre')}</h3>
              <p><strong>Tipo:</strong> {c._type}</p>
              {c.fecha && <p><strong>Fecha:</strong> {c.fecha}</p>}
              {c.hora && <p><strong>Hora:</strong> {c.hora}</p>}
              {c.diagnostico && <p><strong>Diagnóstico:</strong> {c.diagnostico}</p>}
              {c.motivo && <p><strong>Motivo:</strong> {c.motivo}</p>}

              <div className="acciones-card">
                <button className="btn-ver" onClick={() => handleView(c)}>Ver</button>
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
      {detailOpen && (
        <DetailModal
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          item={detailItem}
          tableName="consultas"
          fields={[ 'nombre', 'fecha', 'diagnostico', 'especialista' ]}
          onSaved={(res) => { handleSaved(res); setDetailOpen(false); }}
        />
      )}
    </main>
  );
};

export default Consultas;
