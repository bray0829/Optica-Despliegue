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

  // ✅ función segura para extraer path del PDF
  const getSafePdfPath = (obj) => {
    if (!obj) return null;

    // si existe pdf_path y es string → usarlo
    if (typeof obj.pdf_path === "string" && obj.pdf_path.trim() !== "") {
      return obj.pdf_path;
    }

    // si existe archivos[] y el primero es string → usarlo
    if (Array.isArray(obj.archivos) && typeof obj.archivos[0] === "string") {
      return obj.archivos[0];
    }

    // en caso contrario, NO usarlo
    return null;
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!item) return;

      const path = getSafePdfPath(item);
      if (!path) {
        setSignedUrl(null);
        return;
      }

      setLoadingSignedUrl(true);
      try {
        const url = await examenesService.getSignedUrl(path, 3600);

        if (!mounted) return;
        setSignedUrl(url);

      } catch (err) {
        console.error("Error fetching signed URL", err);
        setSignedUrlError(err?.message || "No se pudo obtener URL firmada");
      } finally {
        if (mounted) setLoadingSignedUrl(false);
      }
    })();

    return () => { mounted = false; };
  }, [item]);

  if (!open || !item) return null;

  const handleDelete = async () => {
    if (!confirm("¿Eliminar este registro? Esta acción no se puede deshacer.")) return;

    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq("id", item.id);

      if (error) throw error;

      onSaved && onSaved({ action: "deleted", id: item.id });
      onClose();

    } catch (err) {
      console.error("Delete error", err);
      alert("Error al eliminar. Revisa la consola.");
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

          {/* ✅ si hay PDF lo mostramos */}
          {signedUrl ? (
            <div className="pdf-preview">
              {loadingSignedUrl && <div>Obteniendo vista previa del PDF...</div>}
              {signedUrlError && <div className="form-error">{signedUrlError}</div>}
              <iframe
                src={signedUrl}
                title="PDF Preview"
                style={{ width: "100%", height: "60vh", border: "none" }}
              />
            </div>
          ) : (
            // ✅ si NO hay PDF, mostramos los campos normales
            (fields.length === 0
              ? Object.keys(item).map((k) => (
                  <div key={k} className="detail-row">
                    <strong>{k}:</strong> <span>{String(item[k] ?? "")}</span>
                  </div>
                ))
              : fields.map((k) => (
                  <div key={k} className="detail-row">
                    <strong>{k}:</strong> <span>{String(item[k] ?? "")}</span>
                  </div>
                ))
            )
          )}
        </div>

        <footer className="detail-footer">
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
            onSaved={(res) => {
              onSaved && onSaved(res);
              setEditOpen(false);
              onClose();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default DetailModal;
