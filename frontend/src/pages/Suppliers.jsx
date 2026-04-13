import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { api } from '../api';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', contact_info: '', phone: '', email: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  function load() {
    api.getSuppliers().then(data => {
      setSuppliers(Array.isArray(data) ? data : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }

  function openCreate() {
    setEditItem(null);
    setForm({ name: '', contact_info: '', phone: '', email: '' });
    setShowForm(true);
  }

  function openEdit(s) {
    setEditItem(s);
    setForm({ name: s.name || '', contact_info: s.contact_info || '', phone: s.phone || '', email: s.email || '' });
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (editItem) {
      const updated = await api.updateSupplier(editItem.id, form);
      setSuppliers(prev => prev.map(s => s.id === editItem.id ? updated : s));
    } else {
      const created = await api.createSupplier(form);
      setSuppliers(prev => [...prev, created]);
    }
    setShowForm(false);
  }

  async function handleDelete(id) {
    if (!confirm('Удалить поставщика?')) return;
    await api.deleteSupplier(id);
    setSuppliers(prev => prev.filter(s => s.id !== id));
  }

  return (
    <Layout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Поставщики</h2>
        <button onClick={openCreate}
          style={{ padding: '9px 20px', background: '#6B5CE7', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
          + Добавить поставщика
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '24px 28px', marginBottom: 20, maxWidth: 520 }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>{editItem ? 'Редактировать' : 'Новый поставщик'}</div>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <Field label="Название *">
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required style={Input} />
              </Field>
              <Field label="Контактное лицо">
                <input value={form.contact_info} onChange={e => setForm(f => ({ ...f, contact_info: e.target.value }))} style={Input} />
              </Field>
              <Field label="Телефон">
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} style={Input} />
              </Field>
              <Field label="Email">
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={Input} />
              </Field>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" style={PrimaryBtn}>{editItem ? 'Сохранить' : 'Добавить'}</button>
              <button type="button" onClick={() => setShowForm(false)} style={CancelBtn}>Отмена</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>Загрузка...</div>
        ) : !suppliers.length ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>Поставщики не добавлены</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                <th style={TH}>Название</th>
                <th style={TH}>Контактное лицо</th>
                <th style={TH}>Телефон</th>
                <th style={TH}>Email</th>
                <th style={TH}></th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map(s => (
                <tr key={s.id}
                  onMouseEnter={e => e.currentTarget.style.background = '#f9f9f9'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={TD}><span style={{ fontWeight: 500 }}>{s.name}</span></td>
                  <td style={TD}>{s.contact_info || '—'}</td>
                  <td style={TD}>{s.phone || '—'}</td>
                  <td style={TD}>{s.email || '—'}</td>
                  <td style={TD}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => openEdit(s)} style={{ padding: '4px 10px', background: '#6B5CE715', color: '#6B5CE7', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Ред.</button>
                      <button onClick={() => handleDelete(s.id)} style={{ padding: '4px 10px', background: '#ef444415', color: '#ef4444', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Удал.</button>
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

function Field({ label, children }) {
  return (
    <div>
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
