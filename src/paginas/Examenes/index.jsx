import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './style.css';
import ModalEdit from '../../Componentes/ModalEdit';
import DetailModal from '../../Componentes/DetailModal';
import examenesService from '../../services/examenes';
import usuariosService from '../../services/usuarios';
import { useAuth } from '../../context/AuthContextDefinition';

const Examenes = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [examenes, setExamenes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Primero obtenemos el perfil del usuario actual
        let perfilUsuario = null;
        if (user?.id) {
          perfilUsuario = await usuariosService.getUsuarioById(user.id);
          if (!mounted) return;
          setPerfil(perfilUsuario);
        }

        // Luego, cargamos los exámenes
        const rows = await examenesService.listExamenes();
        if (!mounted) return;

        // Filtrar según el rol
        const rolActual = perfilUsuario?.rol || user?.rol || user?.user_metadata?.rol;
        let filtrados = rows;

        if (rolActual === 'paciente') {
          // Solo ver los exámenes de este paciente
          filtrados = rows.filter(r => r.paciente_id === user.id);
        } else if (rolActual === 'especialista' || rolActual === 'administrador') {
          // Pueden ver todos los exámenes
          filtrados = rows;
        }

        // Mapear para la UI
        const mapped = filtrados.map(r => ({
          id: r.id,
          paciente: r.pacientes?.nombre || r.paciente_id,
          fecha: r.fecha,
          notas: r.notas,
          pdf_path: r.pdf_path || null,
          archivos: r.pdf_path ? [r.pdf_path] : []
        }));

        setExamenes(mapped);
      } catch (err) {
        console.error('Error cargando exámenes', err);
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

  const currentRol = perfil?.rol || user?.rol || user?.user_metadata?.rol;
  const isAuthorizedToAdd = currentRol === 'especialista' || currentRol === 'administrador';

  return (
    <main className="examenes">
      <header className="header">
        <h2>Gestión de Exámenes</h2>
        <p className="descripcion">
          Aquí podrás registrar, consultar y administrar los exámenes clínicos realizados.
        </p>
      </header>

      <div className="acciones-examenes">
        <input
          type="text"
          placeholder="Buscar examen..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="input-busqueda"
        />
        {isAuthorizedToAdd && (
          <button
            className="boton-nuevo"
            onClick={() => navigate('/nuevo-examen')}
          >
            + Nuevo Examen
          </button>
        )}
      </div>

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
                {(isAuthorizedToAdd) && (
                  <>
                    <button
                      className="btn-editar"
                      onClick={() => { setSelected(examen); setModalOpen(true); }}
                    >
                      Editar
                    </button>
                    <button
                      className="btn-eliminar"
                      onClick={async () => {
                        if (!confirm('¿Eliminar examen?')) return;
                        try {
                          if (examen.pdf_path) {
                            try {
                              await examenesService.deleteFile(examen.pdf_path);
                            } catch (fileErr) {
                              console.warn('Error eliminando archivo', fileErr);
                            }
                          }
                          await examenesService.deleteExamen(examen.id);
                          setExamenes(prev => prev.filter(e => e.id !== examen.id));
                        } catch (err) {
                          console.error('Error eliminando examen', err);
                          alert('No se pudo eliminar el examen.');
                        }
                      }}
                    >
                      Eliminar
                    </button>
                  </>
                )}
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
          tableName="examenes"
          fields={['paciente', 'fecha', 'notas']}
          onSaved={handleSaved}
        />
      )}
      {detailOpen && (
        <DetailModal
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          item={detailItem}
          tableName="examenes"
          fields={['paciente', 'fecha', 'notas', 'archivos']}
          onSaved={(res) => { handleSaved(res); setDetailOpen(false); }}
        />
      )}
    </main>
  );
};

export default Examenes;
