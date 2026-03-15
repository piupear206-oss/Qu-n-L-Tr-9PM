import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import Modal from '../components/Modal';
import { Armchair, Plus, Edit2, Trash2 } from 'lucide-react';

export default function TableManagement() {
  const { tables, addTable, updateTable, deleteTable } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [form, setForm] = useState({ name: '' });

  const openAdd = () => {
    setEditingTable(null);
    setForm({ name: `Bàn ${tables.length + 1}` });
    setShowModal(true);
  };

  const openEdit = (table) => {
    setEditingTable(table);
    setForm({ name: table.name });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (editingTable) {
      updateTable(editingTable.id, form);
    } else {
      addTable(form);
    }
    setShowModal(false);
  };

  const toggleStatus = (table) => {
    updateTable(table.id, {
      status: table.status === 'available' ? 'occupied' : 'available'
    });
  };

  const handleDelete = (id) => {
    if (window.confirm('Xóa bàn này?')) deleteTable(id);
  };

  const available = tables.filter(t => t.status === 'available').length;
  const occupied = tables.filter(t => t.status === 'occupied').length;

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <h1>🪑 Quản Lí Số Bàn</h1>
        <p>Quản lí và theo dõi trạng thái các bàn</p>
      </div>

      <div className="stat-cards" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-icon cyan"><Armchair size={24} /></div>
          <div className="stat-info">
            <div className="label">Tổng Số Bàn</div>
            <div className="value">{tables.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><Armchair size={24} /></div>
          <div className="stat-info">
            <div className="label">Bàn Trống</div>
            <div className="value text-success">{available}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><Armchair size={24} /></div>
          <div className="stat-info">
            <div className="label">Đang Dùng</div>
            <div className="value text-danger">{occupied}</div>
          </div>
        </div>
      </div>

      <div className="toolbar">
        <div />
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={18} /> Thêm Bàn
        </button>
      </div>

      <div className="table-grid">
        {tables.map((table) => (
          <div
            key={table.id}
            className={`table-item ${table.status}`}
            onClick={() => toggleStatus(table)}
          >
            <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4 }}>
              <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); openEdit(table); }}
                style={{ padding: 4 }}>
                <Edit2 size={14} />
              </button>
              <button className="btn btn-ghost btn-sm text-danger" onClick={(e) => { e.stopPropagation(); handleDelete(table.id); }}
                style={{ padding: 4 }}>
                <Trash2 size={14} />
              </button>
            </div>
            <Armchair size={32} style={{
              color: table.status === 'available' ? 'var(--accent-success)' : 'var(--accent-danger)'
            }} />
            <div className="table-number">{table.name}</div>
            <div className="table-status" style={{
              color: table.status === 'available' ? 'var(--accent-success)' : 'var(--accent-danger)'
            }}>
              {table.status === 'available' ? 'Trống' : 'Đang dùng'}
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}
        title={editingTable ? 'Sửa Bàn' : 'Thêm Bàn Mới'}
        footer={<>
          <button className="btn btn-outline" onClick={() => setShowModal(false)}>Hủy</button>
          <button className="btn btn-primary" onClick={handleSubmit}>{editingTable ? 'Cập Nhật' : 'Thêm'}</button>
        </>}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Tên Bàn *</label>
            <input type="text" className="form-control" placeholder="VD: Bàn 1, VIP, Sân Vườn..."
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
        </form>
      </Modal>
    </div>
  );
}
