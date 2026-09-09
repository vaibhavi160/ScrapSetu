import React, { useState, useEffect, useRef } from 'react';
import { 
  Language, FlowStep, WasteCategory, WasteCategoryInfo, AppSettings, 
  Transaction, Recycler, PickupSchedule, ClassificationResult, PhotoQualityAssessment,
  UserProfile, WasteRecord, SelectedRole
} from './types';
import { TRANSLATIONS } from './utils/translations';
import { 
  getStoredSettings, saveStoredSettings, getStoredTransactions, 
  saveStoredTransaction, getPendingSyncItems, queueItemForSync, syncPendingItems,
  normalizeTransaction
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
  saveWasteDataToFirestore,
  subscribeCollectorWaste,
  subscribeCollectorTransactions,
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
import { SplashScreen } from './components/SplashScreen';
import { BottomNav } from './components/BottomNav';
import { OfflineIndicator } from './components/OfflineIndicator';
import { triggerHaptic } from './hooks/usePWAInstall';

// Step Screens
import { RoleSelectionScreen } from './screens/RoleSelectionScreen';
import { RecyclerPortal } from './screens/recycler/RecyclerPortal';
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
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [settings, setSettings] = useState<AppSettings>(getStoredSettings());
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(getStoredUser());
  const [selectedRole, setSelectedRole] = useState<SelectedRole | null>(() => {
    const user = getStoredUser();
    if (user?.role === 'recycler') return 'recycler';
    if (user?.role === 'collector') return 'collector';
    return null;
  });
  const [guestAccess, setGuestAccess] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<FlowStep>(1);
  const [activeModal, setActiveModal] = useState<'safety' | 'impact' | 'settings' | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>(getStoredTransactions());
  const [wasteRecords, setWasteRecords] = useState<WasteRecord[]>([]);
  const [categories, setCategories] = useState<WasteCategoryInfo[]>(WASTE_CATEGORIES);
  const [recyclers, setRecyclers] = useState<Recycler[]>(MOCK_RECYCLERS);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(getPendingSyncItems().length);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active Transaction Flow In-Progress State
  const [photoDataUrl, setPhotoDataUrl] = useState<string>('');
  const [photoQuality, setPhotoQuality] = useState<PhotoQualityAssessment | undefined>();
  const [classification, setClassification] = useState<ClassificationResult>({
    predictedCategory: 'Plastic',
    confidence: 0.95,
    secondaryPrediction: 'Glass',
    secondaryConfidence: 0.05,
    isUncertain: false,
    confirmedCategory: 'Plastic',
    wasManuallyCorrected: false,
    timestamp: Date.now(),
    logId: 'LOG-INIT-01',
    photoUrl: '',
  });
  const [weightKg, setWeightKg] = useState<number>(4.5);
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
      if (cats && cats.length > 0) {
        setCategories(cats);
        console.log(`Synced ${cats.length} scrap categories from Firebase Firestore`);
      }
    });

    // 2. Real-time Recyclers listener (public read)
    const unsubRecs = subscribeRecyclers((recs) => {
      if (recs && recs.length > 0) {
        setRecyclers(recs);
        console.log(`Synced ${recs.length} verified recyclers from Firebase Firestore`);
      }
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

  // 4. Real-time Waste Records & Transactions listener from Firestore
  useEffect(() => {
    const collectorId = currentUser?.id || auth.currentUser?.uid || 'COL-MUM-8910';
    const unsubWaste = subscribeCollectorWaste(collectorId, (records) => {
      if (records && records.length > 0) {
        setWasteRecords(records);
      }
    });

    const unsubTxns = subscribeCollectorTransactions(collectorId, (fireTxns) => {
      if (fireTxns && fireTxns.length > 0) {
        setTransactions((prev) => {
          const map = new Map<string, Transaction>();
          prev.forEach((t) => map.set(t.id, normalizeTransaction(t)));
          fireTxns.forEach((t) => map.set(t.id, normalizeTransaction(t)));
          return Array.from(map.values());
        });
      }
    });

    return () => {
      unsubWaste();
      unsubTxns();
    };
  }, [currentUser?.id]);

  // Android hardware & gesture back button navigation handler
  const lastHistoryStepRef = useRef<number>(1);
  useEffect(() => {
    if (currentStep > 1 && currentStep !== lastHistoryStepRef.current) {
      window.history.pushState({ step: currentStep }, '');
      lastHistoryStepRef.current = currentStep;
    } else if (currentStep === 1) {
      lastHistoryStepRef.current = 1;
    }
  }, [currentStep]);

  useEffect(() => {
    if (activeModal || isDbModalOpen || isAuthModalOpen) {
      window.history.pushState({ modal: true }, '');
    }
  }, [activeModal, isDbModalOpen, isAuthModalOpen]);

  useEffect(() => {
    const handlePopState = () => {
      if (activeModal !== null) {
        setActiveModal(null);
        triggerHaptic('light');
        return;
      }
      if (isDbModalOpen) {
        setIsDbModalOpen(false);
        triggerHaptic('light');
        return;
      }
      if (isAuthModalOpen) {
        setIsAuthModalOpen(false);
        triggerHaptic('light');
        return;
      }
      if (currentStep > 1) {
        setCurrentStep((prev) => Math.max(1, prev - 1));
        triggerHaptic('light');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [activeModal, isDbModalOpen, isAuthModalOpen, currentStep]);

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

    // Save waste data record into Firestore database immediately
    const collectorId = currentUser?.id || auth.currentUser?.uid || 'COL-MUM-8910';
    const newWasteRecord: WasteRecord = {
      id: `WST-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      collectorId,
      collectorName: currentUser?.name || settings.collectorName || 'Scrap Collector',
      categoryId: (classification.confirmedCategory || 'Scrap').toLowerCase().replace(/\s+/g, '_'),
      categoryName: classification.confirmedCategory,
      weightKg,
      ratePerKg: priceInfo.calculatedPricePerKg,
      totalAmount: priceInfo.totalEstimatedPrice,
      fairAdvantageAmount: priceInfo.fairAdvantageAmount,
      cleanliness: condition.cleanliness,
      structural: condition.structural,
      status: 'scanned',
      timestamp: new Date().toISOString(),
    };

    saveWasteDataToFirestore(newWasteRecord).catch((err) => {
      console.warn('Firestore waste save notice:', err);
    });

    setWasteRecords((prev) => [newWasteRecord, ...prev]);
    setCurrentStep(6);
  };

  // Step 6: Recyclers added dynamically
  const handleRecyclersAdded = (newRecs: Recycler[]) => {
    setRecyclers((prev) => {
      const existingIds = new Set(prev.map((r) => r.id));
      const toAdd = newRecs.filter((r) => !existingIds.has(r.id));
      return [...toAdd, ...prev];
    });
    setToastMessage(
      settings?.language === 'hi'
        ? `${newRecs.length} नए अधिकृत रीसाइक्लर गूगल मैप्स व फायरबेस में सुरक्षित किए गए!`
        : `Successfully saved ${newRecs.length} recycler(s) to Google Maps & Firebase!`
    );
    setTimeout(() => setToastMessage(null), 4000);
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
    const collectorId = currentUser?.id || auth.currentUser?.uid || 'COL-MUM-8910';
    saveTransactionToFirestore(updatedTxn, collectorId).catch((err) => {
      console.warn('Firestore transaction sync notice:', err);
    });
    setWasteRecords((prev) =>
      prev.map((w) =>
        w.categoryName === (updatedTxn.payload?.classification?.confirmedCategory || (updatedTxn as any).categoryName)
          ? { ...w, status: 'paid' as const, transactionId: updatedTxn.id, recyclerName: updatedTxn.selectedRecycler?.name || '' }
          : w
      )
    );
    setCurrentStep(10);
  };

  const handleAuthSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setGuestAccess(false);
    saveStoredUser(user);
    const userRole: SelectedRole = user.role === 'recycler' ? 'recycler' : 'collector';
    setSelectedRole(userRole);
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
    setSelectedRole(null);
    setGuestAccess(false);
    showToast('Signed out successfully.');
  };

  const handleSwitchRole = (newRole: SelectedRole) => {
    setSelectedRole(newRole);
    if (currentUser) {
      const updatedUser: UserProfile = {
        ...currentUser,
        role: newRole,
      };
      setCurrentUser(updatedUser);
      saveStoredUser(updatedUser);
    }
    showToast(
      newRole === 'recycler'
        ? 'Switched to Recycler Portal'
        : 'Switched to Collector Portal'
    );
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

  // 1. Initial Splash Screen for 1.8s
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // 2. "Choose your role" screen (Collector vs Recycler)
  if (!currentUser && !guestAccess && !selectedRole) {
    return (
      <RoleSelectionScreen
        language={settings?.language || 'hi'}
        onSelectRole={(role) => {
          setSelectedRole(role);
        }}
        onLanguageChange={(lang) => handleUpdateSettings({ language: lang })}
      />
    );
  }

  // 3. Login / Register screen tagged with the chosen role
  if (!currentUser && !guestAccess) {
    return (
      <div className="min-h-screen bg-[#F7F9F8] text-[#17231D] flex flex-col">
        <LoginScreen
          language={settings?.language || 'hi'}
          onLanguageChange={(lang) => handleUpdateSettings({ language: lang })}
          selectedRole={selectedRole || 'collector'}
          onChangeRole={() => setSelectedRole(null)}
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

  // Determine active portal: 'recycler' vs 'collector'
  const activeRole: SelectedRole =
    currentUser?.role === 'recycler' || selectedRole === 'recycler' ? 'recycler' : 'collector';

  // 4. Recycler Portal Flow
  if (activeRole === 'recycler') {
    return (
      <div className="min-h-screen bg-[#F7F9F8] text-[#17231D] flex flex-col">
        {/* Global Header */}
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
          currentRole="recycler"
          onSwitchRole={handleSwitchRole}
        />

        <RecyclerPortal
          transactions={transactions}
          onUpdateTransactions={(updated) => {
            setTransactions(updated);
          }}
          currentUser={currentUser}
          language={settings?.language || 'hi'}
          onSwitchToCollector={() => handleSwitchRole('collector')}
          onLogout={handleLogout}
          categories={categories}
          onCategoriesUpdated={(cats) => setCategories(cats)}
          recyclers={recyclers}
          onRecyclersUpdated={(recs) => setRecyclers(recs)}
        />

        {/* Database viewer modal & Toast */}
        {isDbModalOpen && (
          <DatabaseViewerModal
            isOpen={isDbModalOpen}
            onClose={() => setIsDbModalOpen(false)}
            transactions={transactions}
            wasteRecords={wasteRecords}
            categories={categories}
            recyclers={recyclers}
            currentUser={currentUser}
            language={settings?.language || 'hi'}
          />
        )}

        {isAuthModalOpen && (
          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            currentUser={currentUser}
            language={settings?.language || 'hi'}
            onLoginSuccess={handleAuthSuccess}
            onLogout={handleLogout}
          />
        )}

        {activeModal === 'settings' && (
          <SettingsModal
            isOpen={activeModal === 'settings'}
            onClose={() => setActiveModal(null)}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onTriggerSync={handleTriggerSync}
            pendingSyncCount={pendingSyncCount}
          />
        )}

        {toastMessage && (
          <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 bg-[#17231D] text-white px-5 py-3 rounded-xl text-xs sm:text-sm font-medium shadow-xl border border-[#DDE6E0]/20 flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2">
            <span className="w-2 h-2 rounded-full bg-[#16834A] shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Android PWA Offline Connectivity Indicator */}
        <OfflineIndicator />
      </div>
    );
  }

  const getActiveNavTab = (): 'home' | 'recyclers' | 'scan' | 'ledger' | 'settings' => {
    if (activeModal === 'settings') return 'settings';
    if (currentStep === 2) return 'scan';
    if (currentStep === 6) return 'recyclers';
    if (currentStep === 10) return 'ledger';
    return 'home';
  };

  const handleNavTabChange = (tab: 'home' | 'recyclers' | 'scan' | 'ledger' | 'settings') => {
    playChime('click');
    if (tab === 'home') {
      setActiveModal(null);
      setCurrentStep(1);
    } else if (tab === 'recyclers') {
      setActiveModal(null);
      setCurrentStep(6);
    } else if (tab === 'scan') {
      setActiveModal(null);
      setCurrentStep(2);
    } else if (tab === 'ledger') {
      setActiveModal(null);
      setCurrentStep(10);
    } else if (tab === 'settings') {
      setActiveModal('settings');
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#17231D] flex flex-col selection:bg-[#107C41]/20 selection:text-[#107C41]">
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
        currentRole="collector"
        onSwitchRole={handleSwitchRole}
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
        onNavigateStep={(step) => {
          if (step < currentStep) {
            playChime('click');
            setCurrentStep(step);
          }
        }}
      />

      {/* Responsive Main Content Wrapper */}
      <div className="w-full max-w-5xl mx-auto flex-1 flex flex-col px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 pb-28">
        <main className="flex-1">
          {/* STEP 1: Home / Dashboard */}
          {currentStep === 1 && (
            <Step1HomeScreen
              settings={settings}
              language={settings?.language || 'hi'}
              transactions={transactions}
              wasteRecords={wasteRecords}
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
              categories={categories}
              recyclers={recyclers}
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
              categories={categories}
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
              categories={categories}
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
              recyclers={recyclers}
              onAddRecyclers={handleRecyclersAdded}
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
              wasteRecords={wasteRecords}
              currentUser={currentUser}
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

      {/* Persistent Bottom Navigation Bar matching TrashWise */}
      <BottomNav
        currentStep={currentStep}
        activeTab={getActiveNavTab()}
        onNavigateStep={(step) => {
          playChime('click');
          setActiveModal(null);
          setCurrentStep(step);
        }}
        onTabChange={handleNavTabChange}
        onOpenSettings={() => {
          playChime('click');
          setActiveModal('settings');
        }}
        language={settings.language}
      />

      {/* Android PWA Offline Connectivity Indicator */}
      <OfflineIndicator />
    </div>
  );
}
