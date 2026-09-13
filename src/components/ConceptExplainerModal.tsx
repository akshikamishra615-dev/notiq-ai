import React, { useState } from 'react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#141028] light:bg-white border border-white/15 light:border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-brand-purple/30 text-slate-100 light:text-slate-900 relative overflow-hidden max-h-[92vh] overflow-y-auto">
        
        {/* Glow Background */}
        <div className="absolute -top-24 -right-24 w-56 h-56 bg-brand-pink/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 light:border-slate-200 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-brand-purple to-brand-pink text-white shadow-md">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-pink">
                ChatGPT Explainer Card
              </span>
              <h3 className="text-lg font-extrabold text-white light:text-slate-900 truncate max-w-md">
                {title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 light:bg-slate-100 hover:bg-white/10 light:hover:bg-slate-200 text-slate-400 light:text-slate-500 hover:text-white light:hover:text-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Explanation Style Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 mb-5 overflow-x-auto scrollbar-none">
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
        <div className="p-5 rounded-2xl bg-[#0e0b1c] light:bg-slate-50 border border-white/10 light:border-slate-200 text-xs sm:text-sm text-slate-200 light:text-slate-800 leading-relaxed font-sans space-y-3 min-h-[180px] shadow-inner">
          {activeTab === 'simple' && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-emerald-400 light:text-emerald-600">💡 Simple Teacher Explanation:</span>
              <p className="text-sm font-medium">{summary}</p>
              <p className="text-slate-400 light:text-slate-600 text-xs mt-1">
                <strong>Why it matters:</strong> Understanding this concept gives you the foundation to answer both definition and reasoning questions in exams.
              </p>
            </div>
          )}

          {activeTab === 'detailed' && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-amber-400 light:text-amber-600">📖 Comprehensive Detailed Breakdown ({topic}):</span>
              <p>{summary}</p>
              <ul className="list-disc pl-4 space-y-1 text-slate-300 light:text-slate-700">
                {bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === 'hindi' && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-brand-pink">🇮🇳 सरल हिंदी व्याख्या:</span>
              <p className="text-sm leading-relaxed">
                इस अवधारणा ({title}) का मुख्य अर्थ यह है कि: {summary}
              </p>
              <p className="text-slate-300 light:text-slate-700 text-xs">
                मुख्य बिंदु: {bullets.join('। ')}
              </p>
            </div>
          )}

          {activeTab === 'hinglish' && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-purple-400 light:text-purple-600">🗣️ Easy Hinglish Version:</span>
              <p className="text-sm">
                Is concept ({title}) ka simple matlab ye hai: {summary}
              </p>
              <p className="text-slate-300 light:text-slate-700 text-xs">
                Exam ke liye main takeaways: {bullets.join(' • ')}
              </p>
            </div>
          )}

          {activeTab === 'english' && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-sky-400 light:text-sky-600">🇬🇧 Formal Academic English Summary:</span>
              <p>{summary}</p>
              <p className="text-slate-300 light:text-slate-700">{bullets.join(' ')}</p>
            </div>
          )}

          {activeTab === 'example' && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-rose-400 light:text-rose-600">🌟 Real-Life Practical Analogy:</span>
              <p className="italic text-slate-200 light:text-slate-700">
                "Imagine you are working on a daily system: {bullets[0] || summary} Just like a physical process, {title} operates seamlessly."
              </p>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10 light:border-slate-200 mt-5">
          <button
            onClick={handleVoice}
            className="px-4 py-2 rounded-xl bg-white/5 light:bg-slate-100 hover:bg-white/10 light:hover:bg-slate-200 text-xs font-semibold text-brand-pink flex items-center gap-1.5 cursor-pointer"
          >
            <Volume2 className="w-4 h-4" />
            <span>Read Aloud</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-4 py-2 rounded-xl bg-white/5 light:bg-slate-100 hover:bg-white/10 light:hover:bg-slate-200 text-xs font-semibold text-slate-300 light:text-slate-700 flex items-center gap-1.5 cursor-pointer"
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
