import React, { useState, useContext } from "react";
import { SettingsContext } from "../../context/SettingsContext";
import "./FloatingSettingsBubble.css";

const FloatingSettingsBubble = () => {
  const { theme, toggleTheme, fontSize, changeFontSize } = useContext(SettingsContext);
  const [open, setOpen] = useState(false);

  const handleTextToSpeech = () => {
    const selectedText = window.getSelection().toString();
    if (selectedText) {
      const utterance = new SpeechSynthesisUtterance(selectedText);
      speechSynthesis.speak(utterance);
    } else {
      alert("Selecciona un texto para leer.");
    }
  };

  return (
    <div className="floating-settings">
      <button
        className="settings-button"
        onClick={() => setOpen(!open)}
        title="Accesibilidad"
      >
        ⚙️
      </button>

      {open && (
        <div className="settings-panel">
          <h4>Accesibilidad</h4>

          <div className="setting-item">
            <label>Modo:</label>
            <button onClick={toggleTheme}>
              {theme === "light" ? "🌞 Claro" : "🌙 Oscuro"}
            </button>
          </div>

          <div className="setting-item">
            <label>Tamaño de letra:</label>
            <select
              value={fontSize}
              onChange={(e) => changeFontSize(e.target.value)}
            >
              <option value="small">Pequeño</option>
              <option value="medium">Mediano</option>
              <option value="large">Grande</option>
            </select>
          </div>

          <div className="setting-item">
            <label>Asistente de voz:</label>
            <button onClick={handleTextToSpeech}>🔊 Leer texto</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloatingSettingsBubble;
