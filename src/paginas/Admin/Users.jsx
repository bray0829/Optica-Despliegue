import React, { useEffect, useState } from 'react';
import supabase from '../../lib/supabaseClient';
import usuariosService from '../../services/usuarios';
import './style.css';

export default function AdminUsers() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('paciente');
  const [especialidad, setEspecialidad] = useState('optometra');
  const [loading, setLoading] = useState(false);
  // Roles permitidos según requerimiento
  const rolesExample = ['paciente', 'especialista', 'administrador'];
  const [message, setMessage] = useState(null);

  const handleCreate = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (!nombre || !email || !password) {
      setMessage('Completa nombre, correo y contraseña.');
      return;
    }
    setLoading(true);
    try {
      // Create auth user
      const { data, error: supError } = await supabase.auth.signUp({ email, password });
      if (supError) {
        setMessage('Error creando credenciales: ' + supError.message);
        setLoading(false);
        return;
      }
      const userId = data.user?.id;
      if (!userId) {
        // Possibly requires email confirmation; Supabase may not return user id immediately
        setMessage('Usuario creado. Verifica su correo para activar la cuenta.');
        setLoading(false);
        return;
      }

      // Create profile in usuarios table
    // Create profile in usuarios table (si es especialista, incluimos especialidad)
    await usuariosService.createUsuarioProfile({ id: userId, nombre, email, telefono, rol, especialidad: rol === 'especialista' ? especialidad : null });
  setMessage('Usuario creado correctamente con rol ' + rol);
  setNombre(''); setEmail(''); setTelefono(''); setPassword(''); setRol('paciente');
    } catch (err) {
      console.error('Error creando usuario', err);
      setMessage('Error creando usuario: ' + (err.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  const [usuarios, setUsuarios] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const loadUsuarios = async () => {
    try {
      const rows = await usuariosService.listUsuarios();
      setUsuarios(rows || []);
    } catch (err) {
      console.error('Error loading usuarios', err);
    }
  };

  useEffect(() => { loadUsuarios(); }, []);

  const handleChangeRole = async (userId, newRole) => {
    try {
      await usuariosService.updateUsuarioRole(userId, newRole);
      await loadUsuarios();
    } catch (err) {
      console.error('Error updating role', err);
      setMessage('No fue posible actualizar el rol.');
    }
  };

  return (
    <div className="admin-users-page">
      <div className="admin-card">
        <h2 className="admin-title">Panel de Usuarios <span style={{fontWeight:700, display:'block'}}>(Admin)</span></h2>
        {message && <div className="form-info">{message}</div>}

        <form className="admin-form" onSubmit={handleCreate}>
          <input className="form-input" placeholder="Nombre completo" value={nombre} onChange={(e)=>setNombre(e.target.value)} />
          <input className="form-input" type="email" placeholder="Correo" value={email} onChange={(e)=>setEmail(e.target.value)} />
          <input className="form-input" placeholder="Teléfono" value={telefono} onChange={(e)=>setTelefono(e.target.value)} />
          <input className="form-input" type="password" placeholder="Contraseña" value={password} onChange={(e)=>setPassword(e.target.value)} />

          <div className="form-row">
            <select className="form-input" value={rol} onChange={(e)=>setRol(e.target.value)}>
              {rolesExample.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            {rol === 'especialista' && (
              <select className="form-input" value={especialidad} onChange={(e) => setEspecialidad(e.target.value)}>
                <option value="ortopedista">Ortopedista</option>
                <option value="optometra">Optometra</option>
              </select>
            )}
          </div>

          <div className="form-actions" style={{ marginTop: 8 }}>
            <button type="submit" className="create-btn" disabled={loading}>{loading ? 'Creando...' : 'Crear usuario'}</button>
          </div>
        </form>

        <hr className="divider" />
        <h3 className="list-title">Usuarios registrados</h3>

        <div style={{ marginTop: 8, marginBottom: 8 }}>
          <input
            className="form-input"
            placeholder="Buscar usuario por nombre o correo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ marginBottom: 8 }}
          />
        </div>

        <div className="user-list">
          {usuarios.length === 0 && <div className="empty-text">No hay usuarios.</div>}
          {(() => {
            const q = searchQuery.trim().toLowerCase();
            const matches = q
              ? usuarios.filter(u => (u.nombre || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q))
              : usuarios;
            const displayed = q ? matches : matches.slice(0, 3);

            return (
              <>
                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
                  {q ? `Mostrando ${displayed.length} de ${matches.length} resultado(s)` : `Mostrando ${displayed.length} de ${usuarios.length} usuarios`}
                </div>
                {displayed.map(u => (
                  <div key={u.id} className="user-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="user-avatar">{(u.nombre || 'U').slice(0,1).toUpperCase()}</div>
                <div className="user-info">
                  <div className="user-name">{u.nombre}</div>
                  <div className="user-email">{u.email}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <select className="role-select" value={u.rol} onChange={(e)=>handleChangeRole(u.id, e.target.value)}>
                  {rolesExample.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
                  </div>
                ))}
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
