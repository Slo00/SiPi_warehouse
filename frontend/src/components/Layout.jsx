import { Link, useNavigate, useLocation } from 'react-router-dom';

const COLORS = {
  primary: '#6B5CE7',
  primaryDark: '#5649c0',
  primaryDarker: '#4538a0',
  white: '#ffffff',
  muted: 'rgba(255,255,255,0.6)',
  hover: 'rgba(255,255,255,0.12)',
  active: 'rgba(255,255,255,0.2)',
};

const navByRole = {
  procurement_specialist: [
    { label: 'Главная', path: '/dashboard/procurement' },
    { label: 'Ассортимент', path: '/assortment' },
    { label: 'Заказы поставщикам', path: '/supplier-orders' },
    { label: 'Остатки на складе', path: '/stock' },
  ],
  client_manager: [
    { label: 'Главная', path: '/dashboard/manager' },
    { label: 'Заказы клиентов', path: '/client-orders' },
    { label: 'Акции', path: '/promotions' },
  ],
  warehouse_keeper: [
    { label: 'Главная', path: '/dashboard/warehouse' },
    { label: 'Остатки', path: '/stock' },
    { label: 'Поступления', path: '/supplier-orders' },
    { label: 'Заказы к сборке', path: '/client-orders' },
  ],
  admin: [
    { label: 'Главная', path: '/dashboard/procurement' },
    { label: 'Ассортимент', path: '/assortment' },
    { label: 'Заказы поставщикам', path: '/supplier-orders' },
    { label: 'Остатки на складе', path: '/stock' },
    { label: 'Заказы клиентов', path: '/client-orders' },
    { label: 'Акции', path: '/promotions' },
  ],
};

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('user') || 'null');
  } catch {}

  const role = user?.role || 'procurement_specialist';
  const navItems = navByRole[role] || navByRole.procurement_specialist;

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: 240,
        minWidth: 240,
        background: 'linear-gradient(180deg, #4538a0 0%, #6B5CE7 100%)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        zIndex: 100,
        boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
      }}>
        {/* Logo */}
        <div style={{
          padding: '24px 20px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.15)',
        }}>
          <div style={{
            color: COLORS.white,
            fontWeight: 700,
            fontSize: 18,
            letterSpacing: '-0.3px',
          }}>
            Склад
          </div>
          <div style={{ color: COLORS.muted, fontSize: 12, marginTop: 2 }}>
            Управление складом
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'block',
                  padding: '10px 20px',
                  color: isActive ? COLORS.white : COLORS.muted,
                  background: isActive ? COLORS.active : 'transparent',
                  borderLeft: isActive ? '3px solid #fff' : '3px solid transparent',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: 14,
                  transition: 'all 0.15s',
                  textDecoration: 'none',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = COLORS.hover; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom user info */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid rgba(255,255,255,0.15)',
        }}>
          <div style={{ color: COLORS.muted, fontSize: 12, marginBottom: 4 }}>
            {user?.first_name} {user?.last_name}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 12 }}>
            {user?.email}
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '8px 0',
              background: 'rgba(255,255,255,0.12)',
              color: COLORS.white,
              borderRadius: 6,
              fontSize: 13,
              border: '1px solid rgba(255,255,255,0.2)',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
          >
            Выйти
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ marginLeft: 240, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Top bar */}
        <header style={{
          background: '#ffffff',
          borderBottom: '1px solid #e0e0e0',
          padding: '0 28px',
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: '#1a1a1a' }}>
            {navItems.find(n => location.pathname.startsWith(n.path))?.label || 'Панель управления'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#6B5CE7',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: 13,
            }}>
              {(user?.first_name?.[0] || 'U').toUpperCase()}
            </div>
            <span style={{ fontSize: 13, color: '#555' }}>
              {user?.first_name} {user?.last_name}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main style={{
          flex: 1,
          padding: '28px',
          background: '#f5f5f5',
        }}>
          {children}
        </main>
      </div>
    </div>
  );
}
