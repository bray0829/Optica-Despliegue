import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../../assets/nuevo-examen.css";
import examenesService from '../../services/examenes';
import { useAuth } from '../../context/AuthContextDefinition';
import especialistasService from '../../services/especialistas';
import { searchPacientes } from '../../services/pacientes';

function NuevoExamen() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    pdfFile: null,
    pacienteName: "",
    fechaExamen: "",
    notas: "",
    pacienteId: "",
    nombreCompleto: "",
    documento: "",
    tipoExamen: "",
    especialista: "",
    especialistaId: "",
  });
  const [especialistasList, setEspecialistasList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [bucketError, setBucketError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [selectedPaciente, setSelectedPaciente] = useState(null);
  const debounceRef = useRef(null);
  const pdfInputRef = useRef(null);
  const [uploadProgress, setUploadProgress] = useState({});
  const { user, loading: authLoading } = useAuth();

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "images") {
      setError('Solo se permiten archivos PDF. El campo de imágenes fue ignorado.');
      return;
    } else if (name === "pdfFile") {
      const f = files[0];
      if (f && !/\.pdf$/i.test(f.name) && f.type !== 'application/pdf') {
        setError('Solo se permiten archivos con extensión .pdf');
        return;
      }
      setFormData(prev => ({ ...prev, pdfFile: f }));
    } else {
      if (name === 'pacienteName') {
        setFormData(prev => ({ ...prev, [name]: value, pacienteId: '' }));
      } else if (name === 'especialistaId') {
        setFormData(prev => ({ ...prev, especialistaId: value }));
      } else {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    }
  };

  useEffect(() => {
    // Load especialistas for the select dropdown
    const loadEspecialistas = async () => {
      try {
        const list = await especialistasService.getAllEspecialistas();
        // dedupe by display key (name + especialidad) to avoid duplicate visible entries
        const seen = new Set();
        const dedup = [];
        (list || []).forEach(e => {
          const key = ((e.nombre || e.usuario_id || '') + '|' + (e.especialidad || '')).trim().toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            dedup.push(e);
          }
        });
        setEspecialistasList(dedup);
      } catch (err) {
        console.error('Error cargando especialistas', err);
      }
    };
    loadEspecialistas();

    // debounce search for pacientes when pacienteName changes
    const q = formData.pacienteName?.trim();
    if (!q) {
      setSuggestions([]);
      return;
    }

    setSuggestionsLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchPacientes(q);
        setSuggestions(results || []);
      } catch (err) {
        console.error('Error searching pacientes', err);
        setError('Error buscando pacientes');
      } finally {
        setSuggestionsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [formData.pacienteName]);

  const selectSuggestion = (paciente) => {
    setFormData(prev => ({
      ...prev,
      pacienteName: paciente.nombre,
      pacienteId: paciente.id,
      nombreCompleto: paciente.nombre || '',
      documento: paciente.documento || '',
    }));
    setSelectedPaciente(paciente);
    setSuggestions([]);
  };

  const searchNow = async () => {
    const q = formData.pacienteName?.trim();
    if (!q) return;
    setSuggestionsLoading(true);
    try {
      const results = await searchPacientes(q);
      if (results && results.length === 1) {
        selectSuggestion(results[0]);
      } else {
        setSuggestions(results || []);
      }
    } catch (err) {
      console.error('Error en búsqueda', err);
      setError('Error buscando pacientes');
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const handlePacienteBlur = () => {
    setTimeout(() => setSuggestions([]), 150);
  };

  useEffect(() => {
    const fetchIfNeeded = async () => {
      if (formData.pacienteId && !selectedPaciente) {
        try {
          const results = await searchPacientes(String(formData.pacienteId));
          if (results && results.length) {
            const p = results.find(r => String(r.id) === String(formData.pacienteId) || String(r.documento) === String(formData.pacienteId));
            if (p) setSelectedPaciente(p);
          }
        } catch (err) {
          console.debug('No se pudo obtener detalles del paciente automáticamente', err);
        }
      }
    };
    fetchIfNeeded();
  }, [formData.pacienteId, selectedPaciente]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.pacienteId && formData.pacienteName) {
      setSuggestionsLoading(true);
      try {
        const results = await searchPacientes(formData.pacienteName.trim());
        let matched = null;
        if (results && results.length) {
          const q = formData.pacienteName.trim();
          matched = results.find(r => String(r.documento) === q || String(r.id) === q || (r.nombre && r.nombre.toLowerCase() === q.toLowerCase()));
          if (!matched && results.length === 1) matched = results[0];
        }

        if (matched) {
          setFormData(prev => ({ ...prev, pacienteId: matched.id, pacienteName: matched.nombre }));
        } else {
          setError('Selecciona un paciente válido (ID). Si ingresaste un documento, selecciónalo de la lista.');
          setSuggestionsLoading(false);
          return;
        }
      } catch (err) {
        console.error('Error resolviendo paciente', err);
        setError('No se pudo buscar el paciente. Intenta nuevamente.');
        setSuggestionsLoading(false);
        return;
      } finally {
        setSuggestionsLoading(false);
      }
    }

    setLoading(true);
    try {
      try {
        const chk = await examenesService.checkBucketExists();
        if (!chk.exists) {
          console.warn('Bucket no existe, guardando examen sin archivos');
          await (async () => {
            let especialistaId = null;
            try {
              const esp = await especialistasService.getEspecialistaByUsuarioId(user?.id);
              especialistaId = esp?.id ?? null;
            } catch (err) {
              console.error('Error fetching especialista', err);
            }

            if (!especialistaId) {
              setError('No se encontró un registro de especialista asociado a tu usuario. Contacta al administrador o crea un especialista en la base de datos.');
              setLoading(false);
              return;
            }

            const examenToCreate = {
              paciente_id: formData.pacienteId || null,
              especialista_id: especialistaId,
              fecha: formData.fechaExamen,
              notas: formData.notas,
              pdf_path: null,
            };
            await examenesService.createExamen(examenToCreate);
          })();
          alert('El bucket no está disponible. Se guardaron los datos del examen sin archivos.');
          navigate('/examenes');
          return;
        } else {
          setBucketError(null);
        }
      } catch (err) {
        console.error('Error comprobando bucket', err);
        setError(err?.message || 'No se pudo comprobar el bucket de almacenamiento. Revisa la consola.');
        setLoading(false);
        return;
      }

      const maxPdfBytes = 20 * 1024 * 1024; // 20MB
      const pdfValidation = examenesService.validateFile(formData.pdfFile, { maxSizeBytes: maxPdfBytes, allowedTypes: ['application/pdf'] });
      if (!pdfValidation.valid) {
        setError('PDF inválido o demasiado grande (max 20MB).');
        setLoading(false);
        return;
      }

      // Prefer selected especialista from the form; fallback to authenticated user's especialista
      let especialistaId = formData.especialistaId || null;
      if (!especialistaId) {
        try {
          const esp = await especialistasService.getEspecialistaByUsuarioId(user?.id);
          especialistaId = esp?.id ?? null;
        } catch (err) {
          console.error('Error fetching especialista before create', err);
        }
      }

      const examenInitial = {
        paciente_id: formData.pacienteId,
        especialista_id: especialistaId,
        fecha: formData.fechaExamen,
        notas: formData.notas,
        pdf_path: null,
      };

      const created = await examenesService.createExamen(examenInitial);
      const examenId = created?.id;

      let pdfPath = null;
      if (formData.pdfFile) {
        try {
          try {
            const result = await examenesService.uploadFileWithProgress(formData.pdfFile, formData.pacienteId || 'examenes', (p) => {
              setUploadProgress(prev => ({ ...prev, pdf: p }));
            });
            pdfPath = result?.path;
          } catch (xhrErr) {
            console.warn('uploadFileWithProgress failed, falling back to uploadPdfAndGetSignedPath', xhrErr);
            const { path } = await examenesService.uploadPdfAndGetSignedPath(formData.pdfFile, formData.pacienteId || 'examenes');
            pdfPath = path;
          }
        } catch (upErr) {
          console.error('Error subiendo PDF', upErr);
          setError(upErr?.message || 'Error subiendo el PDF');
          navigate('/examenes');
          return;
        }
      }

      const updates = { pdf_path: pdfPath ?? null };
      try {
        await examenesService.updateExamen(examenId, updates);
      } catch (updateErr) {
        console.error('Failed to update examen with pdf url', updateErr);
        setError('El examen fue creado pero no se pudo registrar la URL del PDF. Revisa la consola.');
        navigate('/examenes');
        return;
      }

      alert('Examen guardado correctamente');
      navigate('/examenes');
    } catch (err) {
      console.error('Error saving examen', err);
      setError(err?.message ? `Error: ${err.message}` : 'Error al guardar el examen. Revisa la consola para más detalles.');
    } finally {
      setLoading(false);
    }
  };

  const saveWithoutFiles = async () => {
    setError(null);
    setLoading(true);
    try {
      const examenToCreate = {
        paciente_id: formData.pacienteId || null,
        especialista_id: null,
        fecha: formData.fechaExamen,
        notas: formData.notas,
        pdf_path: null,
      };
      await examenesService.createExamen(examenToCreate);
      alert('Examen guardado (sin archivos). Puedes subir archivos más tarde.');
      navigate('/examenes');
    } catch (err) {
      console.error('Error saving examen without files', err);
      setError('Error al guardar el examen sin archivos. Revisa la consola para más detalles.');
    } finally {
      setLoading(false);
    }
  };

  const retryCheckBucket = async () => {
    setError(null);
    setBucketError(null);
    setSuggestionsLoading(true);
    try {
      const chk = await examenesService.checkBucketExists();
      if (!chk.exists) {
        setBucketError(chk.message || 'El bucket de almacenamiento no existe o no es accesible.');
      }
      return chk;
    } catch (err) {
      console.error('Error reintentando check bucket', err);
      setBucketError('No se pudo comprobar el bucket. Revisa la consola.');
      return { exists: false, message: err?.message || String(err) };
    } finally {
      setSuggestionsLoading(false);
    }
  };

  return (
    <main className="nuevo-examen-outer">
      <div className="nuevo-examen-card">
        <button
          type="button"
          className="back-button"
          onClick={() => navigate('/examenes')}
        >
          ←
        </button>

        <div className="header-container">
          <div style={{textAlign:'center'}}>
            <h2>🧾 Nuevo Examen</h2>
            <div style={{color:'#64748b', marginTop:6}}>Registra un nuevo examen médico y asócialo a un paciente existente.</div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {bucketError && (
            <div className="form-error" style={{ background: '#ffe6e6', borderColor: '#ffb3b3' }}>
              <div style={{ marginBottom: 8 }}>{bucketError}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="secondary-button" onClick={retryCheckBucket}>Reintentar conexión</button>
                <button type="button" className="secondary-button" onClick={saveWithoutFiles}>Guardar sin archivos</button>
              </div>
            </div>
          )}
          {error && <div className="form-error">{error}</div>}
          {!authLoading && !user && (
            <div className="form-error" style={{ background: '#fff4e5', borderColor: '#ffd8a8' }}>
              Debes iniciar sesión para crear un examen. Si ya iniciaste sesión, espera unos segundos mientras se recupera tu sesión.
            </div>
          )}

          <div className="form-row search-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="pacienteName">Buscar paciente</label>
              <div className="autocomplete">
                <input
                  type="text"
                  id="pacienteName"
                  name="pacienteName"
                  value={formData.pacienteName}
                  onChange={(e) => { handleInputChange(e); setSelectedPaciente(null); }}
                  onBlur={handlePacienteBlur}
                  autoComplete="off"
                  placeholder="Ej: Juan Pérez o 1030522972"
                  aria-label="Buscar paciente por nombre o documento"
                  required
                />
                {suggestionsLoading && <div className="suggestions-loading">Buscando...</div>}
                {suggestions && suggestions.length > 0 && (
                  <ul className="suggestions-list" role="listbox">
                    {suggestions.map((s) => (
                      <li key={s.id} onMouseDown={() => selectSuggestion(s)} role="option">
                        <strong>{s.nombre}</strong> {s.documento ? ` - ${s.documento}` : ''} {s.telefono ? `(${s.telefono})` : ''}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button type="button" className="search-button" onClick={searchNow} disabled={suggestionsLoading || !formData.pacienteName} aria-label="Buscar paciente">
                {suggestionsLoading ? 'Buscando...' : '🔎 Buscar'}
              </button>
            </div>
          </div>

          <div className="details-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginTop: 8 }}>
            <div className="form-group">
              <label>Nombre completo</label>
              <input type="text" name="nombreCompleto" value={formData.nombreCompleto} onChange={handleInputChange} placeholder="Nombre completo" />
            </div>
            <div className="form-group">
              <label>Documento / ID</label>
              <input type="text" name="documento" value={formData.documento} onChange={handleInputChange} placeholder="Documento" />
            </div>

            <div className="form-group">
              <label>Tipo de examen</label>
              <input type="text" name="tipoExamen" value={formData.tipoExamen} onChange={handleInputChange} placeholder="Tipo de examen" />
            </div>
            <div className="form-group">
                <label htmlFor="especialistaId">Especialista</label>
                <select id="especialistaId" name="especialistaId" value={formData.especialistaId} onChange={handleInputChange}>
                  <option value="">-- Seleccionar especialista (opcional) --</option>
                  {especialistasList.map((esp) => (
                    <option key={esp.id} value={esp.id}>{(esp.nombre ? esp.nombre : esp.usuario_id) + (esp.especialidad ? ` — ${esp.especialidad}` : '')}</option>
                  ))}
                </select>
            </div>

            <div className="form-group">
              <label>Fecha del examen</label>
              <input type="date" name="fechaExamen" value={formData.fechaExamen} onChange={handleInputChange} />
            </div>
            <div />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="pdfFile">Subir PDF</label>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <input
                  type="file"
                  id="pdfFile"
                  name="pdfFile"
                  accept=".pdf"
                  onChange={handleInputChange}
                  style={{ display: 'none' }}
                  ref={pdfInputRef}
                />
                <button type="button" className="secondary-button" onClick={() => { if (pdfInputRef && pdfInputRef.current) pdfInputRef.current.click(); }}>
                  📎 Seleccionar archivo
                </button>
                <div style={{ fontSize: 13, color: '#64748b' }}>{formData.pdfFile ? formData.pdfFile.name : 'Ningún archivo seleccionado'}</div>
              </div>
              {uploadProgress.pdf != null && (
                <div className="upload-progress">PDF: {uploadProgress.pdf}%</div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="notas">Notas</label>
            <textarea
              id="notas"
              name="notas"
              value={formData.notas}
              onChange={handleInputChange}
              rows="4"
              placeholder="Agrega observaciones relevantes del examen"
            />
          </div>

          <button type="submit" className="submit-button" disabled={loading || authLoading || !user}>
            {loading ? 'Guardando...' : authLoading ? 'Verificando sesión...' : 'Guardar Examen'}
          </button>
        </form>
      </div>
    </main>
  );
}

export default NuevoExamen;
