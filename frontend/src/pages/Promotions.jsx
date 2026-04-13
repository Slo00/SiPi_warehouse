import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../api';

const STATUS_FILTERS = [
  { value: '', label: 'Все' },
  { value: 'active', label: 'Активные' },
  { value: 'inactive', label: 'Неактивные' },
  { value: 'expired', label: 'Завершённые' },
];

const STATUS_COLORS = {
  active: '#10b981',
  inactive: '#f59e0b',
  expired: '#6b7280',
};

export default function Promotions() {
  const [promos, setPromos] = useState([]);
  const [filter, setFilter] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSugg, setShowSugg] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    api.getPromotions(filter).then(data => {
      setPromos(Array.isArray(data) ? data : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [filter]);

  function loadSuggestions() {
    api.getPromotionSuggestions().then(data => {
      setSuggestions(Array.isArray(data) ? data : []);
      setShowSugg(true);
    });
  }

  return (
    <Layout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Акции</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={loadSuggestions}
            style={{ padding: '9px 18px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
            Предложения
          </button>
          <button onClick={() => navigate('/promotions/new')}
            style={{ padding: '9px 18px', background: '#6B5CE7', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
            + Создать акцию
          </button>
        </div>
      </div>

      {showSugg && suggestions.length > 0 && (
        <div style={{ background: '#fffbeb', border: '1.5px solid #f59e0b44', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#b45309' }}>Рекомендации для акций (истекающие товары)</div>
            <button onClick={() => setShowSugg(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#888' }}>✕</button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {suggestions.map(s => (
              <div key={s.id} style={{ background: '#fff', border: '1px solid #f59e0b44', borderRadius: 8, padding: '10px 14px', minWidth: 200 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>Срок: {s.expiry_date} · Остаток: {s.total_quantity}</div>
                <div style={{ fontSize: 12, color: '#888' }}>Цена: {s.price?.toLocaleString('ru')} ₽</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        {STATUS_FILTERS.map(f => (
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
        ) : !promos.length ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>Акций нет</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                <th style={TH}>Название</th>
                <th style={TH}>Скидка</th>
                <th style={TH}>Период</th>
                <th style={TH}>Статус</th>
                <th style={TH}></th>
              </tr>
            </thead>
            <tbody>
              {promos.map(p => {
                const color = STATUS_COLORS[p.status] || '#888';
                const statusLabel = p.status === 'active' ? 'Активна' : p.status === 'inactive' ? 'Неактивна' : 'Завершена';
                return (
                  <tr key={p.id}
                    onClick={() => navigate(`/promotions/${p.id}`)}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f9f9f9'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={TD}><span style={{ fontWeight: 500 }}>{p.name}</span></td>
                    <td style={TD}>{p.discount_percent}%</td>
                    <td style={TD}>{p.start_date?.slice(0, 10)} — {p.end_date?.slice(0, 10)}</td>
                    <td style={TD}>
                      <span style={{ background: color + '22', color, borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>
                        {statusLabel}
                      </span>
                    </td>
                    <td style={TD} onClick={e => e.stopPropagation()}>
                      <button onClick={() => navigate(`/promotions/${p.id}/edit`)}
                        style={{ padding: '4px 10px', background: '#6B5CE715', color: '#6B5CE7', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        Ред.
                      </button>
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
