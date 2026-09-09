import React, { useState } from 'react';
import { 
  Camera, ShieldAlert, FileSpreadsheet, BarChart3, 
  TrendingUp, RefreshCw, Scale, ShieldCheck, Database, 
  LogIn, MapPin, Calendar, BookOpen, UserCheck, ChevronRight,
  ExternalLink, Coins
} from 'lucide-react';
import { 
  Language, AppSettings, Transaction, UserProfile, WasteRecord,
  Recycler, WasteCategoryInfo 
} from '../types';
import { TRANSLATIONS } from '../utils/translations';
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
  categories?: WasteCategoryInfo[];
  recyclers?: Recycler[];
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
  categories = [],
  recyclers = [],
}) => {
  const currentLanguage: Language = language || settings?.language || 'hi';
  const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.hi;
  const startCollection = onStartCollection || onStartCollect || (() => {});
  const isOffline = !!settings?.offlineSimulation;
  const collectorName = currentUser?.name || settings?.collectorName || 'Ramesh Kabadiwala';

  // Calculate live collector stats from transactions, waste records, and profile
  const txEarnings = transactions.reduce(
    (acc, cur) => acc + (cur?.payload?.totalEstimatedPrice ?? (cur as any)?.totalAmount ?? (cur as any)?.payment?.amount ?? 0),
    0
  );
  const wasteEarnings = wasteRecords.reduce((acc, cur) => acc + (cur.totalAmount || 0), 0);
  const profileEarnings = currentUser?.totalEarnings || 0;
  const totalEarnings = Math.max(txEarnings, wasteEarnings, profileEarnings);

  const txWeight = transactions.reduce((acc, cur) => acc + (cur?.payload?.weightKg ?? (cur as any)?.weightKg ?? 0), 0);
  const wasteWeight = wasteRecords.reduce((acc, cur) => acc + (cur.weightKg || 0), 0);
  const profileWeight = currentUser?.totalWasteHandledKg || 0;
  const totalWeightKg = Math.max(txWeight, wasteWeight, profileWeight);

  const totalTransactionsCount = Math.max(transactions.length, wasteRecords.length, currentUser?.transactionsCount || 0);
  const extraFairBonus = transactions.reduce((acc, cur) => acc + (cur?.payload?.fairAdvantageAmount ?? (cur as any)?.fairAdvantageAmount ?? 0), 0) || Math.round(totalEarnings * 0.28);

  // Weekly progress calculation
  const weeklyTarget = 5;
  const weeklyPickups = Math.max(1, Math.min(weeklyTarget, (transactions.length % weeklyTarget) || 3));
  const weeklyPercentage = Math.round((weeklyPickups / weeklyTarget) * 100);

  const homeSpeechText =
    currentLanguage === 'hi'
      ? 'स्क्रैपसेतु में आपका स्वागत है। नया कबाड़ बेचने के लिए स्क्रैप बेचें बटन दबाएं। फोटो खींचते ही आपको सही सीपीसीबी मूल्य और अधिकृत रिसाइक्लर मिलेगा।'
      : currentLanguage === 'mr'
      ? 'स्क्रॅपसेतू मध्ये आपले स्वागत आहे. कबाड विकण्यासाठी सेल स्क्रॅप बटण दाबा.'
      : 'Welcome to ScrapSetu. Tap sell scrap to photograph waste and get fair certified rates.';

  return (
    <div className="space-y-6 sm:space-y-7 pb-16">
      {/* Offline Alert Bar if offline */}
      {isOffline && (
        <div className="bg-[#FFF9E6] border border-[#F5D485] rounded-2xl p-3.5 flex items-center justify-between gap-3 text-[#111827]">
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
              className="px-3 py-1 bg-[#E8433D] text-white rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync ({pendingSyncCount})</span>
            </button>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. GREETING HEADER WITH FLAT VECTOR ILLUSTRATION         */}
      {/* ======================================================== */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#0F1A3C] tracking-tight">
              {currentLanguage === 'hi' 
                ? `नमस्ते, ${currentUser ? currentUser.name : collectorName} 👋`
                : currentLanguage === 'mr'
                ? `नमस्कार, ${currentUser ? currentUser.name : collectorName} 👋`
                : `Hello, ${currentUser ? currentUser.name : collectorName} 👋`}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            {currentLanguage === 'hi'
              ? ' आइए मिलकर अपने शहर को स्वच्छ और हरा-भरा रखें'
              : currentLanguage === 'mr'
              ? 'चला एकत्र येऊन आपले शहर स्वच्छ आणि हरित ठेवूया'
              : "Let's keep our city clean and green together"}
          </p>
        </div>

        {/* Flat illustration of a person with a recycling bin & Voice Readout */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="block">
            <VoiceButton textToSpeak={homeSpeechText} language={currentLanguage} label="" size="sm" />
          </div>
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#EEF1F8] rounded-2xl p-1.5 flex items-center justify-center border border-slate-200/80 shadow-2xs relative overflow-hidden">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Ground & subtle shadows */}
              <ellipse cx="50" cy="88" rx="38" ry="6" fill="#CBD5E1" opacity="0.6" />
              {/* Person: Body */}
              <circle cx="36" cy="30" r="10" fill="#FBBF24" />
              <path d="M26 44 C26 40, 46 40, 46 44 L44 68 L28 68 Z" fill="#0F1A3C" />
              {/* Person: Arm holding bin handle */}
              <path d="M42 46 Q54 52 58 56" stroke="#0F1A3C" strokeWidth="4" strokeLinecap="round" fill="none" />
              {/* Person: Legs */}
              <line x1="32" y1="68" x2="30" y2="86" stroke="#0F1A3C" strokeWidth="4.5" strokeLinecap="round" />
              <line x1="40" y1="68" x2="42" y2="86" stroke="#0F1A3C" strokeWidth="4.5" strokeLinecap="round" />
              {/* Recycling Bin: Red / Navy accent */}
              <rect x="54" y="48" width="28" height="36" rx="4" fill="#E8433D" />
              <rect x="51" y="44" width="34" height="6" rx="3" fill="#D32F2F" />
              {/* Recycle Symbol on Bin */}
              <path d="M68 58 L72 63 L64 63 Z" fill="white" />
              <circle cx="68" cy="67" r="4" fill="none" stroke="white" strokeWidth="1.5" strokeDasharray="3 2" />
              {/* Small plant / leaf sprout near bin */}
              <path d="M84 76 Q88 70 86 64 Q80 70 84 76 Z" fill="#16834A" />
            </svg>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. STATS / PROGRESS CARD (Deep Navy #0F1A3C)             */}
      {/* ======================================================== */}
      <div className="bg-[#0F1A3C] text-white rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden border border-[#1A264F]">
        {/* Subtle radial highlights */}
        <div className="absolute -top-12 -right-12 w-44 h-44 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#E8433D]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center relative z-10">
          {/* Left Side: Bin/Points icon, Label, Large Bold Number, Delta */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-[#E8433D]">
                <Coins className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                {currentLanguage === 'hi'
                  ? 'कबाड़ इको पॉइंट्स व कमाई'
                  : currentLanguage === 'mr'
                  ? 'कचरा इको पॉइंट्स व कमाई'
                  : 'Eco Points & Earnings'}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-white tabular-nums tracking-tight">
                ₹{Math.round(totalEarnings).toLocaleString('en-IN')}
              </span>
              <span className="text-xs font-bold text-amber-300 bg-white/10 px-2 py-0.5 rounded-full">
                {Math.round(totalWeightKg)} Pts
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
              <span>↑</span>
              <span>
                {currentLanguage === 'hi' 
                  ? `+₹${Math.round(extraFairBonus)} इस सप्ताह (+${totalWeightKg.toFixed(1)} kg)`
                  : currentLanguage === 'mr'
                  ? `+₹${Math.round(extraFairBonus)} या आठवड्यात (+${totalWeightKg.toFixed(1)} kg)`
                  : `+₹${Math.round(extraFairBonus)} this week (+${totalWeightKg.toFixed(1)} kg)`}
              </span>
            </div>
          </div>

          {/* Right Side: Circular Progress Ring (Level / Streak) */}
          <div className="flex items-center justify-start sm:justify-end gap-3.5 pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l border-white/10 sm:pl-6">
            <div className="relative w-18 h-18 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
                {/* Background Ring */}
                <circle
                  cx="36"
                  cy="36"
                  r="28"
                  fill="none"
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth="5.5"
                />
                {/* Active Red Fill Ring */}
                <circle
                  cx="36"
                  cy="36"
                  r="28"
                  fill="none"
                  stroke="#E8433D"
                  strokeWidth="5.5"
                  strokeDasharray="175.9"
                  strokeDashoffset={175.9 - (175.9 * 0.75)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-center flex flex-col items-center justify-center">
                <span className="text-sm sm:text-base font-black text-white leading-none">Lvl 4</span>
                <span className="text-[9px] text-slate-300 uppercase tracking-wider font-semibold mt-0.5">Tier</span>
              </div>
            </div>

            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1">
                <span>{currentLanguage === 'hi' ? 'मास्टर कलेक्टर' : 'Master Collector'}</span>
                <span className="text-amber-400">★</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-tight">
                {currentLanguage === 'hi' ? '4 सप्ताह की सक्रिय स्ट्रीक' : '4-week active recycling streak'}
              </p>
              <span className="inline-block text-[10px] text-emerald-400 font-bold bg-white/10 px-2 py-0.5 rounded-full mt-1.5">
                Top 5% in Mumbai
              </span>
            </div>
          </div>
        </div>

        {/* Below Both: Connected Milestones Dots (Step Tracker) */}
        <div className="mt-5 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between relative">
            {/* Connecting line behind dots */}
            <div className="absolute left-2 right-2 top-1.5 h-0.5 bg-white/15 -z-0" />
            
            {[1, 2, 3, 4, 5, 6, 7].map((milestone) => {
              const isPassed = milestone <= 4;
              const isCurrent = milestone === 4;

              return (
                <div key={milestone} className="flex flex-col items-center gap-1 relative z-10">
                  <div
                    className={`w-3 h-3 rounded-full transition-all flex items-center justify-center ${
                      isCurrent
                        ? 'bg-[#E8433D] ring-4 ring-[#E8433D]/30 scale-125'
                        : isPassed
                        ? 'bg-[#E8433D]'
                        : 'bg-white/20'
                    }`}
                  />
                  <span className="text-[9px] text-slate-400 font-semibold hidden sm:inline">
                    M{milestone}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. WEEKLY PROGRESS SECTION (On White Background)         */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-[#0F1A3C]">
            {currentLanguage === 'hi'
              ? `साप्ताहिक प्रगति — ${weeklyPickups} / ${weeklyTarget} पिकअप`
              : `Weekly Progress — ${weeklyPickups} of ${weeklyTarget} Pickups`}
          </span>
          <span className="text-[#E8433D] font-extrabold text-sm">{weeklyPercentage}%</span>
        </div>

        {/* Horizontal Progress Bar with Red Fill & Circular Handle Marker */}
        <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-visible">
          <div
            className="h-full bg-[#E8433D] rounded-full transition-all duration-500 relative"
            style={{ width: `${weeklyPercentage}%` }}
          >
            {/* Circular Handle Marker at the right end */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-5 h-5 rounded-full bg-white border-3 border-[#E8433D] shadow-sm flex items-center justify-center" />
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. TWO SIDE-BY-SIDE ACTION BUTTONS                      */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Left: Solid Red Pill Button (Primary Action) */}
        <button
          id="btn-primary-sell-scrap"
          type="button"
          onClick={() => {
            playChime('click');
            startCollection();
          }}
          className="w-full py-3.5 px-3 sm:px-4 rounded-full bg-[#E8433D] hover:bg-[#D32F2F] active:scale-98 text-white font-black text-sm sm:text-base shadow-md shadow-[#E8433D]/25 transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer group"
        >
          <Camera className="w-5 h-5 group-hover:rotate-12 transition-transform shrink-0" />
          <span className="truncate">{currentLanguage === 'hi' ? 'कबाड़ बेचें' : currentLanguage === 'mr' ? 'कचरा विका' : 'Sell Scrap'}</span>
        </button>

        {/* Right: White Pill Button with Dark Border/Outline & Dark Text (Secondary Action) */}
        <button
          id="btn-secondary-my-earnings"
          type="button"
          onClick={() => {
            playChime('click');
            onOpenLedger();
          }}
          className="w-full py-3.5 px-3 sm:px-4 rounded-full bg-white hover:bg-[#EEF1F8] active:scale-98 border-2 border-[#0F1A3C] text-[#0F1A3C] font-black text-sm sm:text-base shadow-xs transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer group"
        >
          <FileSpreadsheet className="w-5 h-5 text-[#0F1A3C] group-hover:scale-110 transition-transform shrink-0" />
          <span className="truncate">{currentLanguage === 'hi' ? 'मेरी कमाई' : currentLanguage === 'mr' ? 'माझी कमाई' : 'My Earnings'}</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 5. MAIN SERVICES GRID                                    */}
      {/* ======================================================== */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">
            {currentLanguage === 'hi' ? 'मुख्य सेवाएं' : currentLanguage === 'mr' ? 'मुख्य सेवा' : 'Main Services'}
          </h2>
          <span className="text-[11px] text-[#E8433D] font-bold">8 Available</span>
        </div>

        <div className="grid grid-cols-4 gap-2 sm:gap-3.5">
          {/* 1. Scan Scrap */}
          <button
            id="tile-scan-scrap"
            type="button"
            onClick={() => {
              playChime('click');
              startCollection();
            }}
            className="bg-white p-2 sm:p-3 rounded-2xl border border-slate-200 hover:border-[#E8433D] hover:shadow-sm flex flex-col items-center justify-center text-center transition-all cursor-pointer group"
          >
            <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-[#EEF1F8] group-hover:bg-[#E8433D] text-[#0F1A3C] group-hover:text-white flex items-center justify-center transition-colors shadow-2xs mb-1.5">
              <Camera className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <span className="text-[10.5px] sm:text-xs font-bold text-[#111827] group-hover:text-[#E8433D] line-clamp-1">
              {currentLanguage === 'hi' ? 'स्कैन कबाड़' : currentLanguage === 'mr' ? 'स्कॅन कचरा' : 'Scan Scrap'}
            </span>
          </button>

          {/* 2. Rate Board */}
          <button
            id="tile-rate-board"
            type="button"
            onClick={() => {
              playChime('click');
              const el = document.getElementById('cpcb-rate-board-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bg-white p-2 sm:p-3 rounded-2xl border border-slate-200 hover:border-[#E8433D] hover:shadow-sm flex flex-col items-center justify-center text-center transition-all cursor-pointer group"
          >
            <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-[#EEF1F8] group-hover:bg-[#E8433D] text-[#0F1A3C] group-hover:text-white flex items-center justify-center transition-colors shadow-2xs mb-1.5">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <span className="text-[10.5px] sm:text-xs font-bold text-[#111827] group-hover:text-[#E8433D] line-clamp-1">
              {currentLanguage === 'hi' ? 'दर सूची' : currentLanguage === 'mr' ? 'रास्त दर' : 'Fair Rates'}
            </span>
          </button>

          {/* 3. Recyclers */}
          <button
            id="tile-recyclers-loc"
            type="button"
            onClick={() => {
              playChime('click');
              const el = document.getElementById('community-recyclers-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bg-white p-2 sm:p-3 rounded-2xl border border-slate-200 hover:border-[#E8433D] hover:shadow-sm flex flex-col items-center justify-center text-center transition-all cursor-pointer group"
          >
            <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-[#EEF1F8] group-hover:bg-[#E8433D] text-[#0F1A3C] group-hover:text-white flex items-center justify-center transition-colors shadow-2xs mb-1.5">
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <span className="text-[10.5px] sm:text-xs font-bold text-[#111827] group-hover:text-[#E8433D] line-clamp-1">
              {currentLanguage === 'hi' ? 'रीसाइक्लर' : currentLanguage === 'mr' ? 'रिसायकलर' : 'Recyclers'}
            </span>
          </button>

          {/* 4. Ledger */}
          <button
            id="tile-ledger"
            type="button"
            onClick={() => {
              playChime('click');
              onOpenLedger();
            }}
            className="bg-white p-2 sm:p-3 rounded-2xl border border-slate-200 hover:border-[#E8433D] hover:shadow-sm flex flex-col items-center justify-center text-center transition-all cursor-pointer group"
          >
            <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-[#EEF1F8] group-hover:bg-[#E8433D] text-[#0F1A3C] group-hover:text-white flex items-center justify-center transition-colors shadow-2xs mb-1.5">
              <FileSpreadsheet className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <span className="text-[10.5px] sm:text-xs font-bold text-[#111827] group-hover:text-[#E8433D] line-clamp-1">
              {currentLanguage === 'hi' ? 'बहीखाता' : currentLanguage === 'mr' ? 'खातेवही' : 'Ledger'}
            </span>
          </button>

          {/* 5. Safety Rules */}
          <button
            id="tile-safety"
            type="button"
            onClick={() => {
              playChime('click');
              onOpenSafety();
            }}
            className="bg-white p-2 sm:p-3 rounded-2xl border border-slate-200 hover:border-[#E8433D] hover:shadow-sm flex flex-col items-center justify-center text-center transition-all cursor-pointer group"
          >
            <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-[#EEF1F8] group-hover:bg-[#E8433D] text-[#0F1A3C] group-hover:text-white flex items-center justify-center transition-colors shadow-2xs mb-1.5">
              <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <span className="text-[10.5px] sm:text-xs font-bold text-[#111827] group-hover:text-[#E8433D] line-clamp-1">
              {currentLanguage === 'hi' ? 'सुरक्षा नियम' : currentLanguage === 'mr' ? 'सुरक्षा नियम' : 'Safety'}
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
            className="bg-white p-2 sm:p-3 rounded-2xl border border-slate-200 hover:border-[#E8433D] hover:shadow-sm flex flex-col items-center justify-center text-center transition-all cursor-pointer group"
          >
            <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-[#EEF1F8] group-hover:bg-[#E8433D] text-[#0F1A3C] group-hover:text-white flex items-center justify-center transition-colors shadow-2xs mb-1.5">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <span className="text-[10.5px] sm:text-xs font-bold text-[#111827] group-hover:text-[#E8433D] line-clamp-1">
              {currentLanguage === 'hi' ? 'ईपीआर प्रभाव' : currentLanguage === 'mr' ? 'ईपीआर प्रभाव' : 'EPR Impact'}
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
            className="bg-white p-2 sm:p-3 rounded-2xl border border-slate-200 hover:border-[#E8433D] hover:shadow-sm flex flex-col items-center justify-center text-center transition-all cursor-pointer group"
          >
            <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-[#EEF1F8] group-hover:bg-[#E8433D] text-[#0F1A3C] group-hover:text-white flex items-center justify-center transition-colors shadow-2xs mb-1.5">
              <Database className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <span className="text-[10.5px] sm:text-xs font-bold text-[#111827] group-hover:text-[#E8433D] line-clamp-1">
              {currentLanguage === 'hi' ? 'डेटाबेस' : currentLanguage === 'mr' ? 'डेटाबेस' : 'Database'}
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
            className="bg-white p-2 sm:p-3 rounded-2xl border border-slate-200 hover:border-[#E8433D] hover:shadow-sm flex flex-col items-center justify-center text-center transition-all cursor-pointer group"
          >
            <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-[#EEF1F8] group-hover:bg-[#E8433D] text-[#0F1A3C] group-hover:text-white flex items-center justify-center transition-colors shadow-2xs mb-1.5">
              <UserCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <span className="text-[10.5px] sm:text-xs font-bold text-[#111827] group-hover:text-[#E8433D] line-clamp-1">
              {currentLanguage === 'hi' ? 'खाता' : currentLanguage === 'mr' ? 'खाते' : 'Account'}
            </span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 6. SCRAP COLLECTOR WASTE DATA & DATABASE EARNINGS       */}
      {/* ======================================================== */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#EEF1F8] text-[#0F1A3C] flex items-center justify-center font-bold">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-[#0F1A3C]">
                {currentLanguage === 'hi' ? 'कबाड़ डेटा व कमाई (डेटाबेस)' : 'Waste Data & Earnings (Database)'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {currentLanguage === 'hi' ? 'फायरबेस में सुरक्षित वास्तविक कबाड़ रिकॉर्ड' : 'Live waste entries stored in Firestore'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-[#EEF1F8] text-[#0F1A3C] px-2.5 py-1 rounded-full text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-[#E8433D] animate-pulse" />
            <span>Firestore Synced</span>
          </div>
        </div>

        {/* Metric Triad */}
        <div className="grid grid-cols-3 gap-2.5 bg-[#F8F9FD] border border-slate-200 rounded-2xl p-3 text-center">
          <div>
            <div className="text-[10px] font-semibold text-slate-500">
              {currentLanguage === 'hi' ? 'कुल कबाड़' : 'WASTE LOGGED'}
            </div>
            <div className="text-base sm:text-lg font-black text-[#0F1A3C] mt-0.5 tabular-nums">
              {totalWeightKg.toFixed(1)} <span className="text-xs font-normal text-slate-500">kg</span>
            </div>
          </div>
          <div className="border-x border-slate-200">
            <div className="text-[10px] font-semibold text-slate-500">
              {currentLanguage === 'hi' ? 'कुल कमाई' : 'TOTAL EARNINGS'}
            </div>
            <div className="text-base sm:text-lg font-black text-[#E8433D] mt-0.5 tabular-nums">
              ₹{Math.round(totalEarnings).toLocaleString('en-IN')}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500">
              {currentLanguage === 'hi' ? 'अतिरिक्त लाभ' : 'FAIR BONUS'}
            </div>
            <div className="text-base sm:text-lg font-black text-amber-600 mt-0.5 tabular-nums">
              +₹{Math.round(extraFairBonus).toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Recent Waste Items Stored in Database */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-500 flex items-center justify-between">
            <span>{currentLanguage === 'hi' ? 'हालिया दर्ज कबाड़' : 'Recent Stored Waste Items'}</span>
            <span className="text-[10px] text-[#E8433D] font-bold">{totalTransactionsCount} Records</span>
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
                  className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-[#0F1A3C] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#EEF1F8] text-[#0F1A3C] flex items-center justify-center text-xs font-bold shrink-0">
                      ♻️
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#0F1A3C] flex items-center gap-1.5">
                        <span>{category}</span>
                        <span className="text-[10px] font-semibold text-slate-500">({weight} kg @ ₹{rate}/kg)</span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'Today'} • {item.recyclerName || 'Verified Facility'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs sm:text-sm font-black text-[#E8433D] tabular-nums">
                      +₹{Math.round(earnings).toLocaleString('en-IN')}
                    </div>
                    <span className="text-[9px] font-bold bg-[#EEF1F8] text-[#0F1A3C] px-1.5 py-0.5 rounded-full">
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
          className="w-full py-2.5 px-4 bg-[#EEF1F8] hover:bg-[#E2E8F4] text-[#0F1A3C] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <span>{currentLanguage === 'hi' ? 'पूरा कमाई बहीखाता देखें' : 'View Complete Earnings Ledger & Waste Log'}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* ======================================================== */}
      {/* 7. AUTHORIZED RECYCLER HUBS (Horizontal Cards)           */}
      {/* ======================================================== */}
      <div id="community-recyclers-section" className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-black text-[#0F1A3C] tracking-tight">
            {currentLanguage === 'hi' ? 'अधिकृत रीसाइक्लर केंद्र' : 'Authorized Recycler Hubs'}
          </h2>
          <span className="text-xs font-bold text-[#E8433D]">100% CPCB</span>
        </div>

        {/* Horizontal scroll cards */}
        <div className="flex gap-3.5 overflow-x-auto pb-2 scrollbar-none snap-x">
          {recyclers.slice(0, 4).map((recycler) => (
            <div
              key={recycler.id}
              className="w-56 sm:w-64 bg-white rounded-2xl border border-slate-200 p-3.5 shrink-0 snap-start shadow-2xs hover:shadow-xs transition-shadow"
            >
              <div className="w-full h-24 rounded-xl bg-[#EEF1F8] p-2 flex items-center justify-center mb-3 border border-slate-200/80">
                <div className="text-center">
                  <span className="text-2xl">♻️</span>
                  <p className="text-[11px] font-bold text-[#0F1A3C] mt-1 line-clamp-1">{recycler.name}</p>
                </div>
              </div>
              <div className="text-xs font-bold text-[#0F1A3C] truncate">{recycler.name}</div>
              <p className="text-[11px] text-slate-500 mt-0.5">{recycler.distanceKm || 3.2} km • {recycler.city}</p>
              <div className="mt-2.5 flex items-center justify-between">
                <span className="text-[10px] font-bold bg-[#EEF1F8] text-[#0F1A3C] px-2 py-0.5 rounded-full">
                  CPCB Verified
                </span>
                <span className="text-xs font-extrabold text-[#E8433D]">
                  ★ {recycler.rating}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 8. CPCB LIVE RATE BOARD                                  */}
      {/* ======================================================== */}
      <div id="cpcb-rate-board-section" className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-black text-[#0F1A3C] tracking-tight">
            {currentLanguage === 'hi' ? 'सीपीसीबी अधिकृत मंडी भाव' : 'CPCB Live Rate Board'}
          </h2>
          <span className="text-xs font-bold text-white bg-[#E8433D] px-2.5 py-0.5 rounded-full">
            Live
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {categories.slice(0, 6).map((cat) => (
            <div
              key={cat.id}
              className="bg-white rounded-2xl border border-slate-200 p-3.5 flex items-center justify-between hover:border-[#0F1A3C] transition-colors shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs bg-[#EEF1F8] text-[#0F1A3C]"
                >
                  <span>{cat.nameEn.slice(0, 2).toUpperCase()}</span>
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-[#0F1A3C]">
                    {currentLanguage === 'hi' ? cat.nameHi : cat.nameEn}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{cat.subtypes.slice(0, 2).join(', ')}</p>
                </div>
              </div>

              <div className="text-right shrink-0 pl-2">
                <div className="text-base font-black text-[#E8433D] tabular-nums">
                  ₹{cat.basePricePerKg}
                  <span className="text-[10px] font-normal text-slate-500">/kg</span>
                </div>
                <div className="text-[10px] text-slate-400 line-through tabular-nums">
                  ₹{cat.marketRatePerKg}/kg
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 9. INFO / TIP CARD (Soft Gray-Lavender #EEF1F8)          */}
      {/* ======================================================== */}
      <div className="bg-[#EEF1F8] border border-[#D9E1F2] rounded-3xl p-5 sm:p-6 relative overflow-hidden shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 items-center">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">💡</span>
              <h3 className="text-sm sm:text-base font-black text-[#0F1A3C]">
                {currentLanguage === 'hi' ? 'क्या आप जानते हैं?' : 'Did You Know?'}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              {currentLanguage === 'hi'
                ? '1 टन इलेक्ट्रॉनिक कबाड़ को रीसायकल करने से 1 टन प्राकृतिक अयस्क खनन की तुलना में 50 गुना अधिक सोना और तांबा प्राप्त होता है, साथ ही 1.8 टन कार्बन उत्सर्जन बचता है।'
                : 'Recycling 1 ton of e-waste recovers 50x more gold and copper than extracting 1 ton of mined ore, while preventing 1.8 tons of greenhouse gas emissions.'}
            </p>
            <div className="pt-1">
              <button
                type="button"
                id="tip-card-learn-more"
                onClick={onOpenImpact}
                className="text-xs sm:text-sm font-extrabold text-[#E8433D] hover:underline flex items-center gap-1 cursor-pointer transition-all"
              >
                <span>{currentLanguage === 'hi' ? 'और जानें →' : 'Learn More →'}</span>
              </button>
            </div>
          </div>

          {/* Flat vector illustration: Bin + Plants + City Buildings */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 self-center hidden sm:flex items-center justify-center bg-white/70 rounded-2xl border border-slate-200/80 p-2 shadow-2xs">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Background city skyline silhouette */}
              <rect x="10" y="44" width="16" height="36" fill="#CBD5E1" opacity="0.6" rx="1" />
              <rect x="22" y="32" width="20" height="48" fill="#94A3B8" opacity="0.6" rx="1" />
              <rect x="38" y="48" width="14" height="32" fill="#CBD5E1" opacity="0.6" rx="1" />
              {/* Window dots */}
              <circle cx="28" cy="40" r="1.5" fill="white" />
              <circle cx="34" cy="40" r="1.5" fill="white" />
              <circle cx="28" cy="48" r="1.5" fill="white" />
              <circle cx="34" cy="48" r="1.5" fill="white" />
              {/* Ground base */}
              <rect x="4" y="80" width="92" height="6" rx="3" fill="#E2E8F0" />
              {/* Recycling bin front right */}
              <rect x="54" y="48" width="26" height="32" rx="3" fill="#0F1A3C" />
              <rect x="52" y="44" width="30" height="5" rx="2" fill="#1A264F" />
              {/* Recycle symbol */}
              <path d="M67 56 L71 61 L63 61 Z" fill="#E8433D" />
              <circle cx="67" cy="65" r="3.5" fill="none" stroke="#E8433D" strokeWidth="1.2" strokeDasharray="2 1.5" />
              {/* Eco Plant sprout growing from behind bin */}
              <path d="M50 78 Q50 60 44 54 Q48 54 50 64" fill="none" stroke="#16834A" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M44 54 Q38 48 44 42 Q50 48 44 54 Z" fill="#22C55E" />
              <path d="M50 62 Q56 56 60 58 Q56 64 50 62 Z" fill="#16834A" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
