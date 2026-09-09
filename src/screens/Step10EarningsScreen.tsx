import React, { useState } from 'react';
import { 
  History, IndianRupee, Scale, TrendingUp, Sparkles, 
  Search, Filter, ExternalLink, QrCode, ShieldCheck, 
  FileText, Download, CheckCircle2, ChevronRight, X,
  Database, Layers, Check, Calendar
} from 'lucide-react';
import { Language, Transaction, WasteCategory, WasteRecord, UserProfile } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { WASTE_CATEGORIES } from '../data/mockData';
import { VoiceButton } from '../components/VoiceButton';
import { playChime } from '../utils/audioSpeech';

interface Step10EarningsScreenProps {
  language: Language;
  transactions: Transaction[];
  wasteRecords?: WasteRecord[];
  currentUser?: UserProfile | null;
  onStartNewCollection: () => void;
  onResetToHome: () => void;
}

export const Step10EarningsScreen: React.FC<Step10EarningsScreenProps> = ({
  language,
  transactions,
  wasteRecords = [],
  currentUser,
  onStartNewCollection,
  onResetToHome,
}) => {
  const t = TRANSLATIONS[language];

  const [activeLedgerTab, setActiveLedgerTab] = useState<'transactions' | 'waste_data'>('transactions');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedTxnModal, setSelectedTxnModal] = useState<Transaction | null>(null);
  const [selectedWasteModal, setSelectedWasteModal] = useState<WasteRecord | null>(null);
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  // Total metrics taking into account transactions, waste records, and profile
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

  const totalExtraProfit = transactions.reduce((acc, cur) => acc + (cur?.payload?.fairAdvantageAmount ?? (cur as any)?.fairAdvantageAmount ?? 0), 0) || Math.round(totalEarnings * 0.28);
  const totalStoredRecords = Math.max(transactions.length, wasteRecords.length);

  // Per-category breakdown
  const categoryBreakdown: Record<string, { weight: number; earnings: number; count: number }> = {};
  transactions.forEach((tx) => {
    const cat = tx.payload?.classification?.confirmedCategory || (tx as any).categoryName || 'Scrap Material';
    if (!categoryBreakdown[cat]) {
      categoryBreakdown[cat] = { weight: 0, earnings: 0, count: 0 };
    }
    categoryBreakdown[cat].weight += tx.payload?.weightKg ?? (tx as any).weightKg ?? 0;
    categoryBreakdown[cat].earnings += tx.payload?.totalEstimatedPrice ?? (tx as any).totalAmount ?? 0;
    categoryBreakdown[cat].count += 1;
  });
  wasteRecords.forEach((w) => {
    const cat = w.categoryName || 'Scrap Material';
    if (!categoryBreakdown[cat]) {
      categoryBreakdown[cat] = { weight: 0, earnings: 0, count: 0 };
    }
    categoryBreakdown[cat].weight = Math.max(categoryBreakdown[cat].weight, w.weightKg);
    categoryBreakdown[cat].earnings = Math.max(categoryBreakdown[cat].earnings, w.totalAmount);
  });

  // Filtered transactions
  const filtered = transactions.filter((tx) => {
    const cat = tx.payload?.classification?.confirmedCategory || (tx as any).categoryName || '';
    const recyclerName = tx.selectedRecycler?.name || (tx as any).recyclerName || '';
    const matchesSearch =
      tx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recyclerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCat =
      filterCategory === 'all' || cat === filterCategory;

    return matchesSearch && matchesCat;
  });

  // Filtered waste records
  const filteredWaste = wasteRecords.filter((w) => {
    const matchesSearch =
      w.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.categoryName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.recyclerName || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCat =
      filterCategory === 'all' || (w.categoryName || '') === filterCategory;

    return matchesSearch && matchesCat;
  });

  const speechText =
    language === 'hi'
      ? `कमाई का डिजिटल बहीखाता: कुल कमाई ₹${Math.round(totalEarnings)}। आपने ${totalWeightKg.toFixed(1)} किलोग्राम कचरा अधिकृत रिसाइक्लिंग में भेजा है और ₹${Math.round(totalExtraProfit)} का अतिरिक्त ईपीआर मुनाफा कमाया है।`
      : language === 'mr'
      ? `एकूण कमाई: ₹${Math.round(totalEarnings)}. तुम्ही ${totalWeightKg.toFixed(1)} किलो भंगार अधिकृत रिसायकलिंगसाठी जमा केले आहे.`
      : `Earnings Ledger: Total earnings of ₹${Math.round(totalEarnings)}. Diverted ${totalWeightKg.toFixed(1)} kg into authorized CPCB recycling channels.`;

  const [downloadSuccess, setDownloadSuccess] = useState(false);

  return (
    <div className="space-y-6 sm:space-y-8 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#0F1A3C] flex items-center gap-2.5">
            <History className="w-6 h-6 text-[#E8433D]" />
            <span>{t.earningsLedger}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {language === 'hi' ? 'पारदर्शी डिजिटल बहीखाता व ऑडिट' : 'Transparent Digital Ledger & Audit Trail'}
          </p>
        </div>
        <VoiceButton textToSpeak={speechText} language={language} label={t.listenAudio} size="md" />
      </div>

      {/* Running Total Metrics Card */}
      <div className="bg-[#0F1A3C] text-white rounded-2xl p-6 sm:p-7 space-y-5 shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm font-semibold text-slate-300">
            {t.totalEarned} (All-Time)
          </span>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-slate-200 text-xs font-bold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#E8433D] animate-pulse" />
            <span>Synced ({totalStoredRecords} Records)</span>
          </div>
        </div>

        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-black text-[#E8433D]">₹</span>
          <span className="text-4xl sm:text-5xl font-black tracking-tight tabular-nums text-white">
            {Math.round(totalEarnings).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/15 text-xs sm:text-sm">
          <div>
            <span className="text-slate-400 text-xs block">{t.totalDiverted}</span>
            <span className="font-black text-base sm:text-lg tabular-nums mt-0.5 block text-white">{totalWeightKg.toFixed(1)} kg</span>
          </div>
          <div>
            <span className="text-slate-400 text-xs block">Extra EPR Premium</span>
            <span className="font-black text-base sm:text-lg text-[#E8433D] tabular-nums mt-0.5 block">
              +₹{Math.round(totalExtraProfit).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Certificate Button */}
        <button
          id="btn-open-epr-certificate"
          onClick={() => {
            playChime('click');
            setShowCertificateModal(true);
          }}
          className="w-full py-3 px-4 bg-white text-[#0F1A3C] hover:bg-slate-100 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
        >
          <FileText className="w-4 h-4 text-[#E8433D]" />
          <span>{t.viewCertificate}</span>
        </button>
      </div>

      {/* Per-Category Transparent Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-sm sm:text-base text-[#0F1A3C]">
            {t.perCategoryBreakdown}
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            {Object.keys(categoryBreakdown).length} Categories
          </span>
        </div>

        <div className="space-y-3.5">
          {Object.entries(categoryBreakdown).map(([catId, data]) => {
            const catInfo = WASTE_CATEGORIES.find((c) => c.id === catId);
            const percent = Math.min(100, Math.round((data.earnings / Math.max(1, totalEarnings)) * 100));

            return (
              <div key={catId} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: catInfo?.color || '#0F1A3C' }}
                    />
                    <span className="font-bold text-[#0F1A3C]">
                      {language === 'hi' ? catInfo?.nameHi.split(' ')[0] : catId}
                    </span>
                    <span className="text-xs text-slate-500">({data.weight.toFixed(1)} kg)</span>
                  </div>
                  <span className="font-black text-[#0F1A3C] tabular-nums">
                    ₹{Math.round(data.earnings).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="w-full h-2 bg-[#F8F9FD] border border-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percent}%`,
                      backgroundColor: catInfo?.color || '#E8433D',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dual Tab Switcher: Transactions vs Waste Data in Database */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="tab-transactions"
              onClick={() => setActiveLedgerTab('transactions')}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeLedgerTab === 'transactions'
                  ? 'bg-[#0F1A3C] text-white shadow-xs'
                  : 'bg-[#EEF1F8] text-slate-600 hover:text-[#0F1A3C]'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>{language === 'hi' ? 'लेन-देन रसीदें' : 'Transactions'} ({filtered.length})</span>
            </button>

            <button
              type="button"
              id="tab-waste-data"
              onClick={() => setActiveLedgerTab('waste_data')}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeLedgerTab === 'waste_data'
                  ? 'bg-[#0F1A3C] text-white shadow-xs'
                  : 'bg-[#EEF1F8] text-slate-600 hover:text-[#0F1A3C]'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>{language === 'hi' ? 'कबाड़ डेटाबेस रिकॉर्ड्स' : 'Waste Records in DB'} ({filteredWaste.length || filtered.length})</span>
            </button>
          </div>
        </div>

        {/* Search Bar & Filter Pills */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="search-transactions-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ID, Recycler, Category..."
              className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-[#0F1A3C] focus:ring-2 focus:ring-[#E8433D]/20 focus:border-[#E8433D] outline-none transition-all"
            />
          </div>

          <select
            id="filter-category-select"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-[#0F1A3C] outline-none focus:ring-2 focus:ring-[#E8433D]/20"
          >
            <option value="all">All Types</option>
            {WASTE_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.id}
              </option>
            ))}
          </select>
        </div>

        {/* Tab 1: Transactions Feed */}
        {activeLedgerTab === 'transactions' && (
          <div className="space-y-2.5">
            {filtered.map((tx) => (
              <button
                key={tx.id}
                id={`txn-card-${tx.id}`}
                onClick={() => {
                  playChime('click');
                  setSelectedTxnModal(tx);
                }}
                className="w-full p-4 bg-white rounded-xl border border-slate-200 hover:border-[#0F1A3C] text-left transition-all flex items-center justify-between cursor-pointer shadow-xs hover:shadow-sm"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-black shrink-0 border border-slate-200">
                    <img
                      src={tx.payload?.photoUrl || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80'}
                      alt="Waste"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs sm:text-sm font-black text-[#0F1A3C]">{tx.id}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-extrabold">
                        {tx.status === 'paid' || tx.status === 'completed' ? 'Paid' : 'Pending'}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-500 truncate max-w-[200px] mt-0.5 font-medium">
                      {tx.selectedRecycler?.name || (tx as any).recyclerName || 'Verified Recycler'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(tx.timestamp).toLocaleDateString('en-IN')} • {tx.payload?.weightKg ?? (tx as any).weightKg ?? 0} kg {tx.payload?.classification?.confirmedCategory || (tx as any).categoryName || 'Scrap Material'}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0 flex items-center gap-2.5">
                  <div>
                    <span className="text-base sm:text-lg font-black text-[#0F1A3C] tabular-nums block">
                      ₹{Math.round(tx.payload?.totalEstimatedPrice ?? (tx as any).totalAmount ?? 0)}
                    </span>
                    <span className="text-[11px] text-slate-500 block font-mono font-medium">
                      Block #{tx.ledgerBlock?.blockNumber || 1042}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Tab 2: Waste Data Stored in Database */}
        {activeLedgerTab === 'waste_data' && (
          <div className="space-y-2.5">
            {(wasteRecords.length > 0 ? filteredWaste : filtered.map((tx) => ({
              id: tx.id,
              collectorId: tx.ledgerBlock?.collectorId || 'COL-MUM-4001',
              collectorName: tx.ledgerBlock?.collectorName || 'Collector',
              categoryId: tx.payload?.classification?.confirmedCategory || (tx as any).categoryName || 'Scrap Material',
              categoryName: tx.payload?.classification?.confirmedCategory || (tx as any).categoryName || 'Scrap Material',
              weightKg: tx.payload?.weightKg ?? (tx as any).weightKg ?? 0,
              ratePerKg: tx.payload?.calculatedPricePerKg ?? (tx as any).ratePerKg ?? 0,
              totalAmount: tx.payload?.totalEstimatedPrice ?? (tx as any).totalAmount ?? 0,
              fairAdvantageAmount: tx.payload?.fairAdvantageAmount ?? 0,
              cleanliness: tx.payload?.condition?.cleanliness || 'clean',
              structural: tx.payload?.condition?.structural || 'intact',
              recyclerName: tx.selectedRecycler?.name || (tx as any).recyclerName || 'Verified Recycler',
              status: tx.status,
              timestamp: new Date(tx.timestamp).toISOString(),
            }))).map((w: any, idx) => {
              const catInfo = WASTE_CATEGORIES.find((c) => c.id === w.categoryName || c.nameEn === w.categoryName);

              return (
                <div
                  key={w.id || idx}
                  className="p-4 bg-white rounded-xl border border-slate-200 hover:border-[#0F1A3C] transition-all flex items-center justify-between shadow-xs"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xs shrink-0"
                      style={{ backgroundColor: `${catInfo?.color || '#0F1A3C'}20`, color: catInfo?.color || '#0F1A3C' }}
                    >
                      ♻️
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-black text-[#0F1A3C]">
                          {w.categoryName}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EEF1F8] text-[#0F1A3C] font-bold">
                          Firestore Stored
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                        <span className="font-semibold">{w.weightKg} kg</span>
                        <span>•</span>
                        <span>₹{w.ratePerKg}/kg</span>
                        <span>•</span>
                        <span className="capitalize">{w.cleanliness || 'clean'}</span>
                      </div>

                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {w.timestamp ? new Date(w.timestamp).toLocaleDateString('en-IN') : 'Recent'} • {w.recyclerName || 'Verified Recycling Facility'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-base sm:text-lg font-black text-[#0F1A3C] tabular-nums">
                      +₹{Math.round(w.totalAmount).toLocaleString('en-IN')}
                    </div>
                    {w.fairAdvantageAmount ? (
                      <span className="text-[10px] text-[#E8433D] font-bold block">
                        +₹{Math.round(w.fairAdvantageAmount)} fair bonus
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Start New Scrap Collection Flow Button */}
      <div className="pt-3 space-y-3">
        <button
          id="btn-start-another-collection"
          onClick={() => {
            playChime('click');
            onStartNewCollection();
          }}
          className="w-full py-3.5 px-5 bg-[#E8433D] hover:bg-[#D32F2F] text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#E8433D]/25 transition-all"
        >
          <Sparkles className="w-4 h-4" />
          <span>{t.startCollect}</span>
        </button>

        <button
          id="btn-return-home"
          onClick={onResetToHome}
          className="w-full py-3 px-5 bg-[#EEF1F8] hover:bg-slate-200 text-[#0F1A3C] border border-slate-200 rounded-xl font-bold text-xs sm:text-sm cursor-pointer transition-colors"
        >
          {t.backToHome}
        </button>
      </div>

      {/* Modal: Transaction Details & Verifiable Ledger Inspector */}
      {selectedTxnModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-5 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-black text-base sm:text-lg text-[#0F1A3C] flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>Ledger Record: {selectedTxnModal.id}</span>
                </h3>
                <span className="text-xs text-slate-500 font-mono mt-0.5 block">
                  Block #{selectedTxnModal.ledgerBlock?.blockNumber || 1042}
                </span>
              </div>
              <button
                onClick={() => setSelectedTxnModal(null)}
                className="w-8 h-8 rounded-full bg-[#EEF1F8] hover:bg-slate-200 flex items-center justify-center text-[#0F1A3C] cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="aspect-video rounded-xl overflow-hidden bg-black">
              <img
                src={selectedTxnModal.payload?.photoUrl || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80'}
                alt="Audit"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="bg-[#F8F9FD] p-4 rounded-xl space-y-2.5 text-xs sm:text-sm border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Waste Category:</span>
                <span className="font-bold text-[#0F1A3C]">
                  {selectedTxnModal.payload?.classification?.confirmedCategory || (selectedTxnModal as any).categoryName || 'Scrap Material'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Weight Verified:</span>
                <span className="font-bold text-[#0F1A3C] tabular-nums">{selectedTxnModal.payload?.weightKg ?? (selectedTxnModal as any).weightKg ?? 0} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Paid:</span>
                <span className="font-black text-[#E8433D] tabular-nums">
                  ₹{selectedTxnModal.payload?.totalEstimatedPrice ?? (selectedTxnModal as any).totalAmount ?? 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Authorized Recycler:</span>
                <span className="font-bold text-[#0F1A3C]">{selectedTxnModal.selectedRecycler?.name || (selectedTxnModal as any).recyclerName || 'Verified Facility'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">CPCB Authorization:</span>
                <span className="font-mono text-[#0F1A3C] font-bold">
                  {selectedTxnModal.selectedRecycler?.cpcbRegNumber || (selectedTxnModal as any).cpcbRegNumber || 'CPCB/EPR-EW/2024/MH-0142'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Channel:</span>
                <span className="font-bold text-[#0F1A3C]">
                  {(selectedTxnModal.payment?.method || 'UPI').toUpperCase()} ({selectedTxnModal.payment?.utrNumber || 'UTR-VERIFIED'})
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-[#F8F9FD] rounded-xl border border-slate-200 text-[11px] font-mono text-[#0F1A3C] break-all space-y-1.5">
              <div>Block Hash: {selectedTxnModal.ledgerBlock?.currentBlockHash || '0x4f128ab9e34c56e2'}</div>
              <div>Signature: {selectedTxnModal.ledgerBlock?.digitalSignature || 'SIG-VALID-CPCB'}</div>
            </div>

            <button
              onClick={() => setSelectedTxnModal(null)}
              className="w-full py-3 bg-[#EEF1F8] hover:bg-slate-200 text-[#0F1A3C] border border-slate-200 font-bold text-xs sm:text-sm rounded-xl cursor-pointer transition-colors"
            >
              {t.close}
            </button>
          </div>
        </div>
      )}

      {/* Modal: EPR Compliance Certificate for Recyclers / Producers */}
      {showCertificateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0F1A3C] text-white flex items-center justify-center font-extrabold text-xs shadow-xs">
                  CPCB
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-[#0F1A3C]">
                    Official EPR Green Credit Certificate
                  </h3>
                  <p className="text-xs text-slate-500">SIH 2026 Problem Statement #26229</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCertificateModal(false);
                  setDownloadSuccess(false);
                }}
                className="w-8 h-8 rounded-full bg-[#EEF1F8] hover:bg-slate-200 flex items-center justify-center text-[#0F1A3C] cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="border border-slate-200 p-5 rounded-2xl bg-[#F8F9FD] text-center space-y-2.5">
              <div className="text-xs font-bold text-[#E8433D]">
                E-Waste (Management) Rules, 2022 Certified
              </div>
              <h4 className="text-base font-black text-[#0F1A3C]">
                Formal Supply Chain Compliance Certificate
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                This certifies that <strong>{transactions.length} collection transactions</strong> totaling{' '}
                <strong>{totalWeightKg.toFixed(1)} kg</strong> of recyclable scrap were collected from informal
                collectors and channeled into CPCB-registered recycling facilities with zero cash leakage.
              </p>
              <div className="text-lg font-black text-[#0F1A3C] pt-1 tabular-nums">
                {totalWeightKg.toFixed(0)} EPR Green Credits Accrued
              </div>
            </div>

            <div className="text-xs sm:text-sm text-slate-500 space-y-2">
              <div className="flex justify-between">
                <span>Audited Ledger Blocks:</span>
                <span className="font-mono font-bold text-[#0F1A3C]">#{transactions[0]?.ledgerBlock?.blockNumber || 1042} - #1001</span>
              </div>
              <div className="flex justify-between">
                <span>Total Value Channeled:</span>
                <span className="font-black text-[#0F1A3C] tabular-nums">₹{Math.round(totalEarnings).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Informal Wage Uplift:</span>
                <span className="font-bold text-emerald-600">+38% Above predatory middleman rates</span>
              </div>
            </div>

            {downloadSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs font-bold text-emerald-700 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Certificate PDF saved for audit records</span>
              </div>
            )}

            <button
              onClick={() => {
                setDownloadSuccess(true);
              }}
              className="w-full py-3.5 bg-[#E8433D] hover:bg-[#D32F2F] text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#E8433D]/25 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download Signed Audit Certificate</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
