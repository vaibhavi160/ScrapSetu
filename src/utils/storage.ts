import { Transaction, AppSettings, ClassificationResult, Language } from '../types';
import { INITIAL_TRANSACTIONS } from '../data/mockData';

const STORAGE_KEYS = {
  TRANSACTIONS: 'scrapsetu_transactions',
  OFFLINE_QUEUE: 'scrapsetu_offline_queue',
  CLASSIFICATION_LOGS: 'scrapsetu_classification_logs',
  SETTINGS: 'scrapsetu_settings',
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
  if (typeof window === 'undefined') return INITIAL_TRANSACTIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(INITIAL_TRANSACTIONS));
      return INITIAL_TRANSACTIONS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_TRANSACTIONS;
  } catch {
    return INITIAL_TRANSACTIONS;
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
    return raw ? JSON.parse(raw) : [];
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
