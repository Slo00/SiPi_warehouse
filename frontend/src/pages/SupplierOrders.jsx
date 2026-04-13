import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../api';

const STATUS_LABELS = {
  new: { label: 'Новый', color: '#6B5CE7' },
  pending: { label: 'Ожидает', color: '#6B5CE7' },
  confirmed: { label: 'Подтверждён', color: '#10b981' },
  processing: { label: 'В обработке', color: '#f59e0b' },
  completed: { label: 'Завершён', color: '#6b7280' },
  cancelled: { label: 'Отменён', color: '#ef4444' },
};

export default function SupplierOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.getSupplierOrders().then(data => {
      setOrders(Array.isArray(data) ? data : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Заказы поставщикам</h2>
        <button
          onClick={() => navigate('/supplier-orders/new')}
          style={{ padding: '9px 20px', background: '#6B5CE7', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
        >
          + Новый заказ
        </button>
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
                <th style={TH}>Поставщик</th>
                <th style={TH}>Дата заказа</th>
                <th style={TH}>Ожид. доставка</th>
                <th style={TH}>Статус</th>
                <th style={TH}>Условия</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => {
                const st = STATUS_LABELS[o.status] || { label: o.status, color: '#888' };
                return (
                  <tr key={o.id}
                    onClick={() => navigate(`/supplier-orders/${o.id}`)}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f9f9f9'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={TD}><span style={{ fontWeight: 600, color: '#6B5CE7' }}>{o.order_number}</span></td>
                    <td style={TD}>{o.supplier_name || '—'}</td>
                    <td style={TD}>{o.order_date?.slice(0, 10)}</td>
                    <td style={TD}>{o.expected_delivery_date || '—'}</td>
                    <td style={TD}>
                      <span style={{ background: st.color + '22', color: st.color, borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>
                        {st.label}
                      </span>
                    </td>
                    <td style={TD}>{o.delivery_conditions || '—'}</td>
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
