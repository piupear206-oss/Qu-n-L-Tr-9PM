import React, { useState, useMemo, useRef } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Edit2, Trash2, X, Search, Clock, Wrench, Video, Printer, BookOpen, ExternalLink, Image as ImageIcon, Calculator, DollarSign, Percent } from 'lucide-react';

const formatMoney = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);

export default function RecipeManagement() {
  const { recipes, addRecipe, updateRecipe, deleteRecipe, categories } = useData();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'manager';

  const [showModal, setShowModal] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    emoji: '🍵',
    image: '',
    prepTime: '',
    equipment: '',
    videoUrl: '',
    tags: '',
    sellingPrice: '',
    ingredientsList: [], // Array of { id, name, qty, unit, cost }
    ingredients: '', // legacy string fallback
    instructions: ''
  });

  const printRef = useRef(null);

  // Default selection
  React.useEffect(() => {
    if (recipes.length > 0 && !selectedRecipe) {
      setSelectedRecipe(recipes[0]);
    } else if (recipes.length === 0) {
      setSelectedRecipe(null);
    }
  }, [recipes, selectedRecipe]);

  const filteredRecipes = useMemo(() => {
    return recipes.filter(r => {
      const matchCat = activeCategory === 'all' || r.categoryId === activeCategory;
      const matchSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (r.tags && r.tags.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [recipes, searchQuery, activeCategory]);

  const handleOpenAdd = () => {
    setFormData({
      name: '', categoryId: categories[0]?.id || '', emoji: '🍵', image: '', prepTime: '', equipment: '', videoUrl: '', tags: '', sellingPrice: '', ingredientsList: [], ingredients: '', instructions: ''
    });
    setEditingRecipe(null);
    setShowModal(true);
  };

  const handleOpenEdit = (recipe, e) => {
    if (e) e.stopPropagation();
    setFormData({
      ...recipe,
      categoryId: recipe.categoryId || '',
      image: recipe.image || '',
      prepTime: recipe.prepTime || '',
      equipment: recipe.equipment || '',
      videoUrl: recipe.videoUrl || '',
      tags: recipe.tags || '',
      sellingPrice: recipe.sellingPrice || '',
      ingredientsList: recipe.ingredientsList || [],
      ingredients: recipe.ingredients || '',
      instructions: recipe.instructions || ''
    });
    setEditingRecipe(recipe);
    setShowModal(true);
  };

  const handleDelete = (id, e) => {
    if (e) e.stopPropagation();
    if (window.confirm('Bạn có chắc chắn muốn xóa công thức này?')) {
      deleteRecipe(id);
      if (selectedRecipe?.id === id) setSelectedRecipe(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingRecipe) {
      updateRecipe(editingRecipe.id, formData);
      if (selectedRecipe?.id === editingRecipe.id) {
        setSelectedRecipe({ ...editingRecipe, ...formData });
      }
    } else {
      const newR = addRecipe(formData);
      setSelectedRecipe(newR); 
    }
    setShowModal(false);
  };

  const handleAddIngredient = () => {
    const newList = [...(formData.ingredientsList || [])];
    newList.push({ id: Date.now().toString(), name: '', qty: '', unit: 'ml', cost: '' });
    setFormData({ ...formData, ingredientsList: newList });
  };

  const handleIngredientChange = (id, field, value) => {
    const newList = (formData.ingredientsList || []).map(i => i.id === id ? { ...i, [field]: value } : i);
    setFormData({ ...formData, ingredientsList: newList });
  };

  const handleDeleteIngredient = (id) => {
    const newList = (formData.ingredientsList || []).filter(i => i.id !== id);
    setFormData({ ...formData, ingredientsList: newList });
  };

  const formTotalCost = useMemo(() => {
    return (formData.ingredientsList || []).reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
  }, [formData.ingredientsList]);
  const formCostWithWaste = formTotalCost * 1.1;

  const viewTotalCost = useMemo(() => {
    if (!selectedRecipe) return 0;
    return (selectedRecipe.ingredientsList || []).reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
  }, [selectedRecipe]);
  const viewCostWithWaste = viewTotalCost * 1.1;
  const viewSellingPrice = Number(selectedRecipe?.sellingPrice) || 0;
  const viewMargin = viewSellingPrice - viewCostWithWaste;
  const viewMarginPercent = viewSellingPrice > 0 ? Math.round((viewMargin / viewSellingPrice) * 100) : 0;

  const handlePrint = () => {
    if (!selectedRecipe) return;
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head>
          <title>In Công Thức: ${selectedRecipe.name}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; line-height: 1.6; }
            h1 { color: #7c3aed; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 20px;}
            .meta { display: flex; gap: 20px; font-size: 14px; color: #666; margin-bottom: 30px; }
            .section-title { font-size: 18px; color: #10b981; margin-top: 30px; margin-bottom: 10px; }
            .content { white-space: pre-wrap; font-size: 16px; background: #f9f9f9; padding: 20px; border-radius: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
            th { background: #f0f0f0; }
          </style>
        </head>
        <body>
          <h1>${selectedRecipe.emoji} CÔNG THỨC: ${selectedRecipe.name.toUpperCase()}</h1>
          <div class="meta">
            <span><strong>Thời gian:</strong> ${selectedRecipe.prepTime || 'N/A'}</span>
            <span><strong>Dụng cụ:</strong> ${selectedRecipe.equipment || 'N/A'}</span>
          </div>
          
          <div class="section-title">Nguyên Liệu Cuẩn Bị:</div>
          ${selectedRecipe.ingredientsList && selectedRecipe.ingredientsList.length > 0 ? `
            <table>
              <thead><tr><th>Tên Nguyên Liệu</th><th>Định Lượng</th></tr></thead>
              <tbody>
                ${selectedRecipe.ingredientsList.map(i => `<tr><td>${i.name}</td><td>${i.qty} ${i.unit}</td></tr>`).join('')}
              </tbody>
            </table>
          ` : `<div class="content">${selectedRecipe.ingredients || 'Chưa cập nhật'}</div>`}
          
          <div class="section-title">Các Bước Thực Hiện (S.O.P):</div>
          <div class="content">${selectedRecipe.instructions || 'Chưa cập nhật'}</div>
          
          <div style="margin-top: 50px; text-align: center; color: #aaa; font-size: 12px;">Đóng dấu / Niêm yết nội bộ Tiệm Trà 9PM</div>
        </body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  const renderTags = (tagsStr) => {
    if (!tagsStr) return null;
    return tagsStr.split(',').map(t => t.trim()).filter(Boolean).map((tag, idx) => (
      <span key={idx} className="badge badge-purple" style={{ marginRight: 6, marginBottom: 6 }}>{tag}</span>
    ));
  };

  return (
    <div className="animate-fade-in-up">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1>📖 Phân Hệ Cốt Dữ Liệu (Food Cost) & Đào Tạo</h1>
          <p>Hệ thống tra cứu công thức S.O.P chuẩn và Định mức nguyên liệu</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={18} /> Thêm Công Thức Mới
          </button>
        )}
      </div>

      <div className="recipe-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 380px) 1fr', gap: '24px', height: 'calc(100vh - 160px)', alignItems: 'start' }}>
        
        {/* LEFT PANE */}
        <div className="card recipe-sidebar" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px' }}>
          <div style={{ marginBottom: 16 }}>
            <div className="form-group" style={{ position: 'relative', marginBottom: 12 }}>
              <Search size={18} style={{ position: 'absolute', left: 14, top: 12, color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="form-control" 
                placeholder="Tìm kiếm món ăn, thức uống..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: 40 }}
              />
            </div>
            
            <div className="category-filters" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
              <button 
                className={`btn btn-sm ${activeCategory === 'all' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setActiveCategory('all')}
                style={{ borderRadius: 20, whiteSpace: 'nowrap' }}
              >
                Tất cả
              </button>
              {categories.map(cat => (
                <button 
                  key={cat.id} 
                  className={`btn btn-sm ${activeCategory === cat.id ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setActiveCategory(cat.id)}
                  style={{ borderRadius: 20, whiteSpace: 'nowrap' }}
                >
                  {cat.emoji} {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredRecipes.length === 0 ? (
               <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)' }}>
                 <p>Không tìm thấy công thức nào phù hợp.</p>
               </div>
            ) : (
              filteredRecipes.map(recipe => (
                <div 
                  key={recipe.id} 
                  className={`recipe-list-item ${selectedRecipe?.id === recipe.id ? 'active' : ''}`}
                  onClick={() => setSelectedRecipe(recipe)}
                  style={{
                    display: 'flex', gap: 16, alignItems: 'center', padding: 12, 
                    borderRadius: 'var(--radius-md)', cursor: 'pointer',
                    background: selectedRecipe?.id === recipe.id ? 'rgba(124, 58, 237, 0.15)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${selectedRecipe?.id === recipe.id ? 'var(--accent-primary)' : 'transparent'}`,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ width: 60, height: 60, borderRadius: 12, background: 'var(--bg-secondary)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem',
                    overflow: 'hidden', flexShrink: 0 }}>
                    {recipe.image ? (
                      <img src={recipe.image} alt={recipe.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (recipe.emoji || '🍵')}
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontWeight: 600, fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{recipe.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                      <Clock size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: '-2px' }}/> 
                      {recipe.prepTime || 'N/A'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT PANE */}
        <div className="card recipe-details" style={{ height: '100%', overflowY: 'auto', padding: 0 }}>
          {selectedRecipe ? (
            <>
              {/* Header Cover Info */}
              <div style={{ 
                height: 200, 
                background: selectedRecipe.image ? `url(${selectedRecipe.image}) center/cover no-repeat` : 'var(--gradient-sidebar)',
                position: 'relative', display: 'flex', alignItems: 'flex-end', padding: 32,
                borderTopLeftRadius: 'var(--radius-lg)', borderTopRightRadius: 'var(--radius-lg)'
              }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,26,1) 0%, rgba(10,10,26,0.3) 100%)' }} />
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 20, alignItems: 'flex-end', width: '100%' }}>
                  {!selectedRecipe.image && (
                    <div style={{ fontSize: '4rem', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', width: 100, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 20 }}>
                      {selectedRecipe.emoji}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    {renderTags(selectedRecipe.tags)}
                    <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: 8 }}>{selectedRecipe.name}</h2>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-outline" onClick={handlePrint} title="In Công Thức S.O.P">
                      <Printer size={18} /> <span className="hide-mobile">In</span>
                    </button>
                    {isAdmin && (
                      <>
                        <button className="btn btn-primary" onClick={(e) => handleOpenEdit(selectedRecipe, e)}>
                          <Edit2 size={18} />
                        </button>
                        <button className="btn btn-danger" onClick={(e) => handleDelete(selectedRecipe.id, e)}>
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Data Blocks */}
              <div style={{ padding: 32 }}>
                
                {/* Admin Food Cost Dashboard */}
                {isAdmin && (
                  <div style={{ background: 'rgba(124, 58, 237, 0.1)', border: '1px solid var(--border-color)', borderRadius: 16, padding: 20, marginBottom: 32, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <Calculator size={14} /> Giá Vốn (+10% Hao Hụt)
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-danger)' }}>{formatMoney(viewCostWithWaste)}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>(Gốc: {formatMoney(viewTotalCost)})</div>
                      </div>
                    </div>
                    <div style={{ width: 1, background: 'var(--border-color)' }}></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <DollarSign size={14} /> Giá Bán (Price)
                      </div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>{formatMoney(viewSellingPrice)}</div>
                    </div>
                    <div style={{ width: 1, background: 'var(--border-color)' }}></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <Percent size={14} /> Lợi Nhuận (Margin %)
                      </div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 700, color: viewMarginPercent > 50 ? 'var(--accent-success)' : 'var(--accent-warning)' }}>
                        {viewMarginPercent}% <span style={{ fontSize: '0.9rem', fontWeight: 400 }}>({formatMoney(viewMargin)})</span>
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Clock size={14} /> KPI Thời Gian Pha Chuẩn
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--accent-primary-light)' }}>
                      {selectedRecipe.prepTime || '---'}
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Wrench size={14} /> Dụng Cụ Pha Chế Đặc Thù
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {selectedRecipe.equipment || '---'}
                    </div>
                  </div>
                  {selectedRecipe.videoUrl && (
                    <div style={{ background: 'rgba(16,185,129,0.05)', padding: 16, borderRadius: 12, border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gridColumn: '1 / -1' }}>
                      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        <div style={{ background: 'var(--gradient-success)', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                          <Video size={20} />
                        </div>
                        <div>
                          <div style={{ color: 'var(--accent-success)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Hướng Dẫn Trực Quan (Video)</div>
                          <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Video S.O.P Training</div>
                        </div>
                      </div>
                      <a href={selectedRecipe.videoUrl} target="_blank" rel="noreferrer" className="btn btn-success" style={{ padding: '8px 16px' }}>
                        <ExternalLink size={16} /> Bấm Để Xem
                      </a>
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: 32 }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: 16, color: 'var(--accent-primary-light)', paddingBottom: 8, borderBottom: '1px dashed rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      <span style={{background: 'rgba(124, 58, 237, 0.2)', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>1</span>
                      Định Mức Nguyên Liệu
                    </h3>
                    
                    {selectedRecipe.ingredientsList && selectedRecipe.ingredientsList.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {selectedRecipe.ingredientsList.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                            <span style={{ fontWeight: 600 }}>{item.name}</span>
                            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                              <span style={{ color: 'var(--accent-info)', fontWeight: 700 }}>{item.qty} {item.unit}</span>
                              {isAdmin && <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{formatMoney(item.cost)}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                        {selectedRecipe.ingredients || 'Chưa cập nhật'}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: 16, color: 'var(--accent-success)', paddingBottom: 8, borderBottom: '1px dashed rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      <span style={{background: 'rgba(16, 185, 129, 0.2)', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>2</span>
                      Các Bước Pha Chế (S.O.P)
                    </h3>
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, fontSize: '1.05rem', color: 'var(--text-primary)', background: 'rgba(255,255,255,0.02)', padding: 24, borderRadius: 12 }}>
                      {selectedRecipe.instructions || 'Chưa cập nhật'}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <BookOpen size={64} style={{ opacity: 0.3, marginBottom: 16 }} />
              <h3>Chưa chọn Công Thức nào</h3>
              <p>Vui lòng chọn 1 món bên trái danh sách để xem chi tiết & giá vốn.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && isAdmin && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingRecipe ? 'Sửa Yêu Cầu Thiết Kế Đồ Uống' : 'Khởi Tạo Mã Đồ Uống & Công Thức Mới'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                <h4 style={{ color: 'var(--accent-primary-light)', paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: 16 }}>1. Thông tin chung & Tài sản</h4>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Tên món *</label>
                    <input type="text" className="form-control" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="VD: Trà Sữa Thạch Trân Châu" />
                  </div>
                  <div className="form-group">
                    <label>Danh mục phân loại</label>
                    <select className="form-control" value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})}>
                      <option value="">-- Chọn danh mục --</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Hình ảnh Web (URL Link)</label>
                    <div style={{ position: 'relative' }}>
                      <ImageIcon size={18} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
                      <input type="url" className="form-control" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} placeholder="https://..." style={{ paddingLeft: 38 }} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Emoji hiển thị nhanh</label>
                    <input type="text" className="form-control" value={formData.emoji} onChange={e => setFormData({...formData, emoji: e.target.value})} placeholder="VD: 🧋" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>KPI Thời gian thao tác</label>
                    <input type="text" className="form-control" value={formData.prepTime} onChange={e => setFormData({...formData, prepTime: e.target.value})} placeholder="VD: 03 Phút" />
                  </div>
                  <div className="form-group">
                    <label>Dụng cụ bắt buộc (Equipment)</label>
                    <input type="text" className="form-control" value={formData.equipment} onChange={e => setFormData({...formData, equipment: e.target.value})} placeholder="VD: Shaker, Bình 2 lít..." />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Nhãn chiến lược (Cách nhau bằng dấu phẩy)</label>
                    <input type="text" className="form-control" value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} placeholder="VD: Bán chạy, Món mới..." />
                  </div>
                  <div className="form-group">
                    <label>Video Training (URL Youtube/TikTok)</label>
                    <input type="url" className="form-control" value={formData.videoUrl} onChange={e => setFormData({...formData, videoUrl: e.target.value})} placeholder="https://youtube.com/..." />
                  </div>
                </div>

                <h4 style={{ color: 'var(--accent-warning)', paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: 16, marginTop: 32 }}>2. Bóc tách nguyên liệu & Giá Vốn (Food Cost)</h4>
                
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 12, marginBottom: 16 }}>
                  {formData.ingredientsList && formData.ingredientsList.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 40px', gap: 12, marginBottom: 8, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <div>Tên Nguyên Liệu</div><div>Định lượng</div><div>Đơn vị</div><div>Giá vốn (VNĐ)</div><div></div>
                    </div>
                  )}
                  {formData.ingredientsList?.map((item) => (
                    <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 40px', gap: 12, marginBottom: 8 }}>
                      <input type="text" className="form-control" placeholder="Trà đen..." value={item.name} onChange={e => handleIngredientChange(item.id, 'name', e.target.value)} required />
                      <input type="number" className="form-control" placeholder="100" value={item.qty} onChange={e => handleIngredientChange(item.id, 'qty', e.target.value)} required />
                      <select className="form-control" value={item.unit} onChange={e => handleIngredientChange(item.id, 'unit', e.target.value)}>
                        <option value="ml">ml</option>
                        <option value="g">gram</option>
                        <option value="lát">Lát</option>
                        <option value="quả">Quả</option>
                        <option value="kẹp">Kẹp</option>
                      </select>
                      <input type="number" className="form-control" placeholder="2500" value={item.cost} onChange={e => handleIngredientChange(item.id, 'cost', e.target.value)} required />
                      <button type="button" className="btn btn-danger" style={{ padding: 0, height: 38 }} onClick={() => handleDeleteIngredient(item.id)}><Trash2 size={16}/></button>
                    </div>
                  ))}
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                    <button type="button" className="btn btn-outline btn-sm" onClick={handleAddIngredient}>
                      <Plus size={14} /> Thêm Định Mức Mới
                    </button>
                    
                    <div style={{ display: 'flex', gap: 16, fontSize: '0.9rem', background: 'rgba(0,0,0,0.3)', padding: '8px 16px', borderRadius: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                       <span>Gốc: {formatMoney(formTotalCost)}</span>
                       <span style={{ color: 'var(--accent-warning)' }}>+10% Hao Hụt</span>
                       <span>Tổng Vốn: <strong className="text-accent" style={{ fontSize: '1.1rem' }}>{formatMoney(formCostWithWaste)}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="form-row" style={{ alignItems: 'flex-end', marginBottom: 24 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Quy cách Giá Bán Niêm Yết (VNĐ)</label>
                    <input type="number" className="form-control" value={formData.sellingPrice} onChange={e => setFormData({...formData, sellingPrice: e.target.value})} placeholder="35000" />
                  </div>
                  {formData.sellingPrice > 0 && (
                    <div style={{ padding: '0 16px 10px', fontSize: '0.95rem' }}>
                      Lợi nhuận gộp biên sau cấn trừ hao hụt: <strong style={{ color: ((formData.sellingPrice - formCostWithWaste)/formData.sellingPrice*100) > 50 ? 'var(--accent-success)' : 'var(--accent-warning)', fontSize: '1.1rem' }}>{Math.round(((formData.sellingPrice - formCostWithWaste)/formData.sellingPrice)*100)}%</strong>
                    </div>
                  )}
                </div>

                <h4 style={{ color: 'var(--accent-success)', paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: 16, marginTop: 32 }}>3. S.O.P - Standart Operating Procedure</h4>
                <div className="form-group">
                  <label>Quy trình pha chế (S.O.P thao tác chuẩn - Mỗi bước xuống 1 dòng)</label>
                  <textarea className="form-control" rows="6" value={formData.instructions} onChange={e => setFormData({...formData, instructions: e.target.value})} placeholder="Bước 1: Cho hỗn hợp vào Shaker...&#10;Bước 2: Lắc đều..."></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Hủy Bỏ</button>
                <button type="submit" className="btn btn-primary">{editingRecipe ? 'Kiểm Duyệt Cập Nhật' : 'Phát Hành Công Lệnh Lắp Ráp'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
