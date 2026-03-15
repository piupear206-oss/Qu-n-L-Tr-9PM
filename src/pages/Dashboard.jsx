import React, { useMemo, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { DollarSign, ShoppingCart, Users, Armchair, TrendingUp, TrendingDown, Calendar, BarChart3 } from 'lucide-react';

export default function Dashboard() {
  const { orders, employees, tables, finance } = useData();
  const [revenueTab, setRevenueTab] = useState('today');
  const formatMoney = (n) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

  const now = new Date();
  const todayStr = now.toDateString();

  // Get start of week (Monday)
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  startOfWeek.setHours(0, 0, 0, 0);

  // Get start of month
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Get start of year
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const paidOrders = orders.filter(o => o.status === 'paid');

  const revenueData = useMemo(() => {
    const todayOrders = paidOrders.filter(o => new Date(o.createdAt).toDateString() === todayStr);
    const weekOrders = paidOrders.filter(o => new Date(o.createdAt) >= startOfWeek);
    const monthOrders = paidOrders.filter(o => new Date(o.createdAt) >= startOfMonth);
    const yearOrders = paidOrders.filter(o => new Date(o.createdAt) >= startOfYear);

    return {
      today: { count: todayOrders.length, total: todayOrders.reduce((s, o) => s + (o.total || 0), 0) },
      week: { count: weekOrders.length, total: weekOrders.reduce((s, o) => s + (o.total || 0), 0) },
      month: { count: monthOrders.length, total: monthOrders.reduce((s, o) => s + (o.total || 0), 0) },
      year: { count: yearOrders.length, total: yearOrders.reduce((s, o) => s + (o.total || 0), 0) },
    };
  }, [paidOrders]);

  const todayAllOrders = orders.filter(o => new Date(o.createdAt).toDateString() === todayStr);
  const occupiedTables = tables.filter(t => t.status === 'occupied').length;

  // Finance summary
  const totalIncome = finance.filter(f => f.type === 'income').reduce((s, f) => s + Number(f.amount || 0), 0);
  const totalExpense = finance.filter(f => f.type === 'expense').reduce((s, f) => s + Number(f.amount || 0), 0);

  // Recent paid orders
  const recentOrders = orders
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 8);

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <h1>📊 Dashboard</h1>
        <p>Tổng quan hoạt động Tiệm Trà 9PM hôm nay</p>
      </div>

      {/* Stat Cards */}
      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-icon purple"><DollarSign size={24} /></div>
          <div className="stat-info">
            <div className="label">Doanh Thu Hôm Nay</div>
            <div className="value text-success">{formatMoney(revenueData.today.total)}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon cyan"><ShoppingCart size={24} /></div>
          <div className="stat-info">
            <div className="label">Đơn Hôm Nay</div>
            <div className="value">{todayAllOrders.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><Users size={24} /></div>
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
          <div className="stat-icon green"><TrendingUp size={24} /></div>
          <div className="stat-info">
            <div className="label">Tổng Thu</div>
            <div className="value text-success">{formatMoney(totalIncome + revenueData.year.total)}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><TrendingDown size={24} /></div>
          <div className="stat-info">
            <div className="label">Tổng Chi</div>
            <div className="value text-danger">{formatMoney(totalExpense)}</div>
          </div>
        </div>
      </div>

      {/* Revenue Summary Tabs */}
      <div className="card mb-2">
        <div className="flex-between" style={{ marginBottom: 16 }}>
          <h3><BarChart3 size={20} style={{ verticalAlign: 'middle', marginRight: 8 }} />Tổng Kết Doanh Thu</h3>
          <div className="btn-group">
            {[
              { key: 'today', label: 'Hôm Nay' },
              { key: 'week', label: 'Tuần' },
              { key: 'month', label: 'Tháng' },
              { key: 'year', label: 'Năm' },
            ].map(tab => (
              <button key={tab.key}
                className={`btn btn-sm ${revenueTab === tab.key ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setRevenueTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <div className="card" style={{ padding: 16, textAlign: 'center', borderColor: revenueTab === 'today' ? 'var(--accent-primary)' : undefined }}>
            <div className="text-muted" style={{ fontSize: '0.8rem', marginBottom: 4 }}>📅 Hôm Nay</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-success)' }}>{formatMoney(revenueData.today.total)}</div>
            <div className="text-muted" style={{ fontSize: '0.75rem' }}>{revenueData.today.count} đơn đã TT</div>
          </div>
          <div className="card" style={{ padding: 16, textAlign: 'center', borderColor: revenueTab === 'week' ? 'var(--accent-primary)' : undefined }}>
            <div className="text-muted" style={{ fontSize: '0.8rem', marginBottom: 4 }}>📆 Tuần Này</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-success)' }}>{formatMoney(revenueData.week.total)}</div>
            <div className="text-muted" style={{ fontSize: '0.75rem' }}>{revenueData.week.count} đơn đã TT</div>
          </div>
          <div className="card" style={{ padding: 16, textAlign: 'center', borderColor: revenueTab === 'month' ? 'var(--accent-primary)' : undefined }}>
            <div className="text-muted" style={{ fontSize: '0.8rem', marginBottom: 4 }}>🗓️ Tháng Này</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-success)' }}>{formatMoney(revenueData.month.total)}</div>
            <div className="text-muted" style={{ fontSize: '0.75rem' }}>{revenueData.month.count} đơn đã TT</div>
          </div>
          <div className="card" style={{ padding: 16, textAlign: 'center', borderColor: revenueTab === 'year' ? 'var(--accent-primary)' : undefined }}>
            <div className="text-muted" style={{ fontSize: '0.8rem', marginBottom: 4 }}>📊 Năm Nay</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-success)' }}>{formatMoney(revenueData.year.total)}</div>
            <div className="text-muted" style={{ fontSize: '0.75rem' }}>{revenueData.year.count} đơn đã TT</div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card">
        <h3 style={{ marginBottom: 16 }}>📦 Đơn Hàng Gần Đây</h3>
        {recentOrders.length === 0 ? (
          <div className="empty-state"><ShoppingCart size={48} /><p>Chưa có đơn hàng nào</p></div>
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
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>#{order.id?.slice(-6).toUpperCase()}</td>
                    <td>{order.tableName || '-'}</td>
                    <td>{order.items?.length || 0} món</td>
                    <td className="text-accent" style={{ fontWeight: 600 }}>{formatMoney(order.total || 0)}</td>
                    <td>
                      <span className={`badge ${order.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                        {order.status === 'paid' ? '✅ Đã TT' : '⏳ Chờ TT'}
                      </span>
                    </td>
                    <td className="text-muted" style={{ fontSize: '0.85rem' }}>
                      {new Date(order.createdAt).toLocaleString('vi-VN')}
                    </td>
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
