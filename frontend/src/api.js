const BASE = 'http://localhost:8080/api';

function token() {
  return localStorage.getItem('token');
}

function headers() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token()}`,
  };
}

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Ошибка запроса');
  return data;
}

export const api = {
  // Auth
  login: (body) => fetch(`${BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
  register: (body) => fetch(`${BASE}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),

  // Dashboards
  dashboardProcurement: () => req('GET', '/dashboard/procurement'),
  dashboardManager: () => req('GET', '/dashboard/manager'),
  dashboardWarehouse: () => req('GET', '/dashboard/warehouse'),

  // Assortment
  getAssortment: (params = '') => req('GET', `/assortment${params}`),
  getAssortmentById: (id) => req('GET', `/assortment/${id}`),
  getSalesChart: (id) => req('GET', `/assortment/${id}/sales-chart`),
  createAssortment: (body) => req('POST', '/assortment', body),
  updateAssortment: (id, body) => req('PUT', `/assortment/${id}`, body),
  deleteAssortment: (id) => req('DELETE', `/assortment/${id}`),

  // Stock
  getStock: (params = '') => req('GET', `/stock${params}`),
  getStockForecast: () => req('GET', '/stock/forecast'),
  createStock: (body) => req('POST', '/stock', body),
  updateStock: (id, body) => req('PUT', `/stock/${id}`, body),

  // Suppliers
  getSuppliers: () => req('GET', '/suppliers'),
  createSupplier: (body) => req('POST', '/suppliers', body),
  updateSupplier: (id, body) => req('PUT', `/suppliers/${id}`, body),
  deleteSupplier: (id) => req('DELETE', `/suppliers/${id}`),

  // Clients
  getClients: (search = '') => req('GET', `/clients?search=${search}`),
  createClient: (body) => req('POST', '/clients', body),
  updateClient: (id, body) => req('PUT', `/clients/${id}`, body),

  // Client Orders
  getClientOrders: (status = '') => req('GET', `/client-orders${status ? `?status=${status}` : ''}`),
  getClientOrderById: (id) => req('GET', `/client-orders/${id}`),
  createClientOrder: (body) => req('POST', '/client-orders', body),
  updateClientOrder: (id, body) => req('PUT', `/client-orders/${id}`, body),
  confirmClientOrder: (id) => req('POST', `/client-orders/${id}/confirm`),
  rejectClientOrder: (id) => req('POST', `/client-orders/${id}/reject`),
  getClientOrderItems: (orderId) => req('GET', `/client-order-items?order_id=${orderId}`),
  createClientOrderItem: (body) => req('POST', '/client-order-items', body),

  // Supplier Orders
  getSupplierOrders: (params = '') => req('GET', `/supplier-orders${params}`),
  getSupplierOrderById: (id) => req('GET', `/supplier-orders/${id}`),
  createSupplierOrder: (body) => req('POST', '/supplier-orders', body),
  updateSupplierOrder: (id, body) => req('PUT', `/supplier-orders/${id}`, body),
  getSupplierOrderItems: (orderId) => req('GET', `/supplier-order-items?order_id=${orderId}`),

  // Promotions
  getPromotions: (status = '') => req('GET', `/promotions${status ? `?status=${status}` : ''}`),
  getPromotionById: (id) => req('GET', `/promotions/${id}`),
  getPromotionStats: (id) => req('GET', `/promotions/${id}/stats`),
  getPromotionSuggestions: () => req('GET', '/promotions/suggestions'),
  createPromotion: (body) => req('POST', '/promotions', body),
  updatePromotion: (id, body) => req('PUT', `/promotions/${id}`, body),
  getPromotionItems: (promoId) => req('GET', `/promotion-items?promotion_id=${promoId}`),
  createPromotionItem: (body) => req('POST', '/promotion-items', body),

  // Returns
  getReturns: () => req('GET', '/returns'),
  createReturn: (body) => req('POST', '/returns', body),
};
