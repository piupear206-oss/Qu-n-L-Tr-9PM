import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import Modal from '../components/Modal';
import { Calculator, Plus, Edit2, Trash2, Calendar, Clock } from 'lucide-react';

export default function SalaryManagement() {
  const { employees, salaryRecords, addSalaryRecord, updateSalaryRecord, deleteSalaryRecord } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [form, setForm] = useState({
    employeeId: '',
    date: '',
    startTime: '',
    endTime: '',
    note: ''
  });

  const calculateHours = (start, end) => {
    if (!start || !end) return 0;
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;
    const diff = endMin - startMin;
    return diff > 0 ? Math.round((diff / 60) * 10) / 10 : 0;
  };

  const formatMoney = (n) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

  // Filter records by month and employee
  const filteredRecords = useMemo(() => {
    return salaryRecords.filter(r => {
      const matchMonth = r.date?.startsWith(selectedMonth);
      const matchEmployee = !selectedEmployee || r.employeeId === selectedEmployee;
      return matchMonth && matchEmployee;
    }).sort((a, b) => a.date.localeCompare(b.date));
  }, [salaryRecords, selectedMonth, selectedEmployee]);

  // Calculate salary summary per employee
  const salarySummary = useMemo(() => {
    const monthRecords = salaryRecords.filter(r => r.date?.startsWith(selectedMonth));
    const summary = {};
    employees.forEach(emp => {
      const empRecords = monthRecords.filter(r => r.employeeId === emp.id);
      const totalHours = empRecords.reduce((sum, r) => sum + (r.hours || 0), 0);
      const hourlyRate = Number(emp.hourlyRate) || 0;
      summary[emp.id] = {
        employee: emp,
        totalHours,
        totalDays: empRecords.length,
        hourlyRate,
        totalSalary: totalHours * hourlyRate
      };
    });
    return summary;
  }, [employees, salaryRecords, selectedMonth]);

  const openAdd = () => {
    setEditingRecord(null);
    setForm({ employeeId: selectedEmployee || '', date: '', startTime: '09:00', endTime: '17:00', note: '' });
    setShowModal(true);
  };

  const openEdit = (record) => {
    setEditingRecord(record);
    setForm({
      employeeId: record.employeeId,
      date: record.date,
      startTime: record.startTime,
      endTime: record.endTime,
      note: record.note || ''
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.employeeId || !form.date || !form.startTime || !form.endTime) return;
    const hours = calculateHours(form.startTime, form.endTime);
    const record = { ...form, hours };
    if (editingRecord) {
      updateSalaryRecord(editingRecord.id, record);
    } else {
      addSalaryRecord(record);
    }
    setShowModal(false);
  };

  const handleDeleteRecord = (id) => {
    if (window.confirm('Xóa bản ghi giờ công này?')) {
      deleteSalaryRecord(id);
    }
  };

  const getEmployeeName = (id) => employees.find(e => e.id === id)?.name || 'N/A';

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <h1>💰 Bảng Lương Nhân Viên</h1>
        <p>Nhập giờ công và tính lương tự động cho nhân viên</p>
      </div>

      {/* Salary Summary Cards */}
      <div className="stat-cards">
        {employees.map(emp => {
          const data = salarySummary[emp.id];
          if (!data) return null;
          return (
            <div key={emp.id} className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setSelectedEmployee(emp.id === selectedEmployee ? '' : emp.id)}>
              <div className="stat-icon purple"><Calculator size={24} /></div>
              <div className="stat-info">
                <div className="label">{emp.name}</div>
                <div className="value" style={{ fontSize: '1.2rem' }}>{formatMoney(data.totalSalary)}</div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                  {data.totalDays} ngày · {data.totalHours}h · {formatMoney(data.hourlyRate)}/h
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters & Add Button */}
      <div className="toolbar">
        <div className="toolbar-left">
          <input
            type="month"
            className="form-control"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{ width: 200 }}
          />
          <select
            className="form-control"
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            style={{ width: 200 }}
          >
            <option value="">Tất cả nhân viên</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={18} /> Nhập Giờ Công
        </button>
      </div>

      {/* Records Table */}
      {filteredRecords.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Calendar size={48} />
            <p>Chưa có bản ghi giờ công nào cho tháng này</p>
          </div>
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ngày</th>
                <th>Nhân Viên</th>
                <th>Giờ Vào</th>
                <th>Giờ Ra</th>
                <th>Số Giờ</th>
                <th>Thành Tiền</th>
                <th>Ghi Chú</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map(record => {
                const emp = employees.find(e => e.id === record.employeeId);
                const salary = (record.hours || 0) * (Number(emp?.hourlyRate) || 0);
                return (
                  <tr key={record.id}>
                    <td style={{ fontWeight: 600 }}>
                      <span className="flex gap-1" style={{ alignItems: 'center' }}>
                        <Calendar size={14} className="text-muted" />
                        {new Date(record.date).toLocaleDateString('vi-VN')}
                      </span>
                    </td>
                    <td>{getEmployeeName(record.employeeId)}</td>
                    <td>
                      <span className="badge badge-info">{record.startTime}</span>
                    </td>
                    <td>
                      <span className="badge badge-info">{record.endTime}</span>
                    </td>
                    <td>
                      <span className="badge badge-success">{record.hours}h</span>
                    </td>
                    <td className="text-accent">{formatMoney(salary)}</td>
                    <td className="text-muted">{record.note || '-'}</td>
                    <td>
                      <div className="btn-group">
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(record)}>
                          <Edit2 size={16} />
                        </button>
                        <button className="btn btn-ghost btn-sm text-danger" onClick={() => handleDeleteRecord(record.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingRecord ? 'Sửa Giờ Công' : 'Nhập Giờ Công Mới'}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowModal(false)}>Hủy</button>
            <button className="btn btn-primary" onClick={handleSubmit}>
              {editingRecord ? 'Cập Nhật' : 'Lưu'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nhân Viên *</label>
            <select
              className="form-control"
              value={form.employeeId}
              onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
              required
            >
              <option value="">Chọn nhân viên</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Ngày Làm Việc *</label>
            <input
              type="date"
              className="form-control"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Giờ Vào *</label>
              <input
                type="time"
                className="form-control"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Giờ Ra *</label>
              <input
                type="time"
                className="form-control"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                required
              />
            </div>
          </div>
          {form.startTime && form.endTime && (
            <div className="card" style={{ padding: 12, marginBottom: 16, textAlign: 'center' }}>
              <span className="text-muted">Số giờ tính được: </span>
              <span className="text-accent" style={{ fontWeight: 700, fontSize: '1.2rem' }}>
                {calculateHours(form.startTime, form.endTime)}h
              </span>
            </div>
          )}
          <div className="form-group">
            <label>Ghi Chú</label>
            <input
              type="text"
              className="form-control"
              placeholder="VD: Ca sáng, Tăng ca..."
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
