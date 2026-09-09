import React from 'react';
import { LayoutDashboard, CheckCircle, FileSpreadsheet, Building2, IndianRupee, Tag } from 'lucide-react';
import { Language } from '../types';

export type RecyclerNavTab = 'requests' | 'rates' | 'handover' | 'compliance' | 'profile';

interface RecyclerBottomNavProps {
  activeTab: RecyclerNavTab;
  onTabChange: (tab: RecyclerNavTab) => void;
  pendingCount?: number;
  language: Language;
}

export const RecyclerBottomNav: React.FC<RecyclerBottomNavProps> = ({
  activeTab,
  onTabChange,
  pendingCount = 0,
  language,
}) => {
  const isTabActive = (tab: RecyclerNavTab) => activeTab === tab;

  return (
    <nav
      id="recycler-bottom-nav-bar"
      aria-label="Recycler Navigation"
      className="sticky bottom-0 z-40 w-full bg-white border-t border-[#E5EAE7] shadow-[0_-4px_12px_rgba(0,0,0,0.04)] py-1.5 px-3 sm:px-6"
    >
      <div className="max-w-md sm:max-w-xl mx-auto flex items-center justify-between relative">
        {/* Tab 1: Requests Dashboard */}
        <button
          id="recycler-nav-requests"
          type="button"
          onClick={() => onTabChange('requests')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer relative ${
            isTabActive('requests') ? 'text-[#E8433D]' : 'text-slate-400 hover:text-[#0F1A3C]'
          }`}
        >
          <div className="relative">
            <LayoutDashboard className={`w-5 h-5 ${isTabActive('requests') ? 'stroke-[2.5]' : 'stroke-2'}`} />
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1.5 py-0.2 bg-[#E8433D] text-white text-[9px] font-black rounded-full min-w-[15px] text-center">
                {pendingCount}
              </span>
            )}
          </div>
          <span
            className={`text-[10px] sm:text-[11px] mt-1 font-medium ${
              isTabActive('requests') ? 'font-bold text-[#E8433D]' : ''
            }`}
          >
            {language === 'hi' ? 'पिकअप' : 'Requests'}
          </span>
        </button>

        {/* Tab 2: Rate Card & Categories Manager */}
        <button
          id="recycler-nav-rates"
          type="button"
          onClick={() => onTabChange('rates')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
            isTabActive('rates') ? 'text-[#E8433D]' : 'text-slate-400 hover:text-[#0F1A3C]'
          }`}
        >
          <IndianRupee className={`w-5 h-5 ${isTabActive('rates') ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span
            className={`text-[10px] sm:text-[11px] mt-1 font-medium ${
              isTabActive('rates') ? 'font-bold text-[#E8433D]' : ''
            }`}
          >
            {language === 'hi' ? 'दर सूची' : 'Rate Card'}
          </span>
        </button>

        {/* Tab 3: Raised Center Action - Digital Handover */}
        <div className="flex flex-col items-center justify-center flex-1 -mt-6">
          <button
            id="recycler-nav-handover-primary"
            type="button"
            onClick={() => onTabChange('handover')}
            title={language === 'hi' ? 'डिजिटल हैंडओवर सत्यापित करें' : 'Verify Handover'}
            className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#E8433D] hover:bg-[#D32F2F] active:scale-95 text-white shadow-lg shadow-[#E8433D]/30 border-4 border-white flex items-center justify-center transition-all cursor-pointer group"
          >
            <CheckCircle className="w-6 h-6 stroke-[2.2] group-hover:scale-110 transition-transform" />
          </button>
          <span className="text-[10px] font-bold text-[#E8433D] mt-0.5">
            {language === 'hi' ? 'हैंडओवर' : 'Handover'}
          </span>
        </div>

        {/* Tab 4: EPR Compliance Ledger */}
        <button
          id="recycler-nav-compliance"
          type="button"
          onClick={() => onTabChange('compliance')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
            isTabActive('compliance') ? 'text-[#E8433D]' : 'text-slate-400 hover:text-[#0F1A3C]'
          }`}
        >
          <FileSpreadsheet className={`w-5 h-5 ${isTabActive('compliance') ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span
            className={`text-[10px] sm:text-[11px] mt-1 font-medium ${
              isTabActive('compliance') ? 'font-bold text-[#E8433D]' : ''
            }`}
          >
            {language === 'hi' ? 'EPR बहीखाता' : 'Ledger'}
          </span>
        </button>

        {/* Tab 5: Facility Profile */}
        <button
          id="recycler-nav-profile"
          type="button"
          onClick={() => onTabChange('profile')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
            isTabActive('profile') ? 'text-[#E8433D]' : 'text-slate-400 hover:text-[#0F1A3C]'
          }`}
        >
          <Building2 className={`w-5 h-5 ${isTabActive('profile') ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span
            className={`text-[10px] sm:text-[11px] mt-1 font-medium ${
              isTabActive('profile') ? 'font-bold text-[#E8433D]' : ''
            }`}
          >
            {language === 'hi' ? 'प्रोफ़ाइल' : 'Profile'}
          </span>
        </button>
      </div>
    </nav>
  );
};
