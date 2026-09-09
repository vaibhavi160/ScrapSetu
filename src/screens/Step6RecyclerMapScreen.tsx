import React, { useState, useEffect } from 'react';
import { 
  MapPin, Navigation, Star, Phone, CheckCircle, ShieldCheck, 
  ExternalLink, Layers, ArrowUpDown, Check, ArrowRight, X, Clock, IndianRupee, Truck, Plus
} from 'lucide-react';
import { Language, WasteCategory, Recycler } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { MOCK_RECYCLERS } from '../data/mockData';
import { 
  calculateHaversineDistanceKm, calculateDrivingDistanceKm, 
  calculateDrivingEtaMins, getCurrentCollectorLocation, getGoogleMapsDirectionsUrl,
  formatDisplayAddress
} from '../utils/geo';
import { VoiceButton } from '../components/VoiceButton';
import { playChime } from '../utils/audioSpeech';
import { GoogleRecyclersMap } from '../components/GoogleRecyclersMap';
import { AddRecyclerModal } from '../components/AddRecyclerModal';

interface Step6RecyclerMapScreenProps {
  language: Language;
  category: WasteCategory;
  weightKg: number;
  calculatedPricePerKg: number;
  onSelectRecycler: (recycler: Recycler) => void;
  onBack: () => void;
  recyclers?: Recycler[];
  onAddRecyclers?: (newRecs: Recycler[]) => void;
}

