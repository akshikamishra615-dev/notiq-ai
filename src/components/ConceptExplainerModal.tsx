import React, { useState, useEffect } from 'react';
import { 
  X, 
  Volume2, 
  Check, 
  Copy,
  Bot
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ttsService } from '../services/ttsService';

interface ConceptExplainerModalProps {
  title: string;
  summary: string;
  bullets: string[];
  topic?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ConceptExplainerModal: React.FC<ConceptExplainerModalProps> = ({
  title,
  summary,
  bullets,
  topic = 'Core Concept',
  isOpen,
  onClose,
}) => {
  const { settings, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<'simple' | 'detailed' | 'hindi' | 'hinglish' | 'english' | 'example'>('simple');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopy = () => {
    const textToCopy = `${title}\n\nSummary:\n${summary}\n\nKey points:\n${bullets.map(b => '• ' + b).join('\n')}`;
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    showToast('Explanation copied to clipboard!', 'info');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleVoice = () => {
    ttsService.speak(`${title}. ${summary}. ${bullets.join('. ')}`, 'explainer-modal', settings.language);
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-[#141028] light:bg-white border border-white/15 light:border-slate-300 rounded-3xl p-5 sm:p-8 shadow-2xl shadow-brand-purple/30 text-slate-100 light:text-slate-900 relative overflow-hidden my-auto max-h-[92vh] flex flex-col justify-between"
      >
        
        {/* Glow Background */}
        <div className="absolute -top-24 -right-24 w-56 h-56 bg-brand-pink/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header Bar */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/10 light:border-slate-200 mb-4 shrink-0 gap-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-brand-purple to-brand-pink text-white shadow-md shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-pink block truncate">
                ChatGPT Explainer Card
              </span>
              <h3 className="text-base sm:text-lg font-extrabold text-white light:text-slate-900 break-words leading-snug">
                {title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-xl bg-white/5 light:bg-slate-100 hover:bg-white/10 light:hover:bg-slate-200 text-slate-400 light:text-slate-500 hover:text-white light:hover:text-slate-900 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Explanation Style Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 mb-4 overflow-x-auto scrollbar-none shrink-0">
          {[
            { id: 'simple', label: '💡 Simple Explanation' },
            { id: 'detailed', label: '📖 Detailed Explanation' },
            { id: 'hindi', label: '🇮🇳 Hindi (हिंदी)' },
            { id: 'hinglish', label: '🗣️ Hinglish' },
            { id: 'english', label: '🇬🇧 English' },
            { id: 'example', label: '🌟 Real-Life Example' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-brand-purple to-brand-pink text-white shadow-sm font-bold'
                  : 'text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dynamic Chat-Style Card Display */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0e0b1c] light:bg-slate-50 border border-white/10 light:border-slate-200 text-xs sm:text-sm text-slate-200 light:text-slate-800 leading-relaxed font-sans space-y-3 min-h-[160px] shadow-inner overflow-y-auto max-h-[50vh]">
          {activeTab === 'simple' && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-emerald-400 light:text-emerald-600">💡 Simple Teacher Explanation:</span>
              <p className="text-sm font-medium break-words">{summary}</p>
              <p className="text-slate-400 light:text-slate-600 text-xs mt-1 break-words">
                <strong>Why it matters:</strong> Understanding this concept gives you the foundation to answer both definition and reasoning questions in exams.
              </p>
            </div>
          )}

          {activeTab === 'detailed' && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-amber-400 light:text-amber-600 break-words">📖 Comprehensive Detailed Breakdown ({topic}):</span>
              <p className="break-words">{summary}</p>
              <ul className="list-disc pl-4 space-y-1 text-slate-300 light:text-slate-700">
                {bullets.map((b, i) => (
                  <li key={i} className="break-words">{b}</li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === 'hindi' && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-brand-pink">🇮🇳 सरल हिंदी व्याख्या:</span>
              <p className="text-sm leading-relaxed break-words">
                इस अवधारणा ({title}) का मुख्य अर्थ यह है कि: {summary}
              </p>
              <p className="text-slate-300 light:text-slate-700 text-xs break-words">
                मुख्य बिंदु: {bullets.join('। ')}
              </p>
            </div>
          )}

          {activeTab === 'hinglish' && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-purple-400 light:text-purple-600">🗣️ Easy Hinglish Version:</span>
              <p className="text-sm break-words">
                Is concept ({title}) ka simple matlab ye hai: {summary}
              </p>
              <p className="text-slate-300 light:text-slate-700 text-xs break-words">
                Exam ke liye main takeaways: {bullets.join(' • ')}
              </p>
            </div>
          )}

          {activeTab === 'english' && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-sky-400 light:text-sky-600">🇬🇧 Formal Academic English Summary:</span>
              <p className="break-words">{summary}</p>
              <p className="text-slate-300 light:text-slate-700 break-words">{bullets.join(' ')}</p>
            </div>
          )}

          {activeTab === 'example' && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-rose-400 light:text-rose-600">🌟 Real-Life Practical Analogy:</span>
              <p className="italic text-slate-200 light:text-slate-700 break-words">
                "Imagine you are working on a daily system: {bullets[0] || summary} Just like a physical process, {title} operates seamlessly."
              </p>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between pt-4 border-t border-white/10 light:border-slate-200 mt-4 gap-2 shrink-0">
          <button
            onClick={handleVoice}
            className="px-3.5 py-2 rounded-xl bg-white/5 light:bg-slate-100 hover:bg-white/10 light:hover:bg-slate-200 text-xs font-semibold text-brand-pink flex items-center gap-1.5 cursor-pointer"
          >
            <Volume2 className="w-4 h-4" />
            <span>Read Aloud</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3.5 py-2 rounded-xl bg-white/5 light:bg-slate-100 hover:bg-white/10 light:hover:bg-slate-200 text-xs font-semibold text-slate-300 light:text-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{isCopied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-purple to-brand-pink shadow-md cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
