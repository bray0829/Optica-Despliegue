import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import supabase from '../../lib/supabaseClient';
import './style.css';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const query = useQuery();
  const [phase, setPhase] = useState('init'); // init, request-sent, set-password
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  // If Supabase redirect includes access_token or other token in hash or query, we should allow setting password.
  useEffect(() => {
    // Some redirects include the access_token either as query or in the URL hash (#access_token=...)
    const hash = window.location.hash || '';
    const accessTokenFromQuery = query.get('access_token');
    const accessTokenFromHash = (() => {
      const m = hash.match(/access_token=([^&]+)/);
      return m ? decodeURIComponent(m[1]) : null;
    })();
    const accessToken = accessTokenFromQuery || accessTokenFromHash;

    if (accessToken) {
      // Set the session using the token so supabase-js considers the user authenticated
      // supabase.auth.setSession expects an object with access_token (and optionally refresh_token)
      (async () => {
        try {
          await supabase.auth.setSession({ access_token: accessToken });
        } catch (err) {
          console.error('Error setting session from token', err);
        }
        // Clean the URL to remove tokens (so they don't stay visible)
        try {
          const url = new URL(window.location.href);
          url.hash = '';
          url.searchParams.delete('access_token');
          window.history.replaceState({}, document.title, url.toString());
        } catch {
          // ignore URL manipulation errors
        }
        setPhase('set-password');
        setMessage('Se detectó un token de recuperación. Ingresa tu nueva contraseña.');
      })();
    } else {
      setPhase('init');
    }
  }, [query]);

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (!email) {
      setMessage('Ingresa el correo asociado a tu cuenta.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password'
      });
      if (error) {
        console.error('resetPasswordForEmail error', error);
        setMessage('No se pudo enviar el correo. Verifica el correo o intenta más tarde.');
      } else {
        setMessage('Revisa tu correo. Se ha enviado un enlace para restablecer la contraseña.');
        setPhase('request-sent');
      }
    } catch (err) {
      console.error(err);
      setMessage('Error inesperado al solicitar recuperación.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setMessage(null);
    // stronger password rules: at least 8 chars, includes upper, lower and number
    const pwErrors = [];
    if (!password || password.length < 8) pwErrors.push('mínimo 8 caracteres');
    if (!/[A-Z]/.test(password)) pwErrors.push('una letra mayúscula');
    if (!/[a-z]/.test(password)) pwErrors.push('una letra minúscula');
    if (!/[0-9]/.test(password)) pwErrors.push('un número');
    if (pwErrors.length) {
      setMessage('La contraseña debe contener: ' + pwErrors.join(', ') + '.');
      return;
    }
    if (password !== confirm) {
      setMessage('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      // In supabase-js v2 the recommended method to update user password when user has a session is updateUser
      // If we have a token from the redirect, supabase should have set the session automatically. We call updateUser.
  const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        console.error('updateUser error', error);
        setMessage('No fue posible actualizar la contraseña. Intenta de nuevo.');
      } else {
        // redirect to success page for a cleaner UX
        navigate('/reset-password/success');
      }
    } catch (err) {
      console.error(err);
      setMessage('Error inesperado al actualizar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-password-page">
      <div className="reset-card">
        <h2>Restablecer contraseña</h2>
        {message && <div className="form-info">{message}</div>}

        {phase === 'init' && (
          <form onSubmit={handleRequestReset}>
            <label>Correo electrónico</label>
            <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" disabled={loading}>{loading ? 'Enviando...' : 'Enviar enlace'}</button>
              <button type="button" className="secondary-button" onClick={() => navigate('/login')}>Volver</button>
            </div>
          </form>
        )}

        {phase === 'request-sent' && (
          <div>
            <p>Se envió el enlace. Si no lo ves, revisa la carpeta de spam.</p>
            <button onClick={() => setPhase('init')}>Enviar de nuevo</button>
            <button onClick={() => navigate('/login')}>Volver al login</button>
          </div>
        )}

        {phase === 'set-password' && (
          <form onSubmit={handleSetPassword}>
            <label>Nueva contraseña</label>
            <input className="form-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <label>Confirmar contraseña</label>
            <input className="form-input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" disabled={loading}>{loading ? 'Actualizando...' : 'Actualizar contraseña'}</button>
              <button type="button" className="secondary-button" onClick={() => navigate('/login')}>Cancelar</button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
