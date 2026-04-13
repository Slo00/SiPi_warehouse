import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../api';

const FILTERS = [
  { value: '', label: 'Все' },
  { value: '?filter=expiring', label: 'Истекающие' },
  { value: '?filter=low_stock', label: 'Низкий остаток' },
  { value: '?filter=expired', label: 'Просроченные' },
];

export default function Assortment() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    api.getAssortment(filter).then(data => {
      setItems(Array.isArray(data) ? data : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [filter]);

  async function handleDelete(id) {
    if (!confirm('Удалить товар?')) return;
    await api.deleteAssortment(id);
    setItems(prev => prev.filter(i => i.id !== id));
  }

  const filtered = search
    ? items.filter(i => i.name?.toLowerCase().includes(search.toLowerCase()) || i.article?.toLowerCase().includes(search.toLowerCase()))
    : items;

  return (
    <Layout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Ассортимент</h2>
        <button
          onClick={() => navigate('/assortment/new')}
          style={{ padding: '9px 20px', background: '#6B5CE7', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
        >
          + Добавить товар
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              border: '1.5px solid',
              borderColor: filter === f.value ? '#6B5CE7' : '#e0e0e0',
              background: filter === f.value ? '#6B5CE7' : '#fff',
              color: filter === f.value ? '#fff' : '#555',
              fontSize: 13,
              fontWeight: filter === f.value ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {f.label}
          </button>
        ))}
        <input
          placeholder="Поиск по названию или артикулу..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            marginLeft: 'auto',
            padding: '6px 14px',
            border: '1.5px solid #e0e0e0',
            borderRadius: 8,
            fontSize: 13,
            outline: 'none',
            minWidth: 240,
          }}
        />
      </div>

      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>Загрузка...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>Товары не найдены</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                <th style={TH}>Наименование</th>
                <th style={TH}>Артикул</th>
                <th style={TH}>Категория</th>
                <th style={TH}>Цена</th>
                <th style={TH}>Срок годности</th>
                <th style={TH}>Мин. остаток</th>
                <th style={TH}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id}
                  onMouseEnter={e => e.currentTarget.style.background = '#f9f9f9'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={TD}>
                    <div style={{ fontWeight: 500 }}>{item.name}</div>
                    {item.description && <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{item.description}</div>}
                  </td>
                  <td style={TD}>{item.article}</td>
                  <td style={TD}>{item.category}</td>
                  <td style={TD}>{item.price?.toLocaleString('ru')} ₽</td>
                  <td style={TD}>
                    {item.expiry_date ? (
                      <ExpiryBadge date={item.expiry_date} />
                    ) : '—'}
                  </td>
                  <td style={TD}>{item.min_stock_level ?? '—'}</td>
                  <td style={{ ...TD, width: 100 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <ActionBtn color="#6B5CE7" onClick={() => navigate(`/assortment/${item.id}/edit`)}>Ред.</ActionBtn>
                      <ActionBtn color="#ef4444" onClick={() => handleDelete(item.id)}>Удал.</ActionBtn>
                    </div>
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

function ExpiryBadge({ date }) {
  const d = new Date(date);
  const now = new Date();
  const diff = Math.ceil((d - now) / 86400000);
  const color = diff < 0 ? '#ef4444' : diff <= 3 ? '#f59e0b' : '#10b981';
  return (
    <span style={{ background: color + '22', color, borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>
      {date}
    </span>
  );
}

function ActionBtn({ color, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: '4px 10px',
      background: color + '15',
      color,
      border: 'none',
      borderRadius: 6,
      fontSize: 12,
      fontWeight: 600,
      cursor: 'pointer',
    }}>
      {children}
    </button>
  );
}

const TH = { textAlign: 'left', fontSize: 12, color: '#888', fontWeight: 600, padding: '10px 16px' };
const TD = { fontSize: 13, color: '#333', padding: '12px 16px', borderBottom: '1px solid #f7f7f7', verticalAlign: 'middle' };
