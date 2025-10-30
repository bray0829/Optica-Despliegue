import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./Componentes/Layout";
import Home from "./paginas/Home";
import Pacientes from "./paginas/Pacientes";
import NuevoPaciente from "./paginas/NuevoPaciente";
import Examenes from "./paginas/Examenes";
import NuevoExamen from "./paginas/NuevoExamen";
import DetalleExamen from "./paginas/DetalleExamen";
import Remisiones from "./paginas/Remisiones";
import NuevoRemision from "./paginas/Remisiones/NuevoRemision";
import Citas from "./paginas/Citas";
import CitasRegistradas from "./paginas/Citas/CitasRegistradas";
import AgendarCita from "./paginas/Citas/AgendarCita";
import SeguirPunto from "./paginas/Juegos/SeguirPunto";
import EncontrarLetra from "./paginas/Juegos/EncontrarLetra";
import JuegosHome from "./paginas/Juegos";
import Login from "./paginas/Login";
import Registro from "./paginas/Registro";
import Logout from "./paginas/Logout";
import ResetPassword from "./paginas/ResetPassword";
import ResetSuccess from "./paginas/ResetPassword/success";
import AdminUsers from "./paginas/Admin/Users";

import PrivateRoute from "./Componentes/PrivateRoute.jsx";

import AdminRoute from "./Componentes/AdminRoute";

import FloatingSettingsBubble from "./Componentes/FloatingSettingsBubble/FloatingSettingsBubble";
import SettingsProvider from "./context/SettingsContext";

import "./App.css";
import "./assets/form-styles.css";

function App() {
  return (
    <SettingsProvider>
      <Router>
        <Routes>
          {/* 🔓 Rutas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/logout" element={<Logout />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/reset-password/success" element={<ResetSuccess />} />

          {/* 🔒 Rutas protegidas con Layout */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Home />} />
            <Route path="pacientes" element={<Pacientes />} />
            <Route path="nuevo-paciente" element={<NuevoPaciente />} />
            <Route path="examenes" element={<Examenes />} />
            <Route path="nuevo-examen" element={<NuevoExamen />} />
            <Route path="examen/:id" element={<DetalleExamen />} />
            <Route path="remisiones" element={<Remisiones />} />
            <Route path="nuevo-remision" element={<NuevoRemision />} />
            <Route path="citas" element={<Citas />} />
            <Route path="citas-registradas" element={<CitasRegistradas />} />
            <Route path="agendar-cita" element={<AgendarCita />} />
            <Route path="juegos" element={<JuegosHome />} />
            <Route path="juegos/seguir-punto" element={<SeguirPunto />} />
            <Route path="juegos/encontrar-letra" element={<EncontrarLetra />} />
            <Route
              path="admin/users"
              element={
                <AdminRoute>
                  <AdminUsers />
                </AdminRoute>
              }
            />
          </Route>
        </Routes>

        {/* ⚙️ Burbuja flotante de ajustes */}
        <FloatingSettingsBubble />
      </Router>
    </SettingsProvider>
  );
}

export default App;
