import React, { useState, useEffect } from 'react';
import supabase from '../../lib/supabaseClient';
import './style.css';

const ModalEdit = ({ open, onClose, item, tableName, fields = [], onSaved }) => {
  const [form, setForm] = useState({});
  const [original, setOriginal] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item) {
      setForm({ ...item });
      setOriginal({ ...item });
    }
  }, [item]);

  if (!open || !item) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleRestore = () => setForm({ ...original });

  const handleSave = async () => {
    setLoading(true);
    try {
      if (!supabase) {
        console.error("Supabase no inicializado");
        return;
      }

      // 🚫 Campos no editables
      const nonEditable = [
        'id',
        'usuario_id',
        'paciente_id',
        'especialista_id',
        'created_at',
        'updated_at'
      ];

      // ✅ Generar payload con solo columnas válidas
      const payload = {};
      for (const key in form) {
        if (
          !nonEditable.includes(key) &&
          form[key] !== undefined &&
          form[key] !== null
        ) {
          payload[key] = form[key];
        }
      }

      // ⚙️ Si se filtraron campos de visualización, se eliminan también
      delete payload.paciente;
      delete payload.especialista;

      if (Object.keys(payload).length === 0) {
        alert("No hay campos editables para guardar.");
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from(tableName)
        .update(payload)
        .eq('id', item.id);

      if (error) throw error;

      onSaved && onSaved({ action: 'saved', item: { ...item, ...payload } });
      onClose();
    } catch (err) {
      console.error('Error al guardar:', err);
      alert('Error al guardar los cambios. Revisa la consola para más detalles.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Eliminar este registro? Esta acción no se puede deshacer.')) return;
    setLoading(true);
    try {
      const { error } = await supabase.from(tableName).delete().eq('id', item.id);
      if (error) throw error;
      onSaved && onSaved({ action: 'deleted', id: item.id });
      onClose();
    } catch (err) {
      console.error('Error al eliminar:', err);
      alert('Error al eliminar el registro. Revisa la consola para más detalles.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-edit-backdrop" role="dialog" aria-modal="true">
      <div className="modal-edit">
        <header className="modal-edit-header">
          <h3>Editar registro</h3>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">✕</button>
        </header>

        <div className="modal-edit-body">
          {fields.length === 0 ? (
            <p>No hay campos configurados para editar.</p>
          ) : (
            fields.map((f) => {
              const isDisabled = [
                'id',
                'usuario_id',
                'paciente_id',
                'especialista_id',
                'created_at',
                'updated_at'
              ].includes(f);
              return (
                <div key={f} className="modal-field">
                  <label htmlFor={f}>
                    {f.charAt(0).toUpperCase() + f.slice(1).replace(/([A-Z])/g, ' $1')}
                  </label>
                  <input
                    id={f}
                    name={f}
                    value={form[f] ?? ''}
                    onChange={handleChange}
                    disabled={isDisabled}
                    className={isDisabled ? 'disabled-field' : ''}
                    placeholder={isDisabled ? 'Campo no editable' : ''}
                  />
                </div>
              );
            })
          )}
        </div>

        <footer className="modal-edit-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancelar</button>
          <button className="btn btn-restore" onClick={handleRestore} disabled={loading}>Restaurar</button>
          <button className="btn btn-danger" onClick={handleDelete} disabled={loading}>Eliminar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ModalEdit;
