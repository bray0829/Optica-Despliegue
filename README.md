# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Configurar Supabase

Para conectar la aplicación con Supabase:

1. Crea un proyecto en https://app.supabase.com y crea una tabla `remisiones` con los campos que necesites (por ejemplo: id, nombre, fecha, especialidad, motivo, estado).
2. En el panel del proyecto copia la URL del proyecto y la ANON KEY.
3. En la raíz del proyecto crea un archivo `.env` o `.env.local` con las variables (Vite las expone como VITE_...):

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...tu_anon_key...
```

4. Reinicia el servidor de desarrollo y abre la página de "Remisiones". Si no configuras las variables, la página mostrará datos de ejemplo.

5. Para más operaciones (crear/editar/eliminar), usa el cliente Supabase en `src/lib/supabaseClient.js`.

Si necesitas que implemente las operaciones CRUD completas para `Remisiones`, dime y lo preparo.
