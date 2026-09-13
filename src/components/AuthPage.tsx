import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Mail, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  RefreshCw,
  Clock,
  Globe,
  Smartphone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { maskEmailForPrivacy } from '../services/emailService';

interface AuthPageProps {
  initialMode?: 'login' | 'signup';
  onAuthSuccess?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialMode = 'login', onAuthSuccess }) => {
  const { 
    users,
    login, 
    signup, 
    verifyEmailOTP,
    resendEmailOTP,
    requestPasswordResetOTP,
    resetPasswordWithOTP,
    pendingVerificationEmail,
    otpCooldownSeconds
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup' | 'verify' | 'forgot'>(initialMode);

  // Form Fields State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password Visibility Toggles
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP Verification state (6 boxes, 60-second limit)
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpExpirySeconds, setOtpExpirySeconds] = useState(60);

  // Forgot Password state
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Error / Success / Loading State
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Mouse Parallax Effect for 3D Stage
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // 60-Second OTP Expiry Countdown Timer
  useEffect(() => {
    if (mode !== 'verify' || otpExpirySeconds <= 0) return;
    const interval = setInterval(() => {
      setOtpExpirySeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [mode, otpExpirySeconds]);

  // Reset OTP timer on entering verification mode
  useEffect(() => {
    if (mode === 'verify') {
      setOtpExpirySeconds(60);
    }
  }, [mode]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY, currentTarget } = e;
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const x = (clientX - left - width / 2) / (width / 2);
    const y = (clientY - top - height / 2) / (height / 2);
    setMousePos({ x, y });
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // LOGIN SUBMIT
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setError('Email and password are required.');
      return;
    }

    setLoading(true);
    const res = await login(normalizedEmail, password);
    setLoading(false);

    if (res.success) {
      if (onAuthSuccess) onAuthSuccess();
    } else if (res.requireVerification) {
      setMode('verify');
      setOtpExpirySeconds(60);
      setSuccessMsg(res.error || 'Please verify your email address to continue.');
    } else {
      setError(res.error || 'Invalid credentials. Please verify your email and password.');
    }
  };

  // SIGNUP SUBMIT
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedName) {
      setError('Please enter your full name.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setError('Password is required.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please ensure Password and Confirm Password are identical.');
      return;
    }

    setLoading(true);
    const res = await signup(normalizedName, normalizedEmail, password);
    setLoading(false);

    if (res.success || res.requireVerification) {
      setMode('verify');
      setOtpExpirySeconds(60);
      setSuccessMsg(`Verification code sent to ${res.maskedEmail || maskEmailForPrivacy(normalizedEmail)}`);
    } else if (res.error) {
      setError(res.error);
    }
  };

  // OTP VERIFY SUBMIT
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }

    if (otpExpirySeconds <= 0) {
      setError('Verification code has expired. Please click Resend Code to receive a new OTP.');
      return;
    }

    const targetEmail = pendingVerificationEmail || email;
    setLoading(true);
    const res = await verifyEmailOTP(targetEmail, fullOtp);
    setLoading(false);

    if (res.success) {
      if (onAuthSuccess) onAuthSuccess();
    } else {
      setError(res.error || 'Verification failed. Please verify the code and try again.');
    }
  };

  // RESEND OTP
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
      setSuccessMsg(`OTP has been delivered to ${res.maskedEmail || maskEmailForPrivacy(targetEmail)}`);
    } else {
      setError(res.error || 'Unable to send OTP. Please try again.');
    }
  };

  // REQUEST FORGOT OTP
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
      setSuccessMsg(`OTP has been delivered to ${res.maskedEmail || maskEmailForPrivacy(forgotEmail)}`);
    } else {
      setError(res.error || 'No account registered with this email.');
    }
  };

  // RESET PASSWORD SUBMIT
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    setLoading(true);
    const res = await resetPasswordWithOTP(forgotEmail, forgotOtp, newPassword);
    setLoading(false);

    if (res.success) {
      setMode('login');
      setSuccessMsg('Password changed successfully! Please sign in with your new password.');
    } else {
      setError(res.error || 'Password reset failed.');
    }
  };

  // SOCIAL AUTH
  const handleSocialAuth = (providerName: string) => {
    setError(null);
    setSuccessMsg(`${providerName} Sign-In: Please enter your email address and password to continue.`);
  };

  // Filter remembered accounts for Quick Account Switch (only actual accounts on this device)
  const rememberedAccounts = users.filter(u => Boolean(u.id && u.email && u.name));

  return (
    <div 
      onMouseMove={handleMouseMove}
      className="min-h-screen w-full bg-[#0a0718] light:bg-slate-50 text-slate-100 light:text-slate-900 flex flex-col justify-between items-center p-4 sm:p-6 lg:p-10 relative overflow-x-hidden select-none"
    >
      {/* Living Ambient Glow Orbs */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-pink/25 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-purple/30 rounded-full blur-[120px] pointer-events-none animate-pulse" />

      {/* Header Branding Logo */}
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between relative z-20 pt-2 pb-4 px-2">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.location.href = '/'}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-purple to-brand-pink p-0.5 shadow-lg shadow-brand-purple/40">
            <div className="w-full h-full bg-[#110d24] light:bg-white rounded-[10px] flex items-center justify-center text-white light:text-slate-900 font-black text-base">
              N
            </div>
          </div>
          <span className="font-black text-xl tracking-tight text-white light:text-slate-900">
            Notiq<span className="text-brand-pink light:text-purple-600">AI</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 light:text-slate-600 font-medium hidden sm:inline">
            {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
          </span>
          <button
            onClick={() => {
              setError(null);
              setSuccessMsg(null);
              setMode(mode === 'login' ? 'signup' : 'login');
            }}
            className="px-4 py-2 rounded-full bg-white/10 light:bg-slate-100 hover:bg-white/15 light:hover:bg-slate-200 border border-white/15 light:border-slate-200 text-xs font-extrabold text-brand-pink light:text-purple-700 transition-all cursor-pointer"
          >
            {mode === 'login' ? 'Sign Up' : 'Login'}
          </button>
        </div>
      </div>

      {/* DEDICATED AUTH CARD CONTAINER */}
      <div className="w-full max-w-md mx-auto my-auto relative z-20">
        <div className="bg-[#141028]/95 light:bg-white border border-white/15 light:border-slate-200 rounded-[32px] p-6 sm:p-8 shadow-[0_25px_70px_rgba(108,59,255,0.35)] backdrop-blur-2xl relative overflow-hidden">
          
          {/* Top Logo Badge */}
          <div className="text-center space-y-2 mb-6">
            <div 
              className="relative w-16 h-16 mx-auto transition-transform duration-300 ease-out"
              style={{
                transform: `perspective(1000px) rotateX(${mousePos.y * -10}deg) rotateY(${mousePos.x * 10}deg)`,
              }}
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-brand-purple to-brand-pink blur-md opacity-80 animate-pulse" />
              <div className="relative w-full h-full rounded-2xl bg-gradient-to-tr from-brand-purple to-brand-pink p-0.5 shadow-md">
                <div className="w-full h-full bg-[#110d24] light:bg-white rounded-[14px] flex items-center justify-center text-white light:text-slate-900 text-2xl font-black">
                  N
                </div>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white light:text-slate-900 tracking-tight">
              {mode === 'login' && 'Welcome Back'}
              {mode === 'signup' && 'Create Account'}
              {mode === 'verify' && 'Verify Email'}
              {mode === 'forgot' && 'Reset Password'}
            </h1>
            <p className="text-xs text-slate-400 light:text-slate-600 font-medium">
              {mode === 'login' && 'Sign in to continue to your Personal Workspace'}
              {mode === 'signup' && 'Sign up to get your own isolated AI workspace'}
              {mode === 'verify' && 'Enter the 6-digit OTP code sent to your email'}
              {mode === 'forgot' && 'Reset your password with an Email OTP code'}
            </p>
          </div>

          {/* Mode Switcher Pills (LOGIN / SIGN UP) */}
          {(mode === 'login' || mode === 'signup') && (
            <div className="p-1 rounded-2xl bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 grid grid-cols-2 gap-1 mb-6">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setSuccessMsg(null);
                  setMode('login');
                }}
                className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-gradient-to-r from-brand-purple to-brand-pink text-white shadow-md'
                    : 'text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900'
                }`}
              >
                LOGIN
              </button>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setSuccessMsg(null);
                  setMode('signup');
                }}
                className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-gradient-to-r from-brand-purple to-brand-pink text-white shadow-md'
                    : 'text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900'
                }`}
              >
                SIGN UP
              </button>
            </div>
          )}

          {/* Global Error & Success Alerts */}
          {error && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/20 light:bg-rose-50 border border-rose-500/40 light:border-rose-200 text-rose-300 light:text-rose-800 text-xs font-medium animate-in fade-in">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-500/20 light:bg-emerald-50 border border-emerald-500/40 light:border-emerald-200 text-emerald-300 light:text-emerald-800 text-xs font-semibold animate-in fade-in">
              {successMsg}
            </div>
          )}

          {/* 1. LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 light:text-slate-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 light:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your Email"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 text-xs text-white light:text-slate-900 placeholder-slate-500 light:placeholder-slate-400 focus:outline-none focus:border-brand-pink transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-300 light:text-slate-700">Password</label>
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-xs text-brand-pink light:text-purple-700 hover:underline font-semibold cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 light:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 text-xs text-white light:text-slate-900 placeholder-slate-500 light:placeholder-slate-400 focus:outline-none focus:border-brand-pink transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 light:text-slate-500 hover:text-white light:hover:text-slate-900 transition-colors cursor-pointer"
                    title={showLoginPassword ? 'Hide password' : 'Show password'}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-brand-purple via-brand-pink to-brand-purple text-white font-black text-sm tracking-wide shadow-lg shadow-brand-purple/40 hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>LOGIN</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <p className="text-xs text-slate-400">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setSuccessMsg(null);
                      setMode('signup');
                    }}
                    className="text-brand-pink font-extrabold hover:underline cursor-pointer"
                  >
                    Sign Up
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* 2. SIGN UP FORM */}
          {mode === 'signup' && (
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 light:text-slate-700 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 light:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 text-xs text-white light:text-slate-900 placeholder-slate-500 light:placeholder-slate-400 focus:outline-none focus:border-brand-pink transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 light:text-slate-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 light:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your Email"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 text-xs text-white light:text-slate-900 placeholder-slate-500 light:placeholder-slate-400 focus:outline-none focus:border-brand-pink transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 light:text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 light:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showSignupPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 characters (1 uppercase, 1 number, 1 special)"
                    className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 text-xs text-white light:text-slate-900 placeholder-slate-500 light:placeholder-slate-400 focus:outline-none focus:border-brand-pink transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 light:text-slate-500 hover:text-white light:hover:text-slate-900 transition-colors cursor-pointer"
                    title={showSignupPassword ? 'Hide password' : 'Show password'}
                  >
                    {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 light:text-slate-700 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 light:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter Password"
                    className={`w-full pl-10 pr-10 py-3 rounded-2xl bg-white/5 light:bg-slate-100 border text-xs text-white light:text-slate-900 placeholder-slate-500 light:placeholder-slate-400 focus:outline-none transition-colors ${
                      confirmPassword && confirmPassword !== password
                        ? 'border-rose-500 focus:border-rose-500'
                        : 'border-white/10 light:border-slate-200 focus:border-brand-pink'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 light:text-slate-500 hover:text-white light:hover:text-slate-900 transition-colors cursor-pointer"
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== password && (
                  <p className="text-[11px] text-rose-400 light:text-rose-600 font-semibold mt-1">Passwords do not match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || (confirmPassword !== '' && password !== confirmPassword)}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-brand-purple via-brand-pink to-brand-purple text-white font-black text-sm tracking-wide shadow-lg shadow-brand-purple/40 hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>SIGN UP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <p className="text-xs text-slate-400 light:text-slate-600">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setSuccessMsg(null);
                      setMode('login');
                    }}
                    className="text-brand-pink light:text-purple-700 font-extrabold hover:underline cursor-pointer"
                  >
                    Login
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* 3. OTP VERIFICATION FORM */}
          {mode === 'verify' && (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-purple to-brand-pink p-0.5 mx-auto shadow-md">
                <div className="w-full h-full bg-[#141028] light:bg-white rounded-[14px] flex items-center justify-center text-white light:text-slate-900">
                  <ShieldCheck className="w-6 h-6 text-brand-pink light:text-purple-600" />
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-400 light:text-slate-600">
                  Verification code sent to <strong className="text-brand-pink light:text-purple-700">{maskEmailForPrivacy(pendingVerificationEmail || email)}</strong>
                </p>
                <div className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  otpExpirySeconds > 0 
                    ? 'bg-brand-purple/20 light:bg-purple-100 border border-brand-pink/30 light:border-purple-200 text-brand-pink light:text-purple-700' 
                    : 'bg-rose-500/20 light:bg-rose-100 border border-rose-500/40 light:border-rose-300 text-rose-300 light:text-rose-800 animate-pulse'
                }`}>
                  <Clock className="w-3.5 h-3.5" />
                  <span>{otpExpirySeconds > 0 ? `Expires in: ${formatTimer(otpExpirySeconds)}` : 'OTP Expired (00:00)'}</span>
                </div>
              </div>

              {/* Live Email Notification Box */}
              <div className="p-3 rounded-2xl bg-brand-purple/20 light:bg-purple-50 border border-brand-pink/30 light:border-purple-200 text-left space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-brand-pink light:text-purple-700 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" /> 📬 Verification Code Sent
                  </span>
                </div>
                <p className="text-slate-300 light:text-slate-700 text-xs">Please check your email inbox for your 6-digit verification code.</p>
              </div>

              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div className="flex items-center justify-center gap-1 sm:gap-2">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`page-otp-input-${idx}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        const copy = [...otpDigits];
                        copy[idx] = val;
                        setOtpDigits(copy);
                        if (val && idx < 5) {
                          const nextEl = document.getElementById(`page-otp-input-${idx + 1}`);
                          nextEl?.focus();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !otpDigits[idx] && idx > 0) {
                          const prevEl = document.getElementById(`page-otp-input-${idx - 1}`);
                          prevEl?.focus();
                        }
                      }}
                      className="w-9 sm:w-11 h-11 sm:h-12 rounded-xl bg-white/5 light:bg-slate-100 border border-white/20 light:border-slate-200 text-center text-base sm:text-lg font-extrabold text-white light:text-slate-900 focus:outline-none focus:border-brand-pink"
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={loading || otpExpirySeconds <= 0}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-purple to-brand-pink text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Verify OTP & Continue</span>}
                </button>
              </form>

              <div className="flex items-center justify-between text-xs text-slate-400 light:text-slate-600 pt-2 border-t border-white/10 light:border-slate-200">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={otpExpirySeconds > 0}
                  className={`font-bold cursor-pointer ${otpExpirySeconds <= 0 ? 'text-brand-pink light:text-purple-700 underline' : 'opacity-50'}`}
                >
                  {otpExpirySeconds > 0 ? `Resend OTP (${formatTimer(otpExpirySeconds)})` : '⚡ Resend New OTP'}
                </button>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="hover:text-white light:hover:text-slate-900 cursor-pointer"
                >
                  Back to Login
                </button>
              </div>
            </div>
          )}

          {/* 4. FORGOT PASSWORD FORM */}
          {mode === 'forgot' && (
            <div className="space-y-4">
              {forgotStep === 1 ? (
                <form onSubmit={handleRequestForgotOTP} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 light:text-slate-700 mb-1.5">Registered Email</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 light:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="Your Email"
                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 text-xs text-white light:text-slate-900 placeholder-slate-500 light:placeholder-slate-400 focus:outline-none focus:border-brand-pink"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-purple to-brand-pink text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Send Password Reset OTP</span>}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 light:text-slate-700 mb-1.5">6-Digit Reset OTP</label>
                    <input
                      type="text"
                      required
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value)}
                      placeholder="849201"
                      className="w-full px-4 py-3 rounded-2xl bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 text-xs font-mono text-white light:text-slate-900 text-center tracking-widest focus:outline-none focus:border-brand-pink"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 light:text-slate-700 mb-1.5">New Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 light:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 8 characters (1 uppercase, 1 number, 1 special)"
                        className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 text-xs text-white light:text-slate-900 placeholder-slate-500 light:placeholder-slate-400 focus:outline-none focus:border-brand-pink"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 light:text-slate-500 hover:text-white light:hover:text-slate-900 cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-purple to-brand-pink text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Reset Password & Login</span>}
                  </button>
                </form>
              )}

              <div className="text-center pt-2 border-t border-white/10 light:border-slate-200">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-xs text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900 cursor-pointer"
                >
                  Back to Login
                </button>
              </div>
            </div>
          )}

          {/* Social Auth & Conditional Quick Account Switch */}
          {(mode === 'login' || mode === 'signup') && (
            <div className="mt-6 pt-5 border-t border-white/10 light:border-slate-200 space-y-3">
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSocialAuth('Google')}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-white/5 light:bg-slate-100 hover:bg-white/10 light:hover:bg-slate-200 border border-white/10 light:border-slate-200 text-[11px] font-bold text-white light:text-slate-900 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5 text-emerald-400 light:text-emerald-600" />
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialAuth('Apple')}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-white/5 light:bg-slate-100 hover:bg-white/10 light:hover:bg-slate-200 border border-white/10 light:border-slate-200 text-[11px] font-bold text-white light:text-slate-900 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5 text-slate-300 light:text-slate-700" />
                  <span>Apple</span>
                </button>
              </div>

              {/* Returning Accounts Quick Switcher - CONDITIONAL ONLY */}
              {rememberedAccounts.length > 0 && (
                <div className="pt-2 text-center space-y-1.5">
                  <p className="text-[10px] font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider">Quick Account Switch</p>
                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    {rememberedAccounts.slice(0, 3).map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          setEmail(u.email);
                          setMode('login');
                          setSuccessMsg(`Selected account: ${u.name} (${u.email})`);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white/5 light:bg-slate-100 hover:bg-white/10 light:hover:bg-slate-200 border border-white/10 light:border-slate-200 text-[11px] text-slate-300 light:text-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span>{u.avatar || '👤'}</span>
                        <span className="font-semibold truncate max-w-[120px]">{u.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Clean Minimal Footer */}
      <div className="w-full max-w-7xl mx-auto text-center relative z-20 pt-4 pb-2">
        <p className="text-[11px] text-slate-400 light:text-slate-600 font-medium">
          Notiq AI • Ultimate AI Study Companion • 100% Encrypted Workspace
        </p>
      </div>

    </div>
  );
};
