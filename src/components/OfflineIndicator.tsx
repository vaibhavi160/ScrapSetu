import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      id="android-offline-banner"
      role="status"
      className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 flex items-center gap-2.5 rounded-xl bg-[#0F1A3C] border border-amber-400/40 text-white px-4 py-2.5 text-xs font-semibold shadow-xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-2"
    >
      <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
      <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
      <span className="flex-1">
        ऑफ़लाइन मोड (Offline Mode) — डेटा स्थानीय रूप से सुरक्षित है (Saved locally)
      </span>
    </div>
  );
};
