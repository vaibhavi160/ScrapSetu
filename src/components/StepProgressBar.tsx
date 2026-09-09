import React from 'react';
import { 
  Home, Camera, Sparkles, Scale, IndianRupee, MapPin, 
  CheckCircle2, QrCode, CreditCard, History 
} from 'lucide-react';
import { Language } from '../types';

interface StepProgressBarProps {
  currentStep: number;
  totalSteps?: number;
  onNavigateStep?: (step: number) => void;
  onStepClick?: (step: number) => void;
  language: Language;
}

const STEP_DEFINITIONS = [
  { step: 1, icon: Home, labelEn: 'Home', labelHi: 'होम', labelMr: 'मुख्य' },
  { step: 2, icon: Camera, labelEn: 'Photo', labelHi: 'फोटो', labelMr: 'फोटो' },
  { step: 3, icon: Sparkles, labelEn: 'AI Sort', labelHi: 'वर्गीकरण', labelMr: 'वर्गीकरण' },
  { step: 4, icon: Scale, labelEn: 'Weight', labelHi: 'वजन', labelMr: 'वजन' },
  { step: 5, icon: IndianRupee, labelEn: 'Fair Price', labelHi: 'उचित भाव', labelMr: 'रास्त भाव' },
  { step: 6, icon: MapPin, labelEn: 'Recyclers', labelHi: 'रिसाइकलर', labelMr: 'रिसायकलर' },
  { step: 7, icon: CheckCircle2, labelEn: 'Pickup', labelHi: 'पिकअप', labelMr: 'पिकअप' },
  { step: 8, icon: QrCode, labelEn: 'Handover', labelHi: 'हैंडओवर', labelMr: 'हस्तांतरण' },
  { step: 9, icon: CreditCard, labelEn: 'Payment', labelHi: 'भुगतान', labelMr: 'पेमेंट' },
  { step: 10, icon: History, labelEn: 'Ledger', labelHi: 'लेजर', labelMr: 'बहीखाते' },
];

export const StepProgressBar: React.FC<StepProgressBarProps> = ({
  currentStep,
  totalSteps = 10,
  onNavigateStep,
  onStepClick,
  language,
}) => {
  const navigate = onStepClick || onNavigateStep;
  const currentDef = STEP_DEFINITIONS[currentStep - 1] || STEP_DEFINITIONS[0];
  const Icon = currentDef.icon;
  const stepTitle =
    language === 'hi'
      ? currentDef.labelHi
      : language === 'mr'
      ? currentDef.labelMr
      : currentDef.labelEn;

  return (
    <div className="bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-2.5 sticky top-[58px] z-20 transition-all">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
        {/* Step Badge & Name */}
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-[#0F1A3C] text-white flex items-center justify-center font-bold text-xs shadow-xs">
            {currentStep}
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium leading-none">
              {language === 'hi' ? 'चरण' : language === 'mr' ? 'पायरी' : 'Step'} {currentStep} of {totalSteps}
            </div>
            <div className="text-xs font-bold text-[#0F1A3C] flex items-center gap-1.5 leading-tight mt-0.5">
              <Icon className="w-3.5 h-3.5 text-[#E8433D]" />
              <span>{stepTitle}</span>
            </div>
          </div>
        </div>

        {/* 10 Step Interactive Indicator Bars */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-[220px] sm:max-w-xs scrollbar-none">
          {STEP_DEFINITIONS.map((s) => {
            const isCompleted = s.step < currentStep;
            const isCurrent = s.step === currentStep;

            return (
              <button
                key={s.step}
                id={`stepper-dot-${s.step}`}
                onClick={() => {
                  if (isCompleted && typeof navigate === 'function') {
                    navigate(s.step);
                  }
                }}
                disabled={!isCompleted && !isCurrent}
                title={`Step ${s.step}: ${s.labelEn}`}
                className={`transition-all rounded-full ${
                  isCurrent
                    ? 'w-6 h-2 bg-[#E8433D] shadow-xs'
                    : isCompleted
                    ? 'w-2.5 h-2 bg-[#0F1A3C] hover:bg-[#E8433D] cursor-pointer'
                    : 'w-2 h-2 bg-slate-200 cursor-not-allowed'
                }`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
