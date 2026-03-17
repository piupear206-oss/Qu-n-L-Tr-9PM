import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db, ref, set, onValue } from '../firebase';

const DataContext = createContext(null);

const DATA_KEYS = ['employees', 'products', 'categories', 'tables', 'orders', 'inventory', 'finance', 'attendance', 'salaryRecords', 'shifts', 'settings'];

const DEFAULT_SHIFTS = [
  { id: 'morning', name: 'Ca Sáng', start: '08:00', end: '12:00' },
  { id: 'afternoon', name: 'Ca Chiều', start: '12:00', end: '17:00' },
  { id: 'evening', name: 'Ca Tối', start: '17:00', end: '22:00' },
  { id: 'full', name: 'Ca Full', start: '08:00', end: '22:00' },
];

const DEFAULT_CATEGORIES = [
  { id: '1', name: 'Trà', emoji: '🍵' },
  { id: '2', name: 'Soda', emoji: '🥤' },
  { id: '3', name: 'Matcha', emoji: '🍵' },
  { id: '4', name: 'Đồ Ăn Vặt', emoji: '🍿' },
];

const DEFAULT_PRODUCTS = [
  // Trà
  { id: '1', name: 'Trà Lài Nhãn Sen Đường Phèn', price: 29000, categoryId: '1', emoji: '🍵' },
  { id: '2', name: 'Trà Chanh Dây', price: 22000, categoryId: '1', emoji: '🍋' },
  { id: '3', name: 'Trà Lipton', price: 20000, categoryId: '1', emoji: '🍵' },
  { id: '4', name: 'Trà Lài Đặc Thơm', price: 32000, categoryId: '1', emoji: '🍵' },
  { id: '5', name: 'Trà Ổi Hồng', price: 32000, categoryId: '1', emoji: '🍑' },
  { id: '6', name: 'Trà Đào', price: 32000, categoryId: '1', emoji: '🍑' },
  { id: '7', name: 'Trà Vải Hoa Hồng', price: 32000, categoryId: '1', emoji: '🌹' },
  // Soda
  { id: '8', name: 'Soda Việt Quất', price: 20000, categoryId: '2', emoji: '🫐' },
  { id: '9', name: 'Soda Dâu', price: 20000, categoryId: '2', emoji: '🍓' },
  // Matcha
  { id: '10', name: 'Matcha Latte', price: 35000, categoryId: '3', emoji: '🍵' },
  // Đồ Ăn Vặt Chill Chill
  { id: '11', name: 'Bánh Que', price: 12000, categoryId: '4', emoji: '🍿' },
  { id: '12', name: 'Hạt Hướng Dương', price: 10000, categoryId: '4', emoji: '🌻' },
  { id: '13', name: 'Bắp Nướng', price: 10000, categoryId: '4', emoji: '🌽' },
  { id: '14', name: 'Thịt Xiên Nướng', price: 13000, categoryId: '4', emoji: '🍢' },
  { id: '15', name: 'Bánh Tráng', price: 10000, categoryId: '4', emoji: '🥟' },
];

const DEFAULT_TABLES = [
  { id: '1', name: 'Bàn 1', status: 'available' },
  { id: '2', name: 'Bàn 2', status: 'available' },
  { id: '3', name: 'Bàn 3', status: 'available' },
  { id: '4', name: 'Bàn 4', status: 'available' },
  { id: '5', name: 'Bàn 5', status: 'available' },
  { id: '6', name: 'Bàn 6', status: 'available' },
  { id: '7', name: 'Bàn 7', status: 'available' },
  { id: '8', name: 'Bàn 8', status: 'available' },
];

const DEFAULTS = {
  employees: [],
  products: DEFAULT_PRODUCTS,
  categories: DEFAULT_CATEGORIES,
  tables: DEFAULT_TABLES,
  orders: [],
  inventory: [],
  finance: [],
  attendance: [],
  salaryRecords: [],
  shifts: DEFAULT_SHIFTS,
  settings: { bankName: '', accountName: '', accountNumber: '', bankQr: '', momoNumber: '', momoName: '', momoQr: '' },
};

// Save to Firebase helper
function saveToFirebase(key, data) {
  try {
    set(ref(db, key), data);
  } catch (err) {
    console.warn('Firebase save error:', key, err);
  }
}

