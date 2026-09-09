import React, { useState } from 'react';
import { 
  WifiOff, MapPin, ChevronDown, Bell, LogIn, LogOut, 
  Truck, Building2, Check, Sparkles, X
} from 'lucide-react';
import { Language, AppSettings, UserProfile, SelectedRole } from '../types';
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
  onOpenSafety?: () => void;
  onOpenImpact?: () => void;
  onOpenSettings?: () => void;
  currentStep?: number;
  onResetToHome?: () => void;
  currentUser?: UserProfile | null;
  onOpenAuth?: () => void;
  onOpenDatabase?: () => void;
  onLogout?: () => void;
  currentRole?: SelectedRole;
  onSwitchRole?: (newRole: SelectedRole) => void;
}

const AVAILABLE_AREAS = [
  { id: 'dharavi', name: 'Dharavi, Mumbai', state: 'MH' },
  { id: 'kurla', name: 'Kurla West, Mumbai', state: 'MH' },
  { id: 'andheri', name: 'Andheri East, Mumbai', state: 'MH' },
  { id: 'coimbatore', name: 'Coimbatore, TN', state: 'TN' },
  { id: 'bengaluru', name: 'Peenya, Bengaluru', state: 'KA' },
  { id: 'delhi', name: 'Mayapuri, New Delhi', state: 'DL' },
];

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
  currentRole,
  onSwitchRole,
}) => {
  const currentLanguage: Language = language || settings?.language || 'hi';
  const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.hi;

  const [selectedArea, setSelectedArea] = useState<string>(
    currentUser?.city ? `${currentUser.city}, MH` : 'Dharavi, Mumbai'
  );
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);

  const notifications = [
    {
      id: 1,
      title: currentLanguage === 'hi' ? 'सीपीसीबी दर अपडेट' : 'CPCB Rate Update',
      desc: currentLanguage === 'hi' ? 'तांबा तार दर +₹15/किग्रा बढ़ा' : 'Copper wire rate increased by +₹15/kg',
      time: '10m ago',
      isNew: true,
    },
    {
      id: 2,
      title: currentLanguage === 'hi' ? 'भुगतान प्राप्त' : 'Payment Received',
      desc: currentLanguage === 'hi' ? '₹1,450 सीधा यूपीआई खाते में जमा' : '₹1,450 credited to bank UPI',
      time: '1h ago',
      isNew: true,
    },
    {
      id: 3,
      title: currentLanguage === 'hi' ? 'नया प्रमाणित केंद्र' : 'New Verified Hub',
      desc: currentLanguage === 'hi' ? 'ग्रीनअर्थ रीसाइक्लिंग केंद्र 1.8 किमी दूर जुड़ा' : 'GreenEarth Hub joined within 1.8 km',
      time: '3h ago',
      isNew: false,
    },
  ];

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
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Main Header Bar */}
      <div className="px-2.5 sm:px-6 py-2 sm:py-2.5 max-w-5xl mx-auto flex items-center justify-between gap-1.5 sm:gap-2">
        {/* Left Side: Location Selector + Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Brand Logo icon */}
          <button
            id="app-logo-btn"
            onClick={onResetToHome}
            className="flex items-center gap-2 text-left group cursor-pointer"
            title="ScrapSetu Home"
          >
            <div className="w-9 h-9 rounded-xl bg-[#0F1A3C] p-1.5 shadow-xs transition-transform group-hover:scale-105 flex items-center justify-center shrink-0">
              <img
                src="/logo-icon.png"
                alt="ScrapSetu Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/ScrapSetu.png';
                }}
              />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1">
                <span className="font-extrabold text-base tracking-tight text-[#0F1A3C]">
                  ScrapSetu
                </span>
                <span className="text-[10px] px-1.5 py-0.2 bg-[#E8433D]/10 text-[#E8433D] font-bold rounded-full">
                  सेतु
                </span>
              </div>
            </div>
          </button>

          {/* Location Pin Dropdown */}
          <div className="relative">
            <button
              id="header-location-selector"
              type="button"
              onClick={() => {
                playChime('click');
                setShowLocationDropdown(!showLocationDropdown);
              }}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-full bg-[#EEF1F8] hover:bg-[#E2E8F4] text-[#0F1A3C] transition-colors cursor-pointer border border-slate-200/80"
              title="Change location"
            >
              <MapPin className="w-3.5 h-3.5 text-[#E8433D] shrink-0" />
              <span className="text-[11px] sm:text-xs font-bold text-[#0F1A3C] max-w-[70px] xs:max-w-[105px] sm:max-w-[180px] truncate">
                {selectedArea}
              </span>
              <ChevronDown className={`w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500 transition-transform ${showLocationDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Location Selector Dropdown Menu */}
            {showLocationDropdown && (
              <div className="absolute left-0 mt-1.5 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {currentLanguage === 'hi' ? 'संग्रह क्षेत्र चुनें' : currentLanguage === 'mr' ? 'संकलन क्षेत्र निवडा' : 'Select Collection Area'}
                </div>
                {AVAILABLE_AREAS.map((area) => (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => {
                      setSelectedArea(area.name);
                      setShowLocationDropdown(false);
                      playChime('click');
                    }}
                    className={`w-full px-3.5 py-2 text-left text-xs font-medium flex items-center justify-between hover:bg-[#EEF1F8] transition-colors cursor-pointer ${
                      selectedArea === area.name ? 'text-[#E8433D] font-bold bg-[#EEF1F8]/60' : 'text-[#111827]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{area.name}</span>
                    </div>
                    {selectedArea === area.name && <Check className="w-3.5 h-3.5 text-[#E8433D]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {isOffline && (
            <div className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FFF9E6] text-[#D97706] border border-[#F5D485] text-[11px] font-semibold">
              <WifiOff className="w-3 h-3" />
              <span>{t.offlineMode}</span>
            </div>
          )}
        </div>

        {/* Right Side: Notification Bell with Red Dot Badge, Language, Role, Profile */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Notification Bell Icon */}
          <div className="relative">
            <button
              id="header-notification-bell"
              type="button"
              onClick={() => {
                playChime('click');
                setShowNotifications(!showNotifications);
                setHasUnread(false);
              }}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#EEF1F8] hover:bg-[#E2E8F4] text-[#0F1A3C] flex items-center justify-center transition-colors cursor-pointer border border-slate-200/80 relative"
              title="Notifications"
            >
              <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {hasUnread && (
                <span
                  id="notification-unread-dot"
                  className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-2 h-2 bg-[#E8433D] rounded-full ring-2 ring-white"
                />
              )}
            </button>

            {/* Notifications Popover */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-[#E8433D]" />
                    <span className="text-xs font-bold text-[#0F1A3C]">
                      {currentLanguage === 'hi' ? 'सूचनाएं' : currentLanguage === 'mr' ? 'सूचना' : 'Notifications'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNotifications(false)}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="p-2.5 rounded-xl bg-[#F8F9FD] border border-slate-100 hover:border-slate-200 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#0F1A3C]">{n.title}</span>
                        <span className="text-[10px] text-slate-400">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">{n.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Multilingual Selector Pill */}
          <div className="inline-flex items-center bg-[#EEF1F8] p-0.5 rounded-full border border-slate-200">
            <button
              type="button"
              onClick={() => handleLanguageChange('hi')}
              className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[11px] sm:text-xs font-bold rounded-full transition-all cursor-pointer ${
                currentLanguage === 'hi'
                  ? 'bg-[#0F1A3C] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#0F1A3C]'
              }`}
            >
              <span className="xs:hidden">हि</span>
              <span className="hidden xs:inline">हिन्दी</span>
            </button>
            <button
              type="button"
              onClick={() => handleLanguageChange('mr')}
              className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[11px] sm:text-xs font-bold rounded-full transition-all cursor-pointer ${
                currentLanguage === 'mr'
                  ? 'bg-[#0F1A3C] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#0F1A3C]'
              }`}
            >
              <span className="xs:hidden">म</span>
              <span className="hidden xs:inline">मराठी</span>
            </button>
            <button
              type="button"
              onClick={() => handleLanguageChange('en')}
              className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[11px] sm:text-xs font-bold rounded-full transition-all cursor-pointer ${
                currentLanguage === 'en'
                  ? 'bg-[#0F1A3C] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#0F1A3C]'
              }`}
            >
              EN
            </button>
          </div>

          {/* Active Role Switcher Pill */}
          {currentRole && onSwitchRole && (
            <button
              id="header-role-switcher-btn"
              type="button"
              onClick={() => {
                playChime('click');
                onSwitchRole(currentRole === 'recycler' ? 'collector' : 'recycler');
              }}
              title={
                currentRole === 'recycler'
                  ? 'Active: Recycler. Click to switch to Collector'
                  : 'Active: Collector. Click to switch to Recycler'
              }
              className={`h-8 sm:h-9 px-2 sm:px-3 rounded-full border text-[11px] sm:text-xs font-bold flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer shadow-xs shrink-0 ${
                currentRole === 'recycler'
                  ? 'bg-[#0F1A3C] border-[#0F1A3C] text-white'
                  : 'bg-white border-slate-200 text-[#0F1A3C] hover:bg-[#EEF1F8]'
              }`}
            >
              {currentRole === 'recycler' ? (
                <Building2 className="w-3.5 h-3.5 text-[#E8433D]" />
              ) : (
                <Truck className="w-3.5 h-3.5 text-[#E8433D]" />
              )}
              <span className="hidden md:inline capitalize">
                {currentRole === 'recycler'
                  ? currentLanguage === 'hi' ? 'रीसाइक्लर' : currentLanguage === 'mr' ? 'रिसायकलर' : 'Recycler'
                  : currentLanguage === 'hi' ? 'कलेक्टर' : currentLanguage === 'mr' ? 'कलेक्टर' : 'Collector'}
              </span>
            </button>
          )}

          {/* User Account / Login State Pill */}
          {currentUser ? (
            <div className="flex items-center gap-1 shrink-0">
              <button
                id="nav-profile-btn"
                type="button"
                onClick={onOpenAuth}
                className="h-8 sm:h-9 px-2 sm:px-3 bg-[#EEF1F8] hover:bg-[#E2E8F4] text-[#0F1A3C] rounded-full font-bold text-[11px] sm:text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
                title={`Logged in as ${currentUser.name}`}
              >
                <div className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-[#0F1A3C] text-white flex items-center justify-center text-[10px]">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden md:inline truncate max-w-[85px]">{currentUser.name.split(' ')[0]}</span>
              </button>
              <button
                id="nav-logout-btn"
                type="button"
                onClick={onLogout}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#EEF1F8] hover:bg-rose-50 text-slate-500 hover:text-[#E8433D] flex items-center justify-center transition-colors cursor-pointer border border-slate-200"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          ) : (
            <button
              id="nav-login-btn"
              type="button"
              onClick={onOpenAuth}
              className="h-8 sm:h-9 px-2.5 sm:px-3.5 bg-[#E8433D] hover:bg-[#D32F2F] text-white rounded-full font-bold text-[11px] sm:text-xs flex items-center gap-1 sm:gap-1.5 shadow-xs transition-colors cursor-pointer shrink-0"
            >
              <LogIn className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>{currentLanguage === 'hi' ? 'लॉग इन' : currentLanguage === 'mr' ? 'लॉगिन' : 'Login'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

