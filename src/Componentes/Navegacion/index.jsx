import React from "react";
import { Link } from "react-router-dom";
import "./style.css";

const Navegacion = () => {
  return (
    <nav className="navbar">
      <div className="logo">JBSoptics</div>
      <ul>
        <li><Link to="/">Inicio</Link></li>
        <li><Link to="/pacientes">Pacientes</Link></li>
        <li><Link to="/examenes">Exámenes</Link></li>
        <li><Link to="/login">Login</Link></li>
      </ul>
    </nav>
  );
};
export default Navegacion;
