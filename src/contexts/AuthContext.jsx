import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, ref, set, onValue } from '../firebase';

const AuthContext = createContext(null);
const SESSION_KEY = '9pm_user';

const DEFAULT_USERS = [
  {
    id: 'admin',
    username: 'admin',
    password: 'admin123',
    name: 'Quản Trị Viên',
    role: 'admin'
  }
];

export function AuthProvider({ children }) {
  const [users, setUsers] = useState(DEFAULT_USERS);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem(SESSION_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  // Listen to Firebase for users
  useEffect(() => {
    const usersRef = ref(db, '9pm_users');
    const unsub = onValue(usersRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        const data = Array.isArray(val) ? val.filter(Boolean) : Object.values(val).filter(Boolean);
        setUsers(data);
      } else {
        // Initialize with default admin
        set(usersRef, DEFAULT_USERS);
      }
    }, (error) => {
      console.warn('Firebase users error:', error);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }, [user]);

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

  const createEmployeeAccount = (employeeId, employeeName, username, password) => {
    if (users.find(u => u.username === username)) {
      return { success: false, message: 'Tên đăng nhập đã tồn tại!' };
    }
    const newUser = { id: 'emp_' + Date.now(), username, password, name: employeeName, role: 'employee', employeeId };
    const updated = [...users, newUser];
    setUsers(updated);
    set(ref(db, '9pm_users'), updated);
    return { success: true };
  };

  const deleteEmployeeAccount = (userId) => {
    const updated = users.filter(u => u.id !== userId || u.role === 'admin');
    setUsers(updated);
    set(ref(db, '9pm_users'), updated);
  };

  const getEmployeeAccounts = () => users.filter(u => u.role === 'employee');

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin, createEmployeeAccount, deleteEmployeeAccount, getEmployeeAccounts }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
