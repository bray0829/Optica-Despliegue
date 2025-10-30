import React from 'react';
import './ModalCancelarCita.css';

const ModalCancelarCita = ({ open, onClose, onSubmit }) => {
  const [motivo, setMotivo] = React.useState('');

  if (!open) return null;

  const handleSubmit = () => {
    if (!motivo.trim()) {
      alert('Por favor ingresa un motivo para la cancelación.');
      return;
    }
    onSubmit(motivo);
    setMotivo('');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <h3>Cancelar Cita</h3>
        <p>Por favor ingresa el motivo de la cancelación:</p>
        <textarea
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Motivo de la cancelación..."
          className="modal-input"
        />
        <div className="modal-actions">
          <button className="btn-cerrar" onClick={onClose}>Cerrar</button>
          <button className="btn-enviar" onClick={handleSubmit}>Enviar</button>
        </div>
      </div>
    </div>
  );
};

export default ModalCancelarCita;