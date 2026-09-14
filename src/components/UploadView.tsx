import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Sparkles, 
  Check, 
  X, 
  Zap, 
  Languages, 
  Sliders, 
  ArrowRight,
  Scan,
  RefreshCw,
  BookOpen
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { SummaryMode, Language, DocumentSession } from '../types';
import { extractTextFromPDF, extractTextFromPDFWithOCR } from '../services/pdfService';
import { extractTextFromImage } from '../services/ocrService';
import { generateStickyNotesFromText } from '../services/aiService';
import { SAMPLE_DOCUMENTS } from '../services/sampleData';

export const UploadView: React.FC = () => {
  const { 
    settings, 
    setCurrentTab, 
    createNewSession, 
    startProcessing, 
    updateProgress, 
    endProcessing, 
    showToast,
    loadSampleDocument
  } = useApp();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [summaryMode, setSummaryMode] = useState<SummaryMode>(settings.defaultSummaryMode || 'quick-revision');
  const [language, setLanguage] = useState<Language>(settings.language || 'auto');
  const [forceOCR, setForceOCR] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const summaryModes: { id: SummaryMode; label: string; desc: string; icon: string }[] = [
    { 
      id: 'smart-summary', 
      label: '⭐ Smart Summary', 
      desc: 'Complete chapter with sticky notes & key points.', 
      icon: '⭐' 
    },
    { 
      id: 'quick-revision', 
      label: '⚡ Quick Revision', 
      desc: 'Short revision notes for last-minute study.', 
      icon: '⚡' 
    },
    { 
      id: 'important-points', 
      label: '🎯 Important Points', 
      desc: 'Most important concepts, dates, formulas & facts.', 
      icon: '🎯' 
    },
    { 
      id: 'mcq-practice', 
      label: '🧠 MCQ Practice', 
      desc: 'Generate MCQs after the summary is created.', 
      icon: '🧠' 
    },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    const isPDF = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(file.name);

    if (!isPDF && !isImage) {
      showToast('Please upload a valid PDF or Image file (PNG, JPG, JPEG, WEBP)', 'error');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      showToast('File size exceeds 25MB limit.', 'error');
      return;
    }

    setSelectedFile(file);
    showToast(`Selected "${file.name}" (${(file.size / (1024 * 1024)).toFixed(1)}MB)`, 'info');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleProcessFile = async () => {
    if (!selectedFile) {
      showToast('Please select a PDF or Image file first.', 'error');
      return;
    }

    startProcessing(`Step 1/4: Running Processing on "${selectedFile.name}"...`);

    try {
      let rawText = '';
      let pdfPages: { pageNumber: number; text: string }[] | undefined = undefined;
      const isPDF = selectedFile.type === 'application/pdf' || selectedFile.name.endsWith('.pdf');
      const isImage = selectedFile.type.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(selectedFile.name);

      if (isPDF) {
        if (forceOCR) {
          updateProgress(15, 'Step 1/4: Scanning ALL PDF pages with Dual-Language OCR...');
          const pdfOcrResult = await extractTextFromPDFWithOCR(selectedFile, language, (p, s) => updateProgress(p, s));
          rawText = pdfOcrResult.text;
          pdfPages = pdfOcrResult.pages;
        } else {
          updateProgress(15, 'Step 1/4: Extracting text from PDF pages...');
          try {
            const pdfResult = await extractTextFromPDF(selectedFile, (p, s) => updateProgress(p, s));
            rawText = pdfResult.text;
            pdfPages = pdfResult.pages;
          } catch {
            updateProgress(30, 'Step 1/4: PDF text empty or scanned. Switching to Multi-Page Dual OCR...');
            const pdfOcrResult = await extractTextFromPDFWithOCR(selectedFile, language, (p: number, s: string) => updateProgress(p, s));
            rawText = pdfOcrResult.text;
            pdfPages = pdfOcrResult.pages;
          }
        }
      } else if (isImage) {
        updateProgress(15, 'Step 1/4: Preprocessing image clarity & running OCR scan...');
        const ocrResult = await extractTextFromImage(selectedFile, language, (p: number, s: string) => updateProgress(p, s));
        rawText = ocrResult.text;
      }

      if (!rawText || rawText.trim().length < 10) {
        throw new Error('Could not extract readable text from the document. Please ensure the document is clear.');
      }

      updateProgress(45, 'Step 2/4: AI Understanding — Analyzing complete PDF context & chapter flow...');
      const result = await generateStickyNotesFromText(
        rawText,
        selectedFile.name,
        summaryMode,
        language,
        settings,
        (progress, step) => updateProgress(progress, step),
        pdfPages
      );

      const newSession: DocumentSession = {
        id: `session-${Date.now()}`,
        fileName: selectedFile.name,
        fileType: selectedFile.type || 'application/octet-stream',
        fileSize: selectedFile.size,
        uploadedAt: new Date().toISOString(),
        summaryMode,
        language,
        detectedLanguage: result.detectedLanguage,
        rawText,
        storyNarrative: result.storyNarrative,
        notes: result.notes,
        flashcards: result.flashcards,
        quiz: result.quiz,
        highlights: result.highlights,
        mindMap: result.mindMap,
      };

      createNewSession(newSession);
      endProcessing();

      // V50.0 Master Output Engine Auto-Routing
      if (summaryMode === 'mcq-practice') {
        setCurrentTab('quiz');
      } else {
        setCurrentTab('notes');
      }
    } catch (err: unknown) {
      endProcessing();
      const error = err as Error;
      showToast(error.message || 'Error processing document. Click retry to try again.', 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 px-4">
      
      {/* Title */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white light:text-slate-900 tracking-tight">
          Upload Document & <span className="gradient-text">Generate Story Summary + MCQs</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 light:text-slate-600 max-w-xl mx-auto">
          Convert textbook PDFs, scanned lecture notes, whiteboards, or images into an engaging story explanation, organized sticky paper notes, and 10–15 MCQs in English or Hindi.
        </p>
      </div>

      {/* Main Upload Zone Card */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 light:border-slate-200 shadow-2xl space-y-6">
        
        {/* Drag & Drop Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all cursor-pointer select-none ${
            isDragging
              ? 'border-brand-pink bg-brand-pink/10 scale-[1.01]'
              : selectedFile
              ? 'border-brand-purple/60 bg-gradient-to-b from-brand-purple/10 to-brand-pink/10'
              : 'border-white/15 light:border-slate-300 hover:border-brand-pink/50 bg-white/[0.02] hover:bg-white/[0.05]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />

          {selectedFile ? (
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-purple to-brand-pink text-white mx-auto flex items-center justify-center shadow-lg shadow-brand-purple/30 animate-pulse">
                {selectedFile.name.endsWith('.pdf') ? <FileText className="w-8 h-8" /> : <ImageIcon className="w-8 h-8" />}
              </div>
              <div>
                <span className="text-xs uppercase font-extrabold tracking-widest text-brand-pink block mb-1">
                  File Ready for Story & MCQ Generation
                </span>
                <h3 className="text-lg font-bold text-white light:text-slate-900 truncate max-w-md mx-auto">
                  {selectedFile.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.type || 'Document'}
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                }}
                className="inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-semibold bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-500/20"
              >
                <X className="w-3.5 h-3.5" />
                <span>Remove File</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 text-slate-300 light:text-slate-700 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8 text-brand-pink" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white light:text-slate-900">
                  Drag and drop your PDF or Image here
                </h3>
                <p className="text-xs text-slate-400 light:text-slate-500 mt-1">
                  Supports <span className="text-slate-200 font-semibold">PDF, JPG, PNG, WEBP</span> files up to 25MB
                </p>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-purple to-brand-pink shadow-md">
                <span>Browse Local Files</span>
              </div>
            </div>
          )}
        </div>

        {/* V41.1 Clean & Minimal Options & Controls */}
        <div className="space-y-5 pt-4 border-t border-white/10">
          
          {/* 1. Select Summary Format (4 Compact Cards in 2x2 Responsive Grid) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 text-brand-pink">
                <Sliders className="w-4 h-4" />
                <span>1. Select Format</span>
              </label>
              <span className="text-[11px] text-slate-400 font-medium">4 Core Options</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {summaryModes.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSummaryMode(m.id)}
                  className={`h-[72px] p-3 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between cursor-pointer relative overflow-hidden active:scale-[0.98] ${
                    summaryMode === m.id
                      ? 'bg-gradient-to-br from-brand-purple/40 to-brand-pink/30 light:from-brand-purple/20 light:to-brand-pink/20 border-brand-pink text-white light:text-slate-900 shadow-lg ring-1 ring-white/20'
                      : 'bg-white/5 light:bg-slate-100 border-white/10 light:border-slate-200 text-slate-300 light:text-slate-700 hover:bg-white/10 light:hover:bg-slate-200 hover:text-white light:hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className="text-2xl shrink-0">{m.icon}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-white light:text-slate-900 truncate">{m.label}</p>
                      <p className="text-[11px] text-slate-300 light:text-slate-600 truncate leading-tight mt-0.5">{m.desc}</p>
                    </div>
                  </div>
                  {summaryMode === m.id && (
                    <div className="w-5 h-5 rounded-full bg-brand-pink text-white flex items-center justify-center shrink-0 shadow-xs ml-2">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Compact Language Pills & OCR Scanner Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-white/10 light:border-slate-200">
            {/* Language Pills */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-300 light:text-slate-700 flex items-center gap-1.5 text-brand-pink shrink-0">
                <Languages className="w-3.5 h-3.5" />
                <span>Language:</span>
              </span>
              <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200">
                {[
                  { id: 'auto', label: 'Auto Detect' },
                  { id: 'hi', label: 'Hindi (हिंदी)' },
                  { id: 'en', label: 'English' },
                ].map((lang) => (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => setLanguage(lang.id as Language)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      language === lang.id
                        ? 'bg-brand-pink text-white shadow-md'
                        : 'text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            {/* OCR Toggle */}
            <button
              type="button"
              onClick={() => setForceOCR(!forceOCR)}
              className="px-3.5 py-2 rounded-2xl bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 hover:bg-white/10 light:hover:bg-slate-200 flex items-center justify-between sm:justify-start gap-2.5 text-xs font-bold text-slate-200 light:text-slate-800 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2">
                <Scan className="w-3.5 h-3.5 text-brand-pink" />
                <span>Enhanced OCR Scanner</span>
              </div>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                forceOCR ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-white/10 text-slate-400'
              }`}>
                {forceOCR ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>

        </div>

        {/* Workflow Banner */}
        <div className="p-3.5 rounded-2xl bg-brand-purple/15 border border-brand-purple/30 text-xs text-slate-300 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-brand-pink shrink-0" />
          <span>Workflow: 1. OCR Processing $\rightarrow$ 2. AI Context Understanding $\rightarrow$ 3. Story Summary $\rightarrow$ 4. 10–15 MCQ Quiz</span>
        </div>

        {/* Generate Button */}
        <div className="pt-2 border-t border-white/10 flex justify-end">
          <button
            onClick={handleProcessFile}
            disabled={!selectedFile}
            className={`w-full sm:w-auto px-8 py-4 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-3 transition-all cursor-pointer shadow-xl ${
              !selectedFile
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                : 'bg-gradient-to-r from-brand-purple to-brand-pink hover:opacity-95 shadow-brand-purple/30 transform hover:-translate-y-0.5 active:scale-95'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Story & 15 MCQs Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* 1-Click Interactive Demos */}
      <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 text-center space-y-4">
        <div className="flex items-center justify-center gap-2 text-xs font-extrabold uppercase tracking-widest text-brand-pink">
          <Zap className="w-4 h-4" />
          <span>Don't have a file ready? Try 1-Click Interactive Demos</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-left">
          {SAMPLE_DOCUMENTS.map((doc) => (
            <button
              key={doc.id}
              onClick={() => loadSampleDocument(doc.id)}
              className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-pink/50 transition-all flex flex-col justify-between cursor-pointer group"
            >
              <div>
                <span className="text-[10px] font-bold text-brand-pink block mb-1">{doc.category}</span>
                <p className="font-bold text-xs text-white group-hover:text-brand-pink transition-colors line-clamp-1">
                  {doc.title}
                </p>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                  {doc.description}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                <span>{doc.language === 'hi' ? 'Hindi (हिंदी)' : 'English'}</span>
                <RefreshCw className="w-3 h-3 text-brand-pink group-hover:rotate-180 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};
