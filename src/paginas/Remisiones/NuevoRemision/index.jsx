import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../../lib/supabaseClient';
import '../../NuevoPaciente/style.css';

const NuevoRemision = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    pacienteName: '',
    pacienteId: '',
    fechaNacimiento: '',
    correo: '',
    telefono: '',
    especialista: '',
    motivo: '',
  });
  const [suggestions, setSuggestions] = useState([]);
  const [especialistas, setEspecialistas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadEspecialistas = async () => {
      try {
        const { data, error } = await supabase.from('especialistas').select('id, usuario_id, usuarios (nombre)');
        if (error) throw error;
        const mapped = (data || []).map(e => ({ id: e.id, nombre: e.usuarios?.nombre || 'Sin nombre' }));
        setEspecialistas(mapped);
      } catch (err) {
        console.error('Error cargando especialistas', err);
      }
    };
    loadEspecialistas();
  }, []);

  const fetchPacientes = async (q) => {
    if (!q) return setSuggestions([]);
    try {
      const { data, error } = await supabase.from('pacientes').select('id, nombre, documento, telefono, fecha_nacimiento, usuario (email)').ilike('nombre', `%${q}%`).limit(10);
      if (error) throw error;
      setSuggestions(data || []);
    } catch (err) {
      console.error('Error buscando pacientes', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const selectSuggestion = (s) => {
    setFormData(prev => ({
      ...prev,
      pacienteName: s.nombre,
      pacienteId: s.id,
      fechaNacimiento: s.fecha_nacimiento || '',
      correo: s.usuario?.email || '',
      telefono: s.telefono || '',
    }));
    setSuggestions([]);
  };

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
          fecha: new Date().toISOString().slice(0,10),
          estado: 'pendiente',
        }
      ]);
      if (insertError) {
        console.error(insertError);
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
        <button type="button" className="back-button" onClick={() => navigate('/remisiones')}>←</button>
        <header className="card-header">
          <h1 className="main-title">Nueva Remisión</h1>
          <p className="subtitle">Completa los datos para crear una remisión.</p>
        </header>

        <form className="paciente-form" onSubmit={handleSubmit}>
          {error && <div className="form-error">{error}</div>}

          <section className="section">
            <h2 className="section-title">Buscar paciente</h2>
            <div className="search-input">
              <input
                type="text"
                name="pacienteName"
                value={formData.pacienteName}
                onChange={(e) => { handleInputChange(e); fetchPacientes(e.target.value); }}
                placeholder="Escribe el nombre del paciente"
              />
              <button type="button" className="search-button" onClick={() => fetchPacientes(formData.pacienteName)}>Buscar</button>
            </div>
            {suggestions.length > 0 && (
              <ul className="suggestions-list">
                {suggestions.map(s => (
                  <li key={s.id} onClick={() => selectSuggestion(s)}>
                    {s.nombre} ({s.documento})
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="section">
            <h2 className="section-title">Detalles</h2>
            <div className="form-row">
              <div className="form-group">
                <label>Nombre completo</label>
                <input type="text" value={formData.pacienteName} disabled />
              </div>
              <div className="form-group">
                <label>Fecha de nacimiento</label>
                <input type="date" value={formData.fechaNacimiento} disabled />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Correo</label>
                <input type="email" value={formData.correo} disabled />
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input type="tel" value={formData.telefono} disabled />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Especialista</label>
                <select name="especialista" value={formData.especialista} onChange={handleInputChange} required>
                  <option value="">Selecciona un especialista</option>
                  {especialistas.map(e => (
                    <option key={e.id} value={e.id}>{e.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Motivo</label>
                <textarea name="motivo" value={formData.motivo} onChange={handleInputChange} rows="3" required />
              </div>
            </div>
          </section>

          <div className="actions-row">
            <button type="submit" className="submit-button" disabled={loading}>{loading ? 'Guardando...' : 'Guardar Remisión'}</button>
            <button type="button" className="cancel-button" onClick={() => navigate('/remisiones')}>Cancelar</button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default NuevoRemision;