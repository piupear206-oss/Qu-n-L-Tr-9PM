import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const DataContext = createContext(null);

const STORAGE_KEYS = {
  employees: '9pm_employees',
  products: '9pm_products',
  categories: '9pm_categories',
  tables: '9pm_tables',
  orders: '9pm_orders',
  inventory: '9pm_inventory',
  finance: '9pm_finance',
  attendance: '9pm_attendance',
  salaryRecords: '9pm_salary_records',
};

const DEFAULT_CATEGORIES = [
  { id: '1', name: 'Trà Sữa', emoji: '🧋' },
  { id: '2', name: 'Trà Trái Cây', emoji: '🍊' },
  { id: '3', name: 'Coffee', emoji: '☕' },
  { id: '4', name: 'Đá Xay', emoji: '🧊' },
  { id: '5', name: 'Topping', emoji: '🧁' },
  { id: '6', name: 'Đồ Ăn Vặt', emoji: '🍿' },
];

const DEFAULT_PRODUCTS = [
  { id: '1', name: 'Trà Sữa Trân Châu', price: 35000, categoryId: '1', emoji: '🧋' },
  { id: '2', name: 'Trà Sữa Matcha', price: 40000, categoryId: '1', emoji: '🍵' },
  { id: '3', name: 'Trà Sữa Ô Long', price: 35000, categoryId: '1', emoji: '🧋' },
  { id: '4', name: 'Trà Sữa Socola', price: 38000, categoryId: '1', emoji: '🍫' },
  { id: '5', name: 'Trà Đào Cam Sả', price: 32000, categoryId: '2', emoji: '🍑' },
  { id: '6', name: 'Trà Vải', price: 30000, categoryId: '2', emoji: '🫐' },
  { id: '7', name: 'Trà Chanh Leo', price: 28000, categoryId: '2', emoji: '🍋' },
  { id: '8', name: 'Cà Phê Sữa Đá', price: 25000, categoryId: '3', emoji: '☕' },
  { id: '9', name: 'Americano', price: 35000, categoryId: '3', emoji: '☕' },
  { id: '10', name: 'Latte', price: 40000, categoryId: '3', emoji: '☕' },
  { id: '11', name: 'Sinh Tố Bơ', price: 35000, categoryId: '4', emoji: '🥑' },
  { id: '12', name: 'Sinh Tố Dâu', price: 32000, categoryId: '4', emoji: '🍓' },
  { id: '13', name: 'Trân Châu Đen', price: 8000, categoryId: '5', emoji: '⚫' },
  { id: '14', name: 'Thạch Dừa', price: 6000, categoryId: '5', emoji: '🥥' },
  { id: '15', name: 'Khoai Tây Chiên', price: 25000, categoryId: '6', emoji: '🍟' },
  { id: '16', name: 'Bánh Tráng Trộn', price: 20000, categoryId: '6', emoji: '🥟' },
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

function loadData(key, defaultValue = []) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function DataProvider({ children }) {
  const [employees, setEmployees] = useState(() => loadData(STORAGE_KEYS.employees));
  const [products, setProducts] = useState(() => loadData(STORAGE_KEYS.products, DEFAULT_PRODUCTS));
  const [categories, setCategories] = useState(() => loadData(STORAGE_KEYS.categories, DEFAULT_CATEGORIES));
  const [tables, setTables] = useState(() => loadData(STORAGE_KEYS.tables, DEFAULT_TABLES));
  const [orders, setOrders] = useState(() => loadData(STORAGE_KEYS.orders));
  const [inventory, setInventory] = useState(() => loadData(STORAGE_KEYS.inventory));
  const [finance, setFinance] = useState(() => loadData(STORAGE_KEYS.finance));
  const [attendance, setAttendance] = useState(() => loadData(STORAGE_KEYS.attendance));
  const [salaryRecords, setSalaryRecords] = useState(() => loadData(STORAGE_KEYS.salaryRecords));

  // Auto-save to localStorage
  useEffect(() => { saveData(STORAGE_KEYS.employees, employees); }, [employees]);
  useEffect(() => { saveData(STORAGE_KEYS.products, products); }, [products]);
  useEffect(() => { saveData(STORAGE_KEYS.categories, categories); }, [categories]);
  useEffect(() => { saveData(STORAGE_KEYS.tables, tables); }, [tables]);
  useEffect(() => { saveData(STORAGE_KEYS.orders, orders); }, [orders]);
  useEffect(() => { saveData(STORAGE_KEYS.inventory, inventory); }, [inventory]);
  useEffect(() => { saveData(STORAGE_KEYS.finance, finance); }, [finance]);
  useEffect(() => { saveData(STORAGE_KEYS.attendance, attendance); }, [attendance]);
  useEffect(() => { saveData(STORAGE_KEYS.salaryRecords, salaryRecords); }, [salaryRecords]);

  // Generic CRUD helpers
  const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

  // Employee CRUD
  const addEmployee = (emp) => {
    const newEmp = { ...emp, id: generateId(), createdAt: new Date().toISOString() };
    setEmployees(prev => [...prev, newEmp]);
    return newEmp;
  };
  const updateEmployee = (id, data) => setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
  const deleteEmployee = (id) => setEmployees(prev => prev.filter(e => e.id !== id));

  // Product CRUD
  const addProduct = (prod) => {
    const newProd = { ...prod, id: generateId() };
    setProducts(prev => [...prev, newProd]);
    return newProd;
  };
  const updateProduct = (id, data) => setProducts(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  const deleteProduct = (id) => setProducts(prev => prev.filter(p => p.id !== id));

  // Table CRUD
  const addTable = (table) => {
    const newTable = { ...table, id: generateId(), status: 'available' };
    setTables(prev => [...prev, newTable]);
  };
  const updateTable = (id, data) => setTables(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
  const deleteTable = (id) => setTables(prev => prev.filter(t => t.id !== id));

  // Order CRUD
  const addOrder = (order) => {
    const newOrder = { ...order, id: generateId(), createdAt: new Date().toISOString(), status: 'pending' };
    setOrders(prev => [...prev, newOrder]);
    return newOrder;
  };
  const updateOrder = (id, data) => setOrders(prev => prev.map(o => o.id === id ? { ...o, ...data } : o));
  const deleteOrder = (id) => setOrders(prev => prev.filter(o => o.id !== id));

  // Inventory CRUD
  const addInventoryItem = (item) => {
    const newItem = { ...item, id: generateId(), createdAt: new Date().toISOString() };
    setInventory(prev => [...prev, newItem]);
  };
  const updateInventoryItem = (id, data) => setInventory(prev => prev.map(i => i.id === id ? { ...i, ...data } : i));
  const deleteInventoryItem = (id) => setInventory(prev => prev.filter(i => i.id !== id));

  // Finance CRUD
  const addFinanceRecord = (record) => {
    const newRecord = { ...record, id: generateId(), createdAt: new Date().toISOString() };
    setFinance(prev => [...prev, newRecord]);
  };
  const deleteFinanceRecord = (id) => setFinance(prev => prev.filter(f => f.id !== id));

  // Attendance
  const addAttendanceRecord = (record) => {
    const newRecord = { ...record, id: generateId(), timestamp: new Date().toISOString() };
    setAttendance(prev => [...prev, newRecord]);
    return newRecord;
  };

  // Salary Records
  const addSalaryRecord = (record) => {
    const newRecord = { ...record, id: generateId() };
    setSalaryRecords(prev => [...prev, newRecord]);
  };
  const updateSalaryRecord = (id, data) => setSalaryRecords(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
  const deleteSalaryRecord = (id) => setSalaryRecords(prev => prev.filter(s => s.id !== id));

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

  const value = {
    employees, addEmployee, updateEmployee, deleteEmployee,
    products, addProduct, updateProduct, deleteProduct,
    categories,
    tables, addTable, updateTable, deleteTable,
    orders, addOrder, updateOrder, deleteOrder,
    inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem,
    finance, addFinanceRecord, deleteFinanceRecord,
    attendance, addAttendanceRecord,
    salaryRecords, addSalaryRecord, updateSalaryRecord, deleteSalaryRecord,
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
