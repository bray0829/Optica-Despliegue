import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContextDefinition";
import "./style.css";

const CitasRegistradas = () => {
  const navigate = useNavigate();
  const { perfil } = useAuth();

  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("");

  useEffect(() => {
    if (!perfil) return;

    const cargar = async () => {
      setLoading(true);

      // ✅ Carga TODAS las relaciones en una sola consulta
      const { data, error } = await supabase
        .from("citas")
        .select(`
          *,
          paciente:paciente_id (id, nombre),
          especialista:especialista_id (
            id,
            especialidad,
            usuario:usuario_id (id, nombre)
          )
        `)
        .order("fecha", { ascending: true });

      if (error) {
        console.error(error);
        return;
      }

      let resultado = data;

      // ✅ FILTRO POR ROL
      const rol = perfil.rol?.toLowerCase();

      if (rol === "paciente") {
        resultado = resultado.filter(c => c.paciente?.id === perfil.paciente_id);
      }

      if (rol === "especialista") {
        resultado = resultado.filter(c => c.especialista?.usuario?.id === perfil.id);
      }

      setCitas(resultado);
      setLoading(false);
    };

    cargar();
  }, [perfil]);

  const filtradas = citas.filter(c =>
    c.especialista?.usuario?.nombre?.toLowerCase().includes(filtro.toLowerCase()) ||
    c.fecha?.includes(filtro)
  );

  return (
    <main className="citas-registradas">
      <header className="header">
        <h2>Gestión de Citas</h2>
      </header>

      <div className="acciones-citas">
        <input
          className="input-busqueda"
          placeholder="Buscar por fecha o doctor..."
          value={filtro}
          onChange={e => setFiltro(e.target.value)}
        />

        <button className="boton-nuevo" onClick={() => navigate("/agendar-cita")}>
          + Agendar Cita
        </button>
      </div>

      {loading ? (
        <div className="sin-datos-card">Cargando...</div>
      ) : filtradas.length === 0 ? (
        <div className="sin-datos-card">📅 No hay citas</div>
      ) : (
        <div className="grid-citas">
          {filtradas.map(c => (
            <div key={c.id} className="card-cita">
              <h3>{c.paciente?.nombre}</h3>

              <div className="card-subtitle">
                <span>{c.fecha}</span>
                <span className="dot">·</span>
                <span>{c.especialista?.usuario?.nombre}</span>
              </div>

              <div className="card-meta">
                <span><strong>Hora:</strong> {c.hora}</span>
                <span><strong>Motivo:</strong> {c.motivo}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
};

export default CitasRegistradas;
