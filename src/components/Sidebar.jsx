import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, Users, Package, DollarSign, Armchair,
  ShoppingCart, Coffee, ClipboardList, Camera, Calculator,
  LogOut, Bell, User, X
} from 'lucide-react';

const adminNav = [
  { section: 'Tổng Quan', items: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ]},
  { section: 'Bán Hàng', items: [
    { id: 'products', label: 'Sản Phẩm', icon: Coffee },
    { id: 'orders', label: 'Order Món', icon: ShoppingCart },
    { id: 'order-history', label: 'Lịch Sử Order', icon: ClipboardList },
    { id: 'notifications', label: 'Thông Báo', icon: Bell },
  ]},
  { section: 'Quản Lí', items: [
    { id: 'employees', label: 'Nhân Viên', icon: Users },
    { id: 'salary', label: 'Bảng Lương', icon: Calculator },
    { id: 'attendance', label: 'Chấm Công', icon: Camera },
    { id: 'inventory', label: 'Nguồn Hàng', icon: Package },
    { id: 'finance', label: 'Thu Chi', icon: DollarSign },
    { id: 'tables', label: 'Số Bàn', icon: Armchair },
  ]},
  { section: 'Cá Nhân', items: [
    { id: 'profile', label: 'Hồ Sơ', icon: User },
  ]},
];

const employeeNav = [
  { section: 'Bán Hàng', items: [
    { id: 'employee-order', label: 'Order Món', icon: ShoppingCart },
    { id: 'order-history', label: 'Lịch Sử / In Bill', icon: ClipboardList },
  ]},
  { section: 'Cá Nhân', items: [
    { id: 'employee-attendance', label: 'Chấm Công', icon: Camera },
    { id: 'my-salary', label: 'Bảng Lương', icon: Calculator },
    { id: 'profile', label: 'Hồ Sơ', icon: User },
  ]},
];

export default function Sidebar({ activePage, onNavigate, notificationCount = 0, isOpen, onToggle }) {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';
  const navItems = isAdmin ? adminNav : employeeNav;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={onToggle}
        />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-icon">🍵</div>
          <div className="logo-text">
            <h2>Tiệm Trà 9PM</h2>
            <p>{isAdmin ? 'Quản Trị Viên' : 'Nhân Viên'}</p>
          </div>
          <button className="mobile-close-btn" onClick={onToggle}>
            <X size={24} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((section) => (
            <div key={section.section} className="sidebar-section">
              <div className="sidebar-section-title">{section.section}</div>
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                    onClick={() => {
                      onNavigate(item.id);
                      if (window.innerWidth <= 768) {
                        onToggle();
                      }
                    }}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                    {item.id === 'notifications' && notificationCount > 0 && (
                      <span className="badge badge-danger" style={{
                        marginLeft: 'auto', minWidth: 22, textAlign: 'center',
                        animation: 'pulse 1.5s infinite'
                      }}>
                        {notificationCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user" onClick={logout}>
            <div className="avatar">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="user-info">
              <div className="name">{user?.name || 'User'}</div>
              <div className="role">{isAdmin ? 'Quản Trị Viên' : 'Nhân Viên'}</div>
            </div>
            <LogOut size={18} style={{ color: 'var(--text-muted)' }} />
          </div>
        </div>
      </aside>
    </>
  );
}
