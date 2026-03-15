import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import Modal from '../components/Modal';
import { ShoppingCart, Minus, Plus, X, Printer, CreditCard, Banknote, Smartphone, CheckCircle } from 'lucide-react';

export default function OrderManagement() {
  const { products, categories, tables, addOrder, updateTable, updateOrder } = useData();
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

  const handleCreateOrder = () => {
    if (cart.length === 0) return;
    setShowPayment(true);
  };

  const handlePayment = () => {
    const order = addOrder({
      tableId: selectedTable?.id || null,
      tableName: selectedTable?.name || 'Mang đi',
      items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty, emoji: i.emoji })),
      total: cartTotal,
      paymentMethod,
      transactionCode: paymentMethod !== 'cash' ? paymentForm.transactionCode : '',
      cashReceived: paymentMethod === 'cash' ? Number(paymentForm.cashAmount) : cartTotal,
      changeAmount: paymentMethod === 'cash' ? Number(paymentForm.cashAmount) - cartTotal : 0,
      note: orderNote,
      status: 'paid',
    });

    // Update table status if needed
    if (selectedTable) {
      updateTable(selectedTable.id, { status: 'available' });
    }

    setCurrentOrder(order);
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
              <CheckCircle size={18} /> Tạo Order Mới
            </button>
          </div>
        </div>

        <div className="bill-container">
          <div className="bill-header">
            <h2>☕ TIỆM TRÀ 9PM</h2>
            <p style={{ fontSize: '0.75rem', color: '#666' }}>Hóa đơn bán hàng</p>
            <p style={{ fontSize: '0.75rem', color: '#999' }}>
              {new Date(currentOrder.createdAt).toLocaleString('vi-VN')}
            </p>
            <p style={{ fontSize: '0.75rem' }}>Mã: #{currentOrder.id.slice(-8).toUpperCase()}</p>
            <p style={{ fontSize: '0.75rem' }}>{currentOrder.tableName}</p>
          </div>

          <div className="bill-items">
            {currentOrder.items.map((item, i) => (
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
        <h1>🛒 Order Món</h1>
        <p>Chọn bàn → Chọn món → Thanh toán</p>
      </div>

      {/* Table Selection */}
      {!selectedTable && (
        <div className="card mb-2">
          <h3 style={{ marginBottom: 16 }}>Chọn Bàn (hoặc bỏ qua cho Mang Đi)</h3>
          <div className="table-grid" style={{ marginBottom: 12 }}>
            {tables.map(table => (
              <div key={table.id}
                className={`table-item ${table.status}`}
                onClick={() => {
                  setSelectedTable(table);
                  updateTable(table.id, { status: 'occupied' });
                }}
              >
                <div className="table-number">{table.name}</div>
                <div className="table-status" style={{
                  color: table.status === 'available' ? 'var(--accent-success)' : 'var(--accent-danger)'
                }}>
                  {table.status === 'available' ? 'Trống' : 'Đang dùng'}
                </div>
              </div>
            ))}
          </div>
          <button className="btn btn-outline" onClick={() => setSelectedTable({ id: null, name: 'Mang đi' })}>
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
              <span className="badge badge-purple" style={{ fontSize: '0.9rem', padding: '6px 14px' }}>
                📍 {selectedTable.name}
              </span>
              <button className="btn btn-outline btn-sm" onClick={() => { setSelectedTable(null); setCart([]); }}>
                Đổi Bàn
              </button>
            </div>

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
              <span>🛒 Giỏ Hàng ({cart.reduce((s, i) => s + i.qty, 0)} món)</span>
              {cart.length > 0 && (
                <button className="btn btn-ghost btn-sm text-danger" onClick={() => setCart([])}>Xóa hết</button>
              )}
            </div>

            <div className="order-cart-items">
              {cart.length === 0 ? (
                <div className="empty-state" style={{ padding: 24 }}>
                  <ShoppingCart size={36} />
                  <p>Chưa có món nào</p>
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
                <input type="text" className="form-control" placeholder="Ghi chú order..." value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)} style={{ fontSize: '0.85rem' }} />
              </div>
              <div className="cart-total">
                <span>Tổng cộng:</span>
                <span className="text-accent">{formatMoney(cartTotal)}</span>
              </div>
              <button className="btn btn-primary btn-block btn-lg" onClick={handleCreateOrder} disabled={cart.length === 0}>
                <CreditCard size={20} /> Thanh Toán
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
            {formatMoney(cartTotal)}
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
            {paymentForm.cashAmount && Number(paymentForm.cashAmount) >= cartTotal && (
              <div className="card" style={{ padding: 12, textAlign: 'center', borderColor: 'var(--accent-success)' }}>
                <span className="text-muted">Tiền thừa: </span>
                <span className="text-success" style={{ fontWeight: 700, fontSize: '1.2rem' }}>
                  {formatMoney(Number(paymentForm.cashAmount) - cartTotal)}
                </span>
              </div>
            )}
          </div>
        )}

        {paymentMethod === 'bank' && (
          <div className="form-group">
            <label>Mã Giao Dịch Ngân Hàng *</label>
            <input type="text" className="form-control" placeholder="Nhập mã chuyển khoản"
              value={paymentForm.transactionCode}
              onChange={(e) => setPaymentForm({ ...paymentForm, transactionCode: e.target.value })} />
          </div>
        )}

        {paymentMethod === 'momo' && (
          <div className="form-group">
            <label>Mã Giao Dịch MoMo *</label>
            <input type="text" className="form-control" placeholder="Nhập mã giao dịch MoMo"
              value={paymentForm.transactionCode}
              onChange={(e) => setPaymentForm({ ...paymentForm, transactionCode: e.target.value })} />
          </div>
        )}
      </Modal>
    </div>
  );
}
