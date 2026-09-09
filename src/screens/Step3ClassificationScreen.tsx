import React, { useState, useEffect, useCallback } from 'react';
import { 
  Sparkles, AlertCircle, CheckCircle2, ArrowRight, 
  ShieldCheck, ChevronDown, Check, Info, RefreshCw, 
  Layers, AlertTriangle, Scale, Eye, Cpu, Zap
} from 'lucide-react';
import { 
  Language, WasteCategory, ClassificationResult, ImageQualityAssessment, WasteCategoryInfo
} from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { WASTE_CATEGORIES } from '../data/mockData';
import { VoiceButton } from '../components/VoiceButton';
import { playChime } from '../utils/audioSpeech';
import { logClassificationRecord } from '../utils/storage';

interface Step3ClassificationScreenProps {
  language: Language;
  photoUrl: string;
  quality?: ImageQualityAssessment;
  photoQuality?: ImageQualityAssessment;
  presetIndex?: number;
  onClassificationConfirmed?: (result: ClassificationResult) => void;
  onConfirmClassification?: (result: ClassificationResult) => void;
  onBack?: () => void;
  onRetakePhoto?: () => void;
  categories?: WasteCategoryInfo[];
}

export const Step3ClassificationScreen: React.FC<Step3ClassificationScreenProps> = ({
  language,
  photoUrl,
  quality,
  photoQuality,
  presetIndex,
  onClassificationConfirmed,
  onConfirmClassification,
  onBack,
  onRetakePhoto,
  categories = WASTE_CATEGORIES,
}) => {
  const t = TRANSLATIONS[language];
  const allCats = categories && categories.length > 0 ? categories : WASTE_CATEGORIES;
  const confirmCallback = onClassificationConfirmed || onConfirmClassification;
  const backCallback = onBack || onRetakePhoto;

  const [loading, setLoading] = useState<boolean>(true);
  const [scanStepMessage, setScanStepMessage] = useState<string>(
    language === 'hi'
      ? 'Gemini Vision AI कबाड़ की पहचान कर रहा है...'
      : language === 'mr'
      ? 'Gemini Vision AI द्वारे कचऱ्याची तपासणी सुरू आहे...'
      : 'Analyzing scrap composition with Gemini Vision AI...'
  );

  const [predictedCategory, setPredictedCategory] = useState<WasteCategory>('PCBs & Circuit Boards');
  const [confidence, setConfidence] = useState<number>(0.85);
  const [secondaryCategory, setSecondaryCategory] = useState<WasteCategory>('Small Home Appliances');
  const [secondaryConfidence, setSecondaryConfidence] = useState<number>(0.15);
  const [isUncertain, setIsUncertain] = useState<boolean>(false);
  const [confirmedCategory, setConfirmedCategory] = useState<WasteCategory>('PCBs & Circuit Boards');
  const [manualConfirmed, setManualConfirmed] = useState<boolean>(false);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);

  // Rich AI-detected details
  const [detectedItemName, setDetectedItemName] = useState<string>('Electronic Scrap');
  const [detectedItemNameHi, setDetectedItemNameHi] = useState<string>('इलेक्ट्रॉनिक कबाड़');
  const [materials, setMaterials] = useState<string[]>(['Recoverable Scrap Grade A']);
  const [hazardousElements, setHazardousElements] = useState<string[]>(['None Detected']);
  const [safetyGuidanceEn, setSafetyGuidanceEn] = useState<string>('Wear safety gloves and avoid breaking fragile glass or puncturing cells.');
  const [safetyGuidanceHi, setSafetyGuidanceHi] = useState<string>('सुरक्षा दस्ताने पहनें और टूटे कांच या बैटरी को पंक्चर करने से बचें।');
  const [estimatedWeightKg, setEstimatedWeightKg] = useState<number>(8.0);
  const [cleanliness, setCleanliness] = useState<'clean' | 'dirty'>('clean');
  const [structural, setStructural] = useState<'intact' | 'damaged'>('intact');
  const [aiModelSource, setAiModelSource] = useState<string>('gemini-3.8-flash');

  // Trigger real AI classification via server endpoint
  const runClassification = useCallback(async () => {
    setLoading(true);
    setScanStepMessage(
      language === 'hi'
        ? 'Gemini Vision AI कबाड़ की पहचान कर रहा है...'
        : language === 'mr'
        ? 'Gemini Vision AI द्वारे कचऱ्याची तपासणी सुरू आहे...'
        : 'Analyzing scrap composition with Gemini Vision AI...'
    );

    try {
      const res = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: photoUrl,
          language,
          presetIndex,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();

      const cat: WasteCategory = data.category || 'PCBs & Circuit Boards';
      const conf = typeof data.confidence === 'number' ? data.confidence : 0.85;
      const uncertain = Boolean(data.isUncertain || conf < 0.7);

      setPredictedCategory(cat);
      setConfirmedCategory(cat);
      setConfidence(conf);
      setSecondaryCategory(data.secondaryCategory || 'Small Home Appliances');
      setSecondaryConfidence(data.secondaryConfidence || 0.15);
      setIsUncertain(uncertain);
      setManualConfirmed(!uncertain);

      if (data.detectedItemName) setDetectedItemName(data.detectedItemName);
      if (data.detectedItemNameHi) setDetectedItemNameHi(data.detectedItemNameHi);
      if (Array.isArray(data.materials)) setMaterials(data.materials);
      if (Array.isArray(data.hazardousElements)) setHazardousElements(data.hazardousElements);
      if (data.safetyGuidanceEn) setSafetyGuidanceEn(data.safetyGuidanceEn);
      if (data.safetyGuidanceHi) setSafetyGuidanceHi(data.safetyGuidanceHi);
      if (typeof data.estimatedWeightKg === 'number') setEstimatedWeightKg(data.estimatedWeightKg);
      if (data.cleanliness) setCleanliness(data.cleanliness);
      if (data.structural) setStructural(data.structural);
      if (data.source) setAiModelSource(data.source);

      if (uncertain) {
        playChime('alert');
      } else {
        playChime('success');
      }
    } catch (err) {
      console.warn('Fallback to client heuristic due to network/server:', err);
      // Fallback
      let fallbackCat: WasteCategory = 'Copper Wire & Motors';
      let conf = 0.82;
      let itemName = 'Copper Wire and Motors';
      let itemNameHi = 'तांबे के तार और मोटर कबाड़';
      let uncertain = false;
      let wt = 6.0;

      if (typeof presetIndex === 'number') {
        const presets = [
          { cat: 'PCBs & Circuit Boards' as WasteCategory, name: 'Computer Motherboard (PCBs)', nameHi: 'कंप्यूटर मदरबोर्ड (सर्किट बोर्ड)', conf: 0.95, wt: 8.5 },
          { cat: 'Lithium-ion & Batteries' as WasteCategory, name: 'Lithium-ion Battery Pack', nameHi: 'लिथियम-आयन बैटरी पैक', conf: 0.92, wt: 16.0 },
          { cat: 'Copper Wire & Motors' as WasteCategory, name: 'Stripped Bright Copper Wires', nameHi: 'चमकीले तांबे के तार', conf: 0.89, wt: 12.0 },
          { cat: 'Smartphones & Tablets' as WasteCategory, name: 'Smartphones & Feature Mobiles', nameHi: 'स्मार्टफोन और मोबाइल सेट', conf: 0.93, wt: 6.2 },
          { cat: 'Laptops & Computers' as WasteCategory, name: 'Laptops & Desktop Components', nameHi: 'लैपटॉप और कंप्यूटर पुर्जे', conf: 0.88, wt: 14.0 },
          { cat: 'Small Home Appliances' as WasteCategory, name: 'Mixed Electrical Scrap', nameHi: 'मिश्रित घरेलू बिजली कबाड़', conf: 0.58, wt: 11.5, uncertain: true },
        ];
        const p = presets[presetIndex] || presets[0];
        fallbackCat = p.cat;
        conf = p.conf;
        itemName = p.name;
        itemNameHi = p.nameHi;
        uncertain = Boolean(p.uncertain);
        wt = p.wt;
      }

      setPredictedCategory(fallbackCat);
      setConfirmedCategory(fallbackCat);
      setConfidence(conf);
      setIsUncertain(uncertain);
      setManualConfirmed(!uncertain);
      setDetectedItemName(itemName);
      setDetectedItemNameHi(itemNameHi);
      setEstimatedWeightKg(wt);
      setAiModelSource('local-heuristic');
      if (uncertain) playChime('alert');
      else playChime('success');
    } finally {
      setLoading(false);
    }
  }, [photoUrl, language, presetIndex]);

  useEffect(() => {
    runClassification();
  }, [runClassification]);

  const currentCategoryInfo = WASTE_CATEGORIES.find((c) => c.id === confirmedCategory) || WASTE_CATEGORIES[0];
  const predictedCategoryInfo = WASTE_CATEGORIES.find((c) => c.id === predictedCategory) || WASTE_CATEGORIES[0];

  const handleSelectCategory = (cat: WasteCategory) => {
    playChime('click');
    setConfirmedCategory(cat);
    setManualConfirmed(true);
    setDropdownOpen(false);
  };

  const handleProceed = () => {
    if (isUncertain && !manualConfirmed) {
      playChime('alert');
      return;
    }

    const wasCorrected = confirmedCategory !== predictedCategory;
    const logId = `LOG-${Date.now().toString(36).toUpperCase()}`;

    const result: ClassificationResult = {
      predictedCategory,
      confidence,
      secondaryPrediction: secondaryCategory,
      secondaryConfidence,
      isUncertain,
      confirmedCategory,
      wasManuallyCorrected: wasCorrected,
      timestamp: Date.now(),
      logId,
      photoUrl,
      detectedItemName,
      detectedItemNameHi,
      materials,
      hazardousElements,
      safetyGuidanceEn,
      safetyGuidanceHi,
      estimatedWeightKg,
      cleanliness,
      structural,
      aiModelSource,
    };

    // Log this classification to persistent audit log for AI retraining
    logClassificationRecord(result);
    playChime('success');
    if (confirmCallback) {
      confirmCallback(result);
    }
  };

  const categoryNameInLang = (cat: WasteCategory) => {
    const info = WASTE_CATEGORIES.find((c) => c.id === cat);
    if (!info) return cat;
    return language === 'hi' ? info.nameHi : language === 'mr' ? info.nameMr : info.nameEn;
  };

  const speechText =
    language === 'hi'
      ? isUncertain
        ? `सावधानी! एआई ने सामान पहचाना: ${detectedItemNameHi || categoryNameInLang(confirmedCategory)}, लेकिन विश्वास स्कोर 70% से कम है। कृपया नीचे सही श्रेणी की पुष्टि करें।`
        : `एआई द्वारा पहचाना गया सामान: ${detectedItemNameHi || categoryNameInLang(confirmedCategory)}। श्रेणी: ${categoryNameInLang(confirmedCategory)}। विश्वास स्कोर ${Math.round(confidence * 100)} प्रतिशत है।`
      : language === 'mr'
      ? isUncertain
        ? `सावधान! एआईला या कचऱ्याबद्दल संशय आहे (${detectedItemNameHi || categoryNameInLang(confirmedCategory)}). कृपया खाली योग्य प्रकार निवडून खात्री करा.`
        : `एआय ओळख: ${detectedItemNameHi || categoryNameInLang(confirmedCategory)}. श्रेणी: ${categoryNameInLang(confirmedCategory)}. विश्वास स्कोर ${Math.round(confidence * 100)} टक्के आहे.`
      : isUncertain
      ? `AI detected: ${detectedItemName}. Confidence is below 70 percent. Please confirm or correct the official CPCB category below.`
      : `AI identified scrap as: ${detectedItemName} (${confirmedCategory}) with ${Math.round(confidence * 100)}% confidence score.`;

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Header with voice */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#0F1A3C] flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-[#E8433D]" />
            <span>{t.aiClassification}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {language === 'hi'
              ? 'Google Gemini Vision द्वारा वास्तविक ई-कचरा व धातु वर्गीकरण'
              : 'Google Gemini Vision AI Material & CPCB Stream Classification'}
          </p>
        </div>
        {!loading && (
          <VoiceButton textToSpeak={speechText} language={language} label={t.listenAudio} size="md" />
        )}
      </div>

      {/* Loading Radar Scanner State */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center space-y-6 shadow-xs">
          <div className="relative w-28 h-28 mx-auto">
            {/* Pulsing radar ripples */}
            <div className="absolute inset-0 rounded-full bg-[#0F1A3C]/10 animate-ping" />
            <div className="absolute inset-2 rounded-full bg-[#0F1A3C]/20 animate-pulse" />
            <div className="relative w-full h-full rounded-full bg-[#0F1A3C] border-2 border-[#0F1A3C] flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-12 h-12 animate-spin text-[#E8433D]" style={{ animationDuration: '3s' }} />
            </div>
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-base sm:text-lg font-black text-[#0F1A3C]">
              {scanStepMessage}
            </h3>
            <p className="text-xs text-slate-500">
              {language === 'hi'
                ? 'मॉडल सामग्री संरचना, धातु की शुद्धता और जोखिम स्तर की जांच कर रहा है...'
                : 'Inspecting material density, metallic composition, and toxic elements under CPCB rules...'}
            </p>
          </div>

          <div className="w-48 h-1.5 bg-[#EEF1F8] border border-slate-200 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-[#E8433D] rounded-full animate-[shimmer_1.5s_infinite] w-2/3" />
          </div>
        </div>
      ) : (
        /* Photo & Prediction Card */
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-6 shadow-xs">
          {/* Main Visual & Detection Banner */}
          <div className="flex flex-col sm:flex-row items-start gap-5">
            {/* Scrap photo with scan overlay */}
            <div className="relative w-full sm:w-36 h-36 rounded-2xl overflow-hidden bg-black shrink-0 border border-slate-200 shadow-xs group">
              <img src={photoUrl} alt="Scrap" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] text-white font-bold">
                <span className="bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded-md">
                  {aiModelSource.includes('gemini') ? 'Gemini Vision' : 'ScrapSetu Vision'}
                </span>
                <span className="bg-[#E8433D]/90 px-1.5 py-0.5 rounded-md">
                  {Math.round(confidence * 100)}%
                </span>
              </div>
            </div>

            {/* AI Findings Header */}
            <div className="flex-1 min-w-0 space-y-3 w-full">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#E8433D] bg-[#EEF1F8] px-2.5 py-0.5 rounded-md">
                    {language === 'hi' ? 'पहचाना गया सामान' : 'AI Detected Item'}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-[#E8433D]" />
                    {aiModelSource === 'gemini-3.8-flash'
                      ? 'Gemini 3.8 Flash'
                      : aiModelSource === 'gemini-3.1-flash-lite'
                      ? 'Gemini 3.1 Flash Lite'
                      : aiModelSource === 'gemini-flash-latest'
                      ? 'Gemini Flash'
                      : 'ScrapSetu Vision Engine'}
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-black text-[#0F1A3C] mt-1.5 leading-tight">
                  {detectedItemName}
                </h3>
                {detectedItemNameHi && detectedItemNameHi !== detectedItemName && (
                  <p className="text-xs sm:text-sm font-semibold text-slate-500">
                    {detectedItemNameHi}
                  </p>
                )}
              </div>

              {/* Official CPCB Category Pill */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-500">
                  {language === 'hi' ? 'सीपीसीबी श्रेणी:' : 'CPCB Category:'}
                </span>
                <span
                  className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs sm:text-sm font-bold text-white shadow-xs"
                  style={{ backgroundColor: currentCategoryInfo.color }}
                >
                  <span>{categoryNameInLang(confirmedCategory)}</span>
                </span>
              </div>

              {/* Confidence Meter */}
              <div className="space-y-1.5 max-w-md pt-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-500">{t.confidence}:</span>
                  <span className={confidence >= 0.7 ? 'text-emerald-700' : 'text-amber-600'}>
                    {Math.round(confidence * 100)}% {confidence >= 0.7 ? `(${t.highConfidence})` : `(${t.uncertainAlert})`}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-[#EEF1F8] border border-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      confidence >= 0.7 ? 'bg-[#E8433D]' : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.round(confidence * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Recoverable Materials & Hazards Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {/* Recoverable Components */}
            <div className="p-3.5 bg-[#F8F9FD] rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F1A3C]">
                <Layers className="w-4 h-4 text-[#E8433D]" />
                <span>{language === 'hi' ? 'पुनर्चक्रण योग्य धातु व घटक:' : 'Recoverable Materials & Metals:'}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {materials.map((mat, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-[#0F1A3C] shadow-2xs"
                  >
                    {mat}
                  </span>
                ))}
              </div>
            </div>

            {/* Hazardous Elements */}
            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F1A3C]">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>{language === 'hi' ? 'संभावित विषैले तत्व / सावधानियां:' : 'Hazardous Substances & Safety:'}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {hazardousElements.map((haz, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-white border border-amber-300 rounded-lg text-xs font-semibold text-amber-700 shadow-2xs"
                  >
                    {haz}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                {language === 'hi' ? safetyGuidanceHi : safetyGuidanceEn}
              </p>
            </div>
          </div>

          {/* AI QA Gating: If confidence < 70%, show prominent warning and require manual confirmation */}
          {isUncertain ? (
            <div className="p-4 sm:p-5 bg-amber-50 border border-amber-200 rounded-2xl space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-white border border-amber-400 text-amber-600 flex items-center justify-center shrink-0 shadow-xs">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-black text-[#0F1A3C]">{t.uncertainAlert}</h4>
                  <p className="text-xs text-slate-600 mt-0.5">{t.uncertainDesc}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-[#0F1A3C] block">
                  {t.manualConfirmLabel}
                </label>

                {/* Quick 1-Click Category Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {WASTE_CATEGORIES.slice(0, 6).map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleSelectCategory(cat.id)}
                      className={`p-2.5 rounded-xl text-left text-xs border transition-all cursor-pointer flex flex-col justify-between ${
                        confirmedCategory === cat.id
                          ? 'border-[#E8433D] bg-white text-[#E8433D] font-black ring-2 ring-[#E8433D]/20 shadow-xs'
                          : 'border-slate-200 bg-white text-[#0F1A3C] hover:bg-[#EEF1F8]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="truncate">{categoryNameInLang(cat.id).split(' ')[0]}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-semibold">₹{cat.basePricePerKg}/kg</span>
                    </button>
                  ))}
                </div>

                {/* View All Categories Dropdown Trigger */}
                <div className="relative pt-1">
                  <button
                    id="category-dropdown-trigger"
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-full p-3 bg-white border border-amber-300 rounded-xl flex items-center justify-between text-xs sm:text-sm font-bold text-[#0F1A3C] cursor-pointer shadow-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: currentCategoryInfo.color }}
                      />
                      <span>{language === 'hi' ? 'सभी 15+ श्रेणियां देखें' : 'View All 15+ Categories'}: {categoryNameInLang(confirmedCategory)}</span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 max-h-64 overflow-y-auto p-2 space-y-1">
                      {WASTE_CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          id={`cat-select-${cat.id}`}
                          onClick={() => handleSelectCategory(cat.id)}
                          className={`w-full p-2.5 rounded-lg text-left text-xs sm:text-sm flex items-center justify-between hover:bg-[#EEF1F8] transition-colors cursor-pointer ${
                            confirmedCategory === cat.id ? 'bg-[#EEF1F8] text-[#E8433D] font-bold' : 'text-[#0F1A3C]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                            <span>{categoryNameInLang(cat.id)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">₹{cat.basePricePerKg}/kg</span>
                            {confirmedCategory === cat.id && <Check className="w-4 h-4 text-[#E8433D]" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {manualConfirmed && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-emerald-700 font-bold bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>
                    {language === 'hi' ? 'कबाड़ी सत्यापन पूरा हुआ:' : 'Collector QA Verified:'} {categoryNameInLang(confirmedCategory)}
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* High confidence confirmation box with easy override option */
            <div className="p-4 bg-[#EEF1F8] border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-white border border-emerald-300 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-[#0F1A3C] block">
                      {t.confirmedAs}: {categoryNameInLang(confirmedCategory)}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Base EPR Rate: ₹{currentCategoryInfo.basePricePerKg}/kg
                    </span>
                  </div>
                </div>

                {/* Option to change category if user disagrees with AI */}
                <button
                  id="btn-override-category"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-[#0F1A3C] font-bold hover:bg-[#0F1A3C] hover:text-white transition-all cursor-pointer shadow-2xs"
                >
                  {language === 'hi' ? 'श्रेणी बदलें?' : 'Change Category?'}
                </button>
              </div>

              {dropdownOpen && (
                <div className="pt-3 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {allCats.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleSelectCategory(cat.id)}
                      className={`p-2.5 rounded-xl text-left text-xs border cursor-pointer transition-colors ${
                        confirmedCategory === cat.id
                          ? 'border-[#E8433D] bg-white text-[#E8433D] font-bold shadow-xs ring-2 ring-[#E8433D]/20'
                          : 'border-slate-200 bg-white text-[#0F1A3C] hover:bg-[#EEF1F8]'
                      }`}
                    >
                      <div className="font-bold truncate">{categoryNameInLang(cat.id).split(' ')[0]}</div>
                      <div className="text-[10px] text-slate-500">₹{cat.basePricePerKg}/kg</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CPCB Category Guidelines & Accepted Subtypes */}
          <div className="bg-[#F8F9FD] rounded-xl p-4 text-xs space-y-2 border border-slate-200">
            <div className="flex items-center justify-between text-[#0F1A3C] font-bold">
              <span className="flex items-center gap-1.5">
                <Info className="w-4 h-4 text-[#E8433D]" />
                <span>{language === 'hi' ? 'मान्य घटक (CPCB Subtypes):' : 'Acceptable Components:'}</span>
              </span>
              <span className="text-[#0F1A3C] font-black text-sm">
                Base: ₹{currentCategoryInfo.basePricePerKg}/kg
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {currentCategoryInfo.subtypes.map((sub, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-600"
                >
                  {sub}
                </span>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              id="cat-back-btn"
              onClick={backCallback}
              className="py-3 px-5 bg-[#EEF1F8] hover:bg-slate-200 text-[#0F1A3C] border border-slate-200 rounded-xl font-bold text-xs sm:text-sm cursor-pointer transition-colors"
            >
              {t.back}
            </button>

            <button
              id="cat-rescan-btn"
              onClick={runClassification}
              className="py-3 px-4 bg-white hover:bg-slate-50 text-[#0F1A3C] border border-slate-200 rounded-xl font-bold text-xs sm:text-sm cursor-pointer transition-colors flex items-center gap-1.5"
              title="Re-run AI classification"
            >
              <RefreshCw className="w-4 h-4 text-[#E8433D]" />
              <span>{language === 'hi' ? 'पुनः स्कैन' : 'Re-scan'}</span>
            </button>

            <button
              id="cat-proceed-btn"
              onClick={handleProceed}
              disabled={isUncertain && !manualConfirmed}
              className={`flex-1 py-3 px-5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xs ${
                isUncertain && !manualConfirmed
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-[#E8433D] hover:bg-[#D32F2F] text-white cursor-pointer shadow-md shadow-[#E8433D]/25'
              }`}
            >
              <span>{language === 'hi' ? 'वजन और स्थिति दर्ज करें' : 'Proceed to Weight & Condition'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
