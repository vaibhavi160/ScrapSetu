import React from 'react';
import { WifiOff, ShieldAlert, BarChart3, Settings as SettingsIcon, User, Database, LogIn, LogOut } from 'lucide-react';
import { Language, AppSettings, UserProfile } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { playChime } from '../utils/audioSpeech';

interface HeaderProps {
  settings?: AppSettings;
  language?: Language;
  onLanguageChange?: (lang: Language) => void;
  onUpdateSettings?: (newSettings: Partial<AppSettings>) => void;
  isOffline?: boolean;
  pendingSyncCount?: number;
  onTriggerSync?: () => void;
  onOpenSafety: () => void;
  onOpenImpact: () => void;
  onOpenSettings: () => void;
  currentStep?: number;
  onResetToHome?: () => void;
  currentUser?: UserProfile | null;
  onOpenAuth?: () => void;
  onOpenDatabase?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  language,
  onLanguageChange,
  onUpdateSettings,
  isOffline: isOfflineProp,
  pendingSyncCount = 0,
  onTriggerSync,
  onOpenSafety,
  onOpenImpact,
  onOpenSettings,
  currentStep = 1,
  onResetToHome,
  currentUser,
  onOpenAuth,
  onOpenDatabase,
  onLogout,
}) => {
  const currentLanguage: Language = language || settings?.language || 'hi';
  const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.hi;

  const handleLanguageChange = (lang: Language) => {
    playChime('click');
    if (onLanguageChange) {
      onLanguageChange(lang);
    } else if (onUpdateSettings) {
      onUpdateSettings({ language: lang });
    }
  };

  const isOffline = isOfflineProp !== undefined ? isOfflineProp : !!settings?.offlineSimulation;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E5EAE7] shadow-2xs">
      {/* Main Header Bar */}
      <div className="px-3 sm:px-6 py-2.5 max-w-5xl mx-auto flex items-center justify-between gap-2">
        {/* Brand & Identity */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            id="app-logo-btn"
            onClick={onResetToHome}
            className="flex items-center gap-2 sm:gap-2.5 text-left group cursor-pointer"
          >
            {/* Real Logo Image */}
            <div className="w-10 h-10 rounded-2xl bg-[#E8F5E9] border border-[#D0E7D7] overflow-hidden p-1.5 shadow-2xs transition-transform group-hover:scale-105 flex items-center justify-center shrink-0">
              <img
                src="/logo-icon.png"
                alt="ScrapSetu Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/ScrapSetu.png';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-extrabold text-lg sm:text-xl tracking-tight text-[#107C41]">
                  ScrapSetu
                </h1>
                <span className="text-[10px] px-2 py-0.5 bg-[#E8F5E9] text-[#107C41] font-bold rounded-full border border-[#107C41]/20">
                  सेतु
                </span>
              </div>
              <p className="text-[11px] text-[#66736C] font-normal tracking-normal line-clamp-1">
                {currentLanguage === 'hi'
                  ? 'डिजिटल रीसाइक्लिंग व उचित मूल्य'
                  : 'Smart Scrap Marketplace & CPCB Rates'}
              </p>
            </div>
          </button>

          {isOffline && (
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FFF9E6] text-[#D97706] border border-[#F5D485] text-[11px] font-semibold">
              <WifiOff className="w-3 h-3" />
              <span>{t.offlineMode}</span>
            </div>
          )}
        </div>

        {/* Global Action Header Items */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Multilingual Selector Pill */}
          <div className="inline-flex items-center bg-[#F3F6F4] p-0.5 rounded-full border border-[#E5EAE7]">
            <button
              type="button"
              onClick={() => handleLanguageChange('hi')}
              className={`px-2 py-1 text-xs font-bold rounded-full transition-all cursor-pointer ${
                currentLanguage === 'hi'
                  ? 'bg-[#107C41] text-white shadow-2xs'
                  : 'text-[#66736C] hover:text-[#17231D]'
              }`}
            >
              हिन्दी
            </button>
            <button
              type="button"
              onClick={() => handleLanguageChange('mr')}
              className={`px-2 py-1 text-xs font-bold rounded-full transition-all cursor-pointer ${
                currentLanguage === 'mr'
                  ? 'bg-[#107C41] text-white shadow-2xs'
                  : 'text-[#66736C] hover:text-[#17231D]'
              }`}
            >
              मराठी
            </button>
            <button
              type="button"
              onClick={() => handleLanguageChange('en')}
              className={`px-2 py-1 text-xs font-bold rounded-full transition-all cursor-pointer ${
                currentLanguage === 'en'
                  ? 'bg-[#107C41] text-white shadow-2xs'
                  : 'text-[#66736C] hover:text-[#17231D]'
              }`}
            >
              EN
            </button>
          </div>

          {/* Quick Database Modal Trigger */}
          <button
            id="nav-db-btn"
            type="button"
            onClick={onOpenDatabase}
            className="w-9 h-9 rounded-full bg-[#F3F6F4] hover:bg-[#E8F5E9] text-[#66736C] hover:text-[#107C41] flex items-center justify-center transition-colors cursor-pointer border border-[#E5EAE7]"
            title="View Central Cloud Firestore Database"
          >
            <Database className="w-4 h-4" />
          </button>

          {/* User Account / Login State Pill */}
          {currentUser ? (
            <div className="flex items-center gap-1">
              <button
                id="nav-profile-btn"
                type="button"
                onClick={onOpenAuth}
                className="h-9 px-3 bg-[#E8F5E9] hover:bg-[#D7EED9] text-[#107C41] rounded-full font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-[#D0E7D7]"
                title={`Logged in as ${currentUser.name}`}
              >
                <div className="w-5 h-5 rounded-full bg-[#107C41] text-white flex items-center justify-center text-[10px]">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline truncate max-w-[90px]">{currentUser.name.split(' ')[0]}</span>
              </button>
              <button
                id="nav-logout-btn"
                type="button"
                onClick={onLogout}
                className="w-9 h-9 rounded-full bg-[#F3F6F4] hover:bg-red-50 text-[#8A968F] hover:text-red-600 flex items-center justify-center transition-colors cursor-pointer border border-[#E5EAE7]"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              id="nav-login-btn"
              type="button"
              onClick={onOpenAuth}
              className="h-9 px-3.5 bg-[#107C41] hover:bg-[#0E6C38] text-white rounded-full font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{currentLanguage === 'hi' ? 'लॉग इन' : 'Login'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
