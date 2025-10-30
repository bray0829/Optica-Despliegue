import supabase from '../lib/supabaseClient';

// Crear perfil de usuario
const createUsuarioProfile = async ({ id, nombre, email, telefono, rol, especialidad = null }) => {
  // Inserta perfil base en usuarios
  const { data: usuarioData, error: usuarioError } = await supabase
    .from('usuarios')
    .insert([{ id, nombre, email, telefono, rol }])
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

// Obtener usuario por ID (ya no por auth_id)
const getUsuarioById = async (id) => {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', id)
    .single();
  if (error) {
    console.error('Error al obtener usuario:', error.message);
    return null;
  }
  return data;
};

// Listar todos los usuarios
const listUsuarios = async () => {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .order('fecha_creacion', { ascending: false });
  if (error) throw error;
  return data;
};

// Actualizar rol
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
  listUsuarios,
  updateUsuarioRole,
};
