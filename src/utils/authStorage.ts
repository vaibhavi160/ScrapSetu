import { UserProfile, AuthCredentials, SignUpData, AuthResponse, Transaction, PickupSchedule } from '../types';

const AUTH_STORAGE_KEY = 'scrapsetu_current_user';
const TOKEN_STORAGE_KEY = 'scrapsetu_auth_token';

// Local storage session retrieval
export function getStoredUser(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw || raw === 'undefined' || raw === 'null') return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveStoredUser(user: UserProfile | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch (err) {
    console.error('Failed to save auth state to localStorage:', err);
  }
}

// Server Database Auth API calls
export async function loginUser(credentials: AuthCredentials): Promise<AuthResponse> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const data = await res.json();
    if (data.success && data.user) {
      saveStoredUser(data.user);
      if (data.token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
      }
    }
    return data;
  } catch (err: any) {
    console.error('Login request failed:', err);
    return {
      success: false,
      message: 'Network error or server unreachable. Please try again.',
    };
  }
}

export async function signupUser(data: SignUpData): Promise<AuthResponse> {
  try {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (result.success && result.user) {
      saveStoredUser(result.user);
      if (result.token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, result.token);
      }
    }
    return result;
  } catch (err: any) {
    console.error('Sign up request failed:', err);
    return {
      success: false,
      message: 'Could not connect to database server. Please check your network.',
    };
  }
}

export async function logoutUser(): Promise<void> {
  saveStoredUser(null);
}

// Fetch complete database records from server
export async function fetchDatabaseRecords(): Promise<{
  success: boolean;
  users?: UserProfile[];
  transactions?: any[];
  pickups?: any[];
  lastUpdated?: string;
  error?: string;
}> {
  try {
    const res = await fetch('/api/database/records');
    return await res.json();
  } catch (err: any) {
    console.error('Failed to fetch database records:', err);
    return { success: false, error: err?.message || 'Database fetch failed' };
  }
}

// Fetch database summary metrics
export async function fetchDatabaseSummary(): Promise<any> {
  try {
    const res = await fetch('/api/database/summary');
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch database summary:', err);
    return { success: false };
  }
}

// Record transaction to server database
export async function syncTransactionToDatabase(transaction: Transaction, currentUser?: UserProfile | null) {
  try {
    const payload = {
      userId: currentUser?.id || 'guest',
      userName: currentUser?.name || transaction.ledgerBlock?.collectorName || 'Scrap Collector',
      category: transaction.payload.classification.confirmedCategory,
      weightKg: transaction.payload.weightKg,
      ratePerKg: transaction.payload.calculatedPricePerKg,
      totalAmount: transaction.payload.totalEstimatedPrice,
      recyclerName: transaction.selectedRecycler.name,
      cpcbRegNumber: transaction.selectedRecycler.cpcbRegNumber,
      paymentMethod: transaction.payment.method === 'upi' ? 'UPI Instant' : 'Direct AEPS',
      utrNumber: transaction.payment.utrNumber,
      status: 'paid',
    };

    const res = await fetch('/api/database/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err) {
    console.warn('Could not save transaction to server database directly:', err);
    return null;
  }
}

// Record pickup to server database
export async function syncPickupToDatabase(
  pickup: PickupSchedule,
  currentUser: UserProfile | null,
  weightKg: number,
  category: string
) {
  try {
    const payload = {
      userId: currentUser?.id || 'guest',
      userName: currentUser?.name || 'Customer',
      phone: pickup.contactNumber || currentUser?.phone || '',
      address: pickup.collectorLandmark,
      city: currentUser?.city || 'Mumbai',
      category,
      estimatedWeightKg: weightKg,
      date: pickup.date,
      timeSlot: pickup.timeSlot,
    };

    const res = await fetch('/api/database/pickups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err) {
    console.warn('Could not save pickup to server database directly:', err);
    return null;
  }
}
