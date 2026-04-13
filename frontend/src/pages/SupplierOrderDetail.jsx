import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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

export default function SupplierOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.getSupplierOrderById(id).then(setOrder).catch(() => {});
    api.getSupplierOrderItems(id).then(data => setItems(Array.isArray(data) ? data : [])).catch(() => {});
  }, [id]);

  if (!order) return <Layout><div style={{ padding: 40, color: '#aaa' }}>Загрузка...</div></Layout>;

  const st = STATUS_LABELS[order.status] || { label: order.status, color: '#888' };

  return (
    <Layout>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate('/supplier-orders')} style={BackBtn}>← Назад</button>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Заказ {order.order_number}</h2>
        <span style={{ background: st.color + '22', color: st.color, borderRadius: 6, padding: '3px 12px', fontSize: 13, fontWeight: 600 }}>
          {st.label}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <InfoCard title="Информация о заказе">
          <InfoRow label="Номер заказа" value={order.order_number} />
          <InfoRow label="Дата заказа" value={order.order_date?.slice(0, 10)} />
          <InfoRow label="Ожид. доставка" value={order.expected_delivery_date || '—'} />
          <InfoRow label="Условия доставки" value={order.delivery_conditions || '—'} />
        </InfoCard>
        <InfoCard title="Поставщик">
          <InfoRow label="Наименование" value={order.supplier_name || '—'} />
        </InfoCard>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '20px 24px' }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Позиции заказа</div>
        {!items.length ? (
          <div style={{ color: '#aaa', fontSize: 13 }}>Позиции не добавлены</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={TH}>Товар</th>
                <th style={TH}>Количество</th>
                <th style={TH}>Цена за ед.</th>
                <th style={TH}>Сумма</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i}>
                  <td style={TD}>{item.product_name || `Товар #${item.assortment_id}`}</td>
                  <td style={TD}>{item.quantity}</td>
                  <td style={TD}>{item.unit_price?.toLocaleString('ru')} ₽</td>
                  <td style={TD}>{((item.quantity || 0) * (item.unit_price || 0)).toLocaleString('ru')} ₽</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}

function InfoCard({ title, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '20px 24px' }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 14, borderBottom: '1px solid #f0f0f0', paddingBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 10 }}>
      <span style={{ color: '#888' }}>{label}</span>
      <span style={{ color: '#1a1a1a', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

const TH = { textAlign: 'left', fontSize: 12, color: '#888', fontWeight: 600, padding: '8px 12px', borderBottom: '1px solid #f0f0f0' };
const TD = { fontSize: 13, color: '#333', padding: '10px 12px', borderBottom: '1px solid #f7f7f7' };
const BackBtn = { padding: '6px 14px', background: 'transparent', border: '1.5px solid #e0e0e0', borderRadius: 7, fontSize: 13, cursor: 'pointer', color: '#555' };
