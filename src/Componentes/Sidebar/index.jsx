import React, { useState, useRef, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from '../../context/AuthContextDefinition';
import usuariosService from '../../services/usuarios';
import { sidebarIcons } from "./icons";
import './style.css';

const menu = [
  { icon: sidebarIcons.Inicio, label: "Inicio", to: "/" },
  { icon: sidebarIcons.Pacientes, label: "Pacientes", to: "/pacientes" },
  { icon: sidebarIcons.Exámenes, label: "Exámenes", to: "/examenes" },
  { icon: sidebarIcons.Remisiones, label: "Remisiones", to: "/remisiones" },
  { icon: sidebarIcons.Citas, label: "Citas", to: "/citas" },
  { icon: sidebarIcons.Juegos, label: "Juegos", to: "/juegos" },
];

const Sidebar = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPaciente, setIsPaciente] = useState(false); // New state for 'paciente' role
  const [open, setOpen] = useState(false);
  const sidebarRef = useRef(null);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user) return;
      try {
        const perfil = await usuariosService.getUsuarioById(user.id);
        if (!mounted) return;
        setIsAdmin(perfil?.rol === 'administrador');
        setIsPaciente(perfil?.rol === 'paciente'); // Check if user is 'paciente'
      } catch (err) {
        console.error('Error fetching perfil in sidebar', err);
      }
    })();
    return () => { mounted = false; };
  }, [user]);

  // Filter menu based on role
  const filteredMenu = isPaciente
    ? menu.filter(item => ['/', '/examenes', '/citas', '/juegos'].includes(item.to))
    : menu;

  // Cerrar menú al seleccionar una opción
  const handleNavClick = () => setOpen(false);

  return (
    <>
      {/* Botón hamburguesa */}
      <button
        className="sidebar-hamburger"
        aria-label="Abrir menú"
        onClick={() => setOpen(!open)}
      >
        <span className="hamburger-icon">&#9776;</span>
      </button>
      {/* Overlay para cerrar al hacer clic fuera */}
      {open && <div className="sidebar-overlay" onClick={() => setOpen(false)} />}
      <aside
        ref={sidebarRef}
        className={`sidebar sidebar-animated${open ? ' open' : ''}`}
        tabIndex={-1}
      >
        <div className="sidebar-header">
          <div className="sidebar-avatar">{user?.name?.charAt(0) || 'U'}</div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user?.name || 'Usuario'}</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          <ul>
            {filteredMenu.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) => isActive ? "active" : ""}
                  onClick={handleNavClick}
                >
                  <span className="sidebar-icon" aria-hidden="true">{item.icon}</span>
                  {item.label}
                </NavLink>
              </li>
            ))}
            {isAdmin && (
              <li>
                <NavLink to="/admin/users" className={({isActive}) => isActive ? 'active' : ''} onClick={handleNavClick}>
                  <span className="sidebar-icon" aria-hidden>👑</span>
                  Admin
                </NavLink>
              </li>
            )}
          </ul>
          <hr className="sidebar-divider" />
          <div className="sidebar-bottom">
            <NavLink to="/ajustes" onClick={handleNavClick}><span className="sidebar-icon">{sidebarIcons.Ajustes}</span> Ajustes</NavLink>
            <NavLink to="/logout" onClick={handleNavClick}><span className="sidebar-icon">{sidebarIcons.Salir}</span> Salir</NavLink>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
