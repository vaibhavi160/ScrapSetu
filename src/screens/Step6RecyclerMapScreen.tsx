import React, { useState, useEffect } from 'react';
import { 
  MapPin, Navigation, Star, Phone, CheckCircle, ShieldCheck, 
  ExternalLink, Layers, ArrowUpDown, Check, ArrowRight, X, Clock, IndianRupee, Truck
} from 'lucide-react';
import { Language, WasteCategory, Recycler } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { MOCK_RECYCLERS } from '../data/mockData';
import { 
  calculateHaversineDistanceKm, calculateDrivingDistanceKm, 
  calculateDrivingEtaMins, getCurrentCollectorLocation, getGoogleMapsDirectionsUrl 
} from '../utils/geo';
import { VoiceButton } from '../components/VoiceButton';
import { playChime } from '../utils/audioSpeech';

interface Step6RecyclerMapScreenProps {
  language: Language;
  category: WasteCategory;
  weightKg: number;
  calculatedPricePerKg: number;
  onSelectRecycler: (recycler: Recycler) => void;
  onBack: () => void;
}

export const Step6RecyclerMapScreen: React.FC<Step6RecyclerMapScreenProps> = ({
  language,
  category,
  weightKg,
  calculatedPricePerKg,
  onSelectRecycler,
  onBack,
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

  // Fetch real GPS on mount
  useEffect(() => {
    getCurrentCollectorLocation().then((loc) => {
      setCollectorLoc(loc);
    });
  }, []);

  // Filter recyclers: ONLY show authorized recyclers accepting the current waste category
  const filteredRecyclers = MOCK_RECYCLERS.filter((r) =>
    r.acceptedCategories.includes(category)
  ).map((r) => {
    const straightKm = calculateHaversineDistanceKm(collectorLoc.lat, collectorLoc.lng, r.lat, r.lng);
    const drivingKm = calculateDrivingDistanceKm(straightKm);
    const drivingEta = calculateDrivingEtaMins(drivingKm);
    const offeredPricePerKg = Math.round(calculatedPricePerKg * r.priceMultiplier * 10) / 10;
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
  const sortedRecyclers = [...filteredRecyclers].sort((a, b) => {
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

  const speechText =
    language === 'hi'
      ? `आपके पास ${sortedRecyclers.length} सीपीसीबी अधिकृत रिसाइकलर मिले हैं जो ${category} स्वीकार करते हैं। सबसे निकटतम रिसाइकलर ${sortedRecyclers[0]?.name} है जो ${sortedRecyclers[0]?.distanceKm} किमी दूर है।`
      : language === 'mr'
      ? `तुमच्याजवळ ${sortedRecyclers.length} अधिकृत रिसायकलर उपलब्ध आहेत. सर्वात जवळचे केंद्र ${sortedRecyclers[0]?.name} हे ${sortedRecyclers[0]?.distanceKm} किमी अंतरावर आहे.`
      : `Found ${sortedRecyclers.length} CPCB authorized recyclers accepting ${category}. Nearest is ${sortedRecyclers[0]?.name} at ${sortedRecyclers[0]?.distanceKm} km.`;

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#DDE6E0]">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#17231D] flex items-center gap-2.5">
            <MapPin className="w-6 h-6 text-[#176B45]" />
            <span>{t.compareRecyclers}</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#66736C] mt-0.5">
            {t.nearYou} <strong className="text-[#176B45] font-semibold">{category}</strong>
          </p>
        </div>
        <VoiceButton textToSpeak={speechText} language={language} label={t.listenAudio} size="md" />
      </div>

      {/* View Switcher: Live Map vs Low-Bandwidth List */}
      <div className="flex items-center justify-between bg-white p-2 rounded-2xl border border-[#DDE6E0] shadow-xs">
        <div className="inline-flex rounded-xl bg-[#F7F9F8] p-1 text-xs sm:text-sm font-bold border border-[#DDE6E0]">
          <button
            id="tab-map-view"
            onClick={() => setActiveTab('map')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'map'
                ? 'bg-[#176B45] text-white shadow-xs'
                : 'text-[#66736C] hover:text-[#17231D]'
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
                ? 'bg-[#176B45] text-white shadow-xs'
                : 'text-[#66736C] hover:text-[#17231D]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{t.listView}</span>
          </button>
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-1.5 text-xs sm:text-sm px-2">
          <ArrowUpDown className="w-4 h-4 text-[#66736C]" />
          <select
            id="sort-recyclers-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[#F7F9F8] font-bold text-[#17231D] text-xs sm:text-sm py-1.5 px-2.5 rounded-lg border border-[#DDE6E0] focus:ring-1 focus:ring-[#176B45] cursor-pointer"
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
          {/* Interactive Styled Map Canvas */}
          <div className="relative rounded-2xl overflow-hidden border border-[#DDE6E0] bg-[#E5E9E6] h-[300px] select-none shadow-xs">
            {/* Map Roads & Geography Canvas background */}
            <svg className="w-full h-full absolute inset-0 opacity-55 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#D1D5DB" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              {/* Main Arterial Roads */}
              <path d="M-20,140 Q150,110 320,150 T600,130" fill="none" stroke="#FFFFFF" strokeWidth="12" />
              <path d="M-20,140 Q150,110 320,150 T600,130" fill="none" stroke="#FDE047" strokeWidth="3" />
              <path d="M120,-20 Q140,160 160,340" fill="none" stroke="#FFFFFF" strokeWidth="10" />
              <path d="M260,-20 Q240,180 270,340" fill="none" stroke="#FFFFFF" strokeWidth="8" />
              {/* Rail / Transit */}
              <path d="M80,-20 L90,340" fill="none" stroke="#94A3B8" strokeWidth="2" strokeDasharray="6,4" />
            </svg>

            {/* GPS Location Pill */}
            <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-full text-xs font-bold text-[#17231D] border border-[#DDE6E0] flex items-center gap-2 shadow-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
              <span className="truncate max-w-[200px]">{collectorLoc.areaName}</span>
            </div>

            {/* CPCB Verified Recyclers Overlay */}
            <div className="absolute bottom-3 left-3 z-10 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg text-[11px] text-[#66736C] font-semibold border border-[#DDE6E0] shadow-xs">
              CPCB E-Waste Authorized Registry
            </div>

            {/* Collector Blue GPS Marker */}
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
              style={{ left: '38%', top: '62%' }}
            >
              <div className="relative">
                <div className="w-6 h-6 rounded-full bg-blue-600 border-2 border-white shadow flex items-center justify-center text-white">
                  <Navigation className="w-3 h-3 rotate-45" />
                </div>
                <div className="absolute top-7 -left-3 bg-[#17231D] text-white text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap shadow-xs">
                  {language === 'hi' ? 'आप यहां हैं' : 'You (GPS)'}
                </div>
              </div>
            </div>

            {/* Recycler Pins */}
            {sortedRecyclers.map((rec, idx) => {
              const positions = [
                { left: '68%', top: '35%' },
                { left: '46%', top: '28%' },
                { left: '22%', top: '48%' },
                { left: '78%', top: '65%' },
              ];
              const pos = positions[idx % positions.length];
              const isSelected = rec.id === (selectedRecyclerId || sortedRecyclers[0]?.id);

              return (
                <button
                  key={rec.id}
                  id={`map-pin-${rec.id}`}
                  onClick={() => {
                    playChime('click');
                    setSelectedRecyclerId(rec.id);
                  }}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 z-20 transition-all cursor-pointer ${
                    isSelected ? 'scale-110 z-30' : 'scale-95 hover:scale-105'
                  }`}
                  style={{ left: pos.left, top: pos.top }}
                >
                  <div className="flex flex-col items-center">
                    <div
                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-0.5 shadow-sm ${
                        isSelected
                          ? 'bg-[#176B45] text-white border-white ring-2 ring-[#176B45]/30'
                          : 'bg-white text-[#17231D] border-[#DDE6E0]'
                      }`}
                    >
                      <IndianRupee className="w-3 h-3" />
                      <span>{rec.totalOffered}</span>
                    </div>

                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center border-2 border-white mt-1 shadow-sm ${
                        isSelected ? 'bg-[#176B45] text-white' : 'bg-[#238B5A] text-white'
                      }`}
                    >
                      <MapPin className="w-4 h-4 fill-current" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Recycler Card */}
          {activeRecycler && (
            <div className="bg-white rounded-2xl border-2 border-[#176B45] p-5 sm:p-6 space-y-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base sm:text-lg text-[#17231D]">
                      {activeRecycler.name}
                    </h3>
                    <ShieldCheck className="w-5 h-5 text-[#16834A]" />
                  </div>
                  <p className="text-xs sm:text-sm text-[#66736C] mt-0.5">
                    {activeRecycler.address}, {activeRecycler.city}
                  </p>
                  <p className="text-xs font-mono text-[#176B45] font-semibold mt-1">
                    {activeRecycler.cpcbRegNumber}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xl sm:text-2xl font-extrabold text-[#176B45] tabular-nums">
                    ₹{activeRecycler.totalOffered}
                  </div>
                  <span className="text-xs text-[#66736C] block tabular-nums">
                    (₹{activeRecycler.offeredPricePerKg}/kg)
                  </span>
                </div>
              </div>

              {/* Badges Row: Distance, ETA, Pickup */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs sm:text-sm">
                <div className="p-2.5 rounded-xl bg-[#F7F9F8] border border-[#DDE6E0]">
                  <span className="text-xs text-[#66736C] block">{t.sortDistance}</span>
                  <span className="font-bold text-[#17231D] tabular-nums">{activeRecycler.distanceKm} km</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#F7F9F8] border border-[#DDE6E0]">
                  <span className="text-xs text-[#66736C] block">Drive ETA</span>
                  <span className="font-bold text-[#17231D] tabular-nums">{activeRecycler.drivingEtaMins} mins</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#F7F9F8] border border-[#DDE6E0]">
                  <span className="text-xs text-[#66736C] block">Pickup</span>
                  <span className="font-bold text-[#176B45]">
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
                  className="py-3 px-4 bg-[#F7F9F8] hover:bg-gray-100 text-[#17231D] border border-[#DDE6E0] rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Navigation className="w-4 h-4 text-blue-700" />
                  <span>{t.getDirections}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#66736C]" />
                </a>

                <button
                  id="btn-select-active-recycler"
                  onClick={() => handleProceedWithRecycler(activeRecycler)}
                  className="flex-1 py-3 px-5 bg-[#176B45] hover:bg-[#238B5A] text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xs hover:shadow-md transition-all"
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
                  isSelected ? 'border-2 border-[#176B45]' : 'border-[#DDE6E0]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm sm:text-base text-[#17231D]">{rec.name}</h4>
                      <ShieldCheck className="w-4 h-4 text-[#16834A]" />
                    </div>
                    <p className="text-xs text-[#66736C] mt-0.5">{rec.address}</p>
                    <span className="text-[11px] font-mono text-[#176B45] bg-[#EAF6EF] px-2 py-0.5 rounded-md font-semibold mt-1 inline-block">
                      {rec.cpcbRegNumber}
                    </span>
                  </div>

                  <div className="text-right">
                    <div className="text-lg sm:text-xl font-extrabold text-[#176B45] tabular-nums">
                      ₹{rec.totalOffered}
                    </div>
                    <span className="text-xs text-[#66736C] tabular-nums">
                      ₹{rec.offeredPricePerKg}/kg
                    </span>
                  </div>
                </div>

                {/* Metrics */}
                <div className="flex items-center justify-between text-xs sm:text-sm text-[#66736C] pt-2 border-t border-[#DDE6E0]">
                  <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Navigation className="w-3.5 h-3.5 text-[#66736C]" />
                      <span className="tabular-nums">{rec.distanceKm} km ({rec.drivingEtaMins} min)</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-[#66736C]" />
                      <span>{rec.pickupAvailable ? 'Doorstep pickup' : 'Drop-off'}</span>
                    </span>
                  </div>

                  {/* Compare checkbox */}
                  <button
                    onClick={(e) => handleToggleCompare(rec.id, e)}
                    className={`text-xs font-bold px-3 py-1 rounded-full border transition-colors cursor-pointer ${
                      isCompared
                        ? 'bg-[#EAF6EF] text-[#176B45] border-[#176B45]'
                        : 'bg-[#F7F9F8] text-[#17231D] border-[#DDE6E0] hover:bg-gray-100'
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
                    className="p-3 bg-[#F7F9F8] rounded-xl text-[#17231D] border border-[#DDE6E0] hover:bg-gray-100 transition-colors"
                    title="Google Maps Navigation"
                  >
                    <Navigation className="w-4 h-4 text-blue-700" />
                  </a>

                  <button
                    id={`btn-select-list-${rec.id}`}
                    onClick={() => handleProceedWithRecycler(rec)}
                    className="flex-1 py-3 px-4 bg-[#176B45] hover:bg-[#238B5A] text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
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
            className="w-full py-3 px-5 bg-[#176B45] hover:bg-[#238B5A] text-white rounded-2xl font-bold text-xs sm:text-sm shadow-xl flex items-center justify-between cursor-pointer transition-all"
          >
            <div className="flex items-center gap-2.5">
              <Layers className="w-5 h-5" />
              <span>{t.compareSelected} ({compareIds.length} Recyclers)</span>
            </div>
            <span className="bg-white/20 px-3 py-1 rounded-full text-xs">View Side-by-Side</span>
          </button>
        </div>
      )}

      {/* Side-by-Side Recycler Comparison Modal */}
      {showCompareModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[85vh] overflow-y-auto p-5 sm:p-6 space-y-5 shadow-2xl border border-[#DDE6E0]">
            <div className="flex items-center justify-between border-b border-[#DDE6E0] pb-3">
              <h3 className="font-extrabold text-base sm:text-lg text-[#17231D] flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#176B45]" />
                <span>Side-by-Side Recycler Comparison</span>
              </h3>
              <button
                onClick={() => setShowCompareModal(false)}
                className="w-8 h-8 rounded-full bg-[#F7F9F8] hover:bg-gray-100 flex items-center justify-center text-[#17231D] border border-[#DDE6E0] cursor-pointer transition-colors"
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
                  <div key={rec.id} className="border border-[#DDE6E0] rounded-xl p-4 bg-[#F7F9F8] space-y-3">
                    <div>
                      <h4 className="font-bold text-[#17231D] text-xs sm:text-sm truncate">{rec.name}</h4>
                      <p className="text-[11px] text-[#66736C] font-mono mt-0.5">{rec.cpcbRegNumber}</p>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-[#DDE6E0] text-center shadow-xs">
                      <span className="text-xs text-[#66736C] block">Total Offer</span>
                      <span className="text-xl font-extrabold text-[#176B45] tabular-nums">₹{rec.totalOffered}</span>
                      <span className="text-xs text-[#66736C] block tabular-nums">₹{rec.offeredPricePerKg}/kg</span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#66736C]">Distance:</span>
                        <span className="font-bold tabular-nums text-[#17231D]">{rec.distanceKm} km</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#66736C]">Drive ETA:</span>
                        <span className="font-bold tabular-nums text-[#17231D]">{rec.drivingEtaMins} min</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#66736C]">Pickup:</span>
                        <span className="font-bold text-[#16834A]">
                          {rec.pickupAvailable ? 'Doorstep' : 'Depot'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#66736C]">Rating:</span>
                        <span className="font-bold text-[#E59A23] tabular-nums">★ {rec.rating}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setShowCompareModal(false);
                        handleProceedWithRecycler(rec);
                      }}
                      className="w-full py-2.5 bg-[#176B45] text-white rounded-xl font-bold text-xs sm:text-sm hover:bg-[#238B5A] cursor-pointer shadow-xs transition-colors"
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
          className="w-full py-3 px-5 bg-[#F7F9F8] hover:bg-gray-100 text-[#17231D] border border-[#DDE6E0] rounded-xl font-bold text-xs sm:text-sm cursor-pointer transition-colors"
        >
          {t.back}
        </button>
      </div>
    </div>
  );
};
