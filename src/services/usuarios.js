import supabase from '../lib/supabaseClient';

const createUsuarioProfile = async ({ id, auth_id = null, nombre, email, telefono, rol, especialidad = null }) => {
  // Inserta perfil base en usuarios (incluye auth_id si se proporciona)
  const payload = { id, nombre, email, telefono, rol };
  if (auth_id) payload.auth_id = auth_id;

  const { data: usuarioData, error: usuarioError } = await supabase
    .from('usuarios')
    .insert([payload])
    .select()
    .single();

  if (usuarioError) throw usuarioError;

  // Si es especialista, crear la fila correspondiente en especialistas
  if (rol === 'especialista') {
    const { error: espError } = await supabase
      .from('especialistas')
      .insert([{ usuario_id: usuarioData.id, especialidad: especialidad || 'optometra' }]);

    if (espError) {
      // Rollback: eliminar usuario creado si no se pudo crear el especialista
      await supabase.from('usuarios').delete().eq('id', usuarioData.id);
      throw espError;
    }
  }

  return usuarioData;
};

const getUsuarioById = async (id) => {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return data;
};

// NEW: buscar usuario por auth_id (id del usuario en auth.users)
const getUsuarioByAuthId = async (authId) => {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('auth_id', authId)
    .single();
  if (error) return null;
  return data;
};

const listUsuarios = async () => {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .order('fecha_creacion', { ascending: false });
  if (error) throw error;
  return data;
};

const updateUsuarioRole = async (id, rol) => {
  const { data, error } = await supabase
    .from('usuarios')
    .update({ rol })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export default {
  createUsuarioProfile,
  getUsuarioById,
  getUsuarioByAuthId, // <-- nueva función exportada
  listUsuarios,
  updateUsuarioRole,
};
