import React, { useState } from 'react';
import { usePWAInstall, triggerHaptic } from '../hooks/usePWAInstall';
import { Smartphone, Download, CheckCircle, ExternalLink, X, Terminal, ShieldCheck } from 'lucide-react';

interface PWAInstallButtonProps {
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ className = '' }) => {
  const { isInstallable, isInstalled, isAndroid, isIOS, install } = usePWAInstall();
  const [showAndroidGuide, setShowAndroidGuide] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);

  const handleInstallClick = async () => {
    triggerHaptic('medium');
    if (isInstallable) {
      const success = await install();
      if (!success) {
        setShowAndroidGuide(true);
      }
    } else {
      setShowAndroidGuide(true);
    }
  };

  const copyBuildCmd = () => {
    navigator.clipboard.writeText('npm run build && npx cap add android && npx cap open android');
    setCopiedCmd(true);
    triggerHaptic('success');
    setTimeout(() => setCopiedCmd(false), 2500);
  };

  // If already installed in standalone / Android WebAPK mode
  if (isInstalled) {
    return (
      <div className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#176B45]/15 border border-[#176B45]/30 text-[#176B45] text-xs font-bold ${className}`}>
        <CheckCircle className="w-3.5 h-3.5" />
        <span>Android App Active</span>
      </div>
    );
  }

  return (
    <>
      <button
        id="install-pwa-button"
        onClick={handleInstallClick}
        title="Install ScrapSetu as Android App"
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E8433D] hover:bg-[#d63832] active:scale-95 text-white text-xs font-bold shadow-xs transition-all ${className}`}
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span>{isInstallable ? 'Install App' : 'Android App'}</span>
      </button>

      {/* Android & APK Guide Modal */}
      {showAndroidGuide && (
        <div
          id="android-install-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F1A3C]/70 backdrop-blur-xs animate-in fade-in"
          onClick={() => setShowAndroidGuide(false)}
        >
          <div
            id="android-install-modal"
            className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden p-6 relative animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#0F1A3C] flex items-center justify-center text-white shadow-md">
                  <Smartphone className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#0F1A3C]">
                    ScrapSetu Android App
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Native WebAPK & APK Build for Android Devices
                  </p>
                </div>
              </div>
              <button
                id="close-install-modal"
                onClick={() => setShowAndroidGuide(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Android Direct Installation Step */}
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#EEF1F8] border border-slate-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-extrabold text-[#0F1A3C] uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Option 1: Direct Android Install (WebAPK)
                  </span>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    Recommended
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Open this link in <strong>Chrome</strong> or <strong>Samsung Internet</strong> on any Android device:
                </p>
                <ol className="mt-2 space-y-1.5 text-xs text-slate-700 pl-4 list-decimal">
                  <li>Tap browser menu (<strong>⋮</strong> three dots top-right)</li>
                  <li>Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong></li>
                  <li>Android automatically creates a standalone icon in your app drawer with offline support & camera access</li>
                </ol>

                {isInstallable && (
                  <button
                    id="trigger-install-prompt-btn"
                    onClick={async () => {
                      setShowAndroidGuide(false);
                      await install();
                    }}
                    className="mt-3 w-full py-2.5 rounded-xl bg-[#0F1A3C] hover:bg-[#1A2A54] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    1-Tap Install Now
                  </button>
                )}
              </div>

              {/* Option 2: Capacitor Native APK Build */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-extrabold text-[#0F1A3C] uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-[#E8433D]" />
                    Option 2: Generate Android APK (Capacitor)
                  </span>
                  <span className="text-[10px] font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full">
                    Developer APK
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-2">
                  Capacitor configuration (<code className="font-mono text-[#0F1A3C] font-semibold">capacitor.config.ts</code>) is pre-configured with package ID <code className="font-mono text-[#0F1A3C]">com.scrapsetu.app</code>.
                </p>
                
                <div className="p-2.5 rounded-xl bg-[#0F1A3C] text-slate-200 font-mono text-[11px] flex items-center justify-between overflow-x-auto">
                  <span>npm run build &amp;&amp; npx cap add android</span>
                  <button
                    onClick={copyBuildCmd}
                    className="shrink-0 ml-2 px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-[10px] font-bold text-white transition"
                  >
                    {copiedCmd ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              {isIOS && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                  <strong>iOS Safari:</strong> Tap Share button ➔ "Add to Home Screen".
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowAndroidGuide(false)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
