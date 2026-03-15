import React, { useState, useRef, useCallback } from 'react';
import { useData } from '../contexts/DataContext';
import { Camera, CameraOff, CheckCircle, Clock, User } from 'lucide-react';

export default function Attendance() {
  const { employees, attendance, addAttendanceRecord } = useData();
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [actionType, setActionType] = useState('checkin');
  const [message, setMessage] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 480, height: 360 }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
      setCapturedPhoto(null);
    } catch (err) {
      setMessage({ type: 'error', text: 'Không thể mở camera. Vui lòng cho phép truy cập camera.' });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    const photoData = canvas.toDataURL('image/jpeg', 0.7);
    setCapturedPhoto(photoData);
  };

  const handleSubmit = () => {
    if (!selectedEmployee || !capturedPhoto) {
      setMessage({ type: 'error', text: 'Vui lòng chọn nhân viên và chụp ảnh!' });
      return;
    }
    const emp = employees.find(e => e.id === selectedEmployee);
    addAttendanceRecord({
      employeeId: selectedEmployee,
      employeeName: emp?.name || '',
      type: actionType,
      photo: capturedPhoto,
    });
    setMessage({
      type: 'success',
      text: `${actionType === 'checkin' ? 'Check-in' : 'Check-out'} thành công cho ${emp?.name}!`
    });
    setCapturedPhoto(null);
    setTimeout(() => setMessage(null), 3000);
  };

  // Get today's attendance
  const today = new Date().toDateString();
  const todayAttendance = attendance.filter(a => new Date(a.timestamp).toDateString() === today);

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <h1>📸 Chấm Công</h1>
        <p>Chụp gương mặt để chấm công check-in / check-out</p>
      </div>

      {message && (
        <div className={`card mb-2`} style={{
          padding: '12px 20px',
          borderColor: message.type === 'success' ? 'var(--accent-success)' : 'var(--accent-danger)',
          background: message.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
        }}>
          <span style={{ color: message.type === 'success' ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
            {message.type === 'success' ? <CheckCircle size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} /> : null}
            {message.text}
          </span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Camera Section */}
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>📷 Camera Chấm Công</h3>

          <div className="form-group">
            <label>Chọn Nhân Viên *</label>
            <select
              className="form-control"
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
            >
              <option value="">-- Chọn nhân viên --</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Loại Chấm Công</label>
            <div className="btn-group">
              <button
                className={`btn ${actionType === 'checkin' ? 'btn-success' : 'btn-outline'}`}
                onClick={() => setActionType('checkin')}
              >
                Check-in
              </button>
              <button
                className={`btn ${actionType === 'checkout' ? 'btn-danger' : 'btn-outline'}`}
                onClick={() => setActionType('checkout')}
              >
                Check-out
              </button>
            </div>
          </div>

          <div className="camera-container mb-2">
            {cameraActive ? (
              <>
                <video ref={videoRef} autoPlay playsInline style={{ display: capturedPhoto ? 'none' : 'block' }} />
                {capturedPhoto && <img src={capturedPhoto} alt="Captured" style={{ width: '100%', borderRadius: 'var(--radius-lg)' }} />}
                <div className="camera-overlay" style={{ display: capturedPhoto ? 'none' : 'block' }} />
              </>
            ) : (
              <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <CameraOff size={48} style={{ marginBottom: 12, opacity: 0.5 }} />
                <p>Camera chưa được bật</p>
              </div>
            )}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>

          <div className="btn-group">
            {!cameraActive ? (
              <button className="btn btn-primary btn-block" onClick={startCamera}>
                <Camera size={18} /> Bật Camera
              </button>
            ) : (
              <>
                {!capturedPhoto ? (
                  <button className="btn btn-primary" onClick={capturePhoto}>
                    📸 Chụp Ảnh
                  </button>
                ) : (
                  <button className="btn btn-outline" onClick={() => setCapturedPhoto(null)}>
                    🔄 Chụp Lại
                  </button>
                )}
                <button className="btn btn-outline" onClick={stopCamera}>
                  <CameraOff size={18} /> Tắt Camera
                </button>
                {capturedPhoto && (
                  <button className="btn btn-success" onClick={handleSubmit}>
                    <CheckCircle size={18} /> Xác Nhận {actionType === 'checkin' ? 'Check-in' : 'Check-out'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Today's Attendance */}
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>
            <Clock size={20} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            Chấm Công Hôm Nay ({todayAttendance.length})
          </h3>

          {todayAttendance.length === 0 ? (
            <div className="empty-state">
              <User size={48} />
              <p>Chưa có ai chấm công hôm nay</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {todayAttendance.map(record => (
                <div key={record.id} className="cart-item" style={{ padding: 12 }}>
                  {record.photo && (
                    <img src={record.photo} alt="" className="attendance-photo" />
                  )}
                  <div className="cart-item-info">
                    <div className="name">{record.employeeName}</div>
                    <div className="price">
                      {new Date(record.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <span className={`badge ${record.type === 'checkin' ? 'badge-success' : 'badge-danger'}`}>
                    {record.type === 'checkin' ? 'Vào' : 'Ra'}
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
