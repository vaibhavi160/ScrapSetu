import React, { useState } from 'react';
import { 
  CheckCircle2, Truck, Clock, MapPin, Phone, 
  Calendar, ShieldCheck, ArrowRight, IndianRupee 
} from 'lucide-react';
import { Language, Recycler, PickupSchedule } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { VoiceButton } from '../components/VoiceButton';
import { playChime } from '../utils/audioSpeech';

interface Step7AcceptPickupScreenProps {
  language: Language;
  selectedRecycler: Recycler;
  weightKg: number;
  totalOfferedPrice: number;
  collectorPhone: string;
  onConfirmPickup: (pickup: PickupSchedule) => void;
  onBack: () => void;
}

export const Step7AcceptPickupScreen: React.FC<Step7AcceptPickupScreenProps> = ({
  language,
  selectedRecycler,
  weightKg,
  totalOfferedPrice,
  collectorPhone,
  onConfirmPickup,
  onBack,
}) => {
  const t = TRANSLATIONS[language];

  const [pickupType, setPickupType] = useState<'immediate' | 'scheduled' | 'dropoff'>('immediate');
  const [scheduledDate, setScheduledDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [timeSlot, setTimeSlot] = useState<string>('10:00 AM - 12:00 PM');
  const [landmark, setLandmark] = useState<string>('Dharavi 90ft Road, Near Municipal School Gate 3');
  const [phone, setPhone] = useState<string>(collectorPhone || '+91 98200 11982');

  const handleConfirm = () => {
    playChime('success');
    onConfirmPickup({
      type: pickupType,
      date: pickupType === 'immediate' ? 'Today (Within 2 hrs)' : scheduledDate,
      timeSlot: pickupType === 'immediate' ? 'Immediate Vehicle Dispatch' : timeSlot,
      collectorLandmark: landmark,
      contactNumber: phone,
    });
  };

  const speechText =
    language === 'hi'
      ? `${selectedRecycler.name} से ₹${totalOfferedPrice} का ऑफर चुना गया है। पिकअप का तरीका चुनें, जैसे 2 घंटे में तुरंत गाड़ी या बाद का समय।`
      : language === 'mr'
      ? `${selectedRecycler.name} कडून ₹${totalOfferedPrice} ची ऑफर निवडली आहे. पिकअपची वेळ आणि ठिकाण ठरवून ऑर्डर पक्की करा.`
      : `Offer of ₹${totalOfferedPrice} confirmed from ${selectedRecycler.name}. Choose immediate doorstep pickup or schedule a convenient slot.`;

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#DDE6E0]">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#17231D] flex items-center gap-2.5">
            <CheckCircle2 className="w-6 h-6 text-[#176B45]" />
            <span>{t.acceptOffer}</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#66736C] mt-0.5">
            {language === 'hi' ? 'ऑफर की पुष्टि और पिकअप का समय' : 'Confirm Recycler Offer & Logistics'}
          </p>
        </div>
        <VoiceButton textToSpeak={speechText} language={language} label={t.listenAudio} size="md" />
      </div>

      {/* Recycler Summary Card */}
      <div className="bg-white rounded-2xl border border-[#DDE6E0] p-5 sm:p-6 space-y-5 shadow-xs">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base sm:text-lg text-[#17231D]">{selectedRecycler.name}</h3>
              <ShieldCheck className="w-5 h-5 text-[#16834A]" />
            </div>
            <p className="text-xs sm:text-sm text-[#66736C] mt-0.5">{selectedRecycler.address}</p>
            <p className="text-xs font-mono text-[#176B45] font-semibold mt-1">
              {selectedRecycler.cpcbRegNumber}
            </p>
          </div>

          <div className="text-right shrink-0">
            <span className="text-xs text-[#66736C] block font-medium">{language === 'hi' ? 'तय राशि' : 'Agreed Amount'}</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-[#176B45] tabular-nums">₹{totalOfferedPrice}</span>
          </div>
        </div>

        {/* Pickup Type Options */}
        <div className="space-y-3 pt-3 border-t border-[#DDE6E0]">
          <label className="text-xs sm:text-sm font-bold text-[#17231D] block">
            {language === 'hi' ? 'पिकअप का तरीका चुनें:' : 'Select Handover Method:'}
          </label>

          <div className="space-y-3">
            {/* Immediate Doorstep */}
            <button
              id="pickup-immediate-btn"
              type="button"
              onClick={() => {
                playChime('click');
                setPickupType('immediate');
              }}
              className={`w-full p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 cursor-pointer ${
                pickupType === 'immediate'
                  ? 'border-2 border-[#176B45] bg-[#EAF6EF] shadow-xs'
                  : 'border-[#DDE6E0] bg-white hover:bg-[#F7F9F8]'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-white text-[#176B45] border border-[#DDE6E0] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                <Truck className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-bold text-[#17231D]">{t.immediatePickup}</span>
                  <span className="text-[11px] bg-[#176B45] text-white font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                    2 Hours ETA
                  </span>
                </div>
                <p className="text-xs text-[#66736C] mt-1">
                  {language === 'hi'
                    ? 'अधिकृत वाहन आपके गोदाम / दुकान पर तुरंत रवाना होगा।'
                    : 'Authorized electric vehicle dispatched to your scrap depot.'}
                </p>
              </div>
            </button>

            {/* Scheduled Later */}
            <button
              id="pickup-scheduled-btn"
              type="button"
              onClick={() => {
                playChime('click');
                setPickupType('scheduled');
              }}
              className={`w-full p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 cursor-pointer ${
                pickupType === 'scheduled'
                  ? 'border-2 border-[#176B45] bg-[#EAF6EF] shadow-xs'
                  : 'border-[#DDE6E0] bg-white hover:bg-[#F7F9F8]'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-white text-[#176B45] border border-[#DDE6E0] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <span className="text-xs sm:text-sm font-bold text-[#17231D]">{t.schedulePickup}</span>
                <p className="text-xs text-[#66736C] mt-1">
                  {language === 'hi'
                    ? 'अपनी सुविधानुसार कल या आगामी तिथि तय करें।'
                    : 'Pick a specific date & time slot for collection.'}
                </p>
              </div>
            </button>

            {/* Depot Dropoff */}
            <button
              id="pickup-dropoff-btn"
              type="button"
              onClick={() => {
                playChime('click');
                setPickupType('dropoff');
              }}
              className={`w-full p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 cursor-pointer ${
                pickupType === 'dropoff'
                  ? 'border-2 border-[#176B45] bg-[#EAF6EF] shadow-xs'
                  : 'border-[#DDE6E0] bg-white hover:bg-[#F7F9F8]'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-white text-[#176B45] border border-[#DDE6E0] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <span className="text-xs sm:text-sm font-bold text-[#17231D]">{t.depotDropoff}</span>
                <p className="text-xs text-[#66736C] mt-1">
                  {language === 'hi'
                    ? 'आप खुद माल लेकर उनके अधिकृत केंद्र पहुंचेंगे।'
                    : 'Directly deliver materials to recycler weighbridge.'}
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Dynamic Schedule Slot Form if Scheduled */}
        {pickupType === 'scheduled' && (
          <div className="p-4 bg-[#F7F9F8] rounded-xl border border-[#DDE6E0] space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#66736C] block mb-1.5">
                  {language === 'hi' ? 'तारीख' : 'Date'}
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full text-xs sm:text-sm p-3 bg-white border border-[#DDE6E0] rounded-xl text-[#17231D] focus:ring-1 focus:ring-[#176B45] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#66736C] block mb-1.5">
                  {language === 'hi' ? 'समय' : 'Slot'}
                </label>
                <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full text-xs sm:text-sm p-3 bg-white border border-[#DDE6E0] rounded-xl text-[#17231D] focus:ring-1 focus:ring-[#176B45] outline-none"
                >
                  <option>09:00 AM - 11:00 AM</option>
                  <option>11:00 AM - 01:00 PM</option>
                  <option>02:00 PM - 04:00 PM</option>
                  <option>04:00 PM - 06:00 PM</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Landmark & Contact Phone */}
        <div className="space-y-3 pt-2">
          <div>
            <label className="text-xs sm:text-sm font-bold text-[#17231D] flex items-center gap-1.5 mb-1.5">
              <MapPin className="w-4 h-4 text-[#176B45]" />
              <span>{t.pickupAddress}</span>
            </label>
            <input
              id="input-pickup-landmark"
              type="text"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="e.g. Dharavi 90ft Road, Opp Bank, Shed #12"
              className="w-full p-3 bg-white border border-[#DDE6E0] rounded-xl text-xs sm:text-sm font-medium text-[#17231D] focus:ring-2 focus:ring-[#176B45]/20 focus:border-[#176B45] outline-none transition-all"
            />
          </div>

          <div>
            <label className="text-xs sm:text-sm font-bold text-[#17231D] flex items-center gap-1.5 mb-1.5">
              <Phone className="w-4 h-4 text-[#176B45]" />
              <span>{t.phonePrompt}</span>
            </label>
            <input
              id="input-collector-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98200 00000"
              className="w-full p-3 bg-white border border-[#DDE6E0] rounded-xl text-xs sm:text-sm font-medium text-[#17231D] focus:ring-2 focus:ring-[#176B45]/20 focus:border-[#176B45] outline-none transition-all"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3 pt-3">
          <button
            id="pickup-back-btn"
            onClick={onBack}
            className="py-3 px-5 bg-[#F7F9F8] hover:bg-gray-100 text-[#17231D] border border-[#DDE6E0] rounded-xl font-bold text-xs sm:text-sm cursor-pointer transition-colors"
          >
            {t.back}
          </button>

          <button
            id="btn-confirm-pickup-order"
            onClick={handleConfirm}
            className="flex-1 py-3 px-5 bg-[#176B45] hover:bg-[#238B5A] text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xs hover:shadow-md transition-all"
          >
            <span>{t.confirmOfferBtn}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
