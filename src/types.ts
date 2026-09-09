export type Language = 'en' | 'hi' | 'mr';

export type FlowStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type WasteCategory =
  | 'PCBs & Circuit Boards'
  | 'Lithium-ion & Batteries'
  | 'Copper Wire & Motors'
  | 'Smartphones & Tablets'
  | 'Laptops & Computers'
  | 'Displays & CRT Monitors'
  | 'Large White Goods & ACs'
  | 'Small Home Appliances'
  | 'Fluorescent & LED Lighting'
  | 'Solar PV Panels & Inverters'
  | 'E-waste'
  | 'Batteries'
  | 'Metal'
  | 'Plastic'
  | 'Paper/Cardboard'
  | 'Glass'
  | 'Organic'
  | 'Textile'
  | 'Rubber'
  | 'Mixed/Other'
  | (string & {});

export interface WasteCategoryInfo {
  id: string;
  nameEn: string;
  nameHi: string;
  nameMr?: string;
  icon?: string;
  subtypes?: string[];
  basePricePerKg: number;
  marketRatePerKg: number;
  hazardLevel?: 'low' | 'medium' | 'high';
  color?: string;
  createdBy?: string;
  createdAt?: string;
}

export interface ImageQualityAssessment {
  isAcceptable: boolean;
  blurScore: number; // 0 - 100 (higher is sharper)
  lightingScore: number; // 0 - 100
  objectDetected: boolean;
  issues: string[];
}

export type PhotoQualityAssessment = ImageQualityAssessment;

export interface ClassificationResult {
  predictedCategory: WasteCategory;
  confidence: number; // 0.0 to 1.0 (e.g. 0.88)
  secondaryPrediction?: WasteCategory;
  secondaryConfidence?: number;
  isUncertain: boolean; // true if confidence < 0.70
  confirmedCategory: WasteCategory;
  wasManuallyCorrected: boolean;
  timestamp: number;
  logId: string;
  photoUrl: string;
  detectedItemName?: string;
  detectedItemNameHi?: string;
  materials?: string[];
  hazardousElements?: string[];
  safetyGuidanceEn?: string;
  safetyGuidanceHi?: string;
  estimatedWeightKg?: number;
  cleanliness?: 'clean' | 'dirty';
  structural?: 'intact' | 'damaged';
  aiModelSource?: string;
}

export interface WasteItemPayload {
  photoUrl: string;
  quality: ImageQualityAssessment;
  classification: ClassificationResult;
  weightKg: number;
  condition: {
    cleanliness: 'clean' | 'dirty';
    structural: 'intact' | 'damaged';
  };
  calculatedPricePerKg: number;
  totalEstimatedPrice: number;
  marketMiddlemanTotal: number;
  fairAdvantageAmount: number;
}

export interface WasteRecord {
  id: string;
  collectorId: string;
  collectorName: string;
  categoryId: string;
  categoryName: string;
  weightKg: number;
  ratePerKg: number;
  totalAmount: number;
  fairAdvantageAmount?: number;
  cleanliness?: 'clean' | 'dirty';
  structural?: 'intact' | 'damaged';
  recyclerId?: string;
  recyclerName?: string;
  status: 'scanned' | 'pending_pickup' | 'verified_handover' | 'paid' | 'completed';
  timestamp: string;
  transactionId?: string;
}

export interface Recycler {
  id: string;
  name: string;
  cpcbRegNumber: string; // Central Pollution Control Board Auth #
  spcbCertified: boolean;
  address: string;
  city: string;
  lat: number;
  lng: number;
  rating: number;
  reviewCount: number;
  acceptedCategories: (WasteCategory | string)[];
  priceMultiplier: number; // 0.95 to 1.15
  pickupAvailable: boolean;
  minPickupWeightKg: number;
  pickupTimeHours: number;
  phone: string;
  verifiedBadge: boolean;
  distanceKm?: number;
  drivingEtaMins?: number;
  customRates?: Record<string, number>;
  ownerUid?: string;
}

export interface PickupSchedule {
  type: 'immediate' | 'scheduled' | 'dropoff';
  date: string;
  timeSlot: string;
  collectorLandmark: string;
  contactNumber: string;
}

export interface LedgerBlock {
  blockNumber: number;
  transactionId: string;
  timestamp: number;
  collectorId: string;
  collectorName: string;
  recyclerId: string;
  recyclerName: string;
  cpcbRegNumber: string;
  wasteCategory: WasteCategory;
  weightKg: number;
  pricePerKg: number;
  totalAmount: number;
  location: {
    lat: number;
    lng: number;
    areaName: string;
  };
  photoHash: string;
  previousBlockHash: string;
  currentBlockHash: string;
  digitalSignature: string;
  eprCreditUnits: number;
}

export interface Transaction {
  id: string; // e.g. EPR-2026-MUM-4821
  timestamp: number;
  status: 'draft' | 'pending_pickup' | 'accepted' | 'rejected' | 'verified_handover' | 'paid' | 'completed';
  payload: WasteItemPayload;
  selectedRecycler: Recycler;
  pickup: PickupSchedule;
  ledgerBlock: LedgerBlock;
  payment: {
    method: 'upi' | 'aeps' | 'bank_transfer';
    accountOrUpiId: string;
    utrNumber: string;
    paidAt: number;
    amount: number;
    receiptQr: string;
  };
  syncStatus: 'synced' | 'pending_sync';
  counterOffer?: {
    originalPrice: number;
    counterPrice: number;
    counterPricePerKg: number;
    note?: string;
    timestamp: number;
    status: 'pending' | 'accepted' | 'declined';
  };
  recyclerNotes?: string;
}

export interface SafetyTip {
  id: string;
  category: WasteCategory | 'General';
  titleEn: string;
  titleHi: string;
  titleMr: string;
  bodyEn: string;
  bodyHi: string;
  bodyMr: string;
  doTextEn: string;
  doTextHi: string;
  doTextMr: string;
  dontTextEn: string;
  dontTextHi: string;
  dontTextMr: string;
  hazardIcon: string;
  severity: 'critical' | 'warning' | 'info';
}

export interface AppSettings {
  language: Language;
  offlineSimulation: boolean;
  lowBandwidthMode: boolean;
  voiceAutoRead: boolean;
  collectorName: string;
  collectorPhone: string;
  collectorUpi: string;
}

export type UserRole = 'collector' | 'seller' | 'recycler' | 'admin';
export type SelectedRole = 'collector' | 'recycler';

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: UserRole;
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

export interface AuthCredentials {
  phoneOrEmail: string;
  passwordOrPin: string;
}

export interface SignUpData {
  name: string;
  phone: string;
  email?: string;
  passwordOrPin: string;
  role: UserRole;
  city: string;
  pincode: string;
  upiId?: string;
  cpcbLicenseNumber?: string;
  businessName?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: UserProfile;
  token?: string;
  message?: string;
}
