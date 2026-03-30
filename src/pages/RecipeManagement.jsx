import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Edit2, Trash2, X, BookOpen } from 'lucide-react';

export default function RecipeManagement() {
  const { recipes, addRecipe, updateRecipe, deleteRecipe } = useData();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'manager';

  const [showModal, setShowModal] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [viewingRecipe, setViewingRecipe] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    emoji: '🍵',
    ingredients: '',
    instructions: ''
  });

  const handleOpenAdd = () => {
    setFormData({ name: '', emoji: '🍵', ingredients: '', instructions: '' });
    setEditingRecipe(null);
    setShowModal(true);
  };

  const handleOpenEdit = (recipe, e) => {
    e.stopPropagation();
    setFormData(recipe);
    setEditingRecipe(recipe);
    setShowModal(true);
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    if (window.confirm('Bạn có chắc chắn muốn xóa công thức này?')) {
      deleteRecipe(id);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingRecipe) {
      updateRecipe(editingRecipe.id, formData);
    } else {
      addRecipe(formData);
    }
    setShowModal(false);
  };

  const handleView = (recipe) => {
    setViewingRecipe(recipe);
  };

  return (
    <div className="animate-fade-in-up">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>📖 Phân Hệ Công Thức</h1>
          <p>Xem và quản lý công thức pha chế của quán</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={18} /> Thêm Công Thức
          </button>
        )}
      </div>

      {recipes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <BookOpen size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
          <p style={{ color: 'var(--text-secondary)' }}>Chưa có công thức nào được thêm vào hệ thống.</p>
        </div>
      ) : (
        <div className="table-grid">
          {recipes.map(recipe => (
            <div key={recipe.id} className="table-item available" onClick={() => handleView(recipe)}>
              <div style={{ fontSize: '3rem' }}>{recipe.emoji || '🍵'}</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, textAlign: 'center', padding: '0 8px' }}>{recipe.name}</div>
              {isAdmin && (
                <div style={{ position: 'absolute', top: 4, right: 4, display: 'flex', gap: 4 }}>
                  <button className="btn-ghost" onClick={(e) => handleOpenEdit(recipe, e)} style={{ padding: 4, color: 'var(--accent-info)' }} title="Sửa">
                    <Edit2 size={16} />
                  </button>
                  <button className="btn-ghost" onClick={(e) => handleDelete(recipe.id, e)} style={{ padding: 4, color: 'var(--accent-danger)' }} title="Xóa">
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* View Modal */}
      {viewingRecipe && (
        <div className="modal-overlay" onClick={() => setViewingRecipe(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1.5rem' }}>{viewingRecipe.emoji}</span> {viewingRecipe.name}
              </h3>
              <button className="modal-close" onClick={() => setViewingRecipe(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ color: 'var(--accent-primary-light)', marginBottom: 8, paddingBottom: 4, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Nguyên Liệu Cần Chuẩn Bị</h4>
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                  {viewingRecipe.ingredients || 'Chưa cập nhật'}
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ color: 'var(--accent-success)', marginBottom: 8, paddingBottom: 4, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Các Bước Thực Hiện</h4>
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                  {viewingRecipe.instructions || 'Chưa cập nhật'}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setViewingRecipe(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && isAdmin && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingRecipe ? 'Sửa Công Thức' : 'Thêm Công Thức Nước Uống Mới'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Tên đồ uống</label>
                    <input type="text" className="form-control" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="VD: Trà Sữa Trân Châu" />
                  </div>
                  <div className="form-group">
                    <label>Emoji hiển thị</label>
                    <input type="text" className="form-control" value={formData.emoji} onChange={e => setFormData({...formData, emoji: e.target.value})} required placeholder="VD: 🧋" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Thành phần nguyên liệu (Mỗi nguyên liệu xuống 1 dòng)</label>
                  <textarea className="form-control" rows="4" value={formData.ingredients} onChange={e => setFormData({...formData, ingredients: e.target.value})} placeholder="- 100ml Hồng trà&#10;- 20ml Sữa đặc&#10;- 30g Trân châu đen..."></textarea>
                </div>
                <div className="form-group">
                  <label>Các bước pha chế (Mỗi thao tác xuống 1 dòng)</label>
                  <textarea className="form-control" rows="6" value={formData.instructions} onChange={e => setFormData({...formData, instructions: e.target.value})} placeholder="Bước 1: Cho trà vào ca cùng sữa đặc đánh đều...&#10;Bước 2: Thêm đá đầy ly...&#10;Bước 3: Lắc đều và đổ ra ly, rắc trân châu lên trên..."></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">{editingRecipe ? 'Cập Nhật' : 'Lưu Công Thức'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
