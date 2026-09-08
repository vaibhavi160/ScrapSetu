import React, { useState } from 'react';
import { Volume2, Square } from 'lucide-react';
import { speakText, stopSpeech } from '../utils/audioSpeech';
import { Language } from '../types';

interface VoiceButtonProps {
  textToSpeak: string;
  language: Language;
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({
  textToSpeak,
  language,
  label,
  className = '',
  size = 'md',
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) {
      stopSpeech();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      speakText(textToSpeak, language).then(() => {
        setIsPlaying(false);
      });
    }
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-sm gap-1.5',
    lg: 'px-4 py-2 text-base gap-2',
  };

  return (
    <button
      id={`voice-btn-${textToSpeak.slice(0, 10).replace(/\s+/g, '-')}`}
      type="button"
      onClick={handleToggle}
      className={`inline-flex items-center justify-center rounded-full font-medium transition-all ${
        isPlaying
          ? 'bg-[#1D9E75] text-white ring-2 ring-[#1D9E75]/40 animate-pulse'
          : 'bg-[#1D9E75]/10 text-[#1D9E75] hover:bg-[#1D9E75]/20 active:scale-95'
      } ${sizeClasses[size]} ${className}`}
      title={isPlaying ? 'Stop voice' : 'Listen audio in your language'}
      aria-label="Voice audio readout"
    >
      {isPlaying ? (
        <Square className="w-3.5 h-3.5 fill-current" />
      ) : (
        <Volume2 className="w-4 h-4" />
      )}
      {label && <span className="font-semibold">{label}</span>}
    </button>
  );
};
