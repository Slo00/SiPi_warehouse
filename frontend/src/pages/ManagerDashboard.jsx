import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../api';

const S = {
  card: { background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '20px 24px', marginBottom: 24 },
  sectionTitle: { fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 14 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: 12, color: '#888', fontWeight: 600, padding: '8px 12px', borderBottom: '1px solid #f0f0f0' },
  td: { fontSize: 13, color: '#333', padding: '10px 12px', borderBottom: '1px solid #f7f7f7', cursor: 'pointer' },
};

const STATUS_LABELS = {
  new: { label: 'Новый', color: '#6B5CE7' },
  confirmed: { label: 'Подтверждён', color: '#10b981' },
  processing: { label: 'В обработке', color: '#f59e0b' },
  completed: { label: 'Завершён', color: '#6b7280' },
  cancelled: { label: 'Отменён', color: '#ef4444' },
};

export default function ManagerDashboard() {
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.dashboardManager().then(setData).catch(() => {});
  }, []);

  if (!data) return <Layout><div style={{ color: '#888', padding: 40 }}>Загрузка...</div></Layout>;

  return (
    <Layout>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Заказов ожидают подтверждения" value={data.pending_orders?.length || 0} color="#6B5CE7" />
        <StatCard label="Товаров с истекающим сроком для акций" value={data.expiring_promo_items?.length || 0} color="#f59e0b" />
      </div>

      <div style={S.card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={S.sectionTitle}>Заказы клиентов (ожидают подтверждения)</div>
          <button
            onClick={() => navigate('/client-orders')}
            style={{ padding: '7px 16px', background: '#6B5CE7', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            Все заказы
          </button>
        </div>
        {(data.pending_orders || []).length === 0 ? (
          <div style={{ color: '#aaa', fontSize: 13 }}>Нет заказов, ожидающих подтверждения</div>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Номер заказа</th>
                <th style={S.th}>Клиент</th>
                <th style={S.th}>Дата</th>
                <th style={S.th}>Сумма</th>
                <th style={S.th}>Статус</th>
              </tr>
            </thead>
            <tbody>
              {(data.pending_orders || []).map(o => {
                const st = STATUS_LABELS[o.status] || { label: o.status, color: '#888' };
                return (
                  <tr key={o.id} onClick={() => navigate(`/client-orders/${o.id}`)}
                    onMouseEnter={e => e.currentTarget.style.background = '#f9f9f9'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={S.td}>{o.order_number}</td>
                    <td style={S.td}>{o.client_name || '—'}</td>
                    <td style={S.td}>{o.order_date?.slice(0, 10)}</td>
                    <td style={S.td}>{o.total_amount?.toLocaleString('ru')} ₽</td>
                    <td style={S.td}>
                      <span style={{ background: st.color + '22', color: st.color, borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>
                        {st.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div style={S.card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={S.sectionTitle}>Товары с истекающим сроком (для акций)</div>
          <button
            onClick={() => navigate('/promotions')}
            style={{ padding: '7px 16px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            Создать акцию
          </button>
        </div>
        {(data.expiring_promo_items || []).length === 0 ? (
          <div style={{ color: '#aaa', fontSize: 13 }}>Нет товаров с истекающим сроком</div>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Наименование</th>
                <th style={S.th}>Категория</th>
                <th style={S.th}>Срок годности</th>
                <th style={S.th}>Остаток</th>
                <th style={S.th}>Цена</th>
              </tr>
            </thead>
            <tbody>
              {(data.expiring_promo_items || []).map(p => (
                <tr key={p.id}>
                  <td style={S.td}>{p.name}</td>
                  <td style={S.td}>{p.category}</td>
                  <td style={S.td}>
                    <span style={{ background: '#f59e0b22', color: '#f59e0b', borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>
                      {p.expiry_date}
                    </span>
                  </td>
                  <td style={S.td}>{p.total_quantity ?? '—'}</td>
                  <td style={S.td}>{p.price?.toLocaleString('ru')} ₽</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>{label}</div>
    </div>
  );
}
