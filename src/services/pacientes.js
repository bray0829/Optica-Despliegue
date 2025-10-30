import supabase from '../lib/supabaseClient';

export async function searchPacientes(query) {
  if (!query) return [];
  const q = `%${query}%`;
  try {
    // Primero intentamos búsqueda por nombre
    const { data: byName, error: errName } = await supabase
      .from('pacientes')
      .select('id,nombre,documento,telefono,fecha_nacimiento')
      .ilike('nombre', q)
      .limit(10);

    if (errName) {
      console.error('[searchPacientes] error searching by name', errName);
      throw errName;
    }

    if (byName && byName.length > 0) {
      return byName.map(p => ({ ...p }));
    }

    // Si no hay por nombre, intentamos por documento
    const { data: byDoc, error: errDoc } = await supabase
      .from('pacientes')
      .select('id,nombre,documento,telefono,fecha_nacimiento')
      .ilike('documento', q)
      .limit(10);

    if (errDoc) {
      console.error('[searchPacientes] error searching by document', errDoc);
      throw errDoc;
    }

    return (byDoc || []).map(p => ({ ...p }));
  } catch (err) {
    console.error('[searchPacientes] unexpected error', err);
    // Re-throw para que el llamador (UI) pueda mostrar el error y diagnosticar (p. ej. credenciales, RLS)
    throw err;
  }
}

export async function listPacientes() {
  const { data, error } = await supabase.from('pacientes').select('id,nombre,documento').limit(100);
  if (error) throw error;
  return data || [];
}
