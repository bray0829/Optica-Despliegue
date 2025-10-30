// ✅ CitasRegistradas — CORREGIDO COMPLETO
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContextDefinition";
import especialistasService from "../../services/especialistas";
import usuariosService from "../../services/usuarios";
import DetailModal from "../../Componentes/DetailModal";
import ModalCancelarCita from "../../Componentes/ModalCancelarCita";
import "./style.css";

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
      setLoading(true);

      try {
        console.log("🔍 Cargando citas desde Supabase…");

        // ✅ Cargar citas reales
        const { data: rows, error } = await supabase
          .from("citas")
          .select("*")
          .order("fecha", { ascending: true });

        if (error) {
          console.error("❌ Error cargando citas:", error);
          return;
        }

        console.log("✅ Citas sin procesar:", rows);

        // ✅ Mapeo de IDs reales
        const pacienteIds = [...new Set(rows.map(r => r.paciente))];
        const especialistaIds = [...new Set(rows.map(r => r.especialista))];

        // ✅ Cargar pacientes
        const pacientesMap = {};
        if (pacienteIds.length) {
          const { data: pacientes } = await supabase
            .from("pacientes")
            .select("id,nombre")
            .in("id", pacienteIds);

          pacientes?.forEach(p => (pacientesMap[p.id] = p));
        }

        // ✅ Cargar especialistas
        const especialistasMap = {};
        const usuarioIds = [];

        if (especialistaIds.length) {
          const { data: especialistas } = await supabase
            .from("especialistas")
            .select("id,usuario_id,especialidad")
            .in("id", especialistaIds);

          especialistas?.forEach(e => {
            especialistasMap[e.id] = e;
            usuarioIds.push(e.usuario_id);
          });
        }

        // ✅ Cargar usuarios (doctores)
        const usuariosMap = {};
        if (usuarioIds.length) {
          const { data: usuarios } = await supabase
            .from("usuarios")
            .select("id,nombre")
            .in("id", usuarioIds);

          usuarios?.forEach(u => (usuariosMap[u.id] = u));
        }

        // ✅ Enriquecer citas
        const enriched = rows.map(r => ({
          ...r,
          paciente_nombre: pacientesMap[r.paciente]?.nombre || "",
          doctor: usuariosMap[especialistasMap[r.especialista]?.usuario_id]?.nombre || "",
          especialidad: especialistasMap[r.especialista]?.especialidad || "",
        }));

        console.log("✅ Citas procesadas:", enriched);

        // ✅ Filtrado por rol real
        const rol = perfil?.rol?.toLowerCase();
        let finalRows = enriched;

        if (rol === "especialista") {
          const esp = await especialistasService.getEspecialistaByUsuarioId(perfil.id);
          if (esp) {
            finalRows = enriched.filter(c => c.especialista === esp.id);
          }
        } else if (rol === "paciente") {
          const { data: pac } = await supabase
            .from("pacientes")
            .select("id")
            .eq("usuario_id", perfil.id)
            .maybeSingle();

          if (pac) {
            finalRows = enriched.filter(c => c.paciente === pac.id);
          }
        }

        if (mounted) setCitas(finalRows);
      } catch (err) {
        console.error("❌ Error general:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchCitas();
    return () => (mounted = false);
  }, [perfil]);

  const filtradas = citas.filter(c =>
    c.doctor?.toLowerCase().includes(filtro.toLowerCase()) ||
    c.fecha?.includes(filtro)
  );

  const handleView = c => {
    setDetailItem(c);
    setDetailOpen(true);
  };

  const handleCancel = c => {
    setSelectedCancel(c);
    setCancelOpen(true);
  };

  const submitCancel = async motivo => {
    if (!motivo.trim()) return alert("Debes escribir un motivo.");
    await supabase.from("citas").delete().eq("id", selectedCancel.id);
    setCitas(prev => prev.filter(x => x.id !== selectedCancel.id));
    alert("Cita cancelada.");
    setCancelOpen(false);
  };

  const rolLower = perfil?.rol?.toLowerCase();
  const isAdmin = rolLower === "admin" || rolLower === "administrador";

  return (
    <main className="citas-registradas">
      <header className="header">
        <h2>Gestión de Citas</h2>
        <p className="descripcion">
          {isAdmin
            ? "Visualización completa de todas las citas registradas."
            : "Consulta los registros de tus citas agendadas."}
        </p>
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

              <div className="acciones-card">
                <button className="btn-ver" onClick={() => handleView(c)}>Ver</button>
                {!isAdmin && (
                  <button className="btn-eliminar" onClick={() => handleCancel(c)}>Cancelar</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <DetailModal open={detailOpen} onClose={() => setDetailOpen(false)} item={detailItem} />

      <ModalCancelarCita
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onSubmit={submitCancel}
      />
    </main>
  );
};

export default CitasRegistradas;
