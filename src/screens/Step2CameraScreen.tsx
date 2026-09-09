import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, Upload, AlertTriangle, CheckCircle2, RotateCcw, 
  Sparkles, Image as ImageIcon, Video, RefreshCw, Smartphone, 
  HelpCircle, ChevronRight, Check
} from 'lucide-react';
import { Language, ImageQualityAssessment } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { SAMPLE_WASTE_PRESETS } from '../data/mockData';
import { VoiceButton } from '../components/VoiceButton';
import { playChime } from '../utils/audioSpeech';

interface Step2CameraScreenProps {
  language: Language;
  lowBandwidthMode?: boolean;
  onPhotoCaptured: (photoUrl: string, quality: ImageQualityAssessment, presetPresetIndex?: number) => void;
  onBack: () => void;
}

export const Step2CameraScreen: React.FC<Step2CameraScreenProps> = ({
  language,
  lowBandwidthMode = false,
  onPhotoCaptured,
  onBack,
}) => {
  const t = TRANSLATIONS[language];

  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [isStartingCamera, setIsStartingCamera] = useState<boolean>(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number | undefined>(undefined);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [qualityResult, setQualityResult] = useState<ImageQualityAssessment | null>(null);
  const [cameraError, setCameraError] = useState<{
    title: string;
    details: string;
    isPermission: boolean;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);

  // Progressive camera acquisition with multi-tier fallbacks
  const getCameraStream = async (targetFacing: 'environment' | 'user'): Promise<MediaStream> => {
    if (!navigator?.mediaDevices?.getUserMedia) {
      throw new Error('NOT_SUPPORTED');
    }

    // Attempt 1: Ideal facingMode + ideal resolution
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: targetFacing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
    } catch (err1) {
      console.warn('getUserMedia attempt 1 failed, trying fallback 2:', err1);
    }

    // Attempt 2: Ideal facingMode only (resolves laptops without 720p or strict constraints)
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: targetFacing },
        },
        audio: false,
      });
    } catch (err2) {
      console.warn('getUserMedia attempt 2 failed, trying basic video:', err2);
    }

    // Attempt 3: Plain video constraint (guaranteed to work with standard webcams / virtual cameras)
    return await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
  };

  // Start live camera stream
  const startCamera = async (targetFacing = facingMode) => {
    setCameraError(null);
    setIsStartingCamera(true);
    setIsVideoPlaying(false);

    // Stop any existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    try {
      const stream = await getCameraStream(targetFacing);
      streamRef.current = stream;
      setMediaStream(stream);
      setFacingMode(targetFacing);
      setCameraActive(true);
      playChime('click');
    } catch (err: unknown) {
      console.warn('Live camera error:', err);
      const errorObj = err as { name?: string; message?: string };
      const errName = errorObj?.name || '';
      const errMsg = (errorObj?.message || '').toLowerCase();

      let isPermission = false;
      let title = language === 'hi' ? 'कैमरा शुरू नहीं हो सका' : 'Camera Unavailable';
      let details = language === 'hi' 
        ? 'कृपया ब्राउज़र अनुमति जांचें या नीचे दिए गए फ़ोन कैमरा / गैलरी विकल्प का उपयोग करें।'
        : 'Please check browser permissions or use Phone Camera / File Upload below.';

      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError' || errMsg.includes('permission') || errMsg.includes('denied')) {
        isPermission = true;
        title = language === 'hi' ? 'कैमरा अनुमति अस्वीकृत है' : 'Camera Permission Blocked';
        details = language === 'hi'
          ? 'ब्राउज़र ने कैमरे तक पहुंच को रोक दिया है। आप नीचे "फ़ोन कैमरा" बटन या फ़ाइल अपलोड से तुरंत फोटो ले सकते हैं।'
          : 'Camera access was blocked by the browser. Tap "Phone Camera" below or select a file to proceed.';
      } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError' || errMsg.includes('not found')) {
        title = language === 'hi' ? 'कोई कैमरा नहीं मिला' : 'No Camera Found';
        details = language === 'hi'
          ? 'इस डिवाइस पर सक्रिय कैमरा नहीं मिला। नीचे से फोटो अपलोड करें या नमूना कबाड़ चुनें।'
          : 'No camera hardware found. Upload a photo or select a sample preset below.';
      }

      setCameraError({ title, details, isPermission });
      setCameraActive(false);
      setMediaStream(null);
      playChime('alert');
    } finally {
      setIsStartingCamera(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setMediaStream(null);
    setCameraActive(false);
    setIsVideoPlaying(false);
  };

  // Flip between front and rear cameras
  const handleFlipCamera = async () => {
    playChime('click');
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    await startCamera(nextFacing);
  };

  // Ensure video element receives the stream whenever mounted
  useEffect(() => {
    if (cameraActive && mediaStream && videoRef.current) {
      const el = videoRef.current;
      if (el.srcObject !== mediaStream) {
        el.srcObject = mediaStream;
      }
      el.muted = true;
      el.play().then(() => {
        setIsVideoPlaying(true);
      }).catch((playErr) => {
        console.warn('Video auto-play prevented:', playErr);
      });
    }
  }, [cameraActive, mediaStream]);

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Algorithm to analyze image quality (blur, lighting, object presence) using canvas pixel analysis
  const analyzeImageQuality = (imgSrc: string): Promise<ImageQualityAssessment> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const width = 200;
        const height = Math.max(150, Math.round((img.height / (img.width || 1)) * 200));
        canvas.width = width;
        canvas.height = height;

        if (!ctx) {
          resolve({
            isAcceptable: true,
            blurScore: 85,
            lightingScore: 80,
            objectDetected: true,
            issues: [],
          });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // Calculate average luminance
        let totalLuminance = 0;
        let edgeDeltaSum = 0;
        const pixelCount = data.length / 4;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          totalLuminance += lum;

          if (i + 4 < data.length) {
            const nextLum = 0.299 * data[i + 4] + 0.587 * data[i + 5] + 0.114 * data[i + 6];
            edgeDeltaSum += Math.abs(lum - nextLum);
          }
        }

        const avgLuminance = totalLuminance / (pixelCount || 1);
        const avgEdgeDelta = edgeDeltaSum / (pixelCount || 1);

        // Blur score based on edge gradient
        const blurScore = Math.min(100, Math.max(10, Math.round(avgEdgeDelta * 3.8)));
        
        // Lighting score: optimal between 60 and 210
        let lightingScore = 100;
        if (avgLuminance < 50) {
          lightingScore = Math.max(20, Math.round((avgLuminance / 50) * 100));
        } else if (avgLuminance > 225) {
          lightingScore = Math.max(20, Math.round(((255 - avgLuminance) / 30) * 100));
        }

        const issues: string[] = [];
        const isBlurry = blurScore < 30;
        const isTooDark = lightingScore < 35;
        const noObject = avgEdgeDelta < 3.0;

        if (isBlurry) issues.push(t.qualityBlur);
        if (isTooDark) issues.push(t.qualityLowLight);
        if (noObject) issues.push(t.qualityNoObject);

        const isAcceptable = !isBlurry && !noObject && !isTooDark;

        resolve({
          isAcceptable,
          blurScore,
          lightingScore,
          objectDetected: !noObject,
          issues,
        });
      };

      img.onerror = () => {
        resolve({
          isAcceptable: true,
          blurScore: 80,
          lightingScore: 78,
          objectDetected: true,
          issues: [],
        });
      };

      img.src = imgSrc;
    });
  };

  // Capture from live video stream
  const handleSnapFromVideo = () => {
    if (!videoRef.current) return;
    playChime('click');
    const video = videoRef.current;
    const canvas = document.createElement('canvas');

    const vWidth = video.videoWidth || 640;
    const vHeight = video.videoHeight || 480;

    // Apply low-bandwidth mode dimension reduction if requested
    if (lowBandwidthMode) {
      canvas.width = Math.min(640, vWidth);
      canvas.height = Math.round((canvas.width / vWidth) * vHeight);
    } else {
      canvas.width = vWidth;
      canvas.height = vHeight;
    }

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const quality = lowBandwidthMode ? 0.65 : 0.85;
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      stopCamera();
      processImage(dataUrl);
    }
  };

  // Handle local file upload or native camera file capture
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    playChime('click');
    const reader = new FileReader();
    reader.onload = (uploadEvt) => {
      if (uploadEvt.target?.result) {
        stopCamera();
        processImage(uploadEvt.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle choosing a preset realistic scrap photo
  const handleSelectPreset = (preset: (typeof SAMPLE_WASTE_PRESETS)[0], index: number) => {
    playChime('click');
    stopCamera();
    setSelectedPresetIndex(index);
    setCapturedImage(preset.url);
    setQualityResult({
      isAcceptable: preset.blurScore >= 60,
      blurScore: preset.blurScore,
      lightingScore: preset.lightingScore,
      objectDetected: true,
      issues: preset.blurScore < 70 ? [t.qualityBlur] : [],
    });
  };

  const processImage = async (imgDataUrl: string) => {
    setSelectedPresetIndex(undefined);
    setCapturedImage(imgDataUrl);
    setAnalyzing(true);
    const quality = await analyzeImageQuality(imgDataUrl);
    setQualityResult(quality);
    setAnalyzing(false);

    if (quality.isAcceptable) {
      playChime('success');
    } else {
      playChime('alert');
    }
  };

  const handleRetake = () => {
    playChime('click');
    setSelectedPresetIndex(undefined);
    setCapturedImage(null);
    setQualityResult(null);
    setCameraError(null);
  };

  const handleProceed = () => {
    if (!capturedImage || !qualityResult) return;
    playChime('click');
    onPhotoCaptured(capturedImage, qualityResult, selectedPresetIndex);
  };

  const handleManualOverrideProceed = () => {
    if (!capturedImage) return;
    playChime('click');
    const overriddenQuality: ImageQualityAssessment = {
      isAcceptable: true,
      blurScore: Math.max(65, qualityResult?.blurScore || 70),
      lightingScore: Math.max(60, qualityResult?.lightingScore || 65),
      objectDetected: true,
      issues: [],
    };
    onPhotoCaptured(capturedImage, overriddenQuality, selectedPresetIndex);
  };

  const cameraGuideText =
    language === 'hi'
      ? 'कृपया कबाड़ का स्पष्ट फोटो लें। आप लाइव कैमरा, फ़ोन कैमरा या नीचे दिए गए सैंपल ई-कचरे का उपयोग कर सकते हैं।'
      : language === 'mr'
      ? 'कृपया भंगाराचा स्पष्ट फोटो काढा. आपण थेट कॅमेरा, फोन कॅमेरा किंवा नमुना फोटो वापरू शकता.'
      : 'Capture a clear photo of the scrap. You can use live camera, phone camera, or sample presets.';

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Hidden File Inputs for Native Camera and Gallery */}
      <input
        ref={nativeCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
        className="hidden"
        id="native-camera-input"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
        id="gallery-file-input"
      />

      {/* Header & Speech helper */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#0F1A3C] flex items-center gap-2.5">
            <Camera className="w-6 h-6 text-[#E8433D]" />
            <span>{t.capturePhoto}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{t.photoSubtitle}</p>
        </div>
        <VoiceButton textToSpeak={cameraGuideText} language={language} label={t.listenAudio} size="md" />
      </div>

      {/* Main Viewfinder / Capture Box */}
      {!capturedImage ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 text-center overflow-hidden shadow-xs">
          {cameraActive ? (
            <div className="space-y-4">
              {/* Video viewfinder container */}
              <div className="relative rounded-xl overflow-hidden bg-black aspect-4/3 max-h-[420px] mx-auto flex items-center justify-center shadow-inner">
                <video
                  ref={(el) => {
                    videoRef.current = el;
                    if (el && mediaStream && el.srcObject !== mediaStream) {
                      el.srcObject = mediaStream;
                      el.muted = true;
                      el.play().then(() => setIsVideoPlaying(true)).catch((e) => console.log('play error:', e));
                    }
                  }}
                  playsInline
                  autoPlay
                  muted
                  onLoadedMetadata={() => setIsVideoPlaying(true)}
                  onCanPlay={() => setIsVideoPlaying(true)}
                  className="w-full h-full object-cover"
                />

                {/* Loading indicator before stream plays */}
                {!isVideoPlaying && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white gap-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-[#E8433D]" />
                    <span className="text-xs font-medium">{t.cameraStarting || 'Starting camera...'}</span>
                  </div>
                )}

                {/* Visual Viewfinder Target - Optical center alignment */}
                <div className="absolute inset-6 border-2 border-white/60 rounded-xl pointer-events-none flex items-center justify-center">
                  <span className="text-xs text-white bg-black/75 px-3 py-1 rounded-full font-medium shadow-xs">
                    {language === 'hi' ? 'कबाड़ को फ्रेम में रखें' : 'Center scrap inside frame'}
                  </span>
                </div>

                {/* Flip camera overlay button */}
                <button
                  type="button"
                  id="camera-flip-btn"
                  onClick={handleFlipCamera}
                  title="Switch Camera"
                  className="absolute top-4 right-4 p-2.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer backdrop-blur-xs"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {/* Viewfinder Controls */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  id="camera-snap-btn"
                  onClick={handleSnapFromVideo}
                  disabled={!isVideoPlaying}
                  className={`flex-1 py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 text-sm transition-all shadow-xs ${
                    isVideoPlaying
                      ? 'bg-[#E8433D] hover:bg-[#D32F2F] text-white cursor-pointer shadow-md shadow-[#E8433D]/25'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Camera className="w-5 h-5" />
                  <span>{t.takePhoto}</span>
                </button>

                <button
                  id="camera-flip-text-btn"
                  onClick={handleFlipCamera}
                  className="py-3 px-4 bg-[#EEF1F8] hover:bg-slate-200 text-[#0F1A3C] border border-slate-200 rounded-xl font-medium text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Flip Camera"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="hidden sm:inline">{t.flipCamera || 'Flip'}</span>
                </button>

                <button
                  id="camera-stop-btn"
                  onClick={stopCamera}
                  className="py-3 px-4 bg-[#EEF1F8] hover:bg-slate-200 text-slate-600 hover:text-[#0F1A3C] border border-slate-200 rounded-xl font-medium text-xs sm:text-sm cursor-pointer transition-colors"
                >
                  {language === 'hi' ? 'बंद करें' : 'Close'}
                </button>
              </div>
            </div>
          ) : (
            /* Idle / Launch Mode */
            <div className="py-6 space-y-5">
              <div className="w-16 h-16 bg-[#EEF1F8] text-[#0F1A3C] rounded-2xl flex items-center justify-center mx-auto border border-slate-200 shadow-2xs">
                <Camera className="w-8 h-8 text-[#E8433D]" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#0F1A3C]">
                  {language === 'hi' ? 'कबाड़ का फोटो लें' : language === 'mr' ? 'कचऱ्याचा फोटो काढा' : 'Capture Scrap Item'}
                </h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
                  {language === 'hi'
                    ? 'लाइव कैमरा शुरू करें, फ़ोन के कैमरे से फोटो लें, या गैलरी से चुनें।'
                    : 'Start the live camera, snap using your phone camera, or select a file.'}
                </p>
              </div>

              {/* Camera Error / Permission Notice */}
              {cameraError && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-left space-y-2.5 max-w-md mx-auto">
                  <div className="flex items-center gap-2 text-[#0F1A3C] font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{cameraError.title}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {cameraError.details}
                  </p>
                  
                  {/* Instant 1-tap fallback buttons inside error box */}
                  <div className="pt-1 flex gap-2">
                    <button
                      onClick={() => nativeCameraInputRef.current?.click()}
                      className="flex-1 py-2 px-3 bg-[#E8433D] hover:bg-[#D32F2F] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>{language === 'hi' ? 'फ़ोन कैमरा' : 'Phone Camera'}</span>
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 py-2 px-3 bg-white border border-slate-200 text-[#0F1A3C] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <Upload className="w-4 h-4 text-slate-500" />
                      <span>{t.uploadPhoto}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Primary Capture Action Buttons */}
              <div className="flex flex-col gap-2.5 max-w-md mx-auto pt-1">
                {/* 1. Live WebRTC Camera */}
                <button
                  id="btn-open-live-cam"
                  onClick={() => startCamera('environment')}
                  disabled={isStartingCamera}
                  className="w-full py-3.5 px-5 bg-[#0F1A3C] hover:bg-[#1A2850] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-[#0F1A3C]/20"
                >
                  {isStartingCamera ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-[#E8433D]" />
                      <span>{t.cameraStarting || 'Starting camera...'}</span>
                    </>
                  ) : (
                    <>
                      <Video className="w-4 h-4 text-[#E8433D]" />
                      <span>{t.openCamera || 'Start Live Camera'}</span>
                    </>
                  )}
                </button>

                {/* 2. Direct Phone Native Camera Trigger */}
                <button
                  id="btn-trigger-phone-cam"
                  onClick={() => nativeCameraInputRef.current?.click()}
                  className="w-full py-3 px-5 bg-[#E8433D] hover:bg-[#D32F2F] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>{t.phoneCamera || 'Take Photo with Phone Camera'}</span>
                </button>

                {/* 3. Gallery / File Upload */}
                <button
                  id="btn-trigger-upload"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-4 bg-white border border-slate-200 text-[#0F1A3C] hover:bg-[#EEF1F8] rounded-xl font-medium text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Upload className="w-4 h-4 text-slate-500" />
                  <span>{t.uploadPhoto}</span>
                </button>
              </div>

              {/* Browser Permission Helper Note */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-center gap-1.5 text-xs text-slate-500">
                <HelpCircle className="w-4 h-4 text-slate-400" />
                <span>
                  {language === 'hi'
                    ? 'ब्राउज़र में कैमरा ब्लॉक होने पर "फ़ोन कैमरा" चुनें'
                    : 'If browser camera is restricted, use "Phone Camera" directly'}
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Image Quality Assessment & Review View */
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5 shadow-xs">
          <div className="relative rounded-xl overflow-hidden aspect-4/3 max-h-[340px] bg-black mx-auto shadow-inner">
            <img
              src={capturedImage}
              alt="Captured scrap item"
              className="w-full h-full object-contain"
            />
            <div className="absolute top-3 right-3 bg-black/75 text-white text-xs px-2.5 py-1 rounded-full font-mono shadow-xs">
              CAPTURE_OK
            </div>
          </div>

          {/* Quality Analyzer Output Card */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-[#F8F9FD]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-[#0F1A3C]">
                <Sparkles className="w-4 h-4 text-[#E8433D]" />
                <span>{t.qualityCheck}</span>
              </div>
              {analyzing ? (
                <span className="text-xs text-[#E8433D] font-semibold flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing image clarity...</span>
                </span>
              ) : qualityResult?.isAcceptable ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{t.qualitySharp}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'कम रोशनी या धुंधला' : 'Quality Warning'}</span>
                </span>
              )}
            </div>

            {/* Quality Metrics Grid */}
            {qualityResult && (
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-slate-500 text-[11px] block">
                    {language === 'hi' ? 'तीखापन (Sharpness)' : 'Sharpness'}
                  </span>
                  <span className={`font-bold text-base tabular-nums mt-0.5 block ${qualityResult.blurScore >= 45 ? 'text-emerald-700' : 'text-[#E8433D]'}`}>
                    {qualityResult.blurScore}%
                  </span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-slate-500 text-[11px] block">
                    {language === 'hi' ? 'उजाला (Lighting)' : 'Lighting'}
                  </span>
                  <span className={`font-bold text-base tabular-nums mt-0.5 block ${qualityResult.lightingScore >= 40 ? 'text-emerald-700' : 'text-amber-600'}`}>
                    {qualityResult.lightingScore}%
                  </span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-slate-500 text-[11px] block">
                    {language === 'hi' ? 'पहचान (Object)' : 'Target'}
                  </span>
                  <span className={`font-bold text-base mt-0.5 block ${qualityResult.objectDetected ? 'text-emerald-700' : 'text-[#E8433D]'}`}>
                    {qualityResult.objectDetected ? 'Detected' : 'Unclear'}
                  </span>
                </div>
              </div>
            )}

            {/* Quality Issues Feedback & Tips */}
            {qualityResult && qualityResult.issues.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-[#0F1A3C] space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-xs text-amber-700">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>{language === 'hi' ? 'गुणवत्ता सुझाव:' : 'Photo Quality Suggestion:'}</span>
                </p>
                <ul className="list-disc pl-5 text-xs text-slate-600 space-y-0.5">
                  {qualityResult.issues.map((issue, idx) => (
                    <li key={idx}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              id="photo-retake-btn"
              onClick={handleRetake}
              className="w-full sm:w-auto sm:flex-1 py-3 px-5 bg-[#EEF1F8] hover:bg-slate-200 text-[#0F1A3C] border border-slate-200 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t.retake}</span>
            </button>

            {qualityResult?.isAcceptable ? (
              <button
                id="photo-proceed-btn"
                onClick={handleProceed}
                className="w-full sm:w-auto sm:flex-1 py-3 px-5 bg-[#E8433D] hover:bg-[#D32F2F] text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#E8433D]/25 transition-colors"
              >
                <span>{language === 'hi' ? 'एआई वर्गीकरण शुरू करें' : 'Analyze Material'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                id="photo-override-btn"
                onClick={handleManualOverrideProceed}
                className="w-full sm:w-auto sm:flex-1 py-3 px-5 bg-[#0F1A3C] hover:bg-[#1A2850] text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>{language === 'hi' ? 'इसी फोटो के साथ आगे बढ़ें' : 'Proceed Anyway'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Preset Realistic Scrap Items Carousel (One-tap instant test) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-[#0F1A3C] flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-[#E8433D]" />
            <span>{language === 'hi' ? 'सैंपल ई-कचरा टेस्ट करें' : 'Sample E-Waste Items (One-Tap Test)'}</span>
          </span>
          <span className="text-xs text-slate-500">{language === 'hi' ? 'टैप करके चुनें' : 'Tap to test'}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {SAMPLE_WASTE_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              id={`preset-btn-${idx}`}
              onClick={() => handleSelectPreset(preset, idx)}
              className="p-2.5 bg-white rounded-xl border border-slate-200 hover:border-[#E8433D] text-left transition-all group cursor-pointer shadow-xs hover:shadow-sm"
            >
              <div className="aspect-video rounded-lg overflow-hidden bg-slate-100 mb-2">
                <img
                  src={preset.url}
                  alt={preset.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <div className="text-xs font-bold text-[#0F1A3C] truncate">
                {preset.name}
              </div>
              <div className="text-[11px] text-slate-500 flex items-center justify-between mt-0.5">
                <span className="truncate">{preset.category}</span>
                <span className="font-semibold text-[#E8433D] shrink-0 ml-1">
                  {Math.round(preset.confidence * 100)}%
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