export function DataProvider({ children }) {
  const [employees, setEmployees] = useState(DEFAULTS.employees);
  const [products, setProducts] = useState(DEFAULTS.products);
  const [categories, setCategories] = useState(DEFAULTS.categories);
  const [tables, setTables] = useState(DEFAULTS.tables);
  const [orders, setOrders] = useState(DEFAULTS.orders);
  const [inventory, setInventory] = useState(DEFAULTS.inventory);
  const [finance, setFinance] = useState(DEFAULTS.finance);
  const [attendance, setAttendance] = useState(DEFAULTS.attendance);
  const [salaryRecords, setSalaryRecords] = useState(DEFAULTS.salaryRecords);
  const [shifts, setShifts] = useState(DEFAULTS.shifts);
  const [settings, setSettings] = useState(DEFAULTS.settings);
  const [loaded, setLoaded] = useState(false);

  // Real-time listeners from Firebase
  useEffect(() => {
    const stateSetters = { employees: setEmployees, products: setProducts, categories: setCategories, tables: setTables, orders: setOrders, inventory: setInventory, finance: setFinance, attendance: setAttendance, salaryRecords: setSalaryRecords, shifts: setShifts, settings: setSettings };
    const unsubscribes = [];

    DATA_KEYS.forEach(key => {
      const dbRef = ref(db, key);
      const unsub = onValue(dbRef, (snapshot) => {
        const val = snapshot.val();
        if (val) {
          // Firebase stores arrays as objects if they have gaps
          let data;
          if (key === 'settings') {
            data = val;
          } else {
            data = Array.isArray(val) ? val.filter(Boolean) : Object.values(val).filter(Boolean);
          }
          stateSetters[key](data);
        } else if (DEFAULTS[key] && Object.keys(DEFAULTS[key]).length > 0) {
          // Initialize Firebase with defaults if empty
          saveToFirebase(key, DEFAULTS[key]);
          stateSetters[key](DEFAULTS[key]);
        }
      }, (error) => {
        console.warn('Firebase listen error:', key, error);
      });
      unsubscribes.push(unsub);
    });

    setLoaded(true);
    return () => unsubscribes.forEach(fn => fn && fn());
  }, []);

  const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

  // Generic save helper
  const saveAll = (key, data) => saveToFirebase(key, data);

  // Employee CRUD
  const addEmployee = (emp) => {
    const newEmp = { ...emp, id: generateId(), createdAt: new Date().toISOString() };
    const updated = [...employees, newEmp];
    setEmployees(updated); saveAll('employees', updated);
    return newEmp;
  };
  const updateEmployee = (id, data) => {
    const updated = employees.map(e => e.id === id ? { ...e, ...data } : e);
    setEmployees(updated); saveAll('employees', updated);
  };
  const deleteEmployee = (id) => {
    const updated = employees.filter(e => e.id !== id);
    setEmployees(updated); saveAll('employees', updated);
  };

  // Category CRUD
  const addCategory = (cat) => {
    const newCat = { ...cat, id: generateId() };
    const updated = [...categories, newCat];
    setCategories(updated); saveAll('categories', updated);
    return newCat;
  };
  const deleteCategory = (id) => {
    const updatedCats = categories.filter(c => c.id !== id);
    setCategories(updatedCats); saveAll('categories', updatedCats);
    // Also delete all products belonging to this category
    const updatedProds = products.filter(p => p.categoryId !== id);
    setProducts(updatedProds); saveAll('products', updatedProds);
  };

  // Product CRUD
  const addProduct = (prod) => {
    const newProd = { ...prod, id: generateId() };
    const updated = [...products, newProd];
    setProducts(updated); saveAll('products', updated);
    return newProd;
  };
  const updateProduct = (id, data) => {
    const updated = products.map(p => p.id === id ? { ...p, ...data } : p);
    setProducts(updated); saveAll('products', updated);
  };
  const deleteProduct = (id) => {
    const updated = products.filter(p => p.id !== id);
    setProducts(updated); saveAll('products', updated);
  };

  // Table CRUD
  const addTable = (table) => {
    const newTable = { ...table, id: generateId(), status: 'available' };
    const updated = [...tables, newTable];
    setTables(updated); saveAll('tables', updated);
  };
  const updateTable = (id, data) => {
    const updated = tables.map(t => t.id === id ? { ...t, ...data } : t);
    setTables(updated); saveAll('tables', updated);
  };
  const deleteTable = (id) => {
    const updated = tables.filter(t => t.id !== id);
    setTables(updated); saveAll('tables', updated);
  };

  // Order CRUD
  const addOrder = (order) => {
    const newOrder = { ...order, id: generateId(), createdAt: new Date().toISOString(), status: order.status || 'pending' };
    const updated = [...orders, newOrder];
    setOrders(updated); saveAll('orders', updated);
    return newOrder;
  };
  const updateOrder = (id, data) => {
    const updated = orders.map(o => o.id === id ? { ...o, ...data } : o);
    setOrders(updated); saveAll('orders', updated);
  };
  const deleteOrder = (id) => {
    const updated = orders.filter(o => o.id !== id);
    setOrders(updated); saveAll('orders', updated);
  };

  // Inventory CRUD
  const addInventoryItem = (item) => {
    const newItem = { ...item, id: generateId(), createdAt: new Date().toISOString() };
    const updated = [...inventory, newItem];
    setInventory(updated); saveAll('inventory', updated);
  };
  const updateInventoryItem = (id, data) => {
    const updated = inventory.map(i => i.id === id ? { ...i, ...data } : i);
    setInventory(updated); saveAll('inventory', updated);
  };
  const deleteInventoryItem = (id) => {
    const updated = inventory.filter(i => i.id !== id);
    setInventory(updated); saveAll('inventory', updated);
  };

  // Finance CRUD
  const addFinanceRecord = (record) => {
    const newRecord = { ...record, id: generateId(), createdAt: new Date().toISOString() };
    const updated = [...finance, newRecord];
    setFinance(updated); saveAll('finance', updated);
  };
  const deleteFinanceRecord = (id) => {
    const updated = finance.filter(f => f.id !== id);
    setFinance(updated); saveAll('finance', updated);
  };

  // Attendance
  const addAttendanceRecord = (record) => {
    const newRecord = { ...record, id: generateId(), timestamp: new Date().toISOString() };
    const updated = [...attendance, newRecord];
    setAttendance(updated); saveAll('attendance', updated);
    return newRecord;
  };
  const deleteAttendanceRecord = (id) => {
    const updated = attendance.filter(a => a.id !== id);
    setAttendance(updated); saveAll('attendance', updated);
  };

  // Salary Records
  const addSalaryRecord = (record) => {
    const newRecord = { ...record, id: generateId() };
    const updated = [...salaryRecords, newRecord];
    setSalaryRecords(updated); saveAll('salaryRecords', updated);
  };
  const updateSalaryRecord = (id, data) => {
    const updated = salaryRecords.map(s => s.id === id ? { ...s, ...data } : s);
    setSalaryRecords(updated); saveAll('salaryRecords', updated);
  };
  const deleteSalaryRecord = (id) => {
    const updated = salaryRecords.filter(s => s.id !== id);
    setSalaryRecords(updated); saveAll('salaryRecords', updated);
  };

  // Generic update/delete
  const updateRecord = (type, id, data) => {
    const stateMap = { 'inventory': [inventory, setInventory], 'finance': [finance, setFinance] };
    const [state, setter] = stateMap[type];
    const updated = state.map(item => item.id === id ? { ...item, ...data } : item);
    setter(updated); saveAll(type, updated);
  };
  const deleteRecord = (type, id) => {
    const stateMap = { 'inventory': [inventory, setInventory], 'finance': [finance, setFinance] };
    const [state, setter] = stateMap[type];
    const updated = state.filter(item => item.id !== id);
    setter(updated); saveAll(type, updated);
  };

  // --- Shifts ---
  const addShift = (shift) => {
    const newShift = { ...shift, id: 'shift_' + Date.now() };
    const updated = [...shifts, newShift];
    setShifts(updated); saveAll('shifts', updated);
    return newShift;
  };
  const updateShift = (id, data) => {
    const updated = shifts.map(s => s.id === id ? { ...s, ...data } : s);
    setShifts(updated); saveAll('shifts', updated);
  };
  const deleteShift = (id) => {
    const updated = shifts.filter(s => s.id !== id);
    setShifts(updated); saveAll('shifts', updated);
  };

  // --- Settings ---
  const updateSettings = (data) => {
    const updated = { ...settings, ...data };
    setSettings(updated); saveAll('settings', updated);
  };

  // Stats
  const getTodayOrders = useCallback(() => {
    const today = new Date().toDateString();
    return orders.filter(o => new Date(o.createdAt).toDateString() === today);
  }, [orders]);

  const getTodayRevenue = useCallback(() => {
    return getTodayOrders()
      .filter(o => o.status === 'paid')
      .reduce((sum, o) => sum + (o.total || 0), 0);
  }, [getTodayOrders]);

  // Placeholder for functions not defined in the original content but present in the requested `value` object
  const getActiveOrder = () => null; // Or implement actual logic
  const markAsRead = () => {};
  const markAllAsRead = () => {};
  const getUnreadCount = () => 0;
  const addInventoryRecord = addInventoryItem; // Alias for consistency with the requested value object
  const getSalaryByEmployee = () => [];
  const getSalaryByMonth = () => [];


  const value = {
    loaded,
    employees, addEmployee, updateEmployee, deleteEmployee,
    products, addProduct, updateProduct, deleteProduct,
    categories, addCategory, deleteCategory,
    tables, addTable, updateTable, deleteTable, getActiveOrder,
    orders, addOrder, updateOrder, deleteOrder, markAsRead, markAllAsRead, getUnreadCount,
    inventory, addInventoryRecord, updateRecord, deleteRecord, // updateRecord and deleteRecord are generic, but addInventoryRecord is specific
    finance, addFinanceRecord, // deleteFinanceRecord is missing from the requested value object
    attendance, addAttendanceRecord, deleteAttendanceRecord,
    salaryRecords, addSalaryRecord, getSalaryByEmployee, getSalaryByMonth, // updateSalaryRecord and deleteSalaryRecord are missing from the requested value object
    shifts, addShift, updateShift, deleteShift,
    settings, updateSettings,
    getTodayOrders, getTodayRevenue,
    generateId,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
}
