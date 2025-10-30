import React from 'react';
import Sidebar from '../Sidebar';
import './style.css';

const Layout = ({ children }) => {
  return (
    <div className="layout-base">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;
