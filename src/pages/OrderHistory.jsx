import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { ClipboardList, Eye, Printer, Search } from 'lucide-react';
import Modal from '../components/Modal';

export default function OrderHistory() {
  const { orders } = useData();
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const filteredOrders = orders
    .filter(o => {
      const s = search.toLowerCase();
      return o.id.includes(s) || o.tableName?.toLowerCase().includes(s) ||
        o.paymentMethod?.toLowerCase().includes(s);
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const formatMoney = (n) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

  const getMethodLabel = (m) => {
    if (m === 'cash') return '💵 Tiền mặt';
    if (m === 'bank') return '🏦 Chuyển khoản';
    if (m === 'momo') return '📱 MoMo';
    return m;
  };

  const handlePrint = (order) => {
    setSelectedOrder(order);
    setTimeout(() => window.print(), 300);
  };

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <h1>📋 Lịch Sử Order</h1>
        <p>Xem lại các đơn hàng đã tạo</p>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-input">
            <Search size={16} />
            <input type="text" className="form-control" placeholder="Tìm theo mã, bàn..." value={search}
              onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 36, width: 260 }} />
          </div>
        </div>
        <span className="text-muted">{filteredOrders.length} đơn hàng</span>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <ClipboardList size={48} />
            <p>Chưa có lịch sử order nào</p>
          </div>
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã Đơn</th>
                <th>Bàn</th>
                <th>Món</th>
                <th>Tổng Tiền</th>
                <th>Thanh Toán</th>
                <th>Trạng Thái</th>
                <th>Thời Gian</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order.id}>
                  <td style={{ fontWeight: 600 }}>#{order.id.slice(-6).toUpperCase()}</td>
                  <td>{order.tableName || '-'}</td>
                  <td>{order.items?.length || 0} món</td>
                  <td className="text-accent" style={{ fontWeight: 600 }}>{formatMoney(order.total || 0)}</td>
                  <td>{getMethodLabel(order.paymentMethod)}</td>
                  <td>
                    <span className={`badge ${order.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                      {order.status === 'paid' ? 'Đã thanh toán' : 'Chờ'}
                    </span>
                  </td>
                  <td className="text-muted">{new Date(order.createdAt).toLocaleString('vi-VN')}</td>
                  <td>
                    <div className="btn-group">
                      <button className="btn btn-ghost btn-sm" onClick={() => setSelectedOrder(order)}>
                        <Eye size={16} />
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handlePrint(order)}>
                        <Printer size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title="Chi Tiết Đơn Hàng"
        footer={
          <button className="btn btn-primary" onClick={() => { window.print(); }}>
            <Printer size={18} /> In Bill
          </button>
        }
      >
        {selectedOrder && (
          <div>
            <div className="bill-container" style={{ margin: '0 auto' }}>
              <div className="bill-header">
                <h2>☕ TIỆM TRÀ 9PM</h2>
                <p style={{ fontSize: '0.75rem', color: '#666' }}>Hóa đơn bán hàng</p>
                <p style={{ fontSize: '0.75rem', color: '#999' }}>
                  {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}
                </p>
                <p style={{ fontSize: '0.75rem' }}>Mã: #{selectedOrder.id.slice(-8).toUpperCase()}</p>
                <p style={{ fontSize: '0.75rem' }}>{selectedOrder.tableName}</p>
              </div>
              <div className="bill-items">
                {selectedOrder.items?.map((item, i) => (
                  <div key={i} className="bill-item">
                    <span>{item.qty}x {item.name}</span>
                    <span>{formatMoney(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>
              <div className="bill-total">
                <span>TỔNG CỘNG:</span>
                <span>{formatMoney(selectedOrder.total)}</span>
              </div>
              <div style={{ marginTop: 8, fontSize: '0.8rem' }}>
                <div className="bill-item">
                  <span>Phương thức:</span>
                  <span>{getMethodLabel(selectedOrder.paymentMethod)}</span>
                </div>
                {selectedOrder.transactionCode && (
                  <div className="bill-item">
                    <span>Mã GD:</span>
                    <span>{selectedOrder.transactionCode}</span>
                  </div>
                )}
              </div>
              <div className="bill-footer">
                <p>--- Cảm ơn quý khách! ---</p>
                <p>Hẹn gặp lại 🍵</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
