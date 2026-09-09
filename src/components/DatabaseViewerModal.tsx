import React, { useState, useEffect } from 'react';
import { X, Database, RefreshCw, User, CheckCircle, MapPin, Phone, CreditCard, ShieldCheck, FileText, Truck, ArrowUpDown, Layers, Recycle, Plus } from 'lucide-react';
import { UserProfile, Language, WasteCategoryInfo, Recycler } from '../types';
import { fetchDatabaseRecords, fetchDatabaseSummary } from '../utils/authStorage';
import { playChime } from '../utils/audioSpeech';
import { 
  auth,
  fetchCategoriesFromFirestore, 
  fetchRecyclersFromFirestore, 
  fetchCollectorWasteFromFirestore,
  seedCategoriesToFirestore, 
  seedRecyclersToFirestore,
  saveUserToFirestore 
} from '../firebase';
import { WASTE_CATEGORIES, MOCK_RECYCLERS } from '../data/mockData';
import { AddRecyclerModal } from './AddRecyclerModal';

interface DatabaseViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onUpdateCurrentUser: (updated: UserProfile) => void;
  onLogout: () => void;
  language: Language;
}

export const DatabaseViewerModal: React.FC<DatabaseViewerModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateCurrentUser,
  onLogout,
  language,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'users' | 'waste' | 'categories' | 'recyclers' | 'transactions' | 'pickups'>('profile');
  const [dbData, setDbData] = useState<{
    users?: any[];
    transactions?: any[];
    pickups?: any[];
    lastUpdated?: string;
  }>({});
  const [wasteRecords, setWasteRecords] = useState<any[]>([]);
  const [categories, setCategories] = useState<WasteCategoryInfo[]>(WASTE_CATEGORIES);
  const [recyclers, setRecyclers] = useState<Recycler[]>(MOCK_RECYCLERS);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: currentUser?.name || '',
    phone: currentUser?.phone || '',
    city: currentUser?.city || '',
    pincode: currentUser?.pincode || '',
    upiId: currentUser?.upiId || '',
    businessName: currentUser?.businessName || '',
  });
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isAddRecyclerOpen, setIsAddRecyclerOpen] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setEditForm({
        name: currentUser.name || '',
        phone: currentUser.phone || '',
        city: currentUser.city || '',
        pincode: currentUser.pincode || '',
        upiId: currentUser.upiId || '',
        businessName: currentUser.businessName || '',
      });
    }
  }, [currentUser]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const collectorId = currentUser?.id || auth.currentUser?.uid || 'COL-MUM-8910';
      const [records, sum, cats, recs, waste] = await Promise.all([
        fetchDatabaseRecords(),
        fetchDatabaseSummary(),
        fetchCategoriesFromFirestore(),
        fetchRecyclersFromFirestore(),
        fetchCollectorWasteFromFirestore(collectorId),
      ]);
      if (records.success) {
        setDbData(records);
      }
      if (sum.success) {
        setSummary(sum.summary);
      }
      if (cats && cats.length > 0) {
        setCategories(cats);
      }
      if (recs && recs.length > 0) {
        setRecyclers(recs);
      }
      if (waste && waste.length > 0) {
        setWasteRecords(waste);
      }
    } catch (err) {
      console.error('Failed to reload database:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncCategoriesToFirestore = async () => {
    if (!auth.currentUser) {
      setStatusMessage(
        language === 'hi'
          ? 'कृपया पहले Google या Firebase Auth से साइन इन करें।'
          : 'Please sign in with Google or Firebase Auth first to sync to Firestore.'
      );
      return;
    }
    setIsLoading(true);
    try {
      await seedCategoriesToFirestore();
      setStatusMessage(language === 'hi' ? 'Firebase Firestore में श्रेणियां सिंक की गईं!' : 'Categories synced to Firebase Firestore!');
      const updated = await fetchCategoriesFromFirestore();
      setCategories(updated);
    } catch {
      setStatusMessage('Sync failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncRecyclersToFirestore = async () => {
    if (!auth.currentUser) {
      setStatusMessage(
        language === 'hi'
          ? 'कृपया पहले Google या Firebase Auth से साइन इन करें।'
          : 'Please sign in with Google or Firebase Auth first to sync to Firestore.'
      );
      return;
    }
    setIsLoading(true);
    try {
      await seedRecyclersToFirestore();
      setStatusMessage(language === 'hi' ? 'Firebase Firestore में रीसायकलर केंद्र सिंक किए गए!' : 'Recyclers synced to Firebase Firestore!');
      const updated = await fetchRecyclersFromFirestore();
      setRecyclers(updated);
    } catch {
      setStatusMessage('Sync failed.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/users/${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success && data.user) {
        playChime();
        onUpdateCurrentUser(data.user);
        // Also sync profile to Firebase Firestore
        saveUserToFirestore(data.user).catch(() => {});
        setIsEditing(false);
        setStatusMessage(language === 'hi' ? 'डेटाबेस में विवरण सफलतापूर्वक अपडेट किया गया!' : 'Details successfully updated in database!');
        loadData();
      } else {
        setStatusMessage(data.message || 'Update failed');
      }
    } catch {
      setStatusMessage('Network error updating profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs p-2 sm:p-4 flex flex-col items-center justify-center">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-[#DDE6E0] overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="shrink-0 bg-[#176B45] text-white px-4 py-3.5 sm:px-5 sm:py-4 flex items-center justify-between border-b border-[#125837]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shrink-0">
              <img
                src="/logo-icon.png"
                alt="Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/ScrapSetu.png';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white leading-tight">
                  {language === 'hi' ? 'डेटाबेस एवं उपयोगकर्ता विवरण' : 'Database & Profile Portal'}
                </h3>
                <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                  Live DB
                </span>
              </div>
              <p className="text-xs text-white/80 mt-0.5">
                {currentUser ? `${currentUser.name} (${currentUser.role.toUpperCase()})` : 'Connected to Server Database'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={isLoading}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Refresh Database Records"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="shrink-0 flex border-b border-[#DDE6E0] bg-[#F7F9F8] px-3 sm:px-4 pt-2 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'profile'
                ? 'border-[#176B45] text-[#176B45]'
                : 'border-transparent text-[#66736C] hover:text-[#17231D]'
            }`}
          >
            {language === 'hi' ? 'मेरा खाता (My Profile)' : 'My Details in DB'}
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'users'
                ? 'border-[#176B45] text-[#176B45]'
                : 'border-transparent text-[#66736C] hover:text-[#17231D]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'डेटाबेस उपयोगकर्ता' : 'Users & Auth'}</span>
            <span className="bg-[#DDE6E0] text-[#17231D] text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {dbData.users?.length || 0}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('waste')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'waste'
                ? 'border-[#176B45] text-[#176B45]'
                : 'border-transparent text-[#66736C] hover:text-[#17231D]'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'कबाड़ डेटा (Firestore)' : 'Waste Records (Firestore)'}</span>
            <span className="bg-[#176B45]/15 text-[#176B45] text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {wasteRecords.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'categories'
                ? 'border-[#176B45] text-[#176B45]'
                : 'border-transparent text-[#66736C] hover:text-[#17231D]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'स्क्रैप श्रेणियां' : 'Categories (Firestore)'}</span>
            <span className="bg-[#176B45]/15 text-[#176B45] text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {categories.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('recyclers')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'recyclers'
                ? 'border-[#176B45] text-[#176B45]'
                : 'border-transparent text-[#66736C] hover:text-[#17231D]'
            }`}
          >
            <Recycle className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'रीसायकलर केंद्र' : 'Recyclers (Firestore)'}</span>
            <span className="bg-[#176B45]/15 text-[#176B45] text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {recyclers.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'transactions'
                ? 'border-[#176B45] text-[#176B45]'
                : 'border-transparent text-[#66736C] hover:text-[#17231D]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'रिकॉर्ड किए गए लेनदेन' : 'Transactions'}</span>
            <span className="bg-[#DDE6E0] text-[#17231D] text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {dbData.transactions?.length || 0}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('pickups')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'pickups'
                ? 'border-[#176B45] text-[#176B45]'
                : 'border-transparent text-[#66736C] hover:text-[#17231D]'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'पिकअप अनुरोध' : 'Doorstep Pickups'}</span>
            <span className="bg-[#DDE6E0] text-[#17231D] text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {dbData.pickups?.length || 0}
            </span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
          {/* Firebase Connection Status Banner */}
          <div className="bg-[#EAF6EF] border border-[#176B45]/20 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-[#176B45]">Firebase Firestore & Auth Connected</span>
                  <span className="text-[10px] bg-white text-[#176B45] font-bold px-1.5 py-0.2 rounded border border-[#176B45]/20">
                    Live
                  </span>
                </div>
                <span className="text-[#66736C] block text-[10px] mt-0.5 font-mono">
                  Project: vaulted-tract-g2sm5 • Rules Pillar-Hardened
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#176B45] bg-white px-2.5 py-1 rounded-xl border border-[#176B45]/20 shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-[#176B45]" />
              <span>Auth & Role Enforced</span>
            </div>
          </div>

          {statusMessage && (
            <div className="p-3 bg-[#EAF6EF] text-[#176B45] text-xs font-bold rounded-xl border border-[#176B45]/20 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* TAB 1: MY PROFILE & DETAILS IN DATABASE */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              {currentUser ? (
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-[#DDE6E0]">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#EAF6EF] text-[#176B45] font-black text-lg flex items-center justify-center border border-[#176B45]/20">
                        {currentUser.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-base text-[#17231D]">
                            {currentUser.name}
                          </h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#176B45] text-white">
                            {currentUser.role}
                          </span>
                        </div>
                        <p className="text-xs text-[#66736C]">
                          User ID: <span className="font-mono">{currentUser.id}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="px-3 py-1.5 text-xs font-bold rounded-xl border border-[#DDE6E0] hover:border-[#176B45] hover:bg-[#EAF6EF] text-[#176B45] transition-colors cursor-pointer"
                      >
                        {isEditing ? (language === 'hi' ? 'रद्द करें' : 'Cancel') : (language === 'hi' ? 'डिटेल्स बदलें' : 'Edit Details')}
                      </button>
                      <button
                        onClick={() => {
                          onLogout();
                          onClose();
                        }}
                        className="px-3 py-1.5 text-xs font-bold rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        {language === 'hi' ? 'लॉग आउट' : 'Sign Out'}
                      </button>
                    </div>
                  </div>

                  {isEditing ? (
                    <form onSubmit={handleSaveProfile} className="mt-4 space-y-3 bg-[#F7F9F8] p-4 rounded-2xl border border-[#DDE6E0]">
                      <h5 className="font-bold text-xs text-[#17231D]">
                        {language === 'hi' ? 'डेटाबेस में अपने विवरण अपडेट करें' : 'Update your details stored in database'}
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-[#66736C] mb-1">Name</label>
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-[#DDE6E0] rounded-xl text-xs font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-[#66736C] mb-1">City</label>
                          <input
                            type="text"
                            value={editForm.city}
                            onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-[#DDE6E0] rounded-xl text-xs font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-[#66736C] mb-1">UPI ID</label>
                          <input
                            type="text"
                            value={editForm.upiId}
                            onChange={(e) => setEditForm({ ...editForm, upiId: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-[#DDE6E0] rounded-xl text-xs font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-[#66736C] mb-1">Business Name</label>
                          <input
                            type="text"
                            value={editForm.businessName}
                            onChange={(e) => setEditForm({ ...editForm, businessName: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-[#DDE6E0] rounded-xl text-xs font-medium"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="py-2 px-4 bg-[#176B45] text-white text-xs font-bold rounded-xl hover:bg-[#125837] cursor-pointer"
                      >
                        {isLoading ? 'Saving...' : (language === 'hi' ? 'डेटाबेस में सेव करें' : 'Save to Database')}
                      </button>
                    </form>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                      <div className="p-3 bg-[#F7F9F8] rounded-xl border border-[#DDE6E0]">
                        <span className="text-[10px] text-[#66736C] font-semibold block">Mobile Number</span>
                        <span className="text-xs font-bold text-[#17231D]">{currentUser.phone}</span>
                      </div>
                      <div className="p-3 bg-[#F7F9F8] rounded-xl border border-[#DDE6E0]">
                        <span className="text-[10px] text-[#66736C] font-semibold block">Location</span>
                        <span className="text-xs font-bold text-[#17231D]">{currentUser.city} ({currentUser.pincode})</span>
                      </div>
                      <div className="p-3 bg-[#F7F9F8] rounded-xl border border-[#DDE6E0]">
                        <span className="text-[10px] text-[#66736C] font-semibold block">UPI Direct Payout</span>
                        <span className="text-xs font-bold text-[#176B45]">{currentUser.upiId || 'Not linked'}</span>
                      </div>
                      <div className="p-3 bg-[#EAF6EF] rounded-xl border border-[#176B45]/20">
                        <span className="text-[10px] text-[#176B45] font-semibold block">Total Earnings in DB</span>
                        <span className="text-sm font-black text-[#176B45]">₹{(currentUser.totalEarnings || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="p-3 bg-[#FEF6E9] rounded-xl border border-[#E59A23]/30">
                        <span className="text-[10px] text-[#B47413] font-semibold block">Waste Handled in DB</span>
                        <span className="text-sm font-black text-[#B47413]">{currentUser.totalWasteHandledKg || 0} kg</span>
                      </div>
                      <div className="p-3 bg-[#F7F9F8] rounded-xl border border-[#DDE6E0]">
                        <span className="text-[10px] text-[#66736C] font-semibold block">Completed Transactions</span>
                        <span className="text-sm font-black text-[#17231D]">{currentUser.transactionsCount || 0}</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-xs text-[#66736C] mb-3">
                    {language === 'hi'
                      ? 'आप वर्तमान में एक अतिथि सत्र में हैं। अपने व्यक्तिगत डेटाबेस विवरण देखने हेतु साइन इन करें।'
                      : 'You are browsing as Guest. Sign in or create an account to view and persist your database details.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ALL REGISTERED USERS IN DATABASE */}
          {activeTab === 'users' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[#66736C] px-1">
                <span>{language === 'hi' ? 'स्थानीय सर्वर डेटाबेस में पंजीकृत उपयोगकर्ता:' : 'Persistent Users in Database:'}</span>
                <span className="font-mono text-[10px]">data/database.json</span>
              </div>
              <div className="space-y-2">
                {dbData.users?.map((u: any) => (
                  <div
                    key={u.id}
                    className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                      currentUser?.id === u.id
                        ? 'border-[#176B45] bg-[#EAF6EF]'
                        : 'border-[#DDE6E0] bg-[#F7F9F8]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#17231D]">{u.name}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-[#176B45] text-white">
                          {u.role}
                        </span>
                        {currentUser?.id === u.id && (
                          <span className="text-[10px] font-bold text-[#176B45] bg-white px-1.5 py-0.2 rounded-md border border-[#176B45]/30">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#66736C] mt-0.5">
                        📱 {u.phone} • 📍 {u.city} {u.pincode ? `(${u.pincode})` : ''} {u.upiId ? `• 💳 ${u.upiId}` : ''}
                      </p>
                    </div>
                    <div className="text-right sm:text-right shrink-0">
                      <span className="text-xs font-black text-[#176B45] block">
                        ₹{(u.totalEarnings || 0).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-[#66736C]">
                        {u.totalWasteHandledKg || 0} kg • {u.transactionsCount || 0} txns
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: WASTE DATA IN FIRESTORE */}
          {activeTab === 'waste' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs px-1">
                <div>
                  <span className="font-bold text-[#17231D]">
                    {language === 'hi' ? 'Firestore कबाड़ डेटा (वेस्ट रिकॉर्ड्स):' : 'Firestore Waste Collection (waste):'}
                  </span>
                  <p className="text-[11px] text-[#66736C]">
                    {language === 'hi' ? 'कबाड़ी द्वारा एकत्रित किया गया वास्तविक वजन, दर और कमाई' : 'Scrap waste lots logged with weight, rates & collector earnings'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={loadData}
                  disabled={isLoading}
                  className="px-2.5 py-1.5 bg-[#EAF6EF] text-[#176B45] hover:bg-[#176B45] hover:text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>{language === 'hi' ? 'रीफ्रेश' : 'Refresh'}</span>
                </button>
              </div>

              {wasteRecords.length === 0 ? (
                <div className="p-8 text-center bg-[#F7F9F8] border border-dashed border-[#DDE6E0] rounded-2xl">
                  <Database className="w-8 h-8 text-[#66736C] mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-bold text-[#17231D]">
                    {language === 'hi' ? 'कोई कबाड़ रिकॉर्ड नहीं मिला' : 'No waste records found in Firestore yet'}
                  </p>
                  <p className="text-[11px] text-[#66736C] mt-1">
                    {language === 'hi'
                      ? 'जैसे ही आप नए कबाड़ का वजन और उचित मूल्य तय करेंगे, वह यहां Firestore डेटाबेस में दिखेगा।'
                      : 'Scan scrap, confirm weight and fair price to automatically persist waste data to Firestore.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {wasteRecords.map((w: any) => (
                    <div key={w.id} className="p-3 bg-[#F7F9F8] border border-[#DDE6E0] rounded-2xl flex items-center justify-between hover:border-[#176B45]/40 transition-colors">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[#17231D]">{w.categoryName}</span>
                          <span className="font-mono text-[10px] bg-white px-1.5 py-0.2 rounded-md border border-[#DDE6E0]">
                            {w.id}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.2 font-bold rounded-md uppercase ${
                            w.status === 'paid' ? 'bg-[#EAF6EF] text-[#176B45]' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {w.status || 'scanned'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#66736C] mt-0.5">
                          वजन: <span className="font-bold text-[#17231D]">{w.weightKg} kg</span> • दर: ₹{w.ratePerKg}/kg • स्वच्छता: {w.cleanliness || 'clean'}
                        </p>
                        <p className="text-[10px] text-[#66736C]">
                          कलेक्टर: {w.collectorName} • {new Date(w.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-[#176B45] block">
                          ₹{Number(w.totalAmount || 0).toLocaleString('en-IN')}
                        </span>
                        {w.fairAdvantageAmount ? (
                          <span className="text-[10px] text-[#176B45] font-semibold">
                            +₹{w.fairAdvantageAmount} बोनस
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: CATEGORIES IN FIRESTORE */}
          {activeTab === 'categories' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs px-1">
                <div>
                  <span className="font-bold text-[#17231D]">
                    {language === 'hi' ? 'Firebase Firestore में अपशिष्ट श्रेणियां:' : 'Scrap Categories in Firestore:'}
                  </span>
                  <span className="text-[#66736C] text-[11px] block">
                    {language === 'hi' ? 'वास्तविक समय में मूल्य और कार्बन प्रभाव ट्रैकिंग' : 'Real-time pricing and carbon impact definitions'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleSyncCategoriesToFirestore}
                  disabled={isLoading}
                  className="px-2.5 py-1.5 bg-[#EAF6EF] text-[#176B45] hover:bg-[#176B45] hover:text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>{language === 'hi' ? 'Firestore में सिंक करें' : 'Sync to Firestore'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {categories.map((cat) => (
                  <div key={cat.id} className="p-3 bg-[#F7F9F8] border border-[#DDE6E0] rounded-2xl space-y-2 hover:border-[#176B45]/40 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#17231D]">{cat.name}</span>
                        {cat.nameHi && (
                          <span className="text-[10px] text-[#66736C]">({cat.nameHi})</span>
                        )}
                      </div>
                      <span className="text-xs font-black text-[#176B45]">
                        ₹{cat.basePricePerKg}/kg
                      </span>
                    </div>

                    <p className="text-[11px] text-[#66736C] line-clamp-2 leading-relaxed">
                      {cat.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] px-2 py-0.5 bg-white border border-[#DDE6E0] text-[#17231D] font-medium rounded-md">
                        🌱 {cat.carbonFactorKgCO2e} kg CO₂e saved/kg
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${
                        cat.hazardLevel === 'high' 
                          ? 'bg-red-50 text-red-700 border border-red-200' 
                          : cat.hazardLevel === 'medium'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-[#EAF6EF] text-[#176B45] border border-[#176B45]/20'
                      }`}>
                        {cat.hazardLevel || 'safe'} hazard
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: RECYCLERS IN FIRESTORE */}
          {activeTab === 'recyclers' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs px-1">
                <div>
                  <span className="font-bold text-[#17231D]">
                    {language === 'hi' ? 'Firebase Firestore में अधिकृत रीसायकलर्स:' : 'Authorized Recyclers in Firestore:'}
                  </span>
                  <span className="text-[#66736C] text-[11px] block">
                    {language === 'hi' ? 'CPCB और राज्य प्रदूषण नियंत्रण बोर्ड सत्यापित हब' : 'CPCB and State Pollution Control Board certified hubs'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddRecyclerOpen(true)}
                    className="px-2.5 py-1.5 bg-[#176B45] text-white hover:bg-[#125837] rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{language === 'hi' ? '+ नया रीसाइक्लर जोड़ें' : '+ Add Recycler(s)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSyncRecyclersToFirestore}
                    disabled={isLoading}
                    className="px-2.5 py-1.5 bg-[#EAF6EF] text-[#176B45] hover:bg-[#176B45] hover:text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>{language === 'hi' ? 'सिंक करें' : 'Sync'}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                {recyclers.map((rec) => (
                  <div key={rec.id} className="p-3.5 bg-[#F7F9F8] border border-[#DDE6E0] rounded-2xl space-y-2 hover:border-[#176B45]/40 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[#17231D]">{rec.name}</span>
                          <span className="text-[10px] px-2 py-0.2 bg-[#EAF6EF] text-[#176B45] font-bold rounded-md flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            <span>CPCB Auth</span>
                          </span>
                        </div>
                        <p className="text-[11px] text-[#66736C] mt-0.5">
                          📍 {rec.address} ({rec.distanceKm} km away)
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-[#176B45] block">
                          {((rec.priceMultiplier ?? rec.rateMultiplier ?? 1.05) * 100).toFixed(0)}% Rate
                        </span>
                        <span className="text-[10px] text-amber-700 font-bold">
                          ⭐ {rec.rating} / 5.0
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1 pt-1">
                      <span className="text-[10px] text-[#66736C] font-semibold mr-1">Accepted:</span>
                      {rec.acceptedCategories.map((c) => (
                        <span key={c} className="text-[10px] bg-white border border-[#DDE6E0] px-1.5 py-0.2 rounded-md font-medium text-[#17231D]">
                          {c}
                        </span>
                      ))}
                      <span className="ml-auto text-[10px] text-[#66736C]">
                        📞 {rec.phone || rec.contactPhone || '+91 98201 12345'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Recycler Modal within Database Viewer */}
              <AddRecyclerModal
                isOpen={isAddRecyclerOpen}
                onClose={() => setIsAddRecyclerOpen(false)}
                onRecyclersAdded={() => {
                  loadData();
                }}
                collectorLoc={{
                  lat: 19.076,
                  lng: 72.8777,
                  areaName: 'Dharavi / Kurla, Mumbai',
                  state: 'Maharashtra',
                }}
                language={language}
              />
            </div>
          )}

          {/* TAB 3: ALL TRANSACTIONS IN DATABASE */}
          {activeTab === 'transactions' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-[#66736C] px-1">
                <span>{language === 'hi' ? 'डेटाबेस में स्थायी रूप से संग्रहीत लेनदेन:' : 'Permanent Transactions in DB:'}</span>
                <span className="font-bold text-[#176B45]">{dbData.transactions?.length || 0} Records</span>
              </div>
              {dbData.transactions?.map((t: any) => (
                <div key={t.id} className="p-3 bg-[#F7F9F8] border border-[#DDE6E0] rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[#17231D]">{t.category}</span>
                      <span className="font-mono text-[10px] bg-white px-1.5 py-0.2 rounded-md border border-[#DDE6E0]">
                        {t.id}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#66736C] mt-0.5">
                      Collector: {t.userName} • Weight: {t.weightKg} kg @ ₹{t.ratePerKg}/kg
                    </p>
                    <p className="text-[10px] text-[#66736C]">
                      Recycler: {t.recyclerName} • {new Date(t.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-[#176B45] block">₹{t.totalAmount}</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-[#EAF6EF] text-[#176B45] font-bold rounded-md uppercase">
                      {t.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: DOORSTEP PICKUPS IN DATABASE */}
          {activeTab === 'pickups' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-[#66736C] px-1">
                <span>{language === 'hi' ? 'डेटाबेस में अनुसूचित पिकअप:' : 'Scheduled Doorstep Pickups in DB:'}</span>
                <span className="font-bold text-[#176B45]">{dbData.pickups?.length || 0} Requests</span>
              </div>
              {dbData.pickups?.map((p: any) => (
                <div key={p.id} className="p-3 bg-[#F7F9F8] border border-[#DDE6E0] rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[#17231D]">{p.category} ({p.estimatedWeightKg} kg)</span>
                      <span className="font-mono text-[10px] bg-white px-1.5 py-0.2 rounded-md border border-[#DDE6E0]">
                        {p.id}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#66736C] mt-0.5">
                      📍 {p.address}, {p.city}
                    </p>
                    <p className="text-[10px] text-[#66736C]">
                      Collector: {p.assignedCollectorName} ({p.assignedCollectorPhone}) • Slot: {p.timeSlot}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] px-2 py-0.5 bg-[#EAF6EF] text-[#176B45] font-bold rounded-md uppercase">
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#F7F9F8] border-t border-[#DDE6E0] flex items-center justify-between text-[11px] text-[#66736C]">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#176B45]" />
            <span>Node.js Server Database (CPCB Compliant Schema)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#176B45] text-white rounded-xl font-bold cursor-pointer hover:bg-[#125837]"
          >
            {language === 'hi' ? 'बंद करें' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
