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
      if (supabase) {
        // ✅ Creamos un payload solo con campos editables
        const payload = {};
        fields.forEach((k) => {
          // ⚠️ Excluir campos no editables o que causan error
          if (!['usuario_id', 'paciente_id', 'especialista_id', 'id'].includes(k)) {
            payload[k] = form[k];
          }
        });

        const { error } = await supabase
          .from(tableName)
          .update(payload)
          .eq('id', item.id);

        if (error) throw error;

        onSaved && onSaved({ action: 'saved', item: { ...item, ...payload } });
      } else {
        // fallback local
        onSaved && onSaved({ action: 'saved', item: { ...form } });
      }
      onClose();
    } catch (err) {
      console.error('Save error', err);
      alert('Error al guardar. Ver consola para detalles.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Eliminar este registro? Esta acción no se puede deshacer.')) return;
    setLoading(true);
    try {
      if (supabase) {
        const { error } = await supabase.from(tableName).delete().eq('id', item.id);
        if (error) throw error;
        onSaved && onSaved({ action: 'deleted', id: item.id });
      } else {
        onSaved && onSaved({ action: 'deleted', id: item.id });
      }
      onClose();
    } catch (err) {
      console.error('Delete error', err);
      alert('Error al eliminar. Ver consola para detalles.');
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
            fields.map((f) => (
              <div key={f} className="modal-field">
                <label htmlFor={f}>
                  {f.charAt(0).toUpperCase() + f.slice(1).replace(/([A-Z])/g, ' $1')}
                </label>
                <input
                  id={f}
                  name={f}
                  value={form[f] ?? ''}
                  onChange={handleChange}
                  disabled={['usuario_id', 'paciente_id', 'especialista_id', 'id'].includes(f)}
                />
              </div>
            ))
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
s