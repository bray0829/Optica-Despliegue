import { createClient } from '@supabase/supabase-js';

// Obtiene las variables desde el entorno
let supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Limpia espacios si existen
supabaseUrl = supabaseUrl?.trim();
supabaseAnonKey = supabaseAnonKey?.trim();

// Avisos pero sin romper la app
if (!supabaseUrl) {
  console.warn("⚠️ VITE_SUPABASE_URL no está definida.");
}
if (!supabaseAnonKey) {
  console.warn("⚠️ VITE_SUPABASE_ANON_KEY no está definida.");
}

// ✅ SIEMPRE crea el cliente, como antes
export const supabase = createClient(
  supabaseUrl || "https://dummy.supabase.co",
  supabaseAnonKey || "dummy-anon-key"
);

export default supabase;
