import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api';

const ROLES = [
  { value: 'procurement_specialist', label: 'Специалист по закупкам' },
  { value: 'client_manager', label: 'Менеджер по работе с клиентами' },
  { value: 'warehouse_keeper', label: 'Кладовщик' },
];

const ROLE_ROUTES = {
  procurement_specialist: '/dashboard/procurement',
  client_manager: '/dashboard/manager',
  warehouse_keeper: '/dashboard/warehouse',
  admin: '/dashboard/procurement',
};

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    role: 'procurement_specialist',
  });
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
      const data = await api.register(form);
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        const route = ROLE_ROUTES[data.user?.role] || '/dashboard/procurement';
        navigate(route);
      } else {
        setError(data.error || 'Ошибка регистрации');
      }
    } catch (err) {
      setError(err.message || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    border: '1.5px solid #e0e0e0',
    borderRadius: 8,
    fontSize: 14,
    color: '#1a1a1a',
    outline: 'none',
    transition: 'border-color 0.15s',
    background: '#fff',
  };
  const labelStyle = {
    display: 'block',
    fontWeight: 500,
    marginBottom: 6,
    fontSize: 13,
    color: '#444',
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f5f5f5 0%, #ede9ff 100%)',
      padding: '24px 16px',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 4px 32px rgba(107,92,231,0.12)',
        padding: '40px 40px',
        width: '100%',
        maxWidth: 480,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
            Регистрация
          </h1>
          <p style={{ color: '#888', fontSize: 14, marginTop: 4 }}>
            Создайте новую учётную запись
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Имя</label>
              <input
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                required
                placeholder="Иван"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#6B5CE7'}
                onBlur={e => e.target.style.borderColor = '#e0e0e0'}
              />
            </div>
            <div>
              <label style={labelStyle}>Фамилия</label>
              <input
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                required
                placeholder="Петров"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#6B5CE7'}
                onBlur={e => e.target.style.borderColor = '#e0e0e0'}
              />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Электронная почта</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="ivan@company.com"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#6B5CE7'}
              onBlur={e => e.target.style.borderColor = '#e0e0e0'}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Телефон</label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="+7 (900) 000-00-00"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#6B5CE7'}
              onBlur={e => e.target.style.borderColor = '#e0e0e0'}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Пароль</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder="Минимум 6 символов"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#6B5CE7'}
              onBlur={e => e.target.style.borderColor = '#e0e0e0'}
            />
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={labelStyle}>Роль</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              style={{ ...inputStyle, cursor: 'pointer' }}
              onFocus={e => e.target.style.borderColor = '#6B5CE7'}
              onBlur={e => e.target.style.borderColor = '#e0e0e0'}
            >
              {ROLES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px',
                background: loading ? '#a89de8' : '#6B5CE7',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#5649c0'; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#6B5CE7'; }}
            >
              {loading ? 'Регистрация...' : 'Подтвердить'}
            </button>
            <Link to="/login" style={{ flex: 1 }}>
              <button
                type="button"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#e53935',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#c62828'}
                onMouseLeave={e => e.currentTarget.style.background = '#e53935'}
              >
                Отмена
              </button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
