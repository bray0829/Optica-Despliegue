import supabase from '../lib/supabaseClient';

const getEspecialistaByUsuarioId = async (usuarioId) => {
  if (!usuarioId) return null;

  const { data, error } = await supabase
    .from('especialistas')
    .select('id, usuario_id, especialidad')
    .eq('usuario_id', usuarioId);

  if (error) {
    console.error('❌ getEspecialistaByUsuarioId error', error);
    return null;
  }

  if (!data || data.length === 0) {
    console.warn('⚠️ No se encontró especialista para el usuario', usuarioId);
    return null;
  }

  // 🔥 Toma el primero si hay más de uno (evita error PGRST116)
  return data[0];
};

const getAllEspecialistas = async () => {
  const { data: espData, error: espErr } = await supabase
    .from('especialistas')
    .select('id, usuario_id, especialidad');
  if (espErr) {
    console.error('getAllEspecialistas error', espErr);
    return [];
  }

  const usuarioIds = espData.map(e => e.usuario_id).filter(Boolean);
  if (!usuarioIds.length) return espData.map(e => ({ ...e, nombre: null }));

  const { data: usuarios, error: usuariosErr } = await supabase
    .from('usuarios')
    .select('id, nombre, email')
    .in('id', usuarioIds);
  if (usuariosErr) {
    console.error('getAllEspecialistas - usuarios fetch error', usuariosErr);
    return espData.map(e => ({ ...e, nombre: null }));
  }

  const usuariosById = Object.fromEntries((usuarios || []).map(u => [u.id, u]));
  return espData.map(e => ({
    ...e,
    nombre: usuariosById[e.usuario_id]?.nombre || usuariosById[e.usuario_id]?.email || null,
  }));
};

export default {
  getEspecialistaByUsuarioId,
  getAllEspecialistas,
};
