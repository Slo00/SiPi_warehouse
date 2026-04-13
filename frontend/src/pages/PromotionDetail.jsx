import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../api';

const STATUS_COLORS = { active: '#10b981', inactive: '#f59e0b', expired: '#6b7280' };
const STATUS_LABELS = { active: 'Активна', inactive: 'Неактивна', expired: 'Завершена' };

export default function PromotionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [promo, setPromo] = useState(null);
  const [stats, setStats] = useState(null);
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.getPromotionById(id).then(setPromo).catch(() => {});
    api.getPromotionStats(id).then(setStats).catch(() => {});
    api.getPromotionItems(id).then(data => setItems(Array.isArray(data) ? data : [])).catch(() => {});
  }, [id]);

  if (!promo) return <Layout><div style={{ padding: 40, color: '#aaa' }}>Загрузка...</div></Layout>;

  const color = STATUS_COLORS[promo.status] || '#888';
  const label = STATUS_LABELS[promo.status] || promo.status;

  return (
    <Layout>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate('/promotions')} style={BackBtn}>← Назад</button>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{promo.name}</h2>
        <span style={{ background: color + '22', color, borderRadius: 6, padding: '3px 12px', fontSize: 13, fontWeight: 600 }}>
          {label}
        </span>
        <div style={{ marginLeft: 'auto' }}>
          <button onClick={() => navigate(`/promotions/${id}/edit`)}
            style={{ padding: '8px 18px', background: '#6B5CE7', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Редактировать
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <InfoCard title="Параметры акции">
          <InfoRow label="Скидка" value={`${promo.discount_percent}%`} />
          <InfoRow label="Начало" value={promo.start_date?.slice(0, 10)} />
          <InfoRow label="Окончание" value={promo.end_date?.slice(0, 10)} />
        </InfoCard>
        {stats && (
          <InfoCard title="Статистика">
            <InfoRow label="Заказов" value={stats.total_orders || 0} />
            <InfoRow label="Выручка" value={`${(stats.total_revenue || 0).toLocaleString('ru')} ₽`} />
          </InfoCard>
        )}
      </div>

      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '20px 24px' }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Товары в акции</div>
        {!items.length ? (
          <div style={{ color: '#aaa', fontSize: 13 }}>Товары не добавлены</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={TH}>Товар</th>
                <th style={TH}>Скидка</th>
                <th style={TH}>Спец. цена</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i}>
                  <td style={TD}>{item.assortment_name || `Товар #${item.assortment_id}`}</td>
                  <td style={TD}>{item.discount_percent}%</td>
                  <td style={TD}>{item.special_price?.toLocaleString('ru') ?? '—'} ₽</td>
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
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, borderBottom: '1px solid #f0f0f0', paddingBottom: 10 }}>{title}</div>
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
