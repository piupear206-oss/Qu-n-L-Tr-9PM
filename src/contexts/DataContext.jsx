import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db, ref, set, onValue } from '../firebase';

const DataContext = createContext(null);

const DATA_KEYS = ['employees', 'products', 'categories', 'tables', 'orders', 'inventory', 'finance', 'attendance', 'salaryRecords'];

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
  const [loaded, setLoaded] = useState(false);

  // Real-time listeners from Firebase
  useEffect(() => {
    const stateSetters = { employees: setEmployees, products: setProducts, categories: setCategories, tables: setTables, orders: setOrders, inventory: setInventory, finance: setFinance, attendance: setAttendance, salaryRecords: setSalaryRecords };
    const unsubscribes = [];

    DATA_KEYS.forEach(key => {
      const dbRef = ref(db, key);
      const unsub = onValue(dbRef, (snapshot) => {
        const val = snapshot.val();
        if (val) {
          // Firebase stores arrays as objects if they have gaps
          const data = Array.isArray(val) ? val.filter(Boolean) : Object.values(val).filter(Boolean);
          stateSetters[key](data);
        } else if (DEFAULTS[key].length > 0) {
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
    generateId, loaded,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
}
