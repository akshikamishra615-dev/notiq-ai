import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Pin, 
  Volume2, 
  VolumeX, 
  Copy, 
  Download,
  FileText,
  Image as ImageIcon,
  Edit3, 
  Trash2, 
  Palette, 
  Check, 
  ChevronRight,
  ChevronLeft,
  Sparkles,
  X,
  BrainCircuit,
  BookOpen
} from 'lucide-react';
import type { StickyNote, StickyColor } from '../types';
import { useApp } from '../context/AppContext';
import { ttsService } from '../services/ttsService';
import { convertUnicodeToKrutiDev, toEnglishDigits } from '../services/ocrService';
import { 
  exportSingleStickyNoteAsPDF, 
  exportSingleStickyNoteAsImage 
} from '../utils/exportUtils';

interface StickyNoteCardProps {
  note: StickyNote;
  isCanvasMode?: boolean;
  onEdit?: (note: StickyNote) => void;
}

const COLOR_MAP: Record<StickyColor, { bg: string; border: string; accent: string; text: string }> = {
  purple: {
    bg: 'bg-white light:bg-white',
    border: 'border-purple-200',
    accent: 'bg-purple-600',
    text: 'text-purple-950',
  },
  pink: {
    bg: 'bg-white light:bg-white',
    border: 'border-pink-200',
    accent: 'bg-pink-600',
    text: 'text-pink-950',
  },
  yellow: {
    bg: 'bg-white light:bg-white',
    border: 'border-amber-200',
    accent: 'bg-amber-600',
    text: 'text-amber-950',
  },
  blue: {
    bg: 'bg-white light:bg-white',
    border: 'border-sky-200',
    accent: 'bg-sky-600',
    text: 'text-sky-950',
  },
  green: {
    bg: 'bg-white light:bg-white',
    border: 'border-emerald-200',
    accent: 'bg-emerald-600',
    text: 'text-emerald-950',
  },
  orange: {
    bg: 'bg-white light:bg-white',
    border: 'border-orange-200',
    accent: 'bg-orange-600',
    text: 'text-orange-950',
  },
};

/**
 * Clean bullet markers like bullet points, numbers, or dashes, and artificial section headers
 */
