import { 
  Sparkles, 
  FileText, 
  Bot,
  ArrowRight,
  StickyNote as StickyIcon,
  Layers,
  HelpCircle,
  Lock,
  User,
  Flame,
  Award,
  BookMarked
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { SAMPLE_DOCUMENTS } from '../services/sampleData';

export const HomeView: React.FC = () => {
  const { setCurrentTab, loadSampleDocument, notes, flashcards, quiz } = useApp();
  const { currentUser } = useAuth();

  const userDisplayName = currentUser?.name || 'Scholar';
  const userTypeLabel = currentUser?.userType || 'Learner';
  const classGradeLabel = currentUser?.classGrade || currentUser?.course;
  const institutionLabel = currentUser?.institution;

  let parsedSubjects: string[] = [];
  if (Array.isArray(currentUser?.subjects)) {
    parsedSubjects = currentUser.subjects;
  } else if (typeof currentUser?.subjects === 'string') {
    try {
      parsedSubjects = JSON.parse(currentUser.subjects);
    } catch {
      parsedSubjects = [(currentUser.subjects as string)];
    }
  }

  const isProfileIncomplete = !currentUser?.classGrade && !currentUser?.course && !currentUser?.institution;

  return (
    <div className="space-y-8 sm:space-y-12 pb-16 max-w-7xl mx-auto">
      
      {/* 1. PERSONALIZED USER DASHBOARD HEADER */}
      <section className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 light:border-slate-200 shadow-2xl relative overflow-hidden">
        {/* Background Ambient Orbs */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-brand-pink/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-brand-purple/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3">
            {/* User Greeting Badge */}
            <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-2xl bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 text-white light:text-slate-900 font-extrabold text-xs">
              <div className="w-6 h-6 rounded-xl bg-gradient-to-tr from-brand-purple to-brand-pink flex items-center justify-center text-white text-xs">
                <Sparkles className="w-3 h-3 animate-pulse" />
              </div>
              <span>Notiq <span className="gradient-text">AI Learning Dashboard</span></span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white light:text-slate-900 tracking-tight">
              Welcome back, <span className="gradient-text">{userDisplayName}</span> 👋
            </h1>

            {/* Academic Info Pills */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-300 light:text-slate-700">
              <span className="px-3 py-1 rounded-xl bg-brand-purple/20 light:bg-brand-purple/10 border border-brand-purple/40 light:border-brand-purple/30 font-bold text-brand-pink light:text-brand-purple-dark flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>{userTypeLabel}</span>
              </span>

              {classGradeLabel && (
                <span className="px-3 py-1 rounded-xl bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 font-semibold text-slate-200 light:text-slate-700">
                  {classGradeLabel}
                </span>
              )}

              {institutionLabel && (
                <span className="px-3 py-1 rounded-xl bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 font-semibold text-slate-300 light:text-slate-700">
                  🏛️ {institutionLabel}
                </span>
              )}

              {parsedSubjects.length > 0 && (
                <span className="px-3 py-1 rounded-xl bg-sky-500/10 border border-sky-500/20 font-semibold text-sky-400 light:text-sky-700">
                  📚 {parsedSubjects.join(', ')}
                </span>
              )}
            </div>

            {isProfileIncomplete && (
              <p className="text-xs text-amber-400 light:text-amber-600 font-medium pt-1 flex items-center gap-1.5">
                <span>💡 Complete your academic profile to get personalized AI study summaries & viva prep!</span>
              </p>
            )}
          </div>

          {/* Right Action: Edit Profile Button & Quick Stats */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full lg:w-auto">
            <div className="p-3.5 rounded-2xl bg-white/5 light:bg-white border border-white/10 light:border-slate-200 text-center flex-1 sm:flex-none min-w-[100px] shadow-sm">
              <div className="flex items-center justify-center gap-1 text-amber-400 font-bold text-sm">
                <Flame className="w-4 h-4 fill-amber-400" />
                <span>{currentUser?.streakDays || 0}d</span>
              </div>
              <span className="text-[10px] text-slate-400 light:text-slate-600 uppercase font-semibold">Streak</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 light:bg-white border border-white/10 light:border-slate-200 text-center flex-1 sm:flex-none min-w-[100px] shadow-sm">
              <div className="flex items-center justify-center gap-1 text-emerald-400 light:text-emerald-600 font-bold text-sm">
                <Award className="w-4 h-4" />
                <span>Lvl {currentUser?.level || 1}</span>
              </div>
              <span className="text-[10px] text-slate-400 light:text-slate-600 uppercase font-semibold">{currentUser?.xp || 0} XP</span>
            </div>

            <button
              onClick={() => setCurrentTab('settings')}
              className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-gradient-to-r from-brand-purple to-brand-pink text-white font-bold text-xs hover:opacity-95 shadow-lg shadow-brand-purple/25 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <User className="w-4 h-4" />
              <span>Personalize Profile</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. QUICK ACCESS LEARNING TOOLS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-extrabold text-white light:text-slate-900 flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-brand-pink" />
            <span>Learning Tools & Quick Access</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Sticky Notes */}
          <div
            onClick={() => setCurrentTab('notes')}
            className="p-5 rounded-3xl bg-white/[0.04] light:bg-white border border-white/10 light:border-slate-200 hover:border-amber-400/60 transition-all cursor-pointer group space-y-3 shadow-lg flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-400">
                  <StickyIcon className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20">
                  {notes.length} Notes
                </span>
              </div>
              <h3 className="font-extrabold text-base text-white light:text-slate-900 group-hover:text-amber-400 transition-colors">
                Sticky Notes Board
              </h3>
              <p className="text-xs text-slate-400 light:text-slate-600 leading-relaxed">
                Organize chapter bullet points, definitions, formulas, and export clean PDF/PNG note sheets.
              </p>
            </div>
            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform">
              <span>Open Sticky Board</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Card 2: Flashcards */}
          <div
            onClick={() => setCurrentTab('flashcards')}
            className="p-5 rounded-3xl bg-white/[0.04] light:bg-white border border-white/10 light:border-slate-200 hover:border-purple-400/60 transition-all cursor-pointer group space-y-3 shadow-lg flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-2xl bg-purple-400/15 border border-purple-400/30 flex items-center justify-center text-purple-400">
                  <Layers className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-400/10 text-purple-400 border border-purple-400/20">
                  {flashcards.length} Cards
                </span>
              </div>
              <h3 className="font-extrabold text-base text-white light:text-slate-900 group-hover:text-purple-400 transition-colors">
                Flashcards Hub
              </h3>
              <p className="text-xs text-slate-400 light:text-slate-600 leading-relaxed">
                Active recall study mode with interactive flip cards generated automatically from your notes.
              </p>
            </div>
            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-bold text-purple-400 group-hover:translate-x-1 transition-transform">
              <span>Study Flashcards</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Card 3: Ask AI Tutor */}
          <div
            onClick={() => setCurrentTab('chat')}
            className="p-5 rounded-3xl bg-white/[0.04] light:bg-white border border-white/10 light:border-slate-200 hover:border-brand-pink/60 transition-all cursor-pointer group space-y-3 shadow-lg flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-2xl bg-brand-pink/15 border border-brand-pink/30 flex items-center justify-center text-brand-pink">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-pink/10 text-brand-pink border border-brand-pink/20">
                  AI Tutor
                </span>
              </div>
              <h3 className="font-extrabold text-base text-white light:text-slate-900 group-hover:text-brand-pink transition-colors">
                Ask Notiq AI
              </h3>
              <p className="text-xs text-slate-400 light:text-slate-600 leading-relaxed">
                Interactive AI chat assistant to solve textbook doubts, explain tough concepts, and simplify answers.
              </p>
            </div>
            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-bold text-brand-pink group-hover:translate-x-1 transition-transform">
              <span>Chat with AI</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Card 4: Upload PDF / Image OCR */}
          <div
            onClick={() => setCurrentTab('upload')}
            className="p-5 rounded-3xl bg-white/[0.04] light:bg-white border border-white/10 light:border-slate-200 hover:border-sky-400/60 transition-all cursor-pointer group space-y-3 shadow-lg flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-2xl bg-sky-400/15 border border-sky-400/30 flex items-center justify-center text-sky-400">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-400/10 text-sky-400 border border-sky-400/20">
                  Hindi / English
                </span>
              </div>
              <h3 className="font-extrabold text-base text-white light:text-slate-900 group-hover:text-sky-400 transition-colors">
                Upload PDF & Handwritten Notes
              </h3>
              <p className="text-xs text-slate-400 light:text-slate-600 leading-relaxed">
                Upload lecture slides, textbook PDFs, or scanned notes for high-accuracy OCR text extraction.
              </p>
            </div>
            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-bold text-sky-400 group-hover:translate-x-1 transition-transform">
              <span>Upload Document</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Card 5: Encrypted Vault */}
          <div
            onClick={() => setCurrentTab('vault')}
            className="p-5 rounded-3xl bg-white/[0.04] light:bg-white border border-white/10 light:border-slate-200 hover:border-rose-400/60 transition-all cursor-pointer group space-y-3 shadow-lg flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-2xl bg-rose-400/15 border border-rose-400/30 flex items-center justify-center text-rose-400">
                  <Lock className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-400/10 text-rose-400 border border-rose-400/20">
                  AES-256
                </span>
              </div>
              <h3 className="font-extrabold text-base text-white light:text-slate-900 group-hover:text-rose-400 transition-colors">
                Encrypted Private Vault
              </h3>
              <p className="text-xs text-slate-400 light:text-slate-600 leading-relaxed">
                Lock sensitive exam notes, research data, and personal documents behind PIN security.
              </p>
            </div>
            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-bold text-rose-400 group-hover:translate-x-1 transition-transform">
              <span>Access Private Vault</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Card 6: Quiz Hub */}
          <div
            onClick={() => setCurrentTab('quiz')}
            className="p-5 rounded-3xl bg-white/[0.04] light:bg-white border border-white/10 light:border-slate-200 hover:border-pink-400/60 transition-all cursor-pointer group space-y-3 shadow-lg flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-2xl bg-pink-400/15 border border-pink-400/30 flex items-center justify-center text-pink-400">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-pink-400/10 text-pink-400 border border-pink-400/20">
                  {quiz.length} Questions
                </span>
              </div>
              <h3 className="font-extrabold text-base text-white light:text-slate-900 group-hover:text-pink-400 transition-colors">
                Quiz & Self-Assessment Hub
              </h3>
              <p className="text-xs text-slate-400 light:text-slate-600 leading-relaxed">
                Take automated MCQs and viva knowledge checks to test your recall before exams.
              </p>
            </div>
            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-bold text-pink-400 group-hover:translate-x-1 transition-transform">
              <span>Start Practice Quiz</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </section>

      {/* 3. DEMO SAMPLE DOCUMENTS SECTION */}
      <section className="space-y-4 pt-4">
        <div className="text-left space-y-1">
          <h2 className="text-xl sm:text-2xl font-extrabold text-white light:text-slate-900">
            Interactive <span className="gradient-text">Study Demos</span>
          </h2>
          <p className="text-xs text-slate-400 light:text-slate-600">
            Test Notiq AI features instantly with pre-loaded textbook chapters in English and Hindi.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SAMPLE_DOCUMENTS.map((doc) => (
            <div
              key={doc.id}
              onClick={() => loadSampleDocument(doc.id)}
              className="p-5 rounded-3xl bg-white/[0.04] light:bg-white border border-white/10 light:border-slate-200 hover:border-brand-pink/60 transition-all cursor-pointer group space-y-3 shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-brand-pink uppercase tracking-wider">{doc.category}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/5 light:bg-slate-100 text-slate-300 light:text-slate-700 border border-white/10 light:border-slate-200">
                    {doc.language === 'hi' ? 'Hindi (हिंदी)' : 'English'}
                  </span>
                </div>
                <h3 className="font-extrabold text-sm text-white light:text-slate-900 group-hover:text-brand-pink transition-colors line-clamp-1">
                  {doc.title}
                </h3>
                <p className="text-xs text-slate-400 light:text-slate-600 line-clamp-2 mt-1.5 leading-relaxed">
                  {doc.description}
                </p>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-bold text-brand-pink group-hover:translate-x-1 transition-transform">
                <span>Load Sample Notes</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};
