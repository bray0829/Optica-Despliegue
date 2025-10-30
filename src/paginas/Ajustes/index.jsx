import React, { useContext } from 'react';
import { SettingsContext } from '../../context/SettingsContext';
import './style.css';

const Ajustes = () => {
  const { theme, toggleTheme, changeFontSize } = useContext(SettingsContext);

  return (
    <div className="ajustes">
      <h1>Página de Ajustes</h1>

      <div className="ajuste-item">
        <label htmlFor="theme-toggle">Modo Claro/Oscuro:</label>
        <button id="theme-toggle" className="ajuste-boton" onClick={toggleTheme}>
          <span className="ajuste-icon">{theme === 'light' ? '🌞' : '🌙'}</span> Cambiar Tema
        </button>
      </div>

      <div className="ajuste-item">
        <label htmlFor="font-size">Tamaño de Texto:</label>
        <div id="font-size" className="ajuste-botones">
          <button className="ajuste-boton" onClick={() => changeFontSize('small')}>Pequeño</button>
          <button className="ajuste-boton" onClick={() => changeFontSize('medium')}>Mediano</button>
          <button className="ajuste-boton" onClick={() => changeFontSize('large')}>Grande</button>
        </div>
      </div>

      <div className="ajuste-item">
        <label htmlFor="voice-assistant">Asistente de Voz:</label>
        <button id="voice-assistant" className="ajuste-boton">
          <span className="ajuste-icon">🎤</span> Activar/Desactivar
        </button>
      </div>
    </div>
  );
};

export default Ajustes;