export const Step6RecyclerMapScreen: React.FC<Step6RecyclerMapScreenProps> = ({
  language,
  category,
  weightKg,
  calculatedPricePerKg,
  onSelectRecycler,
  onBack,
  recyclers = MOCK_RECYCLERS,
  onAddRecyclers,
}) => {
  const t = TRANSLATIONS[language];

  // Collector location state
  const [collectorLoc, setCollectorLoc] = useState({
    lat: 19.0415,
    lng: 72.8538,
    areaName: 'Dharavi Kabadi Cluster, Mumbai',
    source: 'fallback' as 'gps' | 'fallback',
  });

  const [activeTab, setActiveTab] = useState<'map' | 'list'>('map');
  const [sortBy, setSortBy] = useState<'distance' | 'price' | 'rating'>('distance');
  const [selectedRecyclerId, setSelectedRecyclerId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompareModal, setShowCompareModal] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // Fetch real GPS on mount
  useEffect(() => {
    getCurrentCollectorLocation().then((loc) => {
      setCollectorLoc(loc);
    });
  }, []);

  // Filter recyclers: ONLY show authorized recyclers accepting the current waste category
  // If no recyclers match the specific category, show all available verified facilities
  const rawList = recyclers && recyclers.length > 0 ? recyclers : MOCK_RECYCLERS;
  const categoryMatched = rawList.filter((r) =>
    r.acceptedCategories.includes(category)
  );
  const candidateRecyclers = categoryMatched.length > 0 ? categoryMatched : rawList;

  const processedRecyclers = candidateRecyclers.map((r) => {
    const straightKm = calculateHaversineDistanceKm(collectorLoc.lat, collectorLoc.lng, r.lat, r.lng);
    const drivingKm = calculateDrivingDistanceKm(straightKm);
    const drivingEta = calculateDrivingEtaMins(drivingKm);
    // Use recycler's specific custom rate for this category if configured
    const customRateForCategory = r.customRates?.[category];
    const offeredPricePerKg = typeof customRateForCategory === 'number' && customRateForCategory > 0
      ? customRateForCategory
      : Math.round(calculatedPricePerKg * (r.priceMultiplier || 1.05) * 10) / 10;
    const totalOffered = Math.round(offeredPricePerKg * weightKg);

    return {
      ...r,
      distanceKm: drivingKm,
      drivingEtaMins: drivingEta,
      offeredPricePerKg,
      totalOffered,
    };
  });

  // Sort
  const sortedRecyclers = [...processedRecyclers].sort((a, b) => {
    if (sortBy === 'distance') return (a.distanceKm || 0) - (b.distanceKm || 0);
    if (sortBy === 'price') return (b.totalOffered || 0) - (a.totalOffered || 0);
    return b.rating - a.rating;
  });

  // Selected recycler details
  const activeRecycler = sortedRecyclers.find((r) => r.id === selectedRecyclerId) || sortedRecyclers[0];

  const handleToggleCompare = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playChime('click');
    if (compareIds.includes(id)) {
      setCompareIds(compareIds.filter((item) => item !== id));
    } else {
      if (compareIds.length >= 3) {
        alert('You can compare up to 3 authorized recyclers side-by-side.');
        return;
      }
      setCompareIds([...compareIds, id]);
    }
  };

  const handleProceedWithRecycler = (recycler: Recycler) => {
    playChime('success');
    onSelectRecycler(recycler);
  };

  const handleRecyclersAdded = (newRecs: Recycler[]) => {
    if (onAddRecyclers) {
      onAddRecyclers(newRecs);
    }
    if (newRecs.length > 0) {
      setSelectedRecyclerId(newRecs[0].id);
    }
  };

  const speechText =
    language === 'hi'
      ? `आपके पास ${sortedRecyclers.length} सीपीसीबी अधिकृत रिसाइकलर मिले हैं जो ${category} स्वीकार करते हैं। सबसे निकटतम रिसाइकलर ${sortedRecyclers[0]?.name} है जो ${sortedRecyclers[0]?.distanceKm} किमी दूर है।`
      : language === 'mr'
      ? `तुमच्याजवळ ${sortedRecyclers.length} अधिकृत रिसायकलर उपलब्ध आहेत. सर्वात जवळचे केंद्र ${sortedRecyclers[0]?.name} हे ${sortedRecyclers[0]?.distanceKm} किमी अंतरावर आहे.`
      : `Found ${sortedRecyclers.length} CPCB authorized recyclers accepting ${category}. Nearest is ${sortedRecyclers[0]?.name} at ${sortedRecyclers[0]?.distanceKm} km.`;

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-black text-[#0F1A3C] flex items-center gap-2">
              <MapPin className="w-6 h-6 text-[#E8433D]" />
              <span>{t.compareRecyclers}</span>
            </h2>
            <span className="text-xs bg-[#EEF1F8] text-[#0F1A3C] font-black px-2.5 py-0.5 rounded-full border border-slate-200">
              Google Maps & Firebase Synced ({sortedRecyclers.length})
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t.nearYou} <strong className="text-[#E8433D] font-bold">{category}</strong> ({sortedRecyclers.length} {language === 'hi' ? 'सुविधाएं उपलब्ध' : 'facilities available'})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            id="step6-add-recycler-btn"
            onClick={() => {
              playChime('click');
              setIsAddModalOpen(true);
            }}
            className="bg-[#0F1A3C] hover:bg-[#1A2855] text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'hi' ? '+ रीसाइक्लर जोड़ें' : '+ Add Recycler(s)'}</span>
          </button>
          <VoiceButton textToSpeak={speechText} language={language} label={t.listenAudio} size="md" />
        </div>
      </div>

      {/* View Switcher: Live Map vs Low-Bandwidth List */}
      <div className="flex items-center justify-between bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex-wrap gap-2">
        <div className="inline-flex rounded-xl bg-[#EEF1F8] p-1 text-xs sm:text-sm font-bold border border-slate-200">
          <button
            id="tab-map-view"
            onClick={() => setActiveTab('map')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'map'
                ? 'bg-[#0F1A3C] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#0F1A3C]'
            }`}
          >
            <Navigation className="w-4 h-4" />
            <span>{t.mapView}</span>
          </button>
          <button
            id="tab-list-view"
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'list'
                ? 'bg-[#0F1A3C] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#0F1A3C]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{t.listView}</span>
          </button>
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-1.5 text-xs sm:text-sm px-2">
          <ArrowUpDown className="w-4 h-4 text-slate-500" />
          <select
            id="sort-recyclers-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[#EEF1F8] font-bold text-[#0F1A3C] text-xs sm:text-sm py-1.5 px-2.5 rounded-lg border border-slate-200 focus:ring-1 focus:ring-[#E8433D] cursor-pointer"
          >
            <option value="distance">{t.sortDistance}</option>
            <option value="price">{t.sortPrice}</option>
            <option value="rating">{t.sortRating}</option>
          </select>
        </div>
      </div>

      {/* MAP VIEW */}
      {activeTab === 'map' && (
        <div className="space-y-4">
          {/* Real Google Maps Component with Firestore Sync */}
          <GoogleRecyclersMap
            recyclers={sortedRecyclers}
            selectedRecyclerId={selectedRecyclerId || sortedRecyclers[0]?.id || null}
            onSelectRecycler={(rec) => {
              playChime('click');
              setSelectedRecyclerId(rec.id);
            }}
            collectorLoc={collectorLoc}
            language={language}
            height="440px"
            onAddRecyclersClick={() => {
              playChime('click');
              setIsAddModalOpen(true);
            }}
          />

          {/* Active Recycler Card */}
          {activeRecycler && (
            <div className="bg-white rounded-2xl border-2 border-[#0F1A3C] p-5 sm:p-6 space-y-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-black text-base sm:text-lg text-[#0F1A3C]">
                      {activeRecycler.name}
                    </h3>
                    {activeRecycler.spcbCertified && (
                      <span className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>CPCB/SPCB Auth</span>
                      </span>
                    )}
                    {activeRecycler.priceMultiplier > 1 && (
                      <span className="text-[11px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md font-black">
                        +{Math.round((activeRecycler.priceMultiplier - 1) * 100)}% Rate Bonus
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    {formatDisplayAddress(activeRecycler.address, activeRecycler.city)}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                    <span className="font-mono text-[#0F1A3C] bg-[#EEF1F8] px-2 py-0.5 rounded-md font-semibold">
                      {activeRecycler.cpcbRegNumber}
                    </span>
                    {activeRecycler.phone && (
                      <span className="flex items-center gap-1 font-medium text-[#0F1A3C]">
                        <Phone className="w-3 h-3 text-[#E8433D]" />
                        {activeRecycler.phone}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xl sm:text-2xl font-black text-[#E8433D] tabular-nums">
                    ₹{activeRecycler.totalOffered}
                  </div>
                  <span className="text-xs text-slate-500 block tabular-nums">
                    (₹{activeRecycler.offeredPricePerKg}/kg)
                  </span>
                </div>
              </div>

              {/* Badges Row: Distance, ETA, Pickup */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs sm:text-sm">
                <div className="p-2.5 rounded-xl bg-[#F8F9FD] border border-slate-200">
                  <span className="text-xs text-slate-500 block">{t.sortDistance}</span>
                  <span className="font-bold text-[#0F1A3C] tabular-nums">{activeRecycler.distanceKm} km</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#F8F9FD] border border-slate-200">
                  <span className="text-xs text-slate-500 block">Drive ETA</span>
                  <span className="font-bold text-[#0F1A3C] tabular-nums">{activeRecycler.drivingEtaMins} mins</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#F8F9FD] border border-slate-200">
                  <span className="text-xs text-slate-500 block">Pickup</span>
                  <span className="font-bold text-[#E8433D]">
                    {activeRecycler.pickupAvailable ? 'Doorstep' : 'Depot'}
                  </span>
                </div>
              </div>

              {/* Action Buttons: Directions & Select */}
              <div className="flex items-center gap-3 pt-2">
                <a
                  id="btn-google-maps-directions"
                  href={getGoogleMapsDirectionsUrl(activeRecycler.lat, activeRecycler.lng, activeRecycler.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 px-4 bg-[#EEF1F8] hover:bg-slate-200 text-[#0F1A3C] border border-slate-200 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Navigation className="w-4 h-4 text-blue-700" />
                  <span>{t.getDirections}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                </a>

                <button
                  id="btn-select-active-recycler"
                  onClick={() => handleProceedWithRecycler(activeRecycler)}
                  className="flex-1 py-3 px-5 bg-[#E8433D] hover:bg-[#D32F2F] text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#E8433D]/25 transition-all"
                >
                  <span>{language === 'hi' ? 'यह रिसाइकलर चुनें' : 'Choose This Recycler'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* LOW BANDWIDTH LIST VIEW */}
      {activeTab === 'list' && (
        <div className="space-y-3">
          {sortedRecyclers.map((rec) => {
            const isSelected = rec.id === (selectedRecyclerId || sortedRecyclers[0]?.id);
            const isCompared = compareIds.includes(rec.id);

            return (
              <div
                key={rec.id}
                id={`recycler-card-${rec.id}`}
                className={`p-4 sm:p-5 rounded-2xl border bg-white space-y-3 transition-all shadow-xs ${
                  isSelected ? 'border-2 border-[#0F1A3C] ring-2 ring-[#0F1A3C]/10' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-black text-sm sm:text-base text-[#0F1A3C]">{rec.name}</h4>
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      {rec.priceMultiplier > 1 && (
                        <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-black">
                          +{Math.round((rec.priceMultiplier - 1) * 100)}% Premium
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{formatDisplayAddress(rec.address, rec.city)}</p>
                    <div className="flex items-center gap-3 text-[11px] mt-1 flex-wrap">
                      <span className="font-mono text-[#0F1A3C] bg-[#EEF1F8] px-2 py-0.5 rounded-md font-semibold">
                        {rec.cpcbRegNumber}
                      </span>
                      {rec.phone && (
                        <span className="text-slate-600 font-medium">📞 {rec.phone}</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg sm:text-xl font-black text-[#E8433D] tabular-nums">
                      ₹{rec.totalOffered}
                    </div>
                    <span className="text-xs text-slate-500 tabular-nums">
                      ₹{rec.offeredPricePerKg}/kg
                    </span>
                  </div>
                </div>

                {/* Metrics */}
                <div className="flex items-center justify-between text-xs sm:text-sm text-slate-500 pt-2 border-t border-slate-200">
                  <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Navigation className="w-3.5 h-3.5 text-slate-400" />
                      <span className="tabular-nums">{rec.distanceKm} km ({rec.drivingEtaMins} min)</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-slate-400" />
                      <span>{rec.pickupAvailable ? 'Doorstep pickup' : 'Drop-off'}</span>
                    </span>
                  </div>

                  {/* Compare checkbox */}
                  <button
                    onClick={(e) => handleToggleCompare(rec.id, e)}
                    className={`text-xs font-bold px-3 py-1 rounded-full border transition-colors cursor-pointer ${
                      isCompared
                        ? 'bg-[#EEF1F8] text-[#E8433D] border-[#E8433D]'
                        : 'bg-[#F8F9FD] text-[#0F1A3C] border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {isCompared ? '✓ Selected' : '+ Compare'}
                  </button>
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-3 pt-2">
                  <a
                    href={getGoogleMapsDirectionsUrl(rec.lat, rec.lng, rec.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-[#EEF1F8] rounded-xl text-[#0F1A3C] border border-slate-200 hover:bg-slate-200 transition-colors"
                    title="Google Maps Navigation"
                  >
                    <Navigation className="w-4 h-4 text-blue-700" />
                  </a>

                  <button
                    id={`btn-select-list-${rec.id}`}
                    onClick={() => handleProceedWithRecycler(rec)}
                    className="flex-1 py-3 px-4 bg-[#E8433D] hover:bg-[#D32F2F] text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#E8433D]/25 transition-colors"
                  >
                    <span>{language === 'hi' ? 'यह ऑफर चुनें' : 'Select Offer & Schedule Pickup'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Compare floating badge button if 2-3 selected */}
      {compareIds.length >= 2 && (
        <div className="sticky bottom-4 z-30">
          <button
            id="btn-open-compare-modal"
            onClick={() => setShowCompareModal(true)}
            className="w-full py-3 px-5 bg-[#0F1A3C] hover:bg-[#1A2855] text-white rounded-2xl font-bold text-xs sm:text-sm shadow-xl flex items-center justify-between cursor-pointer transition-all"
          >
            <div className="flex items-center gap-2.5">
              <Layers className="w-5 h-5 text-[#E8433D]" />
              <span>{t.compareSelected} ({compareIds.length} Recyclers)</span>
            </div>
            <span className="bg-white/20 px-3 py-1 rounded-full text-xs">View Side-by-Side</span>
          </button>
        </div>
      )}

      {/* Add Recyclers Modal */}
      <AddRecyclerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onRecyclersAdded={handleRecyclersAdded}
        collectorLoc={collectorLoc}
        language={language}
      />

      {/* Side-by-Side Recycler Comparison Modal */}
      {showCompareModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[85vh] overflow-y-auto p-5 sm:p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-black text-base sm:text-lg text-[#0F1A3C] flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#E8433D]" />
                <span>Side-by-Side Recycler Comparison</span>
              </h3>
              <button
                onClick={() => setShowCompareModal(false)}
                className="w-8 h-8 rounded-full bg-[#EEF1F8] hover:bg-slate-200 flex items-center justify-center text-[#0F1A3C] border border-slate-200 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Comparison Columns Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs sm:text-sm">
              {compareIds.map((id) => {
                const rec = sortedRecyclers.find((r) => r.id === id);
                if (!rec) return null;

                return (
                  <div key={rec.id} className="border border-slate-200 rounded-xl p-4 bg-[#F8F9FD] space-y-3">
                    <div>
                      <h4 className="font-bold text-[#0F1A3C] text-xs sm:text-sm truncate">{rec.name}</h4>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">{rec.cpcbRegNumber}</p>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-xs">
                      <span className="text-xs text-slate-500 block">Total Offer</span>
                      <span className="text-xl font-black text-[#E8433D] tabular-nums">₹{rec.totalOffered}</span>
                      <span className="text-xs text-slate-500 block tabular-nums">₹{rec.offeredPricePerKg}/kg</span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Distance:</span>
                        <span className="font-bold tabular-nums text-[#0F1A3C]">{rec.distanceKm} km</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Drive ETA:</span>
                        <span className="font-bold tabular-nums text-[#0F1A3C]">{rec.drivingEtaMins} min</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Pickup:</span>
                        <span className="font-bold text-[#E8433D]">
                          {rec.pickupAvailable ? 'Doorstep' : 'Depot'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Rating:</span>
                        <span className="font-bold text-amber-500 tabular-nums">★ {rec.rating}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setShowCompareModal(false);
                        handleProceedWithRecycler(rec);
                      }}
                      className="w-full py-2.5 bg-[#E8433D] text-white rounded-xl font-bold text-xs sm:text-sm hover:bg-[#D32F2F] cursor-pointer shadow-md shadow-[#E8433D]/25 transition-colors"
                    >
                      Choose This
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Back Button */}
      <div className="pt-2">
        <button
          id="recyclers-back-btn"
          onClick={onBack}
          className="w-full py-3 px-5 bg-[#EEF1F8] hover:bg-slate-200 text-[#0F1A3C] border border-slate-200 rounded-xl font-bold text-xs sm:text-sm cursor-pointer transition-colors"
        >
          {t.back}
        </button>
      </div>
    </div>
  );
};
