import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './style.css';
import supabase from '../../lib/supabaseClient';

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const NuevoPaciente = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: '',
    documento: '',
    fechaNacimiento: '',
    telefono: '',
    direccion: '',
    observaciones: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validation, setValidation] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setValidation(prev => ({ ...prev, [name]: '' }));
  };

  const handleSearchChange = (e) => setSearchQuery(e.target.value);

  const buscarUsuario = async () => {
    setError(null);
    if (!searchQuery || searchQuery.trim().length < 3) {
      setError('Ingresa al menos 3 caracteres para buscar.');
      return null;
    }
    setLoadingSearch(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('usuarios')
        .select('id, nombre, email, telefono')
        .or(`nombre.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .limit(1);

      if (fetchError) {
        console.error('Error al buscar usuario:', fetchError);
        setError('Error al buscar usuario. Intenta nuevamente.');
        return null;
      }

      if (!data || data.length === 0) {
        setError('No se encontró ningún usuario con ese nombre o correo.');
        return null;
      }

      const usuario = data[0];
      setFormData(prev => ({ ...prev, nombre: usuario.nombre || '', telefono: usuario.telefono || '' }));
      return usuario.id;
    } catch (err) {
      console.error('Excepción al buscar usuario:', err);
      setError('Error inesperado al buscar usuario.');
      return null;
    } finally {
      setLoadingSearch(false);
    }
  };

  const validate = () => {
    const v = {};
    if (!formData.documento || formData.documento.trim() === '') v.documento = 'Documento es requerido';
    if (!formData.fechaNacimiento) v.fechaNacimiento = 'Fecha de nacimiento es requerida';
    if (!formData.direccion || formData.direccion.trim() === '') v.direccion = 'Dirección es requerida';
    setValidation(v);
    return Object.keys(v).length === 0;
  };

  const guardarPaciente = async (usuarioId) => {
    setSaving(true);
    try {
      // Check if a paciente with the same documento already exists
      const { data: existing, error: existErr } = await supabase
        .from('pacientes')
        .select('id')
        .eq('documento', formData.documento)
        .limit(1);

      if (existErr) {
        console.error('Error verificando existencia de paciente:', existErr);
        setError('Error al verificar paciente existente. Intenta nuevamente.');
        return false;
      }

      if (existing && existing.length > 0) {
        // si existe, actualizamos en vez de insertar para evitar conflicto
        const pacienteId = existing[0].id;
        const { error: updateErr } = await supabase
          .from('pacientes')
          .update({
            usuario_id: usuarioId,
            nombre: formData.nombre,
            telefono: formData.telefono,
            fecha_nacimiento: formData.fechaNacimiento,
            direccion: formData.direccion,
            observaciones: formData.observaciones,
          })
          .eq('id', pacienteId);

        if (updateErr) {
          console.error('Error actualizando paciente existente:', updateErr);
          setError('Error al actualizar paciente existente.');
          return false;
        }

        return true;
      }

      // si no existe, insertamos un nuevo registro
      const { error: insertError } = await supabase.from('pacientes').insert([
        {
          usuario_id: usuarioId,
          nombre: formData.nombre,
          telefono: formData.telefono,
          documento: formData.documento,
          fecha_nacimiento: formData.fechaNacimiento,
          direccion: formData.direccion,
          observaciones: formData.observaciones,
        },
      ]);

      if (insertError) {
        console.error('Error al guardar paciente:', insertError);
        // si es un conflicto por unique constraint, dar mensaje más claro
        if (insertError.code === '23505') {
          setError('Ya existe un paciente con ese documento. Se intentó crear un duplicado.');
        } else {
          setError('Error al guardar el paciente. Intenta nuevamente.');
        }
        return false;
      }

      return true;
    } catch (err) {
      console.error('Excepción al guardar paciente:', err);
      setError('Error inesperado al guardar paciente.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    // Try to find user by search text first (if filled), otherwise proceed with creating
    const usuarioId = await buscarUsuario();
    if (!usuarioId) return;

    const ok = await guardarPaciente(usuarioId);
    if (ok) {
      alert('Paciente guardado correctamente');
      navigate('/pacientes');
    }
  };

  return (
    <main className="nuevo-paciente-container">
      <div className="card-wrap">
        <header className="card-header">
          <h1 className="main-title">🧑‍⚕️ Nuevo Paciente</h1>
          <p className="subtitle">Completar para registrar un nuevo paciente.</p>
        </header>

        <form onSubmit={handleSubmit} className="paciente-form" noValidate>
          {error && <div className="form-error" role="alert">{error}</div>}

          <section className="section">
            <h2 className="section-title">Búsqueda</h2>
            <div className="search-row">
              <label htmlFor="search" className="visually-hidden">Buscar usuario</label>
              <div className="search-input">
                <input
                  id="search"
                  type="text"
                  placeholder="Ej: Juan Pérez o correo@ejemplo.com"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
                <button type="button" className="search-button" onClick={buscarUsuario} aria-label="Buscar usuario">
                  <SearchIcon />
                  <span>{loadingSearch ? 'Buscando...' : 'Buscar'}</span>
                </button>
              </div>
            </div>
          </section>

          <section className="section">
            <h2 className="section-title">Datos personales</h2>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="nombre">Nombre completo</label>
                <input id="nombre" name="nombre" type="text" placeholder="Ej: Juan Pérez" value={formData.nombre} onChange={handleInputChange} />
              </div>

              <div className="form-group">
                <label htmlFor="documento">Documento / ID <span className="required">*</span></label>
                <input id="documento" name="documento" type="text" placeholder="Ej: 1012345678" value={formData.documento} onChange={handleInputChange} aria-invalid={!!validation.documento} />
                {validation.documento && <div className="field-error">{validation.documento}</div>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="fechaNacimiento">Fecha de nacimiento <span className="required">*</span></label>
                <input id="fechaNacimiento" name="fechaNacimiento" type="date" value={formData.fechaNacimiento} onChange={handleInputChange} aria-invalid={!!validation.fechaNacimiento} />
                {validation.fechaNacimiento && <div className="field-error">{validation.fechaNacimiento}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="telefono">Teléfono</label>
                <input id="telefono" name="telefono" type="tel" placeholder="Ej: 3015551234" value={formData.telefono} onChange={handleInputChange} />
              </div>
            </div>
          </section>

          <section className="section">
            <h2 className="section-title">Contacto</h2>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="direccion">Dirección <span className="required">*</span></label>
                <input id="direccion" name="direccion" type="text" placeholder="Ej: Cra 12 #34-56" value={formData.direccion} onChange={handleInputChange} aria-invalid={!!validation.direccion} />
                {validation.direccion && <div className="field-error">{validation.direccion}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="observaciones">Observaciones</label>
                <textarea id="observaciones" name="observaciones" placeholder="Agrega cualquier nota relevante sobre el paciente" rows={4} value={formData.observaciones} onChange={handleInputChange} />
              </div>
            </div>
          </section>

          <div className="actions-row">
            <button type="submit" className="submit-button" disabled={saving}>{saving ? 'Guardando...' : 'Guardar paciente'}</button>
            <button type="button" className="cancel-button" onClick={() => navigate('/pacientes')}>Cancelar</button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default NuevoPaciente;
