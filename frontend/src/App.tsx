import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CylinderManage from './pages/CylinderManage';
import OrderManage from './pages/OrderManage';
import UserManage from './pages/UserManage';
import SafetyManage from './pages/SafetyManage';
import AnnouncementManage from './pages/AnnouncementManage';
import DeliveryOrders from './pages/DeliveryOrders';
import SafetyCheck from './pages/SafetyCheck';
import UserHome from './pages/UserHome';
import UserOrder from './pages/UserOrder';
import UserOrders from './pages/UserOrders';
import { authApi } from './services/api';
import type { User } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await authApi.getCurrentUser();
      setUser(res.data);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={!user ? <Login onLogin={setUser} /> : <Navigate replace to={user.role === 'user' ? '/user' : (user.role === 'delivery' ? '/delivery' : '/admin')} />}
        />

        <Route element={<Layout user={user} onLogout={() => setUser(null)} />}>
          {/* 管理端路由 */}
          <Route path="/admin" element={user && ['admin', 'station'].includes(user.role) ? <Dashboard /> : <Navigate replace to="/login" />} />
          <Route path="/admin/cylinders" element={user && ['admin', 'station'].includes(user.role) ? <CylinderManage /> : <Navigate replace to="/login" />} />
          <Route path="/admin/orders" element={user && ['admin', 'station'].includes(user.role) ? <OrderManage /> : <Navigate replace to="/login" />} />
          <Route path="/admin/safety" element={user && ['admin', 'station'].includes(user.role) ? <SafetyManage /> : <Navigate replace to="/login" />} />
          <Route path="/admin/users" element={user?.role === 'admin' ? <UserManage /> : <Navigate replace to="/login" />} />
          <Route path="/admin/announcements" element={user?.role === 'admin' ? <AnnouncementManage /> : <Navigate replace to="/login" />} />

          {/* 配送端路由 */}
          <Route path="/delivery" element={user?.role === 'delivery' ? <DeliveryOrders /> : <Navigate replace to="/login" />} />
          <Route path="/delivery/safety" element={user?.role === 'delivery' ? <SafetyCheck /> : <Navigate replace to="/login" />} />

          {/* 用户端路由 */}
          <Route path="/user" element={user?.role === 'user' ? <UserHome /> : <Navigate replace to="/login" />} />
          <Route path="/user/order" element={user?.role === 'user' ? <UserOrder /> : <Navigate replace to="/login" />} />
          <Route path="/user/orders" element={user?.role === 'user' ? <UserOrders /> : <Navigate replace to="/login" />} />
        </Route>

        <Route path="/" element={<Navigate replace to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}
