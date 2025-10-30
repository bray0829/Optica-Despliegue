import React, { useState, useEffect } from 'react';
import supabase from '../../lib/supabaseClient';
import './style.css';

const ModalEdit = ({ open, onClose, item, tableName, onSaved }) => {
  const [nota, setNota] = useState('');
  const [loading, setLoading] = useState(false);

  // Cuando cambia el item, se carga la nota existente
  useEffect(() => {
    if (item) setNota(item.nota || '');
  }, [item]);

  if (!open || !item) return null;

  // Guardar solo el campo 'nota'
  const handleSave = async () => {
    if (!nota.trim()) {
      alert('La nota no puede estar vacía.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from(tableName)
        .update({ nota })
        .eq('id', item.id);

      if (error) throw error;

      // Avisar al componente padre del cambio
      onSaved && onSaved({ ...item, nota });
      onClose();
    } catch (err) {
      console.error('Error al guardar la nota:', err);
      alert('Error al guardar la nota. Ver consola.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-edit-backdrop" role="dialog" aria-modal="true">
      <div className="modal-edit">
        <header className="modal-edit-header">
          <h3>Editar Nota</h3>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">✕</button>
        </header>

        <div className="modal-edit-body">
          <label htmlFor="nota">Nota del examen</label>
          <textarea
            id="nota"
            name="nota"
            rows={5}
            value={nota}
            onChange={(e) => setNota(e.target.value)}
          />
        </div>

        <footer className="modal-edit-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar Nota'}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ModalEdit;
