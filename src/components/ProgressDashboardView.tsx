import React, { useState } from 'react';
import { 
  Award, 
  Zap, 
  Flame, 
  CheckCircle, 
  BookOpen, 
  HelpCircle, 
  ShieldCheck, 
  Users, 
  Printer, 
  Sparkles, 
  ChevronRight,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { ResultCardModal } from './ResultCardModal';
import type { QuizResultReport } from '../types';

export const ProgressDashboardView: React.FC = () => {
  const { currentUser, setIsSecurityModalOpen } = useAuth();
  const { setCurrentTab, showToast, activeWorkspace } = useApp();
  const [selectedReport, setSelectedReport] = useState<QuizResultReport | null>(null);

  const wsLevel = activeWorkspace?.level || 1;
  const wsXp = activeWorkspace?.xp || 0;
  const wsStreak = activeWorkspace?.streakDays || 0;

  const nextLevelXP = wsLevel === 5 ? 1000 : wsLevel * 250;
  const currentLevelBase = (wsLevel - 1) * 250;
  const levelProgress = Math.min(100, Math.round(((wsXp - currentLevelBase) / (nextLevelXP - currentLevelBase)) * 100));

  const handlePrintFullReport = () => {
    window.print();
    showToast('Printing Student Learning Performance Report!', 'info');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 sm:py-8 space-y-8 pb-20">
      
      {/* 1. Student Profile Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 light:border-slate-200 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        
        {/* Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-pink/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-brand-purple to-brand-pink p-[2px] shadow-xl shadow-brand-purple/25 shrink-0">
            <div className="w-full h-full bg-[#141028] light:bg-white rounded-[22px] flex items-center justify-center text-3xl sm:text-4xl">
              {activeWorkspace?.avatar || '🎓'}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white light:text-slate-900">
                {activeWorkspace?.fullName || activeWorkspace?.name || 'Personal Workspace'}
              </h1>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-gradient-to-r from-brand-purple to-brand-pink text-white shadow-xs">
                Level {wsLevel}
              </span>
            </div>
            <p className="text-xs font-semibold text-brand-pink mt-0.5">
              Workspace: {activeWorkspace?.name || 'Personal Workspace'}
            </p>
            <p className="text-xs text-slate-400 light:text-slate-500 mt-0.5">
              Isolated Workspace • {wsStreak} Day Active Streak
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs font-semibold">
              <span className="flex items-center gap-1 text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-lg border border-amber-400/20">
                <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{currentUser.streakDays} Day Study Streak</span>
              </span>
              <span className="flex items-center gap-1 text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-lg border border-emerald-400/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>256-bit Vault Active</span>
              </span>
            </div>
          </div>
        </div>

        {/* Profile Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto relative z-10">
          <button
            onClick={() => setCurrentTab('settings')}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 text-xs font-bold text-slate-200 light:text-slate-800 hover:border-brand-pink/50 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-brand-pink" />
            <span>Profile & Settings</span>
          </button>
          <button
            onClick={() => setIsSecurityModalOpen(true)}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Security Audit</span>
          </button>
        </div>
      </div>

      {/* 2. XP & Level Progress Meter */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 light:border-slate-200 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-brand-pink light:text-purple-600" />
            <div>
              <h3 className="text-sm font-bold text-white light:text-slate-900">Experience & Scholar Tier</h3>
              <p className="text-[11px] text-slate-400 light:text-slate-600">Earn XP by creating notes, taking quizzes, and mastering flashcards.</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-sm font-extrabold text-brand-pink light:text-purple-700">{currentUser.xp} XP Total</span>
            <p className="text-[10px] text-slate-400 light:text-slate-600">{nextLevelXP - currentUser.xp} XP to Level {currentUser.level + 1}</p>
          </div>
        </div>

        <div className="w-full h-3.5 bg-white/10 light:bg-slate-200 rounded-full overflow-hidden p-[2px]">
          <div
            className="h-full bg-gradient-to-r from-brand-purple via-brand-pink to-brand-purple rounded-full transition-all duration-500 shadow-md relative"
            style={{ width: `${Math.max(8, levelProgress)}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" />
          </div>
        </div>
      </div>

      {/* 3. Learning Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: 'Sticky Notes Created',
            value: currentUser.stats.totalNotesCreated,
            icon: <BookOpen className="w-5 h-5 text-brand-purple light:text-purple-600" />,
            sub: '+15 XP per note',
          },
          {
            label: 'Quizzes Completed',
            value: currentUser.stats.totalQuizzesTaken,
            icon: <HelpCircle className="w-5 h-5 text-brand-pink light:text-pink-600" />,
            sub: `${currentUser.stats.quizAverageScore}% Average`,
          },
          {
            label: 'Flashcards Mastered',
            value: currentUser.stats.totalFlashcardsMastered,
            icon: <Layers className="w-5 h-5 text-emerald-400 light:text-emerald-600" />,
            sub: 'Active Recall Retention',
          },
          {
            label: 'Daily Study Streak',
            value: `${currentUser.streakDays} Days`,
            icon: <Flame className="w-5 h-5 text-amber-400 fill-amber-400 light:text-amber-600" />,
            sub: 'Consistent Revision',
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="glass-card p-5 rounded-2xl border border-white/10 light:border-slate-200 text-left space-y-2"
          >
            <div className="p-2 rounded-xl bg-white/5 light:bg-slate-100 w-fit">
              {stat.icon}
            </div>
            <div>
              <p className="text-2xl font-extrabold text-white light:text-slate-900">{stat.value}</p>
              <p className="text-xs font-semibold text-slate-300 light:text-slate-700">{stat.label}</p>
              <p className="text-[10px] text-slate-400 light:text-slate-500 mt-0.5">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 4. Gamified Achievements & Badges */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 light:border-slate-200 shadow-xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-brand-pink light:text-purple-600" />
            <h3 className="text-base font-bold text-white light:text-slate-900">
              Unlocked Achievements & Badges
            </h3>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-purple/20 light:bg-purple-100 text-brand-pink light:text-purple-700 font-bold border border-brand-purple/30 light:border-purple-200">
            {currentUser.badges.filter(b => b.unlocked).length} / {currentUser.badges.length} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {currentUser.badges.map((badge) => (
            <div
              key={badge.id}
              className={`p-4 rounded-2xl border transition-all flex items-center gap-3.5 ${
                badge.unlocked
                  ? 'bg-gradient-to-r from-brand-purple/15 to-brand-pink/15 light:bg-purple-50 border-brand-pink/40 light:border-purple-200 shadow-sm'
                  : 'bg-white/[0.02] light:bg-slate-50 border-white/5 light:border-slate-200 text-slate-500 opacity-60'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${
                badge.unlocked ? 'bg-gradient-to-tr from-brand-purple to-brand-pink shadow-md' : 'bg-white/5 light:bg-slate-200 grayscale'
              }`}>
                {badge.icon}
              </div>
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <h5 className={`text-xs font-bold truncate ${badge.unlocked ? 'text-white light:text-slate-900' : 'text-slate-500 light:text-slate-400'}`}>
                    {badge.name}
                  </h5>
                  {badge.unlocked && <CheckCircle className="w-3.5 h-3.5 text-emerald-400 light:text-emerald-600 shrink-0" />}
                </div>
                <p className="text-[11px] text-slate-400 light:text-slate-600 line-clamp-2 mt-0.5">
                  {badge.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Recent AI Assessment Results & Comment Reports */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 light:border-slate-200 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-pink light:text-purple-600" />
            <div>
              <h3 className="text-base font-bold text-white light:text-slate-900">
                AI Knowledge Check Assessments
              </h3>
              <p className="text-xs text-slate-400 light:text-slate-600">Contextual evaluation and personalized coaching commentary.</p>
            </div>
          </div>
          <button
            onClick={handlePrintFullReport}
            className="px-4 py-2 rounded-xl bg-white/5 light:bg-slate-100 hover:bg-white/10 light:hover:bg-slate-200 text-xs font-semibold text-slate-200 light:text-slate-800 border border-white/10 light:border-slate-200 flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-400 light:text-emerald-600" />
            <span>Print Report Card</span>
          </button>
        </div>

        {currentUser.quizHistory.length === 0 ? (
          <div className="text-center py-10 space-y-3">
            <p className="text-xs text-slate-400">No quiz assessments completed yet.</p>
            <button
              onClick={() => setCurrentTab('quiz')}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-purple to-brand-pink shadow-md"
            >
              Take an AI Quiz Now
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {currentUser.quizHistory.map((report) => (
              <div
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className="glass-card p-4 sm:p-5 rounded-2xl border border-white/10 light:border-slate-200 hover:border-brand-pink/50 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-brand-purple/20 text-brand-pink border border-brand-purple/30 flex items-center justify-center font-bold text-sm shrink-0">
                    {report.percentage}%
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-white light:text-slate-900 group-hover:text-brand-pink transition-colors">
                      {report.docTitle}
                    </h4>
                    <p className="text-[11px] text-slate-300 light:text-slate-600 line-clamp-1 italic mt-0.5">
                      "{report.aiComment}"
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400 self-end sm:self-center shrink-0">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-brand-pink/20 text-brand-pink">
                    +{report.xpEarned} XP
                  </span>
                  <span>{new Date(report.date).toLocaleDateString()}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Report Modal */}
      <ResultCardModal
        report={selectedReport}
        isOpen={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        onRetake={() => {
          setSelectedReport(null);
          setCurrentTab('quiz');
        }}
      />

    </div>
  );
};
