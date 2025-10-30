import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../../lib/supabaseClient';
import './style.css'; // asegúrate de la ruta correcta

const NuevoRemision = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    pacienteName: '',
    pacienteId: '',
    fechaRemision: new Date().toISOString().slice(0, 10),
    correo: '',
    telefono: '',
    especialista: '',
    motivo: '',
  });

  const [suggestions, setSuggestions] = useState([]);
  const [especialistas, setEspecialistas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const debounceRef = useRef(null);
  const suggestionsRef = useRef(null); // para manejar blur/clicks

  useEffect(() => {
    const loadEspecialistas = async () => {
      try {
        const { data, error } = await supabase
          .from('especialistas')
          .select('id, usuario_id, usuarios (nombre)');
        if (error) throw error;
        const mapped = (data || []).map(e => ({ id: e.id, nombre: e.usuarios?.nombre || 'Sin nombre' }));
        setEspecialistas(mapped);
      } catch (err) {
        console.error('Error cargando especialistas', err);
      }
    };
    loadEspecialistas();
  }, []);

  // Buscar pacientes con reintento para relación usuario/usuarios
  const queryPacientesWithRelation = async (q) => {
    // cleaner query text
    const query = q.trim();
    if (!query) return [];

    // build or expression: nombre ilike OR documento ilike OR documento eq
    const orExpr = `nombre.ilike.%${query}%,documento.ilike.%${query}%`;

    // first try with relation 'usuario'
    try {
      const { data, error } = await supabase
        .from('pacientes')
        .select('id, nombre, documento, telefono, fecha_nacimiento, usuario(*)')
        .or(orExpr)
        .limit(12);

      if (!error) return data || [];
      // if error, fall through to try plural
      console.debug('query usuario(*) failed, trying usuarios(*)', error.message || error);
    } catch (err) {
      console.debug('Error trying usuario(*) select — will try usuarios(*)', err);
    }

    // try with 'usuarios' relationship (plural)
    try {
      const { data, error } = await supabase
        .from('pacientes')
        .select('id, nombre, documento, telefono, fecha_nacimiento, usuarios(*)')
        .or(orExpr)
        .limit(12);

      if (!error) return data || [];
      console.debug('query usuarios(*) returned error', error);
    } catch (err) {
      console.debug('Both usuario(*) and usuarios(*) selects failed', err);
    }

    // fallback: try without relation (no join)
    try {
      const { data, error } = await supabase
        .from('pacientes')
        .select('id, nombre, documento, telefono, fecha_nacimiento')
        .or(orExpr)
        .limit(12);
      if (!error) return data || [];
    } catch (err) {
      console.error('Fallback paciente query failed', err);
    }

    return [];
  };

  // función con debounce para UX
  const fetchPacientes = (q) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q || !q.trim()) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const results = await queryPacientesWithRelation(q);
        setSuggestions(results || []);
      } catch (err) {
        console.error('Error buscando pacientes', err);
        setSuggestions([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  };

  // Manejo de inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // si está cambiando el campo de búsqueda, lanzar búsqueda
    if (name === 'pacienteName') {
      fetchPacientes(value);
    }
  };

  // Cuando el usuario selecciona una sugerencia
  const selectSuggestion = (s) => {
    // s puede tener: s.usuario OR s.usuarios o ninguno (según la consulta que haya devuelto)
    const email =
      (s.usuario && s.usuario.email) ||
      (s.usuarios && s.usuarios.email) ||
      (s.usuarios && s.usuarios[0] && s.usuarios[0].email) || // en caso de array
      '';
    setFormData(prev => ({
      ...prev,
      pacienteName: s.nombre || '',
      pacienteId: s.id || '',
      correo: email || '',
      telefono: s.telefono || '',
      // no tocamos fechaRemision, que es la fecha actual ya seteada
    }));
    setSuggestions([]);
  };

  // cerrar sugerencias al hacer click fuera (mejor UX)
  useEffect(() => {
    const handleDocClick = (ev) => {
      // si clickean dentro del contenedor de sugerencias no cerrar
      if (suggestionsRef.current && suggestionsRef.current.contains(ev.target)) return;
      setSuggestions([]);
    };
    document.addEventListener('click', handleDocClick);
    return () => document.removeEventListener('click', handleDocClick);
  }, []);

  // enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.pacienteId || !formData.especialista || !formData.motivo) {
      setError('Completa los campos requeridos.');
      return;
    }

    setLoading(true);
    try {
      const { error: insertError } = await supabase.from('remisiones').insert([
        {
          paciente_id: formData.pacienteId,
          especialista_id: formData.especialista,
          motivo: formData.motivo,
          fecha: formData.fechaRemision,
          estado: 'pendiente',
        }
      ]);

      if (insertError) {
        console.error('Insert remision error:', insertError);
        setError('Error al guardar en la base de datos.');
      } else {
        navigate('/remisiones');
      }
    } catch (err) {
      console.error(err);
      setError('Error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="nuevo-paciente-container">
      <div className="card-wrap">
        <header className="card-header">
          <h1 className="main-title">Nueva Remisión</h1>
          <p className="subtitle">Completa los datos para crear una remisión.</p>
        </header>

        <form className="paciente-form" onSubmit={handleSubmit}>
          {error && <div className="form-error">{error}</div>}

          {/* Buscar paciente */}
          <section className="section">
            <h2 className="section-title">Buscar paciente</h2>
            <div className="search-input" style={{ position: 'relative' }}>
              <input
                type="text"
                name="pacienteName"
                value={formData.pacienteName}
                onChange={handleInputChange}
                placeholder="Ejemplo: Juan Pérez o 1030522972"
                aria-label="Buscar paciente"
              />
              <button
                type="button"
                className="search-button"
                onClick={() => fetchPacientes(formData.pacienteName)}
                disabled={searchLoading}
              >
                {searchLoading ? 'Buscando...' : 'Buscar'}
              </button>

              {/* lista de sugerencias */}
              {suggestions && suggestions.length > 0 && (
                <ul className="suggestions-list" ref={suggestionsRef} role="listbox" style={{ position: 'absolute', zIndex: 60, left: 0, right: 0, marginTop: 8 }}>
                  {suggestions.map((s) => {
                    // obtener email seguro para mostrar
                    const email = (s.usuario && s.usuario.email) || (s.usuarios && s.usuarios.email) || (s.usuarios && s.usuarios[0] && s.usuarios[0].email) || '';
                    return (
                      <li key={s.id} role="option" onMouseDown={() => selectSuggestion(s)}>
                        <strong>{s.nombre}</strong>{s.documento ? ` — ${s.documento}` : ''} {email ? ` • ${email}` : ''}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>

          {/* Detalles */}
          <section className="section">
            <h2 className="section-title">Detalles</h2>
            <div className="form-row">
              <div className="form-group">
                <label>Nombre completo</label>
                <input type="text" value={formData.pacienteName} placeholder="Ejemplo: Juan Pérez" disabled />
              </div>
              <div className="form-group">
                <label>Fecha de remisión</label>
                <input type="date" value={formData.fechaRemision} disabled />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Correo</label>
                <input type="email" value={formData.correo} placeholder="Ejemplo: juanperez@gmail.com" disabled />
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input type="tel" value={formData.telefono} placeholder="Ejemplo: 3201234567" disabled />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Especialista</label>
                <select
                  name="especialista"
                  value={formData.especialista}
                  onChange={(e) => setFormData(prev => ({ ...prev, especialista: e.target.value }))}
                  required
                >
                  <option value="">Selecciona un especialista</option>
                  {especialistas.map(e => (
                    <option key={e.id} value={e.id}>{e.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Motivo</label>
                <textarea
                  name="motivo"
                  value={formData.motivo}
                  onChange={(e) => setFormData(prev => ({ ...prev, motivo: e.target.value }))}
                  rows="3"
                  placeholder="Ejemplo: Remitir paciente para valoración oftalmológica"
                  required
                />
              </div>
            </div>
          </section>

          <div className="actions-row">
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Remisión'}
            </button>
            <button type="button" className="cancel-button" onClick={() => navigate('/remisiones')}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default NuevoRemision;
