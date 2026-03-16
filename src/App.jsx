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
import UserProfile from './pages/UserProfile';
import { Lock, Eye, EyeOff, Menu } from 'lucide-react';

function LoginPage() {
  const { login, register, resetPassword } = useAuth();
  const [view, setView] = useState('login'); // 'login', 'register', 'forgot'
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const clearForm = () => {
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setError('');
    setSuccessMsg('');
  };

  const switchView = (newView) => {
    clearForm();
    setView(newView);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const result = login(username, password);
    if (!result.success) setError(result.message);
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp!');
      return;
    }
    const result = register(username, password, name || username);
    if (result.success) {
      setSuccessMsg(result.message);
      setError('');
      setTimeout(() => switchView('login'), 2000);
    } else {
      setError(result.message);
    }
  };

  const handleForgot = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp!');
      return;
    }
    const result = resetPassword(username, password);
    if (result.success) {
      setSuccessMsg(result.message);
      setError('');
      setTimeout(() => switchView('login'), 2000);
    } else {
      setError(result.message);
    }
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
        {successMsg && (
          <div style={{ padding: '10px 16px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, color: 'var(--accent-success)', fontSize: '0.85rem', marginBottom: 16, textAlign: 'center' }}>
            {successMsg}
          </div>
        )}

        {view === 'login' && (
          <form onSubmit={handleLogin}>
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
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <button type="button" onClick={() => switchView('forgot')} style={{ background: 'none', border: 'none', color: 'var(--accent-primary-light)', fontSize: '0.85rem', cursor: 'pointer' }}>
                Quên mật khẩu?
              </button>
            </div>
            <button type="submit" className="btn btn-primary btn-block btn-lg" style={{ marginTop: 8 }}>
              <Lock size={18} /> Đăng Nhập
            </button>
            <div style={{ textAlign: 'center', marginTop: 20, fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Chưa có tài khoản? </span>
              <button type="button" onClick={() => switchView('register')} style={{ background: 'none', border: 'none', color: 'var(--accent-primary-light)', fontWeight: 600, cursor: 'pointer' }}>
                Đăng kí ngay
              </button>
            </div>
          </form>
        )}

        {view === 'register' && (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label>Tên Đầy Đủ</label>
              <input type="text" className="form-control" placeholder="Nhập họ và tên" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Tên Đăng Nhập</label>
              <input type="text" className="form-control" placeholder="Nhập tên đăng nhập mong muốn" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Mật Khẩu</label>
              <input type={showPassword ? 'text' : 'password'} className="form-control" placeholder="Tạo mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Xác Nhận Mật Khẩu</label>
              <input type={showPassword ? 'text' : 'password'} className="form-control" placeholder="Nhập lại mật khẩu" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-success btn-block btn-lg" style={{ marginTop: 16 }}>
              Tạo Tài Khoản
            </button>
            <div style={{ textAlign: 'center', marginTop: 20, fontSize: '0.9rem' }}>
              <button type="button" onClick={() => switchView('login')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                ← Quay lại đăng nhập
              </button>
            </div>
          </form>
        )}

        {view === 'forgot' && (
          <form onSubmit={handleForgot}>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 20 }}>
              Sử dụng tên đăng nhập của hệ thống để đặt lại mật khẩu mới
            </p>
            <div className="form-group">
              <label>Tên Đăng Nhập Hiện Tại</label>
              <input type="text" className="form-control" placeholder="Nhập tên đăng nhập của bạn" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Mật Khẩu Mới</label>
              <input type={showPassword ? 'text' : 'password'} className="form-control" placeholder="Nhập mật khẩu mới" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Xác Nhận Mật Khẩu Mới</label>
              <input type={showPassword ? 'text' : 'password'} className="form-control" placeholder="Nhập lại mật khẩu mới" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary btn-block btn-lg" style={{ marginTop: 16 }}>
              Đặt Lại Mật Khẩu
            </button>
            <div style={{ textAlign: 'center', marginTop: 20, fontSize: '0.9rem' }}>
              <button type="button" onClick={() => switchView('login')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                ← Quay lại đăng nhập
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function AppContent() {
  const { user } = useAuth();
  const { orders } = useData();
  const [activePage, setActivePage] = useState(() => {
    if (!user) return 'dashboard';
    return (user.role === 'admin' || user.role === 'manager') ? 'dashboard' : 'employee-order';
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const notificationCount = useMemo(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) return 0;
    let count = 0;
    orders.forEach(order => { order.notifications?.forEach(n => { if (!n.read) count++; }); });
    return count;
  }, [orders, user]);

  if (!user) return <LoginPage />;

  const renderPage = () => {
    if (user.role === 'admin' || user.role === 'manager') {
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
        case 'profile': return <UserProfile />;
        default: return <Dashboard />;
      }
    } else {
      switch (activePage) {
        case 'employee-order': return <EmployeeOrder />;
        case 'order-history': return <OrderHistory />;
        case 'employee-attendance': return <EmployeeAttendance />;
        case 'my-salary': return <MySalary />;
        case 'profile': return <UserProfile />;
        default: return <EmployeeOrder />;
      }
    }
  };

  const getPageTitle = (page) => {
    const titles = {
      'dashboard': 'Tổng Quan',
      'employees': 'Nhân Viên',
      'salary': 'Bảng Lương',
      'attendance': 'Chấm Công',
      'inventory': 'Nguồn Hàng',
      'finance': 'Thu Chi',
      'tables': 'Số Bàn',
      'products': 'Sản Phẩm',
      'orders': 'Order Món',
      'order-history': 'Lịch Sử',
      'notifications': 'Thông Báo',
      'profile': 'Hồ Sơ',
      'employee-order': 'Order Món',
      'employee-attendance': 'Chấm Công',
      'my-salary': 'Bảng Lương'
    };
    return titles[page] || 'Tiệm Trà 9PM';
  };

  return (
    <div className="app-layout">
      {/* Mobile Top Header */}
      <div className="mobile-header">
        <button className="mobile-menu-btn" onClick={() => setIsMobileSidebarOpen(true)}>
          <Menu size={24} />
        </button>
        <div className="mobile-title">{getPageTitle(activePage)}</div>
        <div style={{ width: 24 }}></div> {/* Spacer for centering */}
      </div>

      <Sidebar 
        activePage={activePage} 
        onNavigate={setActivePage} 
        notificationCount={notificationCount} 
        isOpen={isMobileSidebarOpen}
        onToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      />
      
      <main className="main-content">
        {renderPage()}
      </main>
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
