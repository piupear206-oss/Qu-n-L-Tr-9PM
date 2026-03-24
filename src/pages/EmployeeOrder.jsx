import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';
import { ShoppingCart, Minus, Plus, X, CreditCard, Banknote, Smartphone, CheckCircle, Printer, Send } from 'lucide-react';

export default function EmployeeOrder() {
  const { products, categories, tables, addOrder, updateTable, orders, updateOrder, deleteOrder, settings } = useData();
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
  const [addingToOrder, setAddingToOrder] = useState(null); // existing order to add items to

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
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        const newQty = i.qty + delta;
        return newQty > 0 ? { ...i, qty: newQty } : i;
      }
      return i;
    }).filter(i => i.qty > 0));
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));
  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const formatMoney = (n) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

  // Check if table has existing active order
  const getActiveOrder = (tableId) => {
    return orders.find(o => o.tableId === tableId && o.status === 'pending');
  };

  const handleSelectTable = (table) => {
    const existingOrder = getActiveOrder(table.id);
    if (existingOrder) {
      setAddingToOrder(existingOrder);
      setCart([]);
    } else {
      setAddingToOrder(null);
      setCart([]);
    }
    setSelectedTable(table);
    if (table.status === 'available') {
      updateTable(table.id, { status: 'occupied' });
    }
  };

  const handleSendOrder = () => {
    if (cart.length === 0) return;

    if (addingToOrder) {
      // Add items to existing order
      const updatedItems = [...(addingToOrder.items || [])];
      cart.forEach(cartItem => {
        const existing = updatedItems.find(i => i.id === cartItem.id);
        if (existing) {
          existing.qty += cartItem.qty;
        } else {
          updatedItems.push({ id: cartItem.id, name: cartItem.name, price: cartItem.price, qty: cartItem.qty, emoji: cartItem.emoji });
        }
      });
      const newTotal = updatedItems.reduce((sum, i) => sum + i.price * i.qty, 0);
      updateOrder(addingToOrder.id, {
        items: updatedItems,
        total: newTotal,
        note: orderNote ? (addingToOrder.note ? `${addingToOrder.note} | ${orderNote}` : orderNote) : addingToOrder.note,
        lastUpdatedBy: user?.name || 'Nhân viên',
        lastUpdatedAt: new Date().toISOString(),
        notifications: [...(addingToOrder.notifications || []), {
          type: 'add_items',
          message: `${user?.name || 'Nhân viên'} đã thêm ${cart.length} món vào ${selectedTable.name}`,
          items: cart.map(i => `${i.qty}x ${i.name}`),
          timestamp: new Date().toISOString(),
          read: false,
        }]
      });
    } else {
      // Create new order
      const order = addOrder({
        tableId: selectedTable.id,
        tableName: selectedTable.name,
        items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty, emoji: i.emoji })),
        total: cartTotal,
        employeeName: user?.name || 'Nhân viên',
        note: orderNote,
        status: 'pending',
        notifications: [{
          type: 'new_order',
          message: `${user?.name || 'Nhân viên'} đã order ${selectedTable.name}`,
          items: cart.map(i => `${i.qty}x ${i.name}`),
          timestamp: new Date().toISOString(),
          read: false,
        }]
      });
      setCurrentOrder(order);
    }

    setCart([]);
    setOrderNote('');
    alert(`✅ Đã gửi order ${selectedTable.name} thành công! Admin sẽ nhận được thông báo.`);
    setSelectedTable(null);
    setAddingToOrder(null);
  };

  const handlePayment = () => {
    if (!addingToOrder && !currentOrder) return;
    const orderToPayment = addingToOrder || orders.find(o => o.tableId === selectedTable?.id && o.status === 'pending');
    if (!orderToPayment) return;

    if (paymentMethod === 'cash') {
      updateOrder(orderToPayment.id, {
        status: 'paid',
        paymentMethod,
        cashReceived: Number(paymentForm.cashAmount),
        changeAmount: Number(paymentForm.cashAmount) - orderToPayment.total,
        paidBy: user?.name || 'Nhân viên',
        paidAt: new Date().toISOString(),
        notifications: [...(orderToPayment.notifications || []), {
          type: 'payment',
          message: `${user?.name} đã thu tiền mặt ${orderToPayment.tableName} - ${formatMoney(orderToPayment.total)}`,
          timestamp: new Date().toISOString(),
          read: false,
        }]
      });
      if (orderToPayment.tableId) {
        updateTable(orderToPayment.tableId, { status: 'available' });
      }
      setCurrentOrder(orderToPayment);
      setShowPayment(false);
      setShowBill(true);
    } else {
      // Yêu cầu xác nhận thanh toán QR
      updateOrder(orderToPayment.id, {
        status: 'pending_payment',
        paymentMethod,
        transactionCode: paymentForm.transactionCode,
        requestedBy: user?.name,
        requestedAt: new Date().toISOString(),
        notifications: [...(orderToPayment.notifications || []), {
          type: 'payment_request',
          message: `${user?.name} yêu cầu xác nhận thanh toán ${paymentMethod === 'bank' ? 'CK' : 'MoMo'} cho ${orderToPayment.tableName} - ${formatMoney(orderToPayment.total)}`,
          timestamp: new Date().toISOString(),
          read: false,
        }]
      });
      alert('Đã gửi yêu cầu xác nhận thanh toán! Đang chờ Quản trị viên duyệt.');
      setShowPayment(false);
      resetOrder();
    }
  };

  const resetOrder = () => {
    setSelectedTable(null);
    setCart([]);
    setShowBill(false);
    setCurrentOrder(null);
    setPaymentForm({ cashAmount: '', transactionCode: '' });
    setPaymentMethod('cash');
    setOrderNote('');
    setAddingToOrder(null);
  };

  const handleRemoveFromCurrentOrder = (index) => {
    if (!window.confirm('Xóa món này khỏi order hiện tại?')) return;
    
    const targetOrder = addingToOrder || orders.find(o => o.id === selectedTable?.id && o.status === 'pending');
    if (!targetOrder) return;

    const newItems = [...targetOrder.items];
    const removedItem = newItems.splice(index, 1)[0];
    const newTotal = newItems.reduce((sum, item) => sum + item.price * item.qty, 0);

    if (newItems.length === 0) {
      deleteOrder(targetOrder.id);
      if (targetOrder.tableId) updateTable(targetOrder.tableId, { status: 'available' });
      alert('Order đã bị xóa vì không còn món nào.');
      resetOrder();
    } else {
      updateOrder(targetOrder.id, {
        items: newItems,
        total: newTotal,
        lastUpdatedBy: user?.name,
        lastUpdatedAt: new Date().toISOString()
      });
      if (addingToOrder) {
        setAddingToOrder({...addingToOrder, items: newItems, total: newTotal});
      } else if (currentOrder) {
        setCurrentOrder({...currentOrder, items: newItems, total: newTotal});
      }
    }
  };
  // Show Bill View
  if (showBill && currentOrder) {
    const paidOrder = orders.find(o => o.id === currentOrder.id) || currentOrder;
    return (
      <div className="animate-fade-in-up">
        <div className="page-header no-print">
          <h1>🧾 Hóa Đơn</h1>
          <div className="btn-group mt-1">
            <button className="btn btn-primary" onClick={() => window.print()}>
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
            <p style={{ fontSize: '0.75rem', color: '#999' }}>{new Date().toLocaleString('vi-VN')}</p>
            <p style={{ fontSize: '0.75rem' }}>Mã: #{paidOrder.id?.slice(-8).toUpperCase()}</p>
            <p style={{ fontSize: '0.75rem' }}>{paidOrder.tableName}</p>
            <p style={{ fontSize: '0.75rem' }}>NV: {paidOrder.paidBy || paidOrder.employeeName}</p>
          </div>
          <div className="bill-items">
            {paidOrder.items?.map((item, i) => (
              <div key={i} className="bill-item">
                <span>{item.qty}x {item.name}</span>
                <span>{formatMoney(item.price * item.qty)}</span>
              </div>
            ))}
          </div>
          <div className="bill-total">
            <span>TỔNG CỘNG:</span>
            <span>{formatMoney(paidOrder.total)}</span>
          </div>
          {paidOrder.note && (
            <div style={{ marginTop: 12, fontSize: '0.85rem', fontStyle: 'italic', padding: '8px', border: '1px dashed #ccc', borderRadius: 6 }}>
              <strong>Ghi chú:</strong> {paidOrder.note}
            </div>
          )}
          <div style={{ marginTop: 8, fontSize: '0.8rem' }}>
            <div className="bill-item">
              <span>Phương thức:</span>
              <span>{paidOrder.paymentMethod === 'cash' ? 'Tiền mặt' : paidOrder.paymentMethod === 'bank' ? 'Chuyển khoản' : 'MoMo'}</span>
            </div>
            {paidOrder.transactionCode && (
              <div className="bill-item"><span>Mã GD:</span><span>{paidOrder.transactionCode}</span></div>
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
        <h1>🛒 Order Món</h1>
        <p>Chọn bàn → Chọn món → Gửi về hệ thống</p>
      </div>

      {/* Table Selection */}
      {!selectedTable && (
        <div className="card mb-2">
          <h3 style={{ marginBottom: 16 }}>Chọn Bàn Để Order</h3>
          <div className="table-grid">
            {tables.map(table => {
              const activeOrder = getActiveOrder(table.id);
              return (
                <div key={table.id}
                  className={`table-item ${table.status}`}
                  onClick={() => handleSelectTable(table)}
                  style={activeOrder ? { borderColor: 'var(--accent-success)', boxShadow: '0 0 15px rgba(16,185,129,0.3)' } : {}}
                >
                  <div className="table-number">{table.name}</div>
                  <div className="table-status" style={{
                    color: table.status === 'available' ? 'var(--text-muted)' : 'var(--accent-success)'
                  }}>
                    {table.status === 'available' ? 'Trống' : activeOrder ? '🟢 Đang phục vụ' : 'Đang dùng'}
                  </div>
                  {activeOrder && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--accent-success)', marginTop: 4 }}>
                      {activeOrder.items?.length} món · {formatMoney(activeOrder.total)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Order Layout */}
      {selectedTable && (
        <div className="order-layout">
          <div className="order-products">
            <div className="flex-between mb-1">
              <div>
                <span className="badge badge-purple" style={{ fontSize: '0.9rem', padding: '6px 14px' }}>
                  📍 {selectedTable.name}
                </span>
              {addingToOrder && (
                <span className="badge badge-success" style={{ marginLeft: 8 }}>
                  Thêm món vào order hiện tại
                </span>
              )}
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => { setSelectedTable(null); setCart([]); setAddingToOrder(null); }}>
              ← Quay Lại
            </button>
          </div>

          {/* Show existing order items if adding to order */}
          {addingToOrder && (
            <div className="card mb-2" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h4 style={{ margin: 0 }}>📋 Order hiện tại ({addingToOrder.items?.length} món)</h4>
                <span className="badge badge-warning">⏳ Chưa TT</span>
              </div>
              {(addingToOrder || currentOrder).items?.map((item, i) => (
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
              {(addingToOrder || currentOrder).note && (
                <div style={{ marginTop: 8, padding: 8, background: 'var(--bg-lighter)', borderRadius: 6, fontSize: '0.85rem' }}>
                  <span className="text-muted">📝 Ghi chú: </span>
                  <strong>{(addingToOrder || currentOrder).note}</strong>
                </div>
              )}
              <div style={{ borderTop: '1px dashed var(--border-color)', marginTop: 8, paddingTop: 8, fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                <span>Tổng hóa đơn hiện tại:</span>
                <span className="text-accent">{formatMoney((addingToOrder || currentOrder).total)}</span>
              </div>
              <div style={{ marginTop: 16 }}>
                <button className="btn btn-success btn-block btn-lg" onClick={() => {
                  setSelectedTable({ ...selectedTable });
                  setShowPayment(true);
                }}>
                  <CreditCard size={20} /> Khách Yêu Cầu Thanh Toán
                </button>
              </div>
            </div>
          )}

            <div className="product-categories">
              <button className={`category-tab ${!selectedCategory ? 'active' : ''}`}
                onClick={() => setSelectedCategory('')}>Tất Cả</button>
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
          <div className="order-cart">
            <div className="order-cart-header">
              <span>🛒 {addingToOrder ? 'Khách Gọi Thêm Món' : 'Món Khách Gọi Lần 1'} ({cart.reduce((s, i) => s + i.qty, 0)})</span>
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
                <span>{addingToOrder ? 'Tổng tiền món gọi thêm:' : 'Tổng tiền order:'}</span>
                <span className="text-accent">{formatMoney(cartTotal)}</span>
              </div>
              <button className="btn btn-primary btn-block btn-lg" onClick={handleSendOrder} disabled={cart.length === 0}>
                <Send size={20} /> Chỉ Xác Nhận Món (Chưa TT)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      <Modal isOpen={showPayment} onClose={() => setShowPayment(false)} title="Thanh Toán" size="lg"
        footer={<>
          <button className="btn btn-outline" onClick={() => setShowPayment(false)}>Hủy</button>
          <button className="btn btn-success btn-lg" onClick={handlePayment}>
            <CheckCircle size={18} /> {paymentMethod === 'cash' ? 'Xác Nhận Thanh Toán' : 'Gửi Yêu Cầu Xác Nhận'}
          </button>
        </>}
      >
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-primary-light)' }}>
            {formatMoney(addingToOrder?.total || 0)}
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
              <input type="number" className="form-control" placeholder="Nhập số tiền"
                value={paymentForm.cashAmount}
                onChange={(e) => setPaymentForm({ ...paymentForm, cashAmount: e.target.value })} />
            </div>
            {paymentForm.cashAmount && Number(paymentForm.cashAmount) >= (addingToOrder?.total || 0) && (
              <div className="card" style={{ padding: 12, textAlign: 'center', borderColor: 'var(--accent-success)' }}>
                <span className="text-muted">Tiền thừa: </span>
                <span className="text-success" style={{ fontWeight: 700, fontSize: '1.2rem' }}>
                  {formatMoney(Number(paymentForm.cashAmount) - (addingToOrder?.total || 0))}
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
            <label>Mã Giao Dịch {paymentMethod === 'bank' ? 'Ngân Hàng' : 'MoMo'} (Tùy chọn)</label>
            <input type="text" className="form-control" placeholder="Nhập mã giao dịch nếu có"
              value={paymentForm.transactionCode}
              onChange={(e) => setPaymentForm({ ...paymentForm, transactionCode: e.target.value })} />
          </div>
        )}
      </Modal>
    </div>
  );
}
