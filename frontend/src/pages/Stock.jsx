import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../api';

const FILTERS = [
  { value: '', label: 'Все' },
  { value: '?filter=expiring', label: 'Истекающие' },
  { value: '?filter=expired', label: 'Просроченные' },
];

export default function Stock() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [editQty, setEditQty] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    api.getStock(filter).then(data => {
      setItems(Array.isArray(data) ? data : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [filter]);

  async function handleUpdateQty(id) {
    await api.updateStock(id, { total_quantity: parseInt(editQty) });
    setItems(prev => prev.map(i => i.id === id ? { ...i, total_quantity: parseInt(editQty) } : i));
    setEditId(null);
  }

  return (
    <Layout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Остатки на складе</h2>
        <button
          onClick={() => navigate('/stock/forecast')}
          style={{ padding: '9px 20px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
        >
          Прогноз спроса
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            style={{
              padding: '6px 14px', borderRadius: 20, border: '1.5px solid',
              borderColor: filter === f.value ? '#6B5CE7' : '#e0e0e0',
              background: filter === f.value ? '#6B5CE7' : '#fff',
              color: filter === f.value ? '#fff' : '#555',
              fontSize: 13, fontWeight: filter === f.value ? 600 : 400, cursor: 'pointer',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>Загрузка...</div>
        ) : !items.length ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>Нет данных</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                <th style={TH}>Товар</th>
                <th style={TH}>Категория</th>
                <th style={TH}>Количество</th>
                <th style={TH}>Мин. остаток</th>
                <th style={TH}>Срок годности</th>
                <th style={TH}>Обновлено</th>
                <th style={TH}></th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}
                  onMouseEnter={e => e.currentTarget.style.background = '#f9f9f9'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={TD}><div style={{ fontWeight: 500 }}>{item.product_name}</div></td>
                  <td style={TD}>{item.category || '—'}</td>
                  <td style={TD}>
                    {editId === item.id ? (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input
                          type="number" value={editQty} onChange={e => setEditQty(e.target.value)}
                          style={{ width: 70, padding: '4px 8px', border: '1.5px solid #6B5CE7', borderRadius: 6, fontSize: 13 }}
                          autoFocus
                        />
                        <button onClick={() => handleUpdateQty(item.id)} style={{ padding: '4px 10px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>✓</button>
                        <button onClick={() => setEditId(null)} style={{ padding: '4px 8px', background: '#f5f5f5', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>✕</button>
                      </div>
                    ) : (
                      <StockBadge qty={item.total_quantity} min={item.min_stock_level} />
                    )}
                  </td>
                  <td style={TD}>{item.min_stock_level ?? '—'}</td>
                  <td style={TD}>
                    {item.expiry_date ? <ExpiryBadge date={item.expiry_date} /> : '—'}
                  </td>
                  <td style={TD}>{item.last_updated ? new Date(item.last_updated).toLocaleDateString('ru') : '—'}</td>
                  <td style={TD}>
                    <button
                      onClick={() => { setEditId(item.id); setEditQty(item.total_quantity); }}
                      style={{ padding: '4px 10px', background: '#6B5CE715', color: '#6B5CE7', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                    >
                      Изменить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}

function StockBadge({ qty, min }) {
  const low = min != null && qty <= min;
  const color = low ? '#ef4444' : '#10b981';
  return (
    <span style={{ background: color + '22', color, borderRadius: 6, padding: '2px 10px', fontSize: 13, fontWeight: 600 }}>
      {qty}
    </span>
  );
}

function ExpiryBadge({ date }) {
  const d = new Date(date);
  const diff = Math.ceil((d - new Date()) / 86400000);
  const color = diff < 0 ? '#ef4444' : diff <= 3 ? '#f59e0b' : '#10b981';
  return (
    <span style={{ background: color + '22', color, borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>
      {date}
    </span>
  );
}

const TH = { textAlign: 'left', fontSize: 12, color: '#888', fontWeight: 600, padding: '10px 16px' };
const TD = { fontSize: 13, color: '#333', padding: '12px 16px', borderBottom: '1px solid #f7f7f7', verticalAlign: 'middle' };
