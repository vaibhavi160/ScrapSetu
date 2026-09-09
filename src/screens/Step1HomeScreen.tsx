import React, { useState } from 'react';
import { 
  Camera, ShieldAlert, FileSpreadsheet, BarChart3, 
  TrendingUp, RefreshCw, Scale, ShieldCheck, Database, 
  LogIn, MapPin, Calendar, BookOpen, UserCheck, ChevronRight,
  ExternalLink, Coins
} from 'lucide-react';
import { Language, AppSettings, Transaction, UserProfile, WasteRecord } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { WASTE_CATEGORIES, MOCK_RECYCLERS } from '../data/mockData';
import { VoiceButton } from '../components/VoiceButton';
import { playChime } from '../utils/audioSpeech';

interface Step1HomeScreenProps {
  settings?: AppSettings;
  language?: Language;
  transactions?: Transaction[];
  wasteRecords?: WasteRecord[];
  pendingSyncCount?: number;
  onStartCollection?: () => void;
  onStartCollect?: () => void;
  onOpenSafety: () => void;
  onOpenImpact: () => void;
  onOpenLedger: () => void;
  onTriggerSync?: () => void;
  currentUser?: UserProfile | null;
  onOpenAuth?: () => void;
  onOpenDatabase?: () => void;
}

