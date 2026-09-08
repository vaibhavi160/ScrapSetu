import React from 'react';
import { IndianRupee, TrendingUp, Sparkles, ShieldCheck, ArrowRight, Info, AlertTriangle } from 'lucide-react';
import { Language, WasteCategory } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { WASTE_CATEGORIES } from '../data/mockData';
import { VoiceButton } from '../components/VoiceButton';
import { playChime } from '../utils/audioSpeech';

interface Step5FairPriceScreenProps {
  language: Language;
  category: WasteCategory;
  weightKg: number;
  condition: { cleanliness: 'clean' | 'dirty'; structural: 'intact' | 'damaged' };
  onPriceConfirmed: (pricingData: {
    calculatedPricePerKg: number;
    totalEstimatedPrice: number;
    marketMiddlemanTotal: number;
    fairAdvantageAmount: number;
  }) => void;
  onBack: () => void;
}

export const Step5FairPriceScreen: React.FC<Step5FairPriceScreenProps> = ({
  language,
  category,
  weightKg,
  condition,
  onPriceConfirmed,
  onBack,
}) => {
  const t = TRANSLATIONS[language];
  const catInfo = WASTE_CATEGORIES.find((c) => c.id === category) || WASTE_CATEGORIES[0];

  // Calculate rate
  let conditionMultiplier = 1.0;
  if (condition.cleanliness === 'clean') conditionMultiplier += 0.1;
  else conditionMultiplier -= 0.1;

  if (condition.structural === 'damaged') conditionMultiplier -= 0.15;

  const fairPricePerKg = Math.round(catInfo.basePricePerKg * conditionMultiplier * 10) / 10;
  const totalFairPrice = Math.round(fairPricePerKg * weightKg);

  const middlemanRatePerKg = catInfo.marketRatePerKg;
  const totalMiddlemanPrice = Math.round(middlemanRatePerKg * weightKg);
  const fairAdvantage = Math.max(0, totalFairPrice - totalMiddlemanPrice);
  const percentageGain = Math.round((fairAdvantage / Math.max(1, totalMiddlemanPrice)) * 100);

  const handleProceed = () => {
    playChime('success');
    onPriceConfirmed({
      calculatedPricePerKg: fairPricePerKg,
      totalEstimatedPrice: totalFairPrice,
      marketMiddlemanTotal: totalMiddlemanPrice,
      fairAdvantageAmount: fairAdvantage,
    });
  };

  const speechText =
    language === 'hi'
      ? `उचित मूल्य का अनुमान: कुल ₹${totalFairPrice}। स्थानीय दलाल आपको केवल ₹${totalMiddlemanPrice} देते, जिससे आपको ₹${fairAdvantage} का अतिरिक्त सीधा ईपीआर मुनाफा मिल रहा है।`
      : language === 'mr'
      ? `रास्त भावाचा अंदाज: एकूण ₹${totalFairPrice}. स्थानिक दलाल फक्त ₹${totalMiddlemanPrice} देतात, ज्यामुळे तुम्हाला ₹${fairAdvantage} अतिरिक्त नफा मिळत आहे.`
      : `Fair price estimate: Total ₹${totalFairPrice}. Unregulated middlemen offer only ₹${totalMiddlemanPrice}, giving you an extra ₹${fairAdvantage} fair advantage.`;

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#DDE6E0]">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#17231D] flex items-center gap-2.5">
            <IndianRupee className="w-6 h-6 text-[#176B45]" />
            <span>{t.fairPriceEstimate}</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#66736C] mt-0.5">
            {weightKg} kg {language === 'hi' ? catInfo.nameHi : catInfo.nameEn}
          </p>
        </div>
        <VoiceButton textToSpeak={speechText} language={language} label={t.listenAudio} size="md" />
      </div>

      {/* Main Fair Price Highlight Card */}
      <div className="bg-white rounded-2xl border border-[#DDE6E0] p-5 sm:p-6 space-y-6 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-bold bg-[#EAF6EF] text-[#16834A] border border-[#16834A]/20">
            <ShieldCheck className="w-4 h-4" />
            <span>{t.guaranteedRate}</span>
          </span>
          <span className="text-xs sm:text-sm font-bold text-[#66736C]">
            ₹{fairPricePerKg} / kg
          </span>
        </div>

        {/* Big Estimated Price */}
        <div className="text-center py-5 bg-[#F7F9F8] rounded-2xl border border-[#DDE6E0] p-4 shadow-inner">
          <span className="text-xs sm:text-sm font-semibold text-[#66736C] block">
            {language === 'hi' ? 'आपको मिलने वाली अनुमानित राशि' : 'Estimated Direct Recycler Payout'}
          </span>
          <div className="text-4xl sm:text-5xl font-extrabold text-[#17231D] mt-2 tabular-nums flex items-center justify-center gap-1.5">
            <span className="text-2xl sm:text-3xl text-[#176B45]">₹</span>
            <span>{totalFairPrice.toLocaleString('en-IN')}</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-3 rounded-full bg-[#EAF6EF] text-[#16834A] text-xs font-bold border border-[#16834A]/20 shadow-xs">
            <TrendingUp className="w-4 h-4" />
            <span>
              +{percentageGain}% {language === 'hi' ? 'दलाल से अधिक मुनाफा' : 'Higher than Informal Middleman'}
            </span>
          </div>
        </div>

        {/* Comparison Bar / Slider comparing Fair Recycler vs Exploitative Middleman */}
        <div className="border-t border-[#DDE6E0] pt-4 space-y-4">
          <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-[#17231D]">
            <span>{language === 'hi' ? 'पारदर्शी भाव तुलना' : 'Price Transparency Comparison'}</span>
            <span className="text-[#176B45] font-bold bg-[#EAF6EF] px-2.5 py-0.5 rounded-full border border-[#176B45]/20">+₹{fairAdvantage} Advantage</span>
          </div>

          {/* ScrapSetu Authorized Rate Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="font-bold text-[#176B45] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>Authorized Recyclers (ScrapSetu)</span>
              </span>
              <span className="font-bold text-[#176B45] tabular-nums">₹{totalFairPrice}</span>
            </div>
            <div className="w-full h-3 bg-[#F7F9F8] border border-[#DDE6E0] rounded-full overflow-hidden">
              <div className="h-full bg-[#176B45] rounded-full transition-all duration-500 w-full" />
            </div>
          </div>

          {/* Middleman Rate Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="font-medium text-[#66736C] flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-gray-400" />
                <span>{t.middlemanRate}</span>
              </span>
              <span className="font-bold text-[#66736C] line-through tabular-nums">₹{totalMiddlemanPrice}</span>
            </div>
            <div className="w-full h-2.5 bg-[#F7F9F8] border border-[#DDE6E0] rounded-full overflow-hidden">
              <div
                className="h-full bg-gray-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((totalMiddlemanPrice / totalFairPrice) * 100))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Why Fair Price Explainer Box for Trust */}
        <div className="p-4 bg-[#F7F9F8] rounded-xl border border-[#DDE6E0] text-xs sm:text-sm text-[#66736C] flex items-start gap-3">
          <Info className="w-5 h-5 text-[#176B45] shrink-0 mt-0.5" />
          <p className="leading-relaxed">{t.whyFairPrice}</p>
        </div>

        {/* Calculation Breakdown Sheet */}
        <div className="bg-[#F7F9F8] rounded-xl p-4 text-xs sm:text-sm space-y-2 border border-[#DDE6E0]">
          <div className="flex justify-between text-[#66736C]">
            <span>Base CPCB Rate:</span>
            <span className="tabular-nums font-semibold text-[#17231D]">₹{catInfo.basePricePerKg}/kg</span>
          </div>
          <div className="flex justify-between text-[#66736C]">
            <span>Condition Multiplier:</span>
            <span className={conditionMultiplier >= 1.0 ? 'text-[#16834A] font-bold tabular-nums' : 'text-[#E59A23] font-bold tabular-nums'}>
              {(conditionMultiplier * 100).toFixed(0)}% ({condition.cleanliness === 'clean' ? 'Clean sorted' : 'Dirty mixed'})
            </span>
          </div>
          <div className="flex justify-between text-[#66736C]">
            <span>Weight:</span>
            <span className="tabular-nums font-semibold text-[#17231D]">{weightKg.toFixed(1)} kg</span>
          </div>
          <div className="border-t border-[#DDE6E0] pt-2 flex justify-between font-bold text-[#17231D] text-base">
            <span>{language === 'hi' ? 'कुल उचित राशि:' : 'Total Payable:'}</span>
            <span className="text-[#176B45] tabular-nums font-extrabold">₹{totalFairPrice}</span>
          </div>
        </div>

        {/* Next Step CTA */}
        <div className="flex items-center gap-3 pt-3">
          <button
            id="price-back-btn"
            onClick={onBack}
            className="py-3 px-5 bg-[#F7F9F8] hover:bg-gray-100 text-[#17231D] border border-[#DDE6E0] rounded-xl font-bold text-xs sm:text-sm cursor-pointer transition-colors"
          >
            {t.back}
          </button>

          <button
            id="price-proceed-btn"
            onClick={handleProceed}
            className="flex-1 py-3 px-5 bg-[#176B45] hover:bg-[#238B5A] text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xs hover:shadow-md transition-all"
          >
            <span>{language === 'hi' ? 'रिसाइक्लर्स की तुलना करें' : 'Compare Recyclers & Bids'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
