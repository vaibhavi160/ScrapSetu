import React, { useState } from 'react';
import { 
  X, Mail, Lock, ArrowRight, ShieldCheck, CheckCircle, 
  Building2, Truck, Home, Database, LogIn, 
  AlertCircle, Eye, EyeOff, KeyRound, UserPlus
} from 'lucide-react';
import { UserProfile, UserRole, Language } from '../types';
import { playChime } from '../utils/audioSpeech';
import { 
  signInWithEmail, 
  signUpWithEmail, 
  resetUserPassword,
  signInWithGoogle
} from '../firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserProfile) => void;
  language: Language;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  language,
}) => {
  // Purely separate views: 'login' | 'register' | 'forgot'
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>('login');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userNotFoundError, setUserNotFoundError] = useState(false);
  const [emailInUseError, setEmailInUseError] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // SEPARATE Login Form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // SEPARATE Register Form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('collector');
  const [regCity, setRegCity] = useState('Mumbai');
  const [regPincode, setRegPincode] = useState('400017');
  const [regPhone, setRegPhone] = useState('');

  // SEPARATE Forgot Password
  const [forgotEmail, setForgotEmail] = useState('');

  if (!isOpen) return null;

  const parseFirebaseError = (err: any) => {
    const code = err?.code || '';
    if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
      setUserNotFoundError(true);
      return language === 'hi'
        ? 'खाता नहीं मिला या पासवर्ड गलत है। यदि आपने रजिस्टर नहीं किया है, तो पहले रजिस्टर करें।'
        : 'Account not found or password incorrect. If you have not registered yet, please Register first.';
    }
    if (code === 'auth/wrong-password') {
      return language === 'hi'
        ? 'गलत पासवर्ड। कृपया पुनः प्रयास करें।'
        : 'Incorrect password. Please try again.';
    }
    if (code === 'auth/email-already-in-use') {
      setEmailInUseError(true);
      return language === 'hi'
        ? 'यह ईमेल पहले से पंजीकृत है। कृपया लॉग इन करें।'
        : 'This email is already registered. Please switch to Log In.';
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
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      return language === 'hi'
        ? 'गूगल साइन इन रद्द कर दिया गया था।'
        : language === 'mr'
        ? 'गुगल साइन इन रद्द करण्यात आले.'
        : 'Google sign-in was cancelled or closed.';
    }
    if (code === 'auth/popup-blocked') {
      return language === 'hi'
        ? 'गूगल साइन इन विंडो ब्राउज़र द्वारा ब्लॉक कर दी गई। कृपया पॉपअप की अनुमति दें।'
        : language === 'mr'
        ? 'गुगल साइन इन विंडो ब्राउझरने ब्लॉक केली. कृपया पॉपअपला परवानगी द्या.'
        : 'Google sign-in popup was blocked by your browser. Please allow popups and try again.';
    }
    if (code === 'auth/unauthorized-domain') {
      return language === 'hi'
        ? 'यह डोमेन फायरबेस में अधिकृत नहीं है।'
        : 'This domain is not authorized in Firebase Auth.';
    }
    if (code === 'auth/account-exists-with-different-credential') {
      return language === 'hi'
        ? 'इस ईमेल के साथ पहले से एक खाता मौजूद है। कृपया पासवर्ड से लॉग इन करें।'
        : language === 'mr'
        ? 'या ईमेलसह आधीच खाते अस्तित्वात आहे. कृपया पासवर्डने लॉग इन करा.'
        : 'An account already exists with this email using a different sign-in method.';
    }
    return err?.message || 'Authentication error. Please try again.';
  };

  // Google Sign-In
  const handleGoogleSignIn = async (roleToAssign: UserRole = 'collector') => {
    setError(null);
    setUserNotFoundError(false);
    setEmailInUseError(false);
    setSuccessMessage(null);
    setGoogleLoading(true);

    try {
      const user = await signInWithGoogle(roleToAssign);
      playChime('success');
      onAuthSuccess(user);
      onClose();
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
      setError(language === 'hi' ? 'कृपया ईमेल और पासवर्ड दर्ज करें' : 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const user = await signInWithEmail(loginEmail.trim(), loginPassword);
      playChime('success');
      onAuthSuccess(user);
      onClose();
    } catch (err: any) {
      setError(parseFirebaseError(err));
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
      setError(language === 'hi' ? 'कृपया सभी आवश्यक फ़ील्ड भरें' : 'Please fill all required fields');
      return;
    }

    if (regPassword.length < 6) {
      setError(language === 'hi' ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए' : 'Password must be at least 6 characters');
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
      onAuthSuccess(user);
      onClose();
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
      setError(language === 'hi' ? 'कृपया अपना ईमेल पता दर्ज करें' : 'Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      await resetUserPassword(forgotEmail.trim());
      setSuccessMessage(
        language === 'hi'
          ? `पासवर्ड रीसेट लिंक ${forgotEmail} पर भेज दिया गया है।`
          : `Password reset link sent to ${forgotEmail}.`
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl sm:rounded-3xl shadow-2xl border border-[#DDE6E0] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#176B45] via-[#145a3a] to-[#0f442b] text-white p-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white p-1 shadow-sm flex items-center justify-center">
              <img
                src="/logo-icon.png"
                alt="Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/ScrapSetu.png';
                }}
              />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">
                {activeTab === 'login'
                  ? (language === 'hi' ? 'लॉग इन करें (Log In)' : 'Log In')
                  : activeTab === 'register'
                  ? (language === 'hi' ? 'नया खाता रजिस्टर करें' : 'Register New Account')
                  : (language === 'hi' ? 'पासवर्ड रीसेट' : 'Reset Password')}
              </h2>
              <p className="text-xs text-white/80">sih-2026-d9bac • Cloud Firestore</p>
            </div>
          </div>

          {/* Distinct, Non-Combined Tabs */}
          <div className="flex bg-black/25 p-1 rounded-xl mt-4">
            <button
              id="modal-tab-login"
              onClick={() => switchToLogin()}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'login' ? 'bg-white text-[#176B45] shadow-xs' : 'text-white/80 hover:text-white'
              }`}
            >
              {language === 'hi' ? 'लॉग इन (Log In)' : 'Log In'}
            </button>
            <button
              id="modal-tab-register"
              onClick={() => switchToRegister()}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'register' ? 'bg-white text-[#176B45] shadow-xs' : 'text-white/80 hover:text-white'
              }`}
            >
              {language === 'hi' ? 'रजिस्टर (Register)' : 'Register'}
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 font-medium flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
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

          {successMessage && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* ================= VIEW 1: STRICT LOG IN ================= */}
          {activeTab === 'login' && (
            <div className="space-y-4">
              {/* Google Sign In Button */}
              <button
                id="modal-login-google-btn"
                type="button"
                disabled={loading || googleLoading}
                onClick={() => handleGoogleSignIn('collector')}
                className="w-full py-2.5 px-4 bg-white hover:bg-[#F7F9F8] active:bg-[#EAF6EF] text-[#17231D] font-bold text-sm rounded-xl border border-[#DDE6E0] hover:border-[#176B45]/40 shadow-xs hover:shadow-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
              >
                {googleLoading ? (
                  <div className="w-4 h-4 border-2 border-[#176B45] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                )}
                <span>
                  {language === 'hi'
                    ? 'Google के साथ लॉग इन करें'
                    : language === 'mr'
                    ? 'Google सह लॉग इन करा'
                    : 'Continue with Google'}
                </span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-[#DDE6E0] w-full" />
                <span className="bg-white px-2 text-[11px] text-[#66736C] uppercase tracking-wider font-semibold shrink-0">
                  {language === 'hi' ? 'या ईमेल से' : language === 'mr' ? 'किंवा ईमेलने' : 'or with email'}
                </span>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#17231D] mb-1">
                    {language === 'hi' ? 'ईमेल पता (Email Address)' : 'Email Address'}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#66736C]" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="partner@scrapsetu.in"
                      className="w-full pl-9 pr-3 py-2.5 bg-[#F7F9F8] border border-[#DDE6E0] rounded-xl text-sm font-medium focus:bg-white focus:border-[#176B45] focus:outline-none"
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
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-2.5 bg-[#F7F9F8] border border-[#DDE6E0] rounded-xl text-sm font-medium focus:bg-white focus:border-[#176B45] focus:outline-none"
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
                  onClick={() => switchToRegister(loginEmail)}
                  className="text-xs font-bold text-[#176B45] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'यहाँ नया खाता रजिस्टर करें →' : 'Register New Account Here →'}</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= VIEW 2: STRICT REGISTER ================= */}
          {activeTab === 'register' && (
            <div className="space-y-4">
              {/* Google Sign Up Button */}
              <button
                id="modal-register-google-btn"
                type="button"
                disabled={loading || googleLoading}
                onClick={() => handleGoogleSignIn(regRole)}
                className="w-full py-2.5 px-4 bg-white hover:bg-[#F7F9F8] active:bg-[#EAF6EF] text-[#17231D] font-bold text-sm rounded-xl border border-[#DDE6E0] hover:border-[#176B45]/40 shadow-xs hover:shadow-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
              >
                {googleLoading ? (
                  <div className="w-4 h-4 border-2 border-[#176B45] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                )}
                <span>
                  {language === 'hi'
                    ? 'Google के साथ नया खाता बनाएं'
                    : language === 'mr'
                    ? 'Google सह नवीन खाते तयार करा'
                    : 'Sign up with Google'}
                </span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-[#DDE6E0] w-full" />
                <span className="bg-white px-2 text-[11px] text-[#66736C] uppercase tracking-wider font-semibold shrink-0">
                  {language === 'hi' ? 'या फॉर्म भरकर रजिस्टर करें' : language === 'mr' ? 'किंवा फॉर्म भरून नोंदणी करा' : 'or fill registration form'}
                </span>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#17231D] mb-1">
                    {language === 'hi' ? 'पूरा नाम (Full Name)' : 'Full Name'} *
                  </label>
                  <input
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
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-9 pr-3 py-2 bg-[#F7F9F8] border border-[#DDE6E0] rounded-xl text-sm font-medium focus:bg-white focus:border-[#176B45] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#17231D] mb-1">
                    {language === 'hi' ? 'नया पासवर्ड (कम से कम 6 अक्षर)' : 'Password (min 6 chars)'} *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#66736C]" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 bg-[#F7F9F8] border border-[#DDE6E0] rounded-xl text-sm font-medium focus:bg-white focus:border-[#176B45] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#17231D] mb-1.5">
                    {language === 'hi' ? 'भूमिका चुनें (Role)' : 'Select Role'} *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setRegRole('collector')}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        regRole === 'collector'
                          ? 'border-[#176B45] bg-[#EAF6EF] text-[#176B45] font-bold'
                          : 'border-[#DDE6E0] text-[#66736C]'
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
                          ? 'border-[#176B45] bg-[#EAF6EF] text-[#176B45] font-bold'
                          : 'border-[#DDE6E0] text-[#66736C]'
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
                          ? 'border-[#176B45] bg-[#EAF6EF] text-[#176B45] font-bold'
                          : 'border-[#DDE6E0] text-[#66736C]'
                      }`}
                    >
                      <Building2 className="w-4 h-4 mx-auto mb-1 text-[#D97706]" />
                      <span className="text-[11px] block">{language === 'hi' ? 'रीसायकलर' : 'Recycler'}</span>
                    </button>
                  </div>
                </div>

                <button
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
                  onClick={() => switchToLogin(regEmail)}
                  className="text-xs font-bold text-[#176B45] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'यहाँ लॉग इन करें →' : 'Log In Here →'}</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= VIEW 3: STRICT FORGOT PASSWORD ================= */}
          {activeTab === 'forgot' && (
            <div className="space-y-3.5">
              <div className="text-center py-2">
                <KeyRound className="w-8 h-8 text-[#176B45] mx-auto mb-1.5" />
                <h3 className="text-sm font-bold text-[#17231D]">
                  {language === 'hi' ? 'पासवर्ड रीसेट करें' : 'Reset Password'}
                </h3>
              </div>

              <form onSubmit={handleForgotSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#17231D] mb-1">
                    {language === 'hi' ? 'ईमेल पता' : 'Email Address'}
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="partner@scrapsetu.in"
                    className="w-full px-3 py-2 bg-[#F7F9F8] border border-[#DDE6E0] rounded-xl text-sm font-medium focus:bg-white focus:border-[#176B45] focus:outline-none"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => switchToLogin(forgotEmail)}
                    className="flex-1 py-2 bg-[#F7F9F8] text-[#66736C] font-bold text-xs rounded-xl border border-[#DDE6E0] cursor-pointer"
                  >
                    {language === 'hi' ? 'लॉग इन पर वापस' : 'Back to Log In'}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2 bg-[#176B45] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer disabled:opacity-60"
                  >
                    {loading ? 'Sending...' : language === 'hi' ? 'लिंक भेजें' : 'Send Link'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#F7F9F8] px-5 py-3 border-t border-[#DDE6E0] flex items-center justify-center gap-2 text-[11px] text-[#66736C]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#16834A] shrink-0" />
          <span>Firebase Email Authentication</span>
        </div>
      </div>
    </div>
  );
};
