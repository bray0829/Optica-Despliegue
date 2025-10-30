import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './style.css';
import ModalEdit from '../../Componentes/ModalEdit';
import DetailModal from '../../Componentes/DetailModal';
import examenesService from '../../services/examenes';
import { useAuth } from '../../context/AuthContextDefinition'; // Import useAuth
import usuariosService from '../../services/usuarios';

const Examenes = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // Get user from context
  const [perfil, setPerfil] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  // Datos de ejemplo (luego se conectan con base de datos)
  const [examenes, setExamenes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const rows = await examenesService.listExamenes();
        if (!mounted) return;
        // Mapear a la forma que espera la UI (incluir pdf_path para previsualización)
        const mapped = rows.map(r => ({
          id: r.id,
          paciente: r.pacientes?.nombre || r.paciente_id,
          fecha: r.fecha,
          notas: r.notas,
          pdf_path: r.pdf_path || null,
          archivos: r.pdf_path ? [r.pdf_path] : []
        }));
        setExamenes(mapped);
      } catch (err) {
        console.error('Error cargando examenes', err);
      }
    })();
    // fetch perfil to get role (so we can show/hide New button reliably)
    (async () => {
      try {
        if (user?.id) {
          const p = await usuariosService.getUsuarioById(user.id);
          if (!mounted) return;
          setPerfil(p);
        }
      } catch (err) {
        console.error('Error cargando perfil en Examenes', err);
      }
    })();

    return () => { mounted = false };
  }, [user?.id]);

  const handleSaved = ({ action, item, id }) => {
    if (action === 'saved') {
      setExamenes(prev => prev.map(e => e.id === item.id ? item : e));
    } else if (action === 'deleted') {
      setExamenes(prev => prev.filter(e => e.id !== id));
    }
  };

  // Determine role from perfil if available, otherwise fall back to auth user fields
  const currentRol = perfil?.rol || user?.rol || user?.user_metadata?.rol || user?.user_metadata?.role;
  const isAuthorizedToAdd = currentRol === 'especialista' || currentRol === 'administrador'; // Check role
  // Dev override: append ?devShowNew=1 to the URL to force-show the "+ Nuevo Examen" button
  const forceShowNew = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('devShowNew') === '1';

  // Debug: log user so you can see role/flags in the console
  useEffect(() => {
    console.log('Auth user (debug):', user);
  }, [user]);

  return (
    <main className="examenes">
      {/* Encabezado */}
      <header className="header">
        <h2>Gestión de Exámenes</h2>
        <p className="descripcion">
          Aquí podrás registrar, consultar y administrar los exámenes clínicos realizados.
        </p>
      </header>

      {/* Barra de búsqueda y acción */}
      <div className="acciones-examenes">
        <input
          type="text"
          placeholder="Buscar examen..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="input-busqueda"
        />
        {(isAuthorizedToAdd || forceShowNew) && (
          <button
            className="boton-nuevo"
            onClick={() => navigate('/nuevo-examen')}
          >
            + Nuevo Examen
          </button>
        )}
      </div>

      {/* Contenedor principal */}
      {examenes.length === 0 ? (
        <div className="sin-datos-card">
          <p>🧾 No hay exámenes registrados</p>
        </div>
      ) : (
        <div className="grid-examenes">
          {examenes.map((examen) => (
            <div key={examen.id} className="card-examen">
              <h3 className="card-title">{examen.paciente}</h3>

              <div className="card-subtitle">
                <span className="fecha">{new Date(examen.fecha).toLocaleDateString()}</span>
              </div>

              <div className="card-body">
                <p><strong>Notas:</strong> {examen.notas}</p>
                <p><strong>Archivos:</strong> {examen.archivos.join(', ')}</p>
              </div>

              <div className="acciones-card">
                <button
                  onClick={() => { setDetailItem(examen); setDetailOpen(true); }}
                  className="btn-ver"
                >
                  Ver
                </button>
                <button className="btn-editar" onClick={() => { setSelected(examen); setModalOpen(true); }}>Editar</button>
                <button className="btn-eliminar" onClick={async () => {
                  if (!confirm('¿Eliminar examen?')) return;
                  try {
                    // Primero, eliminar el archivo asociado si existe
                    if (examen.pdf_path) {
                      try {
                        await examenesService.deleteFile(examen.pdf_path);
                      } catch (fileErr) {
                        console.warn('Error deleting file from storage', fileErr);
                        // continuar con el borrado del registro aun si falla el archivo
                      }
                    }

                    await examenesService.deleteExamen(examen.id);
                    setExamenes(prev => prev.filter(e => e.id !== examen.id));
                  } catch (err) {
                    console.error('Error deleting examen', err);
                    alert('No se pudo eliminar el examen. Revisa la consola.');
                  }
                }}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Paginación */}
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
          tableName="examenes"
          fields={[ 'paciente', 'fecha', 'notas' ]}
          onSaved={handleSaved}
        />
      )}
      {detailOpen && (
        <DetailModal
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          item={detailItem}
          tableName="examenes"
          fields={[ 'paciente', 'fecha', 'notas', 'archivos' ]}
          onSaved={(res) => { handleSaved(res); setDetailOpen(false); }}
        />
      )}
    </main>
  );
};

export default Examenes;

