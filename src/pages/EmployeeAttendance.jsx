import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Camera, CameraOff, CheckCircle, Clock, User } from 'lucide-react';

const DEFAULT_SHIFTS = [
  { id: 'morning', name: 'Ca Sáng', start: '08:00', end: '12:00' },
  { id: 'afternoon', name: 'Ca Chiều', start: '12:00', end: '17:00' },
  { id: 'evening', name: 'Ca Tối', start: '17:00', end: '22:00' },
  { id: 'full', name: 'Ca Full', start: '08:00', end: '22:00' },
];

function getStoredShifts() {
  try {
    const d = localStorage.getItem('9pm_shifts');
    return d ? JSON.parse(d) : DEFAULT_SHIFTS;
  } catch { return DEFAULT_SHIFTS; }
}

export default function EmployeeAttendance() {
  const { user } = useAuth();
  const { attendance, addAttendanceRecord } = useData();
  const [selectedShift, setSelectedShift] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [actionType, setActionType] = useState('checkin');
  const [message, setMessage] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const shifts = getStoredShifts();

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 480, height: 360 } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraActive(true);
      setCapturedPhoto(null);
    } catch {
      setMessage({ type: 'error', text: 'Không thể mở camera.' });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current; const video = videoRef.current;
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    setCapturedPhoto(canvas.toDataURL('image/jpeg', 0.7));
  };

  const calculateActualHours = (shift, now) => {
    const [sh, sm] = shift.start.split(':').map(Number);
    const [eh, em] = shift.end.split(':').map(Number);
    const shiftStartMin = sh * 60 + sm;
    const shiftEndMin = eh * 60 + em;
    const nowMin = now.getHours() * 60 + now.getMinutes();

    if (actionType === 'checkin') {
      // If late, actual start = now (later). If early, actual start = shift start
      const actualStart = Math.max(nowMin, shiftStartMin);
      return { actualStart, shiftStart: shiftStartMin, shiftEnd: shiftEndMin, isLate: nowMin > shiftStartMin, lateMinutes: Math.max(0, nowMin - shiftStartMin) };
    }
    return {};
  };

  const handleSubmit = () => {
    if (!selectedShift) { setMessage({ type: 'error', text: 'Vui lòng chọn ca làm trước!' }); return; }
    if (!capturedPhoto) { setMessage({ type: 'error', text: 'Vui lòng chụp ảnh chấm công!' }); return; }

    const shift = shifts.find(s => s.id === selectedShift);
    const now = new Date();
    const lateInfo = calculateActualHours(shift, now);

    addAttendanceRecord({
      employeeId: user?.employeeId || user?.id,
      employeeName: user?.name || '',
      type: actionType,
      photo: capturedPhoto,
      shiftId: selectedShift,
      shiftName: shift?.name,
      shiftStart: shift?.start,
      shiftEnd: shift?.end,
      actualTime: now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      isLate: lateInfo.isLate || false,
      lateMinutes: lateInfo.lateMinutes || 0,
      method: 'camera',
    });

    const lateMsg = lateInfo.isLate ? ` (Trễ ${lateInfo.lateMinutes} phút, thời gian bị trừ)` : '';
    setMessage({ type: 'success', text: `${actionType === 'checkin' ? 'Check-in' : 'Check-out'} thành công!${lateMsg}` });
    setCapturedPhoto(null);
    stopCamera();
    setTimeout(() => setMessage(null), 5000);
  };

  const today = new Date().toDateString();
  const myTodayRecords = attendance.filter(a =>
    new Date(a.timestamp).toDateString() === today &&
    (a.employeeId === user?.employeeId || a.employeeId === user?.id)
  );

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <h1>📸 Chấm Công</h1>
        <p>Chọn ca làm → Chụp ảnh → Check-in / Check-out</p>
      </div>

      {message && (
        <div className="card mb-2" style={{
          padding: '12px 20px',
          borderColor: message.type === 'success' ? 'var(--accent-success)' : 'var(--accent-danger)',
          background: message.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
        }}>
          <span style={{ color: message.type === 'success' ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
            {message.type === 'success' && <CheckCircle size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />}
            {message.text}
          </span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>📷 Chấm Công</h3>

          {/* Step 1: Select shift */}
          <div className="form-group">
            <label>1. Chọn Ca Làm *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {shifts.map(shift => (
                <button key={shift.id}
                  className={`payment-option ${selectedShift === shift.id ? 'selected' : ''}`}
                  onClick={() => setSelectedShift(shift.id)}
                  style={{ padding: 12 }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{shift.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{shift.start} - {shift.end}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Select action */}
          <div className="form-group">
            <label>2. Loại Chấm Công</label>
            <div className="btn-group">
              <button className={`btn ${actionType === 'checkin' ? 'btn-success' : 'btn-outline'}`}
                onClick={() => setActionType('checkin')}>Check-in</button>
              <button className={`btn ${actionType === 'checkout' ? 'btn-danger' : 'btn-outline'}`}
                onClick={() => setActionType('checkout')}>Check-out</button>
            </div>
          </div>

          {/* Step 3: Camera */}
          <div className="form-group">
            <label>3. Chụp Ảnh Xác Nhận *</label>
            <div className="camera-container mb-2" style={{ 
              width: '100%', 
              height: 240, 
              background: '#000', 
              borderRadius: 'var(--radius-md)', 
              overflow: 'hidden', 
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {!cameraActive ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                  <CameraOff size={40} style={{ marginBottom: 8, opacity: 0.5, display: 'inline-block' }} />
                  <p style={{ margin: 0 }}>Bật camera để chấm công</p>
                </div>
              ) : (
                <>
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover', 
                      display: capturedPhoto ? 'none' : 'block' 
                    }} 
                  />
                  {capturedPhoto && (
                    <img 
                      src={capturedPhoto} 
                      alt="Captured" 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover' 
                      }} 
                    />
                  )}
                  {!capturedPhoto && (
                    <div className="camera-overlay" style={{ 
                      position: 'absolute', 
                      top: 0, left: 0, right: 0, bottom: 0, 
                      border: '2px solid rgba(255,255,255,0.2)',
                      pointerEvents: 'none'
                    }} />
                  )}
                </>
              )}
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
          </div>

          <div className="btn-group">
            {!cameraActive ? (
              <button className="btn btn-primary btn-block" onClick={startCamera} disabled={!selectedShift}>
                <Camera size={18} /> Bật Camera
              </button>
            ) : (
              <>
                {!capturedPhoto ? (
                  <button className="btn btn-primary" onClick={capturePhoto}>📸 Chụp Ảnh</button>
                ) : (
                  <button className="btn btn-outline" onClick={() => setCapturedPhoto(null)}>🔄 Chụp Lại</button>
                )}
                <button className="btn btn-outline" onClick={stopCamera}><CameraOff size={18} /></button>
                {capturedPhoto && (
                  <button className="btn btn-success" onClick={handleSubmit}>
                    <CheckCircle size={18} /> Xác Nhận
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Today's records */}
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>
            <Clock size={20} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            Chấm Công Hôm Nay
          </h3>
          {myTodayRecords.length === 0 ? (
            <div className="empty-state"><User size={48} /><p>Chưa chấm công hôm nay</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {myTodayRecords.map(r => (
                <div key={r.id} className="cart-item" style={{ padding: 12 }}>
                  {r.photo && <img src={r.photo} alt="" className="attendance-photo" />}
                  <div className="cart-item-info">
                    <div className="name">{r.shiftName || 'N/A'} ({r.shiftStart}-{r.shiftEnd})</div>
                    <div className="price">{r.actualTime} · {r.method === 'manual' ? '✋ Thủ công' : '📸 Camera'}</div>
                    {r.isLate && <div style={{ color: 'var(--accent-danger)', fontSize: '0.75rem' }}>⚠️ Trễ {r.lateMinutes} phút</div>}
                  </div>
                  <span className={`badge ${r.type === 'checkin' ? 'badge-success' : 'badge-danger'}`}>
                    {r.type === 'checkin' ? 'Vào' : 'Ra'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
