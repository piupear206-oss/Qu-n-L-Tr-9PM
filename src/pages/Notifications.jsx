import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { Bell, BellRing, CheckCircle, Volume2, VolumeX, Trash2, ShoppingCart } from 'lucide-react';

export default function Notifications() {
  const { orders, updateOrder, inventory } = useData();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const lastNotifCountRef = useRef(0);

  // Collect all unread notifications from orders
  const allNotifications = useMemo(() => {
    const notifs = [];
    orders.forEach(order => {
      if (order.notifications) {
        order.notifications.forEach((n, idx) => {
          notifs.push({ ...n, orderId: order.id, notifIndex: idx, tableName: order.tableName });
        });
      }
    });
    return notifs.sort((a, b) => new Date(b.timestamp || b.time || 0) - new Date(a.timestamp || a.time || 0));
  }, [orders]);

  const unreadNotifs = allNotifications.filter(n => !n.read);

  const lowStockItems = useMemo(() => {
    return (inventory || []).filter(i => Number(i.quantity) <= 5);
  }, [inventory]);

  // Voice announcement for new notifications
  useEffect(() => {
    if (unreadNotifs.length > lastNotifCountRef.current && soundEnabled) {
      const latest = unreadNotifs[0];
      if (latest && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance();
        utterance.lang = 'vi-VN';
        if (latest.type === 'new_order') {
          utterance.text = `Có order mới! ${latest.tableName}. Các món: ${latest.items?.join(', ')}`;
        } else if (latest.type === 'add_items') {
          utterance.text = `Thêm món! ${latest.tableName}. ${latest.items?.join(', ')}`;
        } else if (latest.type === 'payment') {
          utterance.text = latest.message;
        } else {
          utterance.text = latest.message;
        }
        utterance.rate = 1.1;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      }
    }
    lastNotifCountRef.current = unreadNotifs.length;
  }, [unreadNotifs.length, soundEnabled]);

  const markAsRead = (orderId, notifIndex) => {
    const order = orders.find(o => o.id === orderId);
    if (order && order.notifications) {
      const updatedNotifs = [...order.notifications];
      updatedNotifs[notifIndex] = { ...updatedNotifs[notifIndex], read: true };
      updateOrder(orderId, { notifications: updatedNotifs });
    }
  };

  const markAllRead = () => {
    orders.forEach(order => {
      if (order.notifications?.some(n => !n.read)) {
        const updatedNotifs = order.notifications.map(n => ({ ...n, read: true }));
        updateOrder(order.id, { notifications: updatedNotifs });
      }
    });
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'new_order': return '🛒';
      case 'add_items': return '➕';
      case 'payment': return '💳';
      default: return '📢';
    }
  };

  const getNotifColor = (type) => {
    switch (type) {
      case 'new_order': return 'var(--accent-primary-light)';
      case 'add_items': return 'var(--accent-warning)';
      case 'payment': return 'var(--accent-success)';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <h1>🔔 Thông Báo Order</h1>
        <p>Nhận thông báo khi nhân viên gửi order mới</p>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <span className="badge badge-danger" style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
            {unreadNotifs.length} chưa đọc
          </span>
          <button className={`btn btn-sm ${soundEnabled ? 'btn-success' : 'btn-outline'}`}
            onClick={() => setSoundEnabled(!soundEnabled)}>
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            {soundEnabled ? ' Âm thanh BẬT' : ' Âm thanh TẮT'}
          </button>
        </div>
        {unreadNotifs.length > 0 && (
          <button className="btn btn-outline btn-sm" onClick={markAllRead}>
            <CheckCircle size={16} /> Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {lowStockItems.length > 0 && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--accent-danger)', borderRadius: 12, padding: 16, marginBottom: 24, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ background: 'var(--accent-danger)', padding: 8, borderRadius: '50%', color: '#fff', flexShrink: 0 }}>
            <BellRing size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ color: 'var(--accent-danger)', marginBottom: 8, fontSize: '1.05rem', fontWeight: 600 }}>Cảnh Báo Dây Chuyền Hết Tồn Kho (Auto-Bot)</h4>
            <p style={{ color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: 12 }}>Các nguyên liệu sau đang ở điểm giới hạn (&le; 5), dây chuyền yêu cầu ưu tiên nhập kho ngay lập tức:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {lowStockItems.map(item => (
                 <span key={item.id} className="badge badge-danger" style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
                    📦 {item.name} (Còn: {item.quantity} {item.unit})
                 </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {allNotifications.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Bell size={48} />
            <p>Chưa có thông báo nào</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {allNotifications.map((notif, i) => (
            <div key={`${notif.orderId}-${notif.notifIndex}-${i}`}
              className="card"
              style={{
                padding: '16px 20px',
                borderLeft: `4px solid ${getNotifColor(notif.type)}`,
                opacity: notif.read ? 0.6 : 1,
                background: notif.read ? 'var(--bg-card)' : 'rgba(124, 58, 237, 0.05)',
                cursor: 'pointer',
              }}
              onClick={() => !notif.read && markAsRead(notif.orderId, notif.notifIndex)}
            >
              <div className="flex-between">
                <div className="flex gap-1" style={{ alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.5rem' }}>{getNotifIcon(notif.type)}</span>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{notif.message}</div>
                    {notif.items && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Món: {notif.items.join(' · ')}
                      </div>
                    )}
                    {notif.note && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--accent-warning)', marginTop: 4, fontStyle: 'italic' }}>
                        📝 Ghi chú: {notif.note}
                      </div>
                    )}
                    <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: 4 }}>
                      {new Date(notif.timestamp || notif.time || Date.now()).toLocaleString('vi-VN')}
                    </div>
                  </div>
                </div>
                {!notif.read && (
                  <span className="badge badge-purple" style={{ flexShrink: 0 }}>Mới</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
