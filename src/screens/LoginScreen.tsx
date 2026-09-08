import React, { useState } from 'react';
import { 
  Mail, Lock, ArrowRight, ShieldCheck, CheckCircle, 
  Sparkles, Building2, Truck, Home, Database, LogIn, 
  Volume2, AlertCircle, Eye, EyeOff, KeyRound, UserPlus
} from 'lucide-react';
import { UserProfile, UserRole, Language } from '../types';
import { playChime, speakText, stopSpeech } from '../utils/audioSpeech';
import { 
  signInWithEmail, 
  signUpWithEmail, 
  resetUserPassword 
} from '../firebase';

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
  // Completely separate modes: 'login' OR 'register' OR 'forgot'
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userNotFoundError, setUserNotFoundError] = useState(false);
  const [emailInUseError, setEmailInUseError] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // SEPARATE Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // SEPARATE Register Form State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('collector');
  const [regCity, setRegCity] = useState('Mumbai');
  const [regPincode, setRegPincode] = useState('400017');
  const [regPhone, setRegPhone] = useState('');

  // SEPARATE Forgot Password State
  const [forgotEmail, setForgotEmail] = useState('');

  // Audio Guidance
  const handlePlayVoice = () => {
    stopSpeech();
    const promptText =
      activeTab === 'login'
        ? (language === 'hi'
            ? 'स्क्रैपसेतु लॉग इन पेज। कृपया अपना पंजीकृत ईमेल और पासवर्ड डालकर लॉग इन करें। यदि खाता नहीं है, तो रजिस्टर बटन दबाएं।'
            : language === 'mr'
            ? 'स्क्रॅपसेतू लॉग इन पेज. कृपया आपला नोंदणीकृत ईमेल आणि पासवर्ड टाकून लॉग इन करा. खाते नसल्यास रजिस्टर बटण दाबा.'
            : 'ScrapSetu Log In. Please enter your registered email and password. If you do not have an account, click Register.')
        : (language === 'hi'
            ? 'स्क्रैपसेतु नया पंजीकरण पेज। कृपया अपना नाम, ईमेल, पासवर्ड और भूमिका चुनकर नया खाता बनाएं।'
            : language === 'mr'
            ? 'स्क्रॅपसेतू नवीन नोंदणी पृष्ठ. कृपया आपले नाव, ईमेल, पासवर्ड आणि भूमिका निवडून नवीन खाते तयार करा.'
            : 'ScrapSetu Registration. Please enter your name, email, password, and select your role to register.');
    speakText(promptText, language);
  };

  const parseFirebaseError = (err: any) => {
    const code = err?.code || '';
    if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
      setUserNotFoundError(true);
      return language === 'hi'
        ? 'कोई खाता नहीं मिला या पासवर्ड गलत है। यदि आपने रजिस्टर नहीं किया है, तो कृपया पहले रजिस्टर करें।'
        : language === 'mr'
        ? 'कोणतेही खाते आढळले नाही किंवा पासवर्ड चुकीचा आहे. कृपया आधी रजिस्टर करा.'
        : 'Account not found or password incorrect. If you have not registered yet, please Register first.';
    }
    if (code === 'auth/wrong-password') {
      return language === 'hi'
        ? 'गलत पासवर्ड। कृपया पुनः प्रयास करें या पासवर्ड रीसेट करें।'
        : 'Incorrect password. Please try again or reset your password.';
    }
    if (code === 'auth/email-already-in-use') {
      setEmailInUseError(true);
      return language === 'hi'
        ? 'यह ईमेल पहले से पंजीकृत है। कृपया लॉग इन पेज पर जाकर लॉग इन करें।'
        : language === 'mr'
        ? 'हा ईमेल आधीच नोंदणीकृत आहे. कृपया लॉग इन पृष्ठावर जाऊन लॉग इन करा.'
        : 'This email is already registered. Please go to the Log In page to sign in.';
    }
    if (code === 'auth/weak-password') {
      return language === 'hi'
        ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।'
        : 'Password must be at least 6 characters.';
    }
    if (code === 'auth/invalid-email') {
      return language === 'hi'
        ? 'कृपया एक मान्य ईमेल पता दर्ज करें।'
        : 'Please enter a valid email address.';
    }
    return err?.message || 'Authentication error. Please try again.';
  };

  // 1. STRICTLY LOG IN ONLY (No registration fallback)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUserNotFoundError(false);
    setSuccessMessage(null);

    if (!loginEmail.trim() || !loginPassword) {
      setError(language === 'hi' ? 'कृपया ईमेल और पासवर्ड दोनों दर्ज करें।' : 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      // ONLY perform login
      const user = await signInWithEmail(loginEmail.trim(), loginPassword);
      playChime('success');
      onLoginSuccess(user);
    } catch (err: any) {
      setError(parseFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  // 2. STRICTLY REGISTER ONLY (No login fallback)
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
      // ONLY perform registration
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
      setError(parseFirebaseError(err));
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

  // Helpers to switch views cleanly
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
    <div className="min-h-screen bg-gradient-to-b from-[#F2F7F4] via-[#F8FAF9] to-white flex flex-col justify-between py-6 sm:py-10 px-3 sm:px-6">
      {/* Top Header Bar */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between gap-2 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white border border-[#DDE6E0] p-1 shadow-2xs flex items-center justify-center">
            <img
              src="/ScrapSetu.png"
              alt="ScrapSetu"
              className="w-full h-full object-contain rounded"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <span className="font-extrabold text-[#17231D] text-sm tracking-tight">ScrapSetu</span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Voice Prompt */}
          <button
            type="button"
            id="login-audio-btn"
            onClick={handlePlayVoice}
            className="h-8 px-2.5 rounded-xl bg-white border border-[#DDE6E0] text-[#176B45] hover:bg-[#EAF6EF] flex items-center gap-1.5 text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
            title="Listen Audio Guidance"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">{language === 'hi' ? 'आवाज़' : 'Audio'}</span>
          </button>

          {/* Multilingual Selector */}
          <div className="inline-flex items-center bg-white p-0.5 rounded-xl border border-[#DDE6E0] shadow-2xs">
            <button
              type="button"
              onClick={() => onLanguageChange('hi')}
              className={`px-2 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                language === 'hi' ? 'bg-[#176B45] text-white shadow-2xs' : 'text-[#66736C] hover:text-[#17231D]'
              }`}
            >
              हिन्दी
            </button>
            <button
              type="button"
              onClick={() => onLanguageChange('mr')}
              className={`px-2 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                language === 'mr' ? 'bg-[#176B45] text-white shadow-2xs' : 'text-[#66736C] hover:text-[#17231D]'
              }`}
            >
              मराठी
            </button>
            <button
              type="button"
              onClick={() => onLanguageChange('en')}
              className={`px-2 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                language === 'en' ? 'bg-[#176B45] text-white shadow-2xs' : 'text-[#66736C] hover:text-[#17231D]'
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </div>

      {/* Main Authenticator Card */}
      <div className="max-w-md w-full mx-auto bg-white rounded-2xl sm:rounded-3xl border border-[#DDE6E0] shadow-lg overflow-hidden flex flex-col">
        {/* Banner with Clear Tabs */}
        <div className="bg-gradient-to-r from-[#176B45] via-[#145a3a] to-[#0f442b] text-white p-5 sm:p-6 text-center relative">
          <div className="w-16 h-16 rounded-2xl bg-white p-1.5 shadow-md mx-auto mb-3 flex items-center justify-center border border-white/30">
            <img
              src="/ScrapSetu.png"
              alt="ScrapSetu Logo"
              className="w-full h-full object-contain rounded-xl"
            />
          </div>
          
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            ScrapSetu <span className="text-[#A7F3D0] font-normal text-lg">सेतु</span>
          </h1>

          <p className="text-xs sm:text-sm text-white/85 mt-1 font-medium max-w-xs mx-auto">
            {activeTab === 'login'
              ? (language === 'hi' ? 'लॉग इन करें • ईमेल और पासवर्ड' : 'Log In with Email & Password')
              : activeTab === 'register'
              ? (language === 'hi' ? 'नया पंजीकरण • नया खाता बनाएं' : 'Register New Partner Account')
              : (language === 'hi' ? 'पासवर्ड रीसेट' : 'Password Recovery')}
          </p>

          <div className="inline-flex items-center gap-1.5 mt-2.5 px-2.5 py-0.5 rounded-full bg-white/15 text-white/90 text-[11px] font-semibold border border-white/20">
            <Database className="w-3 h-3 text-[#A7F3D0]" />
            <span>sih-2026-d9bac • Cloud Firestore</span>
          </div>

          {/* Distinct, Non-Combined Tabs */}
          <div className="flex bg-black/25 p-1 rounded-xl mt-4 max-w-xs mx-auto">
            <button
              id="tab-login-btn"
              type="button"
              onClick={() => switchToLogin()}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-white text-[#176B45] shadow-xs'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              {language === 'hi' ? 'लॉग इन (Log In)' : 'Log In'}
            </button>
            <button
              id="tab-register-btn"
              type="button"
              onClick={() => switchToRegister()}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-white text-[#176B45] shadow-xs'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              {language === 'hi' ? 'रजिस्टर (Register)' : 'Register'}
            </button>
          </div>
        </div>

        {/* Card Content Area */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 font-medium flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
              {/* If user not found on login, provide direct button to Register */}
              {userNotFoundError && (
                <div className="pt-1.5 border-t border-red-200/60 flex items-center justify-between">
                  <span className="text-[11px] text-red-600">
                    {language === 'hi' ? 'खाता मौजूद नहीं है?' : 'Need an account?'}
                  </span>
                  <button
                    type="button"
                    onClick={() => switchToRegister(loginEmail, loginPassword)}
                    className="px-2.5 py-1 bg-[#176B45] text-white rounded-lg text-[11px] font-bold hover:bg-[#135838] transition-colors cursor-pointer shadow-2xs"
                  >
                    {language === 'hi' ? 'रजिस्टर करें →' : 'Register Now →'}
                  </button>
                </div>
              )}
              {/* If email already registered on register, provide direct button to Log In */}
              {emailInUseError && (
                <div className="pt-1.5 border-t border-red-200/60 flex items-center justify-between">
                  <span className="text-[11px] text-red-600">
                    {language === 'hi' ? 'क्या यह आपका खाता है?' : 'Already your account?'}
                  </span>
                  <button
                    type="button"
                    onClick={() => switchToLogin(regEmail, regPassword)}
                    className="px-2.5 py-1 bg-[#176B45] text-white rounded-lg text-[11px] font-bold hover:bg-[#135838] transition-colors cursor-pointer shadow-2xs"
                  >
                    {language === 'hi' ? 'लॉग इन करें →' : 'Log In Instead →'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW 1: DEDICATED LOG IN PAGE                             */}
          {/* ======================================================== */}
          {activeTab === 'login' && (
            <div className="space-y-4">
              <div className="pb-1 border-b border-[#DDE6E0]/60">
                <h2 className="text-sm font-bold text-[#17231D] flex items-center gap-1.5">
                  <LogIn className="w-4 h-4 text-[#176B45]" />
                  <span>{language === 'hi' ? 'लॉग इन करें (Log In)' : 'Log In to Your Account'}</span>
                </h2>
                <p className="text-[11px] text-[#66736C]">
                  {language === 'hi'
                    ? 'अपने पंजीकृत ईमेल और पासवर्ड से साइन इन करें।'
                    : 'Sign in with your registered email and password.'}
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#17231D] mb-1">
                    {language === 'hi' ? 'ईमेल पता (Email Address)' : 'Email Address'}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#66736C]" />
                    <input
                      id="login-email-input"
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="e.g. partner@scrapsetu.in"
                      className="w-full pl-9 pr-3 py-2.5 bg-[#F7F9F8] border border-[#DDE6E0] rounded-xl text-sm font-medium focus:bg-white focus:border-[#176B45] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-[#17231D]">
                      {language === 'hi' ? 'पासवर्ड (Password)' : 'Password'}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('forgot');
                        setForgotEmail(loginEmail);
                        setError(null);
                        setSuccessMessage(null);
                      }}
                      className="text-[11px] font-semibold text-[#176B45] hover:underline cursor-pointer"
                    >
                      {language === 'hi' ? 'पासवर्ड भूल गए?' : 'Forgot Password?'}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#66736C]" />
                    <input
                      id="login-password-input"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-2.5 bg-[#F7F9F8] border border-[#DDE6E0] rounded-xl text-sm font-medium focus:bg-white focus:border-[#176B45] focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#66736C] hover:text-[#17231D] cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  id="login-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#176B45] hover:bg-[#135838] text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>{language === 'hi' ? 'लॉग इन करें' : 'Log In'}</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>
              </form>

              {/* Explicit Link to Register */}
              <div className="p-3 bg-[#F7F9F8] rounded-xl border border-[#DDE6E0] text-center space-y-1">
                <p className="text-xs text-[#66736C]">
                  {language === 'hi' ? 'क्या आपका खाता नहीं है?' : "Don't have an account?"}
                </p>
                <button
                  type="button"
                  id="switch-to-register-btn"
                  onClick={() => switchToRegister(loginEmail)}
                  className="text-xs font-bold text-[#176B45] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'यहाँ नया खाता रजिस्टर करें →' : 'Register New Account Here →'}</span>
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW 2: DEDICATED REGISTER / SIGN UP PAGE                */}
          {/* ======================================================== */}
          {activeTab === 'register' && (
            <div className="space-y-4">
              <div className="pb-1 border-b border-[#DDE6E0]/60">
                <h2 className="text-sm font-bold text-[#17231D] flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-[#176B45]" />
                  <span>{language === 'hi' ? 'नया खाता रजिस्टर करें (Register)' : 'Create New Account'}</span>
                </h2>
                <p className="text-[11px] text-[#66736C]">
                  {language === 'hi'
                    ? 'स्क्रैपसेतु नेटवर्क में शामिल होने के लिए विवरण दर्ज करें।'
                    : 'Fill in your details to join the ScrapSetu recycling network.'}
                </p>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#17231D] mb-1">
                    {language === 'hi' ? 'पूरा नाम (Full Name)' : 'Full Name'} *
                  </label>
                  <input
                    id="register-name-input"
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full px-3 py-2 bg-[#F7F9F8] border border-[#DDE6E0] rounded-xl text-sm font-medium focus:bg-white focus:border-[#176B45] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#17231D] mb-1">
                    {language === 'hi' ? 'ईमेल पता (Email Address)' : 'Email Address'} *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#66736C]" />
                    <input
                      id="register-email-input"
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="e.g. ramesh@example.com"
                      className="w-full pl-9 pr-3 py-2 bg-[#F7F9F8] border border-[#DDE6E0] rounded-xl text-sm font-medium focus:bg-white focus:border-[#176B45] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#17231D] mb-1">
                    {language === 'hi' ? 'नया पासवर्ड (कम से कम 6 अक्षर)' : 'Create Password (min 6 chars)'} *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#66736C]" />
                    <input
                      id="register-password-input"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-2 bg-[#F7F9F8] border border-[#DDE6E0] rounded-xl text-sm font-medium focus:bg-white focus:border-[#176B45] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#66736C] hover:text-[#17231D] cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Role Selector */}
                <div>
                  <label className="block text-xs font-bold text-[#17231D] mb-1.5">
                    {language === 'hi' ? 'भूमिका चुनें (Select Role)' : 'Select Role'} *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setRegRole('collector')}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        regRole === 'collector'
                          ? 'border-[#176B45] bg-[#EAF6EF] text-[#176B45] font-bold shadow-2xs'
                          : 'border-[#DDE6E0] text-[#66736C] hover:bg-[#F7F9F8]'
                      }`}
                    >
                      <Truck className="w-4 h-4 mx-auto mb-1 text-[#176B45]" />
                      <span className="text-[11px] block">{language === 'hi' ? 'कबाड़ीवाला' : 'Collector'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRegRole('seller')}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        regRole === 'seller'
                          ? 'border-[#176B45] bg-[#EAF6EF] text-[#176B45] font-bold shadow-2xs'
                          : 'border-[#DDE6E0] text-[#66736C] hover:bg-[#F7F9F8]'
                      }`}
                    >
                      <Home className="w-4 h-4 mx-auto mb-1 text-[#2563EB]" />
                      <span className="text-[11px] block">{language === 'hi' ? 'घरेलू विक्रेता' : 'Household'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRegRole('recycler')}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        regRole === 'recycler'
                          ? 'border-[#176B45] bg-[#EAF6EF] text-[#176B45] font-bold shadow-2xs'
                          : 'border-[#DDE6E0] text-[#66736C] hover:bg-[#F7F9F8]'
                      }`}
                    >
                      <Building2 className="w-4 h-4 mx-auto mb-1 text-[#D97706]" />
                      <span className="text-[11px] block">{language === 'hi' ? 'रीसायकलर' : 'Recycler'}</span>
                    </button>
                  </div>
                </div>

                {/* Location */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-[#17231D] mb-1">
                      {language === 'hi' ? 'शहर (City)' : 'City'}
                    </label>
                    <input
                      type="text"
                      value={regCity}
                      onChange={(e) => setRegCity(e.target.value)}
                      placeholder="Mumbai"
                      className="w-full px-3 py-2 bg-[#F7F9F8] border border-[#DDE6E0] rounded-xl text-xs font-medium focus:bg-white focus:border-[#176B45] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#17231D] mb-1">
                      {language === 'hi' ? 'पिनकोड (Pincode)' : 'Pincode'}
                    </label>
                    <input
                      type="text"
                      value={regPincode}
                      onChange={(e) => setRegPincode(e.target.value)}
                      placeholder="400017"
                      className="w-full px-3 py-2 bg-[#F7F9F8] border border-[#DDE6E0] rounded-xl text-xs font-medium focus:bg-white focus:border-[#176B45] focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  id="register-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#176B45] hover:bg-[#135838] text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 mt-3"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>{language === 'hi' ? 'खाता रजिस्टर करें' : 'Register Account'}</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>
              </form>

              {/* Explicit Link to Log In */}
              <div className="p-3 bg-[#F7F9F8] rounded-xl border border-[#DDE6E0] text-center space-y-1">
                <p className="text-xs text-[#66736C]">
                  {language === 'hi' ? 'पहले से खाता है?' : 'Already have an account?'}
                </p>
                <button
                  type="button"
                  id="switch-to-login-btn"
                  onClick={() => switchToLogin(regEmail)}
                  className="text-xs font-bold text-[#176B45] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'यहाँ लॉग इन करें →' : 'Log In Here →'}</span>
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW 3: DEDICATED FORGOT PASSWORD VIEW                    */}
          {/* ======================================================== */}
          {activeTab === 'forgot' && (
            <div className="space-y-3.5">
              <div className="text-center py-2">
                <KeyRound className="w-10 h-10 text-[#176B45] mx-auto mb-2" />
                <h3 className="text-sm font-bold text-[#17231D]">
                  {language === 'hi' ? 'पासवर्ड रीसेट करें (Reset Password)' : 'Reset Password'}
                </h3>
                <p className="text-xs text-[#66736C] mt-1">
                  {language === 'hi'
                    ? 'अपना पंजीकृत ईमेल दर्ज करें, हम आपको पासवर्ड रीसेट लिंक भेजेंगे।'
                    : 'Enter your registered email address and we will send a password reset link.'}
                </p>
              </div>

              <form onSubmit={handleForgotSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#17231D] mb-1">
                    {language === 'hi' ? 'ईमेल पता' : 'Email Address'}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#66736C]" />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="partner@scrapsetu.in"
                      className="w-full pl-9 pr-3 py-2.5 bg-[#F7F9F8] border border-[#DDE6E0] rounded-xl text-sm font-medium focus:bg-white focus:border-[#176B45] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => switchToLogin(forgotEmail)}
                    className="flex-1 py-2.5 bg-[#F7F9F8] hover:bg-[#EAEFEA] text-[#66736C] font-bold text-xs rounded-xl border border-[#DDE6E0] cursor-pointer"
                  >
                    {language === 'hi' ? 'लॉग इन पर वापस जाएं' : 'Back to Log In'}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 bg-[#176B45] hover:bg-[#135838] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer disabled:opacity-60"
                  >
                    {loading ? 'Sending...' : language === 'hi' ? 'रीसेट लिंक भेजें' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Guest Exploration Option */}
          <div className="pt-3 border-t border-[#DDE6E0] text-center">
            <button
              id="login-guest-btn"
              type="button"
              onClick={onContinueAsGuest}
              className="text-xs text-[#66736C] hover:text-[#176B45] font-semibold transition-colors cursor-pointer py-1"
            >
              {language === 'hi'
                ? 'या बिना लॉग इन किए अतिथि के रूप में जारी रखें →'
                : 'Or continue as Guest without signing in →'}
            </button>
          </div>
        </div>

        {/* Footer Guarantee */}
        <div className="bg-[#F7F9F8] px-5 py-3 border-t border-[#DDE6E0] flex items-center justify-center gap-2 text-[11px] text-[#66736C]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#16834A] shrink-0" />
          <span>
            {language === 'hi'
              ? 'फायरबेस ऑथेंटिकेशन • एंड-टू-एंड एन्क्रिप्टेड क्रेडेंशियल्स'
              : 'Firebase Auth • End-to-End Encrypted Credentials'}
          </span>
        </div>
      </div>

      {/* Bottom Mission Note */}
      <div className="max-w-md w-full mx-auto text-center pt-4">
        <p className="text-[11px] text-[#66736C]">
          ScrapSetu Platform • SIH 2026 Initiative • Project ID: <span className="font-mono text-[#176B45] font-bold">sih-2026-d9bac</span>
        </p>
      </div>
    </div>
  );
};
