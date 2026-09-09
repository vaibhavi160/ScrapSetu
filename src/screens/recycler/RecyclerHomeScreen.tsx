import React, { useState } from 'react';
import {
  Inbox,
  Clock,
  CheckCircle2,
  AlertCircle,
  Scale,
  MapPin,
  Calendar,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Building2,
  ChevronRight,
  Phone,
  Sparkles,
} from 'lucide-react';
import { Transaction, Language, UserProfile } from '../../types';
import { playChime } from '../../utils/audioSpeech';
import { PWAInstallButton } from '../../components/PWAInstallButton';

interface RecyclerHomeScreenProps {
  transactions: Transaction[];
  currentUser: UserProfile | null;
  language: Language;
  onSelectRequest: (transaction: Transaction) => void;
  onNavigateToHandover: (transactionId?: string) => void;
  onNavigateToLedger: () => void;
  onNavigateToRates?: () => void;
  onSwitchToCollector: () => void;
}

export const RecyclerHomeScreen: React.FC<RecyclerHomeScreenProps> = ({
  transactions,
  currentUser,
  language,
  onSelectRequest,
  onNavigateToHandover,
  onNavigateToLedger,
  onNavigateToRates,
  onSwitchToCollector,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filter requests
  const filteredRequests = transactions.filter((t) => {
    // Status filter
    if (statusFilter === 'pending') {
      if (t.status !== 'pending_pickup' && t.status !== 'draft') return false;
    } else if (statusFilter === 'accepted') {
      if (t.status !== 'accepted') return false;
    } else if (statusFilter === 'completed') {
      if (t.status !== 'completed' && t.status !== 'paid' && t.status !== 'verified_handover') return false;
    }

    // Category filter
    if (selectedCategory !== 'all') {
      const cat = t.payload?.classification?.confirmedCategory || '';
      if (cat !== selectedCategory) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = t.id.toLowerCase().includes(q);
      const matchCat = (t.payload?.classification?.confirmedCategory || '').toLowerCase().includes(q);
      const matchCollector = (t.ledgerBlock?.collectorName || '').toLowerCase().includes(q);
      const matchLandmark = (t.pickup?.collectorLandmark || '').toLowerCase().includes(q);
      return matchId || matchCat || matchCollector || matchLandmark;
    }

    return true;
  });

  // Calculate high-level operational counts
  const pendingCount = transactions.filter(
    (t) => t.status === 'pending_pickup' || t.status === 'draft'
  ).length;
  const acceptedCount = transactions.filter((t) => t.status === 'accepted').length;
  const completedCount = transactions.filter(
    (t) => t.status === 'completed' || t.status === 'paid' || t.status === 'verified_handover'
  ).length;

  const totalInflowKg = transactions
    .filter((t) => t.status === 'completed' || t.status === 'paid' || t.status === 'verified_handover')
    .reduce((sum, t) => sum + (t.payload?.weightKg || 0), 0);

  const totalPayouts = transactions
    .filter((t) => t.status === 'completed' || t.status === 'paid' || t.status === 'verified_handover')
    .reduce((sum, t) => sum + (t.payload?.totalEstimatedPrice || t.payment?.amount || 0), 0);

  const categories = [
    'all',
    'Copper Wire & Motors',
    'Smartphones & Tablets',
    'Lithium-ion & Batteries',
    'PCBs & Circuit Boards',
    'E-waste',
  ];

  return (
    <div id="recycler-home-screen" className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Welcome & Operations Facility Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#0F1A3C] flex items-center justify-center text-white shrink-0 shadow-xs">
              <Building2 className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-[#0F1A3C] tracking-tight">
                  {currentUser?.name || 'EcoRecycle Green Tech'}
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EEF1F8] text-[#0F1A3C] border border-slate-200">
                  CPCB Verified
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Reg: CPCB/EPR-EW/2024/MH-0142 • Active Operations Portal
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {onNavigateToRates && (
              <button
                type="button"
                id="btn-nav-to-rates"
                onClick={onNavigateToRates}
                className="px-3.5 py-2 rounded-xl bg-[#0F1A3C] hover:bg-[#1A2850] text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <span>{language === 'hi' ? 'दर सूची व श्रेणियां' : 'Rate Card & Categories'}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              </button>
            )}

            <PWAInstallButton />

            <button
              type="button"
              id="switch-to-collector-btn"
              onClick={onSwitchToCollector}
              className="px-3.5 py-2 rounded-xl bg-[#EEF1F8] hover:bg-[#E2E8F4] text-[#0F1A3C] text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>{language === 'hi' ? 'कलेक्टर दृश्य देखें' : 'Switch to Collector'}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* 4 Operations KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          {/* Card 1: Incoming / Pending */}
          <div
            onClick={() => setStatusFilter('pending')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400/20'
                : 'bg-[#F8F9FD] border-slate-200 hover:bg-[#EEF1F8]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500">
                {language === 'hi' ? 'लंबित अनुरोध' : 'Pending Requests'}
              </span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-black text-[#0F1A3C] mt-1.5">{pendingCount}</p>
          </div>

          {/* Card 2: Accepted / Pending Handover */}
          <div
            onClick={() => setStatusFilter('accepted')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'accepted'
                ? 'bg-[#EEF1F8] border-[#0F1A3C] ring-2 ring-[#0F1A3C]/20'
                : 'bg-[#F8F9FD] border-slate-200 hover:bg-[#EEF1F8]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500">
                {language === 'hi' ? 'स्वीकृत / शेड्यूल' : 'Accepted Handovers'}
              </span>
              <CheckCircle2 className="w-4 h-4 text-[#E8433D]" />
            </div>
            <p className="text-2xl font-black text-[#E8433D] mt-1.5">{acceptedCount}</p>
          </div>

          {/* Card 3: Total Diverted Inflow (Kg) */}
          <div
            onClick={onNavigateToLedger}
            className="p-3.5 rounded-2xl bg-[#F8F9FD] border border-slate-200 hover:bg-[#EEF1F8] transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500">
                {language === 'hi' ? 'कुल इनफ्लो (किग्रा)' : 'Total Inflow'}
              </span>
              <Scale className="w-4 h-4 text-[#0F1A3C]" />
            </div>
            <p className="text-2xl font-black text-[#0F1A3C] mt-1.5">
              {totalInflowKg.toFixed(1)} <span className="text-xs font-bold text-slate-500">kg</span>
            </p>
          </div>

          {/* Card 4: Total Payout (₹) */}
          <div
            onClick={onNavigateToLedger}
            className="p-3.5 rounded-2xl bg-[#F8F9FD] border border-slate-200 hover:bg-[#EEF1F8] transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500">
                {language === 'hi' ? 'कुल भुगतान' : 'Paid Out'}
              </span>
              <TrendingUp className="w-4 h-4 text-[#E8433D]" />
            </div>
            <p className="text-2xl font-black text-[#E8433D] mt-1.5">
              ₹{totalPayouts.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Action: Digital Handover Banner in Deep Navy Accent Card with Red CTA */}
      <div className="bg-[#0F1A3C] rounded-3xl p-5 sm:p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg border border-slate-800">
        <div className="space-y-1 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-white text-xs font-bold">
            <Sparkles className="w-3 h-3 text-[#E8433D]" />
            <span>Verified Physical Intake</span>
          </div>
          <h3 className="text-lg font-black tracking-tight text-white">
            {language === 'hi' ? 'कलेक्टर का डिजिटल हैंडओवर सत्यापित करें' : 'Verify Collector Digital Handover'}
          </h3>
          <p className="text-xs text-slate-300 max-w-md leading-relaxed">
            {language === 'hi'
              ? 'लेन-देन आईडी और वजन से हैंडओवर सत्यापित करें तथा तुरंत ईपीआर क्रेडिट जनरेट करें।'
              : 'Match photo, scale weight & GPS check against the collector’s transaction ID to release instant UPI payment.'}
          </p>
        </div>
        <button
          type="button"
          id="home-verify-handover-cta-btn"
          onClick={() => onNavigateToHandover()}
          className="px-5 py-3 rounded-2xl bg-[#E8433D] hover:bg-[#D33832] active:scale-95 text-white font-black text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{language === 'hi' ? 'हैंडओवर खोलें' : 'Open Handover Screen'}</span>
        </button>
      </div>

      {/* Request Management Section */}
      <div className="space-y-4">
        {/* Header with Search & Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-[#0F1A3C] tracking-tight">
              {language === 'hi' ? 'आने वाले पिकअप अनुरोध' : 'Incoming Pickup Requests'}
            </h2>
            <p className="text-xs text-slate-500">
              {language === 'hi'
                ? 'कलेक्टरों से प्राप्त सामग्री और पिकअप अनुरोध'
                : 'Requests submitted by collectors in your vicinity'}
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, collector..."
              className="w-full h-10 pl-9 pr-3 bg-white border border-slate-200 rounded-xl text-xs font-medium placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0F1A3C]"
            />
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 ${
              statusFilter === 'all'
                ? 'bg-[#0F1A3C] text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-[#0F1A3C]'
            }`}
          >
            {language === 'hi' ? 'सभी' : 'All Requests'} ({transactions.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              statusFilter === 'pending'
                ? 'bg-amber-500 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-[#0F1A3C]'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>{language === 'hi' ? 'लंबित समीक्षा' : 'Pending Review'} ({pendingCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('accepted')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              statusFilter === 'accepted'
                ? 'bg-[#E8433D] text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-[#0F1A3C]'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>{language === 'hi' ? 'स्वीकृत / शेड्यूल' : 'Accepted'} ({acceptedCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('completed')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 ${
              statusFilter === 'completed'
                ? 'bg-[#0F1A3C] text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-[#0F1A3C]'
            }`}
          >
            {language === 'hi' ? 'सत्यापित / पूर्ण' : 'Completed'} ({completedCount})
          </button>
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer shrink-0 font-medium ${
                selectedCategory === cat
                  ? 'bg-[#0F1A3C] text-white font-bold'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-[#EEF1F8]'
              }`}
            >
              {cat === 'all' ? (language === 'hi' ? 'सभी श्रेणियां' : 'All Categories') : cat}
            </button>
          ))}
        </div>

        {/* Requests Feed Cards List */}
        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 space-y-3">
            <div className="w-14 h-14 rounded-full bg-[#EEF1F8] text-[#0F1A3C] flex items-center justify-center mx-auto">
              <Inbox className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-[#0F1A3C]">
              {language === 'hi' ? 'कोई अनुरोध नहीं मिला' : 'No Pickup Requests Found'}
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              {language === 'hi'
                ? 'इस फिल्टर के तहत कोई अनुरोध उपलब्ध नहीं है। फिल्टर रीसेट करें।'
                : 'There are no pickup requests matching the selected status or category filters.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all');
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-xl bg-[#EEF1F8] text-[#0F1A3C] font-bold text-xs hover:bg-[#E2E8F4] cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRequests.map((txn) => {
              const payload = txn.payload;
              const isAccepted = txn.status === 'accepted';
              const isCompleted =
                txn.status === 'completed' || txn.status === 'paid' || txn.status === 'verified_handover';
              const isPending = txn.status === 'pending_pickup' || txn.status === 'draft';

              return (
                <div
                  key={txn.id}
                  id={`request-card-${txn.id}`}
                  className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 hover:border-[#0F1A3C] shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Top Row: ID, Time, Status Pill */}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-slate-400">
                        {txn.id}
                      </span>
                      {isPending && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Pending Review</span>
                        </span>
                      )}
                      {isAccepted && (
                        <span className="px-2.5 py-0.5 rounded-full bg-red-50 text-[#E8433D] text-[10px] font-bold border border-red-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-[#E8433D]" />
                          <span>Pickup Scheduled</span>
                        </span>
                      )}
                      {isCompleted && (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#EEF1F8] text-[#0F1A3C] text-[10px] font-bold border border-slate-200 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-[#E8433D]" />
                          <span>EPR Verified</span>
                        </span>
                      )}
                    </div>

                    {/* Middle Item Info: Photo + Details */}
                    <div className="flex items-start gap-3">
                      {/* Photo Thumbnail */}
                      <img
                        src={payload?.photoUrl}
                        alt="Item Thumbnail"
                        className="w-18 h-18 rounded-2xl object-cover border border-slate-200 shrink-0 bg-[#EEF1F8]"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=200&q=80';
                        }}
                      />

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-black text-[#0F1A3C] truncate">
                          {payload?.classification?.confirmedCategory || 'Scrap Material'}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Collector: <strong>{txn.ledgerBlock?.collectorName || 'Ramesh Kabadiwala'}</strong>
                        </p>

                        <div className="flex items-center gap-3 mt-1.5 text-xs">
                          <span className="font-black text-[#0F1A3C]">
                            {payload?.weightKg || 0} kg
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="font-black text-[#E8433D]">
                            ₹{Math.round(payload?.totalEstimatedPrice || txn.payment?.amount || 0).toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            (₹{Math.round(payload?.calculatedPricePerKg || 0)}/kg)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Landmark & Time Window */}
                    <div className="text-[11px] text-slate-600 bg-[#F8F9FD] p-2.5 rounded-xl border border-slate-200 space-y-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-[#E8433D] shrink-0" />
                        <span className="truncate font-medium">
                          {txn.pickup?.collectorLandmark || 'Dharavi West, Mumbai'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-slate-500">
                        <span>Slot: {txn.pickup?.timeSlot || '02:00 PM - 04:00 PM'}</span>
                        <span>Phone: {txn.pickup?.contactNumber || '+91 98200 11982'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Action Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => onSelectRequest(txn)}
                      className="flex-1 h-10 rounded-xl bg-[#EEF1F8] hover:bg-[#E2E8F4] text-[#0F1A3C] text-xs font-bold transition-colors cursor-pointer"
                    >
                      {language === 'hi' ? 'विवरण देखें' : 'Review Details'}
                    </button>

                    {isAccepted ? (
                      <button
                        type="button"
                        onClick={() => onNavigateToHandover(txn.id)}
                        className="flex-1 h-10 rounded-xl bg-[#E8433D] hover:bg-[#D33832] text-white text-xs font-black shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{language === 'hi' ? 'हैंडओवर' : 'Verify Handover'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onSelectRequest(txn)}
                        className="flex-1 h-10 rounded-xl bg-[#E8433D] hover:bg-[#D33832] text-white text-xs font-black shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span>{language === 'hi' ? 'स्वीकार / काउंटर' : 'Accept / Counter'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
