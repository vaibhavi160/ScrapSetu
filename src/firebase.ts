import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  getDocs, 
  collection, 
  onSnapshot, 
  getDocFromServer,
  query,
  where,
  limit,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { UserProfile, UserRole, WasteCategoryInfo, WasteCategory, Recycler, Transaction, WasteRecord } from './types';
import { WASTE_CATEGORIES, MOCK_RECYCLERS } from './data/mockData';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore (handles default or custom databaseId)
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Initialize Firebase Auth
export const auth = getAuth(app);
export { onAuthStateChanged, type FirebaseUser };

// Provider for Google Sign-In
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test Connection on boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase is offline or not yet reachable:', error.message);
      return false;
    }
    // Any other error (like document not found or permission check) still indicates network reachability
    return true;
  }
}

// Run initial check
testFirestoreConnection().catch(() => {});

// Seed / Synchronize Categories in Firestore
export async function seedCategoriesToFirestore(): Promise<void> {
  // Only authenticated users can write catalog updates per Firestore security rules
  if (!auth.currentUser) {
    console.info('Skipping categories seed: User is not authenticated with Firebase Auth yet.');
    return;
  }
  const path = 'categories';
  try {
    for (const cat of WASTE_CATEGORIES) {
      const safeId = cat.id.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase().slice(0, 40);
      const catDocRef = doc(db, path, safeId);
      await setDoc(catDocRef, {
        id: safeId,
        name: cat.nameEn.slice(0, 60),
        hindiName: cat.nameHi,
        ratePerKg: Number(cat.marketRatePerKg || 0),
        baseRatePerKg: Number(cat.basePricePerKg || 0),
        recyclable: true,
        safetyHazard: cat.hazardLevel,
        unit: 'kg',
        carbonFactorKg: cat.hazardLevel === 'high' ? 3.2 : 1.8,
      }, { merge: true });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Seed / Synchronize Recyclers in Firestore
export async function seedRecyclersToFirestore(): Promise<void> {
  const path = 'recyclers';
  try {
    for (const rec of MOCK_RECYCLERS) {
      const safeId = rec.id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
      const recDocRef = doc(db, path, safeId);
      await setDoc(recDocRef, {
        id: safeId,
        name: rec.name.slice(0, 100),
        cpcbRegNumber: (rec.cpcbRegNumber || 'CPCB/EPR-EW/2024/IND').slice(0, 60),
        spcbCertified: !!rec.spcbCertified,
        address: (rec.address || '').slice(0, 150),
        city: (rec.city || 'Mumbai').slice(0, 60),
        lat: Number(rec.lat || 19.0760),
        lng: Number(rec.lng || 72.8777),
        rating: Number(rec.rating || 4.8),
        reviewCount: Number(rec.reviewCount || 10),
        acceptedCategories: Array.isArray(rec.acceptedCategories) ? rec.acceptedCategories : ['E-waste'],
        priceMultiplier: Number(rec.priceMultiplier || 1.05),
        pickupAvailable: !!rec.pickupAvailable,
        minPickupWeightKg: Number(rec.minPickupWeightKg || 10),
        pickupTimeHours: Number(rec.pickupTimeHours || 3),
        phone: (rec.phone || '').slice(0, 30),
        verifiedBadge: !!rec.verifiedBadge,
        category: (rec.acceptedCategories[0] || 'E-waste').slice(0, 50),
        ratePerKg: Math.round(120 * (rec.priceMultiplier || 1)),
        distanceKm: Number(rec.distanceKm || 3.5),
        isVerified: !!rec.verifiedBadge,
        eprCertified: !!rec.spcbCertified,
      }, { merge: true });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Map Firestore doc to WasteCategoryInfo supporting custom created categories
export function mapDocToCategory(data: any, docId: string): WasteCategoryInfo {
  const matched = WASTE_CATEGORIES.find((c) => c.id === (data.id || docId));
  const nameEn = data.nameEn || data.name || (matched ? matched.nameEn : docId);
  const nameHi = data.nameHi || data.hindiName || (matched ? matched.nameHi : nameEn);
  const nameMr = data.nameMr || data.marathiName || (matched ? matched.nameMr : nameHi);
  const basePricePerKg = Number(data.basePricePerKg ?? data.baseRatePerKg ?? (matched ? matched.basePricePerKg : 50));
  const marketRatePerKg = Number(data.marketRatePerKg ?? data.ratePerKg ?? (matched ? matched.marketRatePerKg : 40));

  return {
    id: (data.id || docId) as any,
    nameEn,
    nameHi,
    nameMr,
    icon: data.icon || (matched ? matched.icon : 'Package'),
    subtypes: Array.isArray(data.subtypes) && data.subtypes.length > 0
      ? data.subtypes
      : (matched ? matched.subtypes : [nameEn]),
    basePricePerKg,
    marketRatePerKg,
    hazardLevel: data.hazardLevel || data.safetyHazard || (matched ? matched.hazardLevel : 'low'),
    color: data.color || (matched ? matched.color : '#0F1A3C'),
    createdBy: data.createdBy,
    createdAt: data.createdAt,
  };
}

// Helper to transform Firestore doc data into a full Recycler object
export function mapDocToRecycler(data: any, docId: string): Recycler {
  const matched = MOCK_RECYCLERS.find((r) => r.id === (data.id || docId));
  
  let acceptedCats: (WasteCategory | string)[] = [];
  if (Array.isArray(data.acceptedCategories) && data.acceptedCategories.length > 0) {
    acceptedCats = data.acceptedCategories;
  } else if (data.category) {
    acceptedCats = [data.category];
  } else if (matched) {
    acceptedCats = matched.acceptedCategories;
  } else {
    acceptedCats = ['E-waste', 'PCBs & Circuit Boards', 'Metal', 'Plastic'];
  }

  return {
    id: data.id || docId,
    name: data.name || (matched ? matched.name : 'Authorized Recycler Facility'),
    cpcbRegNumber: data.cpcbRegNumber || (matched ? matched.cpcbRegNumber : 'CPCB/EPR-EW/2024/IND'),
    spcbCertified: data.spcbCertified ?? data.eprCertified ?? (matched ? matched.spcbCertified : true),
    address: data.address || (matched ? matched.address : 'Authorized Scrap Processing Cluster'),
    city: data.city || (matched ? matched.city : 'Mumbai'),
    lat: typeof data.lat === 'number' && !isNaN(data.lat) ? data.lat : (matched ? matched.lat : 19.0760),
    lng: typeof data.lng === 'number' && !isNaN(data.lng) ? data.lng : (matched ? matched.lng : 72.8777),
    rating: typeof data.rating === 'number' ? data.rating : (matched ? matched.rating : 4.8),
    reviewCount: typeof data.reviewCount === 'number' ? data.reviewCount : (matched ? matched.reviewCount : 85),
    acceptedCategories: acceptedCats,
    priceMultiplier: typeof data.priceMultiplier === 'number' ? data.priceMultiplier : (matched ? matched.priceMultiplier : 1.05),
    pickupAvailable: typeof data.pickupAvailable === 'boolean' ? data.pickupAvailable : (matched ? matched.pickupAvailable : true),
    minPickupWeightKg: typeof data.minPickupWeightKg === 'number' ? data.minPickupWeightKg : (matched ? matched.minPickupWeightKg : 10),
    pickupTimeHours: typeof data.pickupTimeHours === 'number' ? data.pickupTimeHours : (matched ? matched.pickupTimeHours : 3),
    phone: data.phone || (matched ? matched.phone : '+91 98200 12345'),
    verifiedBadge: data.verifiedBadge ?? data.isVerified ?? (matched ? matched.verifiedBadge : true),
    customRates: data.customRates || (matched?.customRates || {}),
    ownerUid: data.ownerUid || matched?.ownerUid,
  };
}

// Fetch recyclers from Firestore
export async function fetchRecyclersFromFirestore(): Promise<Recycler[]> {
  const path = 'recyclers';
  try {
    const snapshot = await getDocs(collection(db, path));
    if (snapshot.empty) {
      // Seed verified facilities to Firestore so real documents exist
      await seedRecyclersToFirestore();
      const freshSnap = await getDocs(collection(db, path));
      const list: Recycler[] = [];
      freshSnap.forEach((d) => {
        list.push(mapDocToRecycler(d.data(), d.id));
      });
      return list.length > 0 ? list : MOCK_RECYCLERS;
    }
    const list: Recycler[] = [];
    snapshot.forEach((d) => {
      list.push(mapDocToRecycler(d.data(), d.id));
    });
    return list;
  } catch (error) {
    console.warn('Could not read recyclers from Firestore:', error);
    return [];
  }
}

// Fetch categories from Firestore
export async function fetchCategoriesFromFirestore(): Promise<WasteCategoryInfo[]> {
  try {
    const snap = await getDocs(collection(db, 'categories'));
    if (!snap.empty) {
      const list: WasteCategoryInfo[] = [];
      snap.forEach((d) => {
        list.push(mapDocToCategory(d.data(), d.id));
      });
      return list;
    }
    // If Firestore empty, seed standard categories
    await seedCategoriesToFirestore();
    const fresh = await getDocs(collection(db, 'categories'));
    const list: WasteCategoryInfo[] = [];
    fresh.forEach((d) => {
      list.push(mapDocToCategory(d.data(), d.id));
    });
    return list.length > 0 ? list : WASTE_CATEGORIES;
  } catch (err) {
    console.warn('Failed to fetch categories from Firestore:', err);
    return WASTE_CATEGORIES;
  }
}

// Subscribe to Categories in Firestore
export function subscribeCategories(callback: (categories: WasteCategoryInfo[]) => void): () => void {
  const path = 'categories';
  return onSnapshot(collection(db, path), (snapshot) => {
    if (!snapshot.empty) {
      const list: WasteCategoryInfo[] = [];
      snapshot.forEach((d) => {
        list.push(mapDocToCategory(d.data(), d.id));
      });
      callback(list);
    }
  }, (error) => {
    console.warn('Categories snapshot listener error:', error);
  });
}

// Subscribe to Recyclers in Firestore
export function subscribeRecyclers(callback: (recyclers: Recycler[]) => void): () => void {
  const path = 'recyclers';
  return onSnapshot(collection(db, path), (snapshot) => {
    if (!snapshot.empty) {
      const list: Recycler[] = [];
      snapshot.forEach((d) => {
        list.push(mapDocToRecycler(d.data(), d.id));
      });
      callback(list);
    }
  }, (error) => {
    console.warn('Recyclers snapshot listener error:', error);
  });
}

// Recycler: Create a new waste category in Firestore
export async function createCategoryInFirestore(categoryData: {
  nameEn: string;
  nameHi: string;
  marketRatePerKg: number;
  basePricePerKg?: number;
  hazardLevel?: 'low' | 'medium' | 'high';
  unit?: string;
  subtypes?: string[];
  createdBy?: string;
}): Promise<WasteCategoryInfo> {
  const safeId = categoryData.nameEn.trim().replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
  const path = `categories/${safeId}`;
  const basePricePerKg = Number(categoryData.basePricePerKg ?? Math.round(categoryData.marketRatePerKg * 1.12));
  const marketRatePerKg = Number(categoryData.marketRatePerKg);

  const payload = {
    id: safeId,
    name: categoryData.nameEn.trim(),
    nameEn: categoryData.nameEn.trim(),
    hindiName: categoryData.nameHi.trim() || categoryData.nameEn.trim(),
    nameHi: categoryData.nameHi.trim() || categoryData.nameEn.trim(),
    ratePerKg: marketRatePerKg,
    baseRatePerKg: basePricePerKg,
    recyclable: true,
    safetyHazard: categoryData.hazardLevel || 'low',
    hazardLevel: categoryData.hazardLevel || 'low',
    unit: categoryData.unit || 'kg',
    subtypes: categoryData.subtypes || [categoryData.nameEn.trim()],
    carbonFactorKg: categoryData.hazardLevel === 'high' ? 3.2 : 1.9,
    createdBy: categoryData.createdBy || 'recycler',
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'categories', safeId), payload, { merge: true });
    return mapDocToCategory(payload, safeId);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

// Recycler: Update custom prices and accepted categories in Firestore
export async function updateRecyclerRatesInFirestore(
  recyclerId: string,
  customRates: Record<string, number>,
  acceptedCategories?: string[]
): Promise<void> {
  const safeId = recyclerId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
  const path = `recyclers/${safeId}`;
  try {
    const updatePayload: Record<string, any> = {
      customRates,
      updatedAt: new Date().toISOString(),
    };
    if (acceptedCategories) {
      updatePayload.acceptedCategories = acceptedCategories;
    }
    await setDoc(doc(db, 'recyclers', safeId), updatePayload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

// Add a single recycler to Firestore
export async function addRecyclerToFirestore(recycler: Recycler): Promise<void> {
  const safeId = recycler.id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
  const path = `recyclers/${safeId}`;
  try {
    await setDoc(doc(db, 'recyclers', safeId), {
      ...recycler,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

// Add multiple recyclers to Firestore
export async function addMultipleRecyclersToFirestore(recyclers: Recycler[]): Promise<void> {
  for (const recycler of recyclers) {
    await addRecyclerToFirestore(recycler);
  }
}

// Save or Update User Profile in Firestore
export async function saveUserToFirestore(user: UserProfile): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== user.id) {
    console.info('Skipping Firestore user profile write: User not authenticated with matching Firebase Auth UID.');
    return;
  }
  const path = `users/${user.id}`;
  try {
    const userDocRef = doc(db, 'users', user.id);
    await setDoc(userDocRef, {
      id: user.id,
      name: user.name.slice(0, 100),
      phone: (user.phone || '').slice(0, 20),
      email: (user.email || '').slice(0, 100),
      role: user.role,
      city: (user.city || '').slice(0, 60),
      pincode: (user.pincode || '').slice(0, 10),
      upiId: (user.upiId || '').slice(0, 60),
      businessName: (user.businessName || '').slice(0, 100),
      totalEarnings: Number(user.totalEarnings || 0),
      totalWasteHandledKg: Number(user.totalWasteHandledKg || 0),
      transactionsCount: Number(user.transactionsCount || 0),
      updatedAt: new Date().toISOString(),
      createdAt: user.createdAt || new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Get User Profile from Firestore
export async function getUserFromFirestore(userId: string): Promise<UserProfile | null> {
  const path = `users/${userId}`;
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

// Save Waste Record to Firestore
export async function saveWasteDataToFirestore(wasteRecord: WasteRecord): Promise<void> {
  if (!auth.currentUser) {
    console.info('Skipping Firestore waste save: User is not authenticated with Firebase Auth.');
    return;
  }
  const effectiveCollectorId = auth.currentUser.uid;
  const safeId = wasteRecord.id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
  const path = `waste/${safeId}`;

  try {
    const wasteDocRef = doc(db, 'waste', safeId);
    await setDoc(wasteDocRef, {
      id: safeId,
      collectorId: effectiveCollectorId,
      collectorName: (wasteRecord.collectorName || 'Collector').slice(0, 100),
      categoryId: (wasteRecord.categoryId || 'e_waste').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40),
      categoryName: (wasteRecord.categoryName || 'Scrap Material').slice(0, 60),
      weightKg: Number(wasteRecord.weightKg || 0),
      ratePerKg: Number(wasteRecord.ratePerKg || 0),
      totalAmount: Number(wasteRecord.totalAmount || 0),
      fairAdvantageAmount: Number(wasteRecord.fairAdvantageAmount || 0),
      cleanliness: wasteRecord.cleanliness || 'clean',
      structural: wasteRecord.structural || 'intact',
      recyclerId: (wasteRecord.recyclerId || '').slice(0, 64),
      recyclerName: (wasteRecord.recyclerName || '').slice(0, 100),
      status: wasteRecord.status || 'scanned',
      timestamp: wasteRecord.timestamp || new Date().toISOString(),
      transactionId: (wasteRecord.transactionId || '').slice(0, 64),
    }, { merge: true });

    // Also update collector profile metrics in Firestore
    try {
      const userRef = doc(db, 'users', effectiveCollectorId);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const u = userDoc.data();
        await setDoc(userRef, {
          totalEarnings: (u.totalEarnings || 0) + Number(wasteRecord.totalAmount || 0),
          totalWasteHandledKg: (u.totalWasteHandledKg || 0) + Number(wasteRecord.weightKg || 0),
          transactionsCount: (u.transactionsCount || 0) + 1,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }
    } catch {
      // Profile metrics update optional
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Subscribe to Collector's Waste Records in Firestore
export function subscribeCollectorWaste(
  collectorId: string,
  callback: (records: WasteRecord[]) => void
): () => void {
  const path = 'waste';
  try {
    const q = query(
      collection(db, path),
      where('collectorId', '==', collectorId)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const list: WasteRecord[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as WasteRecord);
        });
        list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        callback(list);
      },
      (error) => {
        console.warn('Waste records snapshot listener notice:', error);
      }
    );
  } catch (error) {
    console.warn('Failed to setup waste subscription:', error);
    return () => {};
  }
}

// Subscribe to Collector's Transactions in Firestore
export function subscribeCollectorTransactions(
  collectorId: string,
  callback: (txns: any[]) => void
): () => void {
  const path = 'transactions';
  try {
    const q = query(
      collection(db, path),
      where('collectorId', '==', collectorId)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => {
          list.push(d.data());
        });
        list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        callback(list);
      },
      (error) => {
        console.warn('Transactions snapshot listener notice:', error);
      }
    );
  } catch (error) {
    console.warn('Failed to setup transactions subscription:', error);
    return () => {};
  }
}

// Fetch Collector Waste Records from Firestore
export async function fetchCollectorWasteFromFirestore(collectorId: string): Promise<WasteRecord[]> {
  const path = 'waste';
  try {
    const q = query(collection(db, path), where('collectorId', '==', collectorId));
    const snapshot = await getDocs(q);
    const list: WasteRecord[] = [];
    snapshot.forEach((d) => {
      list.push(d.data() as WasteRecord);
    });
    return list;
  } catch (error) {
    console.warn('Could not fetch waste records from Firestore:', error);
    return [];
  }
}

// Save Transaction to Firestore
export async function saveTransactionToFirestore(txn: Transaction, collectorId: string): Promise<void> {
  if (!auth.currentUser) {
    console.info('Skipping Firestore transaction save: User is not authenticated with Firebase Auth.');
    return;
  }
  const effectiveCollectorId = auth.currentUser.uid;
  const safeTxnId = txn.id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
  const safeCatId = (txn.payload?.classification?.confirmedCategory || (txn as any).categoryName || 'e_waste').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
  const path = `transactions/${safeTxnId}`;

  try {
    const txnDocRef = doc(db, 'transactions', safeTxnId);
    const safeAmount = Number(txn.payload?.totalEstimatedPrice ?? (txn as any).totalAmount ?? txn.payment?.amount ?? 0);
    const safeWeight = Number(txn.payload?.weightKg ?? (txn as any).weightKg ?? 0);
    const safeRate = Number(txn.payload?.calculatedPricePerKg ?? (txn as any).ratePerKg ?? 0);
    const catName = (txn.payload?.classification?.confirmedCategory || (txn as any).categoryName || 'Scrap Material').slice(0, 60);

    await setDoc(txnDocRef, {
      id: safeTxnId,
      collectorId: effectiveCollectorId,
      collectorName: (txn.ledgerBlock?.collectorName || 'Collector').slice(0, 100),
      categoryId: safeCatId,
      categoryName: catName,
      weightKg: safeWeight,
      ratePerKg: safeRate,
      totalAmount: safeAmount,
      paymentStatus: (txn.status === 'completed' || txn.status === 'paid' ? 'verified' : 'pending') as 'pending' | 'verified' | 'failed',
      paymentMethod: txn.payment?.method || 'upi',
      timestamp: new Date(txn.timestamp || Date.now()).toISOString(),
      verified: true,
      payload: txn.payload || null,
      selectedRecycler: txn.selectedRecycler || null,
      pickup: txn.pickup || null,
      ledgerBlock: txn.ledgerBlock || null,
      payment: txn.payment || null,
    }, { merge: true });

    // Also persist directly to waste collection in Firestore
    const wasteDocRef = doc(db, 'waste', safeTxnId);
    await setDoc(wasteDocRef, {
      id: safeTxnId,
      collectorId: effectiveCollectorId,
      collectorName: (txn.ledgerBlock?.collectorName || 'Collector').slice(0, 100),
      categoryId: safeCatId,
      categoryName: catName,
      weightKg: safeWeight,
      ratePerKg: safeRate,
      totalAmount: safeAmount,
      fairAdvantageAmount: Number(txn.payload?.fairAdvantageAmount || 0),
      cleanliness: txn.payload?.condition?.cleanliness || 'clean',
      structural: txn.payload?.condition?.structural || 'intact',
      recyclerId: txn.selectedRecycler?.id || '',
      recyclerName: txn.selectedRecycler?.name || '',
      status: txn.status === 'paid' || txn.status === 'completed' ? 'paid' : 'scanned',
      timestamp: new Date(txn.timestamp || Date.now()).toISOString(),
      transactionId: safeTxnId,
    }, { merge: true });

    // Also increment user profile metrics if doc exists
    try {
      const userRef = doc(db, 'users', effectiveCollectorId);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const u = userDoc.data();
        await setDoc(userRef, {
          totalEarnings: (u.totalEarnings || 0) + safeAmount,
          totalWasteHandledKg: (u.totalWasteHandledKg || 0) + safeWeight,
          transactionsCount: (u.transactionsCount || 0) + 1,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }
    } catch {
      // Profile metrics update optional
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Subscribe to transactions for a Recycler facility in Firestore
export function subscribeRecyclerTransactions(
  recyclerFacilityId: string,
  callback: (transactions: any[]) => void
): () => void {
  const path = 'transactions';
  try {
    return onSnapshot(
      collection(db, path),
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          if (
            !recyclerFacilityId ||
            data.recyclerId === recyclerFacilityId ||
            data.selectedRecycler?.id === recyclerFacilityId ||
            data.payload?.selectedRecycler?.id === recyclerFacilityId
          ) {
            list.push(data);
          }
        });
        list.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
        callback(list);
      },
      (error) => {
        console.warn('Recycler transactions listener error:', error);
      }
    );
  } catch (err) {
    console.warn('Failed to subscribe recycler transactions:', err);
    return () => {};
  }
}

// Update Transaction Status in Firestore (e.g. accepted, rejected, verified, counter_offer)
export async function updateTransactionStatusInFirestore(
  transactionId: string,
  status: string,
  extraData?: Record<string, any>
): Promise<void> {
  const safeTxnId = transactionId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
  const path = `transactions/${safeTxnId}`;
  try {
    const txnDocRef = doc(db, 'transactions', safeTxnId);
    await setDoc(txnDocRef, {
      status,
      ...(extraData || {}),
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    // Also sync status in waste collection
    try {
      const wasteDocRef = doc(db, 'waste', safeTxnId);
      await setDoc(wasteDocRef, {
        status: status === 'completed' || status === 'paid' ? 'paid' : status === 'verified_handover' ? 'verified_handover' : 'scanned',
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch {
      // optional
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

// Google Sign-In with Firebase Auth
export async function signInWithGoogle(selectedRole: UserRole = 'collector'): Promise<UserProfile> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const fbUser = result.user;
    
    // Check if profile exists in Firestore
    const existing = await getUserFromFirestore(fbUser.uid);
    if (existing) {
      const updated: UserProfile = {
        ...existing,
        name: existing.name || fbUser.displayName || 'Scrap Partner',
        email: existing.email || fbUser.email || undefined,
        lastLoginAt: new Date().toISOString(),
      };
      saveUserToFirestore(updated).catch(() => {});
      return updated;
    }

    // Create new profile
    const newProfile: UserProfile = {
      id: fbUser.uid,
      name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Scrap Partner',
      email: fbUser.email || undefined,
      phone: fbUser.phoneNumber || '',
      role: selectedRole,
      city: 'Mumbai',
      pincode: '400017',
      totalEarnings: 0,
      totalWasteHandledKg: 0,
      transactionsCount: 0,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    await saveUserToFirestore(newProfile);
    return newProfile;
  } catch (error: any) {
    console.warn('Google Sign In info:', error?.code || error?.message);
    throw error;
  }
}

// Firebase Email & Password Sign-In
export async function signInWithEmail(email: string, password: string): Promise<UserProfile> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    const fbUser = cred.user;
    
    // Check if profile exists in Firestore
    const existing = await getUserFromFirestore(fbUser.uid);
    if (existing) {
      // update lastLoginAt
      const updated: UserProfile = {
        ...existing,
        lastLoginAt: new Date().toISOString(),
      };
      saveUserToFirestore(updated).catch(() => {});
      return updated;
    }

    // Otherwise create default profile
    const newProfile: UserProfile = {
      id: fbUser.uid,
      name: fbUser.displayName || email.split('@')[0] || 'Scrap Partner',
      email: fbUser.email || email.trim(),
      phone: fbUser.phoneNumber || '',
      role: 'collector',
      city: 'Mumbai',
      pincode: '400017',
      totalEarnings: 0,
      totalWasteHandledKg: 0,
      transactionsCount: 0,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    await saveUserToFirestore(newProfile);
    return newProfile;
  } catch (error: any) {
    console.warn('Email Sign In info:', error?.code || error?.message);
    throw error;
  }
}

// Firebase Email & Password Registration (Sign Up)
export async function signUpWithEmail(
  email: string, 
  password: string, 
  name: string, 
  role: UserRole = 'collector', 
  details?: { phone?: string; city?: string; pincode?: string; upiId?: string; businessName?: string }
): Promise<UserProfile> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const fbUser = cred.user;

    if (name.trim()) {
      await updateProfile(fbUser, { displayName: name.trim() }).catch(() => {});
    }

    const newProfile: UserProfile = {
      id: fbUser.uid,
      name: name.trim() || email.split('@')[0],
      email: fbUser.email || email.trim(),
      phone: details?.phone?.trim() || '',
      role,
      city: details?.city?.trim() || 'Mumbai',
      pincode: details?.pincode?.trim() || '400017',
      upiId: details?.upiId?.trim() || undefined,
      businessName: details?.businessName?.trim() || undefined,
      totalEarnings: 0,
      totalWasteHandledKg: 0,
      transactionsCount: 0,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    await saveUserToFirestore(newProfile);
    return newProfile;
  } catch (error: any) {
    console.warn('Email Sign Up info:', error?.code || error?.message);
    throw error;
  }
}

// Firebase Password Reset Email
export async function resetUserPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email.trim());
  } catch (error: any) {
    console.warn('Password Reset info:', error?.code || error?.message);
    throw error;
  }
}

// Sign out from Firebase Auth
export async function signOutFromFirebase(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Sign Out Error:', error);
  }
}
