import React, { useState } from 'react';
import { Truck, Building2, ShieldCheck, ArrowRight, Volume2, Sparkles, CheckCircle2 } from 'lucide-react';
import { Language, SelectedRole } from '../types';
import { speakText, playChime } from '../utils/audioSpeech';

interface RoleSelectionScreenProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onSelectRole: (role: SelectedRole) => void;
  initialRole?: SelectedRole;
}

export const RoleSelectionScreen: React.FC<RoleSelectionScreenProps> = ({
  language,
  onLanguageChange,
  onSelectRole,
  initialRole = 'collector',
}) => {
  const [selectedRole, setSelectedRole] = useState<SelectedRole>(initialRole);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);

  const t = {
    title: {
      en: 'Choose Your Role',
      hi: 'अपनी भूमिका चुनें',
      mr: 'तुमची भूमिका निवडा',
    },
    subtitle: {
      en: 'Select how you will participate in the digital recycling network',
      hi: 'डिजिटल रीसाइक्लिंग नेटवर्क में आप किस रूप में जुड़ना चाहते हैं?',
      mr: 'डिजिटल रिसायकलिंग नेटवर्कमध्ये तुमचा सहभाग कसा असेल ते निवडा',
    },
    collectorTitle: {
      en: 'Collector',
      hi: 'कबाड़ी / कचरा संग्रहकर्ता (Collector)',
      mr: 'कचरा गोळा करणारे / कबाडी (Collector)',
    },
    collectorDesc: {
      en: 'Sell scrap, track earnings',
      hi: 'कचरा बेचें, पारदर्शी कमाई ट्रैक करें',
      mr: 'कचरा विका, पारदर्शक कमाई ट्रॅक करा',
    },
    collectorDetail: {
      en: 'For informal waste collectors, scrap dealers & local aggregators. Instant AI classification and direct CPCB fair pricing.',
      hi: 'अनौपचारिक कचरा बीनने वाले, कबाड़ी भाई और स्क्रैप दुकानदारों के लिए। तुरंत एआई पहचान और सीधे उचित मूल्य।',
      mr: 'कचरा गोळा करणारे, कबाडी आणि स्क्रॅप विक्रेत्यांसाठी. थेट योग्य भाव आणि वजन पडताळणी.',
    },
    collectorPills: {
      en: ['Fair CPCB Rates', 'Direct UPI Payout', 'Daily Ledger'],
      hi: ['उचित सरकारी दर', 'सीधा यूपीआई भुगतान', 'दैनिक बहीखाता'],
      mr: ['योग्य सरकारी दर', 'थेट यूपीआई पेमेंट', 'दैनिक हिशोब'],
    },
    recyclerTitle: {
      en: 'Recycler',
      hi: 'अधिकृत रीसाइक्लर (Recycler)',
      mr: 'अधिकृत रिसायकलर (Recycler)',
    },
    recyclerDesc: {
      en: 'Manage pickups, verify handovers',
      hi: 'पिकअप प्रबंधित करें, हैंडओवर सत्यापित करें',
      mr: 'पिकअप व्यवस्थापन करा, हस्तांतरण पडताळा',
    },
    recyclerDetail: {
      en: 'For CPCB/SPCB authorized recyclers, registered dismantling units, and EPR producer stakeholders.',
      hi: 'सीपीसीबी / एसपीसीबी अधिकृत रीसाइक्लिंग केंद्र और ईपीआर (EPR) उत्पादकों के लिए। डिजिटल हैंडओवर व अनुपालन रिपोर्ट।',
      mr: 'सीपीसीबी अधिकृत रिसायकलिंग केंद्र आणि ईपीआर उत्पादकांसाठी. डिजिटल ट्रॅकिंग आणि कायदेशीर अहवाल.',
    },
    recyclerPills: {
      en: ['Pickup Management', 'Digital Handover', 'EPR Compliance'],
      hi: ['पिकअप प्रबंधन', 'डिजिटल हैंडओवर', 'EPR अनुपालन'],
      mr: ['पिकअप व्यवस्थापन', 'डिजिटल हस्तांतरण', 'EPR अहवाल'],
    },
    continueBtn: {
      en: 'Continue to Login / Register',
      hi: 'आगे बढ़ें (Login / Register)',
      mr: 'पुढे जा (Login / Register)',
    },
    tapToListen: {
      en: 'Tap to listen in audio',
      hi: 'सुनने के लिए टैप करें',
      mr: 'ऐकण्यासाठी टॅप करा',
    },
  };

  const handlePlayVoice = async () => {
    setIsPlayingVoice(true);
    let speech = '';
    if (language === 'hi') {
      speech =
        'कृपया अपनी भूमिका चुनें। पहला: कबाड़ी भाई, यानी कलेक्टर। कचरा बेचें और सीधी कमाई पाएं। दूसरा: अधिकृत रीसाइक्लर। पिकअप प्रबंधित करें और डिजिटल हैंडओवर सत्यापित करें।';
    } else if (language === 'mr') {
      speech =
        'कृपया तुमची भूमिका निवडा. पहिले: कबाडी किंवा कलेक्टर. कचरा विका आणि योग्य कमाई मिळवा. दुसरे: अधिकृत रिसायकलर. पिकअप व्यवस्थापित करा आणि डिजिटल पावती द्या.';
    } else {
      speech =
        'Please choose your role. One: Collector, to sell scrap and track fair earnings. Two: Authorized Recycler, to manage pickups, verify handovers, and generate EPR records.';
    }
    await speakText(speech, language);
    setIsPlayingVoice(false);
  };

  const handleCardClick = (role: SelectedRole) => {
    playChime('click');
    setSelectedRole(role);
  };

  const handleContinue = (roleToUse?: SelectedRole) => {
    const finalRole = roleToUse || selectedRole;
    playChime('success');
    onSelectRole(finalRole);
  };

  return (
    <main
      id="role-selection-screen"
      className="min-h-screen bg-[#F8F9FD] flex flex-col justify-between p-4 sm:p-6 text-[#111827]"
    >
      {/* Top Bar: Brand, Audio Guidance, Language */}
      <div className="max-w-md sm:max-w-xl w-full mx-auto flex items-center justify-between py-2">
        {/* Logo / Brand */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-[#0F1A3C] p-1.5 flex items-center justify-center shadow-xs">
            <img
              src="/logo-icon.png"
              alt="ScrapSetu"
              className="w-full h-full object-contain brightness-0 invert"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/ScrapSetu.png';
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-[#0F1A3C] text-lg tracking-tight">ScrapSetu</span>
              <span className="text-[10px] px-2 py-0.5 bg-[#EEF1F8] text-[#0F1A3C] font-bold rounded-full border border-slate-200">
                सेतु
              </span>
            </div>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2">
          {/* Audio voice assistance button */}
          <button
            type="button"
            id="role-audio-assist-btn"
            onClick={handlePlayVoice}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isPlayingVoice
                ? 'bg-[#E8433D] text-white ring-4 ring-[#E8433D]/20 animate-pulse'
                : 'bg-white hover:bg-[#EEF1F8] text-[#0F1A3C] border border-slate-200 shadow-2xs'
            }`}
            title={t.tapToListen[language]}
            aria-label={t.tapToListen[language]}
          >
            <Volume2 className="w-4 h-4" />
          </button>

          {/* Language selector */}
          <div className="inline-flex items-center bg-white p-1 rounded-full border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => onLanguageChange('hi')}
              className={`px-2.5 py-1 text-xs font-bold rounded-full transition-all cursor-pointer ${
                language === 'hi' ? 'bg-[#E8433D] text-white shadow-xs' : 'text-slate-600 hover:text-[#0F1A3C]'
              }`}
            >
              हिन्दी
            </button>
            <button
              type="button"
              onClick={() => onLanguageChange('mr')}
              className={`px-2.5 py-1 text-xs font-bold rounded-full transition-all cursor-pointer ${
                language === 'mr' ? 'bg-[#E8433D] text-white shadow-xs' : 'text-slate-600 hover:text-[#0F1A3C]'
              }`}
            >
              मराठी
            </button>
            <button
              type="button"
              onClick={() => onLanguageChange('en')}
              className={`px-2.5 py-1 text-xs font-bold rounded-full transition-all cursor-pointer ${
                language === 'en' ? 'bg-[#E8433D] text-white shadow-xs' : 'text-slate-600 hover:text-[#0F1A3C]'
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-md sm:max-w-xl w-full mx-auto my-auto py-4 space-y-6">
        {/* Heading & Instructions */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EEF1F8] border border-slate-200 text-[#0F1A3C] rounded-full text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-[#E8433D]" />
            <span>SIH 2026 • CPCB Digital Framework</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0F1A3C]">
            {t.title[language]}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            {t.subtitle[language]}
          </p>
        </div>

        {/* 2 Big Tappable Role Cards */}
        <div className="grid grid-cols-1 gap-4 pt-2">
          {/* OPTION 1: COLLECTOR */}
          <button
            type="button"
            id="role-option-collector"
            onClick={() => handleCardClick('collector')}
            className={`w-full text-left p-5 sm:p-6 rounded-3xl transition-all cursor-pointer relative border-2 ${
              selectedRole === 'collector'
                ? 'bg-white border-[#0F1A3C] shadow-lg ring-2 ring-[#0F1A3C]/10'
                : 'bg-white/80 hover:bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
            }`}
          >
            {/* Active Radio / Check Indicator */}
            <div className="absolute top-4 right-4">
              {selectedRole === 'collector' ? (
                <div className="w-7 h-7 rounded-full bg-[#E8433D] text-white flex items-center justify-center shadow-xs">
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full border-2 border-slate-300 bg-white" />
              )}
            </div>

            <div className="flex items-start gap-4">
              {/* Icon Container */}
              <div
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shrink-0 transition-transform ${
                  selectedRole === 'collector'
                    ? 'bg-[#0F1A3C] text-white shadow-md scale-105'
                    : 'bg-[#EEF1F8] text-[#0F1A3C]'
                }`}
              >
                <Truck className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.2]" />
              </div>

              {/* Text Info */}
              <div className="flex-1 pr-6">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-black text-[#0F1A3C] tracking-tight">
                    {t.collectorTitle[language]}
                  </h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#EEF1F8] text-[#0F1A3C] font-bold border border-slate-200">
                    For Waste Sellers
                  </span>
                </div>

                {/* Short One-Line Description (Requested) */}
                <p className="text-sm font-bold text-[#E8433D] mt-1">
                  {t.collectorDesc[language]}
                </p>

                {/* Explanatory details */}
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-2">
                  {t.collectorDetail[language]}
                </p>

                {/* Feature Pills */}
                <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                  {t.collectorPills[language].map((pill, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#EEF1F8] text-slate-700 font-semibold border border-slate-200"
                    >
                      {pill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </button>

          {/* OPTION 2: RECYCLER */}
          <button
            type="button"
            id="role-option-recycler"
            onClick={() => handleCardClick('recycler')}
            className={`w-full text-left p-5 sm:p-6 rounded-3xl transition-all cursor-pointer relative border-2 ${
              selectedRole === 'recycler'
                ? 'bg-white border-[#0F1A3C] shadow-lg ring-2 ring-[#0F1A3C]/10'
                : 'bg-white/80 hover:bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
            }`}
          >
            {/* Active Radio / Check Indicator */}
            <div className="absolute top-4 right-4">
              {selectedRole === 'recycler' ? (
                <div className="w-7 h-7 rounded-full bg-[#E8433D] text-white flex items-center justify-center shadow-xs">
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full border-2 border-slate-300 bg-white" />
              )}
            </div>

            <div className="flex items-start gap-4">
              {/* Icon Container */}
              <div
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shrink-0 transition-transform ${
                  selectedRole === 'recycler'
                    ? 'bg-[#0F1A3C] text-white shadow-md scale-105'
                    : 'bg-[#EEF1F8] text-[#0F1A3C]'
                }`}
              >
                <div className="relative">
                  <Building2 className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.2]" />
                  <ShieldCheck className="w-4 h-4 absolute -bottom-1 -right-1 text-[#E8433D]" />
                </div>
              </div>

              {/* Text Info */}
              <div className="flex-1 pr-6">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-black text-[#0F1A3C] tracking-tight">
                    {t.recyclerTitle[language]}
                  </h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#EEF1F8] text-[#0F1A3C] font-bold border border-slate-200">
                    CPCB Certified
                  </span>
                </div>

                {/* Short One-Line Description (Requested) */}
                <p className="text-sm font-bold text-[#E8433D] mt-1">
                  {t.recyclerDesc[language]}
                </p>

                {/* Explanatory details */}
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-2">
                  {t.recyclerDetail[language]}
                </p>

                {/* Feature Pills */}
                <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                  {t.recyclerPills[language].map((pill, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#EEF1F8] text-slate-700 font-semibold border border-slate-200"
                    >
                      {pill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Primary Action Button */}
        <div className="pt-2">
          <button
            type="button"
            id="role-selection-continue-btn"
            onClick={() => handleContinue()}
            className="w-full h-13 sm:h-14 rounded-2xl bg-[#E8433D] hover:bg-[#D33832] active:bg-[#B92A25] text-white font-black text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer group"
          >
            <span>
              {selectedRole === 'collector'
                ? language === 'hi'
                  ? 'कलेक्टर पोर्टल में जारी रखें'
                  : 'Continue as Collector'
                : language === 'hi'
                ? 'रीसाइक्लर पोर्टल में जारी रखें'
                : 'Continue as Recycler'}
            </span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="text-[11px] text-center text-slate-400 mt-2 font-medium">
            {language === 'hi'
              ? 'आप ऐप के अंदर कभी भी अपनी भूमिका बदल सकते हैं'
              : 'You can switch your role anytime from within the app'}
          </p>
        </div>
      </div>

      {/* Footer / CPCB Trust Seal */}
      <footer className="max-w-md sm:max-w-xl w-full mx-auto py-3 text-center border-t border-slate-200">
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-[#E8433D]" />
          <span>Central Pollution Control Board (CPCB) • Smart India Hackathon 2026</span>
        </div>
      </footer>
    </main>
  );
};
