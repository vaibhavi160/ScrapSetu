import { Transaction, AppSettings, ClassificationResult, Language, WasteItemPayload, Recycler, PickupSchedule, LedgerBlock, WasteCategory } from '../types';
import { INITIAL_TRANSACTIONS, MOCK_RECYCLERS } from '../data/mockData';

const STORAGE_KEYS = {
  TRANSACTIONS: 'scrapsetu_transactions',
  OFFLINE_QUEUE: 'scrapsetu_offline_queue',
  CLASSIFICATION_LOGS: 'scrapsetu_classification_logs',
  SETTINGS: 'scrapsetu_settings',
};

export const normalizeTransaction = (t: any): Transaction => {
  if (!t || typeof t !== 'object') {
    return INITIAL_TRANSACTIONS[0];
  }

  const rawPayload = t.payload || {};
  const weightKg = Number(rawPayload.weightKg ?? t.weightKg ?? 10);
  const ratePerKg = Number(rawPayload.calculatedPricePerKg ?? t.ratePerKg ?? 150);
  const totalEstimatedPrice = Number(
    rawPayload.totalEstimatedPrice ??
    t.totalAmount ??
    t.payment?.amount ??
    (weightKg * ratePerKg)
  );
  const category: WasteCategory = (
    rawPayload.classification?.confirmedCategory ??
    t.categoryName ??
    t.categoryId ??
    t.wasteCategory ??
    'E-waste'
  ) as WasteCategory;

  const timestamp = typeof t.timestamp === 'number'
    ? t.timestamp
    : (t.timestamp ? new Date(t.timestamp).getTime() : Date.now());

  const payload: WasteItemPayload = {
    photoUrl: rawPayload.photoUrl || t.photoUrl || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80',
    quality: rawPayload.quality || {
      isAcceptable: true,
      lighting: 'good',
      blur: 'clear',
      containment: 'full',
      overallScore: 92,
      blurScore: 91,
      lightingScore: 87,
      objectDetected: true,
      issues: [],
    },
    classification: rawPayload.classification || {
      predictedCategory: category,
      confidence: 0.94,
      isUncertain: false,
      confirmedCategory: category,
      wasManuallyCorrected: false,
      timestamp,
      logId: `LOG-${t.id || 'GEN'}`,
      photoUrl: rawPayload.photoUrl || t.photoUrl || '',
    },
    weightKg,
    condition: rawPayload.condition || {
      cleanliness: t.cleanliness || 'clean',
      structural: t.structural || 'intact',
    },
    calculatedPricePerKg: ratePerKg,
    totalEstimatedPrice,
    marketMiddlemanTotal: Number(rawPayload.marketMiddlemanTotal ?? Math.round(totalEstimatedPrice * 0.7)),
    fairAdvantageAmount: Number(rawPayload.fairAdvantageAmount ?? t.fairAdvantageAmount ?? Math.round(totalEstimatedPrice * 0.3)),
  };

  const selectedRecycler: Recycler = t.selectedRecycler || {
    id: t.recyclerId || MOCK_RECYCLERS[0].id,
    name: t.recyclerName || MOCK_RECYCLERS[0].name,
    cpcbRegNumber: t.cpcbRegNumber || MOCK_RECYCLERS[0].cpcbRegNumber,
    spcbCertified: true,
    address: 'Dharavi / Andheri Link Road, Mumbai',
    city: 'Mumbai',
    lat: 19.0415,
    lng: 72.8538,
    rating: 4.8,
    reviewCount: 38,
    acceptedCategories: ['E-waste', 'Metal', 'Plastic'],
    priceMultiplier: 1.05,
    pickupAvailable: true,
    minPickupWeightKg: 5,
    pickupTimeHours: 2,
    phone: '+91 98200 11982',
    verifiedBadge: true,
  };

  const pickup: PickupSchedule = t.pickup || {
    type: 'immediate',
    date: new Date(timestamp).toISOString().split('T')[0],
    timeSlot: '11:00 AM - 01:00 PM',
    collectorLandmark: t.address || 'Scrap Collection Point',
    contactNumber: t.phone || '+91 98200 11982',
  };

  const ledgerBlock: LedgerBlock = t.ledgerBlock || {
    blockNumber: t.blockNumber || 1042,
    transactionId: t.id || `EPR-${Date.now()}`,
    timestamp,
    collectorId: t.collectorId || 'COL-MUM-4001',
    collectorName: t.collectorName || 'Collector',
    recyclerId: selectedRecycler.id,
    recyclerName: selectedRecycler.name,
    cpcbRegNumber: selectedRecycler.cpcbRegNumber,
    wasteCategory: category,
    weightKg,
    pricePerKg: ratePerKg,
    totalAmount: totalEstimatedPrice,
    location: { lat: 19.0415, lng: 72.8538, areaName: 'Mumbai, MH' },
    photoHash: '0x' + (t.id || 'hash').slice(-8),
    previousBlockHash: '0x4a9b2c1d8e7f6a5b4c3d2e1f',
    currentBlockHash: '0x7e2d9a1b8c4f5e6a7b8c9d0e',
    digitalSignature: 'SIG-CPCB-AUTH-VERIFIED-2026',
    eprCreditUnits: weightKg,
  };

  const payment = t.payment || {
    method: t.paymentMethod || 'upi',
    accountOrUpiId: t.accountOrUpiId || 'collector@upi',
    utrNumber: t.utrNumber || `UTR-SBIN-${Date.now().toString().slice(-6)}`,
    paidAt: timestamp,
    amount: totalEstimatedPrice,
    receiptQr: `UPI:collector@upi?am=${totalEstimatedPrice}&tr=${t.id || Date.now()}`,
  };

  return {
    ...t,
    id: t.id || `TXN-${Date.now()}`,
    timestamp,
    status: t.status || (t.paymentStatus === 'verified' ? 'paid' : 'completed'),
    payload,
    selectedRecycler,
    pickup,
    ledgerBlock,
    payment,
    syncStatus: t.syncStatus || 'synced',
  };
};

