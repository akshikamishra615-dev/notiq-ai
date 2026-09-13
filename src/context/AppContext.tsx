import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { 
  StickyNote, 
  Flashcard, 
  QuizQuestion, 
  AIHighlight, 
  MindMapNode, 
  DocumentSession, 
  AppSettings, 
  NavigationTab, 
  StickyColor, 
  Priority,
  WorkspaceInfo,
  Language,
  SummaryMode
} from '../types';
import { SAMPLE_DOCUMENTS } from '../services/sampleData';
import { generateStickyNotesFromText } from '../services/aiService';
import { useAuth } from './AuthContext';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  currentTab: NavigationTab;
  setCurrentTab: (tab: NavigationTab) => void;
  currentSession: DocumentSession | null;
  sessions: DocumentSession[];
  notes: StickyNote[];
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
  highlights: AIHighlight[];
  mindMap: MindMapNode | null;
  settings: AppSettings;
  isProcessing: boolean;
  processingProgress: number;
  processingStatus: string;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterTopic: string;
  setFilterTopic: (topic: string) => void;
  filterPriority: Priority | 'all';
  setFilterPriority: (p: Priority | 'all') => void;
  filterColor: StickyColor | 'all';
  setFilterColor: (c: StickyColor | 'all') => void;
  filterPinnedOnly: boolean;
  setFilterPinnedOnly: (val: boolean) => void;
  boardViewMode: 'grid' | 'canvas';
  setBoardViewMode: (mode: 'grid' | 'canvas') => void;
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;

  // Workspace Isolation & Multi-User Management
  workspaces: WorkspaceInfo[];
  activeWorkspace: WorkspaceInfo;
  switchWorkspace: (workspaceId: string) => void;
  createNewWorkspace: (profile: string | Partial<WorkspaceInfo>, avatar?: string) => string;
  renameWorkspace: (workspaceId: string, newName: string) => void;
  updateActiveWorkspaceProfile: (partial: Partial<WorkspaceInfo>) => void;
  deleteWorkspace: (workspaceId: string) => void;

  // Actions
  createNewSession: (session: DocumentSession) => void;
  loadSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  updateNote: (noteId: string, partial: Partial<StickyNote>) => void;
  deleteNote: (noteId: string) => void;
  addNote: (note: Partial<StickyNote>) => void;
  duplicateNote: (noteId: string) => void;
  togglePin: (noteId: string) => void;
  changeNoteColor: (noteId: string, color: StickyColor) => void;
  setNotePosition: (noteId: string, x: number, y: number) => void;
  toggleFlashcardMastery: (cardId: string) => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  changeSessionLanguage: (newLang: Language) => Promise<void>;
  changeSessionCategory: (newCategory: SummaryMode) => Promise<void>;
  resetAllData: () => void;
  loadSampleDocument: (sampleDocId: string) => Promise<void>;
  startProcessing: (status: string) => void;
  updateProgress: (percent: number, status: string) => void;
  endProcessing: () => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  language: 'auto',
  defaultSummaryMode: 'quick-revision',
  defaultColor: 'purple',
  fontSize: 'base',
  customApiKey: '',
  customApiProvider: 'gemini',
  autoPlayVoice: false,
};

const DEFAULT_INITIAL_WORKSPACE: WorkspaceInfo = {
  id: 'ws-personal-default',
  fullName: 'Personal',
  name: 'Personal Workspace',
  email: '',
  avatar: '🎓',
  role: 'Student',
  institution: '',
  course: '',
  city: '',
  studyGoal: '30 Mins',
  language: 'auto',
  theme: 'dark',
  createdAt: new Date().toISOString(),
  lastActiveAt: new Date().toISOString(),
  level: 1,
  xp: 0,
  streakDays: 0,
  lastActiveDate: new Date().toISOString().split('T')[0],
};

const AppContext = createContext<AppContextType | undefined>(undefined);

