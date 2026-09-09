import React, { useState } from 'react';
import { 
  ChevronLeft, Eye, EyeOff, Lock, Mail, ArrowRight,
  ShieldCheck, AlertCircle, CheckCircle, Truck, Home, 
  Building2, Volume2, Database, KeyRound, Sparkles
} from 'lucide-react';
import { Language, UserProfile } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { 
  signInWithEmail, 
  signUpWithEmail, 
  signInWithGoogle,
  resetUserPassword
} from '../firebase';
import { speakText, playChime } from '../utils/audioSpeech';

const parseFirebaseError = (err: any): string => {
  const code = err?.code || '';
  if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
    return 'No account found with this email or invalid password.';
  }
  if (code === 'auth/wrong-password') {
    return 'Incorrect password. Please try again.';
  }
  if (code === 'auth/email-already-in-use') {
    return 'An account already exists with this email address.';
  }
  if (code === 'auth/popup-closed-by-user') {
    return 'Sign-in window was closed.';
  }
  return err?.message || 'Authentication error. Please check your details.';
};

interface LoginScreenProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onLoginSuccess: (user: UserProfile) => void;
  onContinueAsGuest: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  language,
  onLanguageChange,
  onLoginSuccess,
  onContinueAsGuest,
}) => {
  const t = TRANSLATIONS[language];

  // View state: 'onboarding' (Screen 2) | 'login' (Screen 3) | 'register' (Screen 4) | 'forgot'
  const [activeTab, setActiveTab] = useState<'onboarding' | 'login' | 'register' | 'forgot'>('login');
  
  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Registration Form States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<'collector' | 'seller' | 'recycler'>('collector');
  const [regPhone, setRegPhone] = useState('');
  const [regCity, setRegCity] = useState('Mumbai');
  const [regPincode, setRegPincode] = useState('400017');

  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userNotFoundError, setUserNotFoundError] = useState(false);
  const [emailInUseError, setEmailInUseError] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Audio helper prompt
  const handlePlayVoice = () => {
    playChime('click');
    const msg =
      language === 'hi'
        ? activeTab === 'login'
          ? 'लॉग इन करने के लिए अपना ईमेल और पासवर्ड दर्ज करें, या गूगल से साइन इन करें।'
          : activeTab === 'register'
          ? 'नया खाता बनाने के लिए अपना नाम, ईमेल और पासवर्ड भरें।'
          : 'स्क्रैपसेतु में आपका स्वागत है। कचरे को सीधे अधिकृत रीसाइक्लर तक पहुँचाएं।'
        : activeTab === 'login'
        ? 'Enter your email and password to log in, or continue with Google.'
        : activeTab === 'register'
        ? 'Fill in your name, email and password to register a new account.'
        : 'Welcome to ScrapSetu. Real-time waste collection and direct recycling tracking.';
    speakText(msg, language);
  };

  // Google Sign-In
  const handleGoogleSignIn = async (role: 'collector' | 'seller' | 'recycler' = 'collector') => {
    setError(null);
    setSuccessMessage(null);
    setGoogleLoading(true);
    try {
      const user = await signInWithGoogle(role);
      playChime('success');
      onLoginSuccess(user);
    } catch (err: any) {
      setError(parseFirebaseError(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  // 1. STRICTLY LOG IN ONLY
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUserNotFoundError(false);
    setSuccessMessage(null);

    if (!loginEmail.trim() || !loginPassword) {
      setError(language === 'hi' ? 'कृपया ईमेल और पासवर्ड दोनों दर्ज करें।' : 'Please enter both Email and Password.');
      return;
    }

    setLoading(true);
    try {
      const user = await signInWithEmail(loginEmail.trim(), loginPassword);
      playChime('success');
      onLoginSuccess(user);
    } catch (err: any) {
      const parsed = parseFirebaseError(err);
      setError(parsed);
      const code = err?.code || '';
      if (
        code === 'auth/user-not-found' ||
        code === 'auth/invalid-credential' ||
        parsed.toLowerCase().includes('not found') ||
        parsed.toLowerCase().includes('no account')
      ) {
        setUserNotFoundError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. STRICTLY REGISTER ONLY
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEmailInUseError(false);
    setSuccessMessage(null);

    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      setError(language === 'hi' ? 'कृपया नाम, ईमेल और पासवर्ड भरें।' : 'Please fill Name, Email and Password.');
      return;
    }

    if (regPassword.length < 6) {
      setError(language === 'hi' ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।' : 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const user = await signUpWithEmail(
        regEmail.trim(),
        regPassword,
        regName.trim(),
        regRole,
        {
          phone: regPhone.trim() || undefined,
          city: regCity.trim(),
          pincode: regPincode.trim(),
        }
      );
      playChime('success');
      onLoginSuccess(user);
    } catch (err: any) {
      const parsed = parseFirebaseError(err);
      setError(parsed);
      if (err?.code === 'auth/email-already-in-use' || parsed.toLowerCase().includes('already in use')) {
        setEmailInUseError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  // 3. STRICTLY FORGOT PASSWORD ONLY
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!forgotEmail.trim()) {
      setError(language === 'hi' ? 'कृपया अपना ईमेल पता दर्ज करें।' : 'Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      await resetUserPassword(forgotEmail.trim());
      setSuccessMessage(
        language === 'hi'
          ? `पासवर्ड रीसेट लिंक ${forgotEmail} पर भेज दिया गया है। अपना इनबॉक्स चेक करें।`
          : `Password reset link sent to ${forgotEmail}. Please check your inbox.`
      );
    } catch (err: any) {
      setError(parseFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const switchToRegister = (prefillEmail?: string, prefillPassword?: string) => {
    setActiveTab('register');
    setError(null);
    setUserNotFoundError(false);
    setEmailInUseError(false);
    setSuccessMessage(null);
    if (prefillEmail) setRegEmail(prefillEmail);
    if (prefillPassword) setRegPassword(prefillPassword);
  };

  const switchToLogin = (prefillEmail?: string, prefillPassword?: string) => {
    setActiveTab('login');
    setError(null);
    setUserNotFoundError(false);
    setEmailInUseError(false);
    setSuccessMessage(null);
    if (prefillEmail) setLoginEmail(prefillEmail);
    if (prefillPassword) setLoginPassword(prefillPassword);
  };

  return (
    <div className="min-h-screen bg-white text-[#17231D] flex flex-col justify-between py-6 sm:py-8 px-4 sm:px-6">
      {/* Top Bar: Circular Back Button / Logo on left, Audio & Lang on right */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between gap-2 mb-4">
        {activeTab !== 'login' ? (
          <button
            type="button"
            onClick={() => switchToLogin()}
            className="w-10 h-10 rounded-full bg-[#E8F5E9] hover:bg-[#D7EED9] text-[#107C41] flex items-center justify-center transition-colors cursor-pointer"
            title="Back to Login"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#E8F5E9] p-1.5 flex items-center justify-center">
              <img
                src="/logo-icon.png"
                alt="Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/ScrapSetu.png';
                }}
              />
            </div>
            <span className="font-extrabold text-[#107C41] text-base tracking-tight">ScrapSetu</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Audio voice assist */}
          <button
            type="button"
            id="login-audio-btn"
            onClick={handlePlayVoice}
            className="w-9 h-9 rounded-full bg-[#E8F5E9] hover:bg-[#D7EED9] text-[#107C41] flex items-center justify-center cursor-pointer transition-colors"
            title="Audio Guidance"
          >
            <Volume2 className="w-4 h-4" />
          </button>

          {/* Clean Language Pill */}
          <div className="inline-flex items-center bg-[#F3F6F4] p-1 rounded-full border border-[#E5EAE7]">
            <button
              type="button"
              onClick={() => onLanguageChange('hi')}
              className={`px-2.5 py-1 text-xs font-bold rounded-full transition-all cursor-pointer ${
                language === 'hi' ? 'bg-[#107C41] text-white shadow-xs' : 'text-[#66736C] hover:text-[#17231D]'
              }`}
            >
              हिन्दी
            </button>
            <button
              type="button"
              onClick={() => onLanguageChange('mr')}
              className={`px-2.5 py-1 text-xs font-bold rounded-full transition-all cursor-pointer ${
                language === 'mr' ? 'bg-[#107C41] text-white shadow-xs' : 'text-[#66736C] hover:text-[#17231D]'
              }`}
            >
              मराठी
            </button>
            <button
              type="button"
              onClick={() => onLanguageChange('en')}
              className={`px-2.5 py-1 text-xs font-bold rounded-full transition-all cursor-pointer ${
                language === 'en' ? 'bg-[#107C41] text-white shadow-xs' : 'text-[#66736C] hover:text-[#17231D]'
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-md w-full mx-auto flex-1 flex flex-col justify-center">
        {/* ======================================================== */}
        {/* VIEW: ONBOARDING INTRO (Screen 2 Reference)              */}
        {/* ======================================================== */}
        {activeTab === 'onboarding' && (
          <div className="flex flex-col items-center text-center space-y-6 animate-in fade-in duration-300">
            {/* Friendly Flat Illustration */}
            <div className="w-full aspect-4/3 max-h-60 rounded-3xl bg-[#E8F5E9]/60 border border-[#D0E7D7] p-6 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="w-20 h-20 rounded-full bg-[#107C41] text-white flex items-center justify-center shadow-lg mb-3">
                <Truck className="w-10 h-10" />
              </div>
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-xs border border-[#E5EAE7]">
                <span className="w-2 h-2 rounded-full bg-[#107C41]" />
                <span className="text-xs font-bold text-[#107C41]">100% CPCB Certified Network</span>
              </div>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#17231D] tracking-tight">
                Real-Time Waste Collection Tracking
              </h2>
              <p className="text-sm text-[#66736C] mt-2 max-w-xs mx-auto leading-relaxed">
                {language === 'hi'
                  ? 'कचरे को सीधे अधिकृत रीसाइक्लर तक पहुँचाएँ और तुरंत उचित मूल्य पाएं।'
                  : 'Connect scrap collectors directly to verified recyclers with fair transparent pricing.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => switchToLogin()}
              className="w-full h-12 sm:h-13 rounded-full bg-[#107C41] hover:bg-[#0E6C38] active:bg-[#0C5D30] text-white font-bold text-base shadow-sm transition-all flex items-center justify-center cursor-pointer"
            >
              {language === 'hi' ? 'शुरू करें (Mulai)' : 'Get Started'}
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW: LOGIN (Screen 3 Reference)                        */}
        {/* ======================================================== */}
        {activeTab === 'login' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Simple Bold Heading Centered */}
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl font-black text-[#17231D] tracking-wider uppercase">
                LOGIN
              </h1>
              <p className="text-xs text-[#66736C] mt-1 font-medium">
                {language === 'hi' ? 'अपने पंजीकृत खाते में प्रवेश करें' : 'Sign in to your collector or recycler account'}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3.5 bg-red-50 text-red-700 text-xs rounded-2xl border border-red-200 font-medium flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
                {userNotFoundError && (
                  <button
                    type="button"
                    onClick={() => switchToRegister(loginEmail, loginPassword)}
                    className="self-end text-xs font-bold text-[#107C41] underline cursor-pointer"
                  >
                    {language === 'hi' ? 'यहाँ नया खाता रजिस्टर करें →' : 'Register New Account Here →'}
                  </button>
                )}
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="p-3.5 bg-[#E8F5E9] text-[#107C41] text-xs rounded-2xl border border-[#D0E7D7] font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 text-[#107C41]" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Clean Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#17231D] mb-1.5 ml-1">
                  {language === 'hi' ? 'ईमेल (Email)' : 'Email'}
                </label>
                <div className="relative">
                  <input
                    id="login-email-input"
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full h-12 px-4 bg-white border border-[#DCE3DD] rounded-2xl text-sm font-medium placeholder-[#9CA8A1] focus:border-[#107C41] focus:ring-1 focus:ring-[#107C41] focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17231D] mb-1.5 ml-1">
                  {language === 'hi' ? 'पासवर्ड (Password)' : 'Password'}
                </label>
                <div className="relative">
                  <input
                    id="login-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full h-12 pl-4 pr-12 bg-white border border-[#DCE3DD] rounded-2xl text-sm font-medium placeholder-[#9CA8A1] focus:border-[#107C41] focus:ring-1 focus:ring-[#107C41] focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8A968F] hover:text-[#17231D] cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Rounded Solid Green Pill Button */}
              <button
                id="login-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full h-12 sm:h-13 mt-2 rounded-full bg-[#107C41] hover:bg-[#0E6C38] active:bg-[#0C5D30] text-white font-bold text-base shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Login</span>
                )}
              </button>
            </form>

            {/* Links matching TrashWise: "Tidak memiliki akun? Register", "Lupa Password?" */}
            <div className="text-center space-y-2.5 pt-2">
              <p className="text-xs text-[#66736C]">
                {language === 'hi' ? 'खाता नहीं है? ' : "Don't have an account? "}
                <button
                  type="button"
                  id="switch-to-register-link"
                  onClick={() => switchToRegister(loginEmail)}
                  className="font-bold text-[#107C41] hover:underline cursor-pointer"
                >
                  Register
                </button>
              </p>

              <div>
                <button
                  type="button"
                  id="forgot-password-link"
                  onClick={() => {
                    setActiveTab('forgot');
                    setForgotEmail(loginEmail);
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className="text-xs font-semibold text-[#107C41] hover:underline cursor-pointer"
                >
                  {language === 'hi' ? 'पासवर्ड भूल गए? (Forgot Password?)' : 'Forgot Password?'}
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-[#E5EAE7] w-full" />
              <span className="bg-white px-3 text-[11px] text-[#8A968F] uppercase font-semibold shrink-0">
                {language === 'hi' ? 'या अन्य विकल्प' : 'or continue with'}
              </span>
            </div>

            {/* Google Sign-in Pill */}
            <button
              id="login-google-btn"
              type="button"
              disabled={loading || googleLoading}
              onClick={() => handleGoogleSignIn('collector')}
              className="w-full h-11 px-4 bg-white hover:bg-[#F7F9F8] text-[#17231D] font-bold text-xs sm:text-sm rounded-full border border-[#DCE3DD] hover:border-[#107C41] shadow-2xs transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
            >
              {googleLoading ? (
                <div className="w-4 h-4 border-2 border-[#107C41] border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              )}
              <span>Google Account</span>
            </button>

            {/* Continue as Guest Button */}
            <button
              id="login-guest-btn"
              type="button"
              onClick={onContinueAsGuest}
              className="w-full text-center text-xs text-[#66736C] hover:text-[#107C41] font-semibold transition-colors cursor-pointer py-1"
            >
              {language === 'hi'
                ? 'या बिना लॉग इन किए अतिथि के रूप में जारी रखें →'
                : 'Or continue as Guest without signing in →'}
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW: REGISTER (Screen 4 Reference)                     */}
        {/* ======================================================== */}
        {activeTab === 'register' && (
          <div className="space-y-5 animate-in fade-in duration-300">
            {/* Simple Bold Heading Centered */}
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl font-black text-[#17231D] tracking-wider uppercase">
                REGISTER
              </h1>
              <p className="text-xs text-[#66736C] mt-1 font-medium">
                {language === 'hi' ? 'स्क्रैपसेतु में नया खाता बनाएं' : 'Create your verified recycling partner account'}
              </p>
            </div>

            {/* Error / Success */}
            {error && (
              <div className="p-3.5 bg-red-50 text-red-700 text-xs rounded-2xl border border-red-200 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}
            {emailInUseError && (
              <button
                type="button"
                onClick={() => switchToLogin(regEmail, regPassword)}
                className="w-full text-center text-xs font-bold text-[#107C41] underline cursor-pointer"
              >
                {language === 'hi' ? 'पहले से पंजीकृत? यहाँ लॉग इन करें →' : 'Already registered? Log in here →'}
              </button>
            )}

            {/* Registration Form */}
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#17231D] mb-1 ml-1">
                  {language === 'hi' ? 'पूरा नाम (Nama Lengkap)' : 'Full Name (Nama Lengkap)'} *
                </label>
                <input
                  id="register-name-input"
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Nama Lengkap"
                  className="w-full h-12 px-4 bg-white border border-[#DCE3DD] rounded-2xl text-sm font-medium placeholder-[#9CA8A1] focus:border-[#107C41] focus:ring-1 focus:ring-[#107C41] focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17231D] mb-1 ml-1">
                  {language === 'hi' ? 'ईमेल (Email)' : 'Email'} *
                </label>
                <input
                  id="register-email-input"
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full h-12 px-4 bg-white border border-[#DCE3DD] rounded-2xl text-sm font-medium placeholder-[#9CA8A1] focus:border-[#107C41] focus:ring-1 focus:ring-[#107C41] focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17231D] mb-1 ml-1">
                  {language === 'hi' ? 'पासवर्ड (Password)' : 'Password'} *
                </label>
                <div className="relative">
                  <input
                    id="register-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Password (min 6 chars)"
                    className="w-full h-12 pl-4 pr-12 bg-white border border-[#DCE3DD] rounded-2xl text-sm font-medium placeholder-[#9CA8A1] focus:border-[#107C41] focus:ring-1 focus:ring-[#107C41] focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8A968F] hover:text-[#17231D] cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-bold text-[#17231D] mb-1.5 ml-1">
                  {language === 'hi' ? 'भूमिका (Role)' : 'Role'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegRole('collector')}
                    className={`py-2.5 px-2 rounded-2xl border text-center transition-all cursor-pointer ${
                      regRole === 'collector'
                        ? 'border-[#107C41] bg-[#E8F5E9] text-[#107C41] font-bold shadow-2xs'
                        : 'border-[#DCE3DD] text-[#66736C] hover:bg-[#F3F6F4]'
                    }`}
                  >
                    <Truck className="w-4 h-4 mx-auto mb-1 text-[#107C41]" />
                    <span className="text-[11px] block">{language === 'hi' ? 'कबाड़ी' : 'Collector'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegRole('seller')}
                    className={`py-2.5 px-2 rounded-2xl border text-center transition-all cursor-pointer ${
                      regRole === 'seller'
                        ? 'border-[#107C41] bg-[#E8F5E9] text-[#107C41] font-bold shadow-2xs'
                        : 'border-[#DCE3DD] text-[#66736C] hover:bg-[#F3F6F4]'
                    }`}
                  >
                    <Home className="w-4 h-4 mx-auto mb-1 text-[#107C41]" />
                    <span className="text-[11px] block">{language === 'hi' ? 'घरेलू' : 'Seller'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegRole('recycler')}
                    className={`py-2.5 px-2 rounded-2xl border text-center transition-all cursor-pointer ${
                      regRole === 'recycler'
                        ? 'border-[#107C41] bg-[#E8F5E9] text-[#107C41] font-bold shadow-2xs'
                        : 'border-[#DCE3DD] text-[#66736C] hover:bg-[#F3F6F4]'
                    }`}
                  >
                    <Building2 className="w-4 h-4 mx-auto mb-1 text-[#107C41]" />
                    <span className="text-[11px] block">{language === 'hi' ? 'रीसायकलर' : 'Recycler'}</span>
                  </button>
                </div>
              </div>

              {/* City & Pincode */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-[#17231D] mb-1 ml-1">
                    {language === 'hi' ? 'शहर (City)' : 'City'}
                  </label>
                  <input
                    type="text"
                    value={regCity}
                    onChange={(e) => setRegCity(e.target.value)}
                    placeholder="Mumbai"
                    className="w-full h-11 px-3 bg-white border border-[#DCE3DD] rounded-xl text-xs font-medium focus:border-[#107C41] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#17231D] mb-1 ml-1">
                    {language === 'hi' ? 'पिनकोड (Pincode)' : 'Pincode'}
                  </label>
                  <input
                    type="text"
                    value={regPincode}
                    onChange={(e) => setRegPincode(e.target.value)}
                    placeholder="400017"
                    className="w-full h-11 px-3 bg-white border border-[#DCE3DD] rounded-xl text-xs font-medium focus:border-[#107C41] focus:outline-none"
                  />
                </div>
              </div>

              {/* Green Pill Register Button */}
              <button
                id="register-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full h-12 sm:h-13 mt-3 rounded-full bg-[#107C41] hover:bg-[#0E6C38] active:bg-[#0C5D30] text-white font-bold text-base shadow-sm transition-all flex items-center justify-center cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Register</span>
                )}
              </button>
            </form>

            {/* Link matching TrashWise: "Sudah memiliki akun? Login" */}
            <div className="text-center pt-2">
              <p className="text-xs text-[#66736C]">
                {language === 'hi' ? 'पहले से खाता है? ' : 'Sudah memiliki akun? / Already registered? '}
                <button
                  type="button"
                  id="switch-to-login-link"
                  onClick={() => switchToLogin(regEmail)}
                  className="font-bold text-[#107C41] hover:underline cursor-pointer"
                >
                  Login
                </button>
              </p>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW: FORGOT PASSWORD                                   */}
        {/* ======================================================== */}
        {activeTab === 'forgot' && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl font-black text-[#17231D] tracking-wider uppercase">
                RESET PASSWORD
              </h1>
              <p className="text-xs text-[#66736C] mt-1 font-medium">
                {language === 'hi' ? 'पासवर्ड रीसेट लिंक प्राप्त करने के लिए ईमेल दर्ज करें' : 'Enter registered email to receive reset link'}
              </p>
            </div>

            {error && (
              <div className="p-3.5 bg-red-50 text-red-700 text-xs rounded-2xl border border-red-200 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}
            {successMessage && (
              <div className="p-3.5 bg-[#E8F5E9] text-[#107C41] text-xs rounded-2xl border border-[#D0E7D7] font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 text-[#107C41]" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#17231D] mb-1.5 ml-1">
                  {language === 'hi' ? 'ईमेल पता' : 'Email Address'}
                </label>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full h-12 px-4 bg-white border border-[#DCE3DD] rounded-2xl text-sm font-medium placeholder-[#9CA8A1] focus:border-[#107C41] focus:ring-1 focus:ring-[#107C41] focus:outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-full bg-[#107C41] hover:bg-[#0E6C38] text-white font-bold text-base shadow-sm transition-all flex items-center justify-center cursor-pointer disabled:opacity-60"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => switchToLogin(forgotEmail)}
                className="text-xs font-bold text-[#107C41] hover:underline cursor-pointer"
              >
                ← Back to Login
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer subtle brand mark */}
      <div className="max-w-md w-full mx-auto text-center pt-6 text-[11px] text-[#8A968F]">
        <span>ScrapSetu • Certified CPCB E-Waste Network</span>
      </div>
    </div>
  );
};
