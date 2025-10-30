import React, { useContext } from 'react';
import Sidebar from '../Sidebar';
import { SettingsContext } from '../../context/SettingsContext';
import './style.css';

const Layout = ({ children }) => {
  const { theme } = useContext(SettingsContext);

  return (
    <div className={`layout-container ${theme === 'dark' ? 'dark' : ''}`}>
      <Sidebar />
      <main className="layout-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;
