import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
  duration?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish, duration = 1800 }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Start fading out slightly before full duration
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, Math.max(800, duration - 400));

    const finishTimer = setTimeout(() => {
      onFinish();
    }, duration);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [duration, onFinish]);

  return (
    <div
      id="scrap-setu-splash-screen"
      className={`fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center p-6 transition-opacity duration-400 ease-out ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center text-center max-w-xs animate-in fade-in zoom-in-95 duration-500">
        {/* Brand Icon Badge */}
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-[#E8F5E9] p-4 flex items-center justify-center shadow-xs border border-[#D0E7D7] mb-6">
          <img
            src="/logo-icon.png"
            alt="ScrapSetu"
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/ScrapSetu.png';
            }}
          />
        </div>

        {/* Brand Title */}
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#107C41] flex items-center gap-1.5">
          <span>ScrapSetu</span>
          <span className="text-[#2E7D32] font-normal text-2xl sm:text-3xl">सेतु</span>
        </h1>

        {/* Tagline */}
        <p className="text-xs sm:text-sm font-semibold text-[#5A6E62] tracking-wide mt-2">
          Connecting Scrap to Authorized Recyclers
        </p>

        {/* Subtle Loading Dots */}
        <div className="flex items-center gap-1.5 mt-8">
          <span className="w-2 h-2 rounded-full bg-[#107C41] animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 rounded-full bg-[#107C41] animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 rounded-full bg-[#107C41] animate-bounce" />
        </div>
      </div>
    </div>
  );
};
