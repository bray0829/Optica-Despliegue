import React from "react";
import { useNavigate } from 'react-router-dom';
import "./style.css";

const DetalleExamen = () => {
  const navigate = useNavigate();

  return (
    <div className="detalle-examen-container">
      {/* Botón Volver: esquina superior derecha, redirige a /examenes */}
      <button className="volver-btn" onClick={() => navigate('/examenes')} aria-label="Volver a exámenes">
        ← Volver
      </button>

      <h1 className="titulo text-center">Detalle del Examen</h1>

      <div className="detalle-grid">
          {/* Tarjeta 1: Información del Paciente */}
          <div className="card">
            <h2>Información del Paciente</h2>
            <p><strong>Nombre:</strong> Ana María González</p>
            <p><strong>Fecha:</strong> 15/10/2025</p>
            {/* Archivos movidos a la sección Multimedia */}
          </div>

          {/* Tarjeta 2: Diagnóstico */}
          <div className="card">
            <h2>Diagnóstico</h2>
            <div className="diagnostico-grid">
              {/* Eliminadas las simulaciones de examen; mostrar aviso si no hay diagnóstico real */}
              <p className="sin-diagnostico">No hay diagnóstico registrado para este examen.</p>
            </div>

            {/* Archivos movidos a la sección Multimedia */}
          </div>

          {/* Tarjeta 3: Notas */}
          <div className="card">
            <h2>Notas del Examen</h2>
            <p className="nota-texto">
              Revisión anual. Progresión miopía leve.
            </p>

            {/* Archivos movidos a la sección Multimedia */}
          </div>
      </div>

      {/* Contenedor independiente para multimedia */}
      <section className="multimedia-section">
        <h2 className="text-blue-700">Archivos Multimedia</h2>
        <div className="multimedia-grid">
          <div className="multimedia-item">
            <div className="archivo-preview-large">
              <img src="https://cdn-icons-png.flaticon.com/512/337/337946.png" alt="PDF grande" />
            </div>
            <div className="file-meta">
              <div className="file-name">Informe.pdf</div>
              <div className="file-type file-type-pdf">PDF</div>
            </div>
          </div>
          <div className="multimedia-item">
            <div className="archivo-preview-large">
              <img src="https://cdn-icons-png.flaticon.com/512/629/629690.png" alt="Imagen grande" />
            </div>
            <div className="file-meta">
              <div className="file-name">Foto Retina.jpg</div>
              <div className="file-type file-type-img">Imagen</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DetalleExamen;
