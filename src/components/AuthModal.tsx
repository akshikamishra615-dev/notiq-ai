import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  Mail, 
  User, 
  ArrowRight, 
  Sparkles, 
  RefreshCw,
  Clock,
  Edit3,
  Zap,
  Globe,
  Smartphone,
  Brain,
  Sun,
  Moon,
  Target,
  FileText,
  MessageSquare,
  StickyNote
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { maskEmailForPrivacy } from '../services/emailService';

const AVATAR_OPTIONS = ['🎓', '🧠', '⚡', '🚀', '👑', '🌟', '📚', '🎨'];

export const AuthModal: React.FC = () => {
  const { 
    isAuthenticated,
    isAuthModalOpen, 
    setIsAuthModalOpen, 
    users,
    currentUser,
    signup, 
    verifyEmailOTP,
    resendEmailOTP,
    requestPasswordResetOTP,
    resetPasswordWithOTP,
    pendingVerificationEmail,
    otpCooldownSeconds,
    completeOnboarding,
    updateProfile,
    switchUser
  } = useAuth();

  const [mode, setMode] = useState<
    'welcome' | 'auth_sheet' | 'email_input' | 'verify' | 'profile_setup' | 'welcome_back' | 'forgot'
  >('auth_sheet');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password] = useState('');
  const [avatar, setAvatar] = useState('🎓');
  const [preferredLang, setPreferredLang] = useState<'auto' | 'hi' | 'en'>('auto');
  const [themePref, setThemePref] = useState<'dark' | 'light'>('dark');
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(30);

  // Parallax 3D tilt tracking for mouse/touch on welcome screen
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // OTP Verification state (6 boxes, 60-second limit)
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpExpirySeconds, setOtpExpirySeconds] = useState(60); // 60 seconds (1 minute)
  
  // Forgot Password state
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [existingUserFound, setExistingUserFound] = useState<boolean>(false);

  // 60-Second OTP Expiry Countdown Timer
  useEffect(() => {
    if (mode !== 'verify' || otpExpirySeconds <= 0) return;
    const interval = setInterval(() => {
      setOtpExpirySeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [mode, otpExpirySeconds]);

  // Reset timer to 60 seconds on entering verification mode
  useEffect(() => {
    if (mode === 'verify') {
      setOtpExpirySeconds(60);
    }
  }, [mode]);

  // Mouse move handler for 3D parallax tilt
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY, currentTarget } = e;
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const x = (clientX - left - width / 2) / (width / 2);
    const y = (clientY - top - height / 2) / (height / 2);
    setMousePos({ x, y });
  };

  // Do not render modal unless explicitly opened
  if (!isAuthModalOpen) return null;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const formattedMins = mins < 10 ? `0${mins}` : `${mins}`;
    const formattedSecs = secs < 10 ? `0${secs}` : `${secs}`;
    return `${formattedMins}:${formattedSecs}`;
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    const existingUser = users.find(u => u.email.toLowerCase() === normalizedEmail);
    if (existingUser) {
      setExistingUserFound(true);
      setName(existingUser.name);
    } else {
      setExistingUserFound(false);
    }

    setLoading(true);
    // Request real Email OTP
    const res = await signup(name.trim() || 'User', normalizedEmail, password);
    setLoading(false);

    if (res.success || res.requireVerification) {
      setMode('verify');
      setOtpExpirySeconds(60);
      setSuccessMsg(`Verification code sent to ${res.maskedEmail || maskEmailForPrivacy(normalizedEmail)}`);
    } else if (res.error) {
      setError(res.error);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) {
      setError('Please enter all 6 digits of the OTP code.');
      return;
    }

    if (otpExpirySeconds <= 0) {
      setError('OTP code has expired (60-second limit). Please click Resend Code to receive a new OTP.');
      return;
    }

    const targetEmail = pendingVerificationEmail || email;
    setLoading(true);
    const res = await verifyEmailOTP(targetEmail, fullOtp);
    setLoading(false);

    if (res.success) {
      if (existingUserFound) {
        setMode('welcome_back');
      } else {
        setMode('profile_setup');
      }
    } else {
      setError(res.error || 'Verification failed. Please verify the code and try again.');
    }
  };

  const handleResendOTP = async () => {
    setError(null);
    setSuccessMsg(null);

    if (otpExpirySeconds > 0 && otpCooldownSeconds > 0) {
      setError(`Resend available after timer expires in ${otpExpirySeconds}s.`);
      return;
    }

    const targetEmail = pendingVerificationEmail || email;
    setLoading(true);
    const res = await resendEmailOTP(targetEmail);
    setLoading(false);

    if (res.success) {
      setOtpDigits(['', '', '', '', '', '']);
      setOtpExpirySeconds(60);
      setSuccessMsg(`OTP has been delivered to your email address: ${res.maskedEmail || maskEmailForPrivacy(targetEmail)}`);
    } else {
      setError(res.error || 'Unable to send OTP. Please try again.');
    }
  };

  const handleSocialAuth = (providerName: string) => {
    setError(null);
    setSuccessMsg(null);
    const simulatedEmail = `user.${providerName.toLowerCase()}@notiq.ai`;
    setEmail(simulatedEmail);
    setName(`Notiq ${providerName} User`);
    setMode('email_input');
  };

  const handleFinishProfileSetup = () => {
    if (currentUser) {
      updateProfile({
        name: name.trim() || currentUser.name || 'Scholar User',
        avatar,
      });
      completeOnboarding(preferredLang, themePref, dailyGoalMinutes);
    }
    setIsAuthModalOpen(false);
  };

  const handleRequestForgotOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!forgotEmail) {
      setError('Please enter your registered email address.');
      return;
    }

    setLoading(true);
    const res = await requestPasswordResetOTP(forgotEmail);
    setLoading(false);

    if (res.success) {
      setForgotStep(2);
      setSuccessMsg(`OTP has been delivered to your email address: ${res.maskedEmail || maskEmailForPrivacy(forgotEmail)}`);
    } else {
      setError(res.error || 'No account registered with this email.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    setLoading(true);
    const res = await resetPasswordWithOTP(forgotEmail, forgotOtp, newPassword);
    setLoading(false);

    if (res.success) {
      setMode('auth_sheet');
      setSuccessMsg('Password changed successfully! Please sign in with your new password.');
    } else {
      setError(res.error || 'Password reset failed.');
    }
  };

  return (
    <div 
      onMouseMove={handleMouseMove}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#0a0718]/95 light:bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300 select-none overflow-hidden"
    >
      <div className="w-full max-w-xl bg-[#141028]/90 light:bg-white light:border-slate-200 light:text-slate-900 border border-white/15 rounded-[36px] p-4 sm:p-10 shadow-[0_25px_70px_rgba(108,59,255,0.35)] light:shadow-2xl text-slate-100 relative overflow-hidden max-h-[96vh] overflow-y-auto">
        
        {/* Animated Background Gradients & Glow Rings */}
        <div className="absolute -top-36 -right-36 w-80 h-80 bg-brand-pink/30 rounded-full blur-[100px] pointer-events-none animate-pulse" />
        <div className="absolute -bottom-36 -left-36 w-80 h-80 bg-brand-purple/35 rounded-full blur-[100px] pointer-events-none animate-pulse" />

        {/* Allow close button ONLY if user is already authenticated */}
        {isAuthenticated && (
          <button 
            onClick={() => setIsAuthModalOpen(false)}
            className="absolute top-5 right-5 p-2.5 rounded-2xl bg-white/5 light:bg-slate-100 hover:bg-white/10 light:hover:bg-slate-200 text-slate-400 light:text-slate-500 hover:text-white light:hover:text-slate-900 transition-colors cursor-pointer z-30"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* 1. PREMIUM 3D WELCOME SCREEN (NO EMAIL/GOOGLE BUTTONS, SINGLE CTA) */}
        {mode === 'welcome' && (
          <div className="text-center space-y-7 py-4 relative z-10">
            
            {/* 3D Floating Stage with Centered Logo and 3D Cards */}
            <div className="relative w-full py-8 flex items-center justify-center">
              
              {/* Floating 3D Element 1: Yellow Sticky Note Card */}
              <div 
                className="absolute -top-1 -left-2 sm:left-4 px-3 py-2 rounded-2xl bg-amber-400/90 text-amber-950 shadow-xl shadow-amber-500/20 text-left border border-amber-300/50 backdrop-blur-md transition-transform duration-300 pointer-events-none z-20"
                style={{
                  transform: `translate3d(${mousePos.x * -12}px, ${mousePos.y * -12}px, 0px) rotate(-10deg)`,
                }}
              >
                <div className="flex items-center gap-1.5 text-[11px] font-black">
                  <StickyNote className="w-3.5 h-3.5" />
                  <span>OCR Note #1</span>
                </div>
                <p className="text-[9px] font-bold opacity-80 mt-0.5">Dual Multilingual Scan</p>
              </div>

              {/* Floating 3D Element 2: Pink AI Bubble */}
              <div 
                className="absolute top-2 -right-2 sm:right-4 px-3 py-2 rounded-2xl bg-brand-pink/90 text-white shadow-xl shadow-brand-pink/30 text-left border border-white/20 backdrop-blur-md transition-transform duration-300 pointer-events-none z-20"
                style={{
                  transform: `translate3d(${mousePos.x * 14}px, ${mousePos.y * 14}px, 0px) rotate(8deg)`,
                }}
              >
                <div className="flex items-center gap-1.5 text-[11px] font-black">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>AI Tutor</span>
                </div>
                <p className="text-[9px] font-bold opacity-90 mt-0.5">Hindi & Hinglish Mode</p>
              </div>

              {/* Floating 3D Element 3: PDF Document Page */}
              <div 
                className="absolute -bottom-2 left-6 px-3 py-2 rounded-2xl bg-indigo-600/80 text-white shadow-xl shadow-indigo-500/30 border border-white/20 backdrop-blur-md transition-transform duration-300 pointer-events-none z-20"
                style={{
                  transform: `translate3d(${mousePos.x * 10}px, ${mousePos.y * -10}px, 0px) rotate(6deg)`,
                }}
              >
                <div className="flex items-center gap-1.5 text-[11px] font-black">
                  <FileText className="w-3.5 h-3.5 text-brand-pink" />
                  <span>Page 1 of 10</span>
                </div>
              </div>

              {/* CENTER 3D NOTIQ AI LOGO WITH DUAL GLOW RINGS */}
              <div 
                className="relative w-28 h-28 sm:w-32 sm:h-32 transition-transform duration-300 ease-out"
                style={{
                  transform: `perspective(1000px) rotateX(${mousePos.y * -12}deg) rotateY(${mousePos.x * 12}deg)`,
                }}
              >
                {/* Glow rings */}
                <div className="absolute inset-0 rounded-[34px] bg-gradient-to-tr from-brand-purple via-brand-pink to-brand-purple blur-xl opacity-80 animate-pulse" />
                <div className="absolute -inset-2 rounded-[38px] bg-brand-pink/30 blur-2xl opacity-60" />

                {/* Outer 3D Bezel */}
                <div className="relative w-full h-full rounded-[34px] bg-gradient-to-tr from-brand-purple via-brand-pink to-brand-purple p-1 shadow-[0_20px_50px_rgba(255,111,181,0.4)]">
                  <div className="w-full h-full bg-[#110d24] rounded-[30px] flex items-center justify-center text-white text-5xl sm:text-6xl font-black tracking-tight border border-white/20 shadow-inner">
                    N
                  </div>
                </div>
              </div>
            </div>

            {/* HEADING & SUBTITLE */}
            <div className="space-y-2 max-w-md mx-auto">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white light:text-slate-900 drop-shadow-[0_10px_20px_rgba(108,59,255,0.5)]">
                Welcome to Notiq<span className="text-brand-pink">AI</span>
              </h1>
              <p className="text-base sm:text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-pink via-purple-300 to-brand-pink tracking-tight">
                Learn Smarter. Remember Better.
              </p>
              <p className="text-xs sm:text-sm text-slate-300 light:text-slate-600 mt-2 leading-relaxed font-medium">
                AI-powered study notes, OCR summaries, AI chat, quizzes, flashcards, events & secure private vault.
              </p>
            </div>

            {/* SINGLE CTA BUTTON (GET STARTED) — NO GOOGLE / EMAIL BUTTONS ON HERO */}
            <div className="pt-4 max-w-sm mx-auto">
              <button
                onClick={() => setMode('auth_sheet')}
                className="w-full py-4 sm:py-4.5 px-8 rounded-full bg-gradient-to-r from-brand-purple via-brand-pink to-brand-purple text-white font-black text-sm sm:text-base tracking-wide shadow-[0_15px_40px_rgba(255,111,181,0.5)] hover:shadow-[0_20px_50px_rgba(255,111,181,0.7)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer group"
              >
                <span>Get Started</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400 light:text-slate-500 font-bold pt-2">
              <span className="flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-brand-pink" /> 100% Encrypted</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-amber-400" /> Instant OCR</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Brain className="w-3.5 h-3.5 text-emerald-400" /> AI Study Tutor</span>
            </div>

          </div>
        )}

        {/* 2. MODERN AUTHENTICATION SHEET MODAL (OPENS AFTER CLICKING GET STARTED) */}
        {mode === 'auth_sheet' && (
          <div className="space-y-5 text-center relative z-10 py-1">
            <div>
              <p className="text-xs text-slate-400 light:text-slate-600">Choose your preferred method to enter your workspace</p>
            </div>

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
                {successMsg}
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-medium">
                {error}
              </div>
            )}

            {/* Auth Methods List */}
            <div className="space-y-3 pt-1">
              <button
                onClick={() => handleSocialAuth('Google')}
                className="w-full py-3.5 px-4 rounded-2xl bg-white/5 light:bg-slate-50 light:hover:bg-slate-100 border border-white/10 light:border-slate-200 text-xs font-bold text-white light:text-slate-800 flex items-center justify-center gap-3 transition-colors cursor-pointer"
              >
                <Globe className="w-4 h-4 text-emerald-400" />
                <span>Continue with Google</span>
              </button>

              <button
                onClick={() => handleSocialAuth('Apple')}
                className="w-full py-3.5 px-4 rounded-2xl bg-white/5 light:bg-slate-50 light:hover:bg-slate-100 border border-white/10 light:border-slate-200 text-xs font-bold text-white light:text-slate-800 flex items-center justify-center gap-3 transition-colors cursor-pointer"
              >
                <Smartphone className="w-4 h-4 text-slate-300 light:text-slate-600" />
                <span>Continue with Apple</span>
              </button>

              <button
                onClick={() => setMode('email_input')}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-brand-purple to-brand-pink text-white font-extrabold text-xs shadow-lg shadow-brand-purple/30 hover:opacity-95 flex items-center justify-center gap-3 cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                <span>Continue with Email OTP</span>
              </button>
            </div>

            {/* Returning Users Quick Switcher */}
            {users.length > 0 && (
              <div className="pt-3 border-t border-white/10 light:border-slate-200 space-y-2">
                <p className="text-[11px] font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider">Returning Accounts</p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {users.slice(0, 3).map(u => (
                    <button
                      key={u.id}
                      onClick={() => {
                        switchUser(u.id);
                        setIsAuthModalOpen(false);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white/5 light:bg-slate-100 hover:bg-white/10 light:hover:bg-slate-200 border border-white/10 light:border-slate-200 text-xs text-slate-300 light:text-slate-700 flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>{u.avatar || '🎓'}</span>
                      <span className="font-semibold">{u.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                onClick={() => setMode('welcome')}
                className="text-xs text-slate-400 light:text-slate-500 hover:text-white light:hover:text-slate-900 cursor-pointer"
              >
                Back to Welcome Screen
              </button>
            </div>
          </div>
        )}

        {/* 3. EMAIL ENTRY FLOW */}
        {mode === 'email_input' && (
          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="text-base font-extrabold text-white">Enter Your Email</h3>
                <p className="text-xs text-slate-400">Passwordless sign-in with 6-digit Email OTP</p>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="student@notiq.ai"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-pink"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-purple to-brand-pink text-white font-extrabold text-xs hover:opacity-95 shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Send 6-Digit Email OTP</span>}
              </button>
            </form>

            <div className="text-center pt-2 border-t border-white/10">
              <button
                onClick={() => setMode('auth_sheet')}
                className="text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Back to Authentication Options
              </button>
            </div>
          </div>
        )}

        {/* 4. MANDATORY 6-DIGIT REAL EMAIL OTP VERIFICATION SCREEN */}
        {mode === 'verify' && (
          <div className="space-y-4 text-center relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-purple to-brand-pink p-0.5 mx-auto shadow-lg">
              <div className="w-full h-full bg-[#141028] rounded-[14px] flex items-center justify-center text-white">
                <ShieldCheck className="w-7 h-7 text-brand-pink" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-black text-white">Verify Your Email Address</h3>
              <p className="text-xs text-slate-400 mt-1">
                Enter the 6-digit OTP code delivered to <span className="text-brand-pink font-bold">{maskEmailForPrivacy(pendingVerificationEmail || email)}</span>
              </p>
              
              {/* 60-Second Timer Display */}
              <div className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                otpExpirySeconds > 0 
                  ? 'bg-brand-purple/20 border border-brand-pink/30 text-brand-pink' 
                  : 'bg-rose-500/20 border border-rose-500/40 text-rose-300 animate-pulse'
              }`}>
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {otpExpirySeconds > 0 
                    ? `Expires in: ${formatTimer(otpExpirySeconds)}` 
                    : 'OTP Expired (00:00) — Resend New Code below'}
                </span>
              </div>
            </div>

            {/* LIVE EMAIL INBOX NOTIFICATION BOX */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-brand-purple/25 via-brand-pink/20 to-brand-purple/25 border border-brand-pink/40 text-left space-y-2 animate-in fade-in zoom-in-95 duration-300 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-black text-brand-pink">
                  <Mail className="w-4 h-4" />
                  <span>📬 Verification Code Dispatched</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-brand-pink/20 text-brand-pink border border-brand-pink/30 uppercase">
                  SENT
                </span>
              </div>
              <p className="text-[11px] text-slate-300 truncate">
                Recipient: <strong className="text-white">{pendingVerificationEmail || email}</strong>
              </p>
              <div className="pt-1 border-t border-white/10 text-xs text-slate-300">
                Please check your email inbox for your 6-digit verification code.
              </div>
            </div>

            {successMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
                {successMsg}
              </div>
            )}

            {error && (
              <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-medium flex flex-col items-center gap-1.5">
                <span>{error}</span>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  className="px-3 py-1 rounded-lg bg-rose-500/30 hover:bg-rose-500/50 text-white font-bold text-[11px] transition-colors cursor-pointer"
                >
                  Retry Sending OTP
                </button>
              </div>
            )}

            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="flex items-center justify-center gap-1 sm:gap-2">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-input-${idx}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      const copy = [...otpDigits];
                      copy[idx] = val;
                      setOtpDigits(copy);
                      if (val && idx < 5) {
                        const nextEl = document.getElementById(`otp-input-${idx + 1}`);
                        nextEl?.focus();
                      }
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Backspace' && !otpDigits[idx] && idx > 0) {
                        const prevEl = document.getElementById(`otp-input-${idx - 1}`);
                        prevEl?.focus();
                      }
                    }}
                    className={`w-9 sm:w-11 h-11 sm:h-12 rounded-xl bg-white/5 border text-center text-base sm:text-lg font-extrabold text-white focus:outline-none ${
                      otpExpirySeconds <= 0 ? 'border-rose-500/50 opacity-60' : 'border-white/20 focus:border-brand-pink'
                    }`}
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={loading || otpExpirySeconds <= 0}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-brand-purple to-brand-pink text-white font-extrabold text-xs hover:opacity-95 shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Verify OTP & Continue</span>}
              </button>
            </form>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={otpExpirySeconds > 0}
                className={`font-extrabold transition-all cursor-pointer ${
                  otpExpirySeconds <= 0 
                    ? 'text-brand-pink underline hover:text-white scale-105' 
                    : 'text-slate-500 opacity-60 cursor-not-allowed'
                }`}
              >
                {otpExpirySeconds > 0 ? `Resend OTP (${formatTimer(otpExpirySeconds)})` : '⚡ Resend New OTP'}
              </button>
              <button
                type="button"
                onClick={() => setMode('email_input')}
                className="hover:text-white cursor-pointer flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3 text-slate-400" />
                <span>Change Email</span>
              </button>
            </div>
          </div>
        )}

        {/* 5. FIRST-TIME USER PERSONALIZED PROFILE SETUP */}
        {mode === 'profile_setup' && (
          <div className="space-y-4 relative z-10 text-left">
            <div className="flex items-center gap-3 pb-3 border-b border-white/10">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-brand-purple to-brand-pink text-white shadow-md">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Personalize Your AI Workspace</h3>
                <p className="text-xs text-slate-400">Set up your profile & study preferences</p>
              </div>
            </div>

            <div className="space-y-3.5">
              {/* Name & Avatar Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">What should we call you?</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-pink"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Choose Your AI Avatar</label>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {AVATAR_OPTIONS.map(av => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setAvatar(av)}
                      className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all cursor-pointer ${
                        avatar === av 
                          ? 'bg-brand-pink/30 border-2 border-brand-pink scale-110 shadow-lg' 
                          : 'bg-white/5 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              {/* Study Language Preference */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Preferred AI Study Language</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'auto', label: 'Auto (Hinglish)' },
                    { id: 'hi', label: 'Hindi (हिंदी)' },
                    { id: 'en', label: 'English' },
                  ].map(lang => (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => setPreferredLang(lang.id as 'auto' | 'hi' | 'en')}
                      className={`py-2 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                        preferredLang === lang.id
                          ? 'bg-brand-pink text-white shadow-md'
                          : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Preference */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Theme Preference</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setThemePref('dark')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer ${
                      themePref === 'dark'
                        ? 'bg-brand-purple text-white shadow-md'
                        : 'bg-white/5 border border-white/10 text-slate-300'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span>Midnight Dark</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setThemePref('light')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer ${
                      themePref === 'light'
                        ? 'bg-brand-pink text-white shadow-md'
                        : 'bg-white/5 border border-white/10 text-slate-300'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>Clean Light</span>
                  </button>
                </div>
              </div>

              {/* Daily Study Goal */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Daily Study Target</label>
                <div className="grid grid-cols-3 gap-2">
                  {[15, 30, 60].map(min => (
                    <button
                      key={min}
                      type="button"
                      onClick={() => setDailyGoalMinutes(min)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        dailyGoalMinutes === min
                          ? 'bg-emerald-500 text-white shadow-md'
                          : 'bg-white/5 border border-white/10 text-slate-300'
                      }`}
                    >
                      <Target className="w-3 h-3" />
                      <span>{min} Mins</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleFinishProfileSetup}
              className="w-full mt-2 py-3.5 rounded-2xl bg-gradient-to-r from-brand-purple via-brand-pink to-brand-purple text-white font-extrabold text-xs shadow-xl shadow-brand-purple/40 hover:opacity-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Start Exploring Notiq AI</span>
            </button>
          </div>
        )}

        {/* 6. RETURNING USER WELCOME BACK SCREEN */}
        {mode === 'welcome_back' && (
          <div className="space-y-5 text-center relative z-10 py-3">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-brand-purple to-brand-pink p-1 mx-auto shadow-xl">
              <div className="w-full h-full bg-[#141028] rounded-full flex items-center justify-center text-4xl">
                {currentUser?.avatar || avatar || '🎓'}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-black text-white">
                Welcome Back, {currentUser?.name || name || 'Scholar'} 👋
              </h3>
              <p className="text-xs text-brand-pink font-bold mt-1">Ready to continue your study streak?</p>
              <p className="text-xs text-slate-400 mt-2">
                Your notes, quizzes, flashcards, and encrypted vault have been safely unlocked.
              </p>
            </div>

            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-brand-purple via-brand-pink to-brand-purple text-white font-extrabold text-xs shadow-xl shadow-brand-purple/40 hover:opacity-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Continue Learning</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 7. FORGOT PASSWORD FLOW */}
        {mode === 'forgot' && (
          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="text-base font-extrabold text-white">Reset Password</h3>
                <p className="text-xs text-slate-400">Verify 60-second email OTP to create a new password</p>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-medium">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
                {successMsg}
              </div>
            )}

            {forgotStep === 1 ? (
              <form onSubmit={handleRequestForgotOTP} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Registered Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      placeholder="student@notiq.ai"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-pink"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-brand-purple to-brand-pink text-white font-extrabold text-xs hover:opacity-95 shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Send Reset 6-Digit OTP</span>}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">6-Digit Verification Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={forgotOtp}
                    onChange={e => setForgotOtp(e.target.value)}
                    placeholder="849201"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white font-extrabold tracking-widest text-center focus:outline-none focus:border-brand-pink"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-brand-pink"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-brand-purple to-brand-pink text-white font-extrabold text-xs hover:opacity-95 shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Save New Password & Sign In</span>}
                </button>
              </form>
            )}

            <div className="text-center pt-2 border-t border-white/10">
              <button
                onClick={() => setMode('auth_sheet')}
                className="text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Back to Authentication Options
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
