import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { api } from '../api';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', company: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load(search);
  }, [search]);

  function load(q = '') {
    api.getClients(q).then(data => {
      setClients(Array.isArray(data) ? data : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }

  function openCreate() {
    setEditItem(null);
    setForm({ name: '', phone: '', email: '', company: '' });
    setShowForm(true);
  }

  function openEdit(c) {
    setEditItem(c);
    setForm({ name: c.name || '', phone: c.phone || '', email: c.email || '', company: c.company || '' });
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (editItem) {
      const updated = await api.updateClient(editItem.id, form);
      setClients(prev => prev.map(c => c.id === editItem.id ? updated : c));
    } else {
      const created = await api.createClient(form);
      setClients(prev => [...prev, created]);
    }
    setShowForm(false);
  }

  return (
    <Layout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Клиенты</h2>
        <button onClick={openCreate}
          style={{ padding: '9px 20px', background: '#6B5CE7', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
          + Добавить клиента
        </button>
      </div>

      <input
        placeholder="Поиск по имени или компании..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ padding: '9px 14px', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: 13, outline: 'none', width: 280, marginBottom: 16 }}
      />

      {showForm && (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '24px 28px', marginBottom: 20, maxWidth: 520 }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>{editItem ? 'Редактировать' : 'Новый клиент'}</div>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <Field label="Имя / ФИО *">
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required style={Input} />
              </Field>
              <Field label="Компания">
                <input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} style={Input} />
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
        ) : !clients.length ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>Клиенты не найдены</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                <th style={TH}>Имя</th>
                <th style={TH}>Компания</th>
                <th style={TH}>Телефон</th>
                <th style={TH}>Email</th>
                <th style={TH}></th>
              </tr>
            </thead>
            <tbody>
              {clients.map(c => (
                <tr key={c.id}
                  onMouseEnter={e => e.currentTarget.style.background = '#f9f9f9'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={TD}><span style={{ fontWeight: 500 }}>{c.name}</span></td>
                  <td style={TD}>{c.company || '—'}</td>
                  <td style={TD}>{c.phone || '—'}</td>
                  <td style={TD}>{c.email || '—'}</td>
                  <td style={TD}>
                    <button onClick={() => openEdit(c)} style={{ padding: '4px 10px', background: '#6B5CE715', color: '#6B5CE7', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      Ред.
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
