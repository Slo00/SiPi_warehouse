import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ProcurementDashboard from './pages/ProcurementDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import WarehouseDashboard from './pages/WarehouseDashboard';
import Assortment from './pages/Assortment';
import AssortmentForm from './pages/AssortmentForm';
import Stock from './pages/Stock';
import StockForecast from './pages/StockForecast';
import SupplierOrders from './pages/SupplierOrders';
import SupplierOrderDetail from './pages/SupplierOrderDetail';
import SupplierOrderForm from './pages/SupplierOrderForm';
import ClientOrders from './pages/ClientOrders';
import ClientOrderDetail from './pages/ClientOrderDetail';
import ClientOrderForm from './pages/ClientOrderForm';
import Promotions from './pages/Promotions';
import PromotionDetail from './pages/PromotionDetail';
import PromotionForm from './pages/PromotionForm';
import Suppliers from './pages/Suppliers';
import Clients from './pages/Clients';
import Returns from './pages/Returns';

function RequireAuth({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/dashboard/procurement" element={<RequireAuth><ProcurementDashboard /></RequireAuth>} />
        <Route path="/dashboard/manager" element={<RequireAuth><ManagerDashboard /></RequireAuth>} />
        <Route path="/dashboard/warehouse" element={<RequireAuth><WarehouseDashboard /></RequireAuth>} />

        <Route path="/assortment" element={<RequireAuth><Assortment /></RequireAuth>} />
        <Route path="/assortment/new" element={<RequireAuth><AssortmentForm /></RequireAuth>} />
        <Route path="/assortment/:id/edit" element={<RequireAuth><AssortmentForm /></RequireAuth>} />

        <Route path="/stock" element={<RequireAuth><Stock /></RequireAuth>} />
        <Route path="/stock/forecast" element={<RequireAuth><StockForecast /></RequireAuth>} />

        <Route path="/supplier-orders" element={<RequireAuth><SupplierOrders /></RequireAuth>} />
        <Route path="/supplier-orders/new" element={<RequireAuth><SupplierOrderForm /></RequireAuth>} />
        <Route path="/supplier-orders/:id" element={<RequireAuth><SupplierOrderDetail /></RequireAuth>} />

        <Route path="/client-orders" element={<RequireAuth><ClientOrders /></RequireAuth>} />
        <Route path="/client-orders/new" element={<RequireAuth><ClientOrderForm /></RequireAuth>} />
        <Route path="/client-orders/:id" element={<RequireAuth><ClientOrderDetail /></RequireAuth>} />

        <Route path="/promotions" element={<RequireAuth><Promotions /></RequireAuth>} />
        <Route path="/promotions/new" element={<RequireAuth><PromotionForm /></RequireAuth>} />
        <Route path="/promotions/:id" element={<RequireAuth><PromotionDetail /></RequireAuth>} />
        <Route path="/promotions/:id/edit" element={<RequireAuth><PromotionForm /></RequireAuth>} />

        <Route path="/suppliers" element={<RequireAuth><Suppliers /></RequireAuth>} />
        <Route path="/clients" element={<RequireAuth><Clients /></RequireAuth>} />
        <Route path="/returns" element={<RequireAuth><Returns /></RequireAuth>} />

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
