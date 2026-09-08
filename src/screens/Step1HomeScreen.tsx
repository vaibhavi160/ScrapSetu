import React from 'react';
import { 
  Camera, ShieldAlert, FileSpreadsheet, BarChart3, 
  ArrowRight, Sparkles, TrendingUp, CheckCircle, RefreshCw,
  Scale, ShieldCheck, UserCheck, Database, LogIn
} from 'lucide-react';
import { Language, AppSettings, Transaction, UserProfile } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { WASTE_CATEGORIES } from '../data/mockData';
import { VoiceButton } from '../components/VoiceButton';
import { playChime } from '../utils/audioSpeech';

interface Step1HomeScreenProps {
  settings?: AppSettings;
  language?: Language;
  transactions?: Transaction[];
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

  // Calculate live collector stats
  const totalEarnings = transactions.reduce(
    (acc, cur) => acc + (cur.status === 'paid' || cur.status === 'completed' ? cur.payload.totalEstimatedPrice : 0),
    0
  );
  const totalWeightKg = transactions.reduce((acc, cur) => acc + cur.payload.weightKg, 0);
  const totalTransactionsCount = transactions.length;
  const extraFairBonus = transactions.reduce((acc, cur) => acc + cur.payload.fairAdvantageAmount, 0);

  const homeSpeechText =
    currentLanguage === 'hi'
      ? 'स्क्रैपसेतु में आपका स्वागत है। नया कबाड़ जोड़ने के लिए नीचे दिए गए हरे बटन को दबाएं। फोटो खींचते ही आपको सही मूल्य और अधिकृत रिसाइक्लर मिलेगा।'
      : currentLanguage === 'mr'
      ? 'स्क्रॅपसेतू मध्ये आपले स्वागत आहे. नवीन स्क्रॅप गोळा करण्यासाठी खालील हिरवे बटण दाबा. फोटो काढताच योग्य भाव आणि अधिकृत रिसायकलर मिळेल.'
      : 'Welcome to ScrapSetu. Tap the scan button to photograph scrap, get fair CPCB prices, and connect directly with authorized recyclers.';

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Offline Alert Bar if offline */}
      {isOffline && (
        <div className="bg-[#FEF6E9] border border-[#E59A23]/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[#17231D]">
          <div className="flex items-start sm:items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E59A23] mt-1 sm:mt-0 shrink-0" />
            <div>
              <p className="font-bold text-sm text-[#17231D]">
                {currentLanguage === 'hi'
                  ? 'ऑफलाइन मोड सक्रिय है • बिना इंटरनेट काम करें'
                  : currentLanguage === 'mr'
                  ? 'ऑफलाइन मोड सक्रिय आहे • इंटरनेटशिवाय काम करा'
                  : 'Offline Mode Active • Works without Internet'}
              </p>
              <p className="text-xs text-[#66736C] mt-0.5">
                {currentLanguage === 'hi'
                  ? 'सारे सौदे फोन में सुरक्षित रहेंगे और नेटवर्क आते ही स्वतः सिंक होंगे।'
                  : currentLanguage === 'mr'
                  ? 'सर्व नोंदी फोनमध्ये सुरक्षित राहतील आणि नेटवर्क आल्यावर सिंक होतील.'
                  : 'Transactions are stored securely in local ledger and synced automatically.'}
              </p>
            </div>
          </div>
          {pendingSyncCount > 0 && (
            <button
              id="home-sync-btn"
              onClick={onTriggerSync}
              className="px-3.5 py-1.5 bg-[#E59A23] text-white rounded-xl text-xs font-semibold hover:bg-[#C98218] flex items-center gap-1.5 cursor-pointer self-start sm:self-auto transition-colors shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync ({pendingSyncCount})</span>
            </button>
          )}
        </div>
      )}

      {/* Hero Welcome & Primary Action Card */}
      <div className="bg-white rounded-2xl border border-[#DDE6E0] p-5 sm:p-7 shadow-xs">
        {/* Account and Database Status Banner */}
        <div className="mb-4 pb-4 border-b border-[#DDE6E0]/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#176B45] text-white flex items-center justify-center font-bold text-[11px]">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <span className="font-bold text-[#17231D]">{currentUser.name}</span>
                <span className="text-[#66736C] ml-1.5">({currentUser.role.toUpperCase()})</span>
                <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-[#176B45] bg-[#EAF6EF] px-2 py-0.5 rounded-md font-bold">
                  <Database className="w-3 h-3" />
                  {currentLanguage === 'hi' ? 'डेटाबेस से जुड़ा हुआ' : 'Database Synced'}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[#66736C]">
              <LogIn className="w-4 h-4 text-[#176B45]" />
              <span>
                {currentLanguage === 'hi'
                  ? 'अतिथि सत्र • अपने लेन-देन सुरक्षित करने के लिए लॉग इन करें'
                  : 'Guest Session • Log in to save and sync with central database'}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            {currentUser ? (
              <button
                type="button"
                onClick={onOpenDatabase}
                className="px-3 py-1 bg-[#F7F9F8] hover:bg-[#EAF6EF] text-[#176B45] border border-[#DDE6E0] hover:border-[#176B45] rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-1.5 text-xs"
              >
                <Database className="w-3.5 h-3.5" />
                <span>{currentLanguage === 'hi' ? 'डेटाबेस विवरण देखें' : 'View DB Details'}</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="hero-login-btn"
                  type="button"
                  onClick={() => {
                    playChime('click');
                    if (onOpenAuth) onOpenAuth();
                  }}
                  className="px-3.5 py-1.5 bg-[#176B45] hover:bg-[#125837] text-white rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-1.5 text-xs shadow-xs"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{currentLanguage === 'hi' ? 'लॉग इन / खाता बनाएं' : 'Log In / Register'}</span>
                </button>
                <button
                  id="hero-db-btn"
                  type="button"
                  onClick={onOpenDatabase}
                  className="px-2.5 py-1.5 bg-[#F7F9F8] hover:bg-[#EAF6EF] text-[#66736C] hover:text-[#176B45] border border-[#DDE6E0] rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-1 text-xs"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>DB</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#DDE6E0]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EAF6EF] text-[#176B45] border border-[#176B45]/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>
                  {currentLanguage === 'hi' ? 'सत्यापित कबाड़ी साथी' : currentLanguage === 'mr' ? 'सत्यापित कबाडी मित्र' : 'Verified Collector Partner'}
                </span>
              </span>
              <span className="text-xs text-[#66736C]">
                {currentUser?.id ? `ID: ${currentUser.id}` : 'ID: MH-KBD-2026-089'}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#17231D] tracking-tight">
              {collectorName}
            </h2>
            <p className="text-sm text-[#66736C] mt-1">
              {currentLanguage === 'hi'
                ? 'कचरे को सीधे अधिकृत रीसाइक्लर तक पहुँचाएँ और पूरा मूल्य पाएं'
                : currentLanguage === 'mr'
                ? 'कचरा थेट अधिकृत रिसायकलरकडे पोहोचवून पूर्ण मोबदला मिळवा'
                : 'Connect directly with authorized CPCB recyclers at guaranteed fair rates'}
            </p>
          </div>

          <div className="self-start sm:self-center">
            <VoiceButton textToSpeak={homeSpeechText} language={currentLanguage} label={t.listenAudio} size="md" />
          </div>
        </div>


        {/* Big Tactile Action Button for Instant Camera Scan & AI Detection */}
        <div className="pt-6">
          <button
            id="btn-start-collection-flow"
            onClick={() => {
              playChime('click');
              startCollection();
            }}
            className="w-full bg-[#176B45] hover:bg-[#238B5A] text-white p-4 sm:p-5 rounded-2xl transition-all flex items-center justify-between cursor-pointer group shadow-sm hover:shadow-md"
          >
            <div className="flex items-center gap-4 text-left">
              <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-base sm:text-lg font-bold text-white leading-snug">
                  {currentLanguage === 'hi' ? 'कबाड़ का फोटो खींचें व उचित भाव देखें' : currentLanguage === 'mr' ? 'कबाडी फोटो काढा व रास्त भाव तपासा' : 'Scan Scrap & Get Fair Price'}
                </div>
                <p className="text-xs sm:text-sm text-white/80 mt-0.5">
                  {currentLanguage === 'hi' 
                    ? 'एआई से तुरंत पहचान • सीपीसीबी रेट कार्ड • नजदीकी रीसाइक्लर' 
                    : currentLanguage === 'mr' 
                    ? 'एआय त्वरित ओळख • सीपीसीबी दर • जवळचे रिसायकलर' 
                    : 'Instant AI Classification • CPCB Rate Card • Doorstep Pickup'}
                </p>
              </div>
            </div>
            
            <div className="hidden sm:flex items-center gap-2 bg-white text-[#176B45] px-4 py-2 rounded-xl font-bold text-sm shrink-0 group-hover:bg-[#EAF6EF] transition-colors">
              <span>{currentLanguage === 'hi' ? 'शुरू करें' : currentLanguage === 'mr' ? 'सुरू करा' : 'Start Scan'}</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      </div>

      {/* Metrics & Performance Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Earnings Card */}
        <div className="bg-white p-5 rounded-2xl border border-[#DDE6E0] shadow-xs">
          <div className="flex items-center justify-between text-[#66736C] text-xs font-semibold mb-2">
            <span>{t.todayEarnings}</span>
            <span className="w-2 h-2 rounded-full bg-[#16834A]" />
          </div>
          <div className="text-3xl font-extrabold text-[#17231D] tabular-nums tracking-tight">
            ₹{Math.round(totalEarnings).toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-[#16834A] font-semibold flex items-center gap-1.5 mt-2.5 bg-[#EAF6EF] px-2.5 py-1 rounded-lg w-fit">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+₹{Math.round(extraFairBonus).toLocaleString('en-IN')} {currentLanguage === 'hi' ? 'अतिरिक्त ईपीआर लाभ' : 'Extra EPR Bonus'}</span>
          </div>
        </div>

        {/* Diversion / Weight Card */}
        <div className="bg-white p-5 rounded-2xl border border-[#DDE6E0] shadow-xs">
          <div className="flex items-center justify-between text-[#66736C] text-xs font-semibold mb-2">
            <span>{t.totalDiverted}</span>
            <Scale className="w-4 h-4 text-[#176B45]" />
          </div>
          <div className="text-3xl font-extrabold text-[#17231D] tabular-nums tracking-tight">
            {totalWeightKg.toFixed(1)} <span className="text-base font-medium text-[#66736C]">kg</span>
          </div>
          <div className="text-xs text-[#176B45] font-semibold flex items-center gap-1.5 mt-2.5 bg-[#EAF6EF] px-2.5 py-1 rounded-lg w-fit">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{totalTransactionsCount} {currentLanguage === 'hi' ? 'सत्यापित लॉट' : 'Verified batches'}</span>
          </div>
        </div>

        {/* Verified Recyclers Connectivity Status */}
        <div className="bg-white p-5 rounded-2xl border border-[#DDE6E0] shadow-xs sm:col-span-2 lg:col-span-1 flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold text-[#66736C] mb-1">
              {currentLanguage === 'hi' ? 'सक्रिय रीसाइक्लर नेटवर्क' : currentLanguage === 'mr' ? 'सक्रिय रिसायकलर नेटवर्क' : 'Authorized Recycler Network'}
            </div>
            <div className="text-lg font-bold text-[#17231D] mt-1">
              100% CPCB Compliant
            </div>
            <p className="text-xs text-[#66736C] mt-1">
              {currentLanguage === 'hi' 
                ? 'प्रत्येक सौदे पर डिजिटल रसीद व ईपीआर क्रेडिट प्रमाणन' 
                : 'Direct digital payments via UPI & verifiable blockchain ledger'}
            </p>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#16834A]" />
            <span className="text-xs text-[#176B45] font-medium">14 Authorized Hubs Near You</span>
          </div>
        </div>
      </div>

      {/* Compliance & Quick Tools */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-[#17231D] tracking-tight">
            {currentLanguage === 'hi' ? 'डिजिटल प्रमाणन एवं सेवाएं' : currentLanguage === 'mr' ? 'डिजिटल प्रमाणन आणि सेवा' : 'Verified Services & Compliance'}
          </h3>
          <span className="text-xs text-[#66736C]">Tap to open</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Safety Rules */}
          <button
            id="home-tile-safety"
            onClick={onOpenSafety}
            className="p-4 bg-white rounded-2xl border border-[#DDE6E0] hover:border-[#176B45]/40 hover:shadow-xs text-left transition-all cursor-pointer flex items-center sm:flex-col sm:items-start gap-3.5 group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#FEF6E9] text-[#E59A23] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#17231D]">
                {currentLanguage === 'hi' ? 'सुरक्षा नियम' : currentLanguage === 'mr' ? 'सुरक्षा नियम' : 'Safety Rules'}
              </div>
              <div className="text-xs text-[#66736C] mt-0.5">
                {currentLanguage === 'hi' ? 'ई-कचरा व लिथियम सावधानी' : 'Hazard Handling Tips'}
              </div>
            </div>
          </button>

          {/* Ledger */}
          <button
            id="home-tile-ledger"
            onClick={onOpenLedger}
            className="p-4 bg-white rounded-2xl border border-[#DDE6E0] hover:border-[#176B45]/40 hover:shadow-xs text-left transition-all cursor-pointer flex items-center sm:flex-col sm:items-start gap-3.5 group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#EAF6EF] text-[#176B45] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#17231D]">
                {currentLanguage === 'hi' ? 'डिजिटल बहीखाता' : currentLanguage === 'mr' ? 'डिजिटल वहीखाते' : 'Verified Ledger'}
              </div>
              <div className="text-xs text-[#66736C] mt-0.5">
                {currentLanguage === 'hi' ? 'रसीदें व ऑडिट ट्रेल' : 'Immutable Audit Records'}
              </div>
            </div>
          </button>

          {/* Impact */}
          <button
            id="home-tile-impact"
            onClick={onOpenImpact}
            className="p-4 bg-white rounded-2xl border border-[#DDE6E0] hover:border-[#176B45]/40 hover:shadow-xs text-left transition-all cursor-pointer flex items-center sm:flex-col sm:items-start gap-3.5 group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#EAF6EF] text-[#176B45] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#17231D]">
                {currentLanguage === 'hi' ? 'ईपीआर रिपोर्ट' : currentLanguage === 'mr' ? 'पर्यावरण अहवाल' : 'EPR Impact'}
              </div>
              <div className="text-xs text-[#66736C] mt-0.5">
                {currentLanguage === 'hi' ? 'पर्यावरण व कार्बन क्रेडिट' : 'Certificates & Carbon Saved'}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Today's CPCB Fair Price Rate Board - All E-waste & Scrap Streams */}
      <div className="bg-white rounded-2xl border border-[#DDE6E0] p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#DDE6E0] mb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#16834A]" />
            <div>
              <h3 className="text-base font-bold text-[#17231D]">
                {currentLanguage === 'hi'
                  ? 'सरकारी/ईपीआर अधिकृत कबाड़ मंडी भाव (₹/किग्रा)'
                  : currentLanguage === 'mr'
                  ? 'अधिकृत ई-कचरा व कबाडी दर पत्रक (₹/किग्रॅ)'
                  : 'CPCB Authorized Scrap & E-Waste Rate Board (₹/kg)'}
              </h3>
              <p className="text-xs text-[#66736C]">
                {currentLanguage === 'hi'
                  ? 'बिना दलाल, सीधे प्रमाणित रिसाइक्लर भाव'
                  : 'Direct transparent pricing verified by authorized recyclers'}
              </p>
            </div>
          </div>
          <span className="text-xs text-[#176B45] bg-[#EAF6EF] px-3 py-1 rounded-full font-semibold border border-[#176B45]/20 self-start sm:self-auto">
            Live Rates
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {WASTE_CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between p-3 rounded-xl bg-[#F7F9F8] border border-[#DDE6E0] hover:border-[#176B45]/30 transition-colors"
            >
              <div className="flex items-center gap-3 truncate">
                <span 
                  className="w-3 h-3 rounded-full shrink-0" 
                  style={{ backgroundColor: cat.color }} 
                />
                <div className="truncate">
                  <span className="font-semibold text-sm text-[#17231D] block truncate">
                    {currentLanguage === 'hi' ? cat.nameHi : currentLanguage === 'mr' ? cat.nameMr : cat.nameEn}
                  </span>
                  <span className="text-xs text-[#66736C] truncate block mt-0.5">
                    {cat.subtypes.slice(0, 2).join(', ')}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0 pl-3">
                <span className="font-extrabold text-[#176B45] tabular-nums text-base">₹{cat.basePricePerKg}</span>
                <span className="text-[11px] text-[#66736C] block line-through tabular-nums">₹{cat.marketRatePerKg}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
