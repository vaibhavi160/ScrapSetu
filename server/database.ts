import fs from 'fs';
import path from 'path';

export interface StoredUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
  passwordOrPin: string;
  role: 'collector' | 'seller' | 'recycler' | 'admin';
  city: string;
  pincode: string;
  upiId?: string;
  cpcbLicenseNumber?: string;
  businessName?: string;
  totalEarnings: number;
  totalWasteHandledKg: number;
  transactionsCount: number;
  createdAt: string;
  lastLoginAt?: string;
}

export interface StoredTransaction {
  id: string;
  userId: string;
  userName: string;
  category: string;
  weightKg: number;
  ratePerKg: number;
  totalAmount: number;
  recyclerName: string;
  cpcbRegNumber?: string;
  paymentMethod: string;
  utrNumber?: string;
  status: 'pending' | 'verified' | 'paid' | 'completed';
  timestamp: number;
  createdAt: string;
}

export interface StoredPickup {
  id: string;
  userId: string;
  userName: string;
  phone: string;
  address: string;
  city: string;
  category: string;
  estimatedWeightKg: number;
  date: string;
  timeSlot: string;
  status: 'requested' | 'accepted' | 'in_transit' | 'completed';
  assignedCollectorName?: string;
  assignedCollectorPhone?: string;
  createdAt: string;
}

export interface DatabaseSchema {
  users: StoredUser[];
  transactions: StoredTransaction[];
  pickups: StoredPickup[];
  version: string;
  lastUpdated: string;
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'database.json');

const INITIAL_USERS: StoredUser[] = [
  {
    id: 'usr_collector_01',
    name: 'Ramesh Kabadiwala',
    phone: '9820011982',
    email: 'ramesh.kabadi@scrapsetu.in',
    passwordOrPin: '1234',
    role: 'collector',
    city: 'Mumbai',
    pincode: '400017',
    upiId: 'ramesh.scrap@upi',
    businessName: 'Ramesh Scrap & E-Waste Collection',
    totalEarnings: 34500,
    totalWasteHandledKg: 890,
    transactionsCount: 42,
    createdAt: '2026-01-15T08:00:00.000Z',
    lastLoginAt: new Date().toISOString(),
  },
  {
    id: 'usr_seller_01',
    name: 'Sunita Sharma',
    phone: '9876543210',
    email: 'sunita.sharma@gmail.com',
    passwordOrPin: '1234',
    role: 'seller',
    city: 'Navi Mumbai',
    pincode: '400703',
    upiId: 'sunita@oksbi',
    businessName: 'Residential Seller (Green Heights Coop)',
    totalEarnings: 8400,
    totalWasteHandledKg: 140,
    transactionsCount: 7,
    createdAt: '2026-02-10T11:30:00.000Z',
    lastLoginAt: new Date().toISOString(),
  },
  {
    id: 'usr_recycler_01',
    name: 'EcoRecycle Solutions Pvt Ltd',
    phone: '9988776655',
    email: 'operations@ecorecycle.co.in',
    passwordOrPin: '1234',
    role: 'recycler',
    city: 'Thane',
    pincode: '400604',
    cpcbLicenseNumber: 'CPCB/E-WASTE/MH/2023/0481',
    businessName: 'EcoRecycle Central Aggregation Hub',
    totalEarnings: 215000,
    totalWasteHandledKg: 6540,
    transactionsCount: 156,
    createdAt: '2025-11-20T09:00:00.000Z',
    lastLoginAt: new Date().toISOString(),
  },
];

const INITIAL_TRANSACTIONS: StoredTransaction[] = [
  {
    id: 'TXN-EPR-2026-001',
    userId: 'usr_collector_01',
    userName: 'Ramesh Kabadiwala',
    category: 'Copper Wire & Motors',
    weightKg: 28.5,
    ratePerKg: 460,
    totalAmount: 13110,
    recyclerName: 'EcoRecycle Solutions Pvt Ltd',
    cpcbRegNumber: 'CPCB/E-WASTE/MH/2023/0481',
    paymentMethod: 'UPI Instant',
    utrNumber: 'UPI/20260908/7829104',
    status: 'paid',
    timestamp: Date.now() - 86400000 * 2,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'TXN-EPR-2026-002',
    userId: 'usr_collector_01',
    userName: 'Ramesh Kabadiwala',
    category: 'PCBs & Circuit Boards',
    weightKg: 14.0,
    ratePerKg: 380,
    totalAmount: 5320,
    recyclerName: 'Maharshi Metals & E-Waste Hub',
    cpcbRegNumber: 'CPCB/E-WASTE/MH/2024/0112',
    paymentMethod: 'AEPS Direct Aadhaar',
    utrNumber: 'AEPS/20260907/991203',
    status: 'paid',
    timestamp: Date.now() - 86400000,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

const INITIAL_PICKUPS: StoredPickup[] = [
  {
    id: 'PKP-2026-0901',
    userId: 'usr_seller_01',
    userName: 'Sunita Sharma',
    phone: '9876543210',
    address: 'Flat 402, Green Heights, Sector 19, Vashi',
    city: 'Navi Mumbai',
    category: 'Small Home Appliances',
    estimatedWeightKg: 12.0,
    date: 'Today',
    timeSlot: '14:00 - 16:00',
    status: 'accepted',
    assignedCollectorName: 'Ramesh Kabadiwala',
    assignedCollectorPhone: '9820011982',
    createdAt: new Date().toISOString(),
  },
];

export function readDatabase(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    if (!fs.existsSync(DB_FILE)) {
      const defaultData: DatabaseSchema = {
        users: INITIAL_USERS,
        transactions: INITIAL_TRANSACTIONS,
        pickups: INITIAL_PICKUPS,
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
      return defaultData;
    }

    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);

    // Ensure all collections exist
    if (!Array.isArray(parsed.users)) parsed.users = INITIAL_USERS;
    if (!Array.isArray(parsed.transactions)) parsed.transactions = INITIAL_TRANSACTIONS;
    if (!Array.isArray(parsed.pickups)) parsed.pickups = INITIAL_PICKUPS;

    return parsed;
  } catch (err) {
    console.error('Error reading database file, returning fallback:', err);
    return {
      users: INITIAL_USERS,
      transactions: INITIAL_TRANSACTIONS,
      pickups: INITIAL_PICKUPS,
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
    };
  }
}

export function writeDatabase(data: DatabaseSchema): void {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    data.lastUpdated = new Date().toISOString();
    // Write atomically via temporary file
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Error writing to database file:', err);
  }
}

