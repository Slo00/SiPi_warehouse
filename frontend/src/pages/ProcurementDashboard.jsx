import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../api';

const S = {
  card: {
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
    padding: '20px 24px',
    marginBottom: 24,
  },
  sectionTitle: { fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 14 },
  badge: (color) => ({
    display: 'inline-block',
    background: color + '22',
    color: color,
    borderRadius: 6,
    padding: '2px 8px',
    fontSize: 12,
    fontWeight: 600,
  }),
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: 12, color: '#888', fontWeight: 600, padding: '8px 12px', borderBottom: '1px solid #f0f0f0' },
  td: { fontSize: 13, color: '#333', padding: '10px 12px', borderBottom: '1px solid #f7f7f7' },
};

export default function ProcurementDashboard() {
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.dashboardProcurement().then(setData).catch(() => {});
  }, []);

  if (!data) return <Layout><div style={{ color: '#888', padding: 40 }}>Загрузка...</div></Layout>;

  return (
    <Layout>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Истекающих товаров" value={data.expiring_products?.length || 0} color="#f59e0b" />
        <StatCard label="Низкие остатки" value={data.low_stock_products?.length || 0} color="#ef4444" />
        <StatCard label="Рекомендаций к закупке" value={data.recommended_orders?.length || 0} color="#6B5CE7" />
      </div>

      <div style={S.card}>
        <div style={S.sectionTitle}>Товары с истекающим сроком (3 дня)</div>
        <Table
          rows={data.expiring_products || []}
          empty="Нет товаров с истекающим сроком"
          cols={[
            { label: 'Наименование', render: r => r.name },
            { label: 'Категория', render: r => r.category },
            { label: 'Срок годности', render: r => <span style={S.badge('#f59e0b')}>{r.expiry_date}</span> },
            { label: 'Остаток', render: r => r.total_quantity ?? '—' },
          ]}
        />
      </div>

      <div style={S.card}>
        <div style={S.sectionTitle}>Критически низкие остатки</div>
        <Table
          rows={data.low_stock_products || []}
          empty="Нет товаров с низким остатком"
          cols={[
            { label: 'Наименование', render: r => r.name },
            { label: 'Категория', render: r => r.category },
            { label: 'Текущий остаток', render: r => <span style={S.badge('#ef4444')}>{r.total_quantity}</span> },
            { label: 'Минимум', render: r => r.min_stock_level },
          ]}
        />
      </div>

      <div style={S.card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={S.sectionTitle}>Рекомендуемые закупки</div>
          <button
            onClick={() => navigate('/supplier-orders/new')}
            style={{ padding: '7px 16px', background: '#6B5CE7', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            + Создать заказ
          </button>
        </div>
        <Table
          rows={data.recommended_orders || []}
          empty="Нет рекомендаций"
          cols={[
            { label: 'Товар', render: r => r.product_name },
            { label: 'На складе', render: r => r.current_stock },
            { label: 'Ср. продажи/мес', render: r => r.avg_monthly_sale?.toFixed(1) },
            { label: 'Рекомендуем закупить', render: r => <span style={S.badge('#6B5CE7')}>{r.recommended}</span> },
          ]}
        />
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

function Table({ rows, cols, empty }) {
  if (!rows.length) return <div style={{ color: '#aaa', fontSize: 13, padding: '12px 0' }}>{empty}</div>;
  return (
    <table style={S.table}>
      <thead>
        <tr>{cols.map(c => <th key={c.label} style={S.th}>{c.label}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>{cols.map(c => <td key={c.label} style={S.td}>{c.render(r)}</td>)}</tr>
        ))}
      </tbody>
    </table>
  );
}
