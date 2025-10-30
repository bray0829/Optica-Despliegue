import React, { useState, useEffect, useCallback } from 'react';

// Asegúrate de que este archivo exista. Para el ejemplo, asumimos su estructura:
// const SettingsContext = React.createContext();
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
      // Permite recibir una función para actualizar el estado (prevValue => newValue)
      const valueToStore = value instanceof Function ? value(storedValue) : value; 
      setStoredValue(valueToStore);
      localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error guardando la clave ${key} en localStorage:`, error);
    }
  };

  return [storedValue, setValue];
};

// Proveedor del contexto SettingsContext
export const SettingsProvider = ({ children }) => {
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  const [fontSize, setFontSize] = useLocalStorage('fontSize', 'medium');

  // Aplica los atributos al elemento <html> cada vez que cambian 'theme' o 'fontSize'
  useEffect(() => {
    // 💡 Aquí se establece el atributo que el CSS utilizará
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-font-size', fontSize);
    console.log(`Tema aplicado: ${theme}`);
  }, [theme, fontSize]);

  const toggleTheme = useCallback(() => {
    // Invierte el tema y deja que el useEffect haga la actualización del DOM
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

// Exportar SettingsContext directamente
export { SettingsContext };

export default SettingsProvider;