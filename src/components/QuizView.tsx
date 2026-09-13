import React, { useState } from 'react';
import { 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  RotateCcw, 
  Award, 
  Sparkles, 
  Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { generateAIQuizReport } from '../services/aiCommentService';
import { ResultCardModal } from './ResultCardModal';
import type { QuizResultReport } from '../types';

export const QuizView: React.FC = () => {
  const { quiz, currentSession, loadSampleDocument, settings } = useApp();
  const { recordQuizResult } = useAuth();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [activeReport, setActiveReport] = useState<QuizResultReport | null>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  const currentQ = quiz[currentIndex];

  const handleSelectOption = (idx: number) => {
    if (selectedOption !== null) return;

    setSelectedOption(idx);
    const isCorrect = idx === currentQ.correctIndex;
    if (isCorrect) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < quiz.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
    } else {
      const finalScore = selectedOption === currentQ.correctIndex ? score : score;
      const docTitle = currentSession?.fileName || 'Active Quiz';
      const report = generateAIQuizReport(finalScore, quiz.length, docTitle, settings.language);
      
      setActiveReport(report);
      recordQuizResult(report);
      setIsFinished(true);
      setIsResultModalOpen(true);

      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#6C3BFF', '#FF6FB5', '#FEF08A', '#38BDF8'],
        });
      } catch (e) {
        console.warn('Confetti error:', e);
      }
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setScore(0);
    setIsFinished(false);
    setActiveReport(null);
    setIsResultModalOpen(false);
  };

  if (quiz.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-brand-purple/10 border border-brand-purple/30 mx-auto flex items-center justify-center">
          <HelpCircle className="w-8 h-8 text-brand-purple" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-white light:text-slate-900">No Quiz Generated Yet</h3>
          <p className="text-xs sm:text-sm text-slate-400 light:text-slate-600 max-w-md mx-auto">
            Upload a document or try our interactive demo to test your knowledge with auto-generated MCQs.
          </p>
        </div>
        <button
          onClick={() => loadSampleDocument('sample-quantum')}
          className="px-6 py-3 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-brand-purple to-brand-pink shadow-lg shadow-brand-purple/25 cursor-pointer"
        >
          Load Interactive Demo
        </button>
      </div>
    );
  }

  // Completion Screen View
  if (isFinished && activeReport) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center space-y-6">
        <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-white/15 light:border-slate-200 shadow-2xl space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-brand-purple to-brand-pink mx-auto flex items-center justify-center text-white shadow-xl shadow-brand-pink/30 animate-bounce">
            <Award className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="text-xs uppercase font-extrabold tracking-widest text-brand-pink light:text-purple-700">
              Assessment Completed
            </span>
            <h2 className="text-3xl font-extrabold text-white light:text-slate-900">
              {activeReport.percentage}% Score
            </h2>
            <p className="text-sm text-slate-400 light:text-slate-600">
              You scored <span className="text-white light:text-slate-900 font-bold text-lg">{score}</span> out of <span className="text-white light:text-slate-900 font-bold text-lg">{quiz.length}</span>
            </p>
          </div>

          {/* AI Feedback Comment */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-purple/20 to-brand-pink/20 light:bg-purple-50 border border-brand-pink/40 light:border-purple-200 text-xs text-slate-200 light:text-slate-800 italic leading-relaxed">
            "{activeReport.aiComment}"
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setIsResultModalOpen(true)}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-brand-purple to-brand-pink shadow-md hover:opacity-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>View Full AI Certificate</span>
            </button>
            <button
              onClick={handleRestart}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl text-xs font-bold text-slate-200 light:text-slate-800 bg-white/5 light:bg-slate-100 border border-white/15 light:border-slate-200 hover:bg-white/10 light:hover:bg-slate-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retake Quiz</span>
            </button>
          </div>
        </div>

        <ResultCardModal
          report={activeReport}
          isOpen={isResultModalOpen}
          onClose={() => setIsResultModalOpen(false)}
          onRetake={handleRestart}
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 sm:py-8 space-y-6">
      
      {/* V42.0 4 Compact Quiz Categories */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { id: 'mcq', label: '❓ MCQ', desc: '4-option questions' },
          { id: 'tf', label: '⚡ True / False', desc: 'Concept accuracy' },
          { id: 'fill', label: '✍️ Fill Blanks', desc: 'Key term test' },
          { id: 'oneword', label: '💡 One Word', desc: 'Direct answers' },
        ].map((cat, idx) => (
          <div
            key={cat.id}
            className={`p-3 rounded-2xl border text-left transition-all h-[68px] flex flex-col justify-between ${
              idx === 0
                ? 'bg-gradient-to-br from-brand-purple/40 to-brand-pink/30 border-brand-pink text-white shadow-md'
                : 'bg-white/5 light:bg-slate-100 border-white/10 light:border-slate-200 text-slate-300 light:text-slate-700'
            }`}
          >
            <p className="text-xs font-extrabold truncate">{cat.label}</p>
            <p className="text-[10px] text-slate-400 light:text-slate-500 truncate">{cat.desc}</p>
          </div>
        ))}
      </div>

      {/* Quiz Header & Progress */}
      <div className="glass-panel p-5 rounded-3xl border border-white/10 light:border-slate-200 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-purple/20 light:bg-purple-100 text-brand-pink light:text-purple-700">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white light:text-slate-900">
                Knowledge Check Quiz
              </h1>
              <p className="text-xs text-slate-400 light:text-slate-600">
                Question {currentIndex + 1} of {quiz.length} • Topic: <span className="text-brand-pink light:text-purple-700 font-semibold">{currentQ.topic}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-xl bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 text-slate-200 light:text-slate-800">
            <Zap className="w-3.5 h-3.5 text-brand-pink light:text-purple-600" />
            <span>Score: {score}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-white/10 light:bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-purple to-brand-pink rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / quiz.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 light:border-slate-200 space-y-6 shadow-2xl">
        <div className="space-y-2">
          <span className="text-xs font-mono font-bold text-brand-pink light:text-purple-700 uppercase tracking-wider">
            QUESTION #{currentIndex + 1}
          </span>
          <h3 className="text-lg sm:text-xl font-bold text-white light:text-slate-900 leading-snug">
            {currentQ.question}
          </h3>
        </div>

        {/* 4 Options */}
        <div className="space-y-3">
          {currentQ.options.map((option, idx) => {
            const isSelected = selectedOption === idx;
            const isCorrect = idx === currentQ.correctIndex;
            const hasAnswered = selectedOption !== null;

            let optionStyle = 'bg-white/5 light:bg-white border-white/10 light:border-slate-200 text-slate-200 light:text-slate-800 hover:border-brand-pink/50 hover:bg-white/[0.08] light:hover:bg-slate-50';

            if (hasAnswered) {
              if (isCorrect) {
                optionStyle = 'bg-emerald-500/20 light:bg-emerald-50 border-emerald-500 light:border-emerald-300 text-emerald-200 light:text-emerald-900 font-semibold shadow-md shadow-emerald-950/30';
              } else if (isSelected && !isCorrect) {
                optionStyle = 'bg-rose-500/20 light:bg-rose-50 border-rose-500 light:border-rose-300 text-rose-200 light:text-rose-900 font-semibold';
              } else {
                optionStyle = 'bg-white/5 light:bg-slate-50 border-white/5 light:border-slate-100 text-slate-500 opacity-60';
              }
            }

            return (
              <button
                key={idx}
                type="button"
                disabled={hasAnswered}
                onClick={() => handleSelectOption(idx)}
                className={`w-full p-4 rounded-2xl border text-left text-xs sm:text-sm font-medium transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer ${optionStyle}`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-white/10 light:bg-slate-200 flex items-center justify-center font-bold text-xs shrink-0">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span>{option}</span>
                </div>

                {hasAnswered && isCorrect && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 light:text-emerald-600 shrink-0" />
                )}
                {hasAnswered && isSelected && !isCorrect && (
                  <XCircle className="w-5 h-5 text-rose-400 light:text-rose-600 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Explanation Card (Revealed on selection) */}
        {selectedOption !== null && (
          <div className="p-4 rounded-2xl bg-brand-purple/15 light:bg-purple-50 border border-brand-purple/30 light:border-purple-200 text-slate-200 light:text-slate-800 text-xs space-y-1 animate-in fade-in">
            <p className="font-bold text-brand-pink light:text-purple-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Explanation & Fact Check:</span>
            </p>
            <p className="text-slate-300 light:text-slate-700 leading-relaxed">
              {currentQ.explanation}
            </p>
          </div>
        )}

        {/* Next Question Action */}
        {selectedOption !== null && (
          <div className="pt-2 flex justify-end">
            <button
              onClick={handleNext}
              className="px-6 py-3 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-brand-purple to-brand-pink hover:opacity-95 shadow-md shadow-brand-purple/30 flex items-center gap-2 animate-in fade-in cursor-pointer"
            >
              <span>{currentIndex < quiz.length - 1 ? 'Next Question' : 'Generate AI Report Card'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

    </div>
  );
};
