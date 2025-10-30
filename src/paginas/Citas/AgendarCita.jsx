import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../../lib/supabaseClient";
import { searchPacientes } from "../../services/pacientes";
import { useAuth } from '../../context/AuthContextDefinition';
import usuariosService from '../../services/usuarios';

const AgendarCita = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({
    pacienteName: "",
    pacienteId: "",
    documento: "",
    telefono: "",
    fecha: "",
    hora: "",
    especialista: "",
    motivo: "",
  });

  const [especialistas, setEspecialistas] = useState([]);
  const [availableHours, setAvailableHours] = useState([]);
  const [citas, setCitas] = useState([]);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const debounceRef = useRef(null);
  const autocompleteRef = useRef(null);
  const documentoRef = useRef(null);

  const allHours = useMemo(
    () => ["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"],
    []
  );

  // Fecha mínima (hoy) en formato YYYY-MM-DD para el input date y validaciones
  const todayStr = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const todayDisplay = useMemo(() => {
    const [yyyy, mm, dd] = todayStr.split('-');
    return `${dd}/${mm}/${yyyy}`;
  }, [todayStr]);

  // 🔹 Cargar especialistas y citas
  useEffect(() => {
    // Si el usuario es especialista, no puede agendar citas
    let mounted = true;
    (async () => {
      try {
        if (user?.id) {
          const perfil = await usuariosService.getUsuarioById(user.id);
          if (!mounted) return;
          if (perfil?.rol === 'especialista') {
            alert('No tienes permiso para agendar citas.');
            navigate('/citas-registradas');
            return;
          }
        }
      } catch (err) {
        console.error('Error comprobando permisos en AgendarCita', err);
      }
    })();

    const fetchData = async () => {
      try {
        const { data: espData, error: espError } = await supabase
          .from("especialistas")
          .select("id, usuario_id, especialidad, usuarios (id, nombre)");

        if (espError) throw espError;

        const mapped =
          espData?.map((e) => ({
            id: e.id,
            usuario_id: e.usuario_id,
            nombre: e.usuarios?.nombre || "Sin nombre",
            especialidad: e.especialidad,
          })) || [];

        setEspecialistas(mapped);

        const { data: citasData, error: citasError } = await supabase
          .from("citas")
          .select("*");
        if (citasError) throw citasError;

        setCitas(citasData || []);
      } catch (err) {
        console.error("Error al cargar especialistas o citas:", err);
      }
    };
    fetchData();
    return () => { mounted = false; };
  }, [user?.id, navigate]);


  // 🔹 Calcular horas disponibles
  useEffect(() => {
    if (!form.fecha || !form.especialista) {
      setAvailableHours([]);
      return;
    }

    const ocupadas = citas
      .filter(
        (c) =>
          c.fecha === form.fecha &&
          String(c.especialista_id) === String(form.especialista)
      )
      .map((c) => c.hora);

    setAvailableHours(allHours.filter((h) => !ocupadas.includes(h)));
  }, [form.fecha, form.especialista, citas, allHours]);

  // 🔹 Buscar pacientes (debounce)
  useEffect(() => {
    const q = form.pacienteName?.trim();
    if (!q) {
      setSuggestions([]);
      setSearchError(null);
      return;
    }
  if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);
      try {
        const results = await searchPacientes(q);
        setSuggestions(results || []);
      } catch (err) {
        console.error("Error buscando pacientes", err);
        setSearchError('Error al buscar pacientes. Revisa la consola.');
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [form.pacienteName]);

  // helper to fetch suggestions immediately (used by the Buscar button)
  const fetchSuggestionsNow = async (q, autoSelect = false) => {
    if (!q || !q.trim()) {
      setSuggestions([]);
      return;
    }
  setIsSearching(true);
  setSearchError(null);
    try {
      const results = await searchPacientes(q.trim());
  setSuggestions(results || []);
      // si pedimos autoSelect y hay al menos un resultado, seleccionarlo automáticamente
      if (autoSelect && results && results.length > 0) {
        // pequeña espera para asegurar que el UI renderice la lista si es necesario
        setTimeout(() => {
          try {
            selectSuggestion(results[0]);
          } catch (e) {
            console.error('Auto-select failed', e);
          }
        }, 60);
      }
    } catch (err) {
      console.error('Error fetching suggestions now', err);
      setSearchError('Error al buscar pacientes.');
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Cerrar sugerencias al hacer click fuera del contenedor
  useEffect(() => {
    const onDocMouseDown = (ev) => {
      if (!autocompleteRef.current) return;
      if (!autocompleteRef.current.contains(ev.target)) {
        setSuggestions([]);
      }
    };

    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, []);

  // ✅ Selección segura de paciente
  const selectSuggestion = (p) => {
    console.log('selectSuggestion called with', p);
    setForm((prev) => ({
      ...prev,
      pacienteName: p.nombre || "",
      pacienteId: p.id || "",
      documento: p.documento || "",
      telefono: p.telefono || "",
    }));
    setSuggestions([]);
    setError("");
    // intentar enfocar el campo documento si existe
    setTimeout(() => {
      if (documentoRef && documentoRef.current) documentoRef.current.focus();
    }, 80);
  };

  // 🔹 Envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validar fecha no anterior a hoy
    if (form.fecha && form.fecha < todayStr) {
      setError(`No se pueden agendar citas en fechas anteriores a hoy (${todayDisplay}).`);
      return;
    }

    if (!form.pacienteId) {
      setError("Debes seleccionar un paciente de la lista desplegable.");
      return;
    }

    if (!form.fecha || !form.hora || !form.especialista) {
      setError("Completa los campos requeridos (fecha, hora, especialista).");
      return;
    }

    try {
      const especialistaId = form.especialista;
      const pacienteId = form.pacienteId;

      console.log("Valor de especialistaId:", especialistaId); // Registro adicional para depuración

      if (!especialistaId || !pacienteId) {
        setError("Error interno: ID de especialista o paciente inválido.");
        return;
      }

      const payload = {
        paciente_id: pacienteId,
        especialista_id: especialistaId,
        fecha: form.fecha,
        hora: form.hora,
        motivo: form.motivo || null,
        estado: "agendada",
      };

      console.log("Payload enviado:", payload); // Registro para depuración

      const { data, error: supError } = await supabase.from("citas").insert([payload]).select();

      if (supError) throw supError;

      console.log("Respuesta de inserción:", data); // Registro para verificar la respuesta

      navigate("/citas-registradas");
    } catch (err) {
      console.error("Error al guardar cita:", err);
      setError("Error inesperado al guardar la cita.");
    }
  };

  return (
      <main className="nuevo-paciente-container">
        <div className="card-wrap">
          <header className="card-header">
            <h1 className="main-title">Agendar Cita</h1>
            <p className="subtitle">Selecciona paciente, especialista y horario.</p>
          </header>

          <form className="paciente-form" onSubmit={handleSubmit}>
            {error && <div className="form-error">{error}</div>}

            <section className="section">
              <h2 className="section-title">Paciente</h2>
                <div ref={autocompleteRef} className="search-input autocomplete">
                <input
                  type="text"
                  value={form.pacienteName}
                  onChange={(e) => setForm(prev => ({ ...prev, pacienteName: e.target.value, pacienteId: '' }))}
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      // buscar y auto-seleccionar el primer resultado
                      await fetchSuggestionsNow(form.pacienteName, true);
                    }
                  }}
                  onFocus={() => { if (form.pacienteName && form.pacienteName.trim()) fetchSuggestionsNow(form.pacienteName); }}
                  placeholder="Busca por nombre o documento"
                  autoComplete="off"
                />
                <button type="button" className="search-button" onClick={() => fetchSuggestionsNow(form.pacienteName, true)}>
                  <span>Buscar</span>
                </button>
              </div>
              {suggestions.length > 0 && (
                <ul className="suggestions-list">
                  {suggestions.map((s) => (
                    <li key={s.id} onMouseDown={() => selectSuggestion(s)} onClick={() => selectSuggestion(s)}>
                      <div style={{ fontWeight: 700 }}>{s.nombre}</div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>
                        {s.documento} {s.telefono ? `· ${s.telefono}` : ""}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {form.pacienteName?.trim() && !isSearching && suggestions.length === 0 && (
                <div className="no-results" style={{ marginTop: 8, color: '#6b7280', fontSize: 13 }}>
                  {searchError ? searchError : `No se encontraron pacientes para "${form.pacienteName.trim()}".`}
                </div>
              )}
              {isSearching && (
                <div className="searching" style={{ marginTop: 8, color: '#6b7280', fontSize: 13 }}>Buscando...</div>
              )}
              {/* debug panel removed */}
            </section>

            <section className="section">
              <h2 className="section-title">Detalles</h2>

              <div className="form-row">
                <div className="form-group">
                  <label>Documento</label>
                  <input ref={documentoRef} type="text" placeholder="Ej. 12345678" value={form.documento} onChange={(e) => setForm(prev => ({ ...prev, documento: e.target.value }))} />
                </div>

                <div className="form-group">
                  <label>Teléfono</label>
                  <input type="tel" placeholder="Ej. 3001234567" value={form.telefono} onChange={(e) => setForm(prev => ({ ...prev, telefono: e.target.value }))} />
                </div>

                <div className="form-group">
                  <label>Especialista</label>
                  <select value={form.especialista} onChange={(e) => setForm(prev => ({ ...prev, especialista: e.target.value }))}>
                    <option value="">Selecciona</option>
                    {especialistas.map((sp) => <option key={sp.id} value={sp.id}>{sp.nombre} - {sp.especialidad}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>Fecha</label>
                    <input type="date" min={todayStr} title="Formato dd/mm/aaaa" value={form.fecha} onChange={(e) => setForm(prev => ({ ...prev, fecha: e.target.value }))} />
                    <small style={{ display: 'block', marginTop: 6, color: '#6b7280' }}>No se permiten fechas anteriores a hoy ({todayDisplay}).</small>
                </div>

                <div className="form-group">
                  <label>Hora</label>
                  <select value={form.hora} onChange={(e) => setForm(prev => ({ ...prev, hora: e.target.value }))}>
                    <option value="">Selecciona</option>
                    {availableHours.length > 0 ? availableHours.map((h) => <option key={h}>{h}</option>) : <option disabled>No hay horas disponibles</option>}
                  </select>
                </div>

                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label>Motivo</label>
                  <textarea placeholder="Ej. Revisión de visión / Lentes nuevos" value={form.motivo} onChange={(e) => setForm(prev => ({ ...prev, motivo: e.target.value }))} />
                </div>
              </div>
            </section>

            <div className="actions-row">
              <button type="submit" className="submit-button" disabled={!form.pacienteId || !form.fecha || !form.hora || !form.especialista || (form.fecha && form.fecha < todayStr)}>
                Agendar Cita
              </button>
              <button type="button" className="cancel-button" onClick={() => navigate('/citas')}>Cancelar</button>
            </div>
          </form>
        </div>
      </main>
    );
  };

  export default AgendarCita;
