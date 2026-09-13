import React, { useState } from 'react';
import { 
  Sparkles, 
  Languages, 
  Moon, 
  Sun, 
  Target, 
  ArrowRight, 
  CheckCircle2 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import type { Language } from '../types';

export const OnboardingModal: React.FC = () => {
  const { currentUser, isAuthenticated, completeOnboarding } = useAuth();
  const { updateSettings, showToast } = useApp();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedLang, setSelectedLang] = useState<Language>('auto');
  const [selectedTheme, setSelectedTheme] = useState<'dark' | 'light'>('dark');
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState<number>(30);

  if (!isAuthenticated || !currentUser || currentUser.onboardingCompleted) {
    return null;
  }

  const handleThemeSelect = (theme: 'dark' | 'light') => {
    setSelectedTheme(theme);
    updateSettings({ theme });
  };

  const handleFinish = () => {
    updateSettings({
      language: selectedLang,
      theme: selectedTheme,
    });

    completeOnboarding(selectedLang, selectedTheme, dailyGoalMinutes);
    showToast('Welcome to Notiq AI! Your study environment is ready.', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-[#141028] light:bg-white border border-brand-pink/30 light:border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 light:text-slate-900 relative overflow-hidden">
        
        {/* Glow */}
        <div className="absolute -top-24 -right-24 w-56 h-56 bg-brand-pink/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-brand-purple/25 rounded-full blur-3xl pointer-events-none" />

        {/* Step Indicator */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 light:border-slate-200 mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-brand-purple to-brand-pink text-white shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white light:text-slate-900">Personalize Your Profile</h3>
              <p className="text-xs text-slate-400 light:text-slate-600">Step {step} of 3 • Quick Setup</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleFinish}
              className="text-xs font-semibold text-slate-400 light:text-slate-500 hover:text-white light:hover:text-slate-900 px-2 py-1 rounded-lg hover:bg-white/5 cursor-pointer"
            >
              Skip
            </button>
            <div className="flex items-center gap-1">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === step ? 'w-6 bg-brand-pink' : i < step ? 'w-3 bg-brand-purple' : 'w-3 bg-white/10'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Step 1: Language */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Languages className="w-5 h-5 text-brand-pink" />
              <h4 className="text-sm font-bold text-white light:text-slate-900">Choose Primary Study Language</h4>
            </div>
            <p className="text-xs text-slate-400 light:text-slate-600">Select how AI notes, story summaries, and quiz questions should be generated.</p>

            <div className="space-y-2.5 pt-2">
              {[
                { id: 'auto', label: 'Auto Detect (🤖 Hindi & English)', desc: 'Automatically match original PDF or document script' },
                { id: 'hi', label: 'Hindi (हिंदी)', desc: 'Generate notes, story explanation & MCQs in Hindi' },
                { id: 'en', label: 'English', desc: 'Generate notes, story explanation & MCQs in English' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setSelectedLang(item.id as Language)}
                  className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                    selectedLang === item.id 
                      ? 'bg-gradient-to-r from-brand-purple/30 to-brand-pink/20 border-brand-pink text-white shadow-md' 
                      : 'bg-white/5 light:bg-slate-50 border-white/10 light:border-slate-200 text-slate-300 light:text-slate-700 hover:border-white/20'
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold">{item.label}</p>
                    <p className="text-[11px] text-slate-400 light:text-slate-600 mt-0.5">{item.desc}</p>
                  </div>
                  {selectedLang === item.id && <CheckCircle2 className="w-5 h-5 text-brand-pink shrink-0" />}
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full mt-4 py-3 rounded-2xl bg-gradient-to-r from-brand-purple to-brand-pink text-white font-bold text-xs hover:opacity-95 shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Continue to Theme</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: Theme */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Moon className="w-5 h-5 text-brand-purple" />
              <h4 className="text-sm font-bold text-white light:text-slate-900">Choose Visual Theme</h4>
            </div>
            <p className="text-xs text-slate-400 light:text-slate-600">Select your preferred background contrast for reading notes and studying.</p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleThemeSelect('dark')}
                className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                  selectedTheme === 'dark'
                    ? 'bg-gradient-to-r from-brand-purple/30 to-brand-pink/20 border-brand-pink text-white shadow-md'
                    : 'bg-white/5 light:bg-slate-50 border-white/10 light:border-slate-200 text-slate-300 light:text-slate-700 hover:border-white/20'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-slate-900 mx-auto flex items-center justify-center text-brand-pink mb-2 shadow-inner">
                  <Moon className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold">Midnight Dark</p>
                <p className="text-[10px] text-slate-400 light:text-slate-600 mt-0.5">High-contrast purple</p>
              </button>

              <button
                onClick={() => handleThemeSelect('light')}
                className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                  selectedTheme === 'light'
                    ? 'bg-gradient-to-r from-brand-purple/30 to-brand-pink/20 border-brand-pink text-white shadow-md'
                    : 'bg-white/5 light:bg-slate-50 border-white/10 light:border-slate-200 text-slate-300 light:text-slate-700 hover:border-white/20'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 mx-auto flex items-center justify-center text-slate-800 mb-2 shadow-inner">
                  <Sun className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold">Clean Light</p>
                <p className="text-[10px] text-slate-400 light:text-slate-600 mt-0.5">Bright study mode</p>
              </button>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-3 rounded-2xl bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 text-xs font-bold text-slate-300 light:text-slate-700 hover:bg-white/10 light:hover:bg-slate-200 cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-brand-purple to-brand-pink text-white font-bold text-xs hover:opacity-95 shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continue to Goals</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Daily Goal */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-400" />
              <h4 className="text-sm font-bold text-white light:text-slate-900">Set Daily Study Goal</h4>
            </div>
            <p className="text-xs text-slate-400 light:text-slate-600">Choose your target study time to build your daily streak flame.</p>

            <div className="grid grid-cols-3 gap-2.5 pt-2">
              {[
                { min: 15, label: '15 Mins', desc: 'Casual Review' },
                { min: 30, label: '30 Mins', desc: 'Standard Study' },
                { min: 60, label: '60 Mins', desc: 'Deep Focus' },
              ].map(g => (
                <button
                  key={g.min}
                  onClick={() => setDailyGoalMinutes(g.min)}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    dailyGoalMinutes === g.min
                      ? 'bg-gradient-to-r from-brand-purple/30 to-brand-pink/20 border-brand-pink text-white shadow-md'
                      : 'bg-white/5 light:bg-slate-50 border-white/10 light:border-slate-200 text-slate-300 light:text-slate-700 hover:border-white/20'
                  }`}
                >
                  <p className="text-xs font-extrabold">{g.label}</p>
                  <p className="text-[10px] text-slate-400 light:text-slate-600 mt-0.5">{g.desc}</p>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-3 rounded-2xl bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 text-xs font-bold text-slate-300 light:text-slate-700 hover:bg-white/10 light:hover:bg-slate-200 cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={handleFinish}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-brand-purple via-brand-pink to-brand-purple text-white font-extrabold text-xs hover:opacity-95 shadow-lg shadow-brand-purple/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Launch Sticky AI Workspace</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
