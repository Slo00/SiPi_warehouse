import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../api';

export default function ClientOrderForm() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [assortment, setAssortment] = useState([]);
  const [form, setForm] = useState({
    order_number: '',
    client_id: '',
    source: '',
    delivery_method: '',
    items_list: '',
    total_amount: '',
    status: 'new',
  });
  const [items, setItems] = useState([{ assortment_id: '', quantity: 1, unit_price: '' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getClients().then(data => setClients(Array.isArray(data) ? data : [])).catch(() => {});
    api.getAssortment().then(data => setAssortment(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  function handleItemChange(idx, field, value) {
    setItems(prev => {
      const next = prev.map((it, i) => i === idx ? { ...it, [field]: value } : it);
      const total = next.reduce((s, it) => s + (parseFloat(it.unit_price) || 0) * (parseInt(it.quantity) || 0), 0);
      setForm(f => ({ ...f, total_amount: total.toFixed(2) }));
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const body = {
        ...form,
        client_id: form.client_id ? parseInt(form.client_id) : null,
        total_amount: parseFloat(form.total_amount) || 0,
      };
      const order = await api.createClientOrder(body);
      for (const item of items) {
        if (item.assortment_id) {
          await api.createClientOrderItem({
            client_order_id: order.id,
            assortment_id: parseInt(item.assortment_id),
            quantity: parseInt(item.quantity),
            unit_price: parseFloat(item.unit_price) || 0,
          });
        }
      }
      navigate('/client-orders');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <div style={{ maxWidth: 720 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button onClick={() => navigate('/client-orders')} style={BackBtn}>← Назад</button>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Новый заказ клиента</h2>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '28px 32px' }}>
          {error && <div style={ErrorBox}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Номер заказа *">
                <input name="order_number" value={form.order_number} onChange={handleChange} required style={Input} placeholder="CO-001" />
              </Field>
              <Field label="Клиент">
                <select name="client_id" value={form.client_id} onChange={handleChange} style={Input}>
                  <option value="">— Выбрать клиента —</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>)}
                </select>
              </Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Источник">
                <input name="source" value={form.source} onChange={handleChange} style={Input} placeholder="Сайт / Телефон / Офис" />
              </Field>
              <Field label="Способ доставки">
                <input name="delivery_method" value={form.delivery_method} onChange={handleChange} style={Input} placeholder="Самовывоз / Курьер" />
              </Field>
            </div>
            <Field label="Описание товаров">
              <textarea name="items_list" value={form.items_list} onChange={handleChange} rows={2}
                style={{ ...Input, resize: 'vertical', height: 'auto' }} placeholder="Краткий список товаров..." />
            </Field>

            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, marginTop: 8 }}>Позиции заказа</div>
            {items.map((item, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 10, marginBottom: 10, alignItems: 'end' }}>
                <Field label={idx === 0 ? 'Товар' : ''}>
                  <select value={item.assortment_id} onChange={e => handleItemChange(idx, 'assortment_id', e.target.value)} style={Input}>
                    <option value="">— Выбрать товар —</option>
                    {assortment.map(a => <option key={a.id} value={a.id}>{a.name} — {a.price?.toLocaleString('ru')} ₽</option>)}
                  </select>
                </Field>
                <Field label={idx === 0 ? 'Кол-во' : ''}>
                  <input type="number" min="1" value={item.quantity} onChange={e => handleItemChange(idx, 'quantity', e.target.value)} style={Input} />
                </Field>
                <Field label={idx === 0 ? 'Цена' : ''}>
                  <input type="number" min="0" step="0.01" value={item.unit_price} onChange={e => handleItemChange(idx, 'unit_price', e.target.value)} style={Input} placeholder="0.00" />
                </Field>
                <button type="button" onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))}
                  style={{ padding: '10px 12px', background: '#ef444415', color: '#ef4444', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 16 }}>
                  ✕
                </button>
              </div>
            ))}
            <button type="button" onClick={() => setItems(prev => [...prev, { assortment_id: '', quantity: 1, unit_price: '' }])}
              style={{ padding: '7px 16px', background: '#f5f5f5', border: '1.5px solid #e0e0e0', borderRadius: 7, fontSize: 13, cursor: 'pointer', marginBottom: 16 }}>
              + Добавить позицию
            </button>

            <div style={{ background: '#f5f5f5', borderRadius: 8, padding: '12px 16px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#444' }}>Итого:</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#6B5CE7' }}>{parseFloat(form.total_amount || 0).toLocaleString('ru')} ₽</span>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" disabled={loading} style={PrimaryBtn}>
                {loading ? 'Создание...' : 'Создать заказ'}
              </button>
              <button type="button" onClick={() => navigate('/client-orders')} style={CancelBtn}>Отмена</button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: label ? 16 : 0 }}>
      {label && <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#444', marginBottom: 6 }}>{label}</label>}
      {children}
    </div>
  );
}

const Input = { width: '100%', padding: '10px 14px', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: 14, outline: 'none', color: '#1a1a1a', background: '#fff', boxSizing: 'border-box' };
const BackBtn = { padding: '6px 14px', background: 'transparent', border: '1.5px solid #e0e0e0', borderRadius: 7, fontSize: 13, cursor: 'pointer', color: '#555' };
const PrimaryBtn = { padding: '11px 28px', background: '#6B5CE7', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' };
const CancelBtn = { padding: '11px 20px', background: '#f5f5f5', color: '#555', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: 14, cursor: 'pointer' };
const ErrorBox = { background: '#fff3f3', border: '1px solid #ffcdd2', borderRadius: 8, padding: '10px 14px', color: '#e53935', fontSize: 13, marginBottom: 16 };
