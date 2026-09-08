import React from 'react';
import { WifiOff, ShieldAlert, BarChart3, Settings as SettingsIcon, Sparkles, User, Database, LogIn, LogOut } from 'lucide-react';
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
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#DDE6E0] shadow-xs">
      {/* Main Header Bar */}
      <div className="px-3 sm:px-4 py-2.5 max-w-5xl mx-auto flex items-center justify-between gap-2">
        {/* Brand & Identity */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            id="app-logo-btn"
            onClick={onResetToHome}
            className="flex items-center gap-2.5 sm:gap-3 text-left group cursor-pointer"
          >
            {/* Real Logo Image */}
            <div className="w-10 h-10 rounded-xl bg-white border border-[#DDE6E0] overflow-hidden p-1 shadow-xs transition-transform group-hover:scale-105 flex items-center justify-center shrink-0">
              <img
                src="/ScrapSetu.png"
                alt="ScrapSetu Logo"
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="font-extrabold text-lg sm:text-xl tracking-tight text-[#17231D]">
                  ScrapSetu
                </h1>
                <span className="text-[10px] px-1.5 sm:px-2 py-0.5 bg-[#EAF6EF] text-[#176B45] font-bold rounded-full border border-[#176B45]/20">
                  सेतु
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-[#66736C] font-normal tracking-normal line-clamp-1">
                {currentLanguage === 'hi'
                  ? 'कबाड़ीवाला कनेक्ट • डिजिटल रीसाइक्लिंग'
                  : currentLanguage === 'mr'
                  ? 'कबाडीवाला कनेक्ट • डिजिटल रिसायकलिंग'
                  : 'Smart Scrap Marketplace & AI Pricing'}
              </p>
            </div>
          </button>

          {isOffline && (
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#FEF6E9] text-[#E59A23] border border-[#E59A23]/30 text-[11px] font-medium">
              <WifiOff className="w-3 h-3 text-[#E59A23]" />
              <span className="hidden sm:inline">{t.offline}</span>
              {pendingSyncCount > 0 && (
                <span className="bg-[#E59A23] text-white rounded-full px-1.5 py-0.2 text-[10px] tabular-nums font-semibold">
                  {pendingSyncCount}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right Controls: Multilingual Toggle, Auth & Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* User Profile or Log In Button */}
          {currentUser ? (
            <div className="flex items-center gap-1 sm:gap-1.5">
              <button
                id="user-profile-db-btn"
                onClick={onOpenDatabase}
                className="h-8 sm:h-9 px-2 sm:px-2.5 rounded-xl flex items-center gap-1.5 bg-[#EAF6EF] text-[#176B45] border border-[#176B45]/30 hover:bg-[#D4EEDB] transition-all cursor-pointer text-xs font-bold"
                title="View Profile & Database"
              >
                <div className="w-5 h-5 rounded-full bg-[#176B45] text-white text-[10px] flex items-center justify-center font-black shrink-0">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[70px] sm:max-w-[100px] truncate hidden xs:inline">{currentUser.name}</span>
                <span className="text-[9px] bg-white text-[#176B45] px-1 py-0.2 rounded font-bold border border-[#176B45]/20 hidden md:inline">
                  DB
                </span>
              </button>

              {onLogout && (
                <button
                  id="nav-logout-btn"
                  onClick={() => {
                    playChime('click');
                    onLogout();
                  }}
                  className="h-8 sm:h-9 px-2 rounded-xl flex items-center gap-1 text-[#66736C] hover:text-red-600 hover:bg-red-50 border border-[#DDE6E0] hover:border-red-200 transition-all cursor-pointer text-xs font-semibold"
                  title={currentLanguage === 'hi' ? 'लॉग आउट करें' : 'Log Out'}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">
                    {currentLanguage === 'hi' ? 'लॉग आउट' : 'Log Out'}
                  </span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <button
                id="nav-login-btn"
                onClick={() => {
                  playChime('click');
                  if (onOpenAuth) onOpenAuth();
                }}
                className="h-8 sm:h-9 px-3 sm:px-3.5 rounded-xl flex items-center gap-1.5 bg-[#176B45] text-white hover:bg-[#125837] shadow-xs transition-all cursor-pointer text-xs font-bold"
                title="Log In / Register"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>
                  {currentLanguage === 'hi' ? 'लॉग इन' : currentLanguage === 'mr' ? 'लॉग इन' : 'Log In'}
                </span>
              </button>
              <button
                id="nav-database-btn"
                onClick={onOpenDatabase}
                className="h-8 sm:h-9 px-2 rounded-xl flex items-center gap-1 bg-[#F7F9F8] text-[#17231D] border border-[#DDE6E0] hover:border-[#176B45]/40 hover:bg-[#EAF6EF]/50 transition-all cursor-pointer text-xs font-bold"
                title="Database Records"
              >
                <Database className="w-3.5 h-3.5 text-[#176B45]" />
                <span className="hidden sm:inline">DB</span>
              </button>
            </div>
          )}

          {/* Language Switcher */}
          <div
            id="language-switcher"
            className="inline-flex items-center bg-[#F7F9F8] p-0.5 sm:p-1 rounded-xl border border-[#DDE6E0]"
          >
            <button
              id="lang-btn-hi"
              type="button"
              onClick={() => handleLanguageChange('hi')}
              className={`px-2 py-0.5 sm:px-2.5 sm:py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                currentLanguage === 'hi'
                  ? 'bg-[#176B45] text-white shadow-xs'
                  : 'text-[#66736C] hover:text-[#17231D]'
              }`}
            >
              हिन्दी
            </button>
            <button
              id="lang-btn-mr"
              type="button"
              onClick={() => handleLanguageChange('mr')}
              className={`hidden xs:inline-block px-2 py-0.5 sm:px-2.5 sm:py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                currentLanguage === 'mr'
                  ? 'bg-[#176B45] text-white shadow-xs'
                  : 'text-[#66736C] hover:text-[#17231D]'
              }`}
            >
              मराठी
            </button>
            <button
              id="lang-btn-en"
              type="button"
              onClick={() => handleLanguageChange('en')}
              className={`px-2 py-0.5 sm:px-2.5 sm:py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                currentLanguage === 'en'
                  ? 'bg-[#176B45] text-white shadow-xs'
                  : 'text-[#66736C] hover:text-[#17231D]'
              }`}
            >
              EN
            </button>
          </div>

          {/* Safety Guidance Quick Button */}
          <button
            id="nav-safety-btn"
            onClick={onOpenSafety}
            className="h-8 sm:h-9 px-2 sm:px-2.5 rounded-xl flex items-center gap-1.5 bg-[#F7F9F8] text-[#17231D] border border-[#DDE6E0] hover:border-[#176B45]/40 hover:bg-[#EAF6EF]/50 transition-all cursor-pointer text-xs font-semibold"
            title="Safety Guidance (Audio & Pictorial)"
          >
            <ShieldAlert className="w-4 h-4 text-[#E59A23]" />
            <span className="hidden md:inline">{t.safety}</span>
          </button>

          {/* Impact Dashboard Quick Button */}
          <button
            id="nav-impact-btn"
            onClick={onOpenImpact}
            className="h-8 sm:h-9 px-2 sm:px-2.5 rounded-xl flex items-center gap-1.5 bg-[#EAF6EF] text-[#176B45] border border-[#176B45]/20 hover:bg-[#EAF6EF]/80 transition-all cursor-pointer text-xs font-semibold"
            title="EPR Compliance & Social Impact"
          >
            <BarChart3 className="w-4 h-4 text-[#176B45]" />
            <span className="hidden md:inline">{t.impact}</span>
          </button>

          {/* Settings Modal Button */}
          <button
            id="nav-settings-btn"
            onClick={onOpenSettings}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center bg-[#F7F9F8] text-[#66736C] border border-[#DDE6E0] hover:text-[#17231D] hover:border-[#176B45]/40 transition-all cursor-pointer"
            title="App Settings"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

