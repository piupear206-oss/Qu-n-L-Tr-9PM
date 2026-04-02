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
  const [sessions, setSessions] = useState([]);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) {
       try {
          // Backward compatibility for existing naked JSON
          if (saved.trim().startsWith('{')) return JSON.parse(saved);
          // Parse obfuscated base64 storage payload
          return JSON.parse(decodeURIComponent(escape(atob(saved))));
       } catch(e) { return null; }
    }
    return null;
  });

  const hashPassword = (password) => {
    if (!password) return '';
    return btoa(unescape(encodeURIComponent(password + "_9pm_secret_salt_2026")));
  };

  // Listen to Firebase for users and sessions
  useEffect(() => {
    const usersRef = ref(db, '9pm_users');
    const unsubUsers = onValue(usersRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        const data = Array.isArray(val) ? val.filter(Boolean) : Object.values(val).filter(Boolean);
        setUsers(data);
      } else {
        set(usersRef, DEFAULT_USERS);
      }
    });

    const sessionsRef = ref(db, '9pm_sessions');
    const unsubSessions = onValue(sessionsRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        const data = Array.isArray(val) ? val.filter(Boolean) : Object.values(val).filter(Boolean);
        
        // Auto-logout if current session is removed from another device
        const currentSessionId = localStorage.getItem('9pm_session_id');
        if (currentSessionId && !data.find(s => s.sessionId === currentSessionId)) {
          setUser(null);
          localStorage.removeItem(SESSION_KEY);
          localStorage.removeItem('9pm_session_id');
        }

        setSessions(data);
      } else {
        setSessions([]);
      }
    });

    return () => { unsubUsers(); unsubSessions(); };
  }, []);

  // Sync local session if user data changes remotely (e.g., admin changes their role)
  useEffect(() => {
    if (users.length > 0) {
      setUser(currentUser => {
        if (!currentUser) return null;
        const dbUser = users.find(u => u.id === currentUser.id);
        if (!dbUser) return null; // account was deleted
        if (dbUser.role !== currentUser.role || dbUser.name !== currentUser.name) {
          return { ...currentUser, role: dbUser.role, name: dbUser.name };
        }
        return currentUser;
      });
    }
  }, [users]);

  useEffect(() => {
    if (user) {
      const payload = btoa(unescape(encodeURIComponent(JSON.stringify(user))));
      localStorage.setItem(SESSION_KEY, payload);
    } else {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem('9pm_session_id');
    }
  }, [user]);

  const getDeviceInfo = () => {
    const ua = navigator.userAgent;
    let browser = 'Unknown Browser';
    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';

    let device = 'Desktop';
    if (/Mobi|Android/i.test(ua)) device = 'Mobile';
    else if (/Tablet|iPad/i.test(ua)) device = 'Tablet';

    return { ua, browser, device: `${device} - ${browser}` };
  };

  const login = (username, password) => {
    const hashed = hashPassword(password);
    const found = users.find(u => u.username === username && (u.password === hashed || u.password === password));
    if (found) {
      const userData = { id: found.id, username: found.username, name: found.name, role: found.role, employeeId: found.employeeId };
      setUser(userData);
      
      // Save session
      const sessionId = 'sess_' + Date.now() + Math.random().toString(36).substring(7);
      localStorage.setItem('9pm_session_id', sessionId);
      
      const { ua, browser, device } = getDeviceInfo();
      const newSession = {
        sessionId,
        userId: found.id,
        userAgent: ua,
        browser: browser,
        deviceInfo: device,
        loginTime: new Date().toISOString()
      };
      
      const updatedSessions = [...sessions, newSession];
      setSessions(updatedSessions);
      set(ref(db, '9pm_sessions'), updatedSessions);

      return { success: true };
    }
    return { success: false, message: 'Sai tên đăng nhập hoặc mật khẩu!' };
  };

  const logout = () => {
    const currentSessionId = localStorage.getItem('9pm_session_id');
    if (currentSessionId) {
      const updatedSessions = sessions.filter(s => s.sessionId !== currentSessionId);
      setSessions(updatedSessions);
      set(ref(db, '9pm_sessions'), updatedSessions);
    }
    setUser(null);
  };

  const logoutSession = (sessionId) => {
    const updatedSessions = sessions.filter(s => s.sessionId !== sessionId);
    setSessions(updatedSessions);
    set(ref(db, '9pm_sessions'), updatedSessions);
    
    if (localStorage.getItem('9pm_session_id') === sessionId) {
      setUser(null);
    }
  };

  const isAdmin = () => {
    if (!user) return false;
    const dbUser = users.find(u => u.id === user.id);
    if (dbUser) return dbUser.role === 'admin' || dbUser.role === 'manager'; // Real-time DB check prevents escalation
    return user.role === 'admin' || user.role === 'manager';
  };

  const createEmployeeAccount = (employeeId, employeeName, username, password, role = 'employee') => {
    if (users.find(u => u.username === username)) {
      return { success: false, message: 'Tên đăng nhập đã tồn tại!' };
    }
    const newUser = { id: 'emp_' + Date.now(), username, password: hashPassword(password), name: employeeName, role, employeeId };
    const updated = [...users, newUser];
    setUsers(updated);
    set(ref(db, '9pm_users'), updated);
    return { success: true };
  };

  const register = (username, password, name) => {
    if (users.find(u => u.username === username)) {
      return { success: false, message: 'Tên đăng nhập đã được sử dụng!' };
    }
    // Default new registrations to employee role
    const newUser = { id: 'user_' + Date.now(), username, password: hashPassword(password), name, role: 'employee' };
    const updated = [...users, newUser];
    setUsers(updated);
    set(ref(db, '9pm_users'), updated);
    return { success: true, message: 'Đăng kí thành công! Vui lòng đăng nhập.' };
  };

  const resetPassword = (username, newPassword) => {
    const userIndex = users.findIndex(u => u.username === username);
    if (userIndex === -1) {
      return { success: false, message: 'Không tìm thấy tên đăng nhập này trong hệ thống!' };
    }
    const updated = [...users];
    updated[userIndex].password = hashPassword(newPassword);
    setUsers(updated);
    set(ref(db, '9pm_users'), updated);
    return { success: true, message: 'Đã thiết lập lại mật khẩu thành công!' };
  };

  const deleteEmployeeAccount = (userId) => {
    const updated = users.filter(u => u.id !== userId || u.role === 'admin');
    setUsers(updated);
    set(ref(db, '9pm_users'), updated);
  };

  const getEmployeeAccounts = () => users.filter(u => u.role !== 'admin');

  const updateEmployeeRole = (employeeId, newRole) => {
    const userIndex = users.findIndex(u => u.employeeId === employeeId);
    if (userIndex !== -1 && users[userIndex].role !== 'admin') {
      const updated = [...users];
      updated[userIndex].role = newRole;
      setUsers(updated);
      set(ref(db, '9pm_users'), updated);
      
      // If updating the current user, update their local session
      if (user && user.employeeId === employeeId) {
        setUser({ ...user, role: newRole });
      }
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, sessions, login, logout, logoutSession, register, resetPassword, 
      isAdmin, createEmployeeAccount, deleteEmployeeAccount, getEmployeeAccounts, updateEmployeeRole 
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
