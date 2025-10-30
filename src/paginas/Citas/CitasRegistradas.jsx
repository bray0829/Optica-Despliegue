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

  // ✅ CARGAR CITAS SEGÚN ROL
  useEffect(() => {
    if (!perfil) return;

    let mounted = true;

    const loadCitas = async () => {
      setLoading(true);

      try {
        const rol = perfil.rol?.toLowerCase();
        let query = supabase.from("citas").select("*").order("fecha");

        // ✅ FILTRAR SEGÚN ROL

        // 👉 PACIENTE: buscar paciente_id desde usuario_id
        if (rol === "paciente") {
          const { data: paciente } = await supabase
            .from("pacientes")
            .select("id")
            .eq("usuario_id", perfil.id)
            .maybeSingle();

          if (paciente?.id) {
            query = query.eq("paciente_id", paciente.id);
          }
        }

        // 👉 ESPECIALISTA: buscar especialista_id desde usuario_id
        if (rol === "especialista") {
          const especialista = await especialistasService.getEspecialistaByUsuarioId(perfil.id);
          if (especialista?.id) {
            query = query.eq("especialista_id", especialista.id);
          }
        }

        // 👉 ADMIN: no filtra nada

        const { data: citasData, error } = await query;
        if (error) throw error;

        if (!mounted) return;

        //----------------------------------------------------
        // ✅ ENRIQUECER DATOS
        //----------------------------------------------------

        const pacienteIds = [...new Set(citasData.map(c => c.paciente_id))].filter(Boolean);
        const especialistaIds = [...new Set(citasData.map(c => c.especialista_id))].filter(Boolean);

        // ✅ Pacientes
        let pacientesMap = {};
        if (pacienteIds.length > 0) {
          const { data: pacientes } = await supabase
            .from("pacientes")
            .select("id, nombre")
            .in("id", pacienteIds);

          pacientesMap = Object.fromEntries(
            (pacientes || []).map(p => [p.id, p])
          );
        }

        // ✅ Especialistas
        let especialistasMap = {};
        let usuarioIds = [];

        if (especialistaIds.length > 0) {
          const { data: espDB } = await supabase
            .from("especialistas")
            .select("id, usuario_id, especialidad")
            .in("id", especialistaIds);

          espDB?.forEach(e => {
            especialistasMap[e.id] = e;
            if (e.usuario_id) usuarioIds.push(e.usuario_id);
          });
        }

        // ✅ Usuarios (doctores)
        let usuariosMap = {};
        if (usuarioIds.length > 0) {
          const { data: usuarios } = await supabase
            .from("usuarios")
            .select("id, nombre")
            .in("id", usuarioIds);

          usuariosMap = Object.fromEntries(
            (usuarios || []).map(u => [u.id, u])
          );
        }

        //----------------------------------------------------
        // ✅ CONSTRUIR DATOS LISTOS PARA MOSTRAR
        //----------------------------------------------------

        const enriched = citasData.map(cita => {
          const p = pacientesMap[cita.paciente_id];
          const e = especialistasMap[cita.especialista_id];
          const u = e ? usuariosMap[e.usuario_id] : null;

          return {
            ...cita,
            paciente_nombre: p?.nombre || "Paciente",
            doctor: u?.nombre || "Sin doctor",
            especialidad: e?.especialidad || "",
          };
        });

        setCitas(enriched);

      } catch (err) {
        console.error("❌ Error cargando citas:", err);
        setCitas([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadCitas();
    return () => (mounted = false);
  }, [perfil]);

  // ✅ FILTRO
  const filtradas = citas.filter(c => {
    if (!filtro) return true;
    const text = filtro.toLowerCase();
    return (
      (c.doctor && c.doctor.toLowerCase().includes(text)) ||
      (c.fecha && c.fecha.includes(text))
    );
  });

  // ✅ ACCIONES
  const handleView = (c) => {
    setDetailItem(c);
    setDetailOpen(true);
  };

  const handleCancel = (c) => {
    setSelectedCancel(c);
    setCancelOpen(true);
  };

  const submitCancel = async (motivo) => {
    if (!motivo?.trim()) return alert("Debes escribir un motivo.");
    const { error } = await supabase.from("citas").delete().eq("id", selectedCancel.id);
    if (error) return alert("Error al cancelar");
    setCitas(prev => prev.filter(x => x.id !== selectedCancel.id));
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
          onChange={(e) => setFiltro(e.target.value)}
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
                <button className="btn-ver" onClick={() => handleView(c)}>
                  Ver
                </button>

                {!isAdmin && (
                  <button className="btn-eliminar" onClick={() => handleCancel(c)}>
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {detailOpen && (
        <DetailModal
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          item={detailItem}
          tableName="citas"
          fields={["fecha", "hora", "paciente_nombre", "doctor", "motivo"]}
        />
      )}

      <ModalCancelarCita
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onSubmit={submitCancel}
      />
    </main>
  );
};

export default CitasRegistradas;
