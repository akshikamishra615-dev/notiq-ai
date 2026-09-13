import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Sun, 
  Moon, 
  ShieldCheck, 
  User, 
  Target, 
  Layers, 
  GraduationCap, 
  CheckCircle2,
  Building,
  MapPin
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

interface WorkspaceSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVATAR_LIST = ['🎓', '🧠', '⚡', '🚀', '👑', '🌟', '📚', '🎨', '💡', '🔬'];

export const WorkspaceSetupModal: React.FC<WorkspaceSetupModalProps> = ({ isOpen, onClose }) => {
  const { createNewWorkspace, workspaces } = useApp();
  const { currentUser } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Personal Info
  const [fullName, setFullName] = useState(currentUser?.name || 'Scholar');
  const [wsName, setWsName] = useState(`${currentUser?.name || 'Personal'}'s Workspace`);
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '🎓');

  // Step 2: About You
  const [role, setRole] = useState('Student');
  const [institution, setInstitution] = useState('');
  const [course, setCourse] = useState('');
  const [city, setCity] = useState('');

  // Step 3: Preferences
  const [lang, setLang] = useState<'auto' | 'hi' | 'en'>('auto');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [studyGoal, setStudyGoal] = useState('1 Hour');

  // Validation Error state
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!fullName.trim()) {
      setErrorMsg('Full Name is required.');
      return;
    }
    if (!wsName.trim()) {
      setErrorMsg('Workspace Name is required.');
      return;
    }
    if (workspaces.some(w => w.name.toLowerCase() === wsName.trim().toLowerCase())) {
      setErrorMsg('A workspace with this name already exists. Please choose another name.');
      return;
    }
    setStep(2);
  };

  const handleNextStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(3);
  };

  const handleNextStep3 = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(4);
  };

  const handleFinalCreate = () => {
    const finalName = wsName.trim() || `${fullName.trim()}'s Workspace`;
    createNewWorkspace({
      fullName: fullName.trim() || 'Scholar',
      name: finalName,
      avatar,
      role,
      institution: institution.trim(),
      course: course.trim(),
      city: city.trim(),
      studyGoal,
      language: lang,
      theme,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-2xl overflow-y-auto animate-in fade-in duration-300">
      <div className="w-full max-w-3xl bg-[#120e24] light:bg-white border border-brand-pink/30 light:border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 light:text-slate-900 relative overflow-hidden my-auto">
        
        {/* Ambient Lighting */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-brand-pink/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-brand-purple/25 rounded-full blur-3xl pointer-events-none" />

        {/* Wizard Header & Progress Bar */}
        <div className="space-y-4 mb-6 relative z-10">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-purple/20 border border-brand-purple/40 text-brand-pink text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Workspace Creator Wizard</span>
            </div>
            <span className="text-xs font-bold text-slate-400 light:text-slate-600">
              Step {step} of 4
            </span>
          </div>

          {/* Progress Bar Line */}
          <div className="w-full h-2 bg-white/5 light:bg-slate-200 rounded-full overflow-hidden flex">
            <div 
              className="h-full bg-gradient-to-r from-brand-purple to-brand-pink transition-all duration-300" 
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>

          <div className="text-center sm:text-left">
            <h2 className="text-xl sm:text-3xl font-extrabold text-white light:text-slate-900 tracking-tight">
              {step === 1 && 'Personal Information'}
              {step === 2 && 'About Your Studies'}
              {step === 3 && 'Workspace Preferences'}
              {step === 4 && 'Review & Launch Workspace'}
            </h2>
            <p className="text-xs text-slate-400 light:text-slate-600 mt-1">
              {step === 1 && 'Enter your full name and display title for your isolated workspace.'}
              {step === 2 && 'Add optional academic details to personalize AI tutor recommendations.'}
              {step === 3 && 'Choose your preferred study language, display theme, and daily goals.'}
              {step === 4 && 'Confirm your profile summary and generate your isolated workspace.'}
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 mb-4 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold animate-in fade-in">
            ⚠️ {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
          
          {/* Left Column: STEP FORM SLIDES */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* STEP 1: Personal Info */}
            {step === 1 && (
              <form onSubmit={handleNextStep1} className="space-y-4 animate-in fade-in duration-200">
                <div>
                  <label className="block text-xs font-bold text-slate-300 light:text-slate-700 mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-brand-pink" />
                    <span>Full Name *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => {
                      setFullName(e.target.value);
                      if (!wsName || wsName.includes("'s Study Space")) {
                        setWsName(`${e.target.value.trim()}'s Study Space`);
                      }
                    }}
                    placeholder="e.g. Akshika"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 light:bg-slate-50 border border-white/10 light:border-slate-200 text-xs text-white light:text-slate-900 placeholder-slate-500 light:placeholder-slate-400 focus:outline-none focus:border-brand-pink font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 light:text-slate-700 mb-1 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-brand-purple" />
                    <span>Workspace Name *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={wsName}
                    onChange={e => setWsName(e.target.value)}
                    placeholder="e.g. Akshika's Study Space"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 light:bg-slate-50 border border-white/10 light:border-slate-200 text-xs text-white light:text-slate-900 placeholder-slate-500 light:placeholder-slate-400 focus:outline-none focus:border-brand-pink font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 light:text-slate-700 mb-1">Nickname / Display Name (Optional)</label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={e => setNickname(e.target.value)}
                    placeholder="e.g. Akshi"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 light:bg-slate-50 border border-white/10 light:border-slate-200 text-xs text-white light:text-slate-900 placeholder-slate-500 light:placeholder-slate-400 focus:outline-none focus:border-brand-pink font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 light:text-slate-700 mb-1">Choose Avatar Icon</label>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {AVATAR_LIST.map(av => (
                      <button
                        key={av}
                        type="button"
                        onClick={() => setAvatar(av)}
                        className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all cursor-pointer ${
                          avatar === av 
                            ? 'bg-brand-pink/30 border-2 border-brand-pink scale-110 shadow-lg' 
                            : 'bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 hover:bg-white/10 light:hover:bg-slate-200'
                        }`}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-4 py-3.5 rounded-2xl bg-gradient-to-r from-brand-purple to-brand-pink text-white font-black text-xs shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Continue to Academic Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* STEP 2: About You */}
            {step === 2 && (
              <form onSubmit={handleNextStep2} className="space-y-4 animate-in fade-in duration-200">
                <div>
                  <label className="block text-xs font-bold text-slate-300 light:text-slate-700 mb-1 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Role / Profession</span>
                  </label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#191432] light:bg-slate-100 border border-white/15 light:border-slate-200 text-xs text-white light:text-slate-900 focus:outline-none focus:border-brand-pink"
                  >
                    <option value="Student">Student (School / College / University)</option>
                    <option value="Professional">Professional / Lifelong Learner</option>
                    <option value="Researcher">Researcher / Scholar</option>
                    <option value="Educator">Teacher / Educator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 light:text-slate-700 mb-1 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-sky-400" />
                    <span>School / College / University (Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={institution}
                    onChange={e => setInstitution(e.target.value)}
                    placeholder="e.g. Stanford University / CBSE School"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 light:bg-slate-50 border border-white/10 light:border-slate-200 text-xs text-white light:text-slate-900 placeholder-slate-500 light:placeholder-slate-400 focus:outline-none focus:border-brand-pink font-semibold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 light:text-slate-700 mb-1">Course / Major (Optional)</label>
                    <input
                      type="text"
                      value={course}
                      onChange={e => setCourse(e.target.value)}
                      placeholder="e.g. Computer Science / Physics"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 light:bg-slate-50 border border-white/10 light:border-slate-200 text-xs text-white light:text-slate-900 placeholder-slate-500 light:placeholder-slate-400 focus:outline-none focus:border-brand-pink font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 light:text-slate-700 mb-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" />
                      <span>City / Location (Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      placeholder="e.g. New Delhi / London"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 light:bg-slate-50 border border-white/10 light:border-slate-200 text-xs text-white light:text-slate-900 placeholder-slate-500 light:placeholder-slate-400 focus:outline-none focus:border-brand-pink font-semibold"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-3 rounded-2xl bg-white/5 light:bg-slate-100 text-slate-300 light:text-slate-700 border border-white/10 light:border-slate-200 text-xs font-bold flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-brand-purple to-brand-pink text-white font-black text-xs shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Continue to Preferences</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: Preferences */}
            {step === 3 && (
              <form onSubmit={handleNextStep3} className="space-y-4 animate-in fade-in duration-200">
                <div>
                  <label className="block text-xs font-bold text-slate-300 light:text-slate-700 mb-1 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-amber-400" />
                    <span>Daily Study Goal</span>
                  </label>
                  <select
                    value={studyGoal}
                    onChange={e => setStudyGoal(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#191432] light:bg-slate-100 border border-white/15 light:border-slate-200 text-xs text-white light:text-slate-900 focus:outline-none focus:border-brand-pink"
                  >
                    <option value="30 Minutes">30 Minutes</option>
                    <option value="1 Hour">1 Hour (Recommended)</option>
                    <option value="2 Hours">2 Hours</option>
                    <option value="3 Hours">3 Hours</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 light:text-slate-700 mb-1">Language Preference</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'auto', label: '🌐 Auto Detect' },
                      { id: 'hi', label: '🇮🇳 Hindi' },
                      { id: 'en', label: '🇬🇧 English' },
                    ].map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setLang(item.id as 'auto' | 'hi' | 'en')}
                        className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          lang === item.id 
                            ? 'bg-brand-pink text-white shadow-md' 
                            : 'bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 text-slate-300 light:text-slate-700'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 light:text-slate-700 mb-1">Display Theme</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTheme('dark')}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer ${
                        theme === 'dark'
                          ? 'bg-brand-purple text-white shadow-md'
                          : 'bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 text-slate-300 light:text-slate-700'
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5" />
                      <span>Midnight Dark</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTheme('light')}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer ${
                        theme === 'light'
                          ? 'bg-brand-pink text-white shadow-md'
                          : 'bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 text-slate-300 light:text-slate-700'
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5" />
                      <span>Clean Light</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-4 py-3 rounded-2xl bg-white/5 light:bg-slate-100 text-slate-300 light:text-slate-700 border border-white/10 light:border-slate-200 text-xs font-bold flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-brand-purple to-brand-pink text-white font-black text-xs shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Review Summary</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 4: Review & Final Create */}
            {step === 4 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="p-4 rounded-2xl bg-white/5 light:bg-slate-50 border border-white/10 light:border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-300 light:text-slate-700 font-bold border-b border-white/10 light:border-slate-200 pb-2">
                    <span>Summary Checklist</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p><strong className="text-slate-400 light:text-slate-600">Full Name:</strong> {fullName}</p>
                  <p><strong className="text-slate-400 light:text-slate-600">Workspace:</strong> {wsName}</p>
                  <p><strong className="text-slate-400 light:text-slate-600">Role:</strong> {role} {institution ? `(${institution})` : ''}</p>
                  <p><strong className="text-slate-400 light:text-slate-600">Preferences:</strong> {lang.toUpperCase()} • {studyGoal}</p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="px-4 py-3 rounded-2xl bg-white/5 light:bg-slate-100 text-slate-300 light:text-slate-700 border border-white/10 light:border-slate-200 text-xs font-bold flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleFinalCreate}
                    className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-brand-purple via-brand-pink to-brand-purple text-white font-black text-sm shadow-xl shadow-brand-purple/40 hover:opacity-95 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
                  >
                    <span>✨ Create My Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Right Column: LIVE 3D WORKSPACE CARD PREVIEW */}
          <div className="lg:col-span-5 space-y-4">
            <p className="text-xs font-bold text-slate-300 light:text-slate-700 uppercase tracking-wider text-center lg:text-left">
              Live Profile Preview Card
            </p>

            <div className="p-6 rounded-3xl bg-gradient-to-br from-brand-purple/20 via-[#181333] to-brand-pink/20 light:bg-slate-50 light:from-purple-50 light:to-pink-50 border border-brand-pink/40 light:border-slate-200 shadow-2xl space-y-4 text-center relative overflow-hidden group">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-brand-purple to-brand-pink p-[2px] shadow-xl mx-auto">
                <div className="w-full h-full bg-[#141028] light:bg-white rounded-[22px] flex items-center justify-center text-4xl shadow-inner">
                  {avatar}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-black text-white light:text-slate-900 truncate">{fullName || 'Your Name'}</h3>
                <p className="text-xs text-brand-pink font-extrabold truncate mt-0.5">
                  {wsName || 'Personal Workspace'}
                </p>
                <p className="text-[10px] text-slate-400 light:text-slate-600 truncate mt-0.5">{role} {institution ? `• ${institution}` : ''}</p>
              </div>

              <div className="pt-3 border-t border-white/10 light:border-slate-200 grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-300 light:text-slate-700">
                <div className="p-2 rounded-xl bg-white/5 light:bg-slate-100">
                  <span className="block text-slate-500 light:text-slate-400 uppercase">Goal</span>
                  <span className="text-amber-400 light:text-amber-600">{studyGoal}</span>
                </div>
                <div className="p-2 rounded-xl bg-white/5 light:bg-slate-100">
                  <span className="block text-slate-500 light:text-slate-400 uppercase">Language</span>
                  <span className="text-brand-pink uppercase">{lang}</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[10px] font-semibold text-emerald-400 light:text-emerald-600">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Isolated AES-256 Workspace</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
