import React, { useState, useEffect } from 'react';
import supabase from '../../lib/supabaseClient';
import examenesService from '../../services/examenes';
import ModalEdit from '../ModalEdit';
import './style.css';

const DetailModal = ({ open, onClose, item, tableName, fields = [], onSaved }) => {
  const [editOpen, setEditOpen] = useState(false);
  const [signedUrl, setSignedUrl] = useState(null);
  const [loadingSignedUrl, setLoadingSignedUrl] = useState(false);
  const [signedUrlError, setSignedUrlError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!item) return;
      // soporte: usar item.pdf_path o el primer archivo en item.archivos
      const path = item.pdf_path || (Array.isArray(item.archivos) && item.archivos.length ? item.archivos[0] : null);
      if (!path) return;
      setLoadingSignedUrl(true);
      try {
        const url = await examenesService.getSignedUrl(path, 60 * 60);
        if (!mounted) return;
        setSignedUrl(url);
      } catch (err) {
        console.error('Error fetching signed url', err);
        setSignedUrlError(err?.message || 'No se pudo obtener URL firmada');
      } finally {
        if (mounted) setLoadingSignedUrl(false);
      }
    })();
    return () => { mounted = false };
  }, [item]);

  if (!open || !item) return null;

  const handleDelete = async () => {
    if (!confirm('¿Eliminar este registro? Esta acción no se puede deshacer.')) return;
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
      alert('Error al eliminar. Revisa la consola.');
    }
  };
  

  return (
    <div className="detail-backdrop">
      <div className="detail-modal">
        <header className="detail-header">
          <h3>Detalle</h3>
          <button className="detail-close" onClick={onClose}>✕</button>
        </header>

        <div className="detail-body">
          {item.pdf_path ? (
            <div className="pdf-preview">
              {loadingSignedUrl && <div>Obteniendo vista previa del PDF...</div>}
              {signedUrlError && <div className="form-error">{signedUrlError}</div>}
              {signedUrl && <iframe src={signedUrl} title="PDF Preview" style={{ width: '100%', height: '60vh', border: 'none' }} />}
            </div>
          ) : (
            (fields.length === 0 ? (
              Object.keys(item).map((k) => (
                <div key={k} className="detail-row"><strong>{k}:</strong> <span>{String(item[k] ?? '')}</span></div>
              ))
            ) : (
              fields.map((k) => (
                <div key={k} className="detail-row"><strong>{k}:</strong> <span>{String(item[k] ?? '')}</span></div>
              ))
            ))
          )}
        </div>

        <footer className="detail-footer">
          {/* Edit removed per UI requirement */}
          <button className="btn btn-danger" onClick={handleDelete}>Eliminar</button>
          <button className="btn btn-cancel" onClick={onClose}>Cerrar</button>
        </footer>

        {editOpen && (
          <ModalEdit
            open={editOpen}
            onClose={() => setEditOpen(false)}
            item={item}
            tableName={tableName}
            fields={fields.length ? fields : Object.keys(item)}
            onSaved={(res) => { onSaved && onSaved(res); setEditOpen(false); onClose(); }}
          />
        )}
      </div>
    </div>
  );
};

export default DetailModal;
