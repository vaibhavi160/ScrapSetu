import React, { useState, useEffect } from 'react';
import { 
  Language, FlowStep, WasteCategory, AppSettings, 
  Transaction, Recycler, PickupSchedule, ClassificationResult, PhotoQualityAssessment,
  UserProfile
} from './types';
import { TRANSLATIONS } from './utils/translations';
import { 
  getStoredSettings, saveStoredSettings, getStoredTransactions, 
  saveStoredTransaction, getPendingSyncItems, queueItemForSync, syncPendingItems 
} from './utils/storage';
import {
  getStoredUser,
  saveStoredUser,
  logoutUser,
  syncTransactionToDatabase,
  syncPickupToDatabase,
} from './utils/authStorage';
import { playChime, stopSpeech } from './utils/audioSpeech';
import { getCurrentCollectorLocation } from './utils/geo';
import { MOCK_RECYCLERS, WASTE_CATEGORIES } from './data/mockData';
import { 
  auth, 
  onAuthStateChanged, 
  getUserFromFirestore, 
  saveUserToFirestore,
  seedCategoriesToFirestore, 
  seedRecyclersToFirestore, 
  subscribeCategories, 
  subscribeRecyclers, 
  saveTransactionToFirestore, 
  signOutFromFirebase 
} from './firebase';

// Core Components
import { Header } from './components/Header';
import { StepProgressBar } from './components/StepProgressBar';
import { SafetyGuidanceModal } from './components/SafetyGuidanceModal';
import { ImpactDashboardModal } from './components/ImpactDashboardModal';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';
import { DatabaseViewerModal } from './components/DatabaseViewerModal';

// Step Screens
import { LoginScreen } from './screens/LoginScreen';
import { Step1HomeScreen } from './screens/Step1HomeScreen';
import { Step2CameraScreen } from './screens/Step2CameraScreen';
import { Step3ClassificationScreen } from './screens/Step3ClassificationScreen';
import { Step4WeightConditionScreen } from './screens/Step4WeightConditionScreen';
import { Step5FairPriceScreen } from './screens/Step5FairPriceScreen';
import { Step6RecyclerMapScreen } from './screens/Step6RecyclerMapScreen';
import { Step7AcceptPickupScreen } from './screens/Step7AcceptPickupScreen';
import { Step8HandoverScreen } from './screens/Step8HandoverScreen';
import { Step9PaymentScreen } from './screens/Step9PaymentScreen';
import { Step10EarningsScreen } from './screens/Step10EarningsScreen';

