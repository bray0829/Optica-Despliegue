import React, { useState, useEffect, useCallback } from 'react';
import { SettingsContext } from './SettingsContextDefinition';

// Hook personalizado para manejar localStorage
const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error leyendo la clave ${key} de localStorage. Usando valor inicial.`, error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error guardando la clave ${key} en localStorage:`, error);
    }
  };

  return [storedValue, setValue];
};

// 🎨 Función para aplicar variables CSS globales según el tema
const applyThemeVariables = (theme) => {
  const isDark = theme === 'dark';
  const root = document.documentElement;

  const vars = {
    '--color-fondo': isDark ? '#111827' : '#f4f9ff',
    '--color-fondo-card': isDark ? '#1f2937' : '#ffffff',
    '--color-input': isDark ? '#374151' : '#ffffff',
    '--color-texto': isDark ? '#f9fafb' : '#111827',
    '--color-texto-secundario': isDark ? '#9ca3af' : '#6b7280',
    '--color-borde': isDark ? '#374151' : '#e5e7eb',
    '--color-hover': isDark ? '#374151' : '#f7fbff',
    '--color-acento': '#2b7bff',
    '--color-acento-secundario': '#2a6ef3',
    '--color-texto-boton': '#ffffff',
    '--color-error-fondo': isDark ? '#2f1515' : '#fff4f4',
    '--color-error-borde': isDark ? '#7f1d1d' : '#ffd6d6',
    '--color-error-texto': isDark ? '#fca5a5' : '#7b1111',
    '--color-sombra': isDark ? 'rgba(0,0,0,0.4)' : 'rgba(15,23,42,0.06)',
    '--color-boton-secundario': isDark ? '#374151' : '#f3f7ff',
  };

  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
};

// 🌙 Proveedor del contexto SettingsContext
export const SettingsProvider = ({ children }) => {
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  const [fontSize, setFontSize] = useLocalStorage('fontSize', 'medium');

  useEffect(() => {
    // Aplica atributos al <html>
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-font-size', fontSize);

    // 💡 Aplica las variables CSS globales
    applyThemeVariables(theme);

    console.log(`🎨 Tema aplicado: ${theme}`);
  }, [theme, fontSize]);

  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  }, [setTheme]);

  const changeFontSize = useCallback((size) => {
    setFontSize(size);
  }, [setFontSize]);

  return (
    <SettingsContext.Provider value={{ theme, toggleTheme, fontSize, changeFontSize }}>
      {children}
    </SettingsContext.Provider>
  );
};

export { SettingsContext };
export default SettingsProvider;
