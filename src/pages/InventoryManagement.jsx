import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import Modal from '../components/Modal';
import { Package, Plus, Edit2, Trash2, Search, AlertTriangle } from 'lucide-react';

export default function InventoryManagement() {
  const { inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', quantity: '', unit: '', costPrice: '', note: '' });

  const filteredItems = inventory.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditingItem(null);
    setForm({ name: '', quantity: '', unit: 'kg', costPrice: '', note: '' });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setForm({ name: item.name, quantity: item.quantity, unit: item.unit, costPrice: item.costPrice, note: item.note || '' });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (editingItem) {
      updateInventoryItem(editingItem.id, form);
    } else {
      addInventoryItem(form);
    }
    setShowModal(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Xóa nguyên liệu này?')) deleteInventoryItem(id);
  };

  const formatMoney = (n) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <h1>📦 Quản Lí Nguồn Hàng</h1>
        <p>Quản lí nguyên liệu, hàng hóa nhập kho</p>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-input">
            <Search size={16} />
            <input type="text" className="form-control" placeholder="Tìm nguyên liệu..." value={search}
              onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 36, width: 260 }} />
          </div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={18} /> Thêm Nguyên Liệu
        </button>
      </div>

      {filteredItems.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Package size={48} />
            <p>Chưa có nguyên liệu nào. Hãy thêm mới!</p>
          </div>
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Tên Nguyên Liệu</th>
                <th>Số Lượng</th>
                <th>Đơn Vị</th>
                <th>Giá Nhập</th>
                <th>Trạng Thái</th>
                <th>Ghi Chú</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item, i) => (
                <tr key={item.id}>
                  <td>{i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{item.name}</td>
                  <td>{item.quantity}</td>
                  <td>{item.unit}</td>
                  <td className="text-accent">{item.costPrice ? formatMoney(Number(item.costPrice)) : '-'}</td>
                  <td>
                    {Number(item.quantity) <= 5 ? (
                      <span className="badge badge-danger"><AlertTriangle size={12} style={{ marginRight: 4 }} />Sắp hết</span>
                    ) : (
                      <span className="badge badge-success">Còn hàng</span>
                    )}
                  </td>
                  <td className="text-muted">{item.note || '-'}</td>
                  <td>
                    <div className="btn-group">
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(item)}><Edit2 size={16} /></button>
                      <button className="btn btn-ghost btn-sm text-danger" onClick={() => handleDelete(item.id)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}
        title={editingItem ? 'Sửa Nguyên Liệu' : 'Thêm Nguyên Liệu Mới'}
        footer={<>
          <button className="btn btn-outline" onClick={() => setShowModal(false)}>Hủy</button>
          <button className="btn btn-primary" onClick={handleSubmit}>{editingItem ? 'Cập Nhật' : 'Thêm'}</button>
        </>}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Tên Nguyên Liệu *</label>
            <input type="text" className="form-control" placeholder="VD: Trà đen, Sữa tươi..."
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Số Lượng</label>
              <input type="number" className="form-control" placeholder="0"
                value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Đơn Vị</label>
              <select className="form-control" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                <option value="kg">Kg</option>
                <option value="g">Gram</option>
                <option value="l">Lít</option>
                <option value="ml">ML</option>
                <option value="gói">Gói</option>
                <option value="hộp">Hộp</option>
                <option value="cái">Cái</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Giá Nhập (VNĐ)</label>
            <input type="number" className="form-control" placeholder="0"
              value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Ghi Chú</label>
            <textarea className="form-control" placeholder="Ghi chú thêm..."
              value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </div>
        </form>
      </Modal>
    </div>
  );
}