function cleanBulletMarker(text: string): string {
  if (!text) return '';
  return text
    .replace(/^([\s•\-\*\d\.\:\)\>\·\▪\■\□\◆\◇\✓\✔\★\☆\✦\✧]|•\s*)+/g, '')
    .replace(/^(?:[-•*0-9\.\s])+/g, '')
    .replace(/\b(Term Detail|Topic Explanation|Key Points|Main Keywords|मुख्य शब्द|परिभाषा|टर्म डिटेल)\b[\:\-]*/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export const StickyNoteCard: React.FC<StickyNoteCardProps> = ({
  note,
  isCanvasMode = false,
  onEdit,
}) => {
  const { 
    togglePin, 
    deleteNote, 
    changeNoteColor, 
    showToast,
    setCurrentTab,
    settings 
  } = useApp();

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isExplainerOpen, setIsExplainerOpen] = useState(false);
  const [isDownloadDropdownOpen, setIsDownloadDropdownOpen] = useState(false);
  const downloadDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (downloadDropdownRef.current && !downloadDropdownRef.current.contains(event.target as Node)) {
        setIsDownloadDropdownOpen(false);
      }
    };
    if (isDownloadDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDownloadDropdownOpen]);

  const isKrutiDev = settings.hindiFontMode === 'krutidev';
  const style = COLOR_MAP[note.color || 'purple'];

  const handleVoiceToggle = () => {
    if (isSpeaking) {
      ttsService.stop();
      setIsSpeaking(false);
    } else {
      const speechText = `${note.title}. ${note.bullets.slice(0, 5).join('. ')}`;
      setIsSpeaking(true);
      ttsService.speak(speechText, note.id, settings.language || 'auto');
    }
  };

  const handleCopy = () => {
    const selection = window.getSelection()?.toString().trim();
    if (selection && selection.length > 0) {
      navigator.clipboard.writeText(selection).then(() => {
        setCopied(true);
        showToast('Selected text copied to clipboard!', 'success');
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {
        showToast('Failed to copy selected text.', 'error');
      });
    } else {
      let titleText = cleanBulletMarker(note.title);
      let bulletsText = note.bullets.slice(0, 5).map(b => '• ' + cleanBulletMarker(b)).join('\n');

      if (isKrutiDev) {
        titleText = convertUnicodeToKrutiDev(titleText);
        bulletsText = convertUnicodeToKrutiDev(bulletsText);
      }

      const fullText = `# ${titleText}\n\n${bulletsText}`;
      navigator.clipboard.writeText(fullText).then(() => {
        setCopied(true);
        showToast(isKrutiDev ? 'Kruti Dev Note copied!' : 'Note copied to clipboard!', 'success');
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {
        showToast('Failed to copy note.', 'error');
      });
    }
  };

  const handleDownloadPDF = async () => {
    setIsDownloadDropdownOpen(false);
    showToast('Generating sticky card PDF...', 'info');
    await exportSingleStickyNoteAsPDF(note);
    showToast('Downloaded sticky card PDF!', 'success');
  };

  const handleDownloadImage = async () => {
    setIsDownloadDropdownOpen(false);
    showToast('Generating sticky card image...', 'info');
    await exportSingleStickyNoteAsImage(note);
    showToast('Downloaded sticky card image!', 'success');
  };

  const cleanTitleWithoutPrefix = cleanBulletMarker(note.title)
    .replace(/^[#+\s]+/, '')
    .trim();
  const displayTitle = isKrutiDev ? convertUnicodeToKrutiDev(cleanTitleWithoutPrefix) : cleanTitleWithoutPrefix;

  const rawIntro = cleanBulletMarker(note.summary);
  const pageLabel = toEnglishDigits(note.chapter || '1');

  const allBullets = note.bullets && note.bullets.length > 0 
    ? note.bullets.map(b => cleanBulletMarker(b)).filter(Boolean) 
    : [rawIntro];

  // Up to 5 Important Revision Points in Preview
  const mainBullets = allBullets.slice(0, 5);

  const isEnglishContent = !/[\u0900-\u097F]/.test((note.title || '') + ' ' + (note.summary || ''));
  const topicBadge = isEnglishContent ? `Topic ${pageLabel}` : `टॉपिक ${pageLabel}`;

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1, rotate: note.pinned ? 0 : (note.rotation || 0) }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className={`relative group rounded-[20px] p-3.5 shadow-md hover:shadow-xl transition-all border ${style.bg} ${style.border} text-[#111111] flex flex-col justify-between select-text h-[255px] max-h-[260px] overflow-hidden ${
          isCanvasMode ? 'cursor-move' : ''
        }`}
      >
        {/* 1. Header: Topic Badge + Title + Pin & Audio */}
        <div className="flex items-start justify-between gap-1.5 pb-1.5 border-b border-black/10">
          <div className="space-y-0.5 flex-1 pr-1 overflow-hidden">
            <div className="text-[10px] font-black tracking-wide text-brand-purple uppercase flex items-center gap-1">
              <span>📌</span>
              <span>{topicBadge}</span>
            </div>
            <h2 
              className={`${isEnglishContent ? 'font-poppins font-bold text-xs' : 'devanagari-title text-xs'} text-[#6C3BFF] line-clamp-1 truncate ${
                isKrutiDev ? 'font-mono' : ''
              }`}
              title={displayTitle}
            >
              {displayTitle}
            </h2>
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            {/* TTS Voice Readout */}
            <button
              onClick={handleVoiceToggle}
              title={isSpeaking ? 'Stop Reading' : 'Read Note Aloud'}
              className={`p-1 rounded-lg transition-all cursor-pointer ${
                isSpeaking ? 'bg-rose-500 text-white animate-pulse' : 'text-[#111111]/70 hover:text-[#111111] hover:bg-black/5'
              }`}
            >
              {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            {/* Push Pin */}
            <button
              onClick={() => togglePin(note.id)}
              title={note.pinned ? 'Unpin Note' : 'Pin Note'}
              className={`p-1 rounded-lg transition-transform cursor-pointer ${
                note.pinned ? 'text-rose-600 scale-110' : 'text-[#111111]/70 hover:text-[#111111] hover:bg-black/5'
              }`}
            >
              <Pin className={`w-3.5 h-3.5 ${note.pinned ? 'fill-rose-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* 2. Body: Exactly 5 Important Revision Points (No Paragraphs / No Story Blocks in Preview) */}
        <div className="flex-1 py-1 overflow-hidden">
          <ul className="space-y-1">
            {mainBullets.map((bullet, idx) => (
              <li 
                key={idx} 
                className={`${isEnglishContent ? 'font-poppins text-[11px] leading-tight font-medium' : 'devanagari-bullet text-[11px] leading-tight font-medium'} flex items-start gap-1.5 text-[#111111] line-clamp-1 truncate ${
                  isKrutiDev ? 'font-mono' : ''
                }`}
              >
                <span className="text-brand-purple font-black shrink-0">•</span>
                <span className="truncate">{isKrutiDev ? convertUnicodeToKrutiDev(bullet) : bullet}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 3. Bottom Action Bar: Show More + Copy / Download / Edit / Delete / Color */}
        <div className="pt-1.5 border-t border-black/10 flex items-center justify-between gap-1 text-[#111111]">
          {/* Show More Button (Opens Modal) */}
          <button
            onClick={() => setIsExplainerOpen(true)}
            className="px-2 py-1 rounded-xl bg-brand-purple/10 hover:bg-brand-purple/20 text-brand-purple font-extrabold text-[10px] flex items-center gap-0.5 transition-all cursor-pointer active:scale-95 shadow-2xs"
          >
            <Sparkles className="w-3 h-3 text-brand-pink" />
            <span>{isEnglishContent ? 'Show More' : 'और देखें'}</span>
            <ChevronRight className="w-3 h-3" />
          </button>

          {/* Quick Toolbar */}
          <div className="flex items-center gap-0.5 text-[#111111]/70">
            <button
              onClick={handleCopy}
              title="Copy Note"
              className="p-1 rounded-lg hover:bg-black/10 hover:text-[#111111] transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-800" /> : <Copy className="w-3 h-3" />}
            </button>

            {/* Individual Card Download Dropdown */}
            <div className="relative" ref={downloadDropdownRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowColorPicker(false);
                  setIsDownloadDropdownOpen(!isDownloadDropdownOpen);
                }}
                title="Download Sticky Card"
                className="p-1 rounded-lg hover:bg-black/10 hover:text-[#111111] transition-colors cursor-pointer"
              >
                <Download className="w-3 h-3" />
              </button>

              {isDownloadDropdownOpen && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 bottom-7 w-44 p-1.5 rounded-xl bg-[#141028] light:bg-white border border-white/20 light:border-slate-200 shadow-2xl z-40 space-y-1"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadPDF();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-200 light:text-slate-800 hover:bg-brand-purple/20 hover:text-white transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-brand-pink" />
                    <span>Download as PDF</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadImage();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-200 light:text-slate-800 hover:bg-brand-purple/20 hover:text-white transition-colors cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                    <span>Download as Image</span>
                  </button>
                </div>
              )}
            </div>

            {onEdit && (
              <button
                onClick={() => onEdit(note)}
                title="Edit Note"
                className="p-1 rounded-lg hover:bg-black/10 hover:text-[#111111] transition-colors cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
              </button>
            )}

            <button
              onClick={() => deleteNote(note.id)}
              title="Delete Note"
              className="p-1 rounded-lg hover:bg-black/10 hover:text-rose-700 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
            </button>

            {/* Color Palette */}
            <div className="relative">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                title="Change Color"
                className="p-1 rounded-lg hover:bg-black/10 hover:text-[#111111] transition-colors cursor-pointer"
              >
                <Palette className="w-3 h-3" />
              </button>

              {showColorPicker && (
                <div className="absolute right-0 bottom-7 p-1.5 rounded-xl bg-white shadow-xl border border-slate-200 flex gap-1 z-20">
                  {(['purple', 'pink', 'yellow', 'blue', 'green', 'orange'] as StickyColor[]).map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        changeNoteColor(note.id, c);
                        setShowColorPicker(false);
                      }}
                      className={`w-4 h-4 rounded-full border border-black/10 transition-transform cursor-pointer hover:scale-125 ${COLOR_MAP[c].accent}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* V42.0 Show More Full Detail Modal */}
      {isExplainerOpen && (
        <ShowMoreDetailModal
          note={note}
          isOpen={isExplainerOpen}
          onClose={() => setIsExplainerOpen(false)}
          onPractice={() => {
            setIsExplainerOpen(false);
            showToast(`Practice AI launched for topic: ${note.title}`, 'info');
            setCurrentTab('quiz');
          }}
        />
      )}
    </>
  );
};

/**
 * V42.0 Show More Detail Modal (Full explanation, examples, diagram, keywords, practice button)
 */
const ShowMoreDetailModal: React.FC<{
  note: StickyNote;
  isOpen: boolean;
  onClose: () => void;
  onPractice: () => void;
}> = ({ note, isOpen, onClose, onPractice }) => {
  const { showToast } = useApp();
  const [copied, setCopied] = useState(false);

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

  const isEnglishContent = !/[\u0900-\u097F]/.test((note.title || '') + ' ' + (note.summary || ''));

  const handleCopy = () => {
    const selection = window.getSelection()?.toString().trim();
    if (selection && selection.length > 0) {
      navigator.clipboard.writeText(selection).then(() => {
        setCopied(true);
        showToast('Selected text copied to clipboard!', 'success');
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {
        showToast('Failed to copy selected text.', 'error');
      });
    } else {
      const textToCopy = `# ${note.title}\n\nSummary:\n${note.summary}\n\nRevision Points:\n${note.bullets.map(b => '• ' + b).join('\n')}`;
      navigator.clipboard.writeText(textToCopy).then(() => {
        setCopied(true);
        showToast('Full explanation copied!', 'success');
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {
        showToast('Failed to copy explanation.', 'error');
      });
    }
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-[#141028] light:bg-white border border-brand-purple/40 light:border-slate-300 rounded-2xl sm:rounded-[24px] p-4 sm:p-6 shadow-2xl text-slate-100 light:text-slate-900 relative overflow-hidden my-auto max-h-[92vh] flex flex-col justify-between"
      >
        
        {/* Header Bar: Back Button + Topic Badge & Title + Close X */}
        <div className="flex items-start justify-between gap-2 pb-3 border-b border-white/10 light:border-slate-200 mb-3 shrink-0">
          <div className="flex items-start gap-2 min-w-0 flex-1">
            <button
              onClick={onClose}
              title="Go Back"
              className="mt-0.5 px-2 py-1 rounded-xl bg-white/10 light:bg-slate-100 hover:bg-white/20 light:hover:bg-slate-200 text-slate-300 light:text-slate-700 font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden xs:inline">Back</span>
            </button>

            <div className="p-2 rounded-xl bg-gradient-to-tr from-brand-purple to-brand-pink text-white shadow-md shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>

            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-pink light:text-purple-700 block truncate">
                {isEnglishContent ? `Topic ${note.chapter || '1'} Details` : `टॉपिक ${note.chapter || '1'} विस्तृत व्याख्या`}
              </span>
              <h3 className="text-sm sm:text-base font-extrabold text-white light:text-slate-900 break-words leading-tight">
                {note.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-xl bg-white/5 light:bg-slate-100 hover:bg-white/10 light:hover:bg-slate-200 text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900 transition-colors cursor-pointer shrink-0 ml-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 scrollbar-none text-xs sm:text-sm">
          
          {/* Detailed Summary / इस पेज में क्या पढ़ेंगे */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white/5 light:bg-purple-50/70 border border-white/10 light:border-purple-200 space-y-1.5">
            <span className="text-xs font-extrabold text-brand-pink light:text-purple-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              {isEnglishContent ? 'What we will study on this page' : 'इस पेज में क्या पढ़ेंगे'}
            </span>
            <p className="text-slate-200 light:text-slate-800 leading-relaxed font-sans text-justify break-words">
              {note.summary}
            </p>
          </div>

          {/* 5 Meaningful Revision Points / महत्वपूर्ण बिंदु */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-black/40 light:bg-slate-50 border border-white/10 light:border-slate-200 space-y-2">
            <span className="text-xs font-extrabold text-purple-300 light:text-purple-900 flex items-center gap-1.5">
              <span>📌</span>
              <span>{isEnglishContent ? 'Key Revision Points' : 'महत्वपूर्ण बिंदु'}</span>
            </span>
            <ul className="space-y-2">
              {note.bullets.slice(0, 5).map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-slate-200 light:text-slate-800 leading-relaxed text-justify break-words">
                  <span className="text-brand-pink light:text-purple-600 font-bold shrink-0 mt-0.5">•</span>
                  <span className="break-words flex-1">{cleanBulletMarker(b)}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Important Keywords */}
          {note.keywords && note.keywords.length > 0 && (
            <div className="p-3 sm:p-3.5 rounded-2xl bg-white/5 light:bg-amber-50/70 border border-white/10 light:border-amber-200 space-y-1.5">
              <span className="text-xs font-extrabold text-amber-300 light:text-amber-900">
                {isEnglishContent ? 'Important Keywords' : 'मुख्य पारिभाषिक शब्द'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {note.keywords.map((kw, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-xl bg-amber-500/10 light:bg-amber-100 border border-amber-500/30 light:border-amber-300 text-amber-200 light:text-amber-900 text-xs font-semibold break-words">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions: Practice AI + Copy + PDF + PNG + Close */}
        <div className="flex flex-wrap items-center justify-between pt-3 sm:pt-4 border-t border-white/10 light:border-slate-200 mt-3 gap-2 shrink-0">
          <button
            onClick={onPractice}
            className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-gradient-to-r from-brand-purple to-brand-pink text-white font-extrabold text-xs flex items-center gap-1.5 hover:opacity-95 shadow-md cursor-pointer shrink-0"
          >
            <BrainCircuit className="w-4 h-4" />
            <span>{isEnglishContent ? 'Practice AI Quiz' : 'Practice AI अभ्यास'}</span>
          </button>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              onClick={handleCopy}
              className="px-2.5 py-2 sm:px-3 rounded-xl bg-white/5 light:bg-slate-100 hover:bg-white/10 light:hover:bg-slate-200 text-xs font-bold text-slate-300 light:text-slate-700 flex items-center gap-1 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400 light:text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={async () => {
                showToast('Generating sticky card PDF...', 'info');
                await exportSingleStickyNoteAsPDF(note);
                showToast('Downloaded sticky card PDF!', 'success');
              }}
              className="px-2.5 py-2 sm:px-3 rounded-xl bg-white/5 light:bg-slate-100 hover:bg-white/10 light:hover:bg-slate-200 text-xs font-bold text-slate-300 light:text-slate-700 flex items-center gap-1 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-brand-pink light:text-purple-600" />
              <span>PDF</span>
            </button>
            <button
              onClick={async () => {
                showToast('Generating sticky card image...', 'info');
                await exportSingleStickyNoteAsImage(note);
                showToast('Downloaded sticky card image!', 'success');
              }}
              className="px-2.5 py-2 sm:px-3 rounded-xl bg-white/5 light:bg-slate-100 hover:bg-white/10 light:hover:bg-slate-200 text-xs font-bold text-slate-300 light:text-slate-700 flex items-center gap-1 cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5 text-purple-400 light:text-purple-600" />
              <span>PNG</span>
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-white/10 light:bg-slate-200 hover:bg-white/20 light:hover:bg-slate-300 text-xs font-bold text-white light:text-slate-900 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
