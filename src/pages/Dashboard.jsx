import React from 'react';
import { useData } from '../contexts/DataContext';
import { DollarSign, ShoppingCart, Users, Armchair, TrendingUp, Package } from 'lucide-react';

export default function Dashboard() {
  const { employees, orders, tables, inventory, finance, getTodayOrders, getTodayRevenue } = useData();

  const todayOrders = getTodayOrders();
  const todayRevenue = getTodayRevenue();
  const occupiedTables = tables.filter(t => t.status === 'occupied').length;
  const totalFinanceIncome = finance.filter(f => f.type === 'income').reduce((s, f) => s + Number(f.amount), 0);
  const totalFinanceExpense = finance.filter(f => f.type === 'expense').reduce((s, f) => s + Number(f.amount), 0);

  const formatMoney = (n) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

  const recentOrders = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <h1>📊 Dashboard</h1>
        <p>Tổng quan hoạt động Tiệm Trà 9PM hôm nay</p>
      </div>

      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-icon green"><DollarSign size={24} /></div>
          <div className="stat-info">
            <div className="label">Doanh Thu Hôm Nay</div>
            <div className="value text-success">{formatMoney(todayRevenue)}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><ShoppingCart size={24} /></div>
          <div className="stat-info">
            <div className="label">Đơn Hôm Nay</div>
            <div className="value">{todayOrders.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon cyan"><Users size={24} /></div>
          <div className="stat-info">
            <div className="label">Nhân Viên</div>
            <div className="value">{employees.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><Armchair size={24} /></div>
          <div className="stat-info">
            <div className="label">Bàn Đang Dùng</div>
            <div className="value">{occupiedTables}/{tables.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><TrendingUp size={24} /></div>
          <div className="stat-info">
            <div className="label">Tổng Thu</div>
            <div className="value text-success">{formatMoney(totalFinanceIncome)}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><Package size={24} /></div>
          <div className="stat-info">
            <div className="label">Tổng Chi</div>
            <div className="value text-danger">{formatMoney(totalFinanceExpense)}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>📋 Đơn Hàng Gần Đây</h3>
        {recentOrders.length === 0 ? (
          <div className="empty-state">
            <ShoppingCart size={48} />
            <p>Chưa có đơn hàng nào</p>
          </div>
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mã Đơn</th>
                  <th>Bàn</th>
                  <th>Số Món</th>
                  <th>Tổng Tiền</th>
                  <th>Trạng Thái</th>
                  <th>Thời Gian</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order.id}>
                    <td style={{ fontWeight: 600 }}>#{order.id.slice(-6).toUpperCase()}</td>
                    <td>{order.tableName || 'Mang đi'}</td>
                    <td>{order.items?.length || 0} món</td>
                    <td className="text-accent">{formatMoney(order.total || 0)}</td>
                    <td>
                      <span className={`badge ${order.status === 'paid' ? 'badge-success' : order.status === 'pending' ? 'badge-warning' : 'badge-info'}`}>
                        {order.status === 'paid' ? 'Đã thanh toán' : order.status === 'pending' ? 'Chờ xử lý' : order.status}
                      </span>
                    </td>
                    <td className="text-muted">{new Date(order.createdAt).toLocaleString('vi-VN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