const createPersonalWorkspaceForUser = (user: { id: string; name: string; email: string; avatar?: string; level?: number; xp?: number; streakDays?: number }): WorkspaceInfo => ({
  id: `ws-${user.id}-personal`,
  fullName: user.name || 'Scholar',
  name: `${user.name || 'Personal'}'s Workspace`,
  email: user.email || '',
  avatar: user.avatar || '🎓',
  role: 'Student',
  institution: '',
  course: '',
  city: '',
  studyGoal: '30 Mins',
  language: 'auto',
  theme: 'dark',
  createdAt: new Date().toISOString(),
  lastActiveAt: new Date().toISOString(),
  level: user.level || 1,
  xp: user.xp || 0,
  streakDays: user.streakDays || 0,
  lastActiveDate: new Date().toISOString().split('T')[0],
});

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser, isAuthenticated } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavigationTab>('home');

  const userId = isAuthenticated && currentUser ? currentUser.id : null;

  // Workspaces Directory Management (Namespaced by userId)
  const [workspaces, setWorkspaces] = useState<WorkspaceInfo[]>(() => {
    if (!userId || !currentUser) return [];
    try {
      const userWsKey = `notiq_user_${userId}_workspaces_v7`;
      const saved = localStorage.getItem(userWsKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return [createPersonalWorkspaceForUser(currentUser)];
    } catch {
      return [createPersonalWorkspaceForUser(currentUser)];
    }
  });

  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>(() => {
    if (!userId || !currentUser) return '';
    try {
      const activeKey = `notiq_user_${userId}_active_workspace_id_v7`;
      const active = localStorage.getItem(activeKey);
      if (active && workspaces.some(w => w.id === active)) return active;
      return workspaces[0]?.id || `ws-${userId}-personal`;
    } catch {
      return workspaces[0]?.id || `ws-${userId}-personal`;
    }
  });

  // Update Workspaces when active user changes (e.g. Login / Logout / Account Switch)
  useEffect(() => {
    if (!userId || !currentUser) {
      setWorkspaces([]);
      setActiveWorkspaceId('');
      return;
    }

    const userWsKey = `notiq_user_${userId}_workspaces_v7`;
    const userActiveWsKey = `notiq_user_${userId}_active_workspace_id_v7`;

    try {
      const savedWs = localStorage.getItem(userWsKey);
      let loadedWorkspaces: WorkspaceInfo[] = [];
      if (savedWs) {
        const parsed = JSON.parse(savedWs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          loadedWorkspaces = parsed;
        }
      }

      if (loadedWorkspaces.length === 0) {
        loadedWorkspaces = [createPersonalWorkspaceForUser(currentUser)];
      }

      setWorkspaces(loadedWorkspaces);

      const savedActiveId = localStorage.getItem(userActiveWsKey);
      if (savedActiveId && loadedWorkspaces.some(w => w.id === savedActiveId)) {
        setActiveWorkspaceId(savedActiveId);
      } else {
        setActiveWorkspaceId(loadedWorkspaces[0].id);
      }
    } catch (e) {
      console.warn('Failed to load user workspace directory:', e);
      const defaultWs = createPersonalWorkspaceForUser(currentUser);
      setWorkspaces([defaultWs]);
      setActiveWorkspaceId(defaultWs.id);
    }
  }, [userId, currentUser?.id]);

  // Sync Workspaces directory & active workspace ID for active user
  useEffect(() => {
    if (!userId) return;
    try {
      localStorage.setItem(`notiq_user_${userId}_workspaces_v7`, JSON.stringify(workspaces));
      if (activeWorkspaceId) {
        localStorage.setItem(`notiq_user_${userId}_active_workspace_id_v7`, activeWorkspaceId);
      }
    } catch (e) {
      console.warn('Failed to sync user workspaces:', e);
    }
  }, [workspaces, activeWorkspaceId, userId]);

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0] || (currentUser ? createPersonalWorkspaceForUser(currentUser) : DEFAULT_INITIAL_WORKSPACE);

  // Storage Keys Namespaced by User ID & Active Workspace ID
  const wsVaultKey = userId && activeWorkspaceId ? `notiq_user_${userId}_ws_${activeWorkspaceId}_vault` : '';
  const wsNotesKey = userId && activeWorkspaceId ? `notiq_user_${userId}_ws_${activeWorkspaceId}_notes` : '';
  const wsFlashcardsKey = userId && activeWorkspaceId ? `notiq_user_${userId}_ws_${activeWorkspaceId}_flashcards` : '';
  const wsQuizKey = userId && activeWorkspaceId ? `notiq_user_${userId}_ws_${activeWorkspaceId}_quiz` : '';
  const wsSettingsKey = userId && activeWorkspaceId ? `notiq_user_${userId}_ws_${activeWorkspaceId}_settings` : '';

  const [sessions, setSessions] = useState<DocumentSession[]>(() => {
    if (!wsVaultKey) return [];
    try {
      const saved = localStorage.getItem(wsVaultKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [currentSession, setCurrentSession] = useState<DocumentSession | null>(null);
  const [notes, setNotes] = useState<StickyNote[]>(() => {
    if (!wsNotesKey) return [];
    try {
      const saved = localStorage.getItem(wsNotesKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [flashcards, setFlashcards] = useState<Flashcard[]>(() => {
    if (!wsFlashcardsKey) return [];
    try {
      const saved = localStorage.getItem(wsFlashcardsKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [quiz, setQuiz] = useState<QuizQuestion[]>(() => {
    if (!wsQuizKey) return [];
    try {
      const saved = localStorage.getItem(wsQuizKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [highlights, setHighlights] = useState<AIHighlight[]>([]);
  const [mindMap, setMindMap] = useState<MindMapNode | null>(null);

  const [settings, setSettings] = useState<AppSettings>(() => {
    if (!wsSettingsKey) return DEFAULT_SETTINGS;
    try {
      const saved = localStorage.getItem(wsSettingsKey);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState('');

  // Filters & Board Options
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTopic, setFilterTopic] = useState('all');
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
  const [filterColor, setFilterColor] = useState<StickyColor | 'all'>('all');
  const [filterPinnedOnly, setFilterPinnedOnly] = useState(false);
  const [boardViewMode, setBoardViewMode] = useState<'grid' | 'canvas'>('grid');

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Reload Workspace Data when active workspace changes
  useEffect(() => {
    if (!userId || !activeWorkspaceId) {
      setSessions([]);
      setNotes([]);
      setFlashcards([]);
      setQuiz([]);
      setSettings(DEFAULT_SETTINGS);
      setCurrentSession(null);
      setHighlights([]);
      setMindMap(null);
      return;
    }

    try {
      const loadedSessions = localStorage.getItem(`notiq_user_${userId}_ws_${activeWorkspaceId}_vault`);
      const loadedNotes = localStorage.getItem(`notiq_user_${userId}_ws_${activeWorkspaceId}_notes`);
      const loadedFlashcards = localStorage.getItem(`notiq_user_${userId}_ws_${activeWorkspaceId}_flashcards`);
      const loadedQuiz = localStorage.getItem(`notiq_user_${userId}_ws_${activeWorkspaceId}_quiz`);
      const loadedSettings = localStorage.getItem(`notiq_user_${userId}_ws_${activeWorkspaceId}_settings`);

      setSessions(loadedSessions ? JSON.parse(loadedSessions) : []);
      setNotes(loadedNotes ? JSON.parse(loadedNotes) : []);
      setFlashcards(loadedFlashcards ? JSON.parse(loadedFlashcards) : []);
      setQuiz(loadedQuiz ? JSON.parse(loadedQuiz) : []);
      setSettings(loadedSettings ? { ...DEFAULT_SETTINGS, ...JSON.parse(loadedSettings) } : DEFAULT_SETTINGS);
      setCurrentSession(null);
      setHighlights([]);
      setMindMap(null);
    } catch (e) {
      console.warn('Failed to load workspace isolated data:', e);
    }
  }, [userId, activeWorkspaceId]);

  // Sync active workspace notes & vault to localStorage
  useEffect(() => {
    if (!userId || !activeWorkspaceId || !wsNotesKey) return;
    try {
      localStorage.setItem(wsNotesKey, JSON.stringify(notes));
      localStorage.setItem(wsVaultKey, JSON.stringify(sessions));
      localStorage.setItem(wsFlashcardsKey, JSON.stringify(flashcards));
      localStorage.setItem(wsQuizKey, JSON.stringify(quiz));
      localStorage.setItem(wsSettingsKey, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to sync isolated workspace data:', e);
    }
  }, [notes, sessions, flashcards, quiz, settings, userId, activeWorkspaceId, wsNotesKey, wsVaultKey, wsFlashcardsKey, wsQuizKey, wsSettingsKey]);

  // Synchronize theme with DOM documentElement (dark vs light)
  useEffect(() => {
    const isLight = settings.theme === 'light';
    if (isLight) {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  }, [settings.theme]);

  // WORKSPACE MANAGEMENT ACTIONS
  const switchWorkspace = (workspaceId: string) => {
    const target = workspaces.find(w => w.id === workspaceId);
    if (target) {
      setActiveWorkspaceId(target.id);
      showToast(`Switched to workspace: ${target.name}`, 'success');
    }
  };

  const createNewWorkspace = (profileArg: string | Partial<WorkspaceInfo>, avatarArg = '🎓'): string => {
    const profile: Partial<WorkspaceInfo> = typeof profileArg === 'string' 
      ? { name: profileArg, avatar: avatarArg } 
      : profileArg;

    const wsId = `ws-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newWs: WorkspaceInfo = {
      id: wsId,
      fullName: profile.fullName?.trim() || 'Scholar',
      name: profile.name?.trim() || `${profile.fullName || 'Personal'}'s Workspace`,
      email: profile.email?.trim() || '',
      avatar: profile.avatar || avatarArg || '🎓',
      role: profile.role || 'Student',
      institution: profile.institution || '',
      course: profile.course || '',
      city: profile.city || '',
      studyGoal: profile.studyGoal || '1 Hour',
      language: profile.language || 'auto',
      theme: profile.theme || 'dark',
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      level: 1,
      xp: 0,
      streakDays: 0,
      lastActiveDate: new Date().toISOString().split('T')[0],
    };

    setWorkspaces(prev => [...prev, newWs]);
    setActiveWorkspaceId(newWs.id);
    showToast(`Created workspace: ${newWs.name}`, 'success');
    return newWs.id;
  };

  const renameWorkspace = (workspaceId: string, newName: string) => {
    if (!newName.trim()) return;
    setWorkspaces(prev => prev.map(w => w.id === workspaceId ? { ...w, name: newName.trim() } : w));
    showToast('Workspace renamed successfully.', 'info');
  };

  const updateActiveWorkspaceProfile = (partial: Partial<WorkspaceInfo>) => {
    setWorkspaces(prev => prev.map(w => w.id === activeWorkspaceId ? { ...w, ...partial, lastActiveAt: new Date().toISOString() } : w));
    showToast('Updated active workspace profile!', 'info');
  };

  const deleteWorkspace = (workspaceId: string) => {
    if (workspaces.length <= 1) {
      showToast('Cannot delete the only workspace. Create a new one first.', 'error');
      return;
    }

    try {
      localStorage.removeItem(`notiq_ws_${workspaceId}_vault`);
      localStorage.removeItem(`notiq_ws_${workspaceId}_notes`);
      localStorage.removeItem(`notiq_ws_${workspaceId}_flashcards`);
      localStorage.removeItem(`notiq_ws_${workspaceId}_quiz`);
      localStorage.removeItem(`notiq_ws_${workspaceId}_settings`);
    } catch (e) {
      console.warn('Error clearing workspace keys:', e);
    }

    const remaining = workspaces.filter(w => w.id !== workspaceId);
    setWorkspaces(remaining);
    if (activeWorkspaceId === workspaceId) {
      setActiveWorkspaceId(remaining[0].id);
    }
    showToast('Workspace deleted successfully.', 'info');
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const changeSessionLanguage = async (newLang: Language) => {
    updateSettings({ language: newLang });
    if (!currentSession || !currentSession.rawText) return;

    startProcessing(`Regenerating AI Study Notes in ${newLang === 'hi' ? 'Hindi' : newLang === 'en' ? 'English' : 'Auto Mode'}...`);
    try {
      updateProgress(40, 'Re-synthesizing AI study notes...');
      const generatedResult = await generateStickyNotesFromText(
        currentSession.rawText,
        currentSession.fileName,
        currentSession.summaryMode || 'quick-revision',
        newLang
      );

      setNotes(generatedResult.notes);
      setFlashcards(generatedResult.flashcards);
      setQuiz(generatedResult.quiz);
      setHighlights(generatedResult.highlights);
      if (generatedResult.mindMap) setMindMap(generatedResult.mindMap);

      setCurrentSession(prev => prev ? {
        ...prev,
        language: newLang,
        storyNarrative: generatedResult.storyNarrative,
        notes: generatedResult.notes,
        flashcards: generatedResult.flashcards,
        quiz: generatedResult.quiz,
      } : null);

      endProcessing();
      showToast(`AI Study Notes regenerated in ${newLang === 'hi' ? 'Hindi' : newLang === 'en' ? 'English' : 'Auto Mode'}!`, 'success');
    } catch (e) {
      endProcessing();
      showToast('Language update failed. Please try again.', 'error');
    }
  };

  const changeSessionCategory = async (newCategory: SummaryMode) => {
    if (!currentSession || !currentSession.rawText) return;

    startProcessing(`Formulating AI Notes for category: ${newCategory}...`);
    try {
      updateProgress(40, `Formatting notes for category ${newCategory}...`);
      const generatedResult = await generateStickyNotesFromText(
        currentSession.rawText,
        currentSession.fileName,
        newCategory,
        currentSession.language || settings.language || 'auto'
      );

      setNotes(generatedResult.notes);
      setFlashcards(generatedResult.flashcards);
      setQuiz(generatedResult.quiz);
      setHighlights(generatedResult.highlights);
      if (generatedResult.mindMap) setMindMap(generatedResult.mindMap);

      setCurrentSession(prev => prev ? {
        ...prev,
        summaryMode: newCategory,
        notes: generatedResult.notes,
        flashcards: generatedResult.flashcards,
        quiz: generatedResult.quiz,
      } : null);

      endProcessing();
      showToast(`AI Notes regenerated in ${newCategory.replace('-', ' ')} category!`, 'success');
    } catch (e) {
      endProcessing();
      showToast('Category switch failed. Please try again.', 'error');
    }
  };

  const startProcessing = (status: string) => {
    setIsProcessing(true);
    setProcessingProgress(10);
    setProcessingStatus(status);
  };

  const updateProgress = (percent: number, status: string) => {
    setProcessingProgress(percent);
    setProcessingStatus(status);
  };

  const endProcessing = () => {
    setIsProcessing(false);
    setProcessingProgress(100);
  };

  const createNewSession = (session: DocumentSession) => {
    setSessions(prev => [session, ...prev]);
    setCurrentSession(session);
    setNotes(session.notes);
    setFlashcards(session.flashcards);
    setQuiz(session.quiz);
    setHighlights(session.highlights);
    setMindMap(session.mindMap || null);
    showToast(`Loaded ${session.fileName} into your active workspace.`, 'success');
  };

  const loadSession = (sessionId: string) => {
    const found = sessions.find(s => s.id === sessionId);
    if (found) {
      setCurrentSession(found);
      setNotes(found.notes);
      setFlashcards(found.flashcards);
      setQuiz(found.quiz);
      setHighlights(found.highlights);
      setMindMap(found.mindMap || null);
      showToast(`Loaded document: ${found.fileName}`, 'info');
    }
  };

  const deleteSession = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSession?.id === sessionId) {
      setCurrentSession(null);
      setNotes([]);
      setFlashcards([]);
      setQuiz([]);
      setHighlights([]);
      setMindMap(null);
    }
    showToast('Document session deleted.', 'info');
  };

  const addNote = (partialNote: Partial<StickyNote>) => {
    const newNote: StickyNote = {
      id: `note-${Date.now()}-${Math.random()}`,
      title: partialNote.title || 'Quick AI Note',
      summary: partialNote.summary || 'Summary placeholder',
      bullets: partialNote.bullets || [],
      keywords: partialNote.keywords || [],
      color: partialNote.color || settings.defaultColor || 'purple',
      priority: partialNote.priority || 'medium',
      topic: partialNote.topic || 'General',
      chapter: partialNote.chapter,
      section: partialNote.section,
      pinned: partialNote.pinned || false,
      createdAt: new Date().toISOString(),
    };
    setNotes(prev => [newNote, ...prev]);
    showToast('Added note to workspace.', 'success');
  };

  const updateNote = (noteId: string, partial: Partial<StickyNote>) => {
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, ...partial, updatedAt: new Date().toISOString() } : n));
  };

  const deleteNote = (noteId: string) => {
    setNotes(prev => prev.filter(n => n.id !== noteId));
    showToast('Sticky note deleted.', 'info');
  };

  const duplicateNote = (noteId: string) => {
    const target = notes.find(n => n.id === noteId);
    if (!target) return;
    const copy: StickyNote = {
      ...target,
      id: `note-${Date.now()}-${Math.random()}`,
      title: `${target.title} (Copy)`,
      pinned: false,
      createdAt: new Date().toISOString(),
    };
    setNotes(prev => [copy, ...prev]);
    showToast('Duplicated sticky note.', 'success');
  };

  const togglePin = (noteId: string) => {
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, pinned: !n.pinned } : n));
  };

  const changeNoteColor = (noteId: string, color: StickyColor) => {
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, color } : n));
  };

  const setNotePosition = (noteId: string, x: number, y: number) => {
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, x, y } : n));
  };

  const toggleFlashcardMastery = (cardId: string) => {
    setFlashcards(prev => prev.map(f => {
      if (f.id === cardId) {
        return { ...f, mastered: !f.mastered };
      }
      return f;
    }));
  };

  const resetAllData = () => {
    setNotes([]);
    setSessions([]);
    setFlashcards([]);
    setQuiz([]);
    setHighlights([]);
    setMindMap(null);
    setCurrentSession(null);
    try {
      localStorage.removeItem(wsVaultKey);
      localStorage.removeItem(wsNotesKey);
      localStorage.removeItem(wsFlashcardsKey);
      localStorage.removeItem(wsQuizKey);
    } catch (e) {
      console.warn('Reset error:', e);
    }
    showToast('Active workspace reset to clean state.', 'info');
  };

  const loadSampleDocument = async (sampleDocId: string) => {
    const sample = SAMPLE_DOCUMENTS.find(s => s.id === sampleDocId) || SAMPLE_DOCUMENTS[0];
    startProcessing(`Extracting AI sticky notes from ${sample.title}...`);

    try {
      updateProgress(40, 'Analyzing document structure...');
      const generatedResult = await generateStickyNotesFromText(
        sample.text, 
        sample.title,
        sample.defaultMode, 
        sample.language
      );
      const generatedNotes = generatedResult.notes;

      updateProgress(80, 'Creating active recall flashcards & quiz MCQs...');
      const sampleFlashcards: Flashcard[] = generatedNotes.slice(0, 3).map((gn, idx) => ({
        id: `fc-sample-${idx}`,
        question: `What is the core takeaway of ${gn.title}?`,
        answer: gn.summary,
        topic: gn.topic,
        mastered: false,
      }));

      const sampleQuiz: QuizQuestion[] = generatedNotes.slice(0, 2).map((gn, idx) => ({
        id: `qz-sample-${idx}`,
        question: `Regarding ${gn.title}: ${gn.bullets[0] || gn.summary}`,
        options: [
          gn.summary.slice(0, 40),
          'Incorrect alternative explanation B',
          'Incorrect alternative explanation C',
          'Incorrect alternative option D',
        ],
        correctIndex: 0,
        explanation: `Correct! ${gn.summary}`,
        topic: gn.topic,
      }));

      const session: DocumentSession = {
        id: `session-sample-${Date.now()}`,
        fileName: sample.title,
        fileType: 'pdf',
        fileSize: 95000,
        uploadedAt: new Date().toISOString(),
        summaryMode: sample.defaultMode,
        language: sample.language,
        rawText: sample.text,
        notes: generatedNotes,
        flashcards: sampleFlashcards,
        quiz: sampleQuiz,
        highlights: [],
        mindMap: undefined,
      };

      endProcessing();
      createNewSession(session);
      setCurrentTab('notes');
    } catch (e) {
      endProcessing();
      showToast('Sample document load failed. Please try again.', 'error');
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentTab,
        setCurrentTab,
        currentSession,
        sessions,
        notes,
        flashcards,
        quiz,
        highlights,
        mindMap,
        settings,
        isProcessing,
        processingProgress,
        processingStatus,
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
        setBoardViewMode,
        toasts,
        showToast,
        removeToast,
        workspaces,
        activeWorkspace,
        switchWorkspace,
        createNewWorkspace,
        renameWorkspace,
        updateActiveWorkspaceProfile,
        deleteWorkspace,
        createNewSession,
        loadSession,
        deleteSession,
        updateNote,
        deleteNote,
        addNote,
        duplicateNote,
        togglePin,
        changeNoteColor,
        setNotePosition,
        toggleFlashcardMastery,
        updateSettings,
        changeSessionLanguage,
        changeSessionCategory,
        resetAllData,
        loadSampleDocument,
        startProcessing,
        updateProgress,
        endProcessing,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
