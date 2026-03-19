import React, { useMemo, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { DollarSign, ShoppingCart, Users, Armchair, TrendingUp, TrendingDown, Calendar, BarChart3, Award, Download } from 'lucide-react';

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

  const [customStartDate, setCustomStartDate] = useState(todayStr.slice(0, 10)); // just some default, we'll use actual Date below
  const [customEndDate, setCustomEndDate] = useState(todayStr.slice(0, 10));

  const revenueData = useMemo(() => {
    const todayOrders = paidOrders.filter(o => new Date(o.createdAt).toDateString() === todayStr);
    const weekOrders = paidOrders.filter(o => new Date(o.createdAt) >= startOfWeek);
    const monthOrders = paidOrders.filter(o => new Date(o.createdAt) >= startOfMonth);
    const yearOrders = paidOrders.filter(o => new Date(o.createdAt) >= startOfYear);

    const startObj = new Date(customStartDate);
    startObj.setHours(0, 0, 0, 0);
    const endObj = new Date(customEndDate);
    endObj.setHours(23, 59, 59, 999);
    
    const customOrders = paidOrders.filter(o => {
      const d = new Date(o.createdAt);
      return d >= startObj && d <= endObj;
    });

    return {
      today: { count: todayOrders.length, total: todayOrders.reduce((s, o) => s + (o.total || 0), 0) },
      week: { count: weekOrders.length, total: weekOrders.reduce((s, o) => s + (o.total || 0), 0) },
      month: { count: monthOrders.length, total: monthOrders.reduce((s, o) => s + (o.total || 0), 0) },
      year: { count: yearOrders.length, total: yearOrders.reduce((s, o) => s + (o.total || 0), 0) },
      custom: { count: customOrders.length, total: customOrders.reduce((s, o) => s + (o.total || 0), 0) }
    };
  }, [paidOrders, customStartDate, customEndDate, todayStr, startOfWeek, startOfMonth, startOfYear]);

  const todayAllOrders = orders.filter(o => new Date(o.createdAt).toDateString() === todayStr);
  const occupiedTables = tables.filter(t => t.status === 'occupied').length;

  const topProducts = useMemo(() => {
    const productCounts = {};
    paidOrders.forEach(order => {
      (order.items || []).forEach(item => {
        if (!productCounts[item.id]) {
          productCounts[item.id] = { name: item.name, qty: 0, revenue: 0 };
        }
        productCounts[item.id].qty += item.qty;
        productCounts[item.id].revenue += item.qty * item.price;
      });
    });
    return Object.values(productCounts).sort((a, b) => b.qty - a.qty).slice(0, 10);
  }, [paidOrders]);

  const exportReport = () => {
    const csvRows = ['Tên Món,Đã Bán (ly),Doanh Thu (VNĐ)'];
    topProducts.forEach(p => {
      csvRows.push(`"${p.name}",${p.qty},${p.revenue}`);
    });
    const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bao_Cao_Mon_Ban_Chay_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

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
              { key: 'custom', label: 'Tùy Chọn' },
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

        {revenueTab === 'custom' && (
          <div style={{ display: 'flex', gap: 16, marginBottom: 16, background: 'var(--bg-lighter)', padding: 16, borderRadius: 12, alignItems: 'flex-end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Từ Ngày</label>
              <input type="date" className="form-control" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Đến Ngày</label>
              <input type="date" className="form-control" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} />
            </div>
            <div style={{ padding: '0 16px', borderLeft: '1px solid var(--border-color)', marginLeft: 8 }}>
              <div className="text-muted" style={{ fontSize: '0.8rem', marginBottom: 4 }}>Tổng Doanh Thu Lựa Chọn</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-success)' }}>{formatMoney(revenueData.custom.total)}</div>
              <div className="text-muted" style={{ fontSize: '0.85rem' }}>{revenueData.custom.count} đơn đã TT</div>
            </div>
          </div>
        )}

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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Top Products */}
        <div className="card">
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}><Award size={20} style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--accent-warning)' }} />Món Bán Chạy Nhất</h3>
            <button className="btn btn-outline btn-sm" onClick={exportReport}>
              <Download size={16} /> Xuất Báo Cáo
            </button>
          </div>
          {topProducts.length === 0 ? (
            <div className="empty-state"><Award size={48} /><p>Chưa có dữ liệu bán hàng</p></div>
          ) : (
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tên Món</th>
                    <th>Đã Bán</th>
                    <th>Doanh Thu</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>
                        {i === 0 && '🥇 '}
                        {i === 1 && '🥈 '}
                        {i === 2 && '🥉 '}
                        {p.name}
                      </td>
                      <td><span className="badge badge-success">{p.qty} ly</span></td>
                      <td className="text-accent">{formatMoney(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
    </div>
  );
}
