import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';
import { ClipboardList, Search, Eye, Printer, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';

export default function OrderHistory() {
  const { orders, deleteOrder, updateOrder } = useData();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [deleteStep, setDeleteStep] = useState(0);

  const formatMoney = (n) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

  const filteredOrders = orders.filter(o =>
    o.tableName?.toLowerCase().includes(search.toLowerCase()) ||
    o.employeeName?.toLowerCase().includes(search.toLowerCase()) ||
    o.id?.includes(search)
  ).sort((a, b) => new Date(b.createdAt || b.timestamp) - new Date(a.createdAt || a.timestamp));

  const handleDelete = (order) => {
    setShowDeleteConfirm(order);
    setDeleteStep(0);
  };

  const confirmDelete = () => {
    if (deleteStep === 0) {
      setDeleteStep(1);
    } else {
      deleteOrder(showDeleteConfirm.id);
      setShowDeleteConfirm(null);
      setDeleteStep(0);
    }
  };

  const markAsPaid = (order) => {
    if (window.confirm(`Xác nhận đơn ${order.tableName} - ${formatMoney(order.total)} đã thanh toán?`)) {
      updateOrder(order.id, { status: 'paid', paidAt: new Date().toISOString(), paidBy: user?.name || 'Admin' });
    }
  };

  const printBill = (order) => {
    setSelectedOrder(order);
    setTimeout(() => window.print(), 300);
  };

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <h1>📋 Lịch Sử Order</h1>
        <p>{isAdmin ? 'Quản lí tất cả đơn hàng' : 'Xem lịch sử và in lại bill'}</p>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-input">
            <Search size={16} />
            <input type="text" className="form-control" placeholder="Tìm theo bàn, nhân viên..." value={search}
              onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 36, width: 280 }} />
          </div>
          <span className="badge badge-info">{filteredOrders.length} đơn</span>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="card"><div className="empty-state"><ClipboardList size={48} /><p>Chưa có đơn hàng nào</p></div></div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã Đơn</th>
                <th>Bàn</th>
                <th>Nhân Viên</th>
                <th>Số Món</th>
                <th>Tổng Tiền</th>
                <th>Thanh Toán</th>
                <th>Thời Gian</th>
                <th>Trạng Thái</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>#{order.id?.slice(-6).toUpperCase()}</td>
                  <td style={{ fontWeight: 600 }}>{order.tableName || '-'}</td>
                  <td>{order.employeeName || order.paidBy || '-'}</td>
                  <td>{order.items?.length || 0} món</td>
                  <td className="text-accent" style={{ fontWeight: 600 }}>{formatMoney(order.total || 0)}</td>
                  <td>
                    <span className="badge badge-info">
                      {order.paymentMethod === 'cash' ? '💵 Mặt' : order.paymentMethod === 'bank' ? '🏦 CK' : order.paymentMethod === 'momo' ? '📱 MoMo' : '-'}
                    </span>
                  </td>
                  <td className="text-muted" style={{ fontSize: '0.8rem' }}>
                    {new Date(order.createdAt || order.timestamp).toLocaleString('vi-VN')}
                  </td>
                  <td>
                    {order.status === 'paid' ? (
                      <span className="badge badge-success">✅ Đã TT</span>
                    ) : (
                      isAdmin ? (
                        <button className="btn btn-success btn-sm" onClick={() => markAsPaid(order)} title="Đánh dấu đã thanh toán">
                          <CheckCircle size={14} /> Xác nhận TT
                        </button>
                      ) : (
                        <span className="badge badge-warning">⏳ Chờ TT</span>
                      )
                    )}
                  </td>
                  <td>
                    <div className="btn-group">
                      <button className="btn btn-ghost btn-sm" onClick={() => setSelectedOrder(order)} title="Xem">
                        <Eye size={16} />
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => printBill(order)} title="In Bill">
                        <Printer size={16} />
                      </button>
                      {isAdmin && (
                        <button className="btn btn-ghost btn-sm text-danger" onClick={() => handleDelete(order)} title="Xóa">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}


      {/* Order Detail / Bill Modal */}
      <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title="Chi Tiết Đơn Hàng"
        footer={<>
          <button className="btn btn-outline" onClick={() => setSelectedOrder(null)}>Đóng</button>
          <button className="btn btn-primary" onClick={() => window.print()}>
            <Printer size={16} /> In Bill
          </button>
        </>}
      >
        {selectedOrder && (
          <div>
            <div className="bill-container">
              <div className="bill-header">
                <h2>☕ TIỆM TRÀ 9PM</h2>
                <p style={{ fontSize: '0.75rem', color: '#666' }}>Hóa đơn bán hàng</p>
                <p style={{ fontSize: '0.75rem', color: '#999' }}>
                  {new Date(selectedOrder.createdAt || selectedOrder.timestamp).toLocaleString('vi-VN')}
                </p>
                <p style={{ fontSize: '0.75rem' }}>Mã: #{selectedOrder.id?.slice(-8).toUpperCase()}</p>
                <p style={{ fontSize: '0.75rem' }}>{selectedOrder.tableName}</p>
                <p style={{ fontSize: '0.75rem' }}>NV: {selectedOrder.employeeName || selectedOrder.paidBy || '-'}</p>
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
                <span>{formatMoney(selectedOrder.total || 0)}</span>
              </div>
              <div style={{ marginTop: 8, fontSize: '0.8rem' }}>
                <div className="bill-item">
                  <span>Thanh toán:</span>
                  <span>{selectedOrder.paymentMethod === 'cash' ? 'Tiền mặt' : selectedOrder.paymentMethod === 'bank' ? 'Chuyển khoản' : 'MoMo'}</span>
                </div>
                {selectedOrder.transactionCode && (
                  <div className="bill-item"><span>Mã GD:</span><span>{selectedOrder.transactionCode}</span></div>
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

      {/* Delete Confirmation Modal - Admin Only */}
      <Modal isOpen={!!showDeleteConfirm} onClose={() => { setShowDeleteConfirm(null); setDeleteStep(0); }}
        title={deleteStep === 0 ? '⚠️ Xóa Bill' : '🚨 Xác Nhận Lần 2'}
        footer={<>
          <button className="btn btn-outline" onClick={() => { setShowDeleteConfirm(null); setDeleteStep(0); }}>Hủy</button>
          <button className="btn btn-danger" onClick={confirmDelete}>
            <Trash2 size={16} /> {deleteStep === 0 ? 'Xóa Bill Này' : 'XÁC NHẬN XÓA VĨNH VIỄN'}
          </button>
        </>}
      >
        {showDeleteConfirm && (
          <div style={{ textAlign: 'center' }}>
            <AlertTriangle size={48} style={{ color: deleteStep === 0 ? 'var(--accent-warning)' : 'var(--accent-danger)', marginBottom: 16 }} />
            {deleteStep === 0 ? (
              <>
                <p style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: 8 }}>Bạn có chắc muốn xóa bill này?</p>
                <p className="text-muted">
                  {showDeleteConfirm.tableName} · {formatMoney(showDeleteConfirm.total || 0)} ·
                  #{showDeleteConfirm.id?.slice(-6).toUpperCase()}
                </p>
              </>
            ) : (
              <>
                <p style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--accent-danger)', marginBottom: 8 }}>
                  ĐÂY LÀ THAO TÁC KHÔNG THỂ HOÀN TÁC!
                </p>
                <p className="text-muted">Bill sẽ bị xóa vĩnh viễn khỏi hệ thống.</p>
                <p style={{ marginTop: 8, fontWeight: 600 }}>Nhấn "XÁC NHẬN XÓA VĨNH VIỄN" để tiếp tục.</p>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
