import React, { useState, useEffect } from 'react';
import { 
  Sun, 
  Moon, 
  Save, 
  UserCheck, 
  Building, 
  Mail, 
  User,
  GraduationCap,
  BookOpen,
  Globe,
  Target,
  Sliders,
  Trash2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/apiClient';
import type { SummaryMode, StickyColor } from '../types';

export const SettingsView: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    showToast
  } = useApp();

  const { currentUser, updateProfile, deactivateAccount, deleteAccountPermanently } = useAuth();

  const [theme, setTheme] = useState<'dark' | 'light'>(settings.theme);
  const [defaultSummaryMode] = useState<SummaryMode>(settings.defaultSummaryMode);
  const [defaultColor] = useState<StickyColor>(settings.defaultColor);
  const [customApiKey] = useState(settings.customApiKey);

  // Account Management & Danger Zone State
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // User & Academic Profile Fields
  const [fullName, setFullName] = useState(currentUser?.name || 'Scholar');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [userType, setUserType] = useState(currentUser?.userType || 'College Student');
  const [classGrade, setClassGrade] = useState(currentUser?.classGrade || '');
  const [course, setCourse] = useState(currentUser?.course || '');
  const [institution, setInstitution] = useState(currentUser?.institution || '');
  const [semester, setSemester] = useState(currentUser?.semester || '');
  const [academicYear, setAcademicYear] = useState(currentUser?.academicYear || '');
  const [subjectsInput, setSubjectsInput] = useState(() => {
    if (Array.isArray(currentUser?.subjects)) return currentUser.subjects.join(', ');
    if (typeof currentUser?.subjects === 'string') return currentUser.subjects;
    return '';
  });
  const [preferredLanguage, setPreferredLanguage] = useState(currentUser?.preferredLanguage || 'auto');
  const [learningGoals, setLearningGoals] = useState(currentUser?.learningGoals || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.name || 'Scholar');
      setEmail(currentUser.email || '');
      setUserType(currentUser.userType || 'College Student');
      setClassGrade(currentUser.classGrade || '');
      setCourse(currentUser.course || '');
      setInstitution(currentUser.institution || '');
      setSemester(currentUser.semester || '');
      setAcademicYear(currentUser.academicYear || '');
      if (Array.isArray(currentUser.subjects)) {
        setSubjectsInput(currentUser.subjects.join(', '));
      } else if (typeof currentUser.subjects === 'string') {
        setSubjectsInput(currentUser.subjects);
      }
      setPreferredLanguage(currentUser.preferredLanguage || 'auto');
      setLearningGoals(currentUser.learningGoals || '');
    }
  }, [currentUser]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const subjectsArray = subjectsInput
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      updateProfile({
        name: fullName.trim(),
        userType,
        classGrade: classGrade.trim(),
        course: course.trim(),
        institution: institution.trim(),
        semester: semester.trim(),
        academicYear: academicYear.trim(),
        subjects: subjectsArray,
        preferredLanguage: preferredLanguage as any,
        learningGoals: learningGoals.trim(),
      });

      updateSettings({
        theme,
        language: preferredLanguage as any,
        defaultSummaryMode,
        defaultColor,
        customApiKey,
      });

      // Sync with backend API safely
      try {
        await apiClient.updateUserProfile({
          fullName: fullName.trim(),
          college: institution.trim(),
          course: course.trim(),
          semester: semester.trim(),
          academicYear: academicYear.trim(),
          classGrade: classGrade.trim(),
          userType,
          subjects: subjectsArray,
          learningGoals: learningGoals.trim(),
          preferredLanguage,
        });
      } catch {}

      showToast('Profile & preferences saved successfully!', 'success');
    } catch {
      showToast('Profile saved locally.', 'info');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 sm:py-8 space-y-8 pb-20">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white light:text-slate-900 tracking-tight">
              User Profile & <span className="gradient-text">Academic Settings</span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 light:text-slate-600 mt-1">
            Personalize your NOTIQ AI experience with custom academic details, goals, and display preferences.
          </p>
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={isSaving}
          className="w-full sm:w-auto px-6 py-3 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-brand-purple to-brand-pink shadow-lg shadow-brand-purple/25 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      {/* 1. PERSONAL & ACADEMIC INFORMATION SECTION */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#141028] light:bg-white border border-brand-pink/30 light:border-slate-200 space-y-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-white/10 light:border-slate-200">
          <div className="flex items-center gap-2.5 text-brand-pink font-extrabold text-sm">
            <UserCheck className="w-5 h-5 text-brand-pink" />
            <span>Personal & Academic Profile</span>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-brand-pink/20 text-brand-pink border border-brand-pink/30">
            {userType}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-300 light:text-slate-700 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-brand-pink" />
              <span>Full Name</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 text-xs text-white light:text-slate-900 focus:outline-none focus:border-brand-pink font-semibold"
            />
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-bold text-slate-300 light:text-slate-700 mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-sky-400" />
              <span>Email Address</span>
            </label>
            <input
              type="email"
              readOnly
              value={email}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 text-xs text-slate-400 light:text-slate-500 font-semibold cursor-not-allowed"
            />
          </div>

          {/* User Type */}
          <div>
            <label className="block text-xs font-bold text-slate-300 light:text-slate-700 mb-1 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
              <span>I am a...</span>
            </label>
            <select
              value={userType}
              onChange={e => setUserType(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#191432] light:bg-slate-100 border border-white/15 light:border-slate-200 text-xs text-white light:text-slate-900 focus:outline-none focus:border-brand-pink font-semibold"
            >
              <option value="School Student">School Student (Class 9 - 12)</option>
              <option value="College Student">College / University Student</option>
              <option value="Professional">Professional / Lifelong Learner</option>
              <option value="Other Learner">Other Learner</option>
            </select>
          </div>

          {/* Class / Grade */}
          <div>
            <label className="block text-xs font-bold text-slate-300 light:text-slate-700 mb-1">
              Class / Grade
            </label>
            <input
              type="text"
              value={classGrade}
              onChange={e => setClassGrade(e.target.value)}
              placeholder="e.g. Class 12 / Grade 11"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 text-xs text-white light:text-slate-900 focus:outline-none focus:border-brand-pink font-semibold"
            />
          </div>

          {/* Course / Program */}
          <div>
            <label className="block text-xs font-bold text-slate-300 light:text-slate-700 mb-1">
              Course / Degree Program
            </label>
            <input
              type="text"
              value={course}
              onChange={e => setCourse(e.target.value)}
              placeholder="e.g. B.Tech / B.Sc / Commerce"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 text-xs text-white light:text-slate-900 focus:outline-none focus:border-brand-pink font-semibold"
            />
          </div>

          {/* Institution / College / School */}
          <div>
            <label className="block text-xs font-bold text-slate-300 light:text-slate-700 mb-1 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-amber-400" />
              <span>School / College / University</span>
            </label>
            <input
              type="text"
              value={institution}
              onChange={e => setInstitution(e.target.value)}
              placeholder="e.g. Delhi University / Stanford / DPS"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 text-xs text-white light:text-slate-900 focus:outline-none focus:border-brand-pink font-semibold"
            />
          </div>

          {/* Semester / Academic Year */}
          <div>
            <label className="block text-xs font-bold text-slate-300 light:text-slate-700 mb-1">
              Semester / Academic Year
            </label>
            <input
              type="text"
              value={semester}
              onChange={e => setSemester(e.target.value)}
              placeholder="e.g. Semester 4 / 2nd Year"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 text-xs text-white light:text-slate-900 focus:outline-none focus:border-brand-pink font-semibold"
            />
          </div>

          {/* Preferred Language */}
          <div>
            <label className="block text-xs font-bold text-slate-300 light:text-slate-700 mb-1 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>Preferred Language</span>
            </label>
            <select
              value={preferredLanguage}
              onChange={e => setPreferredLanguage(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#191432] light:bg-slate-100 border border-white/15 light:border-slate-200 text-xs text-white light:text-slate-900 focus:outline-none focus:border-brand-pink font-semibold"
            >
              <option value="auto">Auto Detect (English + Hindi)</option>
              <option value="en">English Only</option>
              <option value="hi">Hindi (हिंदी)</option>
              <option value="hinglish">Hinglish</option>
            </select>
          </div>
        </div>

        {/* Subjects Input */}
        <div>
          <label className="block text-xs font-bold text-slate-300 light:text-slate-700 mb-1 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-sky-400" />
            <span>My Key Subjects (Comma separated)</span>
          </label>
          <input
            type="text"
            value={subjectsInput}
            onChange={e => setSubjectsInput(e.target.value)}
            placeholder="e.g. Physics, Chemistry, Mathematics, Hindi"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 text-xs text-white light:text-slate-900 focus:outline-none focus:border-brand-pink font-semibold"
          />
        </div>

        {/* Learning Goals */}
        <div>
          <label className="block text-xs font-bold text-slate-300 light:text-slate-700 mb-1 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-rose-400" />
            <span>Learning Goals</span>
          </label>
          <textarea
            rows={2}
            value={learningGoals}
            onChange={e => setLearningGoals(e.target.value)}
            placeholder="e.g. Scoring 95%+ in Board Exams & preparing chapter-wise quick revision flashcards."
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 text-xs text-white light:text-slate-900 focus:outline-none focus:border-brand-pink font-medium leading-relaxed resize-none"
          />
        </div>
      </div>

      {/* 2. THEME PREFERENCE */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 light:border-slate-200 light:bg-white space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-white light:text-slate-900">Display Theme</h3>
            <p className="text-xs text-slate-400 light:text-slate-600">Choose your preferred visual theme</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Midnight Dark Option */}
          <button
            type="button"
            onClick={() => {
              setTheme('dark');
              updateSettings({ theme: 'dark' });
            }}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative ${
              theme === 'dark'
                ? 'bg-brand-purple/20 light:bg-purple-50 border-brand-pink text-white light:text-slate-900 shadow-lg'
                : 'bg-white/5 light:bg-white border-white/10 light:border-slate-200 text-slate-400 light:text-slate-700 hover:text-white light:hover:text-slate-900 light:hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <Moon className="w-5 h-5 text-brand-pink" />
              {theme === 'dark' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-pink/20 text-brand-pink border border-brand-pink/30">
                  Active
                </span>
              )}
            </div>
            <p className={`text-xs font-bold ${theme === 'dark' ? 'text-white light:text-slate-900' : 'text-slate-200 light:text-slate-900'}`}>
              Midnight Dark
            </p>
            <p className="text-[10px] text-slate-400 light:text-slate-600 mt-0.5">Deep purple & dark violet</p>
          </button>

          {/* Clean Light Mode Option */}
          <button
            type="button"
            onClick={() => {
              setTheme('light');
              updateSettings({ theme: 'light' });
            }}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative ${
              theme === 'light'
                ? 'bg-brand-pink/20 light:bg-[#fdf4ff] border-brand-pink light:border-brand-pink text-white light:text-slate-900 shadow-lg light:shadow-sm'
                : 'bg-white/5 light:bg-white border-white/10 light:border-slate-200 text-slate-400 light:text-slate-700 hover:text-white light:hover:text-slate-900 light:hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <Sun className="w-5 h-5 text-amber-400" />
              {theme === 'light' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-pink/20 light:bg-brand-pink/15 text-brand-pink border border-brand-pink/30">
                  Active
                </span>
              )}
            </div>
            <p className={`text-xs font-bold ${theme === 'light' ? 'text-white light:text-slate-900' : 'text-slate-200 light:text-slate-900'}`}>
              Clean Light Mode
            </p>
            <p className="text-[10px] text-slate-400 light:text-slate-600 mt-0.5">Crisp high-contrast light layout</p>
          </button>
        </div>
      </div>

      {/* 3. ACCOUNT MANAGEMENT & DANGER ZONE */}
      <div className="p-6 rounded-3xl bg-rose-500/10 light:bg-[#fff7f8] border border-rose-500/30 light:border-rose-200 space-y-5">
        <div className="flex items-center gap-2 text-rose-400 light:text-slate-900 font-extrabold text-sm">
          <Sliders className="w-5 h-5 text-rose-400 light:text-rose-600" />
          <span>Account Management & Security Controls</span>
        </div>
        
        {/* Deactivate Account */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/5 light:bg-white border border-white/10 light:border-slate-200">
          <div>
            <p className="text-xs font-extrabold text-white light:text-slate-900">Deactivate Account</p>
            <p className="text-[11px] text-slate-400 light:text-slate-600 max-w-md mt-0.5">
              Temporarily disable access to your account while preserving all your notes, flashcards, quizzes, vault, and XP.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowDeactivateModal(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500/20 light:bg-amber-50 text-amber-300 light:text-amber-900 border border-amber-500/30 light:border-amber-300 hover:bg-amber-500/30 light:hover:bg-amber-100 transition-all flex items-center gap-1.5 justify-center cursor-pointer shrink-0"
          >
            <span>Deactivate Account</span>
          </button>
        </div>

        {/* Delete Account Permanently */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-rose-500/15 light:bg-rose-50 border border-rose-500/30 light:border-rose-200">
          <div>
            <p className="text-xs font-extrabold text-rose-300 light:text-rose-900">Delete Account Permanently</p>
            <p className="text-[11px] text-slate-300 light:text-slate-700 max-w-md mt-0.5">
              Permanently remove your account, profile, notes, flashcards, quizzes, and encrypted vault files. This action cannot be undone.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setDeletePassword('');
              setDeleteConfirmationText('');
              setShowDeleteModal(true);
            }}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 shadow-md transition-all flex items-center gap-1.5 justify-center cursor-pointer shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Account Permanently</span>
          </button>
        </div>
      </div>

      {/* MODAL: DEACTIVATE ACCOUNT CONFIRMATION */}
      {showDeactivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[#141028] light:bg-white border border-amber-500/40 light:border-amber-300 shadow-2xl space-y-4 text-slate-100 light:text-slate-900">
            <div className="flex items-center gap-3 text-amber-400 light:text-amber-600">
              <div className="p-2.5 rounded-2xl bg-amber-500/15 light:bg-amber-100">
                <Moon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white light:text-slate-900">Deactivate Account?</h3>
                <p className="text-xs text-slate-400 light:text-slate-600">Temporary Account Pausing</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-500/10 light:bg-amber-50 border border-amber-500/20 text-xs text-amber-200 light:text-amber-800 space-y-1">
              <p className="font-bold">🔒 Data Preservation Guaranteed:</p>
              <p className="text-[11px] leading-relaxed">
                Deactivating your account temporarily disables login access. Your sticky notes, flashcards, quizzes, private vault documents, and streak XP will be completely preserved without any deletion.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeactivateModal(false)}
                disabled={isDeactivating}
                className="px-4 py-2.5 rounded-xl bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 text-xs font-bold text-slate-300 light:text-slate-700 hover:bg-white/10 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setIsDeactivating(true);
                  const res = await deactivateAccount();
                  setIsDeactivating(false);
                  if (res.success) {
                    showToast('Account deactivated successfully. Your data is preserved.', 'info');
                    setShowDeactivateModal(false);
                  } else {
                    showToast(res.error || 'Failed to deactivate account.', 'error');
                  }
                }}
                disabled={isDeactivating}
                className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-extrabold text-xs hover:bg-amber-400 shadow-md cursor-pointer disabled:opacity-50"
              >
                {isDeactivating ? 'Deactivating...' : 'Confirm Deactivation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PERMANENT ACCOUNT DELETION CONFIRMATION */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              if (deleteConfirmationText !== 'DELETE') {
                showToast('Please type "DELETE" in capital letters to confirm.', 'error');
                return;
              }
              if (!deletePassword) {
                showToast('Please enter your password to confirm account deletion.', 'error');
                return;
              }

              setIsDeleting(true);
              const res = await deleteAccountPermanently(deletePassword, deleteConfirmationText);
              setIsDeleting(false);
              if (res.success) {
                showToast('Account and all associated study data permanently deleted.', 'info');
                setShowDeleteModal(false);
              } else {
                showToast(res.error || 'Failed to delete account.', 'error');
              }
            }}
            className="w-full max-w-md p-6 rounded-3xl bg-[#141028] light:bg-white border border-rose-500/50 light:border-rose-300 shadow-2xl space-y-4 text-slate-100 light:text-slate-900"
          >
            <div className="flex items-center gap-3 text-rose-500">
              <div className="p-2.5 rounded-2xl bg-rose-500/15 light:bg-rose-100">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white light:text-slate-900">Delete Account Permanently</h3>
                <p className="text-xs text-rose-400 light:text-rose-600 font-bold">⚠️ Warning: Irreversible Action</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 light:text-slate-600 leading-relaxed">
              This action is permanent and <strong className="text-rose-400 light:text-rose-600">CANNOT BE UNDONE</strong>. All your notes, flashcards, quizzes, encrypted vault documents, and study history will be deleted forever.
            </p>

            {/* Confirmation Text Input */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-300 light:text-slate-700">
                Type <span className="text-rose-400 font-black">DELETE</span> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={e => setDeleteConfirmationText(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 light:bg-slate-100 border border-white/15 light:border-slate-200 text-xs font-mono font-extrabold text-white light:text-slate-900 focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-300 light:text-slate-700">
                Enter Account Password:
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={e => setDeletePassword(e.target.value)}
                placeholder="Your current password"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 light:bg-slate-100 border border-white/15 light:border-slate-200 text-xs text-white light:text-slate-900 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10 light:border-slate-200">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 text-xs font-bold text-slate-300 light:text-slate-700 hover:bg-white/10 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isDeleting || deleteConfirmationText !== 'DELETE' || !deletePassword}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Deleting Permanently...' : 'Delete Everything Permanently'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
