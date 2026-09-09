import { Language } from '../types';

let currentAudio: HTMLAudioElement | null = null;

// Stop any currently active speech synthesis or audio playback
export const stopSpeech = () => {
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    } catch {
      // Ignore audio abort errors
    }
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore synthesis cancel errors
    }
  }
};

// Asynchronously load available voices in browser
const getAvailableVoices = (): Promise<SpeechSynthesisVoice[]> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve([]);
      return;
    }
    const current = window.speechSynthesis.getVoices();
    if (current && current.length > 0) {
      resolve(current);
      return;
    }
    const onVoices = () => {
      window.speechSynthesis.removeEventListener('voiceschanged', onVoices);
      resolve(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.addEventListener('voiceschanged', onVoices);
    setTimeout(() => {
      window.speechSynthesis.removeEventListener('voiceschanged', onVoices);
      resolve(window.speechSynthesis.getVoices());
    }, 250);
  });
};

// Play native high-fidelity audio stream (e.g. for authentic Marathi pronunciation)
const playAudioTTS = (text: string, langCode: string): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      stopSpeech();
      const snippet = text.slice(0, 200).trim();
      if (!snippet) {
        resolve(false);
        return;
      }
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${langCode}&client=tw-ob&q=${encodeURIComponent(snippet)}`;
      const audio = new Audio(url);
      currentAudio = audio;

      audio.onended = () => {
        currentAudio = null;
        resolve(true);
      };

      audio.onerror = () => {
        currentAudio = null;
        resolve(false);
      };

      audio.play().catch(() => {
        currentAudio = null;
        resolve(false);
      });
    } catch {
      currentAudio = null;
      resolve(false);
    }
  });
};

// Internal SpeechSynthesis wrapper
const speakViaSpeechSynthesis = (
  text: string,
  voice?: SpeechSynthesisVoice,
  langCode: string = 'en-IN'
): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve(false);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.lang = langCode;

      if (voice) {
        utterance.voice = voice;
      }

      utterance.onend = () => resolve(true);
      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis error:', e);
        resolve(false);
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('SpeechSynthesis exception:', err);
      resolve(false);
    }
  });
};

// Web Speech API Voice synthesis helper with comprehensive Marathi & Indian language fallbacks
export const speakText = async (text: string, language: Language = 'en'): Promise<boolean> => {
  if (typeof window === 'undefined') return false;

  stopSpeech();

  // If language is Marathi ('mr'):
  // Most devices (Windows, Mac, iOS, Android without Marathi pack) lack a pre-installed 'mr-IN' TTS voice.
  // We first check if a native Marathi voice exists. If not, we try the high-fidelity Marathi audio stream.
  // If the audio stream cannot play (offline or blocked), we use the Hindi Devanagari voice, which flawlessly reads Devanagari Marathi text phonetically!
  if (language === 'mr') {
    const voices = await getAvailableVoices();
    const marathiVoice = voices.find(
      (v) =>
        v.lang.toLowerCase().startsWith('mr') ||
        v.name.toLowerCase().includes('marathi') ||
        v.lang.toLowerCase().replace(/_/g, '-').includes('mr-in')
    );

    if (marathiVoice && 'speechSynthesis' in window) {
      const spoke = await speakViaSpeechSynthesis(text, marathiVoice, 'mr-IN');
      if (spoke) return true;
    }

    // Try authentic native Marathi TTS stream
    const audioSpoke = await playAudioTTS(text, 'mr');
    if (audioSpoke) return true;

    // Fallback to Hindi Devanagari voice via SpeechSynthesis
    if ('speechSynthesis' in window) {
      const hindiVoice = voices.find(
        (v) =>
          v.lang.toLowerCase().startsWith('hi') ||
          v.name.toLowerCase().includes('hindi') ||
          v.lang.toLowerCase().replace(/_/g, '-').includes('hi-in')
      );
      const hindiSpoke = await speakViaSpeechSynthesis(text, hindiVoice, 'hi-IN');
      if (hindiSpoke) return true;
    }

    playChime('info');
    return false;
  }

  // If language is Hindi ('hi')
  if (language === 'hi') {
    const voices = await getAvailableVoices();
    const hindiVoice = voices.find(
      (v) =>
        v.lang.toLowerCase().startsWith('hi') ||
        v.name.toLowerCase().includes('hindi')
    );

    if (hindiVoice && 'speechSynthesis' in window) {
      const spoke = await speakViaSpeechSynthesis(text, hindiVoice, 'hi-IN');
      if (spoke) return true;
    }

    // Audio stream fallback
    const audioSpoke = await playAudioTTS(text, 'hi');
    if (audioSpoke) return true;

    if ('speechSynthesis' in window) {
      const fallbackSpoke = await speakViaSpeechSynthesis(text, undefined, 'hi-IN');
      if (fallbackSpoke) return true;
    }

    playChime('info');
    return false;
  }

  // Default: English ('en')
  const voices = await getAvailableVoices();
  const enVoice = voices.find(
    (v) =>
      v.lang.toLowerCase().startsWith('en-in') ||
      v.lang.toLowerCase().startsWith('en')
  );

  if ('speechSynthesis' in window) {
    const spoke = await speakViaSpeechSynthesis(text, enVoice, 'en-IN');
    if (spoke) return true;
  }

  const audioSpoke = await playAudioTTS(text, 'en');
  if (audioSpoke) return true;

  playChime('info');
  return false;
};

// Web Audio API pure tone synthesizer for tactile acoustic feedback
export const playChime = (type: 'success' | 'alert' | 'info' | 'click' = 'click') => {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'success') {
      // Ascending major chord notes
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    } else if (type === 'alert') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.setValueAtTime(240, now + 0.15);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  } catch {
    // Ignore audio context autoplay restriction
  }
};
