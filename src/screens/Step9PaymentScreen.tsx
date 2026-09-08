import React, { useState } from 'react';
import { 
  CreditCard, CheckCircle2, IndianRupee, ShieldCheck, 
  Smartphone, Building2, Fingerprint, ArrowRight, Download, Share2, Sparkles 
} from 'lucide-react';
import { Language, Transaction } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { VoiceButton } from '../components/VoiceButton';
import { playChime } from '../utils/audioSpeech';

interface Step9PaymentScreenProps {
  language: Language;
  transaction: Transaction;
  onPaymentConfirmed: (updatedTransaction: Transaction) => void;
  onBack: () => void;
}

export const Step9PaymentScreen: React.FC<Step9PaymentScreenProps> = ({
  language,
  transaction,
  onPaymentConfirmed,
  onBack,
}) => {
  const t = TRANSLATIONS[language];

  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'aeps' | 'bank_transfer'>(
    transaction.payment?.method || 'upi'
  );
  const [accountOrUpi, setAccountOrUpi] = useState<string>(
    transaction.payment?.accountOrUpiId || 'ramesh.scrap@upi'
  );
  const [isPaid, setIsPaid] = useState<boolean>(transaction.status === 'paid' || transaction.status === 'completed');
  const [utrNumber, setUtrNumber] = useState<string>(
    transaction.payment?.utrNumber || `UTR-SBIN-${Date.now().toString().slice(-6)}`
  );

  const amount = transaction.payload.totalEstimatedPrice;

  const handleConfirmReceived = () => {
    playChime('success');
    setIsPaid(true);

    const updatedTxn: Transaction = {
      ...transaction,
      status: 'paid',
      payment: {
        method: paymentMethod,
        accountOrUpiId: accountOrUpi,
        utrNumber,
        paidAt: Date.now(),
        amount,
        receiptQr: `UPI:${accountOrUpi}?am=${amount}&tr=${transaction.id}`,
      },
    };

    onPaymentConfirmed(updatedTxn);
  };

  const speechText =
    language === 'hi'
      ? `भुगतान सत्यापन: लेनदेन आईडी ${transaction.id} के तहत ₹${amount} का डिजिटल भुगतान ${paymentMethod === 'upi' ? 'यूपीआई' : 'खाते'} में प्राप्त हुआ। कोई अस्पष्ट नकद सौदा नहीं, पूरा हिसाब पारदर्शी है।`
      : language === 'mr'
      ? `पेमेंट खात्री: व्यवहार आयडी ${transaction.id} साठी ₹${amount} चे डिजिटल पेमेंट यशस्वी झाले. रोख पैशांमधील गैरव्यवहार टाळण्यासाठी डिजिटल पावती उपलब्ध आहे.`
      : `Payment verified. ₹${amount} received against transaction ID ${transaction.id}. Zero ambiguous cash, fully transparent traceable digital payout.`;

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#DDE6E0]">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#17231D] flex items-center gap-2.5">
            <CreditCard className="w-6 h-6 text-[#176B45]" />
            <span>{t.confirmPaymentReceived}</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#66736C] mt-0.5">
            {language === 'hi' ? 'डिजिटल रसीद और बैंक संदर्भ नंबर' : 'Digital Payout Receipt & Zero-Cash Audit'}
          </p>
        </div>
        <VoiceButton textToSpeak={speechText} language={language} label={t.listenAudio} size="md" />
      </div>

      {!isPaid ? (
        /* Payment Mode Selection Form */
        <div className="bg-white rounded-2xl border border-[#DDE6E0] p-5 sm:p-6 space-y-6 shadow-xs">
          <div className="text-center py-4 px-4 bg-[#F7F9F8] rounded-xl border border-[#DDE6E0]">
            <span className="text-xs font-semibold text-[#66736C] block">
              {language === 'hi' ? 'देय उचित राशि' : 'Amount Due'}
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold text-[#17231D] mt-1 tabular-nums">
              ₹{amount.toLocaleString('en-IN')}
            </div>
            <span className="text-xs text-[#176B45] font-mono font-bold mt-1 inline-block">
              Txn ID: {transaction.id}
            </span>
          </div>

          <div className="space-y-3">
            <label className="text-xs sm:text-sm font-bold text-[#17231D] block">
              {t.paymentPrompt}
            </label>

            {/* UPI Option */}
            <button
              id="payment-method-upi"
              type="button"
              onClick={() => {
                playChime('click');
                setPaymentMethod('upi');
                setAccountOrUpi('ramesh.scrap@upi');
              }}
              className={`w-full p-4 rounded-xl border text-left transition-all flex items-center gap-3.5 cursor-pointer ${
                paymentMethod === 'upi'
                  ? 'border-2 border-[#176B45] bg-[#EAF6EF] shadow-xs'
                  : 'border-[#DDE6E0] bg-white hover:bg-[#F7F9F8]'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-white text-[#176B45] border border-[#DDE6E0] flex items-center justify-center shrink-0 shadow-xs">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-bold text-[#17231D]">{t.upiPayment}</span>
                  <span className="text-[11px] bg-[#176B45] text-white font-bold px-2 py-0.5 rounded-full">
                    Instant 0% Fee
                  </span>
                </div>
                <p className="text-xs text-[#66736C] mt-0.5">PhonePe / Google Pay / BHIM / Paytm</p>
              </div>
            </button>

            {/* AePS Option */}
            <button
              id="payment-method-aeps"
              type="button"
              onClick={() => {
                playChime('click');
                setPaymentMethod('aeps');
                setAccountOrUpi('Aadhaar Biometric Micro-ATM (UIDAI-Verified)');
              }}
              className={`w-full p-4 rounded-xl border text-left transition-all flex items-center gap-3.5 cursor-pointer ${
                paymentMethod === 'aeps'
                  ? 'border-2 border-[#176B45] bg-[#EAF6EF] shadow-xs'
                  : 'border-[#DDE6E0] bg-white hover:bg-[#F7F9F8]'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-white text-[#176B45] border border-[#DDE6E0] flex items-center justify-center shrink-0 shadow-xs">
                <Fingerprint className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <span className="text-xs sm:text-sm font-bold text-[#17231D]">{t.aepsPayment}</span>
                <p className="text-xs text-[#66736C] mt-0.5">Aadhaar linked bank account / thumb impression</p>
              </div>
            </button>

            {/* Bank Transfer */}
            <button
              id="payment-method-bank"
              type="button"
              onClick={() => {
                playChime('click');
                setPaymentMethod('bank_transfer');
                setAccountOrUpi('Bank of Baroda - A/C 9841029482');
              }}
              className={`w-full p-4 rounded-xl border text-left transition-all flex items-center gap-3.5 cursor-pointer ${
                paymentMethod === 'bank_transfer'
                  ? 'border-2 border-[#176B45] bg-[#EAF6EF] shadow-xs'
                  : 'border-[#DDE6E0] bg-white hover:bg-[#F7F9F8]'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-white text-[#176B45] border border-[#DDE6E0] flex items-center justify-center shrink-0 shadow-xs">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <span className="text-xs sm:text-sm font-bold text-[#17231D]">{t.bankTransfer}</span>
                <p className="text-xs text-[#66736C] mt-0.5">Direct IMPS / NEFT to collector account</p>
              </div>
            </button>
          </div>

          {/* Account Details Input */}
          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-bold text-[#17231D] block">
              {paymentMethod === 'upi' ? 'Collector UPI VPA' : 'Bank / Aadhaar Details'}
            </label>
            <input
              type="text"
              value={accountOrUpi}
              onChange={(e) => setAccountOrUpi(e.target.value)}
              className="w-full p-3 bg-white border border-[#DDE6E0] rounded-xl text-xs sm:text-sm font-medium text-[#17231D] focus:ring-2 focus:ring-[#176B45]/20 focus:border-[#176B45] outline-none transition-all"
            />
          </div>

          {/* Confirm Payment Received Button */}
          <button
            id="btn-confirm-payment-received"
            onClick={handleConfirmReceived}
            className="w-full py-3.5 px-5 bg-[#176B45] hover:bg-[#238B5A] text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xs hover:shadow-md transition-all"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>
              {language === 'hi'
                ? `हाँ, ₹${amount} भुगतान प्राप्त हुआ (पुष्टि करें)`
                : `Confirm ₹${amount} Payment Received`}
            </span>
          </button>
        </div>
      ) : (
        /* Verified Digital Payout Receipt (Zero-cash audit record) */
        <div className="bg-white rounded-2xl border border-[#DDE6E0] p-5 sm:p-6 space-y-6 shadow-xs">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-[#EAF6EF] text-[#16834A] flex items-center justify-center mx-auto border border-[#16834A]/30">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-[#17231D]">{t.paymentSuccess}</h3>
            <p className="text-xs text-[#66736C] font-mono">{t.paymentReceipt}</p>
          </div>

          {/* Receipt Ticket */}
          <div className="bg-[#F7F9F8] rounded-2xl p-4 sm:p-5 border border-[#DDE6E0] space-y-3">
            <div className="flex justify-between items-center border-b border-[#DDE6E0] pb-2.5">
              <span className="text-xs text-[#66736C]">Transaction ID:</span>
              <span className="text-xs sm:text-sm font-mono font-bold text-[#17231D]">{transaction.id}</span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-xs text-[#66736C]">Amount Paid:</span>
              <span className="text-xl sm:text-2xl font-extrabold text-[#176B45] tabular-nums">
                ₹{amount.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs sm:text-sm">
              <span className="text-[#66736C]">Channel / UTR:</span>
              <span className="font-mono text-[#17231D] font-bold">{uttr_or_val(utrNumber)}</span>
            </div>

            <div className="flex justify-between items-center text-xs sm:text-sm">
              <span className="text-[#66736C]">Payer (Recycler):</span>
              <span className="font-bold text-[#17231D]">{transaction.selectedRecycler.name}</span>
            </div>

            <div className="flex justify-between items-center text-xs sm:text-sm">
              <span className="text-[#66736C]">Beneficiary:</span>
              <span className="font-bold text-[#17231D]">{accountOrUpi}</span>
            </div>

            {/* Official Digital Stamp */}
            <div className="border-t border-[#DDE6E0] pt-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#176B45]">
                <ShieldCheck className="w-4 h-4 text-[#16834A]" />
                <span>CPCB EPR VERIFIED AUDIT PROOF</span>
              </div>
              <span className="text-xs text-[#66736C] font-mono">
                {new Date().toLocaleDateString('en-IN')}
              </span>
            </div>
          </div>

          {/* Action CTA to View Ledger */}
          <button
            id="btn-proceed-to-ledger-step"
            onClick={() => onPaymentConfirmed(transaction)}
            className="w-full py-3.5 px-5 bg-[#176B45] hover:bg-[#238B5A] text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xs hover:shadow-md transition-all"
          >
            <span>{t.next} ({t.earningsLedger})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Back button if not yet paid */}
      {!isPaid && (
        <div className="pt-2">
          <button
            id="payment-back-btn"
            onClick={onBack}
            className="w-full py-3 px-5 bg-[#F7F9F8] hover:bg-gray-100 text-[#17231D] border border-[#DDE6E0] rounded-xl font-bold text-xs sm:text-sm cursor-pointer transition-colors"
          >
            {t.back}
          </button>
        </div>
      )}
    </div>
  );
};

function uttr_or_val(val: string) {
  return val;
}
