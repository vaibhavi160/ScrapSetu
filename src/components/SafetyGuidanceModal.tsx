import React from 'react';
import { 
  ShieldAlert, Flame, AlertTriangle, Eye, CheckCircle2, 
  XCircle, X, Volume2, ShieldCheck, Heart 
} from 'lucide-react';
import { Language, SafetyTip } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { SAFETY_TIPS } from '../data/mockData';
import { VoiceButton } from './VoiceButton';

interface SafetyGuidanceModalProps {
  language: Language;
  onClose: () => void;
}

export const SafetyGuidanceModal: React.FC<SafetyGuidanceModalProps> = ({
  language,
  onClose,
}) => {
  const t = TRANSLATIONS[language];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs overflow-y-auto p-3 sm:p-4 flex flex-col items-center justify-center">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 border border-[#DDE6E0] shadow-xl my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#DDE6E0] pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FEF6E9] text-[#E59A23] border border-[#E59A23]/30 flex items-center justify-center shadow-xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-[#17231D]">
                {language === 'hi'
                  ? 'कबाड़ी सुरक्षा नियम व ऑडियो मार्गदर्शन'
                  : language === 'mr'
                  ? 'कबाडी सुरक्षा नियम आणि ऑडिओ'
                  : 'Safety Guidance (Pictorial & Audio)'}
              </h3>
              <p className="text-xs text-[#66736C]">
                {language === 'hi' ? 'स्वास्थ्य रक्षा एवं सुरक्षित कबाड़ प्रबंधन' : 'Health protection & toxic hazard prevention'}
              </p>
            </div>
          </div>
          <button
            id="close-safety-modal-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F7F9F8] hover:bg-gray-200 flex items-center justify-center text-[#17231D] cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Safety Tips Cards */}
        <div className="space-y-3.5">
          {SAFETY_TIPS.map((tip) => {
            const title = language === 'hi' ? tip.titleHi : language === 'mr' ? tip.titleMr : tip.titleEn;
            const body = language === 'hi' ? tip.bodyHi : language === 'mr' ? tip.bodyMr : tip.bodyEn;
            const doText = language === 'hi' ? tip.doTextHi : language === 'mr' ? tip.doTextMr : tip.doTextEn;
            const dontText = language === 'hi' ? tip.dontTextHi : language === 'mr' ? tip.dontTextMr : tip.dontTextEn;

            const fullSpeech = `${title}. ${body}. ${language === 'hi' ? 'क्या करें' : 'Do'}: ${doText}. ${language === 'hi' ? 'क्या न करें' : 'Don\'t'}: ${dontText}`;

            return (
              <div
                key={tip.id}
                className="bg-[#F7F9F8] rounded-xl border border-[#DDE6E0] p-4 space-y-3"
              >
                {/* Tip Header with Voice Readout */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#E59A23] text-white flex items-center justify-center shrink-0">
                      {tip.hazardIcon === 'Flame' && <Flame className="w-4 h-4" />}
                      {tip.hazardIcon === 'AlertTriangle' && <AlertTriangle className="w-4 h-4" />}
                      {tip.hazardIcon === 'Eye' && <Eye className="w-4 h-4" />}
                      {tip.hazardIcon === 'ShieldAlert' && <ShieldCheck className="w-4 h-4" />}
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold text-[#E59A23] block uppercase tracking-wider">
                        {tip.category} Hazard
                      </span>
                      <h4 className="font-extrabold text-xs sm:text-sm text-[#17231D] leading-tight">
                        {title}
                      </h4>
                    </div>
                  </div>

                  <VoiceButton textToSpeak={fullSpeech} language={language} label="Audio" size="sm" />
                </div>

                <p className="text-xs text-[#66736C] leading-relaxed">{body}</p>

                {/* DO and DONT pictorial comparison */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs pt-1">
                  {/* DO */}
                  <div className="p-3 bg-[#EAF6EF] rounded-xl border border-[#176B45]/20 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-[#16834A] text-xs">
                      <CheckCircle2 className="w-4 h-4 text-[#16834A]" />
                      <span>{language === 'hi' ? 'यह करें (DO)' : 'DO THIS'}</span>
                    </div>
                    <p className="text-xs text-[#17231D] leading-normal">{doText}</p>
                  </div>

                  {/* DONT */}
                  <div className="p-3 bg-[#FDF2F2] rounded-xl border border-[#D64545]/20 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-[#D64545] text-xs">
                      <XCircle className="w-4 h-4 text-[#D64545]" />
                      <span>{language === 'hi' ? 'यह कभी न करें (DON\'T)' : 'DO NOT'}</span>
                    </div>
                    <p className="text-xs text-[#D64545] leading-normal">{dontText}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-[#176B45] hover:bg-[#238B5A] text-white rounded-xl font-bold text-xs sm:text-sm cursor-pointer shadow-xs hover:shadow-md transition-all"
        >
          {t.close}
        </button>
      </div>
    </div>
  );
};
