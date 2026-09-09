import React from 'react';
import { Home, MapPin, Camera, FileSpreadsheet, Settings } from 'lucide-react';
import { FlowStep, Language } from '../types';

export type NavTab = 'home' | 'recyclers' | 'scan' | 'ledger' | 'settings';

interface BottomNavProps {
  currentStep?: FlowStep;
  activeTab?: NavTab;
  onNavigateStep?: (step: FlowStep) => void;
  onTabChange?: (tab: NavTab) => void;
  onOpenSettings?: () => void;
  language: Language;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentStep = 1,
  activeTab,
  onNavigateStep,
  onTabChange,
  onOpenSettings,
  language,
}) => {
  // Determine if a given tab is active
  const isTabActive = (tab: NavTab, step: FlowStep) => {
    if (activeTab) return activeTab === tab;
    return currentStep === step;
  };

  const handleNav = (step: FlowStep, tab: NavTab) => {
    if (typeof onNavigateStep === 'function') {
      onNavigateStep(step);
    }
    if (typeof onTabChange === 'function') {
      onTabChange(tab);
    }
  };

  const handleSettings = () => {
    if (typeof onOpenSettings === 'function') {
      onOpenSettings();
    } else if (typeof onTabChange === 'function') {
      onTabChange('settings');
    }
  };

  const isHome = isTabActive('home', 1);
  const isRecyclers = isTabActive('recyclers', 6);
  const isLedger = isTabActive('ledger', 10);
  const isSettings = activeTab === 'settings';

  return (
    <nav
      id="bottom-navigation-bar"
      aria-label="Main Navigation"
      className="sticky bottom-0 z-40 w-full bg-white border-t border-[#E5EAE7] shadow-[0_-4px_16px_rgba(0,0,0,0.06)] pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] px-3 sm:px-6"
    >
      <div className="max-w-md sm:max-w-lg mx-auto flex items-center justify-between relative">
        {/* Tab 1: Home */}
        <button
          id="bottom-nav-home"
          type="button"
          onClick={() => handleNav(1, 'home')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
            isHome ? 'text-[#E8433D]' : 'text-slate-400 hover:text-[#0F1A3C]'
          }`}
        >
          <Home className={`w-5 h-5 ${isHome ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className={`text-[10px] sm:text-[11px] mt-1 font-medium ${isHome ? 'font-bold text-[#E8433D]' : ''}`}>
            {language === 'hi' ? 'होम' : language === 'mr' ? 'मुख्यपृष्ठ' : 'Home'}
          </span>
        </button>

        {/* Tab 2: Recyclers / History */}
        <button
          id="bottom-nav-recyclers"
          type="button"
          onClick={() => handleNav(6, 'recyclers')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
            isRecyclers ? 'text-[#E8433D]' : 'text-slate-400 hover:text-[#0F1A3C]'
          }`}
        >
          <MapPin className={`w-5 h-5 ${isRecyclers ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className={`text-[10px] sm:text-[11px] mt-1 font-medium ${isRecyclers ? 'font-bold text-[#E8433D]' : ''}`}>
            {language === 'hi' ? 'रीसाइक्लर' : language === 'mr' ? 'रिसायकलर' : 'Recyclers'}
          </span>
        </button>

        {/* Tab 3: Primary Center Action (Camera / Scan) - Raised Bold Red Circle */}
        <div className="flex flex-col items-center justify-center flex-1 -mt-6">
          <button
            id="bottom-nav-scan-primary"
            type="button"
            onClick={() => handleNav(2, 'scan')}
            title={language === 'hi' ? 'कबाड़ स्कैन करें' : language === 'mr' ? 'कचरा स्कॅन करा' : 'Scan Scrap'}
            className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#E8433D] hover:bg-[#D32F2F] active:scale-95 text-white shadow-lg shadow-[#E8433D]/30 border-4 border-white flex items-center justify-center transition-all cursor-pointer group"
          >
            <Camera className="w-6 h-6 stroke-[2.2] group-hover:scale-110 transition-transform" />
          </button>
          <span className="text-[10px] font-bold text-[#E8433D] mt-0.5">
            {language === 'hi' ? 'स्कैन' : language === 'mr' ? 'स्कॅन' : 'Scan'}
          </span>
        </div>

        {/* Tab 4: Ledger / Rewards */}
        <button
          id="bottom-nav-ledger"
          type="button"
          onClick={() => handleNav(10, 'ledger')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
            isLedger ? 'text-[#E8433D]' : 'text-slate-400 hover:text-[#0F1A3C]'
          }`}
        >
          <FileSpreadsheet className={`w-5 h-5 ${isLedger ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className={`text-[10px] sm:text-[11px] mt-1 font-medium ${isLedger ? 'font-bold text-[#E8433D]' : ''}`}>
            {language === 'hi' ? 'बहीखाता' : language === 'mr' ? 'खातेवही' : 'Ledger'}
          </span>
        </button>

        {/* Tab 5: Settings / Profile */}
        <button
          id="bottom-nav-settings"
          type="button"
          onClick={handleSettings}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
            isSettings ? 'text-[#E8433D]' : 'text-slate-400 hover:text-[#0F1A3C]'
          }`}
        >
          <Settings className={`w-5 h-5 ${isSettings ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className={`text-[10px] sm:text-[11px] mt-1 font-medium ${isSettings ? 'font-bold text-[#E8433D]' : ''}`}>
            {language === 'hi' ? 'सेटिंग्स' : language === 'mr' ? 'सेटिंग्ज' : 'Settings'}
          </span>
        </button>
      </div>
    </nav>
  );
};
