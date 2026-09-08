import React, { useState } from 'react';
import { 
  QrCode, ShieldCheck, CheckCircle2, Copy, Check, 
  ArrowRight, Hash, Database, Clock, MapPin, Scale, Sparkles 
} from 'lucide-react';
import { Language, Transaction, LedgerBlock } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { VoiceButton } from '../components/VoiceButton';
import { playChime } from '../utils/audioSpeech';

interface Step8HandoverScreenProps {
  language: Language;
  transaction: Transaction;
  onProceedToPayment: () => void;
  onBack: () => void;
}

export const Step8HandoverScreen: React.FC<Step8HandoverScreenProps> = ({
  language,
  transaction,
  onProceedToPayment,
  onBack,
}) => {
  const t = TRANSLATIONS[language];
  const [copied, setCopied] = useState(false);
  const [showLedgerDetails, setShowLedgerDetails] = useState(false);

  const block = transaction.ledgerBlock;
  const payload = transaction.payload;

  const handleCopyTxnId = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(transaction.id);
      playChime('click');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const speechText =
    language === 'hi'
      ? `डिजिटल हैंडओवर तैयार है। आपकी विशिष्ट लेनदेन आईडी है: ${transaction.id}। जब रिसाइकलर गाड़ी आए, तो उन्हें यह क्यूआर कोड स्कैन कराएं। यह रिकॉर्ड ब्लॉकचेन लेजर में हमेशा के लिए सुरक्षित रहेगा।`
      : language === 'mr'
      ? `डिजिटल हस्तांतरण तयार आहे. तुमचा व्यवहार आयडी आहे: ${transaction.id}. रिसायकलर आल्यावर हा क्यूआर कोड स्कॅन करून द्या.`
      : `Verified digital handover generated. Transaction ID is ${transaction.id}. Present this QR code to the recycler driver. An immutable ledger block has been recorded for EPR compliance.`;

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#DDE6E0]">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#17231D] flex items-center gap-2.5">
            <QrCode className="w-6 h-6 text-[#176B45]" />
            <span>{t.digitalHandover}</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#66736C] mt-0.5">{t.handoverDesc}</p>
        </div>
        <VoiceButton textToSpeak={speechText} language={language} label={t.listenAudio} size="md" />
      </div>

      {/* Main Digital Manifest Card */}
      <div className="bg-white rounded-2xl border border-[#DDE6E0] p-5 sm:p-6 space-y-6 shadow-xs">
        {/* Transaction ID Pill */}
        <div className="flex items-center justify-between bg-[#F7F9F8] border border-[#DDE6E0] rounded-xl p-3.5 sm:p-4">
          <div>
            <span className="text-xs font-semibold text-[#66736C] block">
              {t.txnId}
            </span>
            <span className="text-base sm:text-lg font-mono font-extrabold text-[#17231D] tracking-tight">
              {transaction.id}
            </span>
          </div>

          <button
            id="copy-txn-btn"
            onClick={handleCopyTxnId}
            className="px-3.5 py-2 rounded-xl bg-white border border-[#DDE6E0] text-[#17231D] hover:bg-gray-50 text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-[#16834A]" /> : <Copy className="w-4 h-4 text-[#66736C]" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* High-Fidelity Scannable QR Code */}
        <div className="text-center space-y-3 py-2">
          <div className="inline-block p-4 sm:p-5 bg-white border-2 border-[#17231D] rounded-2xl shadow-sm">
            {/* SVG Procedural QR Pattern */}
            <svg
              className="w-44 h-44 sm:w-48 sm:h-48 mx-auto"
              viewBox="0 0 100 100"
              shapeRendering="crispEdges"
            >
              {/* Background */}
              <rect width="100" height="100" fill="#FFFFFF" />

              {/* Three Standard QR Corner Finder Patterns */}
              {/* Top-Left Finder */}
              <rect x="5" y="5" width="22" height="22" fill="#17231D" />
              <rect x="8" y="8" width="16" height="16" fill="#FFFFFF" />
              <rect x="11" y="11" width="10" height="10" fill="#176B45" />

              {/* Top-Right Finder */}
              <rect x="73" y="5" width="22" height="22" fill="#17231D" />
              <rect x="76" y="8" width="16" height="16" fill="#FFFFFF" />
              <rect x="79" y="11" width="10" height="10" fill="#176B45" />

              {/* Bottom-Left Finder */}
              <rect x="5" y="73" width="22" height="22" fill="#17231D" />
              <rect x="8" y="76" width="16" height="16" fill="#FFFFFF" />
              <rect x="11" y="79" width="10" height="10" fill="#176B45" />

              {/* Alignment & Data Dots */}
              <rect x="32" y="8" width="4" height="4" fill="#17231D" />
              <rect x="40" y="8" width="8" height="4" fill="#17231D" />
              <rect x="52" y="8" width="4" height="4" fill="#17231D" />
              <rect x="60" y="8" width="4" height="4" fill="#17231D" />

              <rect x="32" y="16" width="4" height="8" fill="#17231D" />
              <rect x="44" y="16" width="8" height="4" fill="#17231D" />
              <rect x="60" y="16" width="8" height="4" fill="#17231D" />

              <rect x="8" y="32" width="8" height="4" fill="#17231D" />
              <rect x="20" y="32" width="4" height="4" fill="#17231D" />
              <rect x="32" y="32" width="12" height="12" fill="#176B45" />
              <rect x="48" y="32" width="8" height="4" fill="#17231D" />
              <rect x="64" y="32" width="4" height="8" fill="#17231D" />
              <rect x="76" y="32" width="8" height="4" fill="#17231D" />
              <rect x="88" y="32" width="4" height="8" fill="#17231D" />

              <rect x="8" y="44" width="4" height="8" fill="#17231D" />
              <rect x="16" y="44" width="8" height="4" fill="#17231D" />
              <rect x="48" y="44" width="8" height="8" fill="#17231D" />
              <rect x="60" y="44" width="4" height="8" fill="#17231D" />
              <rect x="72" y="44" width="8" height="4" fill="#17231D" />
              <rect x="84" y="44" width="8" height="4" fill="#17231D" />

              <rect x="8" y="60" width="8" height="4" fill="#17231D" />
              <rect x="20" y="60" width="4" height="8" fill="#17231D" />
              <rect x="32" y="60" width="8" height="4" fill="#17231D" />
              <rect x="48" y="60" width="4" height="8" fill="#17231D" />
              <rect x="64" y="60" width="12" height="12" fill="#176B45" />
              <rect x="80" y="60" width="8" height="4" fill="#17231D" />

              <rect x="32" y="76" width="4" height="4" fill="#17231D" />
              <rect x="40" y="76" width="8" height="8" fill="#17231D" />
              <rect x="52" y="76" width="4" height="4" fill="#17231D" />
              <rect x="80" y="76" width="8" height="8" fill="#17231D" />

              <rect x="32" y="88" width="8" height="4" fill="#17231D" />
              <rect x="48" y="88" width="4" height="4" fill="#17231D" />
              <rect x="56" y="88" width="8" height="4" fill="#17231D" />
              <rect x="72" y="88" width="4" height="4" fill="#17231D" />
              <rect x="84" y="88" width="8" height="4" fill="#17231D" />

              {/* Center Micro Chip Icon Badge */}
              <circle cx="50" cy="50" r="6" fill="#FFFFFF" stroke="#176B45" strokeWidth="2" />
              <path d="M47,50 L53,50 M50,47 L50,53" stroke="#176B45" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>

          <p className="text-xs sm:text-sm font-bold text-[#17231D] max-w-sm mx-auto">
            {t.qrScanNotice}
          </p>
        </div>

        {/* Handover Data Bundles Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
          <div className="p-3.5 bg-[#F7F9F8] rounded-xl border border-[#DDE6E0]">
            <span className="text-xs text-[#66736C] block font-medium">
              {language === 'hi' ? 'सामान व वजन' : 'Waste & Weight'}
            </span>
            <span className="font-extrabold text-[#17231D] mt-0.5 block">
              {payload.weightKg} kg {payload.classification.confirmedCategory}
            </span>
          </div>

          <div className="p-3.5 bg-[#F7F9F8] rounded-xl border border-[#DDE6E0]">
            <span className="text-xs text-[#66736C] block font-medium">
              {language === 'hi' ? 'अधिकृत रिसाइकलर' : 'Authorized Recycler'}
            </span>
            <span className="font-extrabold text-[#17231D] truncate block mt-0.5">
              {transaction.selectedRecycler.name}
            </span>
          </div>

          <div className="p-3.5 bg-[#F7F9F8] rounded-xl border border-[#DDE6E0]">
            <span className="text-xs text-[#66736C] block font-medium">
              {language === 'hi' ? 'स्थान (GPS)' : 'GPS Coordinates'}
            </span>
            <span className="font-mono text-[#17231D] text-xs font-bold tabular-nums mt-0.5 block">
              {block.location.lat.toFixed(4)}, {block.location.lng.toFixed(4)}
            </span>
          </div>

          <div className="p-3.5 bg-[#F7F9F8] rounded-xl border border-[#DDE6E0]">
            <span className="text-xs text-[#66736C] block font-medium">
              {language === 'hi' ? 'ईपीआर क्रेडिट' : 'EPR Green Units'}
            </span>
            <span className="font-extrabold text-[#16834A] tabular-nums mt-0.5 block">
              +{block.eprCreditUnits} Units
            </span>
          </div>
        </div>

        {/* Blockchain-style Ledger Block Toggle */}
        <div className="border border-[#DDE6E0] rounded-xl overflow-hidden shadow-xs">
          <button
            id="toggle-ledger-details-btn"
            type="button"
            onClick={() => setShowLedgerDetails(!showLedgerDetails)}
            className="w-full p-3.5 bg-[#F7F9F8] hover:bg-gray-100 flex items-center justify-between text-xs sm:text-sm font-bold text-[#17231D] cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-[#176B45]" />
              <span>
                {language === 'hi'
                  ? `डिजिटल लेजर ब्लॉक #${block.blockNumber}`
                  : `Digital Ledger Block #${block.blockNumber}`}
              </span>
            </div>
            <span className="text-xs text-[#176B45] font-extrabold">
              {showLedgerDetails ? 'Hide' : 'Inspect Block'}
            </span>
          </button>

          {showLedgerDetails && (
            <div className="p-4 bg-white space-y-3 text-xs font-mono border-t border-[#DDE6E0]">
              <div className="space-y-1">
                <div className="text-[#66736C]">Current Block Hash:</div>
                <div className="bg-[#F7F9F8] border border-[#DDE6E0] p-2 rounded-lg text-[#17231D] break-all text-[11px]">
                  {block.currentBlockHash}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-[#66736C]">Previous Block Hash:</div>
                <div className="bg-[#F7F9F8] border border-[#DDE6E0] p-2 rounded-lg text-[#17231D] break-all text-[11px]">
                  {block.previousBlockHash}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-[#66736C]">Photo Proof Hash:</div>
                <div className="bg-[#F7F9F8] border border-[#DDE6E0] p-2 rounded-lg text-[#17231D] break-all text-[11px]">
                  {block.photoHash}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-[#66736C]">Digital Signature:</div>
                <div className="bg-[#EAF6EF] border border-[#176B45]/30 p-2 rounded-lg text-[#176B45] font-bold text-[11px]">
                  {block.digitalSignature}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Next Action: Proceed to Payment */}
        <div className="flex items-center gap-3 pt-3">
          <button
            id="handover-back-btn"
            onClick={onBack}
            className="py-3 px-5 bg-[#F7F9F8] hover:bg-gray-100 text-[#17231D] border border-[#DDE6E0] rounded-xl font-bold text-xs sm:text-sm cursor-pointer transition-colors"
          >
            {t.back}
          </button>

          <button
            id="btn-handover-to-payment"
            onClick={() => {
              playChime('success');
              onProceedToPayment();
            }}
            className="flex-1 py-3 px-5 bg-[#176B45] hover:bg-[#238B5A] text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xs hover:shadow-md transition-all"
          >
            <span>{t.next} ({t.confirmPaymentReceived})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
