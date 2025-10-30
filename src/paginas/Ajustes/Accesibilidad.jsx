import React, { useContext } from 'react';
import { SettingsContext } from '../../context/SettingsContext';
import './style.css';

const Accesibilidad = () => {
  const { theme, toggleTheme, fontSize, changeFontSize } = useContext(SettingsContext);

  const handleFontSizeChange = (e) => {
    changeFontSize(e.target.value);
  };

  const handleTextToSpeech = () => {
    const selectedText = window.getSelection().toString();
    if (selectedText) {
      const utterance = new SpeechSynthesisUtterance(selectedText);
      speechSynthesis.speak(utterance);
    } else {
      alert('Por favor selecciona un texto para leer.');
    }
  };

  return (
    <div className="accesibilidad">
      <h2>Ajustes de Accesibilidad</h2>

      <div className="ajuste-item">
        <label htmlFor="theme-toggle">Modo Claro/Oscuro:</label>
        <button id="theme-toggle" onClick={toggleTheme}>
          Cambiar a {theme === 'light' ? 'Oscuro' : 'Claro'}
        </button>
      </div>

      <div className="ajuste-item">
        <label htmlFor="font-size">Tamaño de Letra:</label>
        <select id="font-size" value={fontSize} onChange={handleFontSizeChange}>
          <option value="small">Pequeño</option>
          <option value="medium">Mediano</option>
          <option value="large">Grande</option>
        </select>
      </div>

      <div className="ajuste-item">
        <label htmlFor="voice-assistant">Asistente de Voz:</label>
        <button id="voice-assistant" onClick={handleTextToSpeech}>
          Leer Texto Seleccionado
        </button>
      </div>
    </div>
  );
};

export default Accesibilidad;