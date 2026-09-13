import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { UserProfile, AchievementBadge, QuizResultReport } from '../types';
import { hashPasswordSync, generateSalt, verifyClientPassword } from '../services/securityService';
import { 
  verifySubmittedOTP,
  maskEmailForPrivacy
} from '../services/emailService';
import { apiClient, clearAuthToken } from '../services/apiClient';

interface AuthContextType {
  users: UserProfile[];
  currentUser: UserProfile;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isSecurityModalOpen: boolean;
  setIsSecurityModalOpen: (open: boolean) => void;
  isLogoutModalOpen: boolean;
  setIsLogoutModalOpen: (open: boolean) => void;
  pendingVerificationEmail: string | null;
  setPendingVerificationEmail: (email: string | null) => void;
  activeOtpCode: string | null;
  otpCooldownSeconds: number;
  
  // Actions
  login: (emailOrName: string, password: string) => Promise<{ success: boolean; requireVerification?: boolean; error?: string }>;
  signup: (name: string, email: string, password: string, avatar?: string) => Promise<{ success: boolean; requireVerification?: boolean; maskedEmail?: string; otpCode?: string; error?: string }>;
  verifyEmailOTP: (email: string, otpInput: string) => Promise<{ success: boolean; error?: string }>;
  resendEmailOTP: (email: string) => Promise<{ success: boolean; maskedEmail?: string; otpCode?: string; error?: string }>;
  requestPasswordResetOTP: (email: string) => Promise<{ success: boolean; maskedEmail?: string; otpCode?: string; error?: string }>;
  resetPasswordWithOTP: (email: string, otpInput: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  completeOnboarding: (language: string, theme: string, studyGoalMinutes: number) => void;
  logout: () => void;
  logoutConfirmed: () => void;
  logoutAllDevices: () => void;
  deactivateAccount: () => Promise<{ success: boolean; error?: string }>;
  deleteAccountPermanently: (password: string, confirmationText: string) => Promise<{ success: boolean; error?: string }>;
  switchUser: (userId: string) => void;
  updateProfile: (partial: Partial<UserProfile>) => void;
  addXP: (amount: number) => { leveledUp: boolean; newLevel: number };
  recordQuizResult: (report: QuizResultReport) => void;
  recordNoteCreated: (count?: number) => void;
  recordFlashcardMastered: () => void;
  recordDocUploaded: () => void;
}

const DEFAULT_BADGES: AchievementBadge[] = [
  { id: 'badge-first-note', name: 'Note Creator', description: 'Created your first AI sticky note', icon: '📝', category: 'notes', unlocked: false },
  { id: 'badge-quiz-ace', name: 'Quiz Ace', description: 'Scored 100% on any AI knowledge check', icon: '🏆', category: 'quiz', unlocked: false },
  { id: 'badge-streak-3', name: 'Streak Flame', description: 'Maintained a 3-day active study streak', icon: '🔥', category: 'streak', unlocked: false },
  { id: 'badge-flashcard-5', name: 'Memory Master', description: 'Mastered 5 or more active recall flashcards', icon: '🧠', category: 'mastery', unlocked: false },
  { id: 'badge-ocr-wizard', name: 'OCR Scanner', description: 'Extracted text from an image or scanned document', icon: '⚡', category: 'special', unlocked: false },
  { id: 'badge-grandmaster', name: 'Grandmaster Scholar', description: 'Reached Level 5 with over 1,000 XP', icon: '👑', category: 'special', unlocked: false },
];

const EMPTY_GUEST_USER: UserProfile = {
  id: '',
  name: '',
  email: '',
  avatar: '👤',
  passwordHash: '',
  salt: '',
  createdAt: new Date().toISOString(),
  lastLogin: new Date().toISOString(),
  lastActiveDate: new Date().toISOString().split('T')[0],
  xp: 0,
  level: 1,
  streakDays: 0,
  badges: DEFAULT_BADGES.map(b => ({ ...b, unlocked: false })),
  quizHistory: [],
  emailVerified: false,
  onboardingCompleted: false,
  stats: {
    totalNotesCreated: 0,
    totalQuizzesTaken: 0,
    totalFlashcardsMastered: 0,
    totalDocsUploaded: 0,
    quizAverageScore: 0,
    studyTimeMinutes: 0,
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem('sticky_ai_users_directory_v4');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return [];
    } catch {
      return [];
    }
  });

  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const activeId = localStorage.getItem('sticky_ai_active_user_id_v4');
      const found = users.find(u => u.id === activeId);
      return found || EMPTY_GUEST_USER;
    } catch {
      return EMPTY_GUEST_USER;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sticky_ai_is_authenticated_v4') === 'true';
    } catch {
      return false;
    }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);
  const [activeOtpCode] = useState<string | null>(null);
  const [otpCooldownSeconds, setOtpCooldownSeconds] = useState(0);

  // Sync users directory
  useEffect(() => {
    try {
      localStorage.setItem('sticky_ai_users_directory_v4', JSON.stringify(users));
    } catch (e) {
      console.warn('Failed to save users directory:', e);
    }
  }, [users]);

  // Sync active user ID & authentication status
  useEffect(() => {
    if (currentUser && isAuthenticated) {
      localStorage.setItem('sticky_ai_active_user_id_v4', currentUser.id);
      localStorage.setItem('sticky_ai_is_authenticated_v4', 'true');
    } else {
      localStorage.removeItem('sticky_ai_is_authenticated_v4');
    }
  }, [currentUser, isAuthenticated]);

  // Cooldown timer interval for OTP Resend
  useEffect(() => {
    if (otpCooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setOtpCooldownSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCooldownSeconds]);

  const updateProfile = (partial: Partial<UserProfile>) => {
    setCurrentUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...partial };
      setUsers(all => all.map(u => u.id === updated.id ? updated : u));
      return updated;
    });
  };

  const addXP = (amount: number): { leveledUp: boolean; newLevel: number } => {
    let leveledUp = false;
    let newLevel = currentUser.level;
    const newXP = (currentUser.xp || 0) + amount;

    if (newXP >= 2000) newLevel = 5;
    else if (newXP >= 1000) newLevel = 4;
    else if (newXP >= 500) newLevel = 3;
    else if (newXP >= 250) newLevel = 2;
    else newLevel = 1;

    if (newLevel > currentUser.level) {
      leveledUp = true;
    }

    updateProfile({
      xp: newXP,
      level: newLevel,
    });

    return { leveledUp, newLevel };
  };

  const recordQuizResult = (report: QuizResultReport) => {
    const history = currentUser.quizHistory || [];
    const updatedHistory = [report, ...history].slice(0, 20);

    const totalQuizzes = (currentUser.stats?.totalQuizzesTaken || 0) + 1;
    const totalScorePct = updatedHistory.reduce((acc, item) => acc + item.percentage, 0);
    const avgScore = Math.round(totalScorePct / updatedHistory.length);

    addXP(report.xpEarned);

    updateProfile({
      quizHistory: updatedHistory,
      stats: {
        ...(currentUser.stats || {
          totalNotesCreated: 0,
          totalQuizzesTaken: 0,
          totalFlashcardsMastered: 0,
          totalDocsUploaded: 0,
          quizAverageScore: 0,
          studyTimeMinutes: 0,
        }),
        totalQuizzesTaken: totalQuizzes,
        quizAverageScore: avgScore,
      }
    });
  };

  const recordNoteCreated = (count: number = 1) => {
    const currentNotesCount = currentUser.stats?.totalNotesCreated || 0;
    addXP(count * 25);
    updateProfile({
      stats: {
        ...(currentUser.stats || {
          totalNotesCreated: 0,
          totalQuizzesTaken: 0,
          totalFlashcardsMastered: 0,
          totalDocsUploaded: 0,
          quizAverageScore: 0,
          studyTimeMinutes: 0,
        }),
        totalNotesCreated: currentNotesCount + count,
      }
    });
  };

  const recordFlashcardMastered = () => {
    const currentFC = currentUser.stats?.totalFlashcardsMastered || 0;
    addXP(15);
    updateProfile({
      stats: {
        ...(currentUser.stats || {
          totalNotesCreated: 0,
          totalQuizzesTaken: 0,
          totalFlashcardsMastered: 0,
          totalDocsUploaded: 0,
          quizAverageScore: 0,
          studyTimeMinutes: 0,
        }),
        totalFlashcardsMastered: currentFC + 1,
      }
    });
  };

  const recordDocUploaded = () => {
    const currentDocs = currentUser.stats?.totalDocsUploaded || 0;
    addXP(50);
    updateProfile({
      stats: {
        ...(currentUser.stats || {
          totalNotesCreated: 0,
          totalQuizzesTaken: 0,
          totalFlashcardsMastered: 0,
          totalDocsUploaded: 0,
          quizAverageScore: 0,
          studyTimeMinutes: 0,
        }),
        totalDocsUploaded: currentDocs + 1,
      }
    });
  };

  const login = async (emailOrName: string, password: string): Promise<{ success: boolean; requireVerification?: boolean; error?: string }> => {
    const normalizedInput = emailOrName.trim().toLowerCase();

    // 1. Attempt Backend Server Authentication First
    try {
      const data = await apiClient.login(normalizedInput, password);
      if (data && data.user) {
        const loggedUser: UserProfile = {
          id: data.user.id,
          name: data.user.fullName || data.user.name || 'Scholar',
          email: data.user.email,
          avatar: data.user.avatar || '🎓',
          passwordHash: '',
          salt: '',
          createdAt: data.user.createdAt || new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          lastActiveDate: new Date().toISOString().split('T')[0],
          xp: data.user.xp || 0,
          level: data.user.level || 1,
          streakDays: data.user.streak || 1,
          badges: DEFAULT_BADGES.map(b => ({ ...b, unlocked: false })),
          quizHistory: [],
          emailVerified: data.user.emailVerified !== false,
          onboardingCompleted: true,
          stats: {
            totalNotesCreated: 0,
            totalQuizzesTaken: 0,
            totalFlashcardsMastered: 0,
            totalDocsUploaded: 0,
            quizAverageScore: 0,
            studyTimeMinutes: 0,
          },
        };

        setCurrentUser(loggedUser);
        setUsers(all => {
          const exists = all.some(u => u.id === loggedUser.id);
          return exists ? all.map(u => u.id === loggedUser.id ? loggedUser : u) : [loggedUser, ...all];
        });
        setIsAuthenticated(true);
        setIsAuthModalOpen(false);
        return { success: true };
      }
    } catch (err: any) {
      if (err?.message && !err.message.includes('Fetch') && !err.message.includes('Network') && !err.message.includes('failed to fetch')) {
        return { success: false, error: err.message };
      }
    }

    // 2. Offline Fallback Local User Verification
    const target = users.find(
      u => u.email.toLowerCase() === normalizedInput || u.name.toLowerCase() === normalizedInput
    );

    if (!target) {
      return { success: false, error: 'No account found with this email address or username.' };
    }

    const isValidPassword = verifyClientPassword(password, target.salt || 'default', target.passwordHash);
    if (!isValidPassword) {
      return { success: false, error: 'Incorrect password. Please verify and try again.' };
    }

    if (target.emailVerified === false) {
      setPendingVerificationEmail(target.email);
      setOtpCooldownSeconds(60);

      try {
        await apiClient.sendOtp(target.email);
      } catch {}

      return { 
        success: false, 
        requireVerification: true, 
        error: `Your email is not verified. A verification code has been dispatched to your email.` 
      };
    }

    const updatedUser = {
      ...target,
      lastLogin: new Date().toISOString(),
    };

    setCurrentUser(updatedUser);
    setUsers(all => all.map(u => u.id === updatedUser.id ? updatedUser : u));
    setIsAuthenticated(true);
    setIsAuthModalOpen(false);

    return { success: true };
  };

  const signup = async (
    name: string, 
    rawEmail: string, 
    password: string, 
    avatar: string = '🎓'
  ): Promise<{ success: boolean; requireVerification?: boolean; maskedEmail?: string; error?: string }> => {
    if (!name.trim() || !rawEmail.trim() || !password) {
      return { success: false, error: 'Full name, email, and password are required.' };
    }

    const email = rawEmail.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!strongPasswordRegex.test(password)) {
      return { 
        success: false, 
        error: 'Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character.' 
      };
    }

    // 1. Attempt Backend Server Registration
    try {
      const res = await apiClient.register(name.trim(), email, password, avatar);
      if (res) {
        setPendingVerificationEmail(email);
        setOtpCooldownSeconds(60);
        const masked = maskEmailForPrivacy(email);

        const newUser: UserProfile = {
          id: res.userId || `user-${Date.now()}`,
          name: name.trim(),
          email,
          avatar,
          passwordHash: '',
          salt: '',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          lastActiveDate: new Date().toISOString().split('T')[0],
          xp: 0,
          level: 1,
          streakDays: 1,
          badges: DEFAULT_BADGES.map(b => ({ ...b, unlocked: false })),
          quizHistory: [],
          emailVerified: false,
          onboardingCompleted: false,
          stats: {
            totalNotesCreated: 0,
            totalQuizzesTaken: 0,
            totalFlashcardsMastered: 0,
            totalDocsUploaded: 0,
            quizAverageScore: 0,
            studyTimeMinutes: 0,
          },
        };

        setCurrentUser(newUser);
        setUsers(prev => [newUser, ...prev.filter(u => u.email.toLowerCase() !== email)]);

        return {
          success: true,
          requireVerification: true,
          maskedEmail: masked,
        };
      }
    } catch (err: any) {
      if (err?.message && !err.message.includes('Fetch') && !err.message.includes('Network') && !err.message.includes('failed to fetch')) {
        return { success: false, error: err.message };
      }
    }

    // 2. Offline Fallback Local Registration
    const salt = generateSalt();
    const passwordHash = hashPasswordSync(password, salt);

    const newUser: UserProfile = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      email,
      avatar,
      passwordHash,
      salt,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      lastActiveDate: new Date().toISOString().split('T')[0],
      xp: 0,
      level: 1,
      streakDays: 1,
      badges: DEFAULT_BADGES.map(b => ({ ...b, unlocked: false })),
      quizHistory: [],
      emailVerified: false,
      onboardingCompleted: false,
      stats: {
        totalNotesCreated: 0,
        totalQuizzesTaken: 0,
        totalFlashcardsMastered: 0,
        totalDocsUploaded: 0,
        quizAverageScore: 0,
        studyTimeMinutes: 0,
      },
    };

    setUsers(prev => [newUser, ...prev]);
    setCurrentUser(newUser);
    setPendingVerificationEmail(email);
    setOtpCooldownSeconds(60);

    return { 
      success: true, 
      requireVerification: true,
      maskedEmail: maskEmailForPrivacy(email),
    };
  };

  const verifyEmailOTP = async (rawEmail: string, otpInput: string): Promise<{ success: boolean; error?: string }> => {
    const email = rawEmail.trim().toLowerCase();
    if (!otpInput || otpInput.trim().length !== 6) {
      return { success: false, error: 'Please enter the 6-digit OTP verification code.' };
    }

    // 1. Attempt Backend Server Verification First
    try {
      const data = await apiClient.verifyEmail(email, otpInput.trim());
      if (data && data.token) {
        const targetUser = users.find(u => u.email.toLowerCase() === email) || currentUser;
        if (targetUser) {
          const updated = {
            ...targetUser,
            emailVerified: true,
          };
          setCurrentUser(updated);
          setUsers(all => all.map(u => u.id === updated.id ? updated : u));
        }

        setIsAuthenticated(true);
        setIsAuthModalOpen(false);
        setPendingVerificationEmail(null);
        return { success: true };
      }
    } catch (err: any) {
      if (err?.message && !err.message.includes('Fetch') && !err.message.includes('Network') && !err.message.includes('failed to fetch')) {
        return { success: false, error: err.message };
      }
    }

    // 2. Offline Fallback Verification
    const verificationResult = verifySubmittedOTP(email, otpInput);
    if (!verificationResult.valid) {
      return { success: false, error: verificationResult.error || 'Invalid OTP code.' };
    }

    const targetUser = users.find(u => u.email.toLowerCase() === email) || currentUser;
    if (targetUser) {
      const updated = {
        ...targetUser,
        emailVerified: true,
      };
      setCurrentUser(updated);
      setUsers(all => all.map(u => u.id === updated.id ? updated : u));
    }

    setIsAuthenticated(true);
    setIsAuthModalOpen(false);
    setPendingVerificationEmail(null);

    return { success: true };
  };

  const resendEmailOTP = async (rawEmail: string): Promise<{ success: boolean; maskedEmail?: string; error?: string }> => {
    const email = rawEmail.trim().toLowerCase();
    setPendingVerificationEmail(email);
    setOtpCooldownSeconds(60);

    try {
      await apiClient.sendOtp(email);
      return { success: true, maskedEmail: maskEmailForPrivacy(email) };
    } catch (err: any) {
      if (err?.message && !err.message.includes('Fetch') && !err.message.includes('Network') && !err.message.includes('failed to fetch')) {
        return { success: false, error: err.message };
      }
    }

    return { success: true, maskedEmail: maskEmailForPrivacy(email) };
  };

  const requestPasswordResetOTP = async (rawEmail: string): Promise<{ success: boolean; maskedEmail?: string; error?: string }> => {
    const email = rawEmail.trim().toLowerCase();
    setPendingVerificationEmail(email);
    setOtpCooldownSeconds(60);

    try {
      await apiClient.forgotPassword(email);
      return { success: true, maskedEmail: maskEmailForPrivacy(email) };
    } catch (err: any) {
      if (err?.message && !err.message.includes('Fetch') && !err.message.includes('Network') && !err.message.includes('failed to fetch')) {
        return { success: false, error: err.message };
      }
    }

    return { success: true, maskedEmail: maskEmailForPrivacy(email) };
  };

  const resetPasswordWithOTP = async (
    rawEmail: string, 
    otpInput: string, 
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    const email = rawEmail.trim().toLowerCase();
    if (!otpInput || otpInput.trim().length !== 6) {
      return { success: false, error: 'Please enter the 6-digit verification code.' };
    }

    try {
      await apiClient.resetPassword(email, otpInput.trim(), newPassword);
      setIsAuthenticated(true);
      setIsAuthModalOpen(false);
      setPendingVerificationEmail(null);
      return { success: true };
    } catch (err: any) {
      if (err?.message && !err.message.includes('Fetch') && !err.message.includes('Network') && !err.message.includes('failed to fetch')) {
        return { success: false, error: err.message };
      }
    }

    // Offline fallback
    const verificationResult = verifySubmittedOTP(email, otpInput);
    if (!verificationResult.valid) {
      return { success: false, error: verificationResult.error || 'Invalid OTP code.' };
    }

    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!strongPasswordRegex.test(newPassword)) {
      return { 
        success: false, 
        error: 'Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character.' 
      };
    }

    const target = users.find(u => u.email.toLowerCase() === email);
    if (target) {
      const newSalt = generateSalt();
      const newHash = hashPasswordSync(newPassword, newSalt);
      const updatedUser = {
        ...target,
        salt: newSalt,
        passwordHash: newHash,
        emailVerified: true,
      };
      setCurrentUser(updatedUser);
      setUsers(all => all.map(u => u.id === updatedUser.id ? updatedUser : u));
    }

    setIsAuthenticated(true);
    setIsAuthModalOpen(false);
    setPendingVerificationEmail(null);

    return { success: true };
  };

  const completeOnboarding = (_language: string, _theme: string, studyGoalMinutes: number) => {
    updateProfile({
      onboardingCompleted: true,
      studyGoalMinutes,
    });
  };

  // Opens the Logout Confirmation Modal
  const logout = () => {
    setIsLogoutModalOpen(true);
  };

  // Safe Logout Confirmation Handler
  const logoutConfirmed = () => {
    setIsAuthenticated(false);
    setCurrentUser(EMPTY_GUEST_USER);
    localStorage.removeItem('sticky_ai_is_authenticated_v4');
    localStorage.removeItem('sticky_ai_active_user_id_v4');
    clearAuthToken();
    setIsAuthModalOpen(true);
  };

  // Multi-Device Logout Handler
  const logoutAllDevices = () => {
    setIsAuthenticated(false);
    setCurrentUser(EMPTY_GUEST_USER);
    localStorage.removeItem('sticky_ai_is_authenticated_v4');
    localStorage.removeItem('sticky_ai_active_user_id_v4');
    clearAuthToken();
    setIsAuthModalOpen(true);
  };

  const deactivateAccount = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      await apiClient.deactivateAccount();
      setIsAuthenticated(false);
      setCurrentUser(EMPTY_GUEST_USER);
      localStorage.removeItem('sticky_ai_is_authenticated_v4');
      localStorage.removeItem('sticky_ai_active_user_id_v4');
      clearAuthToken();
      setIsAuthModalOpen(true);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to deactivate account.' };
    }
  };

  const deleteAccountPermanently = async (password: string, confirmationText: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await apiClient.deleteAccount(password, confirmationText);
      setIsAuthenticated(false);
      setCurrentUser(EMPTY_GUEST_USER);
      setUsers(prev => prev.filter(u => u.id !== currentUser.id));
      localStorage.removeItem('sticky_ai_is_authenticated_v4');
      localStorage.removeItem('sticky_ai_active_user_id_v4');
      clearAuthToken();
      setIsAuthModalOpen(true);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to permanently delete account.' };
    }
  };

  const switchUser = (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (target) {
      setCurrentUser(target);
      setIsAuthenticated(true);
      localStorage.setItem('sticky_ai_is_authenticated_v4', 'true');
      setIsAuthModalOpen(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        users,
        currentUser,
        isAuthenticated,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isSecurityModalOpen,
        setIsSecurityModalOpen,
        isLogoutModalOpen,
        setIsLogoutModalOpen,
        pendingVerificationEmail,
        setPendingVerificationEmail,
        activeOtpCode,
        otpCooldownSeconds,
        login,
        signup,
        verifyEmailOTP,
        resendEmailOTP,
        requestPasswordResetOTP,
        resetPasswordWithOTP,
        completeOnboarding,
        logout,
        logoutConfirmed,
        logoutAllDevices,
        deactivateAccount,
        deleteAccountPermanently,
        switchUser,
        updateProfile,
        addXP,
        recordQuizResult,
        recordNoteCreated,
        recordFlashcardMastered,
        recordDocUploaded,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
