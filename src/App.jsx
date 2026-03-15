import React, { useState, useMemo } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider, useData } from './contexts/DataContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import EmployeeManagement from './pages/EmployeeManagement';
import SalaryManagement from './pages/SalaryManagement';
import Attendance from './pages/Attendance';
import InventoryManagement from './pages/InventoryManagement';
import FinanceManagement from './pages/FinanceManagement';
import TableManagement from './pages/TableManagement';
import ProductManagement from './pages/ProductManagement';
import OrderManagement from './pages/OrderManagement';
import OrderHistory from './pages/OrderHistory';
import EmployeeOrder from './pages/EmployeeOrder';
import EmployeeAttendance from './pages/EmployeeAttendance';
import Notifications from './pages/Notifications';
import MySalary from './pages/MySalary';
import { Lock, Eye, EyeOff } from 'lucide-react';

function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = login(username, password);
    if (!result.success) setError(result.message);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-logo">
          <div style={{ fontSize: '3rem', marginBottom: 8 }}>🍵</div>
          <h1>Tiệm Trà 9PM</h1>
          <p>Hệ Thống Quản Lí</p>
        </div>
        {error && (
          <div style={{ padding: '10px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: 'var(--accent-danger)', fontSize: '0.85rem', marginBottom: 16, textAlign: 'center' }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Tên Đăng Nhập</label>
            <input type="text" className="form-control" placeholder="Nhập tên đăng nhập" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Mật Khẩu</label>
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? 'text' : 'password'} className="form-control" placeholder="Nhập mật khẩu" value={password}
                onChange={(e) => setPassword(e.target.value)} required style={{ paddingRight: 40 }} />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-block btn-lg" style={{ marginTop: 8 }}>
            <Lock size={18} /> Đăng Nhập
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: 20, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Admin: <strong>admin</strong> / <strong>admin123</strong>
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const { user } = useAuth();
  const { orders } = useData();
  const [activePage, setActivePage] = useState(() => {
    if (!user) return 'dashboard';
    return user.role === 'admin' ? 'dashboard' : 'employee-order';
  });

  const notificationCount = useMemo(() => {
    if (!user || user.role !== 'admin') return 0;
    let count = 0;
    orders.forEach(order => { order.notifications?.forEach(n => { if (!n.read) count++; }); });
    return count;
  }, [orders, user]);

  if (!user) return <LoginPage />;

  const renderPage = () => {
    if (user.role === 'admin') {
      switch (activePage) {
        case 'dashboard': return <Dashboard />;
        case 'employees': return <EmployeeManagement />;
        case 'salary': return <SalaryManagement />;
        case 'attendance': return <Attendance />;
        case 'inventory': return <InventoryManagement />;
        case 'finance': return <FinanceManagement />;
        case 'tables': return <TableManagement />;
        case 'products': return <ProductManagement />;
        case 'orders': return <OrderManagement />;
        case 'order-history': return <OrderHistory />;
        case 'notifications': return <Notifications />;
        default: return <Dashboard />;
      }
    } else {
      switch (activePage) {
        case 'employee-order': return <EmployeeOrder />;
        case 'order-history': return <OrderHistory />;
        case 'employee-attendance': return <EmployeeAttendance />;
        case 'my-salary': return <MySalary />;
        default: return <EmployeeOrder />;
      }
    }
  };

  return (
    <div className="app-layout">
      <Sidebar activePage={activePage} onNavigate={setActivePage} notificationCount={notificationCount} />
      <main className="main-content">{renderPage()}</main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  );
}
