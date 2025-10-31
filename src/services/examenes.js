import supabase from '../lib/supabaseClient';

// ==========================================================
// ⚙️ Configuración general
// ==========================================================
const BUCKET = import.meta.env.VITE_SUPABASE_BUCKET_NAME || 'examenes';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ==========================================================
// 📤 SUBIR ARCHIVO SIMPLE (CORREGIDO - SIEMPRE STRING)
// ==========================================================
async function uploadFile(file, folder = '') {
  if (!file) return null;

  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const path = `${folder ? folder + '/' : ''}${timestamp}_${Math.random()
    .toString(36)
    .slice(2, 8)}_${safeName}`;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false });

  if (error) {
    const msg = error.message || JSON.stringify(error);
    if (/bucket not found|404/.test(msg))
      throw new Error(`Storage error: el bucket "${BUCKET}" no existe o no es accesible.`);
    throw error;
  }

  const { data: publicData } =
    supabase.storage.from(BUCKET).getPublicUrl(data.path) || {};

  return {
    path: `${data.path}`, // ✅ STRING
    publicUrl: publicData?.publicUrl || null,
  };
}

// ==========================================================
// 📈 SUBIR ARCHIVO CON PROGRESO
// ==========================================================
function uploadFileWithProgress(file, folder = '', onProgress = () => {}) {
  if (!file) return Promise.resolve(null);

  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const path = `${folder ? folder + '/' : ''}${timestamp}_${Math.random()
    .toString(36)
    .slice(2, 8)}_${safeName}`;

  const url = `${SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/${BUCKET}/${path}`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open('PUT', url);
    xhr.setRequestHeader('apikey', SUPABASE_ANON_KEY);
    xhr.setRequestHeader('Authorization', `Bearer ${SUPABASE_ANON_KEY}`);
    xhr.setRequestHeader('x-upsert', 'false');
    xhr.setRequestHeader('Content-Type', file.type || 'application/pdf');

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const { data: publicData } =
          supabase.storage.from(BUCKET).getPublicUrl(path) || {};
        resolve({ path, publicUrl: publicData?.publicUrl || null });
      } else reject(new Error(`Upload failed with status ${xhr.status}`));
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(file);
  });
}

// ==========================================================
// 🧾 CRUD EXÁMENES
// ==========================================================
async function createExamen(examen) {
  const { data, error } = await supabase
    .from('examenes')
    .insert([examen])
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function updateExamen(id, updates) {
  const { data, error } = await supabase
    .from('examenes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ==========================================================
// 📄 LISTAR EXÁMENES
// ==========================================================
async function listExamenes(rol, userId) {
  let query = supabase
    .from('examenes')
    .select(`
      id,
      fecha,
      notas,
      pdf_path,
      paciente_id,
      especialista_id,
      pacientes ( id, nombre )
    `)
    .order('fecha', { ascending: false });

  if (rol === 'paciente') query = query.eq('paciente_id', userId);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// ==========================================================
// 🔗 URLS DE ARCHIVOS
// ==========================================================
async function getSignedUrl(path, expiresInSeconds = 3600) {
  if (!path) return null;
  const cleanPath = Array.isArray(path) ? path[0] : path;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(cleanPath, expiresInSeconds);

  if (error) throw error;
  return data.signedUrl;
}

async function getPublicUrl(path) {
  if (!path) return null;
  const cleanPath = Array.isArray(path) ? path[0] : path;

  const { data } = await supabase.storage.from(BUCKET).getPublicUrl(cleanPath);
  return data?.publicUrl || null;
}

// ==========================================================
// 📎 SUBIDA DE PDF
// ==========================================================
async function uploadPdfAndGetPublicUrl(file, folder = '') {
  if (!file) throw new Error('No file provided');
  if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') {
    throw new Error('Solo se permiten archivos PDF.');
  }

  const uploaded = await uploadFile(file, folder);
  if (!uploaded?.path) throw new Error('Error al subir PDF');

  return uploaded;
}

// ==========================================================
// 🗑️ ELIMINAR ARCHIVO / EXAMEN
// ==========================================================
async function deleteFile(path) {
  if (!path) return { ok: true };

  const cleanPath = Array.isArray(path) ? path[0] : path;

  const { error } = await supabase.storage.from(BUCKET).remove([cleanPath]);
  if (error) throw error;

  return { ok: true };
}

async function deleteExamen(id) {
  const { data, error } = await supabase
    .from('examenes')
    .delete()
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ==========================================================
// ✅ VALIDACIÓN
// ==========================================================
function validateFile(file, { maxSizeBytes, allowedTypes }) {
  if (!file) return { valid: false, reason: 'No file' };
  if (maxSizeBytes && file.size > maxSizeBytes) return { valid: false, reason: 'size' };
  if (allowedTypes && !allowedTypes.includes(file.type)) return { valid: false, reason: 'type' };
  return { valid: true };
}

// ==========================================================
// ✅ EXPORTACIÓN FINAL (CORREGIDO — SIN checkBucketExists)
// ==========================================================
export default {
  uploadFile,
  uploadFileWithProgress,
  createExamen,
  updateExamen,
  listExamenes,
  uploadPdfAndGetPublicUrl,
  uploadPdfAndGetSignedPath: uploadPdfAndGetPublicUrl,
  getSignedUrl,
  getPublicUrl,
  deleteFile,
  deleteExamen,
  validateFile,
};
