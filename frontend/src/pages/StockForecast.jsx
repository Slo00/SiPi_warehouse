import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../api';

export default function StockForecast() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.getStockForecast().then(data => {
      setItems(Array.isArray(data) ? data : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate('/stock')} style={BackBtn}>← Назад</button>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Прогноз спроса и рекомендации</h2>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>Загрузка...</div>
        ) : !items.length ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>Недостаточно данных для прогноза</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                <th style={TH}>Товар</th>
                <th style={TH}>Текущий остаток</th>
                <th style={TH}>Ср. продаж/мес</th>
                <th style={TH}>Прогноз (мес)</th>
                <th style={TH}>Рекомендуем закупить</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => {
                const urgency = item.forecast_months < 1 ? '#ef4444' : item.forecast_months < 2 ? '#f59e0b' : '#10b981';
                return (
                  <tr key={i}
                    onMouseEnter={e => e.currentTarget.style.background = '#f9f9f9'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={TD}><div style={{ fontWeight: 500 }}>{item.product_name}</div></td>
                    <td style={TD}>{item.current_stock}</td>
                    <td style={TD}>{item.avg_monthly_sale?.toFixed(1)}</td>
                    <td style={TD}>
                      <span style={{ background: urgency + '22', color: urgency, borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>
                        {item.forecast_months?.toFixed(1)} мес
                      </span>
                    </td>
                    <td style={TD}>
                      {item.recommended_order > 0 ? (
                        <span style={{ background: '#6B5CE722', color: '#6B5CE7', borderRadius: 6, padding: '2px 10px', fontSize: 13, fontWeight: 700 }}>
                          {item.recommended_order}
                        </span>
                      ) : (
                        <span style={{ color: '#10b981', fontSize: 13 }}>Достаточно</span>
                      )}
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
const BackBtn = { padding: '6px 14px', background: 'transparent', border: '1.5px solid #e0e0e0', borderRadius: 7, fontSize: 13, cursor: 'pointer', color: '#555' };
