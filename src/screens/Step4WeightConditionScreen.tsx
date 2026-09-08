import React, { useState } from 'react';
import { Scale, Sparkles, ArrowRight, Plus, Minus, Check, AlertCircle } from 'lucide-react';
import { Language, WasteCategory } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { WASTE_CATEGORIES } from '../data/mockData';
import { VoiceButton } from '../components/VoiceButton';
import { playChime } from '../utils/audioSpeech';

interface Step4WeightConditionScreenProps {
  language: Language;
  category: WasteCategory;
  initialWeight?: number;
  onWeightConditionConfirmed?: (weightKg: number, condition: { cleanliness: 'clean' | 'dirty'; structural: 'intact' | 'damaged' }) => void;
  onConfirmWeightCondition?: (weightKg: number, condition: { cleanliness: 'clean' | 'dirty'; structural: 'intact' | 'damaged' }) => void;
  onBack: () => void;
}

export const Step4WeightConditionScreen: React.FC<Step4WeightConditionScreenProps> = ({
  language,
  category,
  initialWeight = 12.0,
  onWeightConditionConfirmed,
  onConfirmWeightCondition,
  onBack,
}) => {
  const t = TRANSLATIONS[language];
  const confirmWeightCallback = onWeightConditionConfirmed || onConfirmWeightCondition;
  const catInfo = WASTE_CATEGORIES.find((c) => c.id === category) || WASTE_CATEGORIES[0];

  const [weight, setWeight] = useState<number>(initialWeight);
  const [cleanliness, setCleanliness] = useState<'clean' | 'dirty'>('clean');
  const [structural, setStructural] = useState<'intact' | 'damaged'>('intact');

  const handleAdjustWeight = (delta: number) => {
    playChime('click');
    setWeight((prev) => {
      const next = Math.max(0.5, Math.min(500, Math.round((prev + delta) * 10) / 10));
      return next;
    });
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setWeight(Math.round(val * 10) / 10);
  };

  const handleProceed = () => {
    playChime('click');
    if (confirmWeightCallback) {
      confirmWeightCallback(weight, { cleanliness, structural });
    }
  };

  // Condition multiplier
  let conditionMultiplier = 1.0;
  if (cleanliness === 'clean') conditionMultiplier += 0.1;
  else conditionMultiplier -= 0.1;

  if (structural === 'damaged') conditionMultiplier -= 0.15;

  const speechText =
    language === 'hi'
      ? `वजन और हालत दर्ज करें। वर्तमान वजन ${weight} किलोग्राम है। साफ और छांटा हुआ कबाड़ होने पर दस प्रतिशत अतिरिक्त बोनस मिलता है।`
      : language === 'mr'
      ? `वजन आणि स्थिती नोंदवा. सध्याचे वजन ${weight} किलो आहे. स्वच्छ भंगार असल्यास दहा टक्के जास्त मोबदला मिळतो.`
      : `Enter weight and condition. Current weight is ${weight} kilograms. Clean sorted scrap earns a ten percent bonus.`;

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#DDE6E0]">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#17231D] flex items-center gap-2.5">
            <Scale className="w-6 h-6 text-[#176B45]" />
            <span>{t.enterWeight}</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#66736C] mt-0.5">
            {language === 'hi' ? `श्रेणी: ${catInfo.nameHi}` : `Selected Stream: ${catInfo.nameEn}`}
          </p>
        </div>
        <VoiceButton textToSpeak={speechText} language={language} label={t.listenAudio} size="md" />
      </div>

      {/* Main Weight Input Card */}
      <div className="bg-white rounded-2xl border border-[#DDE6E0] p-5 sm:p-6 space-y-6 shadow-xs">
        <div className="text-center space-y-3">
          <span className="text-xs sm:text-sm font-semibold text-[#66736C]">
            {t.weightKg}
          </span>

          {/* Large Touch Display */}
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            <button
              id="weight-minus-btn"
              onClick={() => handleAdjustWeight(-1)}
              className="w-14 h-14 rounded-2xl bg-[#F7F9F8] hover:bg-gray-100 border border-[#DDE6E0] text-[#17231D] flex items-center justify-center font-bold text-2xl cursor-pointer transition-colors shadow-xs"
            >
              <Minus className="w-6 h-6" />
            </button>

            <div className="min-w-[180px] py-3 px-6 rounded-2xl bg-[#F7F9F8] border border-[#DDE6E0] text-center shadow-inner">
              <span className="text-4xl sm:text-5xl font-extrabold text-[#17231D] tabular-nums">
                {weight.toFixed(1)}
              </span>
              <span className="text-base font-bold text-[#66736C] ml-2">kg</span>
            </div>

            <button
              id="weight-plus-btn"
              onClick={() => handleAdjustWeight(1)}
              className="w-14 h-14 rounded-2xl bg-[#F7F9F8] hover:bg-gray-100 border border-[#DDE6E0] text-[#17231D] flex items-center justify-center font-bold text-2xl cursor-pointer transition-colors shadow-xs"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          {/* Slider */}
          <div className="px-2 pt-3 max-w-md mx-auto">
            <input
              id="weight-slider"
              type="range"
              min="0.5"
              max="100"
              step="0.5"
              value={weight}
              onChange={handleSliderChange}
              className="w-full h-2.5 bg-[#DDE6E0] rounded-lg appearance-none cursor-pointer accent-[#176B45]"
            />
            <div className="flex justify-between text-xs text-[#66736C] font-medium mt-1.5">
              <span>0.5 kg</span>
              <span>25 kg</span>
              <span>50 kg</span>
              <span>100+ kg</span>
            </div>
          </div>

          {/* Quick Add Buttons */}
          <div className="pt-2">
            <span className="text-xs font-semibold text-[#66736C] block mb-2">
              {t.quickAdd}:
            </span>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {[+1, +5, +10, +25].map((delta) => (
                <button
                  key={delta}
                  id={`quick-add-${delta}`}
                  onClick={() => handleAdjustWeight(delta)}
                  className="px-4 py-2 bg-[#EAF6EF] hover:bg-[#d8ebd0] border border-[#176B45]/20 rounded-xl text-xs font-bold text-[#176B45] cursor-pointer transition-colors shadow-xs"
                >
                  +{delta} kg
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Condition Rating 1: Cleanliness */}
        <div className="border-t border-[#DDE6E0] pt-4 space-y-2.5">
          <label className="text-xs sm:text-sm font-bold text-[#17231D] flex items-center gap-2">
            <span>{t.cleanliness}</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              id="cleanliness-clean-btn"
              type="button"
              onClick={() => {
                playChime('click');
                setCleanliness('clean');
              }}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                cleanliness === 'clean'
                  ? 'border-[#176B45] bg-[#EAF6EF] shadow-xs'
                  : 'border-[#DDE6E0] hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-[#17231D]">{t.cleanSorted}</span>
                {cleanliness === 'clean' && <Check className="w-5 h-5 text-[#16834A]" />}
              </div>
              <p className="text-xs text-[#16834A] font-semibold mt-1">
                {language === 'hi' ? 'धूल व अन्य कचरे से मुक्त (+10% बोनस)' : 'Sorted cleanly (+10% bonus)'}
              </p>
            </button>

            <button
              id="cleanliness-dirty-btn"
              type="button"
              onClick={() => {
                playChime('click');
                setCleanliness('dirty');
              }}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                cleanliness === 'dirty'
                  ? 'border-[#E59A23] bg-[#FEF6E9] shadow-xs'
                  : 'border-[#DDE6E0] hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-[#17231D]">{t.dirtyMixed}</span>
                {cleanliness === 'dirty' && <Check className="w-5 h-5 text-[#E59A23]" />}
              </div>
              <p className="text-xs text-[#E59A23] font-semibold mt-1">
                {language === 'hi' ? 'मिलावट या मिट्टी युक्त' : 'Needs sorting / contaminated'}
              </p>
            </button>
          </div>
        </div>

        {/* Condition Rating 2: Physical State */}
        <div className="space-y-2.5">
          <label className="text-xs sm:text-sm font-bold text-[#17231D] flex items-center gap-2">
            <span>{t.structuralCondition}</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              id="condition-intact-btn"
              type="button"
              onClick={() => {
                playChime('click');
                setStructural('intact');
              }}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                structural === 'intact'
                  ? 'border-[#176B45] bg-[#EAF6EF] shadow-xs'
                  : 'border-[#DDE6E0] hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-[#17231D]">{t.intactDry}</span>
                {structural === 'intact' && <Check className="w-5 h-5 text-[#16834A]" />}
              </div>
              <p className="text-xs text-[#66736C] mt-1">
                {language === 'hi' ? 'पूरा भाग सुरक्षित / सूखा' : 'No acid leakage / dry'}
              </p>
            </button>

            <button
              id="condition-damaged-btn"
              type="button"
              onClick={() => {
                playChime('click');
                setStructural('damaged');
              }}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                structural === 'damaged'
                  ? 'border-[#E59A23] bg-[#FEF6E9] shadow-xs'
                  : 'border-[#DDE6E0] hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-[#17231D]">{t.damagedCorroded}</span>
                {structural === 'damaged' && <Check className="w-5 h-5 text-[#E59A23]" />}
              </div>
              <p className="text-xs text-[#66736C] mt-1">
                {language === 'hi' ? 'टूटा हुआ / जंग लगा' : 'Broken / corroded scrap'}
              </p>
            </button>
          </div>
        </div>

        {/* Condition Impact Banner */}
        <div className="p-3.5 bg-[#F7F9F8] rounded-xl border border-[#DDE6E0] flex items-center justify-between text-xs sm:text-sm">
          <span className="text-[#66736C] font-medium">
            {language === 'hi' ? 'हालत अनुसार मूल्य गुणक:' : 'Condition Multiplier:'}
          </span>
          <span className={`font-bold tabular-nums ${conditionMultiplier >= 1.0 ? 'text-[#16834A]' : 'text-[#E59A23]'}`}>
            {(conditionMultiplier * 100).toFixed(0)}% {conditionMultiplier >= 1.0 ? '(+EPR Bonus)' : '(Standard)'}
          </span>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-3 pt-3">
          <button
            id="weight-back-btn"
            onClick={onBack}
            className="py-3 px-5 bg-[#F7F9F8] hover:bg-gray-100 text-[#17231D] border border-[#DDE6E0] rounded-xl font-bold text-xs sm:text-sm cursor-pointer transition-colors"
          >
            {t.back}
          </button>

          <button
            id="weight-proceed-btn"
            onClick={handleProceed}
            className="flex-1 py-3 px-5 bg-[#176B45] hover:bg-[#238B5A] text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xs hover:shadow-md transition-all"
          >
            <span>{language === 'hi' ? 'उचित मूल्य अनुमान देखें' : 'Calculate Fair Rate & Recyclers'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
