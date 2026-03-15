import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const DEFAULT_ADMIN = {
  username: 'admin',
  password: 'admin123',
  name: 'Quản Trị Viên',
  role: 'admin'
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('9pm_user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('9pm_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('9pm_user');
    }
  }, [user]);

  const login = (username, password) => {
    if (username === DEFAULT_ADMIN.username && password === DEFAULT_ADMIN.password) {
      const userData = { username, name: DEFAULT_ADMIN.name, role: DEFAULT_ADMIN.role };
      setUser(userData);
      return { success: true };
    }
    return { success: false, message: 'Sai tên đăng nhập hoặc mật khẩu!' };
  };

  const logout = () => {
    setUser(null);
  };

  const isAdmin = () => user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
