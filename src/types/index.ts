export type SummaryMode = 
  | 'smart-summary'
  | 'quick-revision'
  | 'important-points'
  | 'viva-prep'
  | 'exam-2mark'
  | 'exam-5mark'
  | 'exam-10mark'
  | 'definitions-keywords'
  | 'formulas-facts'
  | 'mcq-practice'
  | 'detailed'
  | 'story';

export type StickyColor = 
  | 'purple' 
  | 'pink' 
  | 'yellow' 
  | 'blue' 
  | 'green' 
  | 'orange';

export type Priority = 'high' | 'medium' | 'low';

export type Language = 'en' | 'hi' | 'hinglish' | 'auto';

export interface StickyNote {
  id: string;
  title: string;
  summary: string;
  bullets: string[];
  keywords: string[];
  color: StickyColor;
  priority: Priority;
  topic: string;
  chapter?: string;
  section?: string;
  pinned: boolean;
  x?: number;
  y?: number;
  rotation?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  topic: string;
  category?: string;
  mastered: boolean;
}

export type QuizType = 'mcq' | 'true-false' | 'fill-blanks' | 'short-answer';

export interface QuizQuestion {
  id: string;
  question: string;
  type?: QuizType;
  options: string[];
  correctIndex: number;
  explanation: string;
  topic: string;
}

export type HighlightType = 'definition' | 'formula' | 'date' | 'keyword' | 'example';

export interface AIHighlight {
  id: string;
  type: HighlightType;
  title: string;
  text: string;
  context?: string;
}

export interface MindMapNode {
  id: string;
  label: string;
  type: 'root' | 'chapter' | 'topic' | 'point';
  notesCount?: number;
  children?: MindMapNode[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  suggestionPills?: string[];
}

export interface VivaQuestion {
  id: string;
  question: string;
  idealAnswer: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'viva';
  userAnswer?: string;
  feedbackScore?: number;
  aiFeedback?: string;
}

export interface VaultNoteItem {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  category?: string;
}

export interface VaultFolder {
  id: string;
  name: string;
  isLocked: boolean;
  pin?: string;
  notes: VaultNoteItem[];
}

export interface EventItem {
  id: string;
  title: string;
  date: string;
  category: 'exam' | 'birthday' | 'deadline' | 'meeting' | 'personal';
  priority: Priority;
  reminder: boolean;
  notes?: string;
}

export interface DocumentSession {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  summaryMode: SummaryMode;
  language: Language;
  detectedLanguage?: Language;
  rawText: string;
  storyNarrative?: string;
  notes: StickyNote[];
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
  highlights: AIHighlight[];
  mindMap?: MindMapNode;
  chatHistory?: ChatMessage[];
}

export interface AppSettings {
  theme: 'dark' | 'light';
  language: Language;
  hindiFontMode?: 'unicode' | 'krutidev';
  defaultSummaryMode: SummaryMode;
  defaultColor: StickyColor;
  fontSize: 'sm' | 'base' | 'lg';
  customApiKey: string;
  customApiProvider: 'gemini' | 'openai' | 'groq';
  autoPlayVoice: boolean;
}

export type NavigationTab = 
  | 'home' 
  | 'upload' 
  | 'notes' 
  | 'chat'
  | 'viva'
  | 'vault'
  | 'flashcards' 
  | 'quiz' 
  | 'highlights'
  | 'mindmap'
  | 'history'
  | 'progress'
  | 'settings';

/* =========================================================
   MULTI-USER, ENCRYPTION & GAMIFIED PROGRESS TYPES
   ========================================================= */

export interface AchievementBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'notes' | 'quiz' | 'streak' | 'mastery' | 'special';
  unlocked: boolean;
  unlockedAt?: string;
}

export interface QuizResultReport {
  id: string;
  date: string;
  docTitle: string;
  score: number;
  total: number;
  percentage: number;
  xpEarned: number;
  aiComment: string;
  feedbackCategory: 'grandmaster' | 'master' | 'proficient' | 'improving' | 'needs-review';
  strengths: string[];
  weaknesses: string[];
}

export interface UserStats {
  totalNotesCreated: number;
  totalQuizzesTaken: number;
  totalFlashcardsMastered: number;
  totalDocsUploaded: number;
  quizAverageScore: number;
  studyTimeMinutes: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
  lastLogin: string;
  lastActiveDate: string;
  xp: number;
  level: number;
  streakDays: number;
  userType?: 'School Student' | 'College Student' | 'Professional' | 'Other Learner' | string;
  classGrade?: string;
  course?: string;
  institution?: string;
  semester?: string;
  academicYear?: string;
  subjects?: string[];
  preferredLanguage?: Language;
  learningGoals?: string;
  badges: AchievementBadge[];
  quizHistory: QuizResultReport[];
  stats: UserStats;
  isGuest?: boolean;
  onboardingCompleted?: boolean;
  emailVerified?: boolean;
  studyGoalMinutes?: number;
  appLockPin?: string;
}

export interface WorkspaceInfo {
  id: string;
  fullName: string;
  name: string;
  email?: string;
  avatar: string;
  role?: string;
  institution?: string;
  course?: string;
  city?: string;
  studyGoal?: string;
  language: Language;
  theme: 'dark' | 'light';
  createdAt: string;
  lastActiveAt: string;
  level: number;
  xp: number;
  streakDays: number;
  lastActiveDate: string;
}

export interface SecurityAuditReport {
  algorithm: string;
  keyLength: number;
  pbkdf2Iterations: number;
  isEncrypted: boolean;
  zeroKnowledge: boolean;
  vaultIntegrity: 'secure' | 'warning' | 'unencrypted';
  passwordStrengthScore: number;
  passwordStrengthLabel: 'Weak' | 'Fair' | 'Strong' | 'Military-Grade';
  securityChecks: {
    label: string;
    passed: boolean;
    detail: string;
  }[];
}
