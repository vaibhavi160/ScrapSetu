import React, { useState } from 'react';
import {
  X,
  MapPin,
  Phone,
  Calendar,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  Scale,
  Send,
  User,
  Navigation,
} from 'lucide-react';
import { Transaction, Language } from '../../types';
import { playChime } from '../../utils/audioSpeech';
import { normalizeTransaction } from '../../utils/storage';

interface IncomingRequestModalProps {
  transaction: Transaction;
  language: Language;
  onClose: () => void;
  onAccept: (transactionId: string) => void;
  onReject: (transactionId: string, reason?: string) => void;
  onCounterOffer: (transactionId: string, counterPricePerKg: number, note: string) => void;
  onVerifyHandoverDirect?: (transactionId: string) => void;
}

export const IncomingRequestModal: React.FC<IncomingRequestModalProps> = ({
  transaction,
  language,
  onClose,
  onAccept,
  onReject,
  onCounterOffer,
  onVerifyHandoverDirect,
}) => {
  const safeTxn = transaction?.payload ? transaction : normalizeTransaction(transaction);
  const payload = safeTxn.payload;
  const collector = safeTxn.pickup;
  const [showCounterForm, setShowCounterForm] = useState(false);
  const [counterRate, setCounterRate] = useState<number>(
    Math.round((payload?.calculatedPricePerKg || 100) * 0.95)
  );
  const [counterNote, setCounterNote] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);

  const weight = payload?.weightKg || 1;
  const counterTotal = Math.round(counterRate * weight);

  const handleAcceptClick = () => {
    playChime('success');
    onAccept(transaction.id);
  };

  const handleRejectClick = () => {
    playChime('click');
    onReject(transaction.id, rejectReason || 'Not matching intake specification');
  };

  const handleSendCounter = (e: React.FormEvent) => {
    e.preventDefault();
    playChime('success');
    onCounterOffer(transaction.id, counterRate, counterNote);
    setShowCounterForm(false);
  };

  return (
    <div
      id="incoming-request-modal-overlay"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="incoming-request-modal-content"
        className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-[#E5EAE7] flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-5 py-4 border-b border-[#E5EAE7] flex items-center justify-between z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase text-[#107C41] tracking-wider">
                {language === 'hi' ? 'पिकअप अनुरोध' : 'Pickup Request'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E8F5E9] text-[#107C41] font-bold">
                {transaction.id}
              </span>
            </div>
            <h2 className="text-lg font-black text-[#17231D] mt-0.5">
              {payload.classification?.confirmedCategory || 'Scrap Material'}
            </h2>
          </div>
          <button
            type="button"
            id="close-incoming-modal-btn"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#F3F6F4] hover:bg-[#E5EAE7] text-[#66736C] flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 flex-1">
          {/* Status Alert Banner */}
          {transaction.status === 'accepted' && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-800 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {language === 'hi'
                    ? 'यह अनुरोध स्वीकार कर लिया गया है। पिकअप निर्धारित है।'
                    : 'This request is accepted and pickup is scheduled.'}
                </span>
              </div>
              {onVerifyHandoverDirect && (
                <button
                  type="button"
                  onClick={() => onVerifyHandoverDirect(transaction.id)}
                  className="font-bold underline text-emerald-700 hover:text-emerald-900 cursor-pointer text-xs"
                >
                  {language === 'hi' ? 'हैंडओवर सत्यापित करें →' : 'Verify Handover →'}
                </button>
              )}
            </div>
          )}

          {transaction.counterOffer && transaction.counterOffer.status === 'pending' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 font-medium space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Counter-Offer Sent: ₹{transaction.counterOffer.counterPrice} (₹{transaction.counterOffer.counterPricePerKg}/kg)</span>
              </div>
              {transaction.counterOffer.note && (
                <p className="text-[11px] text-amber-700 italic pl-5">
                  "{transaction.counterOffer.note}"
                </p>
              )}
            </div>
          )}

          {/* Submitted Photo & Quality Rating */}
          <div className="relative rounded-2xl overflow-hidden border border-[#DCE3DD] bg-[#F3F6F4]">
            <img
              src={payload?.photoUrl || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80'}
              alt="Collector Scrap Item"
              className="w-full h-52 sm:h-56 object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80';
              }}
            />
            {/* AI Confidence & Quality Badges */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
              <span className="px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-xs text-white text-[11px] font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>AI Conf: {Math.round((payload?.classification?.confidence || 0.92) * 100)}%</span>
              </span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-600/90 text-white text-[11px] font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Quality {payload?.quality?.blurScore || 90}%</span>
              </span>
            </div>
          </div>

          {/* Weight, Condition & Estimated Valuation Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Weight Card */}
            <div className="p-3.5 rounded-2xl bg-[#F7FAF8] border border-[#E5EAE7]">
              <div className="flex items-center gap-1 text-[11px] font-bold text-[#66736C]">
                <Scale className="w-3.5 h-3.5 text-[#107C41]" />
                <span>{language === 'hi' ? 'वजन (किलो)' : 'Weight'}</span>
              </div>
              <p className="text-xl font-black text-[#17231D] mt-1">
                {payload?.weightKg || '0'} <span className="text-xs font-semibold text-[#8A968F]">kg</span>
              </p>
            </div>

            {/* Price Per Kg */}
            <div className="p-3.5 rounded-2xl bg-[#F7FAF8] border border-[#E5EAE7]">
              <div className="text-[11px] font-bold text-[#66736C]">
                {language === 'hi' ? 'सीपीसीबी दर / किलो' : 'Rate / Kg'}
              </div>
              <p className="text-xl font-black text-[#107C41] mt-1">
                ₹{Math.round(payload?.calculatedPricePerKg || 0)}
              </p>
            </div>

            {/* Total Estimated Payout */}
            <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-[#E8F5E9] border border-[#D0E7D7]">
              <div className="text-[11px] font-bold text-[#107C41]">
                {language === 'hi' ? 'कुल राशि (Payout)' : 'Total Payout'}
              </div>
              <p className="text-xl font-black text-[#107C41] mt-1">
                ₹{Math.round(payload?.totalEstimatedPrice || 0).toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {/* Physical Condition Inspection Details */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#E5EAE7] space-y-2">
            <h3 className="text-xs font-bold text-[#17231D] uppercase tracking-wide">
              {language === 'hi' ? 'भौतिक स्थिति व छंटाई' : 'Physical Condition & Sorting'}
            </h3>
            <div className="flex items-center gap-2 text-xs flex-wrap">
              <span className="px-2.5 py-1 rounded-full bg-[#F3F6F4] text-[#17231D] font-medium border border-[#E5EAE7]">
                Cleanliness: <strong className="capitalize">{payload?.condition?.cleanliness || 'Clean & Sorted'}</strong>
              </span>
              <span className="px-2.5 py-1 rounded-full bg-[#F3F6F4] text-[#17231D] font-medium border border-[#E5EAE7]">
                Structure: <strong className="capitalize">{payload?.condition?.structural || 'Intact'}</strong>
              </span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-medium border border-emerald-200">
                Landfill Diverted: <strong>{payload?.weightKg || 0} kg</strong>
              </span>
            </div>
          </div>

          {/* Collector Location & Contact Details */}
          <div className="p-4 rounded-2xl bg-white border border-[#E5EAE7] space-y-3">
            <h3 className="text-xs font-bold text-[#17231D] uppercase tracking-wide flex items-center justify-between">
              <span>{language === 'hi' ? 'कलेक्टर व पिकअप स्थान' : 'Collector & Pickup Location'}</span>
              <span className="text-[10px] font-bold text-[#107C41] bg-[#E8F5E9] px-2 py-0.5 rounded-md">
                ~1.8 km away
              </span>
            </h3>

            <div className="space-y-2 text-xs text-[#17231D]">
              <div className="flex items-start gap-2">
                <User className="w-4 h-4 text-[#107C41] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">
                    {transaction.ledgerBlock?.collectorName || 'Ramesh Kabadiwala'}
                  </span>
                  <span className="text-[11px] text-[#66736C] ml-2">
                    ID: {transaction.ledgerBlock?.collectorId || 'COL-4001'}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#107C41] shrink-0 mt-0.5" />
                <span className="text-[#475467]">
                  {collector?.collectorLandmark || 'Dharavi 90ft Road, Near Municipal School'}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs pt-1">
                <div className="flex items-center gap-1.5 text-[#66736C]">
                  <Calendar className="w-3.5 h-3.5 text-[#107C41]" />
                  <span>{collector?.date || 'Today'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#66736C]">
                  <Clock className="w-3.5 h-3.5 text-[#107C41]" />
                  <span>{collector?.timeSlot || '02:00 PM - 04:00 PM'}</span>
                </div>
              </div>
            </div>

            {/* Direct Call / Navigation buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-[#F3F6F4]">
              <a
                href={`tel:${collector?.contactNumber || '+919820011982'}`}
                className="flex-1 py-2 px-3 rounded-xl bg-[#F3F6F4] hover:bg-[#E5EAE7] text-[#17231D] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-[#107C41]" />
                <span>Call Collector</span>
              </a>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  collector?.collectorLandmark || 'Dharavi West Mumbai'
                )}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2 px-3 rounded-xl bg-[#F3F6F4] hover:bg-[#E5EAE7] text-[#17231D] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Navigation className="w-3.5 h-3.5 text-[#107C41]" />
                <span>Directions</span>
              </a>
            </div>
          </div>

          {/* Inline Counter-Offer Form */}
          {showCounterForm && (
            <form
              onSubmit={handleSendCounter}
              className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3 animate-in fade-in duration-200"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-amber-900">
                  {language === 'hi' ? 'जवाबी प्रस्ताव दें (Counter-Offer)' : 'Propose Counter-Offer'}
                </h4>
                <button
                  type="button"
                  onClick={() => setShowCounterForm(false)}
                  className="text-xs text-[#8A968F] hover:text-[#17231D]"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-900 mb-1">
                  Adjusted Rate per Kg (₹):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={counterRate}
                    onChange={(e) => setCounterRate(Number(e.target.value) || 0)}
                    className="w-32 h-10 px-3 bg-white border border-amber-300 rounded-xl text-sm font-black focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <span className="text-xs font-bold text-amber-900">
                    Total: ₹{counterTotal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-900 mb-1">
                  Reason / Note to Collector:
                </label>
                <input
                  type="text"
                  value={counterNote}
                  onChange={(e) => setCounterNote(e.target.value)}
                  placeholder="e.g. Higher plastic mix observed in photo"
                  className="w-full h-9 px-3 bg-white border border-amber-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full h-10 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Counter-Offer (₹{counterTotal})</span>
              </button>
            </form>
          )}

          {/* Inline Reject Box */}
          {showRejectBox && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-red-900">
                  {language === 'hi' ? 'अस्वीकार करने का कारण' : 'Reason for Rejection'}
                </h4>
                <button
                  type="button"
                  onClick={() => setShowRejectBox(false)}
                  className="text-xs text-[#8A968F] hover:text-[#17231D]"
                >
                  Cancel
                </button>
              </div>

              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-red-300 rounded-xl text-xs focus:outline-none"
              >
                <option value="">Select reason...</option>
                <option value="Material not within accepted CPCB authorization">
                  Material not within accepted CPCB authorization
                </option>
                <option value="Weight below minimum batch collection threshold">
                  Weight below minimum batch collection threshold
                </option>
                <option value="Pickup location outside operating territory">
                  Pickup location outside operating territory
                </option>
                <option value="Contaminated or hazardous battery damage">
                  Contaminated or hazardous battery damage
                </option>
              </select>

              <button
                type="button"
                onClick={handleRejectClick}
                className="w-full h-10 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <XCircle className="w-4 h-4" />
                <span>Confirm Rejection</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-md px-5 py-4 border-t border-[#E5EAE7] flex items-center gap-2.5">
          {transaction.status === 'accepted' ? (
            <div className="w-full flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-12 rounded-2xl bg-[#F3F6F4] hover:bg-[#E5EAE7] text-[#17231D] font-bold text-xs cursor-pointer"
              >
                {language === 'hi' ? 'बंद करें' : 'Close'}
              </button>
              {onVerifyHandoverDirect && (
                <button
                  type="button"
                  onClick={() => onVerifyHandoverDirect(transaction.id)}
                  className="flex-2 h-12 rounded-2xl bg-[#107C41] hover:bg-[#0E6C38] text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{language === 'hi' ? 'हैंडओवर सत्यापित करें' : 'Proceed to Handover'}</span>
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Reject Button */}
              {!showRejectBox && (
                <button
                  type="button"
                  id="modal-reject-pickup-btn"
                  onClick={() => {
                    setShowRejectBox(true);
                    setShowCounterForm(false);
                  }}
                  className="px-3.5 h-12 rounded-2xl border border-red-200 text-red-700 hover:bg-red-50 text-xs font-bold transition-colors cursor-pointer"
                >
                  {language === 'hi' ? 'अस्वीकार' : 'Reject'}
                </button>
              )}

              {/* Counter-Offer Button */}
              {!showCounterForm && !showRejectBox && (
                <button
                  type="button"
                  id="modal-counter-pickup-btn"
                  onClick={() => {
                    setShowCounterForm(true);
                    setShowRejectBox(false);
                  }}
                  className="px-3.5 h-12 rounded-2xl border border-amber-300 bg-amber-50/60 hover:bg-amber-100 text-amber-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  {language === 'hi' ? 'मोलभाव / Counter' : 'Counter-Offer'}
                </button>
              )}

              {/* Accept Pickup Primary Button */}
              {!showRejectBox && !showCounterForm && (
                <button
                  type="button"
                  id="modal-accept-pickup-btn"
                  onClick={handleAcceptClick}
                  className="flex-1 h-12 rounded-2xl bg-[#107C41] hover:bg-[#0E6C38] active:bg-[#0C5D30] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>{language === 'hi' ? 'पिकअप स्वीकार करें' : 'Accept Pickup'}</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
