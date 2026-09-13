import React from 'react';
import { Sparkles, FileText, Cpu, CheckCircle, Wand2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ProgressBarModal: React.FC = () => {
  const { isProcessing, processingProgress, processingStatus } = useApp();

  if (!isProcessing) return null;

  const steps = [
    { label: 'Reading & Parsing Document', icon: <FileText className="w-4 h-4" />, threshold: 25 },
    { label: 'OCR & AI Content Extraction', icon: <Cpu className="w-4 h-4" />, threshold: 50 },
    { label: 'Structuring Smart Sticky Notes', icon: <Wand2 className="w-4 h-4" />, threshold: 75 },
    { label: 'Generating Flashcards & Quiz', icon: <Sparkles className="w-4 h-4" />, threshold: 95 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#141028] light:bg-white border border-white/15 light:border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 light:text-slate-900 relative overflow-hidden">
        
        {/* Glow effects */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-brand-pink/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-brand-purple/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center relative z-10 space-y-2 mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-brand-purple to-brand-pink text-white shadow-lg shadow-brand-purple/30 animate-pulse">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold tracking-tight text-white light:text-slate-900">
            Sticky AI is Thinking...
          </h3>
          <p className="text-xs text-slate-400 light:text-slate-600">
            {processingStatus || 'Analyzing document and generating concise sticky notes'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="relative z-10 space-y-2 mb-6">
          <div className="flex justify-between text-xs font-semibold text-slate-300 light:text-slate-700">
            <span>Processing</span>
            <span className="text-brand-pink">{processingProgress}%</span>
          </div>
          <div className="w-full h-3 bg-white/10 light:bg-slate-200 rounded-full overflow-hidden p-[2px]">
            <div
              className="h-full bg-gradient-to-r from-brand-purple via-brand-pink to-brand-purple rounded-full transition-all duration-300 relative overflow-hidden"
              style={{ width: `${Math.max(5, processingProgress)}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            </div>
          </div>
        </div>

        {/* Step Indicators */}
        <div className="relative z-10 space-y-3 pt-2">
          {steps.map((step, idx) => {
            const isDone = processingProgress >= step.threshold;
            const isCurrent = processingProgress >= (step.threshold - 25) && !isDone;

            return (
              <div 
                key={idx} 
                className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-300 ${
                  isDone 
                    ? 'bg-brand-purple/15 light:bg-purple-50 border-brand-purple/30 light:border-purple-200 text-slate-200 light:text-slate-800' 
                    : isCurrent 
                    ? 'bg-brand-pink/15 light:bg-pink-50 border-brand-pink/40 light:border-pink-200 text-brand-pink' 
                    : 'bg-white/5 light:bg-slate-100 border-transparent text-slate-500 light:text-slate-400'
                }`}
              >
                <div className={`p-1.5 rounded-lg ${
                  isDone 
                    ? 'bg-emerald-500/20 text-emerald-400' 
                    : isCurrent 
                    ? 'bg-brand-pink/20 text-brand-pink animate-spin' 
                    : 'bg-white/5 light:bg-slate-200 text-slate-500 light:text-slate-400'
                }`}>
                  {isDone ? <CheckCircle className="w-4 h-4" /> : step.icon}
                </div>
                <span className={`text-xs font-medium ${isDone ? 'text-slate-200 light:text-slate-800' : isCurrent ? 'text-white light:text-slate-900 font-semibold' : 'text-slate-500 light:text-slate-400'}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <p className="relative z-10 text-[11px] text-center text-slate-400 light:text-slate-600 mt-6">
          ⚡ 100% In-Browser Privacy • Powered by Sticky AI Smart Engine
        </p>
      </div>
    </div>
  );
};
