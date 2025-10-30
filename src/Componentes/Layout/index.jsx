import React, { useContext } from 'react';
import Sidebar from '../Sidebar';
import { SettingsContext } from '../../context/SettingsContext';
import { Outlet } from 'react-router-dom'; // 👈 importa Outlet
import './style.css';

const Layout = () => {
  const { theme } = useContext(SettingsContext);

  return (
    <div className={`layout-base ${theme === 'dark' ? 'dark' : ''}`}>
      <Sidebar />
      <main className="main-content">
        {/* 👇 aquí se renderizan las páginas */}
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
