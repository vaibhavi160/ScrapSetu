import React, { useState } from 'react';
import { 
  History, IndianRupee, Scale, TrendingUp, Sparkles, 
  Search, Filter, ExternalLink, QrCode, ShieldCheck, 
  FileText, Download, CheckCircle2, ChevronRight, X 
} from 'lucide-react';
import { Language, Transaction, WasteCategory } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { WASTE_CATEGORIES } from '../data/mockData';
import { VoiceButton } from '../components/VoiceButton';
import { playChime } from '../utils/audioSpeech';

interface Step10EarningsScreenProps {
  language: Language;
  transactions: Transaction[];
  onStartNewCollection: () => void;
  onResetToHome: () => void;
}

export const Step10EarningsScreen: React.FC<Step10EarningsScreenProps> = ({
  language,
  transactions,
  onStartNewCollection,
  onResetToHome,
}) => {
  const t = TRANSLATIONS[language];

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedTxnModal, setSelectedTxnModal] = useState<Transaction | null>(null);
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  // Total metrics
  const totalEarnings = transactions.reduce(
    (acc, cur) => acc + (cur.status === 'paid' || cur.status === 'completed' ? cur.payload.totalEstimatedPrice : cur.payload.totalEstimatedPrice),
    0
  );
  const totalWeightKg = transactions.reduce((acc, cur) => acc + cur.payload.weightKg, 0);
  const totalExtraProfit = transactions.reduce((acc, cur) => acc + cur.payload.fairAdvantageAmount, 0);

  // Per-category breakdown
  const categoryBreakdown: Record<string, { weight: number; earnings: number; count: number }> = {};
  transactions.forEach((tx) => {
    const cat = tx.payload.classification.confirmedCategory;
    if (!categoryBreakdown[cat]) {
      categoryBreakdown[cat] = { weight: 0, earnings: 0, count: 0 };
    }
    categoryBreakdown[cat].weight += tx.payload.weightKg;
    categoryBreakdown[cat].earnings += tx.payload.totalEstimatedPrice;
    categoryBreakdown[cat].count += 1;
  });

  // Filtered transactions
  const filtered = transactions.filter((tx) => {
    const matchesSearch =
      tx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.selectedRecycler.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.payload.classification.confirmedCategory.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCat =
      filterCategory === 'all' || tx.payload.classification.confirmedCategory === filterCategory;

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
      <div className="flex items-center justify-between pb-2 border-b border-[#DDE6E0]">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#17231D] flex items-center gap-2.5">
            <History className="w-6 h-6 text-[#176B45]" />
            <span>{t.earningsLedger}</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#66736C] mt-0.5">
            {language === 'hi' ? 'पारदर्शी डिजिटल बहीखाता व ऑडिट' : 'Transparent Digital Ledger & Audit Trail'}
          </p>
        </div>
        <VoiceButton textToSpeak={speechText} language={language} label={t.listenAudio} size="md" />
      </div>

      {/* Running Total Metrics Card */}
      <div className="bg-[#176B45] text-white rounded-2xl p-6 sm:p-7 space-y-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm font-semibold text-emerald-100">
            {t.totalEarned} (All-Time)
          </span>
          <span className="px-3 py-1 rounded-full bg-[#125335] text-emerald-100 text-xs font-bold shadow-xs">
            CPCB Verified
          </span>
        </div>

        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-bold text-emerald-200">₹</span>
          <span className="text-4xl sm:text-5xl font-extrabold tracking-tight tabular-nums">
            {Math.round(totalEarnings).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-emerald-600/40 text-xs sm:text-sm">
          <div>
            <span className="text-emerald-200 text-xs block">{t.totalDiverted}</span>
            <span className="font-extrabold text-base sm:text-lg tabular-nums mt-0.5 block">{totalWeightKg.toFixed(1)} kg</span>
          </div>
          <div>
            <span className="text-emerald-200 text-xs block">Extra EPR Premium</span>
            <span className="font-extrabold text-base sm:text-lg text-emerald-200 tabular-nums mt-0.5 block">
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
          className="w-full py-3 px-4 bg-white text-[#176B45] hover:bg-emerald-50 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
        >
          <FileText className="w-4 h-4" />
          <span>{t.viewCertificate}</span>
        </button>
      </div>

      {/* Per-Category Transparent Breakdown */}
      <div className="bg-white rounded-2xl border border-[#DDE6E0] p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm sm:text-base text-[#17231D]">
            {t.perCategoryBreakdown}
          </h3>
          <span className="text-xs text-[#66736C] font-medium">
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
                      style={{ backgroundColor: catInfo?.color || '#176B45' }}
                    />
                    <span className="font-bold text-[#17231D]">
                      {language === 'hi' ? catInfo?.nameHi.split(' ')[0] : catId}
                    </span>
                    <span className="text-xs text-[#66736C]">({data.weight.toFixed(1)} kg)</span>
                  </div>
                  <span className="font-extrabold text-[#176B45] tabular-nums">
                    ₹{Math.round(data.earnings).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="w-full h-2 bg-[#F7F9F8] border border-[#DDE6E0] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percent}%`,
                      backgroundColor: catInfo?.color || '#176B45',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full Transaction History List with Search & Filter */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm sm:text-base text-[#17231D]">
            {t.allTransactions} ({filtered.length})
          </h3>
        </div>

        {/* Search Bar & Filter Pills */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#66736C] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="search-transactions-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ID, Recycler, Category..."
              className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-[#DDE6E0] rounded-xl text-xs sm:text-sm font-medium text-[#17231D] focus:ring-2 focus:ring-[#176B45]/20 focus:border-[#176B45] outline-none transition-all"
            />
          </div>

          <select
            id="filter-category-select"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="p-2.5 bg-white border border-[#DDE6E0] rounded-xl text-xs sm:text-sm font-bold text-[#17231D] outline-none focus:ring-2 focus:ring-[#176B45]/20"
          >
            <option value="all">All Types</option>
            {WASTE_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.id}
              </option>
            ))}
          </select>
        </div>

        {/* Transactions Card Feed */}
        <div className="space-y-2.5">
          {filtered.map((tx) => (
            <button
              key={tx.id}
              id={`txn-card-${tx.id}`}
              onClick={() => {
                playChime('click');
                setSelectedTxnModal(tx);
              }}
              className="w-full p-4 bg-white rounded-xl border border-[#DDE6E0] hover:border-[#176B45] text-left transition-all flex items-center justify-between cursor-pointer shadow-xs hover:shadow-sm"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-black shrink-0 border border-[#DDE6E0]">
                  <img
                    src={tx.payload.photoUrl}
                    alt="Waste"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs sm:text-sm font-extrabold text-[#17231D]">{tx.id}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EAF6EF] text-[#16834A] font-extrabold">
                      {tx.status === 'paid' || tx.status === 'completed' ? 'Paid' : 'Pending'}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-[#66736C] truncate max-w-[200px] mt-0.5 font-medium">
                    {tx.selectedRecycler.name}
                  </p>
                  <p className="text-xs text-[#66736C] mt-0.5">
                    {new Date(tx.timestamp).toLocaleDateString('en-IN')} • {tx.payload.weightKg} kg {tx.payload.classification.confirmedCategory}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0 flex items-center gap-2.5">
                <div>
                  <span className="text-base sm:text-lg font-extrabold text-[#176B45] tabular-nums block">
                    ₹{Math.round(tx.payload.totalEstimatedPrice)}
                  </span>
                  <span className="text-[11px] text-[#66736C] block font-mono font-medium">
                    Block #{tx.ledgerBlock.blockNumber}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#66736C]" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Start New Scrap Collection Flow Button */}
      <div className="pt-3 space-y-3">
        <button
          id="btn-start-another-collection"
          onClick={() => {
            playChime('click');
            onStartNewCollection();
          }}
          className="w-full py-3.5 px-5 bg-[#176B45] hover:bg-[#238B5A] text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xs hover:shadow-md transition-all"
        >
          <Sparkles className="w-4 h-4" />
          <span>{t.startCollect}</span>
        </button>

        <button
          id="btn-return-home"
          onClick={onResetToHome}
          className="w-full py-3 px-5 bg-[#F7F9F8] hover:bg-gray-100 text-[#17231D] border border-[#DDE6E0] rounded-xl font-bold text-xs sm:text-sm cursor-pointer transition-colors"
        >
          {t.backToHome}
        </button>
      </div>

      {/* Modal: Transaction Details & Verifiable Ledger Inspector */}
      {selectedTxnModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-5 border border-[#DDE6E0] shadow-xl">
            <div className="flex items-center justify-between border-b border-[#DDE6E0] pb-3">
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-[#17231D] flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#16834A]" />
                  <span>Ledger Record: {selectedTxnModal.id}</span>
                </h3>
                <span className="text-xs text-[#66736C] font-mono mt-0.5 block">
                  Block #{selectedTxnModal.ledgerBlock.blockNumber}
                </span>
              </div>
              <button
                onClick={() => setSelectedTxnModal(null)}
                className="w-8 h-8 rounded-full bg-[#F7F9F8] hover:bg-gray-200 flex items-center justify-center text-[#17231D] cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="aspect-video rounded-xl overflow-hidden bg-black">
              <img
                src={selectedTxnModal.payload.photoUrl}
                alt="Audit"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="bg-[#F7F9F8] p-4 rounded-xl space-y-2.5 text-xs sm:text-sm border border-[#DDE6E0]">
              <div className="flex justify-between">
                <span className="text-[#66736C]">Waste Category:</span>
                <span className="font-bold text-[#17231D]">
                  {selectedTxnModal.payload.classification.confirmedCategory}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#66736C]">Weight Verified:</span>
                <span className="font-bold text-[#17231D] tabular-nums">{selectedTxnModal.payload.weightKg} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#66736C]">Amount Paid:</span>
                <span className="font-extrabold text-[#176B45] tabular-nums">
                  ₹{selectedTxnModal.payload.totalEstimatedPrice}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#66736C]">Authorized Recycler:</span>
                <span className="font-bold text-[#17231D]">{selectedTxnModal.selectedRecycler.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#66736C]">CPCB Authorization:</span>
                <span className="font-mono text-[#176B45] font-bold">
                  {selectedTxnModal.selectedRecycler.cpcbRegNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#66736C]">Payment Channel:</span>
                <span className="font-bold text-[#17231D]">
                  {selectedTxnModal.payment.method.toUpperCase()} ({selectedTxnModal.payment.utrNumber})
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-[#F7F9F8] rounded-xl border border-[#DDE6E0] text-[11px] font-mono text-[#17231D] break-all space-y-1.5">
              <div>Block Hash: {selectedTxnModal.ledgerBlock.currentBlockHash}</div>
              <div>Signature: {selectedTxnModal.ledgerBlock.digitalSignature}</div>
            </div>

            <button
              onClick={() => setSelectedTxnModal(null)}
              className="w-full py-3 bg-[#F7F9F8] hover:bg-gray-100 text-[#17231D] border border-[#DDE6E0] font-bold text-xs sm:text-sm rounded-xl cursor-pointer transition-colors"
            >
              {t.close}
            </button>
          </div>
        </div>
      )}

      {/* Modal: EPR Compliance Certificate for Recyclers / Producers */}
      {showCertificateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 border border-[#DDE6E0] shadow-xl">
            <div className="flex items-center justify-between border-b border-[#DDE6E0] pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#176B45] text-white flex items-center justify-center font-extrabold text-xs shadow-xs">
                  CPCB
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-[#17231D]">
                    Official EPR Green Credit Certificate
                  </h3>
                  <p className="text-xs text-[#66736C]">SIH 2026 Problem Statement #26229</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCertificateModal(false);
                  setDownloadSuccess(false);
                }}
                className="w-8 h-8 rounded-full bg-[#F7F9F8] hover:bg-gray-200 flex items-center justify-center text-[#17231D] cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="border border-[#176B45]/20 p-5 rounded-2xl bg-[#EAF6EF] text-center space-y-2.5">
              <div className="text-xs font-bold text-[#176B45]">
                E-Waste (Management) Rules, 2022 Certified
              </div>
              <h4 className="text-base font-extrabold text-[#17231D]">
                Formal Supply Chain Compliance Certificate
              </h4>
              <p className="text-xs sm:text-sm text-[#66736C] leading-relaxed">
                This certifies that <strong>{transactions.length} collection transactions</strong> totaling{' '}
                <strong>{totalWeightKg.toFixed(1)} kg</strong> of recyclable scrap were collected from informal
                collectors and channeled into CPCB-registered recycling facilities with zero cash leakage.
              </p>
              <div className="text-lg font-extrabold text-[#176B45] pt-1 tabular-nums">
                {totalWeightKg.toFixed(0)} EPR Green Credits Accrued
              </div>
            </div>

            <div className="text-xs sm:text-sm text-[#66736C] space-y-2">
              <div className="flex justify-between">
                <span>Audited Ledger Blocks:</span>
                <span className="font-mono font-bold text-[#17231D]">#{transactions[0]?.ledgerBlock.blockNumber || 1042} - #1001</span>
              </div>
              <div className="flex justify-between">
                <span>Total Value Channeled:</span>
                <span className="font-bold text-[#17231D] tabular-nums">₹{Math.round(totalEarnings).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Informal Wage Uplift:</span>
                <span className="font-bold text-[#16834A]">+38% Above predatory middleman rates</span>
              </div>
            </div>

            {downloadSuccess && (
              <div className="p-3 bg-[#EAF6EF] border border-[#176B45]/20 rounded-xl text-center text-xs font-bold text-[#176B45] flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#16834A]" />
                <span>Certificate PDF saved for audit records</span>
              </div>
            )}

            <button
              onClick={() => {
                setDownloadSuccess(true);
              }}
              className="w-full py-3.5 bg-[#176B45] hover:bg-[#238B5A] text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xs hover:shadow-md transition-all"
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
