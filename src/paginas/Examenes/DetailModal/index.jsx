import React from 'react';

const DetailModal = ({ item, onClose }) => {
  const renderPreview = (fileName) => {
    const isImage = fileName.match(/\.(jpg|jpeg|png|gif)$/i);
    const isPDF = fileName.match(/\.pdf$/i);

    if (isImage) {
      return <img src={`/uploads/${fileName}`} alt={fileName} style={{ maxWidth: '100%', maxHeight: '200px' }} />;
    }

    if (isPDF) {
      return (
        <iframe
          src={`/uploads/${fileName}`}
          title={fileName}
          style={{ width: '100%', height: '200px' }}
        ></iframe>
      );
    }

    return <p>{fileName}</p>;
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Detalle</h2>
        <p><strong>Paciente:</strong> {item.paciente}</p>
        <p><strong>Fecha:</strong> {item.fecha}</p>
        <p><strong>Notas:</strong> {item.notas}</p>
        <p><strong>Archivos:</strong></p>
        <div className="file-previews">
          {item.archivos.map((fileName, index) => (
            <div key={index} className="file-preview">
              {renderPreview(fileName)}
            </div>
          ))}
        </div>
        <button onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
};

export default DetailModal;