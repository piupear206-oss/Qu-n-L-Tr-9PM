import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const USERS_KEY = '9pm_users';
const SESSION_KEY = '9pm_user';

// Default admin account
const DEFAULT_USERS = [
  {
    id: 'admin',
    username: 'admin',
    password: 'admin123',
    name: 'Quản Trị Viên',
    role: 'admin'
  }
];

function loadUsers() {
  try {
    const data = localStorage.getItem(USERS_KEY);
    if (data) return JSON.parse(data);
    localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  } catch {
    return DEFAULT_USERS;
  }
}

export function AuthProvider({ children }) {
  const [users, setUsers] = useState(loadUsers);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem(SESSION_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }, [users]);

  const login = (username, password) => {
    const found = users.find(u => u.username === username && u.password === password);
    if (found) {
      const userData = { id: found.id, username: found.username, name: found.name, role: found.role, employeeId: found.employeeId };
      setUser(userData);
      return { success: true };
    }
    return { success: false, message: 'Sai tên đăng nhập hoặc mật khẩu!' };
  };

  const logout = () => setUser(null);

  const isAdmin = () => user?.role === 'admin';

  // Create employee account (admin only)
  const createEmployeeAccount = (employeeId, employeeName, username, password) => {
    if (users.find(u => u.username === username)) {
      return { success: false, message: 'Tên đăng nhập đã tồn tại!' };
    }
    const newUser = {
      id: 'emp_' + Date.now(),
      username,
      password,
      name: employeeName,
      role: 'employee',
      employeeId
    };
    setUsers(prev => [...prev, newUser]);
    return { success: true };
  };

  // Delete employee account
  const deleteEmployeeAccount = (userId) => {
    setUsers(prev => prev.filter(u => u.id !== userId || u.role === 'admin'));
  };

  // Get all employee accounts
  const getEmployeeAccounts = () => users.filter(u => u.role === 'employee');

  return (
    <AuthContext.Provider value={{
      user, login, logout, isAdmin,
      createEmployeeAccount, deleteEmployeeAccount, getEmployeeAccounts
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
