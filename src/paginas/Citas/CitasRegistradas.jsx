// ✅ CitasRegistradas — CORREGIDO CON CAMPOS REALES
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContextDefinition";
import especialistasService from "../../services/especialistas";
import "./style.css";
import DetailModal from "../../Componentes/DetailModal";
import ModalCancelarCita from "../../Componentes/ModalCancelarCita";

const CitasRegistradas = () => {
  const navigate = useNavigate();
  const { user, perfil } = useAuth();

  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("");

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [selectedCancel, setSelectedCancel] = useState(null);

  useEffect(() => {
    if (!perfil) return;
    let mounted = true;

    const fetchCitas = async () => {
      try {
        setLoading(true);

        // ✅ Cargar citas usando los nombres correctos
        const { data: rows, error } = await supabase
          .from("citas")
          .select("*")
          .order("fecha", { ascending: true });

        if (error) {
          console.error("❌ Error cargando citas:", error);
          return;
        }

        // ✅ IDs correctos
        const pacienteIds = [...new Set(rows.map(r => r.paciente_id))];
        const especialistaIds = [...new Set(rows.map(r => r.especialista_id))];

        // ✅ Cargar pacientes reales
        const pacientesMap = {};
        if (pacienteIds.length) {
          const { data: pacientes } = await supabase
            .from("pacientes")
            .select("id,nombre")
            .in("id", pacienteIds);

          pacientes?.forEach(p => (pacientesMap[p.id] = p));
        }

        // ✅ Cargar especialistas (tabla especialistas)
        const especialistasMap = {};
        const usuariosIds = [];

        if (especialistaIds.length) {
          const { data: especialistas } = await supabase
            .from("especialistas")
            .select("id,usuario_id,especialidad")
            .in("id", especialistaIds);

          especialistas?.forEach(e => {
            especialistasMap[e.id] = e;
            usuariosIds.push(e.usuario_id);
          });
        }

        // ✅ Cargar usuarios (nombre del doctor)
        const usuariosMap = {};
        if (usuariosIds.length) {
          const { data: usuarios } = await supabase
            .from("usuarios")
            .select("id,nombre")
            .in("id", usuariosIds);

          usuarios?.forEach(u => (usuariosMap[u.id] = u));
        }

        // ✅ Enriquecer datos con nombres reales
        const enriched = rows.map(r => ({
          ...r,
          paciente_nombre: pacientesMap[r.paciente_id]?.nombre || "",
          doctor: usuariosMap[especialistasMap[r.especialista_id]?.usuario_id]?.nombre || "",
          especialidad: especialistasMap[r.especialista_id]?.especialidad || "",
        }));

        // ✅ Filtrado por ROL
        const rol = perfil?.rol?.toLowerCase();
        let finalRows = enriched;

        if (rol === "especialista") {
          const esp = await especialistasService.getEspecialistaByUsuarioId(perfil.id);
          if (esp) finalRows = enriched.filter(c => c.especialista_id === esp.id);
        }

        if (rol === "paciente") {
          const { data: pac } = await supabase
            .from("pacientes")
            .select("id")
            .eq("usuario_id", perfil.id)
            .maybeSingle();

          if (pac) finalRows = enriched.filter(c => c.paciente_id === pac.id);
        }

        if (mounted) setCitas(finalRows);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchCitas();
    return () => (mounted = false);
  }, [perfil]);

  // ✅ Búsqueda
  const filtradas = citas.filter(c =>
    c.doctor?.toLowerCase().includes(filtro.toLowerCase()) ||
    c.fecha?.includes(filtro)
  );

  const rolLower = perfil?.rol?.toLowerCase();
  const isAdmin = rolLower === "admin" || rolLower === "administrador";

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

        {!isAdmin && (
          <button className="boton-nuevo" onClick={() => navigate("/agendar-cita")}>
            + Agendar Cita
          </button>
        )}
      </div>

      {loading ? (
        <div className="sin-datos-card"><p>Cargando...</p></div>
      ) : filtradas.length === 0 ? (
        <div className="sin-datos-card"><p>📅 No hay citas registradas</p></div>
      ) : (
        <div className="grid-citas">
          {filtradas.map(c => (
            <div key={c.id} className="card-cita">

              <h3 className="card-title">{c.paciente_nombre}</h3>

              <div className="card-subtitle">
                <span className="fecha">{c.fecha}</span>
                <span className="dot">·</span>
                <span className="doctor-name">{c.doctor}</span>
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