export default function App() {
  // App Settings & Auth state
  const [settings, setSettings] = useState<AppSettings>(getStoredSettings());
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(getStoredUser());
  const [guestAccess, setGuestAccess] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<FlowStep>(1);
  const [activeModal, setActiveModal] = useState<'safety' | 'impact' | 'settings' | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>(getStoredTransactions());
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(getPendingSyncItems().length);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active Transaction Flow In-Progress State
  const [photoDataUrl, setPhotoDataUrl] = useState<string>('');
  const [photoQuality, setPhotoQuality] = useState<PhotoQualityAssessment | undefined>();
  const [classification, setClassification] = useState<ClassificationResult>({
    predictedCategory: 'E-waste',
    confidence: 0.94,
    secondaryPrediction: 'Metal',
    secondaryConfidence: 0.05,
    isUncertain: false,
    confirmedCategory: 'E-waste',
    wasManuallyCorrected: false,
    timestamp: Date.now(),
    logId: 'LOG-INIT-01',
    photoUrl: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=500&q=80',
  });
  const [weightKg, setWeightKg] = useState<number>(14.5);
  const [condition, setCondition] = useState<{ cleanliness: 'clean' | 'dirty'; structural: 'intact' | 'damaged' }>({
    cleanliness: 'clean',
    structural: 'intact',
  });
  const [pricingData, setPricingData] = useState<{
    calculatedPricePerKg: number;
    totalEstimatedPrice: number;
    marketMiddlemanTotal: number;
    fairAdvantageAmount: number;
  }>({
    calculatedPricePerKg: 154,
    totalEstimatedPrice: 2233,
    marketMiddlemanTotal: 1232,
    fairAdvantageAmount: 1001,
  });
  const [selectedRecycler, setSelectedRecycler] = useState<Recycler>(MOCK_RECYCLERS[0]);
  const [pickupSchedule, setPickupSchedule] = useState<PickupSchedule | undefined>();
  const [activeTransaction, setActiveTransaction] = useState<Transaction | null>(null);
  const [presetIndex, setPresetIndex] = useState<number | undefined>(undefined);

  // Stop any ongoing voice when step or modal changes
  useEffect(() => {
    stopSpeech();
  }, [currentStep, activeModal, settings?.language]);

  // Connect & Sync with Firebase Firestore (Categories, Recyclers, Authentication)
  useEffect(() => {
    // 1. Real-time Categories listener (public read)
    const unsubCats = subscribeCategories((cats) => {
      console.log(`Synced ${cats.length} scrap categories from Firebase Firestore`);
    });

    // 2. Real-time Recyclers listener (public read)
    const unsubRecs = subscribeRecyclers((recs) => {
      console.log(`Synced ${recs.length} verified recyclers from Firebase Firestore`);
    });

    // 3. Firebase Authentication state listener
    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          // Sync catalog when authenticated
          seedCategoriesToFirestore().catch(() => {});
          seedRecyclersToFirestore().catch(() => {});

          const profile = await getUserFromFirestore(fbUser.uid);
          if (profile) {
            setCurrentUser(profile);
            saveStoredUser(profile);
            handleUpdateSettings({
              collectorName: profile.name,
              collectorPhone: profile.phone || '',
              ...(profile.upiId ? { collectorUpi: profile.upiId } : {}),
            });
          } else {
            const fallbackProfile: UserProfile = {
              id: fbUser.uid,
              name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Scrap Partner',
              email: fbUser.email || undefined,
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
            setCurrentUser(fallbackProfile);
            saveStoredUser(fallbackProfile);
            saveUserToFirestore(fallbackProfile).catch(() => {});
          }
        } catch (e) {
          console.warn('Could not load user profile from Firestore:', e);
        }
      }
    });

    return () => {
      unsubCats();
      unsubRecs();
      unsubAuth();
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleUpdateSettings = (newPartial: Partial<AppSettings>) => {
    const updated = { ...settings, ...newPartial };
    setSettings(updated);
    saveStoredSettings(updated);
  };

  const handleTriggerSync = () => {
    const res = syncPendingItems();
    setPendingSyncCount(0);
    setTransactions(getStoredTransactions());
    showToast(res.message);
  };

  // Step 2 -> 3
  const handlePhotoCaptured = (
    photoUrl: string,
    quality: PhotoQualityAssessment,
    capturedPresetIndex?: number
  ) => {
    setPhotoDataUrl(photoUrl);
    setPhotoQuality(quality);
    setPresetIndex(capturedPresetIndex);
    setCurrentStep(3);
  };

  // Step 3 -> 4
  const handleClassificationConfirmed = (confirmedResult: ClassificationResult) => {
    setClassification(confirmedResult);
    if (typeof confirmedResult.estimatedWeightKg === 'number' && confirmedResult.estimatedWeightKg > 0) {
      setWeightKg(Math.round(confirmedResult.estimatedWeightKg * 10) / 10);
    }
    if (confirmedResult.cleanliness || confirmedResult.structural) {
      setCondition({
        cleanliness: confirmedResult.cleanliness || 'clean',
        structural: confirmedResult.structural || 'intact',
      });
    }
    setCurrentStep(4);
  };

  // Step 4 -> 5
  const handleWeightConditionConfirmed = (
    weight: number,
    cond: { cleanliness: 'clean' | 'dirty'; structural: 'intact' | 'damaged' }
  ) => {
    setWeightKg(weight);
    setCondition(cond);
    setCurrentStep(5);
  };

  // Step 5 -> 6
  const handlePriceConfirmed = (priceInfo: {
    calculatedPricePerKg: number;
    totalEstimatedPrice: number;
    marketMiddlemanTotal: number;
    fairAdvantageAmount: number;
  }) => {
    setPricingData(priceInfo);
    setCurrentStep(6);
  };

  // Step 6 -> 7
  const handleSelectRecycler = (recycler: Recycler) => {
    setSelectedRecycler(recycler);
    setCurrentStep(7);
  };

  // Step 7 -> 8 (Create Transaction Record & Immutable Block)
  const handleConfirmPickup = async (pickup: PickupSchedule) => {
    setPickupSchedule(pickup);

    const location = await getCurrentCollectorLocation();
    const timestamp = Date.now();
    const txnId = `EPR-2026-MUM-${Math.floor(1000 + Math.random() * 9000)}`;
    const blockNumber = 1042 + transactions.length;

    // Generate sha256 simulation block
    const blockHash = `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`;
    const prevHash = `0x${Math.random().toString(16).substring(2, 10)}9f1b4c3e8`;

    const newTxn: Transaction = {
      id: txnId,
      timestamp,
      status: 'pending_pickup',
      selectedRecycler,
      pickup,
      syncStatus: settings.offlineSimulation ? 'pending_sync' : 'synced',
      payload: {
        photoUrl: photoDataUrl || 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=500&q=80',
        quality: photoQuality || {
          isAcceptable: true,
          blurScore: 88,
          lightingScore: 92,
          objectDetected: true,
          issues: [],
        },
        classification,
        weightKg,
        condition,
        calculatedPricePerKg: pricingData.calculatedPricePerKg,
        totalEstimatedPrice: pricingData.totalEstimatedPrice,
        marketMiddlemanTotal: pricingData.marketMiddlemanTotal,
        fairAdvantageAmount: pricingData.fairAdvantageAmount,
      },
      ledgerBlock: {
        blockNumber,
        transactionId: txnId,
        timestamp,
        collectorId: 'COL-MUM-8910',
        collectorName: settings.collectorName,
        recyclerId: selectedRecycler.id,
        recyclerName: selectedRecycler.name,
        cpcbRegNumber: selectedRecycler.cpcbRegNumber,
        wasteCategory: classification.confirmedCategory,
        weightKg,
        pricePerKg: pricingData.calculatedPricePerKg,
        totalAmount: pricingData.totalEstimatedPrice,
        previousBlockHash: prevHash,
        currentBlockHash: blockHash,
        photoHash: `hash_${txnId.toLowerCase()}_sha256`,
        location: { lat: location.lat, lng: location.lng, areaName: location.areaName },
        digitalSignature: `SIG-CPCB-AUTH-${txnId}`,
        eprCreditUnits: Math.round(weightKg),
      },
      payment: {
        method: 'upi',
        accountOrUpiId: settings.collectorUpi,
        utrNumber: `UTR-SBIN-${Math.floor(100000 + Math.random() * 900000)}`,
        paidAt: timestamp,
        amount: pricingData.totalEstimatedPrice,
        receiptQr: `UPI:${settings.collectorUpi}?am=${pricingData.totalEstimatedPrice}&tr=${txnId}`,
      },
    };

    setActiveTransaction(newTxn);

    // Save to local storage or queue for offline sync
    if (settings.offlineSimulation) {
      queueItemForSync(newTxn);
      setPendingSyncCount(getPendingSyncItems().length);
      showToast('Offline Mode: Transaction safely queued in local ledger for auto-sync.');
    } else {
      saveStoredTransaction(newTxn);
      setTransactions(getStoredTransactions());
      // Save directly to server database
      syncTransactionToDatabase(newTxn, currentUser);
      syncPickupToDatabase(pickup, currentUser, weightKg, classification.confirmedCategory);
    }

    setCurrentStep(8);
  };

  // Step 8 -> 9
  const handleProceedToPayment = () => {
    setCurrentStep(9);
  };

  // Step 9 -> 10
  const handlePaymentConfirmed = (updatedTxn: Transaction) => {
    setActiveTransaction(updatedTxn);
    saveStoredTransaction(updatedTxn);
    setTransactions(getStoredTransactions());
    // Persist verified payment in server database and Firebase Firestore
    syncTransactionToDatabase(updatedTxn, currentUser);
    saveTransactionToFirestore(updatedTxn, currentUser?.id || 'usr_collector_01').catch((err) => {
      console.warn('Firestore transaction sync notice:', err);
    });
    setCurrentStep(10);
  };

  const handleAuthSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setGuestAccess(false);
    saveStoredUser(user);
    handleUpdateSettings({
      collectorName: user.name,
      collectorPhone: user.phone,
      ...(user.upiId ? { collectorUpi: user.upiId } : {}),
    });
    showToast(`Welcome ${user.name}! Connected to Firebase & ScrapSetu.`);
  };

  const handleLogout = () => {
    logoutUser();
    signOutFromFirebase().catch(() => {});
    setCurrentUser(null);
    setGuestAccess(false);
    showToast('Signed out successfully.');
  };

  const handleOpenAuth = () => {
    if (!currentUser) {
      setGuestAccess(false);
    } else {
      setIsAuthModalOpen(true);
    }
  };

  // Restart flow
  const handleStartNewCollection = () => {
    setPhotoDataUrl('');
    setPhotoQuality(undefined);
    setWeightKg(10);
    setCurrentStep(2);
  };

  const handleResetToHome = () => {
    setCurrentStep(1);
  };

  // Show Log In page firstly if someone opens the app and is not logged in
  if (!currentUser && !guestAccess) {
    return (
      <div className="min-h-screen bg-[#F7F9F8] text-[#17231D] flex flex-col">
        <LoginScreen
          language={settings?.language || 'hi'}
          onLanguageChange={(lang) => handleUpdateSettings({ language: lang })}
          onLoginSuccess={(user) => {
            handleAuthSuccess(user);
          }}
          onContinueAsGuest={() => {
            setGuestAccess(true);
            showToast(
              settings?.language === 'hi'
                ? 'अतिथि सत्र सक्रिय • आप कभी भी लॉग इन कर सकते हैं'
                : 'Guest session active • You can log in anytime'
            );
          }}
        />
        {toastMessage && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#17231D] text-white px-5 py-3 rounded-xl text-xs sm:text-sm font-medium shadow-xl border border-[#DDE6E0]/20 flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2">
            <span className="w-2 h-2 rounded-full bg-[#16834A] shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9F8] text-[#17231D] flex flex-col selection:bg-[#176B45]/20 selection:text-[#176B45]">
      {/* Persistent Global Header */}
      <Header
        settings={settings}
        language={settings?.language || 'hi'}
        onLanguageChange={(lang) => handleUpdateSettings({ language: lang })}
        onUpdateSettings={handleUpdateSettings}
        isOffline={!!settings?.offlineSimulation}
        pendingSyncCount={pendingSyncCount}
        onTriggerSync={handleTriggerSync}
        onOpenSettings={() => setActiveModal('settings')}
        onOpenSafety={() => setActiveModal('safety')}
        onOpenImpact={() => setActiveModal('impact')}
        currentStep={currentStep}
        onResetToHome={handleResetToHome}
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
        onOpenDatabase={() => setIsDbModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* 10-Step Progress Tracker Bar */}
      <StepProgressBar
        currentStep={currentStep}
        language={settings?.language || 'hi'}
        onStepClick={(step) => {
          // Allow navigating backward to review previous steps
          if (step < currentStep) {
            playChime('click');
            setCurrentStep(step);
          }
        }}
      />

      {/* Responsive Main Content Wrapper */}
      <div className="w-full max-w-5xl mx-auto flex-1 flex flex-col px-4 sm:px-6 lg:px-8 py-6">
        <main className="flex-1">
          {/* STEP 1: Home / Dashboard */}
          {currentStep === 1 && (
            <Step1HomeScreen
              settings={settings}
              language={settings?.language || 'hi'}
              transactions={transactions}
              pendingSyncCount={pendingSyncCount}
              onTriggerSync={handleTriggerSync}
              onStartCollection={() => {
                playChime('click');
                setCurrentStep(2);
              }}
              onStartCollect={() => {
                playChime('click');
                setCurrentStep(2);
              }}
              onOpenLedger={() => {
                playChime('click');
                setCurrentStep(10);
              }}
              onOpenSafety={() => setActiveModal('safety')}
              onOpenImpact={() => setActiveModal('impact')}
              currentUser={currentUser}
              onOpenAuth={handleOpenAuth}
              onOpenDatabase={() => setIsDbModalOpen(true)}
            />
          )}

          {/* STEP 2: Camera Capture */}
          {currentStep === 2 && (
            <Step2CameraScreen
              language={settings.language}
              lowBandwidthMode={settings.lowBandwidthMode}
              onPhotoCaptured={handlePhotoCaptured}
              onBack={() => setCurrentStep(1)}
            />
          )}

          {/* STEP 3: AI Classification & QA Gating */}
          {currentStep === 3 && (
            <Step3ClassificationScreen
              language={settings.language}
              photoUrl={photoDataUrl}
              quality={photoQuality}
              photoQuality={photoQuality}
              presetIndex={presetIndex}
              onClassificationConfirmed={handleClassificationConfirmed}
              onConfirmClassification={handleClassificationConfirmed}
              onBack={() => setCurrentStep(2)}
              onRetakePhoto={() => setCurrentStep(2)}
            />
          )}

          {/* STEP 4: Weight & Condition Input */}
          {currentStep === 4 && (
            <Step4WeightConditionScreen
              language={settings.language}
              category={classification.confirmedCategory}
              initialWeight={weightKg}
              onWeightConditionConfirmed={handleWeightConditionConfirmed}
              onConfirmWeightCondition={handleWeightConditionConfirmed}
              onBack={() => setCurrentStep(3)}
            />
          )}

          {/* STEP 5: Fair Price Estimate */}
          {currentStep === 5 && (
            <Step5FairPriceScreen
              language={settings.language}
              category={classification.confirmedCategory}
              weightKg={weightKg}
              condition={condition}
              onPriceConfirmed={handlePriceConfirmed}
              onBack={() => setCurrentStep(4)}
            />
          )}

          {/* STEP 6: Compare Authorized Recyclers on Google Map */}
          {currentStep === 6 && (
            <Step6RecyclerMapScreen
              language={settings.language}
              category={classification.confirmedCategory}
              weightKg={weightKg}
              calculatedPricePerKg={pricingData.calculatedPricePerKg}
              onSelectRecycler={handleSelectRecycler}
              onBack={() => setCurrentStep(5)}
            />
          )}

          {/* STEP 7: Accept Offer & Schedule Pickup Logistics */}
          {currentStep === 7 && (
            <Step7AcceptPickupScreen
              language={settings.language}
              selectedRecycler={selectedRecycler}
              weightKg={weightKg}
              totalOfferedPrice={pricingData.totalEstimatedPrice}
              collectorPhone={settings.collectorPhone}
              onConfirmPickup={handleConfirmPickup}
              onBack={() => setCurrentStep(6)}
            />
          )}

          {/* STEP 8: Verified Digital Handover & QR Ledger Block */}
          {currentStep === 8 && activeTransaction && (
            <Step8HandoverScreen
              language={settings.language}
              transaction={activeTransaction}
              onProceedToPayment={handleProceedToPayment}
              onBack={() => setCurrentStep(7)}
            />
          )}

          {/* STEP 9: Payment Confirmation & Zero-Cash Digital Receipt */}
          {currentStep === 9 && activeTransaction && (
            <Step9PaymentScreen
              language={settings.language}
              transaction={activeTransaction}
              onPaymentConfirmed={handlePaymentConfirmed}
              onBack={() => setCurrentStep(8)}
            />
          )}

          {/* STEP 10: Earnings Ledger, Category Breakdown, History & Certificate */}
          {currentStep === 10 && (
            <Step10EarningsScreen
              language={settings.language}
              transactions={transactions}
              onStartNewCollection={handleStartNewCollection}
              onResetToHome={handleResetToHome}
            />
          )}
        </main>

        {/* Global Floating Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#17231D] text-white px-5 py-3 rounded-xl text-xs sm:text-sm font-medium shadow-xl border border-[#DDE6E0]/20 flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2">
            <span className="w-2 h-2 rounded-full bg-[#16834A] shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* MODALS */}
        {activeModal === 'safety' && (
          <SafetyGuidanceModal
            language={settings.language}
            onClose={() => setActiveModal(null)}
          />
        )}

        {activeModal === 'impact' && (
          <ImpactDashboardModal
            language={settings.language}
            transactions={transactions}
            onClose={() => setActiveModal(null)}
          />
        )}

        {activeModal === 'settings' && (
          <SettingsModal
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            pendingSyncCount={pendingSyncCount}
            onTriggerSync={handleTriggerSync}
            onClose={() => setActiveModal(null)}
          />
        )}

        {/* User Sign In / Register Authentication Modal */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthSuccess={handleAuthSuccess}
          language={settings.language}
        />

        {/* Database & Profile Viewer Modal */}
        <DatabaseViewerModal
          isOpen={isDbModalOpen}
          onClose={() => setIsDbModalOpen(false)}
          currentUser={currentUser}
          onUpdateCurrentUser={(updated) => {
            setCurrentUser(updated);
            saveStoredUser(updated);
            handleUpdateSettings({
              collectorName: updated.name,
              collectorPhone: updated.phone,
              ...(updated.upiId ? { collectorUpi: updated.upiId } : {}),
            });
          }}
          onLogout={handleLogout}
          language={settings.language}
        />
      </div>
    </div>
  );
}
