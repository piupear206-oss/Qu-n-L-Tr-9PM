import React, { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Calculator, Calendar, DollarSign } from 'lucide-react';

export default function MySalary() {
  const { user } = useAuth();
  const { employees, salaryRecords } = useData();

  // Find the employee record linked to this user
  const myEmployee = employees.find(e => e.id === user?.employeeId);
  const formatMoney = (n) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

  // Get salary records for this employee grouped by month
  const myRecords = useMemo(() => {
    if (!user?.employeeId) return [];
    return salaryRecords
      .filter(r => r.employeeId === user.employeeId)
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [salaryRecords, user]);

  // Group by month
  const monthlyData = useMemo(() => {
    const months = {};
    myRecords.forEach(record => {
      const monthKey = record.date?.substring(0, 7) || 'unknown';
      if (!months[monthKey]) {
        months[monthKey] = { records: [], totalHours: 0, totalSalary: 0 };
      }
      months[monthKey].records.push(record);
      months[monthKey].totalHours += (record.hours || 0);
      months[monthKey].totalSalary += (record.hours || 0) * (Number(myEmployee?.hourlyRate) || 0);
    });
    return Object.entries(months).sort((a, b) => b[0].localeCompare(a[0]));
  }, [myRecords, myEmployee]);

  const totalAllHours = myRecords.reduce((s, r) => s + (r.hours || 0), 0);
  const totalAllSalary = totalAllHours * (Number(myEmployee?.hourlyRate) || 0);

  if (!myEmployee) {
    return (
      <div className="animate-fade-in-up">
        <div className="page-header">
          <h1>💰 Bảng Lương Của Tôi</h1>
        </div>
        <div className="card">
          <div className="empty-state">
            <Calculator size={48} />
            <p>Tài khoản của bạn chưa được liên kết với hồ sơ nhân viên.</p>
            <p className="text-muted" style={{ marginTop: 8 }}>Vui lòng liên hệ quản trị viên.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <h1>💰 Bảng Lương Của Tôi</h1>
        <p>Xem giờ công và lương - Chỉ đọc, không chỉnh sửa</p>
      </div>

      {/* Summary Cards */}
      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-icon purple"><Calculator size={24} /></div>
          <div className="stat-info">
            <div className="label">Họ Tên</div>
            <div className="value" style={{ fontSize: '1.2rem' }}>{myEmployee.name}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon cyan"><DollarSign size={24} /></div>
          <div className="stat-info">
            <div className="label">Lương / Giờ</div>
            <div className="value" style={{ fontSize: '1.2rem' }}>{formatMoney(Number(myEmployee.hourlyRate) || 0)}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><Calendar size={24} /></div>
          <div className="stat-info">
            <div className="label">Tổng Giờ Công</div>
            <div className="value" style={{ fontSize: '1.2rem' }}>{totalAllHours}h</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><DollarSign size={24} /></div>
          <div className="stat-info">
            <div className="label">Tổng Lương</div>
            <div className="value text-success" style={{ fontSize: '1.2rem' }}>{formatMoney(totalAllSalary)}</div>
          </div>
        </div>
      </div>

      {/* Monthly Breakdown */}
      {monthlyData.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Calendar size={48} />
            <p>Chưa có bản ghi giờ công nào</p>
          </div>
        </div>
      ) : (
        monthlyData.map(([month, data]) => (
          <div key={month} className="card mb-2">
            <div className="flex-between" style={{ marginBottom: 12 }}>
              <h3>📅 Tháng {month.split('-')[1]}/{month.split('-')[0]}</h3>
              <div>
                <span className="badge badge-info" style={{ marginRight: 8 }}>{data.totalHours}h</span>
                <span className="badge badge-success">{formatMoney(data.totalSalary)}</span>
              </div>
            </div>
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ngày</th>
                    <th>Giờ Vào</th>
                    <th>Giờ Ra</th>
                    <th>Số Giờ</th>
                    <th>Thành Tiền</th>
                    <th>Ghi Chú</th>
                  </tr>
                </thead>
                <tbody>
                  {data.records.map(record => (
                    <tr key={record.id}>
                      <td style={{ fontWeight: 600 }}>{new Date(record.date).toLocaleDateString('vi-VN')}</td>
                      <td><span className="badge badge-info">{record.startTime}</span></td>
                      <td><span className="badge badge-info">{record.endTime}</span></td>
                      <td><span className="badge badge-success">{record.hours}h</span></td>
                      <td className="text-accent">{formatMoney((record.hours || 0) * (Number(myEmployee.hourlyRate) || 0))}</td>
                      <td className="text-muted">{record.note || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
