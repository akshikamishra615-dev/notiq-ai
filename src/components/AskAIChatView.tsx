import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  Volume2, 
  Copy, 
  Check, 
  RotateCcw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { generateAIChatResponse } from '../services/chatService';
import { ttsService } from '../services/ttsService';
import type { ChatMessage } from '../types';

export const AskAIChatView: React.FC = () => {
  const { currentSession, loadSampleDocument, settings, showToast, activeWorkspace } = useApp();
  const { addXP } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (currentSession?.chatHistory && currentSession.chatHistory.length > 0) {
      return currentSession.chatHistory;
    }
    const userName = activeWorkspace?.fullName || activeWorkspace?.name || 'Scholar';
    return [
      {
        id: 'msg-init',
        sender: 'ai',
        text: `Hello ${userName}! 👋 I am your **Notiq AI Study Companion**. I have read your document "${currentSession?.fileName || 'Study Material'}".\n\nAsk me anything! You can request simple explanations, real-life examples, Hinglish summaries, or practice viva questions.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestionPills: [
          'Explain this chapter in simple words',
          'Give me a real-life example',
          'Explain in Hinglish / Hindi',
          'What are the 3 most important exam questions?',
        ],
      },
    ];
  });

  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isTyping) return;

    const userMsg: ChatMessage = {
      id: `user-msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsTyping(true);

    try {
      const docText = currentSession?.rawText || 'Sample chapter text covering key principles, formulas, and takeaways.';
      const docTitle = currentSession?.fileName || 'Document';

      const aiResponse = await generateAIChatResponse(query, docText, docTitle, messages, settings.language);

      const aiMsg: ChatMessage = {
        id: `ai-msg-${Date.now()}`,
        sender: 'ai',
        text: aiResponse.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestionPills: aiResponse.suggestionPills,
      };

      setMessages((prev) => [...prev, aiMsg]);
      addXP(5);
    } catch (err) {
      console.warn('Chat error:', err);
      showToast('Error generating AI response. Please try again.', 'error');
    } finally {
      setIsTyping(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Copied message to clipboard!', 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleVoiceRead = (text: string, id: string) => {
    ttsService.speak(text.replace(/[*#]/g, ''), id, settings.language);
  };

  if (!currentSession && messages.length <= 1) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-brand-purple/10 border border-brand-purple/30 mx-auto flex items-center justify-center">
          <Bot className="w-8 h-8 text-brand-purple" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-white light:text-slate-900">Ask Sticky AI — Chat Assistant</h3>
          <p className="text-xs sm:text-sm text-slate-400 light:text-slate-600 max-w-md mx-auto">
            Upload a document or load an interactive demo to start unlimited ChatGPT-style study conversations.
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
    <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6 flex flex-col h-[calc(100vh-140px)] min-h-[550px]">
      
      {/* Header Banner */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 light:border-slate-200 shadow-md flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-purple to-brand-pink flex items-center justify-center text-white shadow-md">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white light:text-slate-900">
                Ask Sticky AI <span className="gradient-text">(ChatGPT Mode)</span>
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 light:text-emerald-700 border border-emerald-500/30 light:border-emerald-300">
                Context Active
              </span>
            </div>
            <p className="text-[11px] text-slate-400 light:text-slate-600 line-clamp-1">
              Connected to: <span className="text-slate-200 light:text-slate-900 font-semibold">{currentSession?.fileName || 'Active Session'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMessages([messages[0]])}
            title="Clear Chat History"
            className="p-2 rounded-xl bg-white/5 light:bg-slate-100 hover:bg-white/10 light:hover:bg-slate-200 text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Container */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
        {messages.map((msg) => {
          const isAI = msg.sender === 'ai';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isAI ? '' : 'flex-row-reverse'}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold shadow-md ${
                isAI ? 'bg-gradient-to-tr from-brand-purple to-brand-pink text-white' : 'bg-white/10 light:bg-slate-200 text-slate-200 light:text-slate-800'
              }`}>
                {isAI ? <Bot className="w-4 h-4" /> : (activeWorkspace?.avatar || '🎓')}
              </div>

              {/* Chat Bubble */}
              <div className={`max-w-[82%] sm:max-w-[75%] p-4 rounded-2xl space-y-2 text-xs sm:text-sm leading-relaxed shadow-lg ${
                isAI
                  ? 'bg-[#141028] light:bg-white border border-white/15 light:border-slate-200 text-slate-100 light:text-slate-900 rounded-tl-sm'
                  : 'bg-gradient-to-r from-brand-purple to-brand-pink text-white rounded-tr-sm font-medium'
              }`}>
                <div className="whitespace-pre-line font-sans">
                  {msg.text}
                </div>

                {/* Actions Bar for AI Messages */}
                {isAI && (
                  <div className="pt-2 border-t border-white/10 light:border-slate-200 flex items-center justify-between text-[11px] text-slate-400 light:text-slate-500">
                    <span className="font-mono text-[10px]">{msg.timestamp}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleVoiceRead(msg.text, msg.id)}
                        className="p-1 rounded hover:bg-white/10 light:hover:bg-slate-100 text-slate-400 light:text-slate-500 hover:text-white light:hover:text-slate-900"
                        title="Read aloud"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleCopy(msg.text, msg.id)}
                        className="p-1 rounded hover:bg-white/10 light:hover:bg-slate-100 text-slate-400 light:text-slate-500 hover:text-white light:hover:text-slate-900"
                        title="Copy text"
                      >
                        {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-400 light:text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Suggestion Pills */}
                {msg.suggestionPills && (
                  <div className="pt-2 flex flex-wrap gap-1.5">
                    {msg.suggestionPills.map((pill, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(pill)}
                        className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-white/5 light:bg-purple-50 hover:bg-brand-purple/30 light:hover:bg-purple-100 border border-white/10 light:border-purple-200 text-brand-pink light:text-purple-700 hover:text-white light:hover:text-purple-900 transition-all cursor-pointer"
                      >
                        💡 {pill}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing Animation */}
        {isTyping && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-purple to-brand-pink text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 rounded-2xl bg-[#141028] light:bg-white border border-white/15 light:border-slate-200 text-xs text-slate-400 light:text-slate-600 flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-brand-pink animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-brand-purple animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-brand-pink animate-bounce [animation-delay:0.4s]" />
              </div>
              <span className="font-mono">Sticky AI is thinking...</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Quick Action Suggestion Bar */}
      <div className="py-2.5 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0 text-xs">
        <span className="text-[10px] uppercase font-bold text-slate-400 light:text-slate-500 shrink-0">Quick Ask:</span>
        {[
          'Explain SDLC in simple words',
          'Give me a real-life example',
          'Explain in Hinglish',
          'What are the high-yield formulas?',
        ].map((pill, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(pill)}
            className="px-3 py-1 rounded-full bg-white/5 light:bg-slate-100 hover:bg-white/10 light:hover:bg-slate-200 border border-white/10 light:border-slate-200 text-slate-300 light:text-slate-700 hover:text-white light:hover:text-slate-900 shrink-0 cursor-pointer"
          >
            {pill}
          </button>
        ))}
      </div>

      {/* Input Form Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="relative shrink-0 pt-1"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Ask Sticky AI any question about your document (e.g., Explain Phase 3 in Hindi)..."
          className="w-full pl-4 pr-12 py-3.5 rounded-2xl bg-white/5 light:bg-white border border-white/15 light:border-slate-200 text-xs sm:text-sm text-white light:text-slate-900 placeholder-slate-400 light:placeholder-slate-500 focus:outline-none focus:border-brand-pink transition-colors shadow-lg"
        />
        <button
          type="submit"
          disabled={!inputQuery.trim() || isTyping}
          className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl text-white transition-all cursor-pointer ${
            !inputQuery.trim() || isTyping
              ? 'bg-slate-700 opacity-50 cursor-not-allowed'
              : 'bg-gradient-to-r from-brand-purple to-brand-pink shadow-md hover:scale-105 active:scale-95'
          }`}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
};
