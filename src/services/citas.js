import supabase from "../supabaseClient";

const citasService = {

  // ✅ Obtener citas por PACIENTE
  async getCitasByPaciente(pacienteId) {
    const { data, error } = await supabase
      .from("citas")
      .select("*")
      .eq("paciente_id", pacienteId)
      .order("fecha", { ascending: true });

    if (error) throw error;
    return data;
  },

  // ✅ Obtener citas por ESPECIALISTA
  async getCitasByEspecialista(especialistaId) {
    const { data, error } = await supabase
      .from("citas")
      .select("*")
      .eq("especialista_id", especialistaId)
      .order("fecha", { ascending: true });

    if (error) throw error;
    return data;
  },

  // ✅ Obtener TODAS las citas
  async getTodasLasCitas() {
    const { data, error } = await supabase
      .from("citas")
      .select("*")
      .order("fecha", { ascending: true });

    if (error) throw error;
    return data;
  },

  // ✅ Crear cita
  async crearCita(cita) {
    const { data, error } = await supabase
      .from("citas")
      .insert(cita)
      .select();

    if (error) throw error;
    return data[0];
  },

  // ✅ Cancelar cita (borrar)
  async cancelarCita(idCita) {
    const { error } = await supabase
      .from("citas")
      .delete()
      .eq("id", idCita);

    if (error) throw error;
  }
};

export default citasService;
