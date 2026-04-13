import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../api';

export default function AssortmentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState({
    name: '', article: '', price: '', category: '',
    expiry_date: '', description: '', min_stock_level: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      api.getAssortmentById(id).then(data => {
        setForm({
          name: data.name || '',
          article: data.article || '',
          price: data.price || '',
          category: data.category || '',
          expiry_date: data.expiry_date || '',
          description: data.description || '',
          min_stock_level: data.min_stock_level || 0,
        });
      });
    }
  }, [id]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const body = {
        ...form,
        price: parseFloat(form.price),
        min_stock_level: parseInt(form.min_stock_level),
      };
      if (isEdit) {
        await api.updateAssortment(id, body);
      } else {
        await api.createAssortment(body);
      }
      navigate('/assortment');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <div style={{ maxWidth: 600 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button onClick={() => navigate('/assortment')} style={BackBtn}>← Назад</button>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
            {isEdit ? 'Редактировать товар' : 'Добавить товар'}
          </h2>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '28px 32px' }}>
          {error && <div style={ErrorBox}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <Field label="Наименование *">
              <input name="name" value={form.name} onChange={handleChange} required style={Input} />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Артикул">
                <input name="article" value={form.article} onChange={handleChange} style={Input} />
              </Field>
              <Field label="Категория">
                <input name="category" value={form.category} onChange={handleChange} style={Input} />
              </Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Цена (₽) *">
                <input name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} required style={Input} />
              </Field>
              <Field label="Минимальный остаток">
                <input name="min_stock_level" type="number" min="0" value={form.min_stock_level} onChange={handleChange} style={Input} />
              </Field>
            </div>
            <Field label="Срок годности">
              <input name="expiry_date" type="date" value={form.expiry_date} onChange={handleChange} style={Input} />
            </Field>
            <Field label="Описание">
              <textarea name="description" value={form.description} onChange={handleChange} rows={3}
                style={{ ...Input, resize: 'vertical', height: 'auto' }} />
            </Field>

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button type="submit" disabled={loading} style={PrimaryBtn}>
                {loading ? 'Сохранение...' : (isEdit ? 'Сохранить' : 'Добавить')}
              </button>
              <button type="button" onClick={() => navigate('/assortment')} style={CancelBtn}>Отмена</button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#444', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

const Input = { width: '100%', padding: '10px 14px', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: 14, outline: 'none', color: '#1a1a1a', background: '#fff', boxSizing: 'border-box' };
const BackBtn = { padding: '6px 14px', background: 'transparent', border: '1.5px solid #e0e0e0', borderRadius: 7, fontSize: 13, cursor: 'pointer', color: '#555' };
const PrimaryBtn = { padding: '11px 28px', background: '#6B5CE7', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' };
const CancelBtn = { padding: '11px 20px', background: '#f5f5f5', color: '#555', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: 14, cursor: 'pointer' };
const ErrorBox = { background: '#fff3f3', border: '1px solid #ffcdd2', borderRadius: 8, padding: '10px 14px', color: '#e53935', fontSize: 13, marginBottom: 16 };
