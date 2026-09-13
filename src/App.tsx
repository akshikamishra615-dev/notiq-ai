import React, { useState, useEffect } from 'react';
import { useApp } from './context/AppContext';
import { useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { HomeView } from './components/HomeView';
import { UploadView } from './components/UploadView';
import { StickyBoardView } from './components/StickyBoardView';
import { AskAIChatView } from './components/AskAIChatView';
import { PrivateVaultView } from './components/PrivateVaultView';
import { FlashcardsView } from './components/FlashcardsView';
import { QuizView } from './components/QuizView';
import { HighlightsMindMapView } from './components/HighlightsMindMapView';
import { ProgressDashboardView } from './components/ProgressDashboardView';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { ProgressBarModal } from './components/ProgressBarModal';
import { ToastContainer } from './components/ToastContainer';
import { SecurityAuditModal } from './components/SecurityAuditModal';
import { OnboardingModal } from './components/OnboardingModal';
import { LogoutConfirmationModal } from './components/LogoutConfirmationModal';
import { WelcomeLandingPage } from './components/WelcomeLandingPage';
import { WorkspaceSetupModal } from './components/WorkspaceSetupModal';
import { AuthModal } from './components/AuthModal';
import { AuthPage } from './components/AuthPage';

export const App: React.FC = () => {
  const { currentTab, setCurrentTab } = useApp();
  const { isAuthenticated } = useAuth();
  
  // Route / View state: '/', '/login', '/dashboard'
  const [currentPath, setCurrentPath] = useState<string>(() => {
    try {
      const path = window.location.pathname;
      if (path === '/login' || window.location.hash === '#login') return '/login';
      if (path === '/dashboard' || path === '/workspace' || window.location.hash === '#dashboard' || window.location.hash === '#workspace') return '/dashboard';
      return '/';
    } catch {
      return '/';
    }
  });

  const [showWelcomeScreen, setShowWelcomeScreen] = useState(() => currentPath !== '/dashboard' && currentPath !== '/workspace');
  const [showSetupModal, setShowSetupModal] = useState(false);

  // Left Sidebar expanded/collapsed state
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  // Mobile/Tablet menu drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync URL history and listen for browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;

      if (path === '/login' || hash === '#login') {
        setCurrentPath('/login');
        setShowWelcomeScreen(true);
      } else if (path === '/dashboard' || path === '/workspace' || hash === '#dashboard' || hash === '#workspace') {
        if (!isAuthenticated) {
          // Protected route redirect: /dashboard -> /login
          window.history.replaceState(null, '', '/login');
          setCurrentPath('/login');
          setShowWelcomeScreen(true);
        } else {
          setCurrentPath('/dashboard');
          setShowWelcomeScreen(false);
        }
      } else {
        setCurrentPath('/');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isAuthenticated]);

  // Protected route enforcement on auth change
  useEffect(() => {
    if (!isAuthenticated && (currentPath === '/dashboard' || currentPath === '/workspace')) {
      try {
        window.history.replaceState(null, '', '/login');
      } catch {}
      setCurrentPath('/login');
      setShowWelcomeScreen(true);
    }
  }, [isAuthenticated, currentPath]);

  const handleStartApp = () => {
    if (!isAuthenticated) {
      try {
        window.history.pushState(null, '', '/login');
      } catch {}
      setCurrentPath('/login');
    } else {
      try {
        window.history.pushState(null, '', '/dashboard');
      } catch {}
      setCurrentPath('/dashboard');
      setShowWelcomeScreen(false);
    }
  };

  const handleAuthSuccess = () => {
    try {
      window.history.pushState(null, '', '/dashboard');
    } catch {}
    setCurrentPath('/dashboard');
    setShowWelcomeScreen(false);
  };

  const renderCurrentView = () => {
    switch (currentTab) {
      case 'home':
        return <HomeView />;
      case 'upload':
        return <UploadView />;
      case 'chat':
        return <AskAIChatView />;
      case 'vault':
        return <PrivateVaultView />;
      case 'notes':
        return <StickyBoardView />;
      case 'flashcards':
        return <FlashcardsView />;
      case 'quiz':
        return <QuizView />;
      case 'highlights':
      case 'mindmap':
        return <HighlightsMindMapView />;
      case 'progress':
        return <ProgressDashboardView />;
      case 'history':
        return <HistoryView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <HomeView />;
    }
  };

  // 1. DEDICATED /login AUTH PAGE ROUTE
  if (currentPath === '/login' && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0718] light:bg-[#f8f9fe] text-slate-100 light:text-slate-900 flex flex-col justify-between">
        <AuthPage onAuthSuccess={handleAuthSuccess} />
        <ToastContainer />
      </div>
    );
  }

  // 2. PUBLIC LANDING PAGE (OR UNAUTHENTICATED VISITOR)
  if (showWelcomeScreen || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0718] light:bg-[#f8f9fe] text-slate-100 light:text-slate-900 flex flex-col justify-between">
        <WelcomeLandingPage onStart={handleStartApp} />
        <WorkspaceSetupModal
          isOpen={showSetupModal}
          onClose={() => {
            setShowSetupModal(false);
            setShowWelcomeScreen(false);
          }}
        />
        <AuthModal />
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#0c0a15] light:bg-[#f8f9fe] text-slate-100 light:text-slate-900 transition-colors selection:bg-brand-pink/30 selection:text-white">
      
      {/* 1. Left Sidebar Navigation (ChatGPT / Notion style) */}
      <Sidebar
        isExpanded={isSidebarExpanded}
        onToggleExpand={() => setIsSidebarExpanded(!isSidebarExpanded)}
        mobileMenuOpen={mobileMenuOpen}
        onCloseMobileMenu={() => setMobileMenuOpen(false)}
      />

      {/* 2. Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        
        {/* Sticky Top Header with Search & User Profile */}
        <Header onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />

        {/* Main View Area */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {renderCurrentView()}
        </main>

        {/* Footer */}
        <footer className="w-full border-t border-white/10 light:border-slate-200 py-6 bg-[#080611] light:bg-white text-xs text-slate-400 light:text-slate-600 transition-colors">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-brand-purple to-brand-pink flex items-center justify-center text-white font-black text-xs">
                N
              </div>
              <span className="font-bold text-white light:text-slate-900">Notiq AI</span>
              <span>— Ultimate AI Study & Productivity Companion • Learn Smarter. Remember Better.</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 text-slate-400">
              <button onClick={() => setCurrentTab('upload')} className="hover:text-brand-pink cursor-pointer">Upload PDF</button>
              <button onClick={() => setCurrentTab('chat')} className="hover:text-brand-pink cursor-pointer">Ask Sticky AI</button>
              <button onClick={() => setCurrentTab('vault')} className="hover:text-brand-pink cursor-pointer">Private Vault</button>
              <button onClick={() => setCurrentTab('notes')} className="hover:text-brand-pink cursor-pointer">Sticky Board</button>
            </div>
          </div>
        </footer>

      </div>

      {/* Global Modals & Notifications */}
      <ProgressBarModal />
      <ToastContainer />
      <OnboardingModal />
      <LogoutConfirmationModal />
      <SecurityAuditModal />

    </div>
  );
};

export default App;
