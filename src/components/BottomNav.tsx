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
      className="sticky bottom-0 z-40 w-full bg-white border-t border-[#E5EAE7] shadow-[0_-4px_12px_rgba(0,0,0,0.04)] py-1.5 px-3 sm:px-6"
    >
      <div className="max-w-md sm:max-w-lg mx-auto flex items-center justify-between relative">
        {/* Tab 1: Home */}
        <button
          id="bottom-nav-home"
          type="button"
          onClick={() => handleNav(1, 'home')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
            isHome ? 'text-[#107C41]' : 'text-[#8A968F] hover:text-[#107C41]'
          }`}
        >
          <Home className={`w-5 h-5 ${isHome ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className={`text-[10px] sm:text-[11px] mt-1 font-medium ${isHome ? 'font-bold text-[#107C41]' : ''}`}>
            {language === 'hi' ? 'होम' : 'Home'}
          </span>
        </button>

        {/* Tab 2: Recyclers / Rates */}
        <button
          id="bottom-nav-recyclers"
          type="button"
          onClick={() => handleNav(6, 'recyclers')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
            isRecyclers ? 'text-[#107C41]' : 'text-[#8A968F] hover:text-[#107C41]'
          }`}
        >
          <MapPin className={`w-5 h-5 ${isRecyclers ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className={`text-[10px] sm:text-[11px] mt-1 font-medium ${isRecyclers ? 'font-bold text-[#107C41]' : ''}`}>
            {language === 'hi' ? 'रीसाइक्लर' : 'Recyclers'}
          </span>
        </button>

        {/* Tab 3: Primary Center Action (Camera / Scan) - Raised Green Circle */}
        <div className="flex flex-col items-center justify-center flex-1 -mt-5">
          <button
            id="bottom-nav-scan-primary"
            type="button"
            onClick={() => handleNav(2, 'scan')}
            title={language === 'hi' ? 'कबाड़ स्कैन करें' : 'Scan Scrap'}
            className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#107C41] hover:bg-[#0E6C38] active:scale-95 text-white shadow-md border-4 border-white flex items-center justify-center transition-all cursor-pointer group"
          >
            <Camera className="w-6 h-6 stroke-[2.2] group-hover:scale-110 transition-transform" />
          </button>
          <span className="text-[10px] font-bold text-[#107C41] mt-0.5">
            {language === 'hi' ? 'स्कैन' : 'Scan'}
          </span>
        </div>

        {/* Tab 4: Ledger / History */}
        <button
          id="bottom-nav-ledger"
          type="button"
          onClick={() => handleNav(10, 'ledger')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
            isLedger ? 'text-[#107C41]' : 'text-[#8A968F] hover:text-[#107C41]'
          }`}
        >
          <FileSpreadsheet className={`w-5 h-5 ${isLedger ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className={`text-[10px] sm:text-[11px] mt-1 font-medium ${isLedger ? 'font-bold text-[#107C41]' : ''}`}>
            {language === 'hi' ? 'बहीखाता' : 'Ledger'}
          </span>
        </button>

        {/* Tab 5: Settings / Profile */}
        <button
          id="bottom-nav-settings"
          type="button"
          onClick={handleSettings}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
            isSettings ? 'text-[#107C41]' : 'text-[#8A968F] hover:text-[#107C41]'
          }`}
        >
          <Settings className={`w-5 h-5 ${isSettings ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className={`text-[10px] sm:text-[11px] mt-1 font-medium ${isSettings ? 'font-bold text-[#107C41]' : ''}`}>
            {language === 'hi' ? 'सेटिंग्स' : 'Settings'}
          </span>
        </button>
      </div>
    </nav>
  );
};
