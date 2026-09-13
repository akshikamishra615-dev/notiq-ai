import type { Language } from '../types';

/**
 * Text-to-Speech (TTS) Service using native Web Speech API
 */
class TTSService {
  private synth: SpeechSynthesis | null = null;
  private isSpeaking = false;
  private currentNoteId: string | null = null;
  private listeners: ((speaking: boolean, noteId: string | null) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public subscribe(listener: (speaking: boolean, noteId: string | null) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l(this.isSpeaking, this.currentNoteId));
  }

  public speak(text: string, noteId: string, language: Language = 'en') {
    if (!this.synth) {
      console.warn('Speech synthesis not supported in this browser.');
      return;
    }

    if (this.isSpeaking && this.currentNoteId === noteId) {
      this.stop();
      return;
    }

    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    this.currentNoteId = noteId;
    this.isSpeaking = true;

    const voices = this.synth.getVoices();
    const isHindi = language === 'hi' || /[\u0900-\u097F]/.test(text);
    const langCode = isHindi ? 'hi-IN' : 'en-US';
    const matchingVoice = voices.find(v => v.lang.includes(langCode) || (isHindi && v.name.includes('Hindi')));
    
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }
    
    utterance.lang = langCode;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      this.isSpeaking = false;
      this.currentNoteId = null;
      this.notify();
    };

    utterance.onerror = (e) => {
      console.warn('TTS playback error:', e);
      this.isSpeaking = false;
      this.currentNoteId = null;
      this.notify();
    };

    this.notify();
    this.synth.speak(utterance);
  }

  public stop() {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
      this.currentNoteId = null;
      this.notify();
    }
  }

  public pause() {
    if (this.synth && this.isSpeaking) {
      this.synth.pause();
    }
  }

  public resume() {
    if (this.synth) {
      this.synth.resume();
    }
  }

  public getStatus() {
    return {
      isSpeaking: this.isSpeaking,
      currentNoteId: this.currentNoteId
    };
  }
}

export const ttsService = new TTSService();
