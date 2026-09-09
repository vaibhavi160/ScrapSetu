import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, Languages, WifiOff, Wifi, 
  RefreshCw, SignalLow, User, Phone, Check, X, Shield,
  Sparkles, Cloud, CheckCircle2, AlertCircle, Eye, EyeOff, Globe
} from 'lucide-react';
import { Language, AppSettings } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { playChime } from '../utils/audioSpeech';
import { 
  getStoredGeminiApiKey, 
  setStoredGeminiApiKey, 
  checkBackendHealth, 
  testGeminiApiKey,
  getApiBaseUrl,
  setApiBaseUrl,
  DEFAULT_PRODUCTION_BACKEND_URL
} from '../utils/apiConfig';

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

  // Gemini API & Cloudflare connectivity state
  const [apiKeyInput, setApiKeyInput] = useState<string>(() => getStoredGeminiApiKey());
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [customBackendUrl, setCustomBackendUrlState] = useState<string>(() => getApiBaseUrl());
  const [showAdvancedBackend, setShowAdvancedBackend] = useState<boolean>(false);
  const [testStatus, setTestStatus] = useState<{
    testing: boolean;
    message?: string;
    success?: boolean;
    latency?: number;
  }>({ testing: false });
  const [backendHealth, setBackendHealth] = useState<{
    checked: boolean;
    ok: boolean;
    hasGeminiKey: boolean;
    statusText: string;
    isCloudflareOrEdge: boolean;
  }>({
    checked: false,
    ok: false,
    hasGeminiKey: false,
    statusText: 'Checking edge...',
    isCloudflareOrEdge: false,
  });

  useEffect(() => {
    let mounted = true;
    checkBackendHealth().then((health) => {
      if (mounted) {
        setBackendHealth({
          checked: true,
          ok: health.ok,
          hasGeminiKey: health.hasGeminiKey,
          statusText: health.statusText,
          isCloudflareOrEdge: health.isCloudflareOrEdge,
        });
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleSaveApiKey = () => {
    playChime('click');
    setStoredGeminiApiKey(apiKeyInput);
    handleTestApiKey();
  };

  const handleClearApiKey = () => {
    playChime('click');
    setStoredGeminiApiKey('');
    setApiKeyInput('');
    setTestStatus({ testing: false, message: 'API Key removed. Using server or offline fallback.' });
  };

  const handleTestApiKey = async () => {
    setTestStatus({ testing: true, message: 'Connecting to Gemini API...' });
    const res = await testGeminiApiKey(apiKeyInput);
    setTestStatus({
      testing: false,
      success: res.success,
      message: res.message,
      latency: res.latencyMs,
    });
    if (res.success) {
      playChime('success');
    } else {
      playChime('alert');
    }
  };

  const handleSaveBackendUrl = () => {
    playChime('click');
    setApiBaseUrl(customBackendUrl);
    checkBackendHealth().then((health) => {
      setBackendHealth({
        checked: true,
        ok: health.ok,
        hasGeminiKey: health.hasGeminiKey,
        statusText: health.statusText,
        isCloudflareOrEdge: health.isCloudflareOrEdge,
      });
    });
  };

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

        {/* 4. Gemini AI Vision & Cloudflare Key Configuration */}
        <div className="p-4 bg-[#F7F9F8] rounded-xl border border-[#DDE6E0] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-extrabold text-xs text-[#17231D]">
              <Sparkles className="w-4 h-4 text-[#176B45]" />
              <span>Gemini AI & Cloudflare Setup</span>
            </div>
            <div
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                backendHealth.hasGeminiKey || apiKeyInput
                  ? 'bg-[#EAF6EF] text-[#176B45] border border-[#176B45]/30'
                  : 'bg-[#FEF6E9] text-[#E59A23] border border-[#E59A23]/30'
              }`}
            >
              {backendHealth.hasGeminiKey || apiKeyInput ? (
                <>
                  <CheckCircle2 className="w-3 h-3" />
                  <span>AI Active</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3" />
                  <span>Key Needed</span>
                </>
              )}
            </div>
          </div>

          <p className="text-[11px] text-[#66736C] leading-relaxed">
            Powers real-time camera scrap inspection, CPCB e-waste categorization, and item weight estimation.
          </p>

          {/* Current Status Pill */}
          <div className="p-2.5 bg-white rounded-lg border border-[#DDE6E0] text-xs flex items-center justify-between">
            <span className="text-[#66736C] text-[11px]">Connection Status:</span>
            <span className="font-bold text-[#17231D] text-[11px] flex items-center gap-1">
              <Cloud className="w-3.5 h-3.5 text-[#176B45]" />
              {backendHealth.statusText}
            </span>
          </div>

          {/* Gemini API Key Input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#17231D] flex items-center justify-between">
              <span>Google Gemini API Key</span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-[#176B45] underline font-medium"
              >
                Get Free Key
              </a>
            </label>

            <div className="relative flex items-center">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy... or AQ.Ab8..."
                className="w-full pr-9 pl-3 py-2 bg-white border border-[#DDE6E0] rounded-lg text-xs font-mono text-[#17231D] outline-none focus:ring-1 focus:ring-[#176B45] focus:border-[#176B45]"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2 text-[#66736C] hover:text-[#17231D] p-1 cursor-pointer"
                title={showApiKey ? 'Hide key' : 'Show key'}
              >
                {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Buttons: Test & Save */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="save-gemini-key-btn"
              onClick={handleSaveApiKey}
              disabled={testStatus.testing || !apiKeyInput.trim()}
              className="flex-1 py-1.5 bg-[#176B45] hover:bg-[#238B5A] disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              {testStatus.testing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>{testStatus.testing ? 'Testing Key...' : 'Save & Test Key'}</span>
            </button>

            {apiKeyInput && (
              <button
                type="button"
                id="clear-gemini-key-btn"
                onClick={handleClearApiKey}
                className="px-2.5 py-1.5 bg-white border border-[#DDE6E0] text-[#66736C] hover:text-red-600 rounded-lg text-xs font-medium cursor-pointer transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Test Status Feedback Banner */}
          {testStatus.message && (
            <div
              className={`p-2.5 rounded-lg text-[11px] flex items-start gap-2 border ${
                testStatus.success
                  ? 'bg-[#EAF6EF] border-[#176B45]/30 text-[#176B45]'
                  : testStatus.testing
                  ? 'bg-blue-50 border-blue-200 text-blue-800'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              {testStatus.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : testStatus.testing ? (
                <RefreshCw className="w-4 h-4 shrink-0 mt-0.5 animate-spin" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-semibold">{testStatus.message}</p>
                {testStatus.latency && (
                  <p className="text-[10px] opacity-80 mt-0.5">Response latency: {testStatus.latency}ms</p>
                )}
              </div>
            </div>
          )}

          {/* Cloudflare Deployment Guidance */}
          <div className="text-[10px] text-[#66736C] bg-white p-2.5 rounded-lg border border-[#DDE6E0] space-y-1">
            <span className="font-bold text-[#17231D] block flex items-center gap-1">
              <Globe className="w-3 h-3 text-[#176B45]" /> Cloudflare Deployment Guide:
            </span>
            <ul className="list-disc pl-3.5 space-y-0.5 text-[10px]">
              <li>
                <strong>Cloudflare Pages:</strong> Add <code>GEMINI_API_KEY</code> under <em>Pages Dashboard &rarr; Settings &rarr; Environment variables</em>.
              </li>
              <li>
                <strong>Cloudflare Workers:</strong> Run <code>npx wrangler secret put GEMINI_API_KEY</code>.
              </li>
              <li>
                <strong>Direct Browser:</strong> Saving your key above activates AI vision immediately in this browser without re-deploying.
              </li>
            </ul>
          </div>

          {/* Advanced Backend Toggle */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowAdvancedBackend(!showAdvancedBackend)}
              className="text-[10px] font-bold text-[#176B45] hover:underline flex items-center gap-1 cursor-pointer"
            >
              {showAdvancedBackend ? 'Hide' : 'Show'} Custom Backend URL (Cloud Run)
            </button>

            {showAdvancedBackend && (
              <div className="mt-2 p-2.5 bg-white rounded-lg border border-[#DDE6E0] space-y-2">
                <label className="text-[10px] font-bold text-[#17231D] block">
                  Backend API Base URL (optional override)
                </label>
                <input
                  type="url"
                  value={customBackendUrl}
                  onChange={(e) => setCustomBackendUrlState(e.target.value)}
                  placeholder="https://ais-dev-...run.app or empty for same origin"
                  className="w-full px-2.5 py-1.5 border border-[#DDE6E0] rounded text-[11px] font-mono outline-none"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveBackendUrl}
                    className="px-2.5 py-1 bg-[#176B45] text-white rounded text-[10px] font-bold cursor-pointer"
                  >
                    Save URL
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomBackendUrlState(DEFAULT_PRODUCTION_BACKEND_URL);
                      setApiBaseUrl(DEFAULT_PRODUCTION_BACKEND_URL);
                    }}
                    className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-[#17231D] rounded text-[10px] cursor-pointer"
                  >
                    Reset to Default Cloud Run
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 5. Collector Profile */}
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
