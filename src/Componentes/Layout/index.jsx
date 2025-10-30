import React, { useContext } from 'react';
import Sidebar from '../Sidebar';
import { SettingsContext } from '../../context/SettingsContext'; // 👈 importa el contexto
import './style.css';

const Layout = ({ children }) => {
  const { theme } = useContext(SettingsContext); // 👈 obtiene el tema actual (light/dark)

  return (
    <div className={`layout-base ${theme === 'dark' ? 'dark' : ''}`}>
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;
