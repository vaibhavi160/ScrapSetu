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
  limit
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { UserProfile, UserRole, WasteCategoryInfo, Recycler, Transaction } from './types';
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
  // Only authenticated users can write directory updates per Firestore security rules
  if (!auth.currentUser) {
    console.info('Skipping recyclers seed: User is not authenticated with Firebase Auth yet.');
    return;
  }
  const path = 'recyclers';
  try {
    for (const rec of MOCK_RECYCLERS) {
      const safeId = rec.id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
      const recDocRef = doc(db, path, safeId);
      await setDoc(recDocRef, {
        id: safeId,
        name: rec.name.slice(0, 100),
        category: (rec.acceptedCategories[0] || 'E-waste').slice(0, 50),
        ratePerKg: Math.round(120 * (rec.priceMultiplier || 1)),
        distanceKm: Number(rec.distanceKm || 3.5),
        isVerified: !!rec.verifiedBadge,
        eprCertified: !!rec.spcbCertified,
        rating: Number(rec.rating || 4.5),
        address: (rec.address || 'Industrial Hub').slice(0, 100),
        phone: rec.phone || '',
        contactPerson: 'Authorized Facility Manager',
      }, { merge: true });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Fetch categories from Firestore
export async function fetchCategoriesFromFirestore(): Promise<WasteCategoryInfo[]> {
  const path = 'categories';
  try {
    const snapshot = await getDocs(collection(db, path));
    if (snapshot.empty) {
      // If empty, return mock data
      return WASTE_CATEGORIES;
    }
    const list: WasteCategoryInfo[] = [];
    snapshot.forEach((d) => {
      const data = d.data();
      const matched = WASTE_CATEGORIES.find((c) => c.id === data.id);
      if (matched) {
        list.push({
          ...matched,
          marketRatePerKg: data.ratePerKg ?? matched.marketRatePerKg,
          basePricePerKg: data.baseRatePerKg ?? matched.basePricePerKg,
        });
      }
    });
    return list.length > 0 ? list : WASTE_CATEGORIES;
  } catch (error) {
    console.warn('Could not read categories from Firestore, falling back to local data:', error);
    return WASTE_CATEGORIES;
  }
}

// Fetch recyclers from Firestore
export async function fetchRecyclersFromFirestore(): Promise<Recycler[]> {
  const path = 'recyclers';
  try {
    const snapshot = await getDocs(collection(db, path));
    if (snapshot.empty) {
      return MOCK_RECYCLERS;
    }
    const list: Recycler[] = [];
    snapshot.forEach((d) => {
      const data = d.data();
      const matched = MOCK_RECYCLERS.find((r) => r.id === data.id);
      if (matched) {
        list.push({
          ...matched,
          verifiedBadge: data.isVerified ?? matched.verifiedBadge,
          spcbCertified: data.eprCertified ?? matched.spcbCertified,
          rating: data.rating ?? matched.rating,
        });
      }
    });
    return list.length > 0 ? list : MOCK_RECYCLERS;
  } catch (error) {
    console.warn('Could not read recyclers from Firestore, falling back to local data:', error);
    return MOCK_RECYCLERS;
  }
}

// Subscribe to Categories in Firestore
export function subscribeCategories(callback: (categories: WasteCategoryInfo[]) => void): () => void {
  const path = 'categories';
  return onSnapshot(collection(db, path), (snapshot) => {
    if (!snapshot.empty) {
      const list: WasteCategoryInfo[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        const matched = WASTE_CATEGORIES.find((c) => c.id === data.id);
        if (matched) {
          list.push({
            ...matched,
            marketRatePerKg: data.ratePerKg ?? matched.marketRatePerKg,
            basePricePerKg: data.baseRatePerKg ?? matched.basePricePerKg,
          });
        }
      });
      if (list.length > 0) callback(list);
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
        const data = d.data();
        const matched = MOCK_RECYCLERS.find((r) => r.id === data.id);
        if (matched) {
          list.push({
            ...matched,
            verifiedBadge: data.isVerified ?? matched.verifiedBadge,
            spcbCertified: data.eprCertified ?? matched.spcbCertified,
            rating: data.rating ?? matched.rating,
          });
        }
      });
      if (list.length > 0) callback(list);
    }
  }, (error) => {
    console.warn('Recyclers snapshot listener error:', error);
  });
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

// Save Transaction to Firestore
export async function saveTransactionToFirestore(txn: Transaction, collectorId: string): Promise<void> {
  if (!auth.currentUser) {
    console.info('Skipping Firestore transaction save: User is not authenticated with Firebase Auth.');
    return;
  }
  const effectiveCollectorId = auth.currentUser.uid;
  const safeTxnId = txn.id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
  const safeCatId = (txn.payload.classification.confirmedCategory || 'e_waste').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
  const path = `transactions/${safeTxnId}`;

  try {
    const txnDocRef = doc(db, 'transactions', safeTxnId);
    await setDoc(txnDocRef, {
      id: safeTxnId,
      collectorId: effectiveCollectorId,
      collectorName: (txn.ledgerBlock.collectorName || 'Collector').slice(0, 100),
      categoryId: safeCatId,
      categoryName: txn.payload.classification.confirmedCategory.slice(0, 60),
      weightKg: Number(txn.payload.weightKg || 0),
      ratePerKg: Number(txn.payload.calculatedPricePerKg || 0),
      totalAmount: Number(txn.payload.totalEstimatedPrice || 0),
      paymentStatus: (txn.status === 'completed' || txn.status === 'paid' ? 'verified' : 'pending') as 'pending' | 'verified' | 'failed',
      paymentMethod: txn.payment.method,
      timestamp: new Date(txn.timestamp).toISOString(),
      verified: true,
    }, { merge: true });

    // Also increment user profile metrics if doc exists
    try {
      const userRef = doc(db, 'users', effectiveCollectorId);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const u = userDoc.data();
        await setDoc(userRef, {
          totalEarnings: (u.totalEarnings || 0) + Number(txn.payload.totalEstimatedPrice || 0),
          totalWasteHandledKg: (u.totalWasteHandledKg || 0) + Number(txn.payload.weightKg || 0),
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

// Google Sign-In with Firebase Auth
export async function signInWithGoogle(selectedRole: UserRole = 'collector'): Promise<UserProfile> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const fbUser = result.user;
    
    // Check if profile exists in Firestore
    const existing = await getUserFromFirestore(fbUser.uid);
    if (existing) {
      return existing;
    }

    // Create new profile
    const newProfile: UserProfile = {
      id: fbUser.uid,
      name: fbUser.displayName || 'Scrap Partner',
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
