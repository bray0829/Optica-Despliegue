import { createClient } from '@supabase/supabase-js';

// Obtiene las variables desde el entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

// Verifica si las variables están definidas
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[❌ SupabaseClient] Faltan las variables de entorno:',
    !supabaseUrl ? 'VITE_SUPABASE_URL ' : '',
    !supabaseAnonKey ? 'VITE_SUPABASE_ANON_KEY' : ''
  );
  console.warn(
    '👉 En Netlify, agrégalas desde Site Settings → Build & Deploy → Environment → Add variable'
  );
}

// Crea el cliente Supabase solo si hay configuración
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export default supabase;
