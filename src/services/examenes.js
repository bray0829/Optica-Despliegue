import supabase from '../lib/supabaseClient';

// Nombre del bucket configurable por .env (Vite): VITE_SUPABASE_BUCKET_NAME
// Si no está definida, se usará el bucket por defecto 'examenes'.
const BUCKET = import.meta.env.VITE_SUPABASE_BUCKET_NAME || 'examenes';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ==========================================================
// 📤 SUBIR ARCHIVO SIMPLE
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
    if (/bucket not found|Bucket not found|404/.test(msg)) {
      throw new Error(
        `Storage error: el bucket "${BUCKET}" no existe o no es accesible.`
      );
    }
    throw error;
  }

  // Intentamos obtener la URL pública (si el bucket es público)
  const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(data.path) || {};

  return {
    path: data.path,
    publicUrl: publicData?.publicUrl || null,
  };
}

// ==========================================================
// 📈 SUBIR ARCHIVO CON PROGRESO
// ==========================================================
function uploadFileWithProgress(file, folder = '', onProgress = () => {}) {
  if (!file) return Promise.resolve(null);
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return Promise.reject(
      new Error('Supabase no está configurado para uploads con progreso.')
    );
  }

  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const path = `${folder ? folder + '/' : ''}${timestamp}_${Math.random()
    .toString(36)
    .slice(2, 8)}_${safeName}`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const url = `${SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/${encodeURIComponent(
      BUCKET
    )}/${encodeURIComponent(path)}`;
    // Supabase storage object API expects PUT for direct object upload
    xhr.open('PUT', url);
    xhr.setRequestHeader('apikey', SUPABASE_ANON_KEY);
    xhr.setRequestHeader('Authorization', `Bearer ${SUPABASE_ANON_KEY}`);
    xhr.setRequestHeader('x-upsert', 'false');
    xhr.setRequestHeader('Content-Type', file.type || 'application/pdf');

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        if (typeof onProgress === 'function') onProgress(percent);
      }
    };

    xhr.onload = async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          // Obtener URL pública inmediatamente después de subir (si el bucket es público)
          const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(path) || {};
          resolve({ path, publicUrl: publicData?.publicUrl || null });
        } catch (err) {
          reject(err);
        }
      } else {
        let message = `Upload failed with status ${xhr.status}`;
        try {
          const json = JSON.parse(xhr.responseText || '{}');
          if (json && json.message) message = json.message;
  } catch { /* ignore parse error */ }
        reject(new Error(message));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(file);
  });
}

// ==========================================================
// 🧾 CRUD DE EXÁMENES
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

async function listExamenes() {
  const { data, error } = await supabase
    .from('examenes')
    .select(
      `id, fecha, notas, pdf_path, paciente_id, pacientes ( id, nombre )`
    )
    .order('fecha', { ascending: false });
  if (error) throw error;
  return data || [];
}

// ==========================================================
// 🔗 URLS DE ARCHIVOS
// ==========================================================
async function getSignedUrl(path, expiresInSeconds = 3600) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}

async function getPublicUrl(path) {
  if (!path) return null;
  const { data, error } = await supabase.storage.from(BUCKET).getPublicUrl(path);
  if (error) throw error;
  return data?.publicUrl || null;
}

// ==========================================================
// 📎 SUBIDA DE PDF CON URL PÚBLICA AUTOMÁTICA
// ==========================================================
async function uploadPdfAndGetPublicUrl(file, folder = '') {
  if (!file) throw new Error('No file provided');
  const name = file.name || '';
  if (!/\.pdf$/i.test(name) && file.type !== 'application/pdf') {
    throw new Error('Solo se permiten archivos PDF.');
  }

  const uploaded = await uploadFile(file, folder);
  if (!uploaded || !uploaded.path) throw new Error('Error al subir PDF');
  // No exigimos publicUrl (el bucket puede ser privado). Devolvemos la ruta y opcionalmente publicUrl.
  return uploaded;
}

// Alias que el frontend usa en varios lugares: devuelve { path, publicUrl }
async function uploadPdfAndGetSignedPath(file, folder = '') {
  return uploadPdfAndGetPublicUrl(file, folder);
}

// ==========================================================
// 🧩 CHEQUEAR BUCKET EXISTENTE
// ==========================================================
async function checkBucketExists() {
  try {
    const { error } = await supabase.storage.from(BUCKET).list('', { limit: 1 });
    if (error) {
      const msg = error.message || JSON.stringify(error);
      if (/bucket not found|Bucket not found|404/.test(msg)) {
        return {
          exists: false,
          message: `El bucket "${BUCKET}" no existe o no es accesible.`,
        };
      }
      return { exists: false, message: msg };
    }
    return { exists: true };
  } catch (err) {
    return { exists: false, message: err.message || String(err) };
  }
}

// ==========================================================
// 🗑️ ELIMINAR ARCHIVO
// ==========================================================
async function deleteFile(path) {
  if (!path) return { ok: true };
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
  return { ok: true };
}

// Eliminar examen por id (y opcionalmente eliminar archivo asociado)
async function deleteExamen(id) {
  if (!id) throw new Error('Missing id');
  const { data, error } = await supabase.from('examenes').delete().eq('id', id).select().single();
  if (error) throw error;
  return data;
}

// ==========================================================
// ✅ VALIDACIÓN DE ARCHIVO
// ==========================================================
function validateFile(file, { maxSizeBytes, allowedTypes }) {
  if (!file) return { valid: false, reason: 'No file' };
  if (maxSizeBytes && file.size > maxSizeBytes)
    return { valid: false, reason: 'size' };
  if (allowedTypes && !allowedTypes.includes(file.type))
    return { valid: false, reason: 'type' };
  return { valid: true };
}

// ==========================================================
// EXPORTACIÓN
// ==========================================================
export default {
  uploadFile,
  uploadFileWithProgress,
  createExamen,
  updateExamen,
  listExamenes,
  uploadPdfAndGetPublicUrl,
  uploadPdfAndGetSignedPath,
  getSignedUrl,
  getPublicUrl,
  checkBucketExists,
  deleteFile,
  deleteExamen,
  validateFile,
};
