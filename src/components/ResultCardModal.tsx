import React, { useRef } from 'react';
import { 
  X, 
  Award, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Printer, 
  RotateCcw, 
  Layers,
  Zap,
  Star
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import type { QuizResultReport } from '../types';

interface ResultCardModalProps {
  report: QuizResultReport | null;
  isOpen: boolean;
  onClose: () => void;
  onRetake: () => void;
}

export const ResultCardModal: React.FC<ResultCardModalProps> = ({
  report,
  isOpen,
  onClose,
  onRetake,
}) => {
  const { currentUser } = useAuth();
  const { setCurrentTab, showToast } = useApp();
  const certificateRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !report) return null;

  const handlePrintCertificate = () => {
    window.print();
    showToast('Print dialog initiated for Study Certificate!', 'info');
  };

  const badgeColor = {
    grandmaster: 'from-amber-400 to-amber-600 text-amber-950',
    master: 'from-purple-500 to-pink-500 text-white',
    proficient: 'from-sky-500 to-blue-600 text-white',
    improving: 'from-emerald-500 to-teal-600 text-white',
    'needs-review': 'from-rose-500 to-orange-500 text-white',
  }[report.feedbackCategory];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-[#141028] light:bg-white border border-white/15 light:border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-brand-purple/30 text-slate-100 light:text-slate-900 relative overflow-hidden max-h-[92vh] overflow-y-auto">
        
        {/* Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-56 h-56 bg-brand-pink/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-brand-purple/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header Close */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 light:border-slate-200 mb-4 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{currentUser.avatar}</span>
            <div>
              <p className="text-xs font-bold text-white light:text-slate-900">{currentUser.name}</p>
              <p className="text-[10px] text-brand-pink light:text-purple-700 font-semibold">Level {currentUser.level} Scholar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 light:bg-slate-100 hover:bg-white/10 light:hover:bg-slate-200 text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Certificate Card Content */}
        <div ref={certificateRef} className="space-y-5 relative z-10">
          
          {/* Main Score Hero Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-b from-white/10 to-white/[0.02] light:from-slate-50 light:to-slate-100 border border-white/15 light:border-slate-200 text-center relative overflow-hidden shadow-xl">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${badgeColor} mx-auto flex items-center justify-center shadow-lg mb-3 animate-bounce`}>
              <Award className="w-8 h-8" />
            </div>

            <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-pink light:text-purple-700">
              AI Study Assessment Report
            </span>

            <h3 className="text-2xl sm:text-3xl font-extrabold text-white light:text-slate-900 mt-1">
              {report.percentage}% Score
            </h3>

            <p className="text-xs text-slate-400 light:text-slate-600 mt-0.5">
              Topic: <span className="text-slate-200 light:text-slate-900 font-semibold">{report.docTitle}</span>
            </p>

            <div className="flex items-center justify-center gap-3 mt-4 pt-3 border-t border-white/10 light:border-slate-200">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-brand-purple/20 light:bg-purple-100 text-brand-pink light:text-purple-700 border border-brand-purple/30 light:border-purple-200 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" /> +{report.xpEarned} XP Earned
              </span>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 light:bg-emerald-100 text-emerald-300 light:text-emerald-800 border border-emerald-500/30 light:border-emerald-200 flex items-center gap-1">
                <Star className="w-3.5 h-3.5" /> {report.score}/{report.total} Correct
              </span>
            </div>
          </div>

          {/* Dynamic AI Coach Comment (Key Requirement) */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-brand-purple/20 via-brand-pink/20 to-brand-purple/20 light:bg-purple-50 border border-brand-pink/40 light:border-purple-200 shadow-md space-y-2">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-brand-pink light:text-purple-700">
              <Sparkles className="w-4 h-4" />
              <span>AI Coach Commentary & Evaluation:</span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-100 light:text-slate-800 leading-relaxed italic">
              "{report.aiComment}"
            </p>
          </div>

          {/* Strengths & Weaknesses Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Strengths */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 light:bg-emerald-50 border border-emerald-500/20 light:border-emerald-200 space-y-2">
              <span className="font-bold text-emerald-300 light:text-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Strengths Identified
              </span>
              <div className="space-y-1 text-[11px] text-slate-300 light:text-slate-700">
                {report.strengths.map((s, i) => (
                  <p key={i}>• {s}</p>
                ))}
              </div>
            </div>

            {/* Action Items */}
            <div className="p-4 rounded-2xl bg-amber-500/10 light:bg-amber-50 border border-amber-500/20 light:border-amber-200 space-y-2">
              <span className="font-bold text-amber-300 light:text-amber-800 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Recommended Next Steps
              </span>
              <div className="space-y-1 text-[11px] text-slate-300 light:text-slate-700">
                {report.weaknesses.map((w, i) => (
                  <p key={i}>• {w}</p>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-white/10 light:border-slate-200 mt-6 relative z-10">
          <button
            onClick={handlePrintCertificate}
            className="px-4 py-2.5 rounded-xl bg-white/5 light:bg-slate-100 hover:bg-white/10 light:hover:bg-slate-200 text-xs font-semibold text-slate-200 light:text-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-emerald-400 light:text-emerald-600" />
            <span>Print Certificate</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onRetake}
              className="px-4 py-2.5 rounded-xl bg-white/5 light:bg-slate-100 hover:bg-white/10 light:hover:bg-slate-200 text-xs font-semibold text-slate-200 light:text-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retake</span>
            </button>
            <button
              onClick={() => {
                onClose();
                setCurrentTab('notes');
              }}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-purple to-brand-pink hover:opacity-95 shadow-md shadow-brand-purple/25 flex items-center gap-1.5 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Review Notes</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
