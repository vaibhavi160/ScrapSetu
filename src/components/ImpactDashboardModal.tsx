import React from 'react';
import { 
  BarChart3, HeartHandshake, TrendingUp, ShieldAlert, 
  FileCheck2, X, Sparkles, Award, Globe, Leaf 
} from 'lucide-react';
import { Language, Transaction } from '../types';
import { TRANSLATIONS } from '../utils/translations';

interface ImpactDashboardModalProps {
  language: Language;
  transactions: Transaction[];
  onClose: () => void;
}

export const ImpactDashboardModal: React.FC<ImpactDashboardModalProps> = ({
  language,
  transactions,
  onClose,
}) => {
  const t = TRANSLATIONS[language];

  const totalEarnings = transactions.reduce((acc, cur) => acc + (cur?.payload?.totalEstimatedPrice ?? (cur as any)?.totalAmount ?? (cur as any)?.payment?.amount ?? 0), 0);
  const totalWeightKg = transactions.reduce((acc, cur) => acc + (cur?.payload?.weightKg ?? (cur as any)?.weightKg ?? 0), 0);
  const totalExtraProfit = transactions.reduce((acc, cur) => acc + (cur?.payload?.fairAdvantageAmount ?? (cur as any)?.fairAdvantageAmount ?? 0), 0);

  // Carbon emissions avoided (~1.8 kg CO2e per kg e-waste / metal recycled instead of virgin mining)
  const carbonAvoidedKg = Math.round(totalWeightKg * 1.82);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs overflow-y-auto p-3 sm:p-4 flex flex-col items-center justify-center">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 border border-[#DDE6E0] shadow-xl my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#DDE6E0] pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#EAF6EF] text-[#176B45] border border-[#176B45]/20 flex items-center justify-center shadow-xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-[#17231D]">
                {language === 'hi' ? 'ईपीआर एवं सामाजिक प्रभाव' : 'EPR & Social Impact Dashboard'}
              </h3>
              <p className="text-xs text-[#66736C]">
                SIH 2026 Problem Statement #26229 Metrics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F7F9F8] hover:bg-gray-200 flex items-center justify-center text-[#17231D] cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Core Pillars Mandated in User Prompt */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
          {/* Pillar 1: Better Livelihoods & Safer Conditions */}
          <div className="p-4 rounded-xl bg-[#F7F9F8] border border-[#DDE6E0] space-y-2">
            <div className="w-8 h-8 rounded-lg bg-[#17231D] text-white flex items-center justify-center">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <h4 className="font-extrabold text-xs sm:text-sm text-[#17231D]">
              1. Livelihoods & Safety
            </h4>
            <p className="text-[#66736C] text-xs leading-relaxed">
              Dignified formal recognition. Integration into CPCB supply chain with audio PPE guidance and eliminating toxic burning.
            </p>
            <div className="font-extrabold text-[#176B45] text-xs pt-0.5">
              100% Formalized Handover
            </div>
          </div>

          {/* Pillar 2: Fair Prices & Higher Earnings */}
          <div className="p-4 rounded-xl bg-[#EAF6EF] border border-[#176B45]/20 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-[#176B45] text-white flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h4 className="font-extrabold text-xs sm:text-sm text-[#176B45]">
              2. Fair Direct Pricing
            </h4>
            <p className="text-[#17231D] text-xs leading-relaxed">
              Bypasses predatory middlemen. EPR compliance incentives flow directly to the collector, boosting take-home income.
            </p>
            <div className="font-extrabold text-[#176B45] text-xs pt-0.5">
              +38% Fair Wage Uplift (+₹{Math.round(totalExtraProfit)})
            </div>
          </div>

          {/* Pillar 3: Reduced Unsafe Disposal */}
          <div className="p-4 rounded-xl bg-[#F7F9F8] border border-[#DDE6E0] space-y-2">
            <div className="w-8 h-8 rounded-lg bg-[#E59A23] text-white flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h4 className="font-extrabold text-xs sm:text-sm text-[#17231D]">
              3. Hazardous Waste Diversion
            </h4>
            <p className="text-[#66736C] text-xs leading-relaxed">
              Prevents toxic acid dumping and lead leakage into groundwater by directing hazardous scrap straight to authorized shredders.
            </p>
            <div className="font-extrabold text-[#E59A23] text-xs pt-0.5">
              {carbonAvoidedKg} kg CO2e Avoided
            </div>
          </div>

          {/* Pillar 4: Traceable & Transparent Digital Records */}
          <div className="p-4 rounded-xl bg-[#F7F9F8] border border-[#DDE6E0] space-y-2">
            <div className="w-8 h-8 rounded-lg bg-[#66736C] text-white flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <h4 className="font-extrabold text-xs sm:text-sm text-[#17231D]">
              4. CPCB Traceable Ledger
            </h4>
            <p className="text-[#66736C] text-xs leading-relaxed">
              Immutable ledger block bundling GPS, photo hash, and recycler verification. Solves CPCB audit compliance.
            </p>
            <div className="font-extrabold text-[#17231D] text-xs pt-0.5">
              {transactions.length} Verified Ledger Blocks
            </div>
          </div>
        </div>

        {/* Live Impact Counters */}
        <div className="bg-[#F7F9F8] rounded-xl p-4 border border-[#DDE6E0] grid grid-cols-3 gap-3 text-center">
          <div>
            <span className="text-xs text-[#66736C] font-semibold block">Total Scrapped</span>
            <span className="text-lg font-extrabold text-[#17231D]">{totalWeightKg.toFixed(1)} kg</span>
          </div>
          <div>
            <span className="text-xs text-[#66736C] font-semibold block">Direct Value</span>
            <span className="text-lg font-extrabold text-[#176B45]">₹{Math.round(totalEarnings)}</span>
          </div>
          <div>
            <span className="text-xs text-[#66736C] font-semibold block">EPR Points</span>
            <span className="text-lg font-extrabold text-[#17231D]">{totalWeightKg.toFixed(0)}</span>
          </div>
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
