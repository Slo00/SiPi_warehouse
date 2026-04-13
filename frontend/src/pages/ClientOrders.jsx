import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../api';

const STATUS_FILTERS = [
  { value: '', label: 'Все' },
  { value: 'new', label: 'Новые' },
  { value: 'confirmed', label: 'Подтверждённые' },
  { value: 'processing', label: 'В обработке' },
  { value: 'completed', label: 'Завершённые' },
  { value: 'cancelled', label: 'Отменённые' },
];

const STATUS_LABELS = {
  new: { label: 'Новый', color: '#6B5CE7' },
  confirmed: { label: 'Подтверждён', color: '#10b981' },
  processing: { label: 'В обработке', color: '#f59e0b' },
  completed: { label: 'Завершён', color: '#6b7280' },
  cancelled: { label: 'Отменён', color: '#ef4444' },
};

export default function ClientOrders() {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    api.getClientOrders(statusFilter).then(data => {
      setOrders(Array.isArray(data) ? data : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [statusFilter]);

  return (
    <Layout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Заказы клиентов</h2>
        <button
          onClick={() => navigate('/client-orders/new')}
          style={{ padding: '9px 20px', background: '#6B5CE7', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
        >
          + Новый заказ
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {STATUS_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            style={{
              padding: '6px 14px', borderRadius: 20, border: '1.5px solid',
              borderColor: statusFilter === f.value ? '#6B5CE7' : '#e0e0e0',
              background: statusFilter === f.value ? '#6B5CE7' : '#fff',
              color: statusFilter === f.value ? '#fff' : '#555',
              fontSize: 13, fontWeight: statusFilter === f.value ? 600 : 400, cursor: 'pointer',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>Загрузка...</div>
        ) : !orders.length ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>Заказов нет</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                <th style={TH}>Номер</th>
                <th style={TH}>Клиент</th>
                <th style={TH}>Дата</th>
                <th style={TH}>Сумма</th>
                <th style={TH}>Источник</th>
                <th style={TH}>Доставка</th>
                <th style={TH}>Статус</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => {
                const st = STATUS_LABELS[o.status] || { label: o.status, color: '#888' };
                return (
                  <tr key={o.id}
                    onClick={() => navigate(`/client-orders/${o.id}`)}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f9f9f9'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={TD}><span style={{ fontWeight: 600, color: '#6B5CE7' }}>{o.order_number}</span></td>
                    <td style={TD}>{o.client_name || '—'}</td>
                    <td style={TD}>{o.order_date?.slice(0, 10)}</td>
                    <td style={TD}>{o.total_amount?.toLocaleString('ru')} ₽</td>
                    <td style={TD}>{o.source || '—'}</td>
                    <td style={TD}>{o.delivery_method || '—'}</td>
                    <td style={TD}>
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
    </Layout>
  );
}

const TH = { textAlign: 'left', fontSize: 12, color: '#888', fontWeight: 600, padding: '10px 16px' };
const TD = { fontSize: 13, color: '#333', padding: '12px 16px', borderBottom: '1px solid #f7f7f7', verticalAlign: 'middle' };
