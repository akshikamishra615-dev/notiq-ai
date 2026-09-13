import React, { useEffect } from 'react';
import { 
  Sparkles, 
  Upload, 
  StickyNote as StickyIcon, 
  HelpCircle, 
  Clock, 
  Settings as SettingsIcon, 
  Layers,
  Award,
  Bot,
  Lock,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import type { NavigationTab } from '../types';

interface SidebarProps {
  isExpanded: boolean;
  onToggleExpand: () => void;
  mobileMenuOpen: boolean;
  onCloseMobileMenu: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isExpanded,
  onToggleExpand,
  mobileMenuOpen,
  onCloseMobileMenu,
}) => {
  const { currentTab, setCurrentTab, notes, flashcards, quiz, activeWorkspace } = useApp();
  const { currentUser } = useAuth();

  // Prevent underlying body page scrolling when mobile navigation drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const navItems: { id: NavigationTab; label: string; icon: React.ReactNode; badge?: number | string }[] = [
    { id: 'home', label: 'User Dashboard', icon: <Sparkles className="w-4 h-4 text-brand-purple" /> },
    { id: 'upload', label: 'Upload PDF / Image', icon: <Upload className="w-4 h-4 text-sky-400" /> },
    { id: 'chat', label: 'Ask Notiq AI', icon: <Bot className="w-4 h-4 text-brand-pink" />, badge: 'AI' },
    { id: 'notes', label: 'Sticky Board', icon: <StickyIcon className="w-4 h-4 text-amber-400" />, badge: notes.length },
    { id: 'vault', label: 'Encrypted Vault', icon: <Lock className="w-4 h-4 text-rose-400" /> },
    { id: 'flashcards', label: 'Flashcards', icon: <Layers className="w-4 h-4 text-purple-400" />, badge: flashcards.length },
    { id: 'quiz', label: 'Quiz Hub', icon: <HelpCircle className="w-4 h-4 text-pink-400" />, badge: quiz.length },
    { id: 'progress', label: 'Progress & Badges', icon: <Award className="w-4 h-4 text-amber-400" />, badge: `${currentUser?.xp || activeWorkspace?.xp || 0}XP` },
    { id: 'history', label: 'Upload History', icon: <Clock className="w-4 h-4 text-slate-400" /> },
    { id: 'settings', label: 'Profile & Settings', icon: <SettingsIcon className="w-4 h-4 text-slate-400" /> },
  ];

  const handleNavClick = (tab: NavigationTab) => {
    setCurrentTab(tab);
    onCloseMobileMenu();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUserProfileClick = () => {
    setCurrentTab('settings');
    onCloseMobileMenu();
  };

  const isCollapsed = !isExpanded && !mobileMenuOpen;

  return (
    <>
      {/* Mobile Drawer Backdrop Overlay (Highest layer below drawer) */}
      {mobileMenuOpen && (
        <div 
          onClick={onCloseMobileMenu}
          className="fixed inset-0 top-0 left-0 w-full h-full h-[100dvh] bg-black/70 backdrop-blur-sm z-[55] lg:hidden animate-in fade-in duration-200"
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-[60] h-screen h-[100dvh] bg-[#090714] light:bg-white border-r border-white/10 light:border-slate-200 flex flex-col justify-between transition-transform duration-300 select-none lg:sticky lg:top-0 lg:left-0 lg:z-30 lg:h-screen ${
          mobileMenuOpen 
            ? 'translate-x-0 w-72 max-w-[85vw] shadow-2xl' 
            : '-translate-x-full lg:translate-x-0 ' + (isExpanded ? 'w-64' : 'w-20')
        }`}
      >
        {/* Sidebar Header Logo */}
        {isCollapsed ? (
          /* Collapsed Header Layout (Desktop Collapsed only) */
          <div className="py-3 px-2 flex flex-col items-center gap-2.5 border-b border-white/10 light:border-slate-200 shrink-0">
            <div 
              onClick={() => handleNavClick('home')}
              className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-purple to-brand-pink p-0.5 shadow-lg shadow-brand-purple/30 hover:scale-105 transition-transform cursor-pointer shrink-0 flex items-center justify-center"
              title="Notiq AI Home"
            >
              <div className="w-full h-full bg-[#0e0b1c] rounded-[14px] flex items-center justify-center text-white font-extrabold text-lg tracking-tight">
                N
              </div>
            </div>

            <button
              onClick={onToggleExpand}
              className="hidden lg:flex p-1.5 rounded-xl bg-white/5 light:bg-slate-100 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Expand Sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Expanded Header Layout (Mobile Drawer or Desktop Expanded) */
          <div className="p-4 flex items-center justify-between border-b border-white/10 light:border-slate-200 shrink-0">
            <div 
              onClick={() => handleNavClick('home')}
              className="flex items-center gap-3 cursor-pointer overflow-hidden group"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-purple to-brand-pink p-0.5 shadow-lg shadow-brand-purple/30 group-hover:scale-105 transition-transform shrink-0 flex items-center justify-center">
                <div className="w-full h-full bg-[#0e0b1c] rounded-[14px] flex items-center justify-center text-white font-extrabold text-lg tracking-tight">
                  N
                </div>
              </div>

              <div className="flex flex-col truncate">
                <span className="font-black text-lg tracking-tight text-white light:text-slate-900">
                  Notiq<span className="text-brand-pink">AI</span>
                </span>
                <span className="text-[10px] text-slate-400 light:text-slate-600 truncate">Learn Smarter. Remember Better.</span>
              </div>
            </div>

            {/* Desktop Collapse Toggle */}
            <button
              onClick={onToggleExpand}
              className="hidden lg:flex p-1.5 rounded-xl bg-white/5 light:bg-slate-100 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Collapse Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Mobile Close Drawer Button inside Header */}
            <button
              onClick={onCloseMobileMenu}
              className="lg:hidden p-2 rounded-xl bg-white/5 light:bg-slate-100 text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900 transition-colors cursor-pointer"
              title="Close Navigation Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Navigation Items List */}
        <div className="p-3 space-y-1 overflow-y-auto flex-1 custom-scrollbar">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center rounded-2xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
                } ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-purple/30 to-brand-pink/20 light:from-brand-purple/15 light:to-brand-pink/10 text-white light:text-slate-900 border border-brand-pink/40 light:border-brand-purple/30 shadow-lg shadow-brand-purple/20 font-bold'
                    : 'text-slate-400 light:text-slate-600 hover:text-slate-100 light:hover:text-slate-900 hover:bg-white/5 light:hover:bg-slate-100'
                }`}
              >
                <div className="shrink-0 flex items-center justify-center">{item.icon}</div>

                {!isCollapsed && (
                  <span className="truncate flex-1 text-left">{item.label}</span>
                )}

                {!isCollapsed && item.badge !== undefined && (
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    isActive 
                      ? 'bg-brand-pink text-white shadow-xs' 
                      : 'bg-white/10 light:bg-slate-200 text-slate-300 light:text-slate-700'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* USER PROFILE FOOTER CARD */}
        <div className="p-3 border-t border-white/10 light:border-slate-200 shrink-0">
          <div 
            onClick={handleUserProfileClick}
            className={`flex items-center gap-3 p-2 rounded-2xl bg-gradient-to-tr from-brand-purple/20 to-brand-pink/15 border border-brand-pink/30 hover:border-brand-pink/60 transition-all cursor-pointer ${
              isCollapsed ? 'justify-center' : 'p-2.5'
            }`}
            title={isCollapsed ? (currentUser?.name || 'User Profile') : 'Open Profile & Settings'}
          >
            <div 
              className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-purple to-brand-pink flex items-center justify-center text-white text-base shadow-sm shrink-0 font-bold"
            >
              {currentUser?.avatar || '🎓'}
            </div>

            {!isCollapsed && (
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-extrabold text-white light:text-slate-900 truncate">
                  {currentUser?.name || 'User Account'}
                </span>
                <span className="text-[10px] text-brand-pink font-semibold truncate">
                  {currentUser?.userType || currentUser?.course || currentUser?.email || 'Profile & Settings'}
                </span>
              </div>
            )}
          </div>
        </div>

      </aside>
    </>
  );
};
