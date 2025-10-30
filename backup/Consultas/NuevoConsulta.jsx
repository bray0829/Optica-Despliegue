import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../../lib/supabaseClient';
import '../../NuevoPaciente/style.css';

const NuevoConsulta = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: '',
    fechaNacimiento: '',
    sintomas: '',
    diagnostico: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.nombre || !formData.fechaNacimiento) {
      setError('Por favor completa los campos requeridos (nombre y fecha de nacimiento).');
      return;
    }

    setLoading(true);
    try {
      if (supabase) {
        const { error: insertError } = await supabase.from('consultas').insert([
          {
            nombre: formData.nombre,
            fecha_nacimiento: formData.fechaNacimiento,
            sintomas: formData.sintomas || null,
            diagnostico: formData.diagnostico || null,
            created_at: new Date().toISOString(),
          },
        ]);
        if (insertError) {
          console.error('Error insert consulta', insertError);
          setError('Error al guardar la consulta.');
        } else {
          navigate('/consultas');
        }
      } else {
        console.warn('Supabase no configurado. Simulando guardado.');
        navigate('/consultas');
      }
    } catch (err) {
      console.error(err);
      setError('Error inesperado al guardar la consulta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="nuevo-paciente-container">
      <div className="header-container">
        <h2>Nueva Consulta</h2>
        <button type="button" className="back-button" onClick={() => navigate('/consultas')}>
          ←
        </button>
      </div>

      <form onSubmit={handleSubmit} className="paciente-form">
        {error && <div className="form-error">{error}</div>}

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="nombre">Nombre del paciente</label>
            <input id="nombre" name="nombre" type="text" value={formData.nombre} onChange={handleInputChange} required />
          </div>

          <div className="form-group">
            <label htmlFor="fechaNacimiento">Fecha de nacimiento</label>
            <input id="fechaNacimiento" name="fechaNacimiento" type="date" value={formData.fechaNacimiento} onChange={handleInputChange} required />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group" style={{ flex: 1 }}>
            <label htmlFor="sintomas">Síntomas</label>
            <textarea id="sintomas" name="sintomas" value={formData.sintomas} onChange={handleInputChange} rows={4} />
          </div>

          <div className="form-group" style={{ flex: 1 }}>
            <label htmlFor="diagnostico">Diagnóstico</label>
            <textarea id="diagnostico" name="diagnostico" value={formData.diagnostico} onChange={handleInputChange} rows={4} />
          </div>
        </div>

        <button type="submit" className="submit-button" disabled={loading}>{loading ? 'Guardando...' : 'Guardar Consulta'}</button>
      </form>
    </main>
  );
};

export default NuevoConsulta;
