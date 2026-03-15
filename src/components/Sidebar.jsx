import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, Users, Package, DollarSign, Armchair,
  ShoppingCart, Coffee, ClipboardList, Camera, Calculator,
  LogOut
} from 'lucide-react';

const navItems = [
  { section: 'Tổng Quan', items: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ]},
  { section: 'Quản Lí', items: [
    { id: 'employees', label: 'Nhân Viên', icon: Users },
    { id: 'salary', label: 'Bảng Lương', icon: Calculator, adminOnly: true },
    { id: 'attendance', label: 'Chấm Công', icon: Camera, adminOnly: true },
    { id: 'inventory', label: 'Nguồn Hàng', icon: Package },
    { id: 'finance', label: 'Thu Chi', icon: DollarSign },
    { id: 'tables', label: 'Số Bàn', icon: Armchair },
  ]},
  { section: 'Bán Hàng', items: [
    { id: 'products', label: 'Sản Phẩm', icon: Coffee },
    { id: 'orders', label: 'Order Món', icon: ShoppingCart },
    { id: 'order-history', label: 'Lịch Sử Order', icon: ClipboardList },
  ]},
];

export default function Sidebar({ activePage, onNavigate }) {
  const { user, logout, isAdmin } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-icon">🍵</div>
        <div className="logo-text">
          <h2>Tiệm Trà 9PM</h2>
          <p>Hệ Thống Quản Lí</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((section) => (
          <div key={section.section} className="sidebar-section">
            <div className="sidebar-section-title">{section.section}</div>
            {section.items.map((item) => {
              if (item.adminOnly && !isAdmin()) return null;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                  onClick={() => onNavigate(item.id)}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
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
            <div className="name">{user?.name || 'Admin'}</div>
            <div className="role">{user?.role === 'admin' ? 'Quản Trị Viên' : 'Nhân Viên'}</div>
          </div>
          <LogOut size={18} style={{ color: 'var(--text-muted)' }} />
        </div>
      </div>
    </aside>
  );
}
