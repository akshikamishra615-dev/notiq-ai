import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  RotateCw, 
  ChevronLeft, 
  ChevronRight, 
  Shuffle, 
  CheckCircle, 
  Check, 
  Volume2,
  Grid,
  BookOpen
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import type { Flashcard } from '../types';
import { ttsService } from '../services/ttsService';

export const FlashcardsView: React.FC = () => {
  const { flashcards, toggleFlashcardMastery, loadSampleDocument, settings } = useApp();
  const [deck, setDeck] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [viewMode, setViewMode] = useState<'study' | 'grid'>('study');

  useEffect(() => {
    setDeck(flashcards);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [flashcards]);

  const handleNext = () => {
    if (currentIndex < deck.length - 1) {
      setIsFlipped(false);
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleShuffle = () => {
    const shuffled = [...deck].sort(() => Math.random() - 0.5);
    setDeck(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const currentCard = deck[currentIndex];
  const masteredCount = deck.filter((c) => c.mastered).length;
  const progressPercent = deck.length > 0 ? Math.round((masteredCount / deck.length) * 100) : 0;

  const handleVoice = (text: string) => {
    ttsService.speak(text, `fc-${currentIndex}`, settings.language);
  };

  if (deck.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-brand-pink/10 border border-brand-pink/30 mx-auto flex items-center justify-center">
          <Layers className="w-8 h-8 text-brand-pink" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-white light:text-slate-900">No Flashcards Available</h3>
          <p className="text-xs sm:text-sm text-slate-400 light:text-slate-600 max-w-md mx-auto">
            Upload a document or load an interactive demo to automatically generate study flashcards.
          </p>
        </div>
        <button
          onClick={() => loadSampleDocument('sample-quantum')}
          className="px-6 py-3 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-brand-purple to-brand-pink shadow-lg shadow-brand-purple/25"
        >
          Load Interactive Demo
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 sm:py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white light:text-slate-900 tracking-tight">
              Active Recall <span className="gradient-text">Flashcards</span>
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-purple/20 text-brand-pink font-bold border border-brand-purple/30">
              {deck.length} Cards
            </span>
          </div>
          <p className="text-xs text-slate-400 light:text-slate-600 mt-1">
            Tap the card to flip and test your memory concepts.
          </p>
        </div>

        {/* View Switcher & Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleShuffle}
            title="Shuffle deck"
            className="p-2.5 rounded-xl bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 text-slate-300 light:text-slate-700 hover:text-white hover:border-brand-pink/40 transition-all"
          >
            <Shuffle className="w-4 h-4" />
          </button>
          
          <div className="flex items-center p-1 rounded-xl bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200">
            <button
              onClick={() => setViewMode('study')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'study'
                  ? 'bg-gradient-to-r from-brand-purple to-brand-pink text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Deck</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'grid'
                  ? 'bg-gradient-to-r from-brand-purple to-brand-pink text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>All Cards</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mastery Progress Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 light:border-slate-200 shadow-md space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300 light:text-slate-700">
          <span>Mastery Progress</span>
          <span className="text-brand-pink font-bold">{masteredCount} of {deck.length} Mastered ({progressPercent}%)</span>
        </div>
        <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-purple to-brand-pink rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {viewMode === 'study' && currentCard ? (
        <div className="space-y-6">
          
          {/* 3D Flip Card */}
          <div className="perspective-1000 w-full max-w-xl mx-auto min-h-[340px] cursor-pointer select-none" onClick={() => setIsFlipped(!isFlipped)}>
            <motion.div
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.5, type: 'spring', damping: 15 }}
              className="relative w-full h-[340px] transform-style-3d shadow-2xl rounded-3xl"
            >
              {/* Card Front (Question) */}
              <div className="absolute inset-0 backface-hidden p-8 rounded-3xl bg-gradient-to-br from-[#1b1435] to-[#120d24] light:from-white light:to-slate-50 border-2 border-brand-purple/40 light:border-slate-200 flex flex-col justify-between text-left text-slate-100 light:text-slate-900 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-brand-purple/30 light:bg-purple-100 text-brand-pink light:text-purple-700 border border-brand-purple/40 light:border-purple-200">
                    {currentCard.topic || 'Concept'}
                  </span>
                  <div className="flex items-center gap-2">
                    {currentCard.mastered && (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 light:text-emerald-700 border border-emerald-500/30 light:border-emerald-300 flex items-center gap-1 font-bold">
                        <Check className="w-3 h-3" /> Mastered
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVoice(currentCard.question);
                      }}
                      className="p-2 rounded-xl bg-white/5 light:bg-slate-100 hover:bg-white/10 light:hover:bg-slate-200 text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="my-auto space-y-3">
                  <span className="text-xs font-mono text-slate-400 light:text-slate-500">QUESTION #{currentIndex + 1}</span>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white light:text-slate-900 leading-snug">
                    {currentCard.question}
                  </h3>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 light:text-slate-600 border-t border-white/10 light:border-slate-200 pt-3">
                  <span className="flex items-center gap-1 text-brand-pink light:text-purple-700 font-semibold">
                    <RotateCw className="w-3.5 h-3.5" /> Tap card to see answer
                  </span>
                  <span className="font-mono">{currentIndex + 1} / {deck.length}</span>
                </div>
              </div>

              {/* Card Back (Answer) */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 p-8 rounded-3xl bg-gradient-to-br from-[#2a1338] to-[#160d26] light:from-purple-50 light:to-pink-50 border-2 border-brand-pink/50 light:border-purple-200 flex flex-col justify-between text-left text-slate-100 light:text-slate-900 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-brand-pink/25 light:bg-purple-100 text-white light:text-purple-800 border border-brand-pink/40 light:border-purple-300">
                    Answer & Explanation
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVoice(currentCard.answer);
                    }}
                    className="p-2 rounded-xl bg-white/5 light:bg-slate-100 hover:bg-white/10 light:hover:bg-slate-200 text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="my-auto space-y-2">
                  <p className="text-sm sm:text-base font-medium text-slate-100 light:text-slate-900 leading-relaxed whitespace-pre-line">
                    {currentCard.answer}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 light:text-slate-600 border-t border-white/10 light:border-slate-200 pt-3">
                  <span className="flex items-center gap-1 text-slate-300 light:text-slate-700">
                    <RotateCw className="w-3.5 h-3.5 text-brand-pink light:text-purple-600" /> Tap to flip back
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFlashcardMastery(currentCard.id);
                    }}
                    className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
                      currentCard.mastered
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white/10 light:bg-slate-200 hover:bg-white/20 light:hover:bg-slate-300 text-slate-200 light:text-slate-900'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{currentCard.mastered ? 'Mastered!' : 'Mark Mastered'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-center gap-4 pt-2">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className={`p-3 rounded-2xl border transition-all ${
                currentIndex === 0
                  ? 'bg-white/5 light:bg-slate-100 text-slate-600 light:text-slate-400 border-transparent cursor-not-allowed'
                  : 'bg-white/5 light:bg-white hover:bg-white/10 light:hover:bg-slate-100 text-white light:text-slate-900 border-white/10 light:border-slate-200 hover:border-brand-pink/40 active:scale-95 cursor-pointer'
              }`}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={() => toggleFlashcardMastery(currentCard.id)}
              className={`px-6 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-md cursor-pointer ${
                currentCard.mastered
                  ? 'bg-emerald-600 text-white shadow-emerald-900/30'
                  : 'bg-white/10 light:bg-slate-100 hover:bg-white/15 light:hover:bg-slate-200 text-slate-200 light:text-slate-800 border border-white/15 light:border-slate-200'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{currentCard.mastered ? 'Mastered Concept' : 'Mark as Mastered'}</span>
            </button>

            <button
              onClick={handleNext}
              disabled={currentIndex === deck.length - 1}
              className={`p-3 rounded-2xl border transition-all ${
                currentIndex === deck.length - 1
                  ? 'bg-white/5 light:bg-slate-100 text-slate-600 light:text-slate-400 border-transparent cursor-not-allowed'
                  : 'bg-white/5 light:bg-white hover:bg-white/10 light:hover:bg-slate-100 text-white light:text-slate-900 border-white/10 light:border-slate-200 hover:border-brand-pink/40 active:scale-95 cursor-pointer'
              }`}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {deck.map((card, idx) => (
            <div
              key={card.id}
              className="glass-card p-5 rounded-2xl border border-white/10 light:border-slate-200 space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] font-bold text-brand-pink light:text-purple-700 mb-1">
                  <span>CARD #{idx + 1}</span>
                  <span className="text-slate-400 light:text-slate-500 truncate max-w-[120px]">{card.topic}</span>
                </div>
                <h4 className="font-bold text-sm text-white light:text-slate-900 mb-2">
                  {card.question}
                </h4>
                <p className="text-xs text-slate-300 light:text-slate-600 line-clamp-3 leading-relaxed">
                  {card.answer}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/10 light:border-slate-200">
                <button
                  onClick={() => handleVoice(`${card.question}. ${card.answer}`)}
                  className="p-1.5 rounded-lg text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => toggleFlashcardMastery(card.id)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 ${
                    card.mastered
                      ? 'bg-emerald-500/20 text-emerald-300 light:text-emerald-700 border border-emerald-500/40 light:border-emerald-300'
                      : 'bg-white/5 light:bg-slate-100 text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900'
                  }`}
                >
                  <Check className="w-3 h-3" />
                  <span>{card.mastered ? 'Mastered' : 'Learn'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
