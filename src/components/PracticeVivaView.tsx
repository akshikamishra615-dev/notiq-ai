import React, { useState } from 'react';
import { 
  GraduationCap, 
  Sparkles, 
  Brain
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { evaluateStudentVivaAnswer } from '../services/chatService';
import type { VivaQuestion } from '../types';

export const PracticeVivaView: React.FC = () => {
  const { notes, loadSampleDocument, settings, setCurrentTab } = useApp();
  const { addXP } = useAuth();

  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'viva'>('medium');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<{ score: number; feedback: string; isCorrect: boolean } | null>(null);

  // Generate viva questions from notes
  const questions: VivaQuestion[] = notes.slice(0, 10).map((note, idx) => ({
    id: `viva-${idx}`,
    question: difficulty === 'viva' 
      ? `[Oral Exam] Explain the principle of "${note.title}" as if speaking to a board examiner.`
      : `What is the core significance of "${note.title}" and how does it function?`,
    idealAnswer: `${note.summary} Key points: ${note.bullets.join('. ')}`,
    topic: note.topic,
    difficulty,
  }));

  const currentQ = questions[currentIndex];

  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim() || !currentQ || isEvaluating) return;

    setIsEvaluating(true);
    try {
      const res = await evaluateStudentVivaAnswer(userAnswer, currentQ.idealAnswer || currentQ.question, settings.language);
      setEvaluationResult(res);

      if (res.isCorrect) {
        addXP(25);
      }
    } catch (e) {
      console.warn('Evaluation error:', e);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleNextQuestion = () => {
    setUserAnswer('');
    setEvaluationResult(null);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  if (notes.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-brand-pink/10 border border-brand-pink/30 mx-auto flex items-center justify-center">
          <GraduationCap className="w-8 h-8 text-brand-pink" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-white light:text-slate-900">Practice With AI — Viva & Cross Questioning</h3>
          <p className="text-xs sm:text-sm text-slate-400 light:text-slate-600 max-w-md mx-auto">
            Upload a document or load an interactive demo to start AI-led viva cross-questioning.
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

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 sm:py-8 space-y-6">
      
      {/* V42.0 4 Compact Practice Mode Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { id: 'viva', label: '🎤 Viva Practice', desc: 'Oral cross-questioning' },
          { id: 'mcq', label: '❓ MCQ Quiz', desc: 'Interactive questions' },
          { id: 'flashcards', label: '📝 Flashcards', desc: 'Active memory recall' },
          { id: 'recall', label: '💡 Memory Recall', desc: 'Key facts test' },
        ].map((mode) => {
          const isSelected = mode.id === 'viva' || (mode.id === 'recall' && difficulty === 'hard');
          return (
            <button
              key={mode.id}
              onClick={() => {
                if (mode.id === 'mcq') {
                  setCurrentTab('quiz');
                } else if (mode.id === 'flashcards') {
                  setCurrentTab('flashcards');
                } else if (mode.id === 'recall') {
                  setDifficulty('hard');
                  setUserAnswer('');
                  setEvaluationResult(null);
                } else {
                  setDifficulty('viva');
                  setUserAnswer('');
                  setEvaluationResult(null);
                }
              }}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer h-[72px] flex flex-col justify-between ${
                isSelected
                  ? 'bg-gradient-to-br from-brand-purple/40 to-brand-pink/30 border-brand-pink text-white shadow-md'
                  : 'bg-white/5 light:bg-slate-100 border-white/10 light:border-slate-200 text-slate-300 light:text-slate-700 hover:bg-white/10 light:hover:bg-slate-200'
              }`}
            >
              <p className="text-xs font-extrabold truncate">{mode.label}</p>
              <p className="text-[10px] text-slate-400 light:text-slate-600 truncate">{mode.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Question Card */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 light:border-slate-200 space-y-6 shadow-2xl">
        <div className="space-y-2">
          <span className="text-xs font-mono font-bold text-brand-pink uppercase tracking-wider">
            TEACHER'S QUESTION #{currentIndex + 1}
          </span>
          <h3 className="text-lg sm:text-xl font-bold text-white light:text-slate-900 leading-snug">
            {currentQ?.question}
          </h3>
        </div>

        {/* Student Answer Text Area */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300 light:text-slate-700">
            Your Answer (Explain in your own words):
          </label>
          <textarea
            rows={4}
            value={userAnswer}
            disabled={!!evaluationResult || isEvaluating}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Type your explanation here... (e.g. This principle describes how qubits maintain superposition...)"
            className="w-full p-4 rounded-2xl bg-white/5 light:bg-white border border-white/15 light:border-slate-200 text-xs sm:text-sm text-white light:text-slate-900 placeholder-slate-500 light:placeholder-slate-400 focus:outline-none focus:border-brand-pink transition-colors"
          />
        </div>

        {/* Submit Action */}
        {!evaluationResult && (
          <div className="flex justify-end">
            <button
              onClick={handleSubmitAnswer}
              disabled={!userAnswer.trim() || isEvaluating}
              className={`px-6 py-3 rounded-2xl text-xs font-bold text-white flex items-center gap-2 shadow-md transition-all cursor-pointer ${
                !userAnswer.trim() || isEvaluating
                  ? 'bg-slate-800 opacity-50 cursor-not-allowed'
                  : 'bg-gradient-to-r from-brand-purple to-brand-pink hover:opacity-95'
              }`}
            >
              <Brain className="w-4 h-4" />
              <span>{isEvaluating ? 'AI Teacher Evaluating...' : 'Submit Answer for Evaluation'}</span>
            </button>
          </div>
        )}

        {/* AI Teacher Evaluation Result */}
        {evaluationResult && (
          <div className="p-5 rounded-2xl bg-brand-purple/20 light:bg-purple-50 border border-brand-purple/40 light:border-purple-200 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-white/10 light:border-purple-200 pb-2">
              <span className="text-xs font-bold text-brand-pink flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>AI Teacher Evaluation & Score</span>
              </span>
              <span className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                evaluationResult.isCorrect ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                Score: {evaluationResult.score}%
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-100 light:text-slate-900 leading-relaxed font-medium">
              {evaluationResult.feedback}
            </p>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400 light:text-slate-600">
                +{evaluationResult.isCorrect ? 25 : 5} XP Earned
              </span>
              <button
                onClick={handleNextQuestion}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-purple to-brand-pink shadow-md hover:opacity-95 cursor-pointer"
              >
                Next Question
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
