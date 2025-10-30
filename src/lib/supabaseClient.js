import { createClient } from '@supabase/supabase-js';

// En Vite las variables de entorno de cliente deben empezar con VITE_
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase;
if (!supabaseUrl || !supabaseKey) {
	console.warn('[supabaseClient] VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY no están configuradas.');

	const throwNotConfigured = () => {
		throw new Error('Supabase no está configurado. Crea un archivo .env con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.');
	};

	supabase = {
		auth: {
			signInWithPassword: async () => { throwNotConfigured(); },
			signUp: async () => { throwNotConfigured(); },
			signOut: async () => { throwNotConfigured(); },
			getSession: async () => ({ data: { session: null } }),
			onAuthStateChange: () => ({ subscription: { unsubscribe: () => {} } }),
		},
		from: () => ({
			select: async () => ({ data: null, error: new Error('Supabase no configurado') }),
			insert: async () => ({ error: new Error('Supabase no configurado') }),
		}),
		storage: {
			from: () => ({
				upload: async () => ({ error: new Error('Supabase no configurado') }),
				createSignedUrl: async () => ({ error: new Error('Supabase no configurado') }),
			}),
		},
	};
} else {
	supabase = createClient(supabaseUrl, supabaseKey);
}

export default supabase;