// User CRUD Helpers
export function sanitizeUser(user: StoredUser) {
  const { passwordOrPin, ...safeUser } = user;
  return safeUser;
}

export function findUserByCredentials(phoneOrEmail: string, passwordOrPin: string): StoredUser | null {
  const db = readDatabase();
  const normalized = phoneOrEmail.trim().toLowerCase();
  const cleanPhone = phoneOrEmail.replace(/\D/g, '');

  const matched = db.users.find((u) => {
    const emailMatch = u.email && u.email.toLowerCase() === normalized;
    const phoneMatch = u.phone.replace(/\D/g, '') === cleanPhone;
    return (emailMatch || phoneMatch) && u.passwordOrPin === passwordOrPin.trim();
  });

  return matched || null;
}

export function findUserByIdentifier(phoneOrEmail: string): StoredUser | null {
  const db = readDatabase();
  const normalized = phoneOrEmail.trim().toLowerCase();
  const cleanPhone = phoneOrEmail.replace(/\D/g, '');

  return db.users.find((u) => {
    const emailMatch = u.email && u.email.toLowerCase() === normalized;
    const phoneMatch = cleanPhone.length >= 7 && u.phone.replace(/\D/g, '').endsWith(cleanPhone);
    return emailMatch || phoneMatch;
  }) || null;
}

export function createUser(userData: {
  name: string;
  phone: string;
  email?: string;
  passwordOrPin: string;
  role: 'collector' | 'seller' | 'recycler' | 'admin';
  city?: string;
  pincode?: string;
  upiId?: string;
  cpcbLicenseNumber?: string;
  businessName?: string;
}): StoredUser {
  const db = readDatabase();
  const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newUser: StoredUser = {
    id,
    name: userData.name.trim(),
    phone: userData.phone.trim(),
    email: userData.email?.trim() || undefined,
    passwordOrPin: userData.passwordOrPin.trim(),
    role: userData.role || 'collector',
    city: userData.city?.trim() || 'Mumbai',
    pincode: userData.pincode?.trim() || '400001',
    upiId: userData.upiId?.trim() || undefined,
    cpcbLicenseNumber: userData.cpcbLicenseNumber?.trim() || undefined,
    businessName: userData.businessName?.trim() || undefined,
    totalEarnings: 0,
    totalWasteHandledKg: 0,
    transactionsCount: 0,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  writeDatabase(db);
  return newUser;
}

export function updateUser(id: string, updates: Partial<StoredUser>): StoredUser | null {
  const db = readDatabase();
  const idx = db.users.findIndex((u) => u.id === id);
  if (idx === -1) return null;

  db.users[idx] = {
    ...db.users[idx],
    ...updates,
    id: db.users[idx].id, // protect id
  };
  writeDatabase(db);
  return db.users[idx];
}

export function addTransactionRecord(txn: Omit<StoredTransaction, 'id' | 'createdAt'>): StoredTransaction {
  const db = readDatabase();
  const id = `TXN-EPR-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
  const newTxn: StoredTransaction = {
    ...txn,
    id,
    createdAt: new Date().toISOString(),
  };

  db.transactions.unshift(newTxn);

  // If connected to a user, update their aggregated statistics in database
  if (txn.userId) {
    const user = db.users.find((u) => u.id === txn.userId);
    if (user) {
      user.totalEarnings = (user.totalEarnings || 0) + (txn.totalAmount || 0);
      user.totalWasteHandledKg = Math.round(((user.totalWasteHandledKg || 0) + (txn.weightKg || 0)) * 10) / 10;
      user.transactionsCount = (user.transactionsCount || 0) + 1;
    }
  }

  writeDatabase(db);
  return newTxn;
}

export function addPickupRecord(pickup: Omit<StoredPickup, 'id' | 'createdAt'>): StoredPickup {
  const db = readDatabase();
  const id = `PKP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const newPickup: StoredPickup = {
    ...pickup,
    id,
    createdAt: new Date().toISOString(),
  };

  db.pickups.unshift(newPickup);
  writeDatabase(db);
  return newPickup;
}
