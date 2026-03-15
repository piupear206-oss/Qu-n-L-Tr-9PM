import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';
import { Users, Plus, Edit2, Trash2, Search, Phone, KeyRound, UserPlus } from 'lucide-react';

export default function EmployeeManagement() {
  const { employees, addEmployee, updateEmployee, deleteEmployee } = useData();
  const { createEmployeeAccount, deleteEmployeeAccount, getEmployeeAccounts } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', position: '', hourlyRate: '' });
  const [accountForm, setAccountForm] = useState({ employeeId: '', username: '', password: '' });
  const [accountMsg, setAccountMsg] = useState(null);

  const employeeAccounts = getEmployeeAccounts();

  const filteredEmployees = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.position?.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditingEmployee(null);
    setForm({ name: '', phone: '', position: '', hourlyRate: '' });
    setShowModal(true);
  };

  const openEdit = (emp) => {
    setEditingEmployee(emp);
    setForm({ name: emp.name, phone: emp.phone || '', position: emp.position || '', hourlyRate: emp.hourlyRate || '' });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (editingEmployee) {
      updateEmployee(editingEmployee.id, form);
    } else {
      addEmployee(form);
    }
    setShowModal(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Bạn có chắc muốn xóa nhân viên này?')) {
      deleteEmployee(id);
    }
  };

  const openCreateAccount = (emp) => {
    setAccountForm({ employeeId: emp.id, username: '', password: '' });
    setAccountMsg(null);
    setShowAccountModal(true);
  };

  const handleCreateAccount = () => {
    if (!accountForm.username || !accountForm.password) {
      setAccountMsg({ type: 'error', text: 'Vui lòng nhập đầy đủ thông tin!' });
      return;
    }
    const emp = employees.find(e => e.id === accountForm.employeeId);
    const result = createEmployeeAccount(accountForm.employeeId, emp?.name || '', accountForm.username, accountForm.password);
    if (result.success) {
      setAccountMsg({ type: 'success', text: `Tạo tài khoản "${accountForm.username}" thành công!` });
      setTimeout(() => setShowAccountModal(false), 1500);
    } else {
      setAccountMsg({ type: 'error', text: result.message });
    }
  };

  const getAccountForEmployee = (empId) => employeeAccounts.find(a => a.employeeId === empId);

  const formatMoney = (n) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <h1>👥 Quản Lí Nhân Viên</h1>
        <p>Quản lí thông tin nhân viên và tài khoản đăng nhập</p>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-input">
            <Search size={16} />
            <input type="text" className="form-control" placeholder="Tìm nhân viên..." value={search}
              onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 36, width: 260 }} />
          </div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={18} /> Thêm Nhân Viên
        </button>
      </div>

      {filteredEmployees.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Users size={48} />
            <p>Chưa có nhân viên nào. Hãy thêm nhân viên mới!</p>
          </div>
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Tên Nhân Viên</th>
                <th>Số Điện Thoại</th>
                <th>Vị Trí</th>
                <th>Lương/Giờ</th>
                <th>Tài Khoản</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp, i) => {
                const account = getAccountForEmployee(emp.id);
                return (
                  <tr key={emp.id}>
                    <td>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{emp.name}</td>
                    <td>
                      {emp.phone && (
                        <span className="flex gap-1" style={{ alignItems: 'center' }}>
                          <Phone size={14} className="text-muted" />
                          {emp.phone}
                        </span>
                      )}
                    </td>
                    <td>
                      {emp.position && <span className="badge badge-purple">{emp.position}</span>}
                    </td>
                    <td className="text-accent">
                      {emp.hourlyRate ? formatMoney(Number(emp.hourlyRate)) + '/h' : '-'}
                    </td>
                    <td>
                      {account ? (
                        <span className="badge badge-success">
                          <KeyRound size={12} style={{ marginRight: 4 }} />
                          {account.username}
                        </span>
                      ) : (
                        <button className="btn btn-outline btn-sm" onClick={() => openCreateAccount(emp)}>
                          <UserPlus size={14} /> Tạo TK
                        </button>
                      )}
                    </td>
                    <td>
                      <div className="btn-group">
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(emp)}>
                          <Edit2 size={16} />
                        </button>
                        <button className="btn btn-ghost btn-sm text-danger" onClick={() => handleDelete(emp.id)}>
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

      {/* Add/Edit Employee Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}
        title={editingEmployee ? 'Sửa Nhân Viên' : 'Thêm Nhân Viên Mới'}
        footer={<>
          <button className="btn btn-outline" onClick={() => setShowModal(false)}>Hủy</button>
          <button className="btn btn-primary" onClick={handleSubmit}>{editingEmployee ? 'Cập Nhật' : 'Thêm'}</button>
        </>}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Tên Nhân Viên *</label>
            <input type="text" className="form-control" placeholder="Nhập tên nhân viên"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Số Điện Thoại</label>
              <input type="text" className="form-control" placeholder="0xxx xxx xxx"
                value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Vị Trí</label>
              <select className="form-control" value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}>
                <option value="">Chọn vị trí</option>
                <option value="Pha Chế">Pha Chế</option>
                <option value="Phục Vụ">Phục Vụ</option>
                <option value="Thu Ngân">Thu Ngân</option>
                <option value="Quản Lí">Quản Lí</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Lương / Giờ (VNĐ)</label>
            <input type="number" className="form-control" placeholder="VD: 25000"
              value={form.hourlyRate} onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })} />
          </div>
        </form>
      </Modal>

      {/* Create Account Modal */}
      <Modal isOpen={showAccountModal} onClose={() => setShowAccountModal(false)}
        title="Tạo Tài Khoản Nhân Viên"
        footer={<>
          <button className="btn btn-outline" onClick={() => setShowAccountModal(false)}>Hủy</button>
          <button className="btn btn-success" onClick={handleCreateAccount}>
            <UserPlus size={16} /> Tạo Tài Khoản
          </button>
        </>}
      >
        {accountMsg && (
          <div style={{
            padding: '10px 16px', borderRadius: 8, marginBottom: 16,
            background: accountMsg.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${accountMsg.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: accountMsg.type === 'success' ? 'var(--accent-success)' : 'var(--accent-danger)',
            fontSize: '0.85rem'
          }}>
            {accountMsg.text}
          </div>
        )}
        <div className="form-group">
          <label>Nhân Viên</label>
          <input type="text" className="form-control" disabled
            value={employees.find(e => e.id === accountForm.employeeId)?.name || ''} />
        </div>
        <div className="form-group">
          <label>Tên Đăng Nhập *</label>
          <input type="text" className="form-control" placeholder="VD: nhanvien1"
            value={accountForm.username}
            onChange={(e) => setAccountForm({ ...accountForm, username: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Mật Khẩu *</label>
          <input type="text" className="form-control" placeholder="Nhập mật khẩu"
            value={accountForm.password}
            onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
}