const DEFAULT_SETTINGS: AppSettings = {
  language: 'hi', // Hindi default for target informal collectors, easily toggled to mr or en
  offlineSimulation: false,
  lowBandwidthMode: false,
  voiceAutoRead: true,
  collectorName: 'Ramesh Kabadiwala',
  collectorPhone: '+91 98200 11982',
  collectorUpi: 'ramesh.scrap@upi',
};

export const getStoredSettings = (): AppSettings => {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw || raw === 'undefined' || raw === 'null') return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return DEFAULT_SETTINGS;
    const validLanguages: Language[] = ['en', 'hi', 'mr'];
    const language: Language = validLanguages.includes(parsed.language) ? parsed.language : 'hi';
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      language,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const saveStoredSettings = (settings: AppSettings): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
};

export const getStoredTransactions = (): Transaction[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeTransaction) : [];
  } catch {
    return [];
  }
};

export const saveTransactions = (transactions: Transaction[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  } catch (err) {
    console.error('Failed to save transactions list:', err);
  }
};

export const saveStoredTransaction = (transaction: Transaction): void => {
  if (typeof window === 'undefined') return;
  try {
    const all = getStoredTransactions();
    const existingIndex = all.findIndex((t) => t.id === transaction.id);
    let updated: Transaction[];
    if (existingIndex >= 0) {
      updated = [...all];
      updated[existingIndex] = transaction;
    } else {
      updated = [transaction, ...all];
    }
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updated));

    // If offline, also add to offline sync queue
    if (transaction.syncStatus === 'pending_sync') {
      addToOfflineQueue(transaction);
    }
  } catch (err) {
    console.error('Failed to save transaction:', err);
  }
};

export const getOfflineQueue = (): Transaction[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(normalizeTransaction) : [];
  } catch {
    return [];
  }
};

export const addToOfflineQueue = (transaction: Transaction): void => {
  if (typeof window === 'undefined') return;
  try {
    const queue = getOfflineQueue();
    const filtered = queue.filter((t) => t.id !== transaction.id);
    localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify([transaction, ...filtered]));
  } catch (err) {
    console.error('Failed to add to offline queue:', err);
  }
};

export const queueItemForSync = addToOfflineQueue;
export const getPendingSyncItems = getOfflineQueue;

export const syncOfflineQueue = (): { count: number; message: string } => {
  if (typeof window === 'undefined') return { count: 0, message: 'No items to sync' };
  try {
    const queue = getOfflineQueue();
    if (queue.length === 0) return { count: 0, message: 'Ledger already in sync' };

    const all = getStoredTransactions();
    const updated = all.map((t) => {
      if (queue.some((q) => q.id === t.id)) {
        return { ...t, syncStatus: 'synced' as const };
      }
      return t;
    });

    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updated));
    localStorage.removeItem(STORAGE_KEYS.OFFLINE_QUEUE);
    return { count: queue.length, message: `Successfully synchronized ${queue.length} transactions with CPCB server!` };
  } catch {
    return { count: 0, message: 'Sync failed, will retry' };
  }
};

export const syncPendingItems = syncOfflineQueue;

export const logClassificationRecord = (result: ClassificationResult): void => {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CLASSIFICATION_LOGS);
    const logs = raw ? JSON.parse(raw) : [];
    logs.unshift(result);
    // Keep last 100 logs
    const trimmed = logs.slice(0, 100);
    localStorage.setItem(STORAGE_KEYS.CLASSIFICATION_LOGS, JSON.stringify(trimmed));
  } catch (err) {
    console.error('Failed to save classification log:', err);
  }
};

export const getClassificationLogs = (): ClassificationResult[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CLASSIFICATION_LOGS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};
