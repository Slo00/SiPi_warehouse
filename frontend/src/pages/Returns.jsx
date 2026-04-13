import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { api } from '../api';

export default function Returns() {
  const [returns, setReturns] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ return_number: '', order_number: '', items_list: '', reason: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getReturns().then(data => {
      setReturns(Array.isArray(data) ? data : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    const created = await api.createReturn(form);
    setReturns(prev => [created, ...prev]);
    setShowForm(false);
    setForm({ return_number: '', order_number: '', items_list: '', reason: '' });
  }

  async function handleDelete(id) {
    if (!confirm('Удалить возврат?')) return;
    await fetch(`http://localhost:8080/api/returns/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    setReturns(prev => prev.filter(r => r.id !== id));
  }

  return (
    <Layout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Возвраты</h2>
        <button onClick={() => setShowForm(v => !v)}
          style={{ padding: '9px 20px', background: '#6B5CE7', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
          + Оформить возврат
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '24px 28px', marginBottom: 20, maxWidth: 560 }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Новый возврат</div>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <Field label="Номер возврата *">
                <input value={form.return_number} onChange={e => setForm(f => ({ ...f, return_number: e.target.value }))} required style={Input} placeholder="RET-001" />
              </Field>
              <Field label="Номер заказа">
                <input value={form.order_number} onChange={e => setForm(f => ({ ...f, order_number: e.target.value }))} style={Input} placeholder="CO-001" />
              </Field>
            </div>
            <Field label="Список товаров">
              <textarea value={form.items_list} onChange={e => setForm(f => ({ ...f, items_list: e.target.value }))} rows={2}
                style={{ ...Input, resize: 'vertical', height: 'auto' }} placeholder="Перечень возвращаемых товаров..." />
            </Field>
            <Field label="Причина возврата">
              <textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} rows={2}
                style={{ ...Input, resize: 'vertical', height: 'auto', marginBottom: 14 }} placeholder="Укажите причину..." />
            </Field>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" style={PrimaryBtn}>Оформить</button>
              <button type="button" onClick={() => setShowForm(false)} style={CancelBtn}>Отмена</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>Загрузка...</div>
        ) : !returns.length ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>Возвратов нет</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                <th style={TH}>Номер</th>
                <th style={TH}>Заказ</th>
                <th style={TH}>Дата</th>
                <th style={TH}>Причина</th>
                <th style={TH}>Товары</th>
                <th style={TH}></th>
              </tr>
            </thead>
            <tbody>
              {returns.map(r => (
                <tr key={r.id}
                  onMouseEnter={e => e.currentTarget.style.background = '#f9f9f9'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={TD}><span style={{ fontWeight: 600, color: '#6B5CE7' }}>{r.return_number}</span></td>
                  <td style={TD}>{r.order_number || '—'}</td>
                  <td style={TD}>{r.return_date?.slice(0, 10)}</td>
                  <td style={TD}>{r.reason || '—'}</td>
                  <td style={TD}>{r.items_list || '—'}</td>
                  <td style={TD}>
                    <button onClick={() => handleDelete(r.id)} style={{ padding: '4px 10px', background: '#ef444415', color: '#ef4444', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      Удал.
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

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#444', marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );
}

const Input = { width: '100%', padding: '9px 12px', border: '1.5px solid #e0e0e0', borderRadius: 7, fontSize: 13, outline: 'none', color: '#1a1a1a', background: '#fff', boxSizing: 'border-box' };
const TH = { textAlign: 'left', fontSize: 12, color: '#888', fontWeight: 600, padding: '10px 16px' };
const TD = { fontSize: 13, color: '#333', padding: '12px 16px', borderBottom: '1px solid #f7f7f7', verticalAlign: 'middle' };
const PrimaryBtn = { padding: '9px 22px', background: '#6B5CE7', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer' };
const CancelBtn = { padding: '9px 16px', background: '#f5f5f5', color: '#555', border: '1.5px solid #e0e0e0', borderRadius: 7, fontSize: 13, cursor: 'pointer' };
