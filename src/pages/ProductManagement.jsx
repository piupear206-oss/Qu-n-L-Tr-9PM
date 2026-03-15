import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import Modal from '../components/Modal';
import { Coffee, Plus, Edit2, Trash2, Search } from 'lucide-react';

export default function ProductManagement() {
  const { products, categories, addProduct, updateProduct, deleteProduct } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [form, setForm] = useState({ name: '', price: '', categoryId: '', emoji: '🧋', description: '' });

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !filterCategory || p.categoryId === filterCategory;
    return matchSearch && matchCategory;
  });

  const openAdd = () => {
    setEditingProduct(null);
    setForm({ name: '', price: '', categoryId: categories[0]?.id || '', emoji: '🧋', description: '' });
    setShowModal(true);
  };

  const openEdit = (prod) => {
    setEditingProduct(prod);
    setForm({ name: prod.name, price: prod.price, categoryId: prod.categoryId, emoji: prod.emoji || '🧋', description: prod.description || '' });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price) return;
    const data = { ...form, price: Number(form.price) };
    if (editingProduct) {
      updateProduct(editingProduct.id, data);
    } else {
      addProduct(data);
    }
    setShowModal(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Xóa sản phẩm này?')) deleteProduct(id);
  };

  const getCategoryName = (id) => categories.find(c => c.id === id)?.name || '';
  const formatMoney = (n) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

  const emojiOptions = ['🧋', '🍵', '☕', '🍊', '🍑', '🍋', '🫐', '🍓', '🥑', '🧊', '🍫', '🥥', '⚫', '🍟', '🥟', '🍿', '🧁', '🍰', '🥤', '🍹'];

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <h1>🧋 Quản Lí Sản Phẩm</h1>
        <p>Thêm, sửa, xóa sản phẩm trong menu</p>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-input">
            <Search size={16} />
            <input type="text" className="form-control" placeholder="Tìm sản phẩm..." value={search}
              onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 36, width: 220 }} />
          </div>
          <select className="form-control" value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)} style={{ width: 160 }}>
            <option value="">Tất cả danh mục</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={18} /> Thêm Sản Phẩm
        </button>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Coffee size={48} />
            <p>Không tìm thấy sản phẩm nào</p>
          </div>
        </div>
      ) : (
        <div className="product-grid">
          {filteredProducts.map(prod => (
            <div key={prod.id} className="product-card" style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(prod)} style={{ padding: 4 }}>
                  <Edit2 size={14} />
                </button>
                <button className="btn btn-ghost btn-sm text-danger" onClick={() => handleDelete(prod.id)} style={{ padding: 4 }}>
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="product-emoji">{prod.emoji || '🧋'}</div>
              <div className="product-name">{prod.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                {getCategoryName(prod.categoryId)}
              </div>
              <div className="product-price">{formatMoney(prod.price)}</div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}
        title={editingProduct ? 'Sửa Sản Phẩm' : 'Thêm Sản Phẩm Mới'}
        footer={<>
          <button className="btn btn-outline" onClick={() => setShowModal(false)}>Hủy</button>
          <button className="btn btn-primary" onClick={handleSubmit}>{editingProduct ? 'Cập Nhật' : 'Thêm'}</button>
        </>}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Icon Sản Phẩm</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {emojiOptions.map(e => (
                <button key={e} type="button" onClick={() => setForm({ ...form, emoji: e })}
                  style={{
                    fontSize: '1.5rem', padding: '6px 8px', background: form.emoji === e ? 'rgba(124,58,237,0.2)' : 'transparent',
                    border: form.emoji === e ? '2px solid var(--accent-primary)' : '2px solid transparent',
                    borderRadius: 8, cursor: 'pointer', transition: '0.15s'
                  }}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>Tên Sản Phẩm *</label>
            <input type="text" className="form-control" placeholder="VD: Trà Sữa Trân Châu"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Giá (VNĐ) *</label>
              <input type="number" className="form-control" placeholder="35000"
                value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Danh Mục</label>
              <select className="form-control" value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Mô Tả</label>
            <textarea className="form-control" placeholder="Mô tả sản phẩm..."
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        </form>
      </Modal>
    </div>
  );
}
