import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api';

const ROLE_ROUTES = {
  procurement_specialist: '/dashboard/procurement',
  client_manager: '/dashboard/manager',
  warehouse_keeper: '/dashboard/warehouse',
  admin: '/dashboard/procurement',
};

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.login(form);
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        const route = ROLE_ROUTES[data.user?.role] || '/dashboard/procurement';
        navigate(route);
      } else {
        setError(data.error || 'Неверный логин или пароль');
      }
    } catch (err) {
      setError(err.message || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f5f5f5 0%, #ede9ff 100%)',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 4px 32px rgba(107,92,231,0.12)',
        padding: '48px 40px',
        width: '100%',
        maxWidth: 400,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: '#6B5CE7',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}>
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
              <rect x="2" y="7" width="20" height="14" rx="2" fill="rgba(255,255,255,0.3)" />
              <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
              <path d="M12 12v4M10 14h4" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
            Управление складом
          </h1>
          <p style={{ color: '#888', fontSize: 14, marginTop: 4 }}>
            Войдите в систему
          </p>
        </div>

        {error && (
          <div style={{
            background: '#fff3f3',
            border: '1px solid #ffcdd2',
            borderRadius: 8,
            padding: '10px 14px',
            color: '#e53935',
            fontSize: 13,
            marginBottom: 20,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontWeight: 500, marginBottom: 6, fontSize: 13, color: '#444' }}>
              Логин (email)
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="example@company.com"
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1.5px solid #e0e0e0',
                borderRadius: 8,
                fontSize: 14,
                color: '#1a1a1a',
                outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = '#6B5CE7'}
              onBlur={e => e.target.style.borderColor = '#e0e0e0'}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontWeight: 500, marginBottom: 6, fontSize: 13, color: '#444' }}>
              Пароль
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1.5px solid #e0e0e0',
                borderRadius: 8,
                fontSize: 14,
                color: '#1a1a1a',
                outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = '#6B5CE7'}
              onBlur={e => e.target.style.borderColor = '#e0e0e0'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: loading ? '#a89de8' : '#6B5CE7',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
              marginBottom: 16,
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#5649c0'; }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#6B5CE7'; }}
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>

          <div style={{ textAlign: 'center', fontSize: 13, color: '#888' }}>
            Нет аккаунта?{' '}
            <Link to="/register" style={{ color: '#6B5CE7', fontWeight: 500 }}>
              Зарегистрироваться
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
