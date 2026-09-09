import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  ShieldCheck,
  Scale,
  MapPin,
  Clock,
  Sparkles,
  AlertCircle,
  FileCheck,
  ArrowLeft,
  QrCode,
  Download,
  Share2,
  Printer,
  ChevronDown,
} from 'lucide-react';
import { Transaction, Language, UserProfile } from '../../types';
import { playChime } from '../../utils/audioSpeech';

interface RecyclerHandoverScreenProps {
  transactions: Transaction[];
  initialTransactionId?: string;
  currentUser: UserProfile | null;
  language: Language;
  onConfirmHandover: (
    transactionId: string,
    verifiedWeightKg: number,
    finalAmount: number,
    notes?: string
  ) => void;
  onBackToDashboard: () => void;
}

export const RecyclerHandoverScreen: React.FC<RecyclerHandoverScreenProps> = ({
  transactions,
  initialTransactionId,
  currentUser,
  language,
  onConfirmHandover,
  onBackToDashboard,
}) => {
  // Find initial transaction or pick the first accepted/pending one
  const eligibleTransactions = transactions.filter(
    (t) => t.status === 'accepted' || t.status === 'pending_pickup' || t.status === 'completed'
  );

  const [selectedTxnId, setSelectedTxnId] = useState<string>(
    initialTransactionId ||
      eligibleTransactions.find((t) => t.status === 'accepted')?.id ||
      eligibleTransactions[0]?.id ||
      ''
  );

  const currentTxn = transactions.find((t) => t.id === selectedTxnId);

  // Verification Form states
  const [actualWeight, setActualWeight] = useState<number>(
    currentTxn?.payload?.weightKg || 10
  );
  const [grade, setGrade] = useState<'A' | 'B' | 'C'>('A');
  const [gpsMatchVerified, setGpsMatchVerified] = useState(true);
  const [physicalNotes, setPhysicalNotes] = useState('');
  const [isConfirmedSuccess, setIsConfirmedSuccess] = useState(
    currentTxn?.status === 'completed' || currentTxn?.status === 'verified_handover'
  );

  // Update actual weight when selected transaction changes
  useEffect(() => {
    if (currentTxn) {
      setActualWeight(currentTxn.payload?.weightKg || 10);
      setIsConfirmedSuccess(
        currentTxn.status === 'completed' || currentTxn.status === 'verified_handover'
      );
    }
  }, [selectedTxnId, currentTxn]);

  const ratePerKg = currentTxn?.payload?.calculatedPricePerKg || 150;
  const gradeMultiplier = grade === 'A' ? 1.0 : grade === 'B' ? 0.95 : 0.9;
  const finalSettledAmount = Math.round(actualWeight * ratePerKg * gradeMultiplier);

  const handleConfirm = () => {
    if (!currentTxn) return;
    playChime('success');
    setIsConfirmedSuccess(true);
    onConfirmHandover(currentTxn.id, actualWeight, finalSettledAmount, physicalNotes);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="recycler-handover-screen" className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBackToDashboard}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#66736C] hover:text-[#17231D] bg-white px-3 py-2 rounded-xl border border-[#E5EAE7] cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{language === 'hi' ? 'डैशबोर्ड पर वापस जाएं' : 'Back to Dashboard'}</span>
        </button>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#E8F5E9] text-[#107C41] border border-[#C5E5CE] rounded-full text-xs font-bold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>CPCB Digital Handover Protocol</span>
        </div>
      </div>

      {/* Select Active Handover Transaction Card */}
      <div className="bg-white rounded-3xl p-5 border border-[#E5EAE7] shadow-xs space-y-3">
        <label className="block text-xs font-black uppercase text-[#17231D] tracking-wide">
          {language === 'hi'
            ? 'सत्यापन हेतु लेन-देन चुनें (Select Transaction ID)'
            : 'Select Transaction for Handover Verification'}
        </label>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <select
              id="handover-transaction-select"
              value={selectedTxnId}
              onChange={(e) => setSelectedTxnId(e.target.value)}
              className="w-full h-12 px-4 pr-10 bg-[#F7FAF8] border border-[#DCE3DD] rounded-2xl text-xs sm:text-sm font-bold text-[#17231D] appearance-none focus:outline-none focus:ring-1 focus:ring-[#107C41]"
            >
              {eligibleTransactions.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.id} • {t.payload?.classification?.confirmedCategory} ({t.payload?.weightKg} kg) - {t.status.toUpperCase()}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-[#66736C] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <span className="text-xs font-semibold text-[#8A968F] shrink-0">
            {language === 'hi' ? 'या आईडी दर्ज करें' : 'or enter directly'}
          </span>

          <input
            type="text"
            placeholder="e.g. EPR-2026-MUM-8842"
            value={selectedTxnId}
            onChange={(e) => setSelectedTxnId(e.target.value)}
            className="w-full sm:w-56 h-12 px-4 bg-white border border-[#DCE3DD] rounded-2xl text-xs font-bold placeholder-[#9CA8A1] focus:outline-none focus:ring-1 focus:ring-[#107C41]"
          />
        </div>
      </div>

      {/* Main Verification Body */}
      {!currentTxn ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-[#E5EAE7] space-y-3">
          <AlertCircle className="w-10 h-10 text-[#8A968F] mx-auto" />
          <h3 className="text-base font-bold text-[#17231D]">Transaction Not Found</h3>
          <p className="text-xs text-[#66736C]">
            Please enter or select a valid Transaction ID generated by a collector.
          </p>
        </div>
      ) : isConfirmedSuccess ? (
        /* SUCCESS CONFIRMED STATE */
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-200 shadow-md space-y-6 animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-full bg-[#E8F5E9] text-[#107C41] flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
          </div>

          <div className="text-center space-y-1">
            <span className="text-xs font-black uppercase tracking-widest text-[#107C41]">
              Verified Handover Complete
            </span>
            <h2 className="text-2xl font-black text-[#17231D]">
              Digital Certificate Generated
            </h2>
            <p className="text-xs text-[#66736C] max-w-sm mx-auto">
              Material weighed and accepted into CPCB registry. Payment of ₹
              {finalSettledAmount.toLocaleString('en-IN')} released to collector.
            </p>
          </div>

          {/* Official CPCB Form Summary Card */}
          <div className="bg-[#F7FAF8] rounded-2xl p-5 border border-[#E5EAE7] space-y-3 font-mono text-xs text-[#17231D]">
            <div className="flex items-center justify-between border-b border-[#E5EAE7] pb-2 font-sans">
              <span className="font-black text-[#107C41]">CPCB/EPR/MANIFEST-2026</span>
              <span className="text-[10px] text-[#8A968F] font-mono">HASH: 0x8f3c7e91d8</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-[#8A968F] block font-sans">Transaction ID:</span>
                <strong>{currentTxn.id}</strong>
              </div>
              <div>
                <span className="text-[#8A968F] block font-sans">Material:</span>
                <strong>{currentTxn.payload?.classification?.confirmedCategory}</strong>
              </div>
              <div>
                <span className="text-[#8A968F] block font-sans">Verified Net Weight:</span>
                <strong>{actualWeight} kg</strong>
              </div>
              <div>
                <span className="text-[#8A968F] block font-sans">Settled Amount:</span>
                <strong className="text-[#107C41]">₹{finalSettledAmount.toLocaleString('en-IN')}</strong>
              </div>
              <div>
                <span className="text-[#8A968F] block font-sans">Collector:</span>
                <span>{currentTxn.ledgerBlock?.collectorName || 'Ramesh Kabadiwala'}</span>
              </div>
              <div>
                <span className="text-[#8A968F] block font-sans">Authorized Facility:</span>
                <span>EcoRecycle Green Tech Ltd.</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="w-full sm:flex-1 h-12 rounded-2xl bg-[#F3F6F4] hover:bg-[#E5EAE7] text-[#17231D] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print CPCB Manifest</span>
            </button>
            <button
              type="button"
              onClick={onBackToDashboard}
              className="w-full sm:flex-1 h-12 rounded-2xl bg-[#107C41] hover:bg-[#0E6C38] text-white font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <span>Back to Requests Dashboard</span>
            </button>
          </div>
        </div>
      ) : (
        /* ACTIVE VERIFICATION INSPECTION FORM */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Collector's Submitted Declaration */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E5EAE7] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-[#107C41] tracking-wide">
                1. Collector Declaration
              </span>
              <span className="text-[10px] font-mono font-bold bg-[#F3F6F4] px-2 py-0.5 rounded-md text-[#66736C]">
                {currentTxn.id}
              </span>
            </div>

            {/* Photo */}
            <div className="relative rounded-2xl overflow-hidden border border-[#E5EAE7] bg-[#F3F6F4]">
              <img
                src={currentTxn.payload?.photoUrl}
                alt="Collector Item"
                className="w-full h-48 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80';
                }}
              />
              <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-xs text-white px-2.5 py-1 rounded-lg text-[10px] font-bold">
                Photo Hash: {currentTxn.ledgerBlock?.photoHash?.slice(0, 14) || '0x9a8b7c6d5e4f'}...
              </div>
            </div>

            {/* Declared Details Matrix */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#F7FAF8] border border-[#E5EAE7]">
                <span className="text-[11px] text-[#66736C] block">Declared Category</span>
                <span className="font-black text-[#17231D]">
                  {currentTxn.payload?.classification?.confirmedCategory}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#F7FAF8] border border-[#E5EAE7]">
                <span className="text-[11px] text-[#66736C] block">Declared Weight</span>
                <span className="font-black text-[#17231D]">
                  {currentTxn.payload?.weightKg} kg
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#F7FAF8] border border-[#E5EAE7]">
                <span className="text-[11px] text-[#66736C] block">Collector Name</span>
                <span className="font-black text-[#17231D]">
                  {currentTxn.ledgerBlock?.collectorName || 'Ramesh Kabadiwala'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#F7FAF8] border border-[#E5EAE7]">
                <span className="text-[11px] text-[#66736C] block">Initial Estimate</span>
                <span className="font-black text-[#107C41]">
                  ₹{Math.round(currentTxn.payload?.totalEstimatedPrice || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* GPS Match Status Box */}
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block">GPS Geofence Match Verified</strong>
                <span className="text-[11px] text-emerald-700 leading-tight">
                  Handover coordinates match collector's declared location within 45 meters (Threshold: 150m).
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Recycler Weighbridge & Physical Inspection Form */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E5EAE7] shadow-xs space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-[#107C41] tracking-wide">
                  2. Physical Intake & Weighing
                </span>
                <span className="text-[10px] font-bold bg-[#E8F5E9] text-[#107C41] px-2 py-0.5 rounded-md">
                  Scale Active
                </span>
              </div>

              {/* Weighbridge Input */}
              <div className="p-4 rounded-2xl bg-[#F7FAF8] border border-[#E5EAE7] space-y-2">
                <label className="block text-xs font-bold text-[#17231D] flex items-center justify-between">
                  <span>Verified Net Weight (Kilograms):</span>
                  <span className="text-[11px] text-[#66736C]">
                    Collector said: {currentTxn.payload?.weightKg} kg
                  </span>
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={actualWeight}
                      onChange={(e) => setActualWeight(parseFloat(e.target.value) || 0)}
                      className="w-full h-12 px-4 bg-white border border-[#DCE3DD] rounded-xl text-lg font-black text-[#17231D] focus:outline-none focus:ring-1 focus:ring-[#107C41]"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8A968F]">
                      KG
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActualWeight(currentTxn.payload?.weightKg || 10)}
                    className="px-3 h-12 bg-white border border-[#DCE3DD] hover:bg-[#F3F6F4] rounded-xl text-xs font-bold text-[#66736C] cursor-pointer"
                  >
                    Match Collector
                  </button>
                </div>
              </div>

              {/* Material Quality Grading */}
              <div>
                <label className="block text-xs font-bold text-[#17231D] mb-1.5">
                  Physical Grading & Cleanliness:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setGrade('A')}
                    className={`py-2 px-3 rounded-xl border text-xs text-center transition-all cursor-pointer ${
                      grade === 'A'
                        ? 'bg-[#E8F5E9] border-[#107C41] text-[#107C41] font-bold'
                        : 'bg-white border-[#DCE3DD] text-[#66736C] hover:bg-[#F3F6F4]'
                    }`}
                  >
                    Grade A (100%)
                    <span className="text-[10px] block text-[#8A968F]">Clean & Sorted</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGrade('B')}
                    className={`py-2 px-3 rounded-xl border text-xs text-center transition-all cursor-pointer ${
                      grade === 'B'
                        ? 'bg-[#E8F5E9] border-[#107C41] text-[#107C41] font-bold'
                        : 'bg-white border-[#DCE3DD] text-[#66736C] hover:bg-[#F3F6F4]'
                    }`}
                  >
                    Grade B (95%)
                    <span className="text-[10px] block text-[#8A968F]">Minor Contaminants</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGrade('C')}
                    className={`py-2 px-3 rounded-xl border text-xs text-center transition-all cursor-pointer ${
                      grade === 'C'
                        ? 'bg-[#E8F5E9] border-[#107C41] text-[#107C41] font-bold'
                        : 'bg-white border-[#DCE3DD] text-[#66736C] hover:bg-[#F3F6F4]'
                    }`}
                  >
                    Grade C (90%)
                    <span className="text-[10px] block text-[#8A968F]">Mixed / Wet Scrap</span>
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-[#17231D] mb-1">
                  Intake Notes / Scale Reference:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Weighbridge Bay 3, zeroed digital scale"
                  value={physicalNotes}
                  onChange={(e) => setPhysicalNotes(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-[#DCE3DD] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#107C41]"
                />
              </div>

              {/* Final Settlement Calculation Banner */}
              <div className="p-4 rounded-2xl bg-[#E8F5E9] border border-[#D0E7D7] flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-[#107C41] block">
                    Final Settled Payment:
                  </span>
                  <p className="text-2xl font-black text-[#107C41]">
                    ₹{finalSettledAmount.toLocaleString('en-IN')}
                  </p>
                  <span className="text-[10px] text-[#66736C]">
                    ({actualWeight} kg × ₹{ratePerKg}/kg × {gradeMultiplier * 100}%)
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#66736C] block">EPR Green Credits</span>
                  <span className="text-base font-black text-[#17231D]">
                    +{actualWeight} Units
                  </span>
                </div>
              </div>
            </div>

            {/* Confirm Handover Button */}
            <div className="pt-4">
              <button
                type="button"
                id="confirm-handover-action-btn"
                onClick={handleConfirm}
                className="w-full h-13 rounded-2xl bg-[#107C41] hover:bg-[#0E6C38] active:bg-[#0C5D30] text-white font-black text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
              >
                <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                <span>
                  {language === 'hi'
                    ? `हैंडओवर पुष्टि व भुगतान जारी करें (₹${finalSettledAmount})`
                    : `Confirm Handover & Release Payment (₹${finalSettledAmount.toLocaleString('en-IN')})`}
                </span>
              </button>
              <p className="text-[10px] text-center text-[#8A968F] mt-2">
                Digitally signs CPCB Form-6 manifest & updates verified immutable ledger
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
