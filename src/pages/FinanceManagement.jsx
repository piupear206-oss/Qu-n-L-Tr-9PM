import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import Modal from '../components/Modal';
import { DollarSign, Plus, Trash2, TrendingUp, TrendingDown, Search } from 'lucide-react';

export default function FinanceManagement() {
  const { finance, addFinanceRecord, deleteFinanceRecord } = useData();
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ type: 'income', category: '', amount: '', note: '', date: new Date().toISOString().split('T')[0] });

  const filteredRecords = finance.filter(r => {
    const matchType = filter === 'all' || r.type === filter;
    const matchSearch = !search || r.category?.toLowerCase().includes(search.toLowerCase()) || r.note?.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  }).sort((a, b) => (b.date || b.createdAt || '').localeCompare(a.date || a.createdAt || ''));

  const totalIncome = useMemo(() => finance.filter(f => f.type === 'income').reduce((s, f) => s + Number(f.amount), 0), [finance]);
  const totalExpense = useMemo(() => finance.filter(f => f.type === 'expense').reduce((s, f) => s + Number(f.amount), 0), [finance]);
  const profit = totalIncome - totalExpense;

  const formatMoney = (n) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.amount || !form.category) return;
    addFinanceRecord(form);
    setShowModal(false);
    setForm({ type: 'income', category: '', amount: '', note: '', date: new Date().toISOString().split('T')[0] });
  };

  const handleDelete = (id) => {
    if (window.confirm('Xóa bản ghi này?')) deleteFinanceRecord(id);
  };

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <h1>💵 Quản Lí Thu Chi</h1>
        <p>Ghi nhận và theo dõi các khoản thu chi hàng ngày</p>
      </div>

      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-icon green"><TrendingUp size={24} /></div>
          <div className="stat-info">
            <div className="label">Tổng Thu</div>
            <div className="value text-success">{formatMoney(totalIncome)}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><TrendingDown size={24} /></div>
          <div className="stat-info">
            <div className="label">Tổng Chi</div>
            <div className="value text-danger">{formatMoney(totalExpense)}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><DollarSign size={24} /></div>
          <div className="stat-info">
            <div className="label">Lợi Nhuận</div>
            <div className="value" style={{ color: profit >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
              {profit >= 0 ? '+' : ''}{formatMoney(profit)}
            </div>
          </div>
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-input">
            <Search size={16} />
            <input type="text" className="form-control" placeholder="Tìm kiếm..." value={search}
              onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 36, width: 220 }} />
          </div>
          <div className="btn-group">
            {['all', 'income', 'expense'].map(f => (
              <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setFilter(f)}>
                {f === 'all' ? 'Tất cả' : f === 'income' ? '📈 Thu' : '📉 Chi'}
              </button>
            ))}
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Thêm Bản Ghi
        </button>
      </div>

      {filteredRecords.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <DollarSign size={48} />
            <p>Chưa có bản ghi thu chi nào</p>
          </div>
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ngày</th>
                <th>Loại</th>
                <th>Danh Mục</th>
                <th>Số Tiền</th>
                <th>Ghi Chú</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map(record => (
                <tr key={record.id}>
                  <td>{record.date ? new Date(record.date).toLocaleDateString('vi-VN') : '-'}</td>
                  <td>
                    <span className={`badge ${record.type === 'income' ? 'badge-success' : 'badge-danger'}`}>
                      {record.type === 'income' ? '📈 Thu' : '📉 Chi'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{record.category}</td>
                  <td style={{ color: record.type === 'income' ? 'var(--accent-success)' : 'var(--accent-danger)', fontWeight: 600 }}>
                    {record.type === 'income' ? '+' : '-'}{formatMoney(Number(record.amount))}
                  </td>
                  <td className="text-muted">{record.note || '-'}</td>
                  <td>
                    <button className="btn btn-ghost btn-sm text-danger" onClick={() => handleDelete(record.id)}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Thêm Bản Ghi Thu/Chi"
        footer={<>
          <button className="btn btn-outline" onClick={() => setShowModal(false)}>Hủy</button>
          <button className="btn btn-primary" onClick={handleSubmit}>Lưu</button>
        </>}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Loại *</label>
            <div className="btn-group">
              <button type="button" className={`btn ${form.type === 'income' ? 'btn-success' : 'btn-outline'}`}
                onClick={() => setForm({ ...form, type: 'income' })}>📈 Thu</button>
              <button type="button" className={`btn ${form.type === 'expense' ? 'btn-danger' : 'btn-outline'}`}
                onClick={() => setForm({ ...form, type: 'expense' })}>📉 Chi</button>
            </div>
          </div>
          <div className="form-group">
            <label>Ngày</label>
            <input type="date" className="form-control" value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Danh Mục *</label>
            <select className="form-control" value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })} required>
              <option value="">Chọn danh mục</option>
              {form.type === 'income' ? (
                <>
                  <option value="Bán hàng">Bán hàng</option>
                  <option value="Dịch vụ">Dịch vụ</option>
                  <option value="Khác">Khác</option>
                </>
              ) : (
                <>
                  <option value="Nguyên liệu">Nguyên liệu</option>
                  <option value="Lương nhân viên">Lương nhân viên</option>
                  <option value="Điện nước">Điện nước</option>
                  <option value="Thuê mặt bằng">Thuê mặt bằng</option>
                  <option value="Thiết bị">Thiết bị</option>
                  <option value="Khác">Khác</option>
                </>
              )}
            </select>
          </div>
          <div className="form-group">
            <label>Số Tiền (VNĐ) *</label>
            <input type="number" className="form-control" placeholder="0" value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Ghi Chú</label>
            <textarea className="form-control" placeholder="Ghi chú thêm..." value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </div>
        </form>
      </Modal>
    </div>
  );
}
