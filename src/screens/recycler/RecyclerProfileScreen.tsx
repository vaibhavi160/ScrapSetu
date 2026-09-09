import React, { useState } from 'react';
import {
  Building2,
  ShieldCheck,
  MapPin,
  Clock,
  Phone,
  Mail,
  CheckCircle2,
  Scale,
  Award,
  Truck,
  RotateCcw,
  Sliders,
} from 'lucide-react';
import { Language, UserProfile } from '../../types';
import { playChime } from '../../utils/audioSpeech';

interface RecyclerProfileScreenProps {
  currentUser: UserProfile | null;
  language: Language;
  onSwitchToCollector: () => void;
  onLogout: () => void;
}

export const RecyclerProfileScreen: React.FC<RecyclerProfileScreenProps> = ({
  currentUser,
  language,
  onSwitchToCollector,
  onLogout,
}) => {
  // Accepted materials toggle state
  const [acceptedMaterials, setAcceptedMaterials] = useState<Record<string, boolean>>({
    'Copper Wire & Motors': true,
    'PCBs & Circuit Boards': true,
    'Lithium-ion & Batteries': true,
    'Smartphones & Tablets': true,
    'White Goods / Appliances': true,
    'Plastics (HDPE/PET)': false,
  });

  const [serviceRadius, setServiceRadius] = useState<number>(15);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const toggleMaterial = (key: string) => {
    setAcceptedMaterials((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSavePreferences = () => {
    playChime('success');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div id="recycler-profile-screen" className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Facility Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-[#E5EAE7] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-[#107C41] text-white flex items-center justify-center font-black text-xl shadow-xs">
              <Building2 className="w-7 h-7 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-[#17231D]">
                  {currentUser?.name || 'EcoRecycle Green Tech Ltd.'}
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-black flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>CPCB Certified</span>
                </span>
              </div>
              <p className="text-xs text-[#66736C] mt-0.5">
                Authorized E-Waste Dismantler & Recycler (Registration #MH-0142)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="profile-switch-to-collector-btn"
              onClick={onSwitchToCollector}
              className="px-3.5 py-2 rounded-xl bg-[#E8F5E9] hover:bg-[#D7EED9] text-[#107C41] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Truck className="w-4 h-4" />
              <span>{language === 'hi' ? 'कलेक्टर पोर्टल में बदलें' : 'Switch to Collector View'}</span>
            </button>
          </div>
        </div>

        {/* Facility Credentials Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#F3F6F4] text-xs">
          <div className="p-3 rounded-xl bg-[#F7FAF8] border border-[#E5EAE7]">
            <span className="text-[11px] text-[#66736C] block">Authorization Validity</span>
            <strong className="text-[#17231D]">31 Dec 2028 (Active)</strong>
          </div>
          <div className="p-3 rounded-xl bg-[#F7FAF8] border border-[#E5EAE7]">
            <span className="text-[11px] text-[#66736C] block">Annual Capacity</span>
            <strong className="text-[#17231D]">5,000 MT / Year</strong>
          </div>
          <div className="p-3 rounded-xl bg-[#F7FAF8] border border-[#E5EAE7]">
            <span className="text-[11px] text-[#66736C] block">Operating Zone</span>
            <strong className="text-[#17231D]">Mumbai MMR</strong>
          </div>
          <div className="p-3 rounded-xl bg-[#F7FAF8] border border-[#E5EAE7]">
            <span className="text-[11px] text-[#66736C] block">SPCB Consent</span>
            <strong className="text-[#107C41]">Form-IV Approved</strong>
          </div>
        </div>
      </div>

      {/* Accepted Materials Configuration */}
      <div className="bg-white rounded-3xl p-6 border border-[#E5EAE7] shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-black text-[#17231D] tracking-tight">
            {language === 'hi' ? 'स्वीकृत स्क्रैप व ई-कचरा श्रेणियां' : 'Accepted Scrap & Waste Materials'}
          </h2>
          <p className="text-xs text-[#66736C]">
            Enable or disable categories for which informal collectors can route pickup requests to your facility.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries(acceptedMaterials).map(([material, isEnabled]) => (
            <div
              key={material}
              onClick={() => toggleMaterial(material)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                isEnabled
                  ? 'bg-[#E8F5E9]/60 border-[#107C41] text-[#17231D]'
                  : 'bg-[#F7FAF8] border-[#E5EAE7] text-[#8A968F]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    isEnabled ? 'bg-[#107C41] text-white' : 'border border-[#DCE3DD] bg-white'
                  }`}
                >
                  {isEnabled && <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />}
                </div>
                <span className="text-xs font-bold">{material}</span>
              </div>
              <span
                className={`text-[10px] font-black uppercase ${
                  isEnabled ? 'text-[#107C41]' : 'text-[#8A968F]'
                }`}
              >
                {isEnabled ? 'Active Intake' : 'Paused'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Service Area & Operational Settings */}
      <div className="bg-white rounded-3xl p-6 border border-[#E5EAE7] shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-black text-[#17231D] tracking-tight">
            {language === 'hi' ? 'पिकअप सेवा दायरा व संपर्क' : 'Service Radius & Operating Area'}
          </h2>
          <p className="text-xs text-[#66736C]">
            Set maximum operational radius for collector requests and verified logistics dispatch.
          </p>
        </div>

        {/* Radius Slider */}
        <div className="p-4 rounded-2xl bg-[#F7FAF8] border border-[#E5EAE7] space-y-3">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-[#17231D]">Pickup Service Radius:</span>
            <span className="text-base font-black text-[#107C41]">{serviceRadius} km</span>
          </div>
          <input
            type="range"
            min="5"
            max="40"
            step="1"
            value={serviceRadius}
            onChange={(e) => setServiceRadius(Number(e.target.value))}
            className="w-full accent-[#107C41] cursor-pointer"
          />
          <div className="flex items-center justify-between text-[10px] text-[#8A968F]">
            <span>5 km (Local Hub)</span>
            <span>15 km (Standard MMR)</span>
            <span>40 km (Inter-city)</span>
          </div>
        </div>

        {/* Facility Address & Hours */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-white border border-[#E5EAE7] space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[#17231D]">
              <MapPin className="w-4 h-4 text-[#107C41]" />
              <span>Plant & Yard Location</span>
            </div>
            <p className="text-[#66736C] text-[11px] leading-relaxed">
              Plot 42, TTC Industrial Area, MIDC Mahape, Navi Mumbai - 400710
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-[#E5EAE7] space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[#17231D]">
              <Clock className="w-4 h-4 text-[#107C41]" />
              <span>Intake Hours</span>
            </div>
            <p className="text-[#66736C] text-[11px] leading-relaxed">
              Mon - Sat: 08:00 AM - 07:00 PM • Digital Weighbridge Open
            </p>
          </div>
        </div>

        {/* Save Preferences Button */}
        {savedSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold text-center border border-emerald-200">
            Preferences saved successfully!
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleSavePreferences}
            className="flex-1 h-11 rounded-xl bg-[#107C41] hover:bg-[#0E6C38] text-white font-bold text-xs cursor-pointer shadow-xs transition-colors"
          >
            Save Facility Settings
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="px-4 h-11 rounded-xl bg-[#F3F6F4] hover:bg-red-50 hover:text-red-600 text-[#66736C] font-bold text-xs cursor-pointer transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
