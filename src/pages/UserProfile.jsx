import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Smartphone, Monitor, Clock, LogOut } from 'lucide-react';

export default function UserProfile() {
  const { user, sessions, logoutSession } = useAuth();

  const getDeviceIcon = (userAgent) => {
    const ua = userAgent?.toLowerCase() || '';
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return <Smartphone size={24} className="text-accent" />;
    }
    return <Monitor size={24} className="text-primary" />;
  };

  const formatTime = (isoString) => {
    if (!isoString) return 'Không rõ';
    const date = new Date(isoString);
    return date.toLocaleString('vi-VN');
  };

  // Lọc các session thuộc về user hiện tại
  const mySessions = sessions?.filter(s => s.userId === user?.id) || [];
  
  // Xác định session của truy cập hiện tại
  const currentSessionId = localStorage.getItem('9pm_session_id');

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <h1>👤 Hồ Sơ Của Tôi</h1>
        <p>Quản lí tài khoản và các thiết bị đang đăng nhập</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-lighter)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
              {user?.role === 'admin' ? '👑' : '🧑‍🍳'}
            </div>
            <div>
              <h2 style={{ margin: '0 0 4px 0' }}>{user?.name}</h2>
              <div style={{ color: 'var(--text-muted)' }}>@{user?.username} · {user?.role === 'admin' ? 'Quản Trị Viên' : 'Nhân Viên'}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <h3><Shield size={20} style={{ verticalAlign: 'middle', marginRight: 8 }} /> Các Thiết Bị Đang Đăng Nhập</h3>
          </div>
          <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: 20 }}>
            Đây là danh sách các thiết bị đã đăng nhập vào tài khoản của bạn. Nếu có thiết bị lạ, hãy đăng xuất ngay.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {mySessions.length === 0 ? (
              <div className="empty-state" style={{ padding: 20 }}>
                <p>Không có dữ liệu thiết bị.</p>
              </div>
            ) : (
              mySessions.map((session, index) => {
                const isCurrent = session.sessionId === currentSessionId;
                return (
                  <div key={session.sessionId || index} className="cart-item" style={{ padding: '16px', background: isCurrent ? 'rgba(59, 130, 246, 0.05)' : 'var(--bg-lighter)', border: isCurrent ? '1px solid var(--accent-primary-light)' : 'none' }}>
                    <div style={{ background: 'var(--bg-dark)', padding: 12, borderRadius: 12 }}>
                      {getDeviceIcon(session.userAgent)}
                    </div>
                    <div className="cart-item-info" style={{ marginLeft: 16 }}>
                      <div className="name" style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                        {session.deviceInfo || 'Thiết bị không xác định'}
                        {isCurrent && <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Thiết bị hiện tại</span>}
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.8rem', marginTop: 4 }}>
                        Trình duyệt: {session.browser || 'Không rõ'}
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        <Clock size={12} /> Đăng nhập lúc: {formatTime(session.loginTime)}
                      </div>
                    </div>
                    {!isCurrent && (
                      <button 
                        className="btn btn-outline btn-sm text-danger" 
                        onClick={() => {
                          if (window.confirm('Bạn có chắc chắn muốn đăng xuất thiết bị này?')) {
                            logoutSession(session.sessionId);
                          }
                        }}
                      >
                        <LogOut size={16} style={{ marginRight: 4 }} /> Kích ra
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
