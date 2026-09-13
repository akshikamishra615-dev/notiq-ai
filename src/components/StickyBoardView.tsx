import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, 
  Pin, 
  Sparkles, 
  FileText, 
  Image as ImageIcon,
  Printer, 
  FileDown, 
  ChevronDown, 
  ChevronUp,
  RotateCcw,
  Palette,
  BookOpen,
  Volume2,
  VolumeX,
  X,
  Clock,
  CheckCircle2,
  Check,
  Globe,
  Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import type { StickyNote, StickyColor, Priority } from '../types';
import { StickyNoteCard } from './StickyNoteCard';
import { EditNoteModal } from './EditNoteModal';
import { exportAsPDF, exportAsPNG, exportAsMarkdown, exportAsJSON, triggerPrintNotes } from '../utils/exportUtils';
import { ttsService } from '../services/ttsService';

const COLOR_DOTS: { id: StickyColor | 'all'; name: string; bg: string }[] = [
  { id: 'all', name: 'All Colors', bg: 'bg-gradient-to-r from-brand-purple to-brand-pink' },
  { id: 'purple', name: 'Purple', bg: 'bg-[#DDD6FE]' },
  { id: 'pink', name: 'Pink', bg: 'bg-[#FBCFE8]' },
  { id: 'yellow', name: 'Yellow', bg: 'bg-[#FEF08A]' },
  { id: 'blue', name: 'Blue', bg: 'bg-[#BAE6FD]' },
  { id: 'green', name: 'Green', bg: 'bg-[#BBF7D0]' },
  { id: 'orange', name: 'Orange', bg: 'bg-[#FED7AA]' },
];

