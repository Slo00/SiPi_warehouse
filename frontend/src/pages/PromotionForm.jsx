import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../api';

export default function PromotionForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [form, setForm] = useState({
    name: '', discount_percent: '', start_date: '', end_date: '', status: 'active',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      api.getPromotionById(id).then(data => {
        setForm({
          name: data.name || '',
          discount_percent: data.discount_percent || '',
          start_date: data.start_date?.slice(0, 10) || '',
          end_date: data.end_date?.slice(0, 10) || '',
          status: data.status || 'active',
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
      const body = { ...form, discount_percent: parseFloat(form.discount_percent) };
      if (isEdit) {
        await api.updatePromotion(id, body);
      } else {
        await api.createPromotion(body);
      }
      navigate('/promotions');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <div style={{ maxWidth: 560 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button onClick={() => navigate('/promotions')} style={BackBtn}>← Назад</button>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
            {isEdit ? 'Редактировать акцию' : 'Создать акцию'}
          </h2>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '28px 32px' }}>
          {error && <div style={ErrorBox}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <Field label="Название акции *">
              <input name="name" value={form.name} onChange={handleChange} required style={Input} placeholder="Летняя распродажа" />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Скидка (%) *">
                <input name="discount_percent" type="number" min="0" max="100" step="0.01" value={form.discount_percent} onChange={handleChange} required style={Input} />
              </Field>
              <Field label="Статус">
                <select name="status" value={form.status} onChange={handleChange} style={Input}>
                  <option value="active">Активна</option>
                  <option value="inactive">Неактивна</option>
                  <option value="expired">Завершена</option>
                </select>
              </Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Дата начала *">
                <input name="start_date" type="date" value={form.start_date} onChange={handleChange} required style={Input} />
              </Field>
              <Field label="Дата окончания *">
                <input name="end_date" type="date" value={form.end_date} onChange={handleChange} required style={Input} />
              </Field>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button type="submit" disabled={loading} style={PrimaryBtn}>
                {loading ? 'Сохранение...' : (isEdit ? 'Сохранить' : 'Создать')}
              </button>
              <button type="button" onClick={() => navigate('/promotions')} style={CancelBtn}>Отмена</button>
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
