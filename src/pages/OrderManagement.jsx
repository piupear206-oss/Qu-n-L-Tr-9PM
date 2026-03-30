import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';
import { ShoppingCart, Minus, Plus, X, Printer, CreditCard, Banknote, Smartphone, CheckCircle } from 'lucide-react';

export default function OrderManagement() {
  const { products, categories, tables, orders, addOrder, updateTable, updateOrder, deleteOrder, settings } = useData();
  const { user } = useAuth();
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [cart, setCart] = useState([]);
  const [showPayment, setShowPayment] = useState(false);
  const [showBill, setShowBill] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentForm, setPaymentForm] = useState({ cashAmount: '', transactionCode: '' });
  const [currentOrder, setCurrentOrder] = useState(null);
  const [orderNote, setOrderNote] = useState('');

  const filteredProducts = selectedCategory
    ? products.filter(p => p.categoryId === selectedCategory)
    : products;

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => {
      return prev.map(i => {
        if (i.id === id) {
          const newQty = i.qty + delta;
          return newQty > 0 ? { ...i, qty: newQty } : i;
        }
        return i;
      }).filter(i => i.qty > 0);
    });
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const formatMoney = (n) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

  const getActiveOrder = (tableId) => {
    return orders.find(o => o.tableId === tableId && (o.status === 'pending' || o.status === 'pending_payment'));
  };

  const handleSelectTable = (table) => {
    const existingOrder = getActiveOrder(table.id);
    if (existingOrder) {
      setCurrentOrder(existingOrder);
    } else {
      setCurrentOrder(null);
    }
    setCart([]);
    setSelectedTable(table);
    if (table.id && table.status === 'available') {
      updateTable(table.id, { status: 'occupied' });
    }
  };

  const handleSaveOrder = () => {
    if (cart.length === 0) return;

    if (currentOrder) {
      // Add items to existing order
      const updatedItems = [...(currentOrder.items || [])];
      cart.forEach(cartItem => {
        const existing = updatedItems.find(i => i.id === cartItem.id);
        if (existing) {
          existing.qty += cartItem.qty;
        } else {
          updatedItems.push({ id: cartItem.id, name: cartItem.name, price: cartItem.price, qty: cartItem.qty, emoji: cartItem.emoji });
        }
      });
      const newTotal = updatedItems.reduce((sum, i) => sum + i.price * i.qty, 0);
      const addedItemsMsg = cart.map(c => `${c.qty}x ${c.name}`).join(', ');
      updateOrder(currentOrder.id, {
        items: updatedItems,
        total: newTotal,
        note: orderNote ? (currentOrder.note ? `${currentOrder.note} | ${orderNote}` : orderNote) : currentOrder.note,
        lastUpdatedBy: user?.name || 'Admin',
        lastUpdatedAt: new Date().toISOString(),
        notifications: [...(currentOrder.notifications || []), {
          id: Date.now().toString(),
          type: 'update_order',
          message: `Thêm món: ${addedItemsMsg}`,
          items: cart.map(i => `${i.qty}x ${i.name}`),
          note: orderNote || '',
          timestamp: new Date().toISOString(),
          read: false
        }]
      });
    } else {
      // Create new pending order
      addOrder({
        tableId: selectedTable?.id || null,
        tableName: selectedTable?.name || 'Mang đi',
        items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty, emoji: i.emoji })),
        total: cartTotal,
        note: orderNote,
        status: 'pending',
        employeeName: user?.name || 'Admin',
        notifications: [{
          id: Date.now().toString(),
          type: 'new_order',
          message: `Order mới: ${selectedTable?.name || 'Bàn Khách mang đi'}`,
          items: cart.map(i => `${i.qty}x ${i.name}`),
          note: orderNote || '',
          timestamp: new Date().toISOString(),
          read: false
        }]
      });
    }
    setCart([]);
    setOrderNote('');
    alert('✅ Đã lưu order thành công!');
    setSelectedTable(null);
    setCurrentOrder(null);
  };

  const handleRemoveFromCurrentOrder = (index) => {
    if (!currentOrder) return;
    if (!window.confirm('Xóa món này khỏi order hiện tại?')) return;
    
    const newItems = [...currentOrder.items];
    const removedItem = newItems.splice(index, 1)[0];
    const newTotal = newItems.reduce((sum, item) => sum + item.price * item.qty, 0);

    if (newItems.length === 0) {
      deleteOrder(currentOrder.id);
      if (currentOrder.tableId) updateTable(currentOrder.tableId, { status: 'available' });
      alert('Order đã bị xóa vì không còn món nào.');
      setCurrentOrder(null);
      setSelectedTable(null);
    } else {
      updateOrder(currentOrder.id, {
        items: newItems,
        total: newTotal,
        lastUpdatedBy: user?.name || 'Admin',
        lastUpdatedAt: new Date().toISOString()
      });
      setCurrentOrder({...currentOrder, items: newItems, total: newTotal});
    }
  };

  const handlePayment = () => {
    const orderToPay = currentOrder || {
      tableId: selectedTable?.id || null,
      tableName: selectedTable?.name || 'Mang đi',
      items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty, emoji: i.emoji })),
      total: currentOrder ? currentOrder.total : cartTotal,
      note: orderNote,
      employeeName: user?.name || 'Admin',
      createdAt: new Date().toISOString(),
      notifications: currentOrder ? currentOrder.notifications : [{
        id: Date.now().toString(),
        type: 'new_order',
        message: `Order mới: ${selectedTable?.name || 'Bàn Khách mang đi'}`,
        items: cart.map(i => `${i.qty}x ${i.name}`),
        timestamp: new Date().toISOString(),
        read: false
      }]
    };

    const paymentData = {
      paymentMethod,
      transactionCode: paymentMethod !== 'cash' ? paymentForm.transactionCode : '',
      cashReceived: paymentMethod === 'cash' ? Number(paymentForm.cashAmount) : orderToPay.total,
      changeAmount: paymentMethod === 'cash' ? Number(paymentForm.cashAmount) - orderToPay.total : 0,
      status: 'paid',
      paidAt: new Date().toISOString(),
      paidBy: user?.name || 'Admin'
    };

    let finalOrder;
    if (currentOrder) {
      updateOrder(currentOrder.id, paymentData);
      finalOrder = { ...currentOrder, ...paymentData };
    } else {
      finalOrder = addOrder({ ...orderToPay, ...paymentData });
    }

    if (selectedTable?.id) {
      updateTable(selectedTable.id, { status: 'available' });
    }

    setCurrentOrder(finalOrder);
    setShowPayment(false);
    setShowBill(true);
  };

  const handlePrintBill = () => {
    window.print();
  };

  const resetOrder = () => {
    setCart([]);
    setSelectedTable(null);
    setShowBill(false);
    setCurrentOrder(null);
    setPaymentForm({ cashAmount: '', transactionCode: '' });
    setOrderNote('');
  };

  // Show Bill View
  if (showBill && currentOrder) {
    return (
      <div className="animate-fade-in-up">
        <div className="page-header no-print">
          <h1>🧾 Hóa Đơn</h1>
          <div className="btn-group mt-1">
            <button className="btn btn-primary" onClick={handlePrintBill}>
              <Printer size={18} /> In Bill
            </button>
            <button className="btn btn-success" onClick={resetOrder}>
              <CheckCircle size={18} /> Về Danh Sách Bàn
            </button>
          </div>
        </div>

        <div className="bill-container">
          <div className="bill-header">
            <h2>☕ TIỆM TRÀ 9PM</h2>
            <p style={{ fontSize: '0.75rem', color: '#666' }}>Hóa đơn bán hàng</p>
            <p style={{ fontSize: '0.75rem', color: '#999' }}>
              {new Date(currentOrder.createdAt || currentOrder.paidAt).toLocaleString('vi-VN')}
            </p>
            <p style={{ fontSize: '0.75rem' }}>Mã: #{currentOrder.id?.slice(-8).toUpperCase()}</p>
            <p style={{ fontSize: '0.75rem' }}>{currentOrder.tableName}</p>
          </div>

          <div className="bill-items">
            {currentOrder.items?.map((item, i) => (
              <div key={i} className="bill-item">
                <span>{item.qty}x {item.name}</span>
                <span>{formatMoney(item.price * item.qty)}</span>
              </div>
            ))}
          </div>

          <div className="bill-total">
            <span>TỔNG CỘNG:</span>
            <span>{formatMoney(currentOrder.total)}</span>
          </div>

          {currentOrder.note && (
            <div style={{ marginTop: 12, fontSize: '0.85rem', fontStyle: 'italic', padding: '8px', border: '1px dashed #ccc', borderRadius: 6 }}>
              <strong>Ghi chú:</strong> {currentOrder.note}
            </div>
          )}

          <div style={{ marginTop: 8, fontSize: '0.8rem' }}>
            <div className="bill-item">
              <span>Phương thức:</span>
              <span>{currentOrder.paymentMethod === 'cash' ? 'Tiền mặt' : currentOrder.paymentMethod === 'bank' ? 'Chuyển khoản' : 'MoMo'}</span>
            </div>
            {currentOrder.paymentMethod === 'cash' && (
              <>
                <div className="bill-item">
                  <span>Tiền nhận:</span>
                  <span>{formatMoney(currentOrder.cashReceived)}</span>
                </div>
                <div className="bill-item">
                  <span>Tiền thừa:</span>
                  <span>{formatMoney(currentOrder.changeAmount)}</span>
                </div>
              </>
            )}
            {currentOrder.transactionCode && (
              <div className="bill-item">
                <span>Mã GD:</span>
                <span>{currentOrder.transactionCode}</span>
              </div>
            )}
          </div>

          <div className="bill-footer">
            <p>--- Cảm ơn quý khách! ---</p>
            <p>Hẹn gặp lại 🍵</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <h1>🛒 Order Món ({user?.role === 'manager' ? 'Quản Lí' : 'Admin'})</h1>
        <p>Chọn bàn → Chọn món → Lưu order / Thanh toán</p>
      </div>

      {/* Table Selection */}
      {!selectedTable && (
        <div className="card mb-2">
          <h3 style={{ marginBottom: 16 }}>Chọn Bàn (hoặc bỏ qua cho Mang Đi)</h3>
          <div className="table-grid" style={{ marginBottom: 12 }}>
            {tables.map(table => {
              const activeOrder = getActiveOrder(table.id);
              return (
                <div key={table.id}
                  className={`table-item ${table.status}`}
                  onClick={() => handleSelectTable(table)}
                  style={activeOrder ? { borderColor: 'var(--accent-warning)', boxShadow: '0 0 15px rgba(245,158,11,0.2)' } : {}}
                >
                  <div className="table-number">{table.name}</div>
                  <div className="table-status" style={{
                    color: table.status === 'available' ? 'var(--text-muted)' : (activeOrder ? 'var(--accent-warning)' : 'var(--accent-danger)')
                  }}>
                    {table.status === 'available' ? 'Trống' : activeOrder?.status === 'pending_payment' ? '⏳ Chờ duyệt TT' : 'Đang dùng'}
                  </div>
                  {activeOrder && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--accent-warning)', marginTop: 4 }}>
                      {activeOrder.items?.length} món · {formatMoney(activeOrder.total)}
                      {activeOrder.status === 'pending_payment' && <div style={{color: 'white', background: 'var(--accent-danger)', padding: '2px 4px', borderRadius: 4, marginTop: 4}}>ĐANG CHỜ TIỀN</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <button className="btn btn-outline" onClick={() => handleSelectTable({ id: null, name: 'Mang đi' })}>
            🛍️ Mang Đi (Không chọn bàn)
          </button>
        </div>
      )}

      {/* Order Layout */}
      {selectedTable && (
        <div className="order-layout">
          {/* Product Catalog */}
          <div className="order-products">
            <div className="flex-between mb-1 no-print">
              <div>
                <span className="badge badge-purple" style={{ fontSize: '0.9rem', padding: '6px 14px' }}>
                  📍 {selectedTable.name}
                </span>
                {currentOrder && (
                  <span className="badge badge-warning" style={{ marginLeft: 8 }}>
                    Đang có order chưa thanh toán
                  </span>
                )}
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => { setSelectedTable(null); setCart([]); setCurrentOrder(null); }}>
                ← Đổi Bàn
              </button>
            </div>

            {currentOrder && (
              <div className="card mb-2" style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h4 style={{ margin: 0 }}>📋 Order hiện tại ({currentOrder.items?.length} món)</h4>
                  <span className={`badge ${currentOrder.status === 'pending_payment' ? 'badge-danger' : 'badge-warning'}`}>
                    {currentOrder.status === 'pending_payment' ? '⏳ Chờ duyệt TT' : '⏳ Chưa TT'}
                  </span>
                </div>
                {currentOrder.items?.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', fontSize: '0.85rem' }}>
                    <div style={{ flex: 1 }}>{item.emoji} {item.qty}x {item.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="text-accent">{formatMoney(item.price * item.qty)}</span>
                      <button className="btn btn-ghost text-danger" style={{ padding: 4 }} onClick={() => handleRemoveFromCurrentOrder(i)}>
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {currentOrder.note && (
                  <div style={{ marginTop: 8, padding: 8, background: 'var(--bg-lighter)', borderRadius: 6, fontSize: '0.85rem' }}>
                    <span className="text-muted">📝 Ghi chú: </span>
                    <strong>{currentOrder.note}</strong>
                  </div>
                )}
                <div style={{ borderTop: '1px dashed var(--border-color)', marginTop: 8, paddingTop: 8, fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Tổng hóa đơn hiện tại:</span>
                  <span className="text-accent">{formatMoney(currentOrder.total)}</span>
                </div>
                <div style={{ marginTop: 16 }}>
                  {currentOrder.status === 'pending_payment' ? (
                    <button className="btn btn-primary btn-block btn-lg" onClick={() => {
                        updateOrder(currentOrder.id, {
                          status: 'paid',
                          paidAt: new Date().toISOString(),
                          paidBy: user?.name || 'Admin',
                          notifications: [...(currentOrder.notifications || []), {
                            type: 'payment_success',
                            message: `Quản trị viên đã xác nhận thanh toán cho ${currentOrder.tableName} - ${formatMoney(currentOrder.total)}`,
                            timestamp: new Date().toISOString(),
                            read: false,
                          }]
                        });
                        if (currentOrder.tableId) updateTable(currentOrder.tableId, { status: 'available' });
                        alert('Đã xác nhận đã nhận tiền thành công!');
                        setShowBill(true);
                      }}>
                      <CheckCircle size={20} /> Xác nhận Đã Nhận Tiền
                    </button>
                  ) : (
                    <button className="btn btn-success btn-block btn-lg" onClick={() => setShowPayment(true)}>
                      <CreditCard size={20} /> Khách Yêu Cầu Thanh Toán
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="product-categories">
              <button className={`category-tab ${!selectedCategory ? 'active' : ''}`}
                onClick={() => setSelectedCategory('')}>
                Tất Cả
              </button>
              {categories.map(cat => (
                <button key={cat.id} className={`category-tab ${selectedCategory === cat.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat.id)}>
                  {cat.emoji} {cat.name}
                </button>
              ))}
            </div>

            <div className="product-grid">
              {filteredProducts.map(prod => (
                <div key={prod.id} className="product-card" onClick={() => addToCart(prod)}>
                  <div className="product-emoji">{prod.emoji || '🧋'}</div>
                  <div className="product-name">{prod.name}</div>
                  <div className="product-price">{formatMoney(prod.price)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Cart */}
          <div className="order-cart no-print">
            <div className="order-cart-header">
              <span>🛒 {currentOrder ? 'Khách Gọi Thêm Món' : 'Món Khách Gọi Lần 1'} ({cart.reduce((s, i) => s + i.qty, 0)})</span>
              {cart.length > 0 && (
                <button className="btn btn-ghost btn-sm text-danger" onClick={() => setCart([])}>Xóa hết</button>
              )}
            </div>

            <div className="order-cart-items">
              {cart.length === 0 ? (
                <div className="empty-state" style={{ padding: 24 }}>
                  <ShoppingCart size={36} />
                  <p>Chưa chọn món nào</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="cart-item">
                    <span style={{ fontSize: '1.3rem' }}>{item.emoji}</span>
                    <div className="cart-item-info">
                      <div className="name">{item.name}</div>
                      <div className="price">{formatMoney(item.price)}</div>
                    </div>
                    <div className="cart-qty">
                      <button onClick={() => updateQty(item.id, -1)}>−</button>
                      <span style={{ fontWeight: 600, minWidth: 20, textAlign: 'center' }}>{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)}>+</button>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => removeFromCart(item.id)}>
                      <X size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="order-cart-footer">
              <div className="form-group" style={{ marginBottom: 8 }}>
                <input type="text" className="form-control" placeholder="Ghi chú (ít đá, nhiều đường...)" value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)} style={{ fontSize: '0.85rem' }} />
              </div>
              <div className="cart-total">
                <span>{currentOrder ? 'Tổng tiền món gọi thêm:' : 'Tổng tiền order:'}</span>
                <span className="text-accent">{formatMoney(cartTotal)}</span>
              </div>
              <button className="btn btn-primary btn-block btn-lg" onClick={handleSaveOrder} disabled={cart.length === 0}>
                <CheckCircle size={20} /> Chỉ Xác Nhận Món (Chưa TT)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      <Modal isOpen={showPayment} onClose={() => setShowPayment(false)} title="Xác Nhận Thanh Toán" size="lg"
        footer={<>
          <button className="btn btn-outline" onClick={() => setShowPayment(false)}>Hủy</button>
          <button className="btn btn-success btn-lg" onClick={handlePayment}>
            <CheckCircle size={18} /> Xác Nhận Thanh Toán
          </button>
        </>}
      >
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-primary-light)' }}>
            {formatMoney(currentOrder ? currentOrder.total : cartTotal)}
          </div>
          <div className="text-muted">Tổng tiền cần thanh toán</div>
        </div>

        <div className="payment-options">
          <button className={`payment-option ${paymentMethod === 'cash' ? 'selected' : ''}`}
            onClick={() => setPaymentMethod('cash')}>
            <div className="payment-icon"><Banknote size={32} /></div>
            <div className="payment-label">Tiền Mặt</div>
          </button>
          <button className={`payment-option ${paymentMethod === 'bank' ? 'selected' : ''}`}
            onClick={() => setPaymentMethod('bank')}>
            <div className="payment-icon"><CreditCard size={32} /></div>
            <div className="payment-label">Chuyển Khoản</div>
          </button>
          <button className={`payment-option ${paymentMethod === 'momo' ? 'selected' : ''}`}
            onClick={() => setPaymentMethod('momo')}>
            <div className="payment-icon"><Smartphone size={32} /></div>
            <div className="payment-label">MoMo</div>
          </button>
        </div>

        {paymentMethod === 'cash' && (
          <div>
            <div className="form-group">
              <label>Tiền Khách Đưa (VNĐ)</label>
              <input type="number" className="form-control" placeholder="Nhập số tiền khách đưa"
                value={paymentForm.cashAmount}
                onChange={(e) => setPaymentForm({ ...paymentForm, cashAmount: e.target.value })} />
            </div>
            {paymentForm.cashAmount && Number(paymentForm.cashAmount) >= (currentOrder ? currentOrder.total : cartTotal) && (
              <div className="card" style={{ padding: 12, textAlign: 'center', borderColor: 'var(--accent-success)' }}>
                <span className="text-muted">Tiền thừa: </span>
                <span className="text-success" style={{ fontWeight: 700, fontSize: '1.2rem' }}>
                  {formatMoney(Number(paymentForm.cashAmount) - (currentOrder ? currentOrder.total : cartTotal))}
                </span>
              </div>
            )}
          </div>
        )}

        {(paymentMethod === 'bank' || paymentMethod === 'momo') && (
          <div style={{ background: 'var(--bg-lighter)', padding: 16, borderRadius: 12, marginBottom: 16, textAlign: 'center' }}>
            <h4 style={{ marginBottom: 12 }}>
              {paymentMethod === 'bank' ? 'Thanh Toán Chuyển Khoản' : 'Thanh Toán MoMo'}
            </h4>
            {paymentMethod === 'bank' && settings?.bankQr ? (
              <div>
                <img src={settings.bankQr} alt="QR Bank" style={{ maxWidth: 200, borderRadius: 8, margin: '0 auto 12px' }} />
                <div style={{ fontWeight: 600 }}>{settings.bankName}</div>
                <div className="text-muted">{settings.accountNumber} - {settings.accountName}</div>
              </div>
            ) : paymentMethod === 'momo' && settings?.momoQr ? (
              <div>
                <img src={settings.momoQr} alt="QR Momo" style={{ maxWidth: 200, borderRadius: 8, margin: '0 auto 12px' }} />
                <div style={{ fontWeight: 600 }}>MoMo: {settings.momoNumber}</div>
                <div className="text-muted">{settings.momoName}</div>
              </div>
            ) : (
              <div className="text-muted" style={{ fontStyle: 'italic', padding: 20 }}>
                Quản trị viên chưa cập nhật mã QR cho phương thức này.
              </div>
            )}
          </div>
        )}

        {(paymentMethod === 'bank' || paymentMethod === 'momo') && (
          <div className="form-group">
            <label>Mã Giao Dịch {paymentMethod === 'bank' ? 'Ngân Hàng' : 'MoMo'} (Nếu có)</label>
            <input type="text" className="form-control" placeholder="Nhập mã giao dịch"
              value={paymentForm.transactionCode}
              onChange={(e) => setPaymentForm({ ...paymentForm, transactionCode: e.target.value })} />
          </div>
        )}
      </Modal>
    </div>
  );
}