export const StickyBoardView: React.FC = () => {
  const {
    notes,
    currentSession,
    searchQuery,
    setSearchQuery,
    filterTopic,
    setFilterTopic,
    filterPriority,
    setFilterPriority,
    filterColor,
    setFilterColor,
    filterPinnedOnly,
    setFilterPinnedOnly,
    boardViewMode,
    showToast,
    setCurrentTab,
    loadSampleDocument,
    settings,
    changeSessionLanguage,
    changeSessionCategory,
  } = useApp();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<StickyNote | null>(null);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setIsExportDropdownOpen(false);
      }
    };
    if (isExportDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExportDropdownOpen]);
  
  // Floating Story Side Panel / Modal State
  const [isStoryPanelOpen, setIsStoryPanelOpen] = useState(false);
  const [isStorySpeaking, setIsStorySpeaking] = useState(false);
  const [bannerMode, setBannerMode] = useState<'quick' | 'story' | 'revision'>('quick');

  const [readingMode, setReadingMode] = useState<'quick' | 'detailed' | 'revision'>(() => {
    try {
      return (localStorage.getItem('sticky_ai_reading_mode') as 'quick' | 'detailed' | 'revision') || 'quick';
    } catch {
      return 'quick';
    }
  });

  const [summaryStyle, setSummaryStyle] = useState<'smart' | 'quick' | 'detailed' | 'exam' | 'story' | 'flashcard'>(() => {
    try {
      return (localStorage.getItem('notiq_summary_style') as any) || 'smart';
    } catch {
      return 'smart';
    }
  });

  const handleSummaryStyleChange = (style: 'smart' | 'quick' | 'detailed' | 'exam' | 'story' | 'flashcard') => {
    setSummaryStyle(style);
    try {
      localStorage.setItem('notiq_summary_style', style);
    } catch {}
    showToast(`Switched summary format to ${style.toUpperCase()} style`, 'info');
  };

  const handleReadingModeChange = (mode: 'quick' | 'detailed' | 'revision') => {
    setReadingMode(mode);
    try {
      localStorage.setItem('sticky_ai_reading_mode', mode);
    } catch (e) {
      console.warn('Failed to save reading mode preference:', e);
    }
  };

  // Extract unique topics
  const availableTopics = useMemo(() => {
    const topics = new Set<string>();
    notes.forEach((n) => {
      if (n.topic) topics.add(n.topic);
    });
    return Array.from(topics);
  }, [notes]);

  // Filter notes based on search & active filters
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = n.title.toLowerCase().includes(q);
        const matchesSummary = n.summary.toLowerCase().includes(q);
        const matchesBullets = n.bullets.some((b) => b.toLowerCase().includes(q));
        const matchesKeywords = n.keywords.some((k) => k.toLowerCase().includes(q));
        if (!matchesTitle && !matchesSummary && !matchesBullets && !matchesKeywords) {
          return false;
        }
      }

      if (filterTopic !== 'all' && n.topic !== filterTopic) return false;
      if (filterPriority !== 'all' && n.priority !== filterPriority) return false;
      if (filterColor !== 'all' && n.color !== filterColor) return false;
      if (filterPinnedOnly && !n.pinned) return false;

      return true;
    });
  }, [notes, searchQuery, filterTopic, filterPriority, filterColor, filterPinnedOnly]);

  const handleOpenEditModal = (note: StickyNote) => {
    setEditingNote(note);
    setIsEditModalOpen(true);
  };

  const handleSaveModal = (_noteData: Partial<StickyNote>) => {
    showToast(editingNote ? 'Sticky note updated!' : 'New sticky note created!', 'success');
  };

  const handleExportPDF = () => {
    exportAsPDF(notes, currentSession?.fileName || 'Sticky_AI_Notes');
    showToast('Exporting Sticky Board as PDF...', 'info');
    setIsExportDropdownOpen(false);
  };

  const handleExportPNG = () => {
    exportAsPNG(notes, currentSession?.fileName || 'Sticky_AI_Board');
    showToast('Exporting Sticky Board as PNG Image...', 'info');
    setIsExportDropdownOpen(false);
  };

  const handleExportMarkdown = () => {
    exportAsMarkdown(currentSession, notes);
    showToast('Exporting notes as Markdown file...', 'info');
    setIsExportDropdownOpen(false);
  };

  const handleExportJSON = () => {
    exportAsJSON(currentSession, notes);
    showToast('Exporting JSON Session backup...', 'info');
    setIsExportDropdownOpen(false);
  };

  const handlePrint = () => {
    triggerPrintNotes();
    setIsExportDropdownOpen(false);
  };

  const handleToggleStorySpeech = () => {
    if (isStorySpeaking) {
      ttsService.stop();
      setIsStorySpeaking(false);
    } else if (currentSession?.storyNarrative) {
      setIsStorySpeaking(true);
      ttsService.speak(currentSession.storyNarrative, 'story-session', currentSession.language === 'hi' ? 'hi' : 'en');
    }
  };

  const storyPreviewText = currentSession?.storyNarrative
    ? currentSession.storyNarrative.substring(0, 120) + '...'
    : 'Summary overview available.';

  if (notes.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-brand-purple to-brand-pink flex items-center justify-center mx-auto text-white shadow-xl shadow-brand-purple/20">
          <Sparkles className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-white light:text-slate-900">Your Sticky Board is Empty</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          Upload a PDF chapter, lecture slides, or textbook photo to generate AI sticky notes.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setCurrentTab('upload')}
            className="px-6 py-3 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-brand-purple to-brand-pink hover:opacity-95 shadow-md cursor-pointer"
          >
            Upload PDF / Image Document
          </button>
          <button
            onClick={() => loadSampleDocument('phys-1')}
            className="px-6 py-3 rounded-2xl text-xs font-bold text-brand-pink bg-brand-pink/10 border border-brand-pink/30 hover:bg-brand-pink/20 cursor-pointer"
          >
            Load Sample Session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Top Session Info & Action Bar */}
      <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-white/10 light:border-slate-200 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-20">
        
        {/* Document Info */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-purple to-brand-pink flex items-center justify-center text-white shrink-0 shadow-md">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-white light:text-slate-900 leading-snug">
                {currentSession?.fileName || 'Active Notes Session'}
              </h2>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-brand-pink/20 text-brand-pink uppercase border border-brand-pink/30 shrink-0">
                {notes.length} Notes
              </span>
            </div>
            <p className="text-[11px] text-slate-400 light:text-slate-500 mt-0.5">
              Mode: <span className="capitalize font-semibold text-slate-300 light:text-slate-700">{currentSession?.summaryMode || 'Story Explanation'}</span> • Language: <span className="uppercase font-semibold">{currentSession?.language || 'AUTO'}</span>
            </p>
          </div>
        </div>

        {/* Action Controls Group */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">
          
          {/* Compact Language Selector Pill */}
          <div className="flex items-center p-1 rounded-xl bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200">
            {[
              { id: 'auto', label: '🌐 Auto' },
              { id: 'en', label: '🇬🇧 English' },
              { id: 'hi', label: '🇮🇳 Hindi' },
            ].map((l) => (
              <button
                key={l.id}
                onClick={() => changeSessionLanguage(l.id as any)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  (settings.language === l.id || currentSession?.language === l.id)
                    ? 'bg-brand-pink text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          {/* Export Dropdown */}
          <div className="relative" ref={exportDropdownRef}>
            <button
              onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
              className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 text-slate-200 light:text-slate-800 hover:border-brand-pink/40 flex items-center gap-2 transition-all cursor-pointer"
            >
              <FileDown className="w-4 h-4 text-brand-pink" />
              <span>Export</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isExportDropdownOpen && (
              <div className="absolute right-0 top-12 w-52 p-2 rounded-2xl bg-[#141028] light:bg-white border border-white/20 light:border-slate-200 shadow-2xl z-50 space-y-1">
                <button
                  onClick={handleExportPDF}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-200 light:text-slate-800 hover:bg-brand-purple/20 transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-brand-pink" />
                  <span>PDF Document (.pdf)</span>
                </button>
                <button
                  onClick={handleExportPNG}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-200 light:text-slate-800 hover:bg-brand-purple/20 transition-colors cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4 text-purple-400" />
                  <span>High-Res Board Image (.png)</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-200 light:text-slate-800 hover:bg-brand-purple/20 transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-emerald-400" />
                  <span>Printable A4 Notes</span>
                </button>
                <button
                  onClick={handleExportMarkdown}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-200 light:text-slate-800 hover:bg-brand-purple/20 transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>Markdown Document (.md)</span>
                </button>
                <button
                  onClick={handleExportJSON}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-200 light:text-slate-800 hover:bg-brand-purple/20 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-sky-400" />
                  <span>JSON Session Backup</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 100% Chapter Coverage Tracker Banner */}
      <div className="glass-panel p-3.5 rounded-2xl border border-brand-purple/30 light:border-slate-200 bg-black/20 light:bg-slate-100/80 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-slate-200 light:text-slate-800">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1.5 text-emerald-400 light:text-emerald-700">
            <CheckCircle2 className="w-4 h-4" />
            <span>PDF Coverage: 100% Complete</span>
          </span>
          <span className="text-slate-400 light:text-slate-500">•</span>
          <span>Topics Mapped: <strong className="text-white light:text-slate-900">{notes.length} Topics</strong></span>
          <span className="text-slate-400 light:text-slate-500">•</span>
          <span>Sticky Notes Created: <strong className="text-brand-pink light:text-purple-700">{notes.length} Cards</strong></span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-400 light:text-slate-600">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Full Chapter Scanned & Transformed</span>
        </div>
      </div>

      {/* V42.0 CLEAN & MINIMAL FORMAT SELECTOR BAR */}
      <div className="my-2 p-3 rounded-2xl bg-black/40 light:bg-white border border-brand-purple/30 light:border-slate-200 backdrop-blur-md shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* 4 Core Formats */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <span className="text-[10px] font-extrabold text-brand-pink light:text-purple-700 uppercase shrink-0 mr-1">Format:</span>
          {[
            { id: 'smart-summary', label: '⭐ Smart Summary' },
            { id: 'quick-revision', label: '⚡ Quick Revision' },
            { id: 'important-points', label: '🎯 Important Points' },
            { id: 'mcq-practice', label: '🧠 MCQ Practice' },
          ].map((b) => {
            const isSelected = summaryStyle === b.id || currentSession?.summaryMode === b.id;
            return (
              <motion.button
                key={b.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  handleSummaryStyleChange(b.id as any);
                  changeSessionCategory(b.id as any);
                  showToast(`Applied ${b.label} mode!`, 'info');
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer shadow-md flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-gradient-to-r from-brand-purple to-brand-pink text-white border border-brand-pink/60 shadow-brand-purple/40 scale-105'
                    : 'bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 text-slate-300 light:text-slate-700 hover:text-white light:hover:text-slate-900 hover:bg-white/10 light:hover:bg-slate-200'
                }`}
              >
                <span>{b.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
              </motion.button>
            );
          })}
        </div>

        {/* Compact Language Pills */}
        <div className="flex items-center gap-1 p-1 rounded-full bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 shrink-0 self-end sm:self-auto">
          <Globe className="w-3.5 h-3.5 text-brand-pink light:text-purple-600 ml-1.5" />
          {[
            { id: 'auto', label: 'Auto' },
            { id: 'hi', label: 'Hindi' },
            { id: 'en', label: 'English' },
          ].map((lang) => (
            <button
              key={lang.id}
              onClick={() => changeSessionLanguage(lang.id as any)}
              className={`px-3 py-1 rounded-full text-[11px] font-extrabold cursor-pointer transition-all ${
                currentSession?.language === lang.id
                  ? 'bg-brand-pink text-white shadow-xs'
                  : 'text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. COMPACT STORY SUMMARY BANNER (Max Height ~120px) — Sticky Notes First! */}
      {currentSession?.storyNarrative && (
        <div className="glass-card p-4 sm:p-5 rounded-3xl border border-brand-pink/30 light:border-purple-200 bg-gradient-to-r from-brand-purple/15 via-brand-pink/10 to-brand-purple/15 light:bg-gradient-to-r light:from-purple-50 light:via-pink-50 light:to-purple-50 shadow-xl relative overflow-hidden space-y-2 max-h-[140px] flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-xl bg-brand-pink/20 light:bg-purple-100 text-brand-pink light:text-purple-700 shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2 flex-wrap truncate">
                <h3 className="text-sm font-extrabold text-white light:text-slate-900 truncate max-w-xs sm:max-w-md">
                  {currentSession?.fileName || 'Chapter Story Summary'}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-purple/30 light:bg-purple-100 text-brand-pink light:text-purple-700 uppercase border border-brand-pink/20 light:border-purple-200">
                  {currentSession?.language === 'hi' ? 'Hindi' : 'English'}
                </span>
                <span className="text-[10px] font-semibold text-slate-400 light:text-slate-600 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500 light:text-slate-400" />
                  3 min read
                </span>
              </div>
            </div>

            {/* Mode Tabs (Quick Summary / Story Mode / Revision Mode) */}
            <div className="hidden md:flex items-center p-0.5 rounded-xl bg-black/30 light:bg-white/80 border border-white/10 light:border-slate-200">
              <button
                onClick={() => setBannerMode('quick')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                  bannerMode === 'quick' ? 'bg-brand-pink text-white shadow-xs' : 'text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900'
                }`}
              >
                Quick Summary
              </button>
              <button
                onClick={() => {
                  setBannerMode('story');
                  setIsStoryPanelOpen(true);
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                  bannerMode === 'story' ? 'bg-brand-pink text-white shadow-xs' : 'text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900'
                }`}
              >
                Story Mode
              </button>
              <button
                onClick={() => handleReadingModeChange('revision')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                  readingMode === 'revision' ? 'bg-brand-pink text-white shadow-xs' : 'text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900'
                }`}
              >
                Revision Mode
              </button>
            </div>
          </div>

          {/* 2-3 Line Short Preview */}
          <p className="text-xs text-slate-300 light:text-slate-700 truncate max-w-3xl">
            {storyPreviewText}
          </p>

          {/* Show Story / Hide Story Pill Button */}
          <div className="flex items-center justify-between pt-1 border-t border-white/5 light:border-slate-200">
            <span className="text-[10px] text-slate-400 light:text-slate-600">Sticky notes displayed first below</span>
            <button
              onClick={() => setIsStoryPanelOpen(!isStoryPanelOpen)}
              className="px-3.5 py-1 rounded-full bg-gradient-to-r from-brand-purple to-brand-pink text-white font-extrabold text-[11px] hover:opacity-95 shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <span>{isStoryPanelOpen ? 'Hide Story' : 'Show Story'}</span>
              {isStoryPanelOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}

      {/* Filter & Search Toolbar with Reading Mode Selector */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 light:border-slate-200 shadow-md flex flex-wrap items-center justify-between gap-3">
        
        {/* Reading Mode Segmented Control (Quick / Detailed / Revision) */}
        <div className="flex items-center p-1 rounded-xl bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200">
          <button
            onClick={() => handleReadingModeChange('quick')}
            title="Quick View (Compact 3-5 line short summary preview + Show More)"
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              readingMode === 'quick'
                ? 'bg-gradient-to-r from-brand-purple to-brand-pink text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ⚡ Quick View
          </button>
          <button
            onClick={() => handleReadingModeChange('detailed')}
            title="Detailed View (Auto expand all sticky notes)"
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              readingMode === 'detailed'
                ? 'bg-gradient-to-r from-brand-purple to-brand-pink text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            📖 Detailed View
          </button>
          <button
            onClick={() => handleReadingModeChange('revision')}
            title="Revision View (Show key points & formulas only)"
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              readingMode === 'revision'
                ? 'bg-gradient-to-r from-brand-purple to-brand-pink text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🎯 Revision View
          </button>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-4 h-4 text-slate-400 light:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes, keywords, formulas..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 text-xs text-white light:text-slate-900 placeholder-slate-400 light:placeholder-slate-500 focus:outline-none focus:border-brand-pink"
          />
        </div>

        {/* Topic Filter */}
        {availableTopics.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 light:text-slate-600 font-medium">Topic:</span>
            <select
              value={filterTopic}
              onChange={(e) => setFilterTopic(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 text-xs text-white light:text-slate-900 focus:outline-none focus:border-brand-pink"
            >
              <option value="all" className="bg-[#141028] light:bg-white text-white light:text-slate-900">All Topics ({notes.length})</option>
              {availableTopics.map((t) => (
                <option key={t} value={t} className="bg-[#141028] light:bg-white text-white light:text-slate-900">
                  {t}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Priority Filter */}
        <div className="flex items-center gap-1.5">
          {(['all', 'high', 'medium', 'low'] as (Priority | 'all')[]).map((p) => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold capitalize transition-all cursor-pointer ${
                filterPriority === p
                  ? 'bg-gradient-to-r from-brand-purple to-brand-pink text-white shadow-xs'
                  : 'bg-white/5 light:bg-slate-100 text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Color Filter Dots */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200">
          <Palette className="w-3.5 h-3.5 text-brand-pink light:text-purple-600 mr-0.5" />
          {COLOR_DOTS.map((dot) => (
            <button
              key={dot.id}
              onClick={() => setFilterColor(dot.id)}
              title={dot.name}
              className={`w-4 h-4 rounded-full ${dot.bg} transition-all cursor-pointer ${
                filterColor === dot.id ? 'ring-2 ring-brand-purple scale-125' : 'opacity-70 hover:opacity-100'
              }`}
            />
          ))}
        </div>

        {/* Pinned Toggle */}
        <button
          onClick={() => setFilterPinnedOnly(!filterPinnedOnly)}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            filterPinnedOnly
              ? 'bg-rose-500/20 text-rose-300 light:text-rose-700 border border-rose-500/40 light:border-rose-300'
              : 'bg-white/5 light:bg-slate-100 text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900'
          }`}
        >
          <Pin className={`w-3 h-3 ${filterPinnedOnly ? 'fill-rose-400' : ''}`} />
          <span>Pinned Only</span>
        </button>
      </div>

      {/* Sticky Board Canvas Container */}
      <div 
        id="sticky-board-container"
        className={`relative min-h-[600px] p-4 sm:p-6 rounded-3xl border border-white/10 light:border-slate-200 bg-[#0e0b1c]/70 light:bg-slate-50 shadow-inner overflow-hidden ${
          boardViewMode === 'canvas' ? 'h-[750px] overflow-auto' : ''
        }`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] light:bg-[radial-gradient(#0000000a_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

        {filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center space-y-3 relative z-10">
            <p className="text-slate-400 light:text-slate-600 text-sm">No sticky notes match your current filters.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterTopic('all');
                setFilterPriority('all');
                setFilterColor('all');
                setFilterPinnedOnly(false);
              }}
              className="text-xs text-brand-pink light:text-purple-700 underline font-semibold cursor-pointer"
            >
              Reset all filters
            </button>
          </div>
        ) : boardViewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 relative z-10">
            {filteredNotes.map((note) => (
              <StickyNoteCard
                key={note.id}
                note={note}
                onEdit={handleOpenEditModal}
                isCanvasMode={false}
              />
            ))}
          </div>
        ) : (
          <div className="relative w-[1800px] h-[1200px] z-10">
            {filteredNotes.map((note, index) => {
              const xPos = note.x ?? (50 + (index % 4) * 380);
              const yPos = note.y ?? (50 + Math.floor(index / 4) * 380);
              return (
                <div
                  key={note.id}
                  style={{ position: 'absolute', left: xPos, top: yPos, width: 340 }}
                >
                  <StickyNoteCard
                    note={note}
                    onEdit={handleOpenEditModal}
                    isCanvasMode={true}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. V42.1 DISTRACTION-FREE CHAPTER STORY READER MODAL */}
      <AnimatePresence>
        {isStoryPanelOpen && currentSession?.storyNarrative && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full max-w-3xl h-[90vh] bg-[#100c22] light:bg-white border border-brand-purple/30 light:border-slate-200 rounded-[28px] shadow-2xl p-5 sm:p-7 flex flex-col justify-between overflow-hidden relative text-slate-100 light:text-slate-900"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-white/10 light:border-slate-200 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-brand-purple to-brand-pink text-white shadow-md">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-extrabold text-white light:text-slate-900">
                      📖 Chapter Story Reader
                    </h2>
                    <p className="text-xs text-slate-400 light:text-slate-600">
                      Distraction-free book reading experience • {currentSession?.language === 'hi' ? 'हिंदी' : 'English'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsStoryPanelOpen(false)}
                  className="p-2 rounded-xl bg-white/5 light:bg-slate-100 hover:bg-white/10 light:hover:bg-slate-200 text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Distraction-Free Book Reading Text Body (1.8 Line Spacing, Paragraphs Only) */}
              <div className="flex-1 my-3 p-5 sm:p-7 rounded-2xl bg-[#0a0717] light:bg-slate-50 border border-white/10 light:border-slate-200 overflow-y-auto space-y-4 shadow-inner text-slate-100 light:text-slate-900 text-[14px] sm:text-[15px] leading-[1.8] font-normal scrollbar-none">
                {currentSession.storyNarrative.split('\n\n').map((para, pIdx) => {
                  const trimmed = para.trim();
                  if (!trimmed) return null;
                  
                  if (trimmed.startsWith('# ')) {
                    return (
                      <h1 key={pIdx} className="text-xl sm:text-2xl font-black text-brand-pink light:text-purple-700 pt-2 pb-1 border-b border-brand-purple/20 light:border-slate-200">
                        {trimmed.replace(/^#\s*/, '')}
                      </h1>
                    );
                  }
                  if (trimmed.startsWith('## ')) {
                    return (
                      <h2 key={pIdx} className="text-base sm:text-lg font-extrabold text-purple-300 light:text-purple-900 pt-3 pb-1 flex items-center gap-2">
                        {trimmed.replace(/^##\s*/, '')}
                      </h2>
                    );
                  }
                  if (trimmed.startsWith('---')) {
                    return <hr key={pIdx} className="border-white/10 light:border-slate-200 my-3" />;
                  }
                  return (
                    <p key={pIdx} className="text-slate-200 light:text-slate-800 text-justify">
                      {trimmed}
                    </p>
                  );
                })}
              </div>

              {/* Clean Footer Controls: Read Aloud + Copy + Close */}
              <div className="pt-3 border-t border-white/10 light:border-slate-200 flex items-center justify-between gap-3 shrink-0">
                <button
                  onClick={handleToggleStorySpeech}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    isStorySpeaking
                      ? 'bg-rose-500 text-white animate-pulse shadow-md'
                      : 'bg-white/10 light:bg-slate-200 text-slate-200 light:text-slate-800 hover:bg-white/15 light:hover:bg-slate-300'
                  }`}
                >
                  {isStorySpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  <span>{isStorySpeaking ? 'Stop Audio' : 'Read Aloud'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(currentSession.storyNarrative || '');
                      showToast('Story copied to clipboard!', 'success');
                    }}
                    className="px-4 py-2 rounded-xl bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 text-xs font-bold text-slate-300 light:text-slate-700 hover:bg-white/10 light:hover:bg-slate-200 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Story</span>
                  </button>

                  <button
                    onClick={() => setIsStoryPanelOpen(false)}
                    className="px-6 py-2 rounded-xl bg-gradient-to-r from-brand-purple to-brand-pink text-white font-extrabold text-xs hover:opacity-95 shadow-md cursor-pointer"
                  >
                    Done Reading
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Note Modal */}
      <EditNoteModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveModal}
        initialNote={editingNote}
      />

    </div>
  );
};
