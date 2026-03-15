import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, onValue, update, remove } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDfhkKSM_fQNCQnocnS77V9JFL66xikcPc",
  authDomain: "tiem-tra-9pm-268a2.firebaseapp.com",
  databaseURL: "https://tiem-tra-9pm-268a2-default-rtdb.firebaseio.com",
  projectId: "tiem-tra-9pm-268a2",
  storageBucket: "tiem-tra-9pm-268a2.firebasestorage.app",
  messagingSenderId: "551367680680",
  appId: "1:551367680680:web:f2eae2e2b23e481ca3989d",
  measurementId: "G-EYE7Y0ZXQ0"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, set, get, onValue, update, remove };
