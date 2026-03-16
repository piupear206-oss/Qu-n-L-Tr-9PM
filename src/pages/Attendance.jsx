import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';
import { Camera, Clock, Search, Plus, Trash2, CheckCircle, UserCheck, Edit2 } from 'lucide-react';

const DEFAULT_SHIFTS = [
  { id: 'morning', name: 'Ca Sáng', start: '08:00', end: '12:00' },
  { id: 'afternoon', name: 'Ca Chiều', start: '12:00', end: '17:00' },
  { id: 'evening', name: 'Ca Tối', start: '17:00', end: '22:00' },
  { id: 'full', name: 'Ca Full', start: '08:00', end: '22:00' },
];

function loadShifts() {
  try { const d = localStorage.getItem('9pm_shifts'); return d ? JSON.parse(d) : DEFAULT_SHIFTS; } catch { return DEFAULT_SHIFTS; }
}

export default function Attendance() {
  const { attendance, addAttendanceRecord, deleteAttendanceRecord, employees } = useData();
  const { user } = useAuth();
  const [shifts, setShifts] = useState(loadShifts);
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().slice(0, 10));
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(null);
  const [shiftForm, setShiftForm] = useState({ name: '', start: '', end: '' });
  const [manualForm, setManualForm] = useState({ employeeId: '', shiftId: '', type: 'checkin', note: '' });

  useEffect(() => { localStorage.setItem('9pm_shifts', JSON.stringify(shifts)); }, [shifts]);

  const filteredRecords = attendance.filter(r => {
    const matchDate = new Date(r.timestamp).toISOString().slice(0, 10) === filterDate;
    const matchSearch = !search || r.employeeName?.toLowerCase().includes(search.toLowerCase());
    return matchDate && matchSearch;
  }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const addShift = () => {
    if (!shiftForm.name || !shiftForm.start || !shiftForm.end) return;
    const newShift = { id: 'shift_' + Date.now(), ...shiftForm };
    setShifts(prev => [...prev, newShift]);
    setShiftForm({ name: '', start: '', end: '' });
    setShowShiftModal(false);
  };

  const deleteShift = (id) => {
    if (window.confirm('Xóa ca làm này?')) {
      setShifts(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleManualCheckin = () => {
    if (!manualForm.employeeId || !manualForm.shiftId) return;
    const emp = employees.find(e => e.id === manualForm.employeeId);
    const shift = shifts.find(s => s.id === manualForm.shiftId);
    addAttendanceRecord({
      employeeId: manualForm.employeeId,
      employeeName: emp?.name || '',
      type: manualForm.type,
      shiftId: manualForm.shiftId,
      shiftName: shift?.name,
      shiftStart: shift?.start,
      shiftEnd: shift?.end,
      actualTime: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      isLate: false,
      lateMinutes: 0,
      method: 'manual',
      note: manualForm.note || `${user?.name || 'Quản lí'} xác nhận thủ công`,
      approvedByAdmin: true,
      approvedBy: user?.name || 'Quản lí',
    });
    setShowManualModal(false);
    setManualForm({ employeeId: '', shiftId: '', type: 'checkin', note: '' });
  };

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <h1>📸 Quản Lí Chấm Công</h1>
        <p>Xem ảnh chấm công, quản lí ca làm, xác nhận thủ công</p>
      </div>

      {/* Shift Management */}
      <div className="card mb-2">
        <div className="flex-between" style={{ marginBottom: 12 }}>
          <h3>⏰ Ca Làm Việc</h3>
          <button className="btn btn-primary btn-sm" onClick={() => setShowShiftModal(true)}>
            <Plus size={16} /> Thêm Ca
          </button>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {shifts.map(shift => (
            <div key={shift.id} className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, flex: '0 0 auto' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{shift.name}</div>
                <div className="text-muted" style={{ fontSize: '0.8rem' }}>{shift.start} - {shift.end}</div>
              </div>
              <button className="btn btn-ghost btn-sm text-danger" onClick={() => deleteShift(shift.id)}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-input">
            <Search size={16} />
            <input type="text" className="form-control" placeholder="Tìm nhân viên..." value={search}
              onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 36, width: 200 }} />
          </div>
          <input type="date" className="form-control" value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)} style={{ width: 180 }} />
        </div>
        <button className="btn btn-success" onClick={() => setShowManualModal(true)}>
          <UserCheck size={18} /> Chấm Công Thủ Công
        </button>
      </div>

      {/* Records table */}
      {filteredRecords.length === 0 ? (
        <div className="card"><div className="empty-state"><Camera size={48} /><p>Không có dữ liệu chấm công</p></div></div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ảnh</th>
                <th>Nhân Viên</th>
                <th>Ca Làm</th>
                <th>Giờ Thực</th>
                <th>Loại</th>
                <th>Phương Thức</th>
                <th>Trạng Thái</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map(r => (
                <tr key={r.id}>
                  <td>
                    {r.photo ? (
                      <img src={r.photo} alt="" className="attendance-photo"
                        style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', cursor: 'pointer' }}
                        onClick={() => setShowPhotoModal(r)} />
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td style={{ fontWeight: 600 }}>{r.employeeName}</td>
                  <td>
                    <div>{r.shiftName || '-'}</div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>{r.shiftStart}-{r.shiftEnd}</div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{r.actualTime}</td>
                  <td>
                    <span className={`badge ${r.type === 'checkin' ? 'badge-success' : 'badge-danger'}`}>
                      {r.type === 'checkin' ? '✅ Vào' : '🔴 Ra'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${r.method === 'manual' ? 'badge-warning' : 'badge-info'}`}>
                      {r.method === 'manual' ? '✋ Thủ công' : '📸 Camera'}
                    </span>
                  </td>
                  <td>
                    {r.isLate && <span className="badge badge-danger">Trễ {r.lateMinutes}p</span>}
                    {r.approvedByAdmin && <span className="badge badge-success" style={{ marginLeft: 4 }}>Duyệt ✓</span>}
                    {!r.isLate && !r.approvedByAdmin && <span className="badge badge-success">Đúng giờ</span>}
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm text-danger" onClick={() => { if (window.confirm('Xóa bản ghi chấm công này?')) deleteAttendanceRecord(r.id); }}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Shift Modal */}
      <Modal isOpen={showShiftModal} onClose={() => setShowShiftModal(false)} title="Thêm Ca Làm"
        footer={<><button className="btn btn-outline" onClick={() => setShowShiftModal(false)}>Hủy</button>
          <button className="btn btn-primary" onClick={addShift}>Thêm</button></>}>
        <div className="form-group"><label>Tên Ca Làm *</label>
          <input type="text" className="form-control" placeholder="VD: Ca Khuya"
            value={shiftForm.name} onChange={(e) => setShiftForm({ ...shiftForm, name: e.target.value })} /></div>
        <div className="form-row">
          <div className="form-group"><label>Giờ Bắt Đầu *</label>
            <input type="time" className="form-control" value={shiftForm.start}
              onChange={(e) => setShiftForm({ ...shiftForm, start: e.target.value })} /></div>
          <div className="form-group"><label>Giờ Kết Thúc *</label>
            <input type="time" className="form-control" value={shiftForm.end}
              onChange={(e) => setShiftForm({ ...shiftForm, end: e.target.value })} /></div>
        </div>
      </Modal>

      {/* Manual Check-in Modal */}
      <Modal isOpen={showManualModal} onClose={() => setShowManualModal(false)} title="Chấm Công Thủ Công"
        footer={<><button className="btn btn-outline" onClick={() => setShowManualModal(false)}>Hủy</button>
          <button className="btn btn-success" onClick={handleManualCheckin}><UserCheck size={16} /> Xác Nhận</button></>}>
        <div style={{ padding: '10px 16px', marginBottom: 16, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, fontSize: '0.85rem', color: 'var(--accent-warning)' }}>
          ⚠️ Chấm công thủ công cho nhân viên quên check-in/out
        </div>
        <div className="form-group"><label>Nhân Viên *</label>
          <select className="form-control" value={manualForm.employeeId}
            onChange={(e) => setManualForm({ ...manualForm, employeeId: e.target.value })}>
            <option value="">Chọn nhân viên</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select></div>
        <div className="form-group"><label>Ca Làm *</label>
          <select className="form-control" value={manualForm.shiftId}
            onChange={(e) => setManualForm({ ...manualForm, shiftId: e.target.value })}>
            <option value="">Chọn ca</option>
            {shifts.map(s => <option key={s.id} value={s.id}>{s.name} ({s.start}-{s.end})</option>)}
          </select></div>
        <div className="form-group"><label>Loại</label>
          <div className="btn-group">
            <button className={`btn ${manualForm.type === 'checkin' ? 'btn-success' : 'btn-outline'}`}
              onClick={() => setManualForm({ ...manualForm, type: 'checkin' })}>Check-in</button>
            <button className={`btn ${manualForm.type === 'checkout' ? 'btn-danger' : 'btn-outline'}`}
              onClick={() => setManualForm({ ...manualForm, type: 'checkout' })}>Check-out</button>
          </div></div>
        <div className="form-group"><label>Ghi Chú</label>
          <input type="text" className="form-control" placeholder={`VD: Quên chấm công, ${user?.name || 'quản lí'} xác nhận`}
            value={manualForm.note} onChange={(e) => setManualForm({ ...manualForm, note: e.target.value })} /></div>
      </Modal>

      {/* Photo Zoom Modal */}
      <Modal isOpen={!!showPhotoModal} onClose={() => setShowPhotoModal(null)} title="Ảnh Chấm Công" size="lg">
        {showPhotoModal && (
          <div style={{ textAlign: 'center' }}>
            <img src={showPhotoModal.photo} alt="" style={{ maxWidth: '100%', borderRadius: 12 }} />
            <div style={{ marginTop: 16 }}>
              <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>{showPhotoModal.employeeName}</p>
              <p className="text-muted">{showPhotoModal.shiftName} · {showPhotoModal.actualTime} · {new Date(showPhotoModal.timestamp).toLocaleDateString('vi-VN')}</p>
              <p>{showPhotoModal.method === 'manual' ? `✋ Thủ công (${showPhotoModal.approvedBy || 'Quản lí'} xác nhận)` : '📸 Camera'}</p>
              {showPhotoModal.isLate && <p className="text-danger">⚠️ Trễ {showPhotoModal.lateMinutes} phút</p>}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
