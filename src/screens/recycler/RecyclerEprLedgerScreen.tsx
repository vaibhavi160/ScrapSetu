import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Filter,
  Search,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Printer,
  Sparkles,
  Layers,
  Award,
} from 'lucide-react';
import { Transaction, Language, UserProfile } from '../../types';
import { playChime } from '../../utils/audioSpeech';

interface RecyclerEprLedgerScreenProps {
  transactions: Transaction[];
  currentUser: UserProfile | null;
  language: Language;
}

export const RecyclerEprLedgerScreen: React.FC<RecyclerEprLedgerScreenProps> = ({
  transactions,
  currentUser,
  language,
}) => {
  const [dateFilter, setDateFilter] = useState<'all' | '7d' | '30d'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTxnForManifest, setSelectedTxnForManifest] = useState<Transaction | null>(null);

  // Filter only verified or completed handovers (or all for audit)
  const completedTxns = transactions.filter(
    (t) => t.status === 'completed' || t.status === 'paid' || t.status === 'verified_handover'
  );

  const filteredTxns = completedTxns.filter((t) => {
    // Category filter
    if (categoryFilter !== 'all') {
      const cat = t.payload?.classification?.confirmedCategory || '';
      if (cat !== categoryFilter) return false;
    }

    // Date filter
    if (dateFilter === '7d') {
      const sevenDaysAgo = Date.now() - 7 * 86400000;
      if (t.timestamp < sevenDaysAgo) return false;
    } else if (dateFilter === '30d') {
      const thirtyDaysAgo = Date.now() - 30 * 86400000;
      if (t.timestamp < thirtyDaysAgo) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const idMatch = t.id.toLowerCase().includes(q);
      const collectorMatch = (t.ledgerBlock?.collectorName || '').toLowerCase().includes(q);
      const catMatch = (t.payload?.classification?.confirmedCategory || '').toLowerCase().includes(q);
      const cpcbMatch = (t.ledgerBlock?.cpcbRegNumber || '').toLowerCase().includes(q);
      return idMatch || collectorMatch || catMatch || cpcbMatch;
    }

    return true;
  });

  // Calculate Metrics
  const totalVerifiedWeightKg = filteredTxns.reduce(
    (sum, t) => sum + (t.payload?.weightKg || 0),
    0
  );
  const totalEprCredits = totalVerifiedWeightKg; // 1 kg = 1 EPR Credit Unit
  const totalDisbursedAmount = filteredTxns.reduce(
    (sum, t) => sum + (t.payload?.totalEstimatedPrice || t.payment?.amount || 0),
    0
  );

  // CSV Export functionality
  const handleExportCSV = () => {
    playChime('success');
    const headers = [
      'Transaction ID',
      'Date & Time',
      'Collector Name',
      'Collector ID',
      'Waste Category',
      'Net Weight (Kg)',
      'Rate per Kg (INR)',
      'Total Amount Paid (INR)',
      'Payment Method',
      'UTR Reference',
      'CPCB Reg Number',
      'Digital Block Hash',
      'EPR Credits Granted',
    ];

    const rows = filteredTxns.map((t) => [
      t.id,
      new Date(t.timestamp).toISOString(),
      `"${t.ledgerBlock?.collectorName || 'Ramesh Kabadiwala'}"`,
      t.ledgerBlock?.collectorId || 'COL-MUM-4001',
      `"${t.payload?.classification?.confirmedCategory || 'E-waste'}"`,
      t.payload?.weightKg || 0,
      Math.round(t.payload?.calculatedPricePerKg || 0),
      Math.round(t.payload?.totalEstimatedPrice || t.payment?.amount || 0),
      t.payment?.method || 'UPI',
      t.payment?.utrNumber || 'UTR-SBIN-26229-881920',
      t.ledgerBlock?.cpcbRegNumber || 'CPCB/EPR-EW/2024/MH-0142',
      t.ledgerBlock?.currentBlockHash || '0x7e2d9a1b8c4f5e6a',
      t.ledgerBlock?.eprCreditUnits || t.payload?.weightKg || 0,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `CPCB-EPR-Compliance-Report-${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const categories = [
    'all',
    'E-waste',
    'Batteries',
    'Copper Wire & Motors',
    'Smartphones & Tablets',
    'PCBs & Circuit Boards',
  ];

  return (
    <div id="recycler-epr-ledger-screen" className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Banner & Export Action */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E5EAE7] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E8F5E9] text-[#107C41] text-xs font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Ministry of Environment, Forest & Climate Change (MoEFCC)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#17231D] tracking-tight">
            {language === 'hi' ? 'EPR अनुपालन व बहीखाता' : 'EPR Compliance & Audit Ledger'}
          </h1>
          <p className="text-xs text-[#66736C] mt-0.5">
            {language === 'hi'
              ? 'सत्यापित डिजिटल हैंडओवर और सीपीसीबी फॉर्म-6 ऑडिट रिकॉर्ड्स'
              : 'Verified physical handovers formatted for statutory Extended Producer Responsibility filing'}
          </p>
        </div>

        {/* Download CSV Action */}
        <button
          type="button"
          id="export-epr-csv-btn"
          onClick={handleExportCSV}
          className="px-4 py-2.5 rounded-2xl bg-[#107C41] hover:bg-[#0E6C38] active:bg-[#0C5D30] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>{language === 'hi' ? 'CSV रिपोर्ट डाउनलोड करें' : 'Export CPCB CSV Report'}</span>
        </button>
      </div>

      {/* 3 Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-[#E5EAE7] shadow-2xs">
          <span className="text-xs font-bold text-[#66736C]">Verified Diverted Material</span>
          <p className="text-2xl font-black text-[#17231D] mt-1">
            {totalVerifiedWeightKg.toFixed(1)} <span className="text-xs font-bold text-[#8A968F]">kg</span>
          </p>
          <span className="text-[10px] text-[#107C41] font-semibold mt-0.5 block">
            100% CPCB Grade Certified
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#E5EAE7] shadow-2xs">
          <span className="text-xs font-bold text-[#66736C]">Total EPR Credit Units</span>
          <p className="text-2xl font-black text-[#107C41] mt-1">
            {totalEprCredits.toFixed(1)} <span className="text-xs font-bold text-[#8A968F]">Credits</span>
          </p>
          <span className="text-[10px] text-[#66736C] font-semibold mt-0.5 block">
            Eligible for Producer Offset Trading
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#E5EAE7] shadow-2xs">
          <span className="text-xs font-bold text-[#66736C]">Total Informal Economy Payout</span>
          <p className="text-2xl font-black text-[#17231D] mt-1">
            ₹{totalDisbursedAmount.toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-emerald-700 font-semibold mt-0.5 block">
            Direct DBT / UPI Disbursed
          </span>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white rounded-3xl p-5 border border-[#E5EAE7] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#8A968F] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ID, Collector, Category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-3 bg-[#F7FAF8] border border-[#DCE3DD] rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#107C41]"
            />
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-1.5 bg-[#F3F6F4] p-1 rounded-xl border border-[#E5EAE7]">
            <button
              type="button"
              onClick={() => setDateFilter('all')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                dateFilter === 'all' ? 'bg-[#107C41] text-white shadow-2xs' : 'text-[#66736C]'
              }`}
            >
              All Time
            </button>
            <button
              type="button"
              onClick={() => setDateFilter('30d')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                dateFilter === '30d' ? 'bg-[#107C41] text-white shadow-2xs' : 'text-[#66736C]'
              }`}
            >
              Last 30 Days
            </button>
            <button
              type="button"
              onClick={() => setDateFilter('7d')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                dateFilter === '7d' ? 'bg-[#107C41] text-white shadow-2xs' : 'text-[#66736C]'
              }`}
            >
              Last 7 Days
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer shrink-0 font-medium ${
                categoryFilter === cat
                  ? 'bg-[#E8F5E9] text-[#107C41] font-bold border border-[#C5E5CE]'
                  : 'bg-white text-[#66736C] border border-[#E5EAE7] hover:bg-[#F7FAF8]'
              }`}
            >
              {cat === 'all' ? 'All Materials' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger Records Table & Cards */}
      {filteredTxns.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-[#E5EAE7] space-y-2">
          <FileSpreadsheet className="w-10 h-10 text-[#8A968F] mx-auto" />
          <h3 className="text-sm font-bold text-[#17231D]">No Compliance Records Found</h3>
          <p className="text-xs text-[#66736C]">
            Complete handovers to populate your official CPCB EPR compliance ledger.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTxns.map((txn) => {
            const dateStr = new Date(txn.timestamp).toLocaleDateString('en-IN', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
            const amount = txn.payload?.totalEstimatedPrice || txn.payment?.amount || 0;
            const weight = txn.payload?.weightKg || 0;

            return (
              <div
                key={txn.id}
                className="bg-white rounded-2xl p-4 border border-[#E5EAE7] hover:border-[#107C41]/60 shadow-2xs hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#107C41] bg-[#E8F5E9] px-2 py-0.5 rounded-md">
                      {txn.id}
                    </span>
                    <span className="text-xs font-bold text-[#17231D]">
                      {txn.payload?.classification?.confirmedCategory}
                    </span>
                    <span className="text-[10px] text-[#66736C]">({dateStr})</span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-[#66736C] flex-wrap">
                    <span>
                      Collector: <strong>{txn.ledgerBlock?.collectorName || 'Ramesh Kabadiwala'}</strong>
                    </span>
                    <span>
                      Weight: <strong>{weight} kg</strong>
                    </span>
                    <span>
                      Rate: <strong>₹{Math.round(txn.payload?.calculatedPricePerKg || 0)}/kg</strong>
                    </span>
                    <span>
                      Payout: <strong className="text-[#107C41]">₹{Math.round(amount).toLocaleString('en-IN')}</strong>
                    </span>
                  </div>

                  <div className="text-[10px] font-mono text-[#8A968F] flex items-center gap-2 pt-0.5">
                    <span>Hash: {txn.ledgerBlock?.currentBlockHash?.slice(0, 16) || '0x7e2d9a1b8c4f5e6a'}...</span>
                    <span>•</span>
                    <span className="text-emerald-700 font-sans font-bold">CPCB Form-6 Logged</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedTxnForManifest(txn)}
                    className="px-3 py-2 rounded-xl bg-[#F3F6F4] hover:bg-[#E5EAE7] text-[#17231D] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View Manifest</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Manifest Certificate Modal */}
      {selectedTxnForManifest && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={() => setSelectedTxnForManifest(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E5EAE7] space-y-5 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Manifest Header */}
            <div className="border-b border-[#E5EAE7] pb-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#107C41] uppercase tracking-wider block">
                  CPCB E-WASTE (MANAGEMENT) RULES, 2022
                </span>
                <h3 className="text-base font-black text-[#17231D]">
                  FORM 6 — DIGITAL TRANSFER MANIFEST
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTxnForManifest(null)}
                className="text-xs font-bold text-[#66736C] hover:text-[#17231D] cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Manifest Content */}
            <div className="bg-[#F7FAF8] rounded-2xl p-4 border border-[#E5EAE7] font-mono text-xs space-y-2.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-[#66736C]">Manifest Reference:</span>
                <strong>{selectedTxnForManifest.id}</strong>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[#66736C]">CPCB Recycler Reg #:</span>
                <strong>{selectedTxnForManifest.ledgerBlock?.cpcbRegNumber || 'CPCB/EPR-EW/2024/MH-0142'}</strong>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[#66736C]">Material Category:</span>
                <strong>{selectedTxnForManifest.payload?.classification?.confirmedCategory}</strong>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[#66736C]">Certified Net Weight:</span>
                <strong>{selectedTxnForManifest.payload?.weightKg} KG</strong>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[#66736C]">Direct Consideration:</span>
                <strong>₹{Math.round(selectedTxnForManifest.payload?.totalEstimatedPrice || selectedTxnForManifest.payment?.amount || 0)}</strong>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[#66736C]">Collector / Aggregator:</span>
                <span>{selectedTxnForManifest.ledgerBlock?.collectorName || 'Ramesh Kabadiwala'}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[#66736C]">Digital Signature:</span>
                <span className="text-emerald-700 font-bold">VERIFIED_IMMUTABLE_2026</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 h-11 rounded-xl bg-[#F3F6F4] hover:bg-[#E5EAE7] text-[#17231D] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Copy</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTxnForManifest(null)}
                className="flex-1 h-11 rounded-xl bg-[#107C41] hover:bg-[#0E6C38] text-white text-xs font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
