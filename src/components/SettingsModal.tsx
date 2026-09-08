import React from 'react';
import { 
  Settings as SettingsIcon, Languages, WifiOff, Wifi, 
  RefreshCw, SignalLow, User, Phone, Check, X, Shield 
} from 'lucide-react';
import { Language, AppSettings } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { playChime } from '../utils/audioSpeech';

interface SettingsModalProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  pendingSyncCount: number;
  onTriggerSync: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  pendingSyncCount,
  onTriggerSync,
  onClose,
}) => {
  const currentLanguage: Language = settings?.language || 'hi';
  const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.hi;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs overflow-y-auto p-3 sm:p-4 flex flex-col items-center justify-center">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 border border-[#DDE6E0] shadow-xl my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#DDE6E0] pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F7F9F8] text-[#17231D] border border-[#DDE6E0] flex items-center justify-center shadow-xs">
              <SettingsIcon className="w-5 h-5 text-[#176B45]" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-[#17231D]">{t.settings}</h3>
              <p className="text-xs text-[#66736C]">App Preferences & Offline Config</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F7F9F8] hover:bg-gray-200 flex items-center justify-center text-[#17231D] cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Language Selector */}
        <div className="space-y-2.5">
          <label className="text-xs font-extrabold text-[#17231D] flex items-center gap-2">
            <Languages className="w-4 h-4 text-[#176B45]" />
            <span>{languageSelectorLabel(currentLanguage)}</span>
          </label>

          <div className="grid grid-cols-3 gap-2.5">
            {[
              { code: 'hi' as Language, label: 'हिन्दी', sub: 'Hindi' },
              { code: 'mr' as Language, label: 'मराठी', sub: 'Marathi' },
              { code: 'en' as Language, label: 'English', sub: 'Default' },
            ].map((lang) => (
              <button
                key={lang.code}
                id={`settings-lang-${lang.code}`}
                onClick={() => {
                  playChime('click');
                  onUpdateSettings({ language: lang.code });
                }}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  currentLanguage === lang.code
                    ? 'border-[#176B45] bg-[#EAF6EF] text-[#176B45] font-extrabold shadow-xs'
                    : 'border-[#DDE6E0] bg-white text-[#17231D] hover:border-[#176B45]/40'
                }`}
              >
                <div className="text-xs font-bold">{lang.label}</div>
                <div className="text-[10px] text-[#66736C]">{lang.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Offline Sync & Connectivity Simulation */}
        <div className="p-4 bg-[#F7F9F8] rounded-xl border border-[#DDE6E0] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {settings.offlineSimulation ? (
                <div className="w-8 h-8 rounded-lg bg-[#FEF6E9] text-[#E59A23] flex items-center justify-center">
                  <WifiOff className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-lg bg-[#EAF6EF] text-[#16834A] flex items-center justify-center">
                  <Wifi className="w-4 h-4" />
                </div>
              )}
              <div>
                <span className="text-xs font-bold text-[#17231D] block">
                  {settings.offlineSimulation ? 'Offline Mode Active' : 'Online Mode'}
                </span>
                <span className="text-[11px] text-[#66736C]">
                  {pendingSyncCount > 0
                    ? `${pendingSyncCount} drafts queued for local sync`
                    : 'All transactions synchronized'}
                </span>
              </div>
            </div>

            {pendingSyncCount > 0 && (
              <button
                id="settings-sync-now-btn"
                onClick={() => {
                  playChime('click');
                  onTriggerSync();
                }}
                className="px-3 py-1.5 bg-[#176B45] text-white rounded-lg text-xs font-bold hover:bg-[#238B5A] flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sync Now</span>
              </button>
            )}
          </div>

          {/* Toggle Offline Simulation */}
          <div className="pt-2.5 border-t border-[#DDE6E0] flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-[#17231D] block">Simulate Offline Environment</span>
              <span className="text-[11px] text-[#66736C]">
                Test no-network transaction queuing & fallback
              </span>
            </div>

            <button
              id="toggle-offline-simulation"
              type="button"
              onClick={() => {
                playChime('click');
                onUpdateSettings({ offlineSimulation: !settings.offlineSimulation });
              }}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                settings.offlineSimulation ? 'bg-[#E59A23]' : 'bg-[#DDE6E0]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform transform ${
                  settings.offlineSimulation ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* 3. Low-Bandwidth Mode Toggle */}
        <div className="p-4 bg-[#F7F9F8] rounded-xl border border-[#DDE6E0] flex items-center justify-between text-xs">
          <div className="space-y-0.5 pr-2">
            <div className="flex items-center gap-2 font-bold text-[#17231D]">
              <SignalLow className="w-4 h-4 text-[#176B45]" />
              <span>Low-Bandwidth Image Mode</span>
            </div>
            <p className="text-xs text-[#66736C]">
              Compress camera photos to &lt;30KB for rural 2G/3G connections
            </p>
          </div>

          <button
            id="toggle-low-bandwidth"
            type="button"
            onClick={() => {
              playChime('click');
              onUpdateSettings({ lowBandwidthMode: !settings.lowBandwidthMode });
            }}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 cursor-pointer ${
              settings.lowBandwidthMode ? 'bg-[#176B45]' : 'bg-[#DDE6E0]'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform transform ${
                settings.lowBandwidthMode ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* 4. Collector Profile */}
        <div className="space-y-2.5">
          <label className="text-xs font-extrabold text-[#17231D] flex items-center gap-2">
            <User className="w-4 h-4 text-[#176B45]" />
            <span>Collector Credentials</span>
          </label>

          <div className="space-y-2 text-xs sm:text-sm">
            <input
              type="text"
              value={settings.collectorName}
              onChange={(e) => onUpdateSettings({ collectorName: e.target.value })}
              placeholder="Collector Name"
              className="w-full p-3 bg-white border border-[#DDE6E0] rounded-xl font-medium text-[#17231D] outline-none focus:ring-2 focus:ring-[#176B45]/20 focus:border-[#176B45]"
            />
            <input
              type="tel"
              value={settings.collectorPhone}
              onChange={(e) => onUpdateSettings({ collectorPhone: e.target.value })}
              placeholder="Phone Number"
              className="w-full p-3 bg-white border border-[#DDE6E0] rounded-xl font-medium text-[#17231D] outline-none focus:ring-2 focus:ring-[#176B45]/20 focus:border-[#176B45]"
            />
            <input
              type="text"
              value={settings.collectorUpi}
              onChange={(e) => onUpdateSettings({ collectorUpi: e.target.value })}
              placeholder="UPI VPA (for payouts)"
              className="w-full p-3 bg-white border border-[#DDE6E0] rounded-xl font-medium text-[#17231D] outline-none focus:ring-2 focus:ring-[#176B45]/20 focus:border-[#176B45]"
            />
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

function languageSelectorLabel(lang: Language): string {
  if (lang === 'hi') return 'भाषा चुनें (Language)';
  if (lang === 'mr') return 'भाषा निवडा (Language)';
  return 'Select Language';
}