export const Step1HomeScreen: React.FC<Step1HomeScreenProps> = ({
  settings,
  language,
  transactions = [],
  wasteRecords = [],
  pendingSyncCount = 0,
  onStartCollection,
  onStartCollect,
  onOpenSafety,
  onOpenImpact,
  onOpenLedger,
  onTriggerSync,
  currentUser,
  onOpenAuth,
  onOpenDatabase,
}) => {
  const currentLanguage: Language = language || settings?.language || 'hi';
  const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.hi;
  const startCollection = onStartCollection || onStartCollect || (() => {});
  const isOffline = !!settings?.offlineSimulation;
  const collectorName = currentUser?.name || settings?.collectorName || 'Ramesh Kabadiwala';

  // Calculate live collector stats from transactions, waste records, and profile
  const txEarnings = transactions.reduce(
    (acc, cur) => acc + (cur.status === 'paid' || cur.status === 'completed' ? cur.payload.totalEstimatedPrice : cur.payload.totalEstimatedPrice),
    0
  );
  const wasteEarnings = wasteRecords.reduce((acc, cur) => acc + (cur.totalAmount || 0), 0);
  const profileEarnings = currentUser?.totalEarnings || 0;
  const totalEarnings = Math.max(txEarnings, wasteEarnings, profileEarnings);

  const txWeight = transactions.reduce((acc, cur) => acc + cur.payload.weightKg, 0);
  const wasteWeight = wasteRecords.reduce((acc, cur) => acc + (cur.weightKg || 0), 0);
  const profileWeight = currentUser?.totalWasteHandledKg || 0;
  const totalWeightKg = Math.max(txWeight, wasteWeight, profileWeight);

  const totalTransactionsCount = Math.max(transactions.length, wasteRecords.length, currentUser?.transactionsCount || 0);
  const extraFairBonus = transactions.reduce((acc, cur) => acc + cur.payload.fairAdvantageAmount, 0) || Math.round(totalEarnings * 0.28);

  const homeSpeechText =
    currentLanguage === 'hi'
      ? 'स्क्रैपसेतु में आपका स्वागत है। नया कबाड़ जोड़ने के लिए स्कैन बटन दबाएं। फोटो खींचते ही आपको सही सीपीसीबी मूल्य और अधिकृत रिसाइक्लर मिलेगा।'
      : currentLanguage === 'mr'
      ? 'स्क्रॅपसेतू मध्ये आपले स्वागत आहे. नवीन स्क्रॅप गोळा करण्यासाठी स्कॅन बटण दाबा.'
      : 'Welcome to ScrapSetu. Tap scan scrap to photograph waste and get fair certified rates.';

  return (
    <div className="space-y-6 sm:space-y-7 pb-16">
      {/* Offline Alert Bar if offline */}
      {isOffline && (
        <div className="bg-[#FFF9E6] border border-[#F5D485] rounded-2xl p-3.5 flex items-center justify-between gap-3 text-[#17231D]">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E59A23] shrink-0" />
            <span className="text-xs font-bold">
              {currentLanguage === 'hi' ? 'ऑफलाइन मोड सक्रिय' : 'Offline Mode Active'}
            </span>
          </div>
          {pendingSyncCount > 0 && (
            <button
              id="home-sync-btn"
              onClick={onTriggerSync}
              className="px-3 py-1 bg-[#107C41] text-white rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync ({pendingSyncCount})</span>
            </button>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. GREEN HEADER CARD (Matching TrashWise Screen 5)       */}
      {/* ======================================================== */}
      <div className="bg-gradient-to-br from-[#107C41] via-[#0F753D] to-[#0A5A2E] text-white rounded-3xl p-5 sm:p-6 shadow-md relative overflow-hidden">
        {/* Subtle background curved design */}
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/5 rounded-full blur-xl pointer-events-none" />
        <div className="absolute right-10 bottom-0 w-32 h-32 bg-white/5 rounded-full blur-lg pointer-events-none" />

        {/* Greeting row */}
        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 p-1 flex items-center justify-center text-white border border-white/30 backdrop-blur-xs font-bold text-lg">
              {currentUser ? currentUser.name.charAt(0).toUpperCase() : '🌿'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Halo, {currentUser ? currentUser.name : collectorName}
                </h1>
                <span className="text-[10px] bg-white/20 text-white font-semibold px-2 py-0.5 rounded-full border border-white/25">
                  CPCB Partner
                </span>
              </div>
              <p className="text-xs text-white/80 mt-0.5 font-medium">
                {currentLanguage === 'hi'
                  ? 'पर्यावरण संरक्षण व उचित मूल्य के साथ'
                  : 'Mari jaga lingkungan bersama kami'}
              </p>
            </div>
          </div>

          <div className="shrink-0">
            <VoiceButton textToSpeak={homeSpeechText} language={currentLanguage} label="" size="sm" />
          </div>
        </div>

        {/* Rewards / Points Pill Inside Header (Matching TrashWise Screen 5) */}
        <div className="mt-5 bg-white rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3 text-[#17231D] shadow-sm relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FFF3D6] text-[#D97706] flex items-center justify-center shrink-0">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-[#66736C]">
                {currentLanguage === 'hi' ? 'कुल अर्जित राशि' : 'TOTAL REWARDS'}
              </div>
              <div className="text-base sm:text-lg font-black text-[#107C41] tabular-nums tracking-tight">
                ₹{Math.round(totalEarnings).toLocaleString('en-IN')}{' '}
                <span className="text-xs font-bold text-[#D97706] ml-1">
                  ({Math.round(totalWeightKg)} POIN)
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            id="header-redeem-btn"
            onClick={onOpenLedger}
            className="px-3.5 py-1.5 rounded-full bg-[#107C41] hover:bg-[#0E6C38] text-white text-xs font-bold tracking-wide cursor-pointer transition-colors shadow-2xs shrink-0"
          >
            {currentLanguage === 'hi' ? 'बहीखाता देखें' : 'REDEEM POIN'}
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. GRID OF ROUNDED SQUARE ICON TILES (TrashWise pattern) */}
      {/* ======================================================== */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-black uppercase tracking-wider text-[#66736C]">
            {currentLanguage === 'hi' ? 'मुख्य सेवाएं' : 'Main Services'}
          </h2>
          <span className="text-[11px] text-[#107C41] font-semibold">8 Available</span>
        </div>

        <div className="grid grid-cols-4 gap-2.5 sm:gap-3.5">
          {/* 1. Scan Scrap (Aktivitas) */}
          <button
            id="tile-scan-scrap"
            type="button"
            onClick={() => {
              playChime('click');
              startCollection();
            }}
            className="bg-white p-2.5 sm:p-3 rounded-2xl border border-[#E5EAE7] hover:border-[#107C41] hover:shadow-xs flex flex-col items-center justify-center text-center transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-[#E8F5E9] group-hover:bg-[#107C41] text-[#107C41] group-hover:text-white flex items-center justify-center transition-colors shadow-2xs mb-1.5">
              <Camera className="w-6 h-6" />
            </div>
            <span className="text-[11px] sm:text-xs font-bold text-[#17231D] group-hover:text-[#107C41] line-clamp-1">
              {currentLanguage === 'hi' ? 'स्कैन कबाड़' : 'Scan Scrap'}
            </span>
          </button>

          {/* 2. Rate Board (Daur Ulang) */}
          <button
            id="tile-rate-board"
            type="button"
            onClick={() => {
              playChime('click');
              const el = document.getElementById('cpcb-rate-board-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bg-white p-2.5 sm:p-3 rounded-2xl border border-[#E5EAE7] hover:border-[#107C41] hover:shadow-xs flex flex-col items-center justify-center text-center transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-[#E8F5E9] group-hover:bg-[#107C41] text-[#107C41] group-hover:text-white flex items-center justify-center transition-colors shadow-2xs mb-1.5">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-[11px] sm:text-xs font-bold text-[#17231D] group-hover:text-[#107C41] line-clamp-1">
              {currentLanguage === 'hi' ? 'दर सूची' : 'Fair Rates'}
            </span>
          </button>

          {/* 3. Recyclers (Lokasi) */}
          <button
            id="tile-recyclers-loc"
            type="button"
            onClick={() => {
              playChime('click');
              const el = document.getElementById('community-recyclers-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bg-white p-2.5 sm:p-3 rounded-2xl border border-[#E5EAE7] hover:border-[#107C41] hover:shadow-xs flex flex-col items-center justify-center text-center transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-[#E8F5E9] group-hover:bg-[#107C41] text-[#107C41] group-hover:text-white flex items-center justify-center transition-colors shadow-2xs mb-1.5">
              <MapPin className="w-6 h-6" />
            </div>
            <span className="text-[11px] sm:text-xs font-bold text-[#17231D] group-hover:text-[#107C41] line-clamp-1">
              {currentLanguage === 'hi' ? 'रीसाइक्लर' : 'Recyclers'}
            </span>
          </button>

          {/* 4. Ledger (Laporan) */}
          <button
            id="tile-ledger"
            type="button"
            onClick={() => {
              playChime('click');
              onOpenLedger();
            }}
            className="bg-white p-2.5 sm:p-3 rounded-2xl border border-[#E5EAE7] hover:border-[#107C41] hover:shadow-xs flex flex-col items-center justify-center text-center transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-[#E8F5E9] group-hover:bg-[#107C41] text-[#107C41] group-hover:text-white flex items-center justify-center transition-colors shadow-2xs mb-1.5">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <span className="text-[11px] sm:text-xs font-bold text-[#17231D] group-hover:text-[#107C41] line-clamp-1">
              {currentLanguage === 'hi' ? 'बहीखाता' : 'Ledger'}
            </span>
          </button>

          {/* 5. Safety Rules (Artikel) */}
          <button
            id="tile-safety"
            type="button"
            onClick={() => {
              playChime('click');
              onOpenSafety();
            }}
            className="bg-white p-2.5 sm:p-3 rounded-2xl border border-[#E5EAE7] hover:border-[#107C41] hover:shadow-xs flex flex-col items-center justify-center text-center transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-[#E8F5E9] group-hover:bg-[#107C41] text-[#107C41] group-hover:text-white flex items-center justify-center transition-colors shadow-2xs mb-1.5">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <span className="text-[11px] sm:text-xs font-bold text-[#17231D] group-hover:text-[#107C41] line-clamp-1">
              {currentLanguage === 'hi' ? 'सुरक्षा नियम' : 'Safety'}
            </span>
          </button>

          {/* 6. EPR Impact */}
          <button
            id="tile-impact"
            type="button"
            onClick={() => {
              playChime('click');
              onOpenImpact();
            }}
            className="bg-white p-2.5 sm:p-3 rounded-2xl border border-[#E5EAE7] hover:border-[#107C41] hover:shadow-xs flex flex-col items-center justify-center text-center transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-[#E8F5E9] group-hover:bg-[#107C41] text-[#107C41] group-hover:text-white flex items-center justify-center transition-colors shadow-2xs mb-1.5">
              <BarChart3 className="w-6 h-6" />
            </div>
            <span className="text-[11px] sm:text-xs font-bold text-[#17231D] group-hover:text-[#107C41] line-clamp-1">
              {currentLanguage === 'hi' ? 'ईपीआर प्रभाव' : 'EPR Impact'}
            </span>
          </button>

          {/* 7. Central Database */}
          <button
            id="tile-database"
            type="button"
            onClick={() => {
              playChime('click');
              if (onOpenDatabase) onOpenDatabase();
            }}
            className="bg-white p-2.5 sm:p-3 rounded-2xl border border-[#E5EAE7] hover:border-[#107C41] hover:shadow-xs flex flex-col items-center justify-center text-center transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-[#E8F5E9] group-hover:bg-[#107C41] text-[#107C41] group-hover:text-white flex items-center justify-center transition-colors shadow-2xs mb-1.5">
              <Database className="w-6 h-6" />
            </div>
            <span className="text-[11px] sm:text-xs font-bold text-[#17231D] group-hover:text-[#107C41] line-clamp-1">
              {currentLanguage === 'hi' ? 'डेटाबेस' : 'Database'}
            </span>
          </button>

          {/* 8. User Account / Profile */}
          <button
            id="tile-profile"
            type="button"
            onClick={() => {
              playChime('click');
              if (onOpenAuth) onOpenAuth();
            }}
            className="bg-white p-2.5 sm:p-3 rounded-2xl border border-[#E5EAE7] hover:border-[#107C41] hover:shadow-xs flex flex-col items-center justify-center text-center transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-[#E8F5E9] group-hover:bg-[#107C41] text-[#107C41] group-hover:text-white flex items-center justify-center transition-colors shadow-2xs mb-1.5">
              <UserCheck className="w-6 h-6" />
            </div>
            <span className="text-[11px] sm:text-xs font-bold text-[#17231D] group-hover:text-[#107C41] line-clamp-1">
              {currentLanguage === 'hi' ? 'खाता' : 'Account'}
            </span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2.5. SCRAP COLLECTOR WASTE DATA & DATABASE EARNINGS     */}
      {/* ======================================================== */}
      <div className="bg-white rounded-3xl border border-[#E5EAE7] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#E8F5E9] text-[#107C41] flex items-center justify-center font-bold">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-[#17231D]">
                {currentLanguage === 'hi' ? 'कबाड़ डेटा व कमाई (डेटाबेस)' : 'Waste Data & Earnings (Database)'}
              </h3>
              <p className="text-[11px] text-[#66736C]">
                {currentLanguage === 'hi' ? 'फायरबेस में सुरक्षित वास्तविक कबाड़ रिकॉर्ड' : 'Live waste entries stored in Firestore'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-[#E8F5E9] text-[#107C41] px-2.5 py-1 rounded-full text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-[#107C41] animate-pulse" />
            <span>Firestore Synced</span>
          </div>
        </div>

        {/* Metric Triad */}
        <div className="grid grid-cols-3 gap-2.5 bg-[#F9FBFA] border border-[#E5EAE7] rounded-2xl p-3 text-center">
          <div>
            <div className="text-[10px] font-semibold text-[#66736C]">
              {currentLanguage === 'hi' ? 'कुल कबाड़' : 'WASTE LOGGED'}
            </div>
            <div className="text-base sm:text-lg font-black text-[#17231D] mt-0.5 tabular-nums">
              {totalWeightKg.toFixed(1)} <span className="text-xs font-normal text-[#66736C]">kg</span>
            </div>
          </div>
          <div className="border-x border-[#E5EAE7]">
            <div className="text-[10px] font-semibold text-[#66736C]">
              {currentLanguage === 'hi' ? 'कुल कमाई' : 'TOTAL EARNINGS'}
            </div>
            <div className="text-base sm:text-lg font-black text-[#107C41] mt-0.5 tabular-nums">
              ₹{Math.round(totalEarnings).toLocaleString('en-IN')}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-[#66736C]">
              {currentLanguage === 'hi' ? 'अतिरिक्त लाभ' : 'FAIR BONUS'}
            </div>
            <div className="text-base sm:text-lg font-black text-[#D97706] mt-0.5 tabular-nums">
              +₹{Math.round(extraFairBonus).toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Recent Waste Items Stored in Database */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-[#66736C] flex items-center justify-between">
            <span>{currentLanguage === 'hi' ? 'हालिया दर्ज कबाड़' : 'Recent Stored Waste Items'}</span>
            <span className="text-[10px] text-[#107C41] font-semibold">{totalTransactionsCount} Records</span>
          </div>

          <div className="space-y-2">
            {(wasteRecords.length > 0 ? wasteRecords.slice(0, 3) : transactions.slice(0, 3)).map((item: any, idx) => {
              const category = item.categoryName || item.payload?.classification?.confirmedCategory || 'Scrap Material';
              const weight = item.weightKg || item.payload?.weightKg || 12;
              const rate = item.ratePerKg || item.payload?.calculatedPricePerKg || 150;
              const earnings = item.totalAmount || item.payload?.totalEstimatedPrice || weight * rate;
              const status = item.status || 'paid';

              return (
                <div
                  key={item.id || idx}
                  className="flex items-center justify-between p-3 bg-white border border-[#E5EAE7] rounded-xl hover:border-[#107C41] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#E8F5E9] text-[#107C41] flex items-center justify-center text-xs font-bold shrink-0">
                      ♻️
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#17231D] flex items-center gap-1.5">
                        <span>{category}</span>
                        <span className="text-[10px] font-semibold text-[#66736C]">({weight} kg @ ₹{rate}/kg)</span>
                      </div>
                      <div className="text-[10px] text-[#66736C]">
                        {item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'Today'} • {item.recyclerName || 'Verified Facility'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs sm:text-sm font-black text-[#107C41] tabular-nums">
                      +₹{Math.round(earnings).toLocaleString('en-IN')}
                    </div>
                    <span className="text-[9px] font-bold bg-[#E8F5E9] text-[#107C41] px-1.5 py-0.5 rounded-full">
                      {status === 'paid' ? 'Paid & Stored' : status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          id="btn-view-collector-ledger-from-home"
          onClick={onOpenLedger}
          className="w-full py-2.5 px-4 bg-[#F4F8F5] hover:bg-[#E8F5E9] text-[#107C41] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <span>{currentLanguage === 'hi' ? 'पूरा कमाई बहीखाता देखें' : 'View Complete Earnings Ledger & Waste Log'}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* ======================================================== */}
      {/* 3. KOMUNITAS SECTION (Horizontal scroll cards like Screen 5) */}
      {/* ======================================================== */}
      <div id="community-recyclers-section" className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-black text-[#17231D] tracking-tight">
            Komunitas / {currentLanguage === 'hi' ? 'अधिकृत रीसाइक्लर केंद्र' : 'Authorized Recycler Hubs'}
          </h2>
          <span className="text-xs font-semibold text-[#107C41]">100% CPCB</span>
        </div>

        {/* Horizontal scroll cards */}
        <div className="flex gap-3.5 overflow-x-auto pb-2 scrollbar-none snap-x">
          {MOCK_RECYCLERS.slice(0, 4).map((recycler) => (
            <div
              key={recycler.id}
              className="w-56 sm:w-64 bg-white rounded-2xl border border-[#E5EAE7] p-3.5 shrink-0 snap-start shadow-2xs hover:shadow-xs transition-shadow"
            >
              <div className="w-full h-24 rounded-xl bg-[#F4F8F5] p-2 flex items-center justify-center mb-3 border border-[#E5EAE7]">
                <div className="text-center">
                  <span className="text-2xl">♻️</span>
                  <p className="text-[11px] font-bold text-[#107C41] mt-1 line-clamp-1">{recycler.name}</p>
                </div>
              </div>
              <div className="text-xs font-bold text-[#17231D] truncate">{recycler.name}</div>
              <p className="text-[11px] text-[#66736C] mt-0.5">{recycler.distanceKm} km • {recycler.city}</p>
              <div className="mt-2.5 flex items-center justify-between">
                <span className="text-[10px] font-bold bg-[#E8F5E9] text-[#107C41] px-2 py-0.5 rounded-full">
                  CPCB Verified
                </span>
                <span className="text-xs font-extrabold text-[#107C41]">
                  ★ {recycler.rating}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. ARTIKEL & CPCB RATE BOARD (Screen 5 Bottom Cards)     */}
      {/* ======================================================== */}
      <div id="cpcb-rate-board-section" className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-black text-[#17231D] tracking-tight">
            Artikel / {currentLanguage === 'hi' ? 'सीपीसीबी अधिकृत मंडी भाव' : 'CPCB Live Rate Board'}
          </h2>
          <span className="text-xs font-bold text-[#107C41] bg-[#E8F5E9] px-2.5 py-0.5 rounded-full">
            Live
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {WASTE_CATEGORIES.slice(0, 6).map((cat) => (
            <div
              key={cat.id}
              className="bg-white rounded-2xl border border-[#E5EAE7] p-3.5 flex items-center justify-between hover:border-[#107C41] transition-colors shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                >
                  <span className="font-bold text-xs">{cat.nameEn.slice(0, 2).toUpperCase()}</span>
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-[#17231D]">
                    {currentLanguage === 'hi' ? cat.nameHi : cat.nameEn}
                  </h4>
                  <p className="text-[11px] text-[#66736C] line-clamp-1">{cat.subtypes.slice(0, 2).join(', ')}</p>
                </div>
              </div>

              <div className="text-right shrink-0 pl-2">
                <div className="text-base font-black text-[#107C41] tabular-nums">
                  ₹{cat.basePricePerKg}
                  <span className="text-[10px] font-normal text-[#66736C]">/kg</span>
                </div>
                <div className="text-[10px] text-[#8A968F] line-through tabular-nums">
                  ₹{cat.marketRatePerKg}/kg
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
