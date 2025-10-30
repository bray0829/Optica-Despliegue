import React from "react";
import "./style.css";

const Dashboard = () => {
  return (
    <div className="dashboard-content">
      <h2>Panel principal</h2>
      <div className="cards">
        <div className="card">🩺 Nueva consulta</div>
        <div className="card">👥 Ver pacientes</div>
        <div className="card">📄 Generar remisión</div>
        <div className="card">📊 Indicadores</div>
      </div>
    </div>
  );
};

export default Dashboard;
