import React, { useState } from 'react';
import { 
  Sparkles, 
  Upload, 
  StickyNote as StickyIcon, 
  HelpCircle, 
  Clock, 
  Settings as SettingsIcon, 
  Sun, 
  Moon, 
  Menu, 
  X,
  Layers,
  Award,
  ShieldCheck,
  Flame,
  ChevronDown,
  Bot,
  Lock
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import type { NavigationTab } from '../types';

export const Navbar: React.FC = () => {
  const { currentTab, setCurrentTab, settings, updateSettings, notes, flashcards, quiz } = useApp();
  const { currentUser, setIsAuthModalOpen, setIsSecurityModalOpen } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const toggleTheme = () => {
    updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
  };

  const navItems: { id: NavigationTab; label: string; icon: React.ReactNode; badge?: number | string }[] = [
    { id: 'home', label: 'Dashboard', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'upload', label: 'Upload', icon: <Upload className="w-4 h-4" /> },
    { id: 'chat', label: 'Ask AI Chat', icon: <Bot className="w-4 h-4 text-brand-pink" />, badge: 'AI' },
    { id: 'notes', label: 'Sticky Board', icon: <StickyIcon className="w-4 h-4" />, badge: notes.length },
    { id: 'vault', label: 'Vault', icon: <Lock className="w-4 h-4 text-emerald-400" /> },
    { id: 'flashcards', label: 'Flashcards', icon: <Layers className="w-4 h-4" />, badge: flashcards.length },
    { id: 'quiz', label: 'Quiz Hub', icon: <HelpCircle className="w-4 h-4" />, badge: quiz.length },
    { id: 'progress', label: 'Progress', icon: <Award className="w-4 h-4 text-amber-400" />, badge: `${currentUser.xp}XP` },
    { id: 'history', label: 'History', icon: <Clock className="w-4 h-4" /> },
    { id: 'settings', label: 'Profile & Settings', icon: <SettingsIcon className="w-4 h-4" /> },
  ];

  const handleNavClick = (tab: NavigationTab) => {
    setCurrentTab(tab);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#0c0a15]/85 light:bg-white/85 border-b border-white/10 light:border-brand-purple/15 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Branding (Clean Header with NO Version or SaaS Description) */}
          <div 
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-purple to-brand-pink flex items-center justify-center text-white shadow-lg shadow-brand-purple/30 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-white light:text-slate-900">
                Sticky <span className="gradient-text">AI</span>
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1 bg-white/[0.03] light:bg-slate-100 p-1.5 rounded-2xl border border-white/10 light:border-slate-200">
            {navItems.slice(0, 10).map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer relative ${
                    isActive
                      ? 'bg-gradient-to-r from-brand-purple to-brand-pink text-white shadow-md font-bold scale-[1.02]'
                      : 'text-slate-300 light:text-slate-700 hover:text-white light:hover:text-slate-900 hover:bg-white/5 light:hover:bg-slate-200'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge !== 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-brand-pink/20 text-brand-pink'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Profile & Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Streak Badge */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold shadow-xs">
              <Flame className="w-3.5 h-3.5 fill-amber-400 animate-pulse" />
              <span>{currentUser.streakDays}d</span>
            </div>

            {/* Level XP Pill */}
            <button
              onClick={() => handleNavClick('progress')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-brand-purple/20 to-brand-pink/20 border border-brand-pink/30 text-xs font-bold text-slate-200 light:text-slate-800 hover:border-brand-pink transition-all cursor-pointer"
            >
              <Award className="w-3.5 h-3.5 text-brand-pink" />
              <span>Lvl {currentUser.level}</span>
              <span className="text-[10px] text-brand-pink font-extrabold">{currentUser.xp} XP</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 text-slate-300 light:text-slate-700 hover:text-white transition-colors cursor-pointer"
              title="Toggle Theme"
            >
              {settings.theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-brand-purple" />}
            </button>

            {/* User Profile Avatar Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-2xl bg-white/5 light:bg-slate-100 hover:bg-white/10 light:hover:bg-slate-200 border border-white/10 light:border-slate-200 transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-purple to-brand-pink flex items-center justify-center text-white text-sm font-bold shadow-sm">
                  {currentUser.avatar}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 light:text-slate-600 hidden sm:block mr-1" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 top-12 z-50 w-64 p-3 rounded-3xl bg-[#141028] light:bg-white border border-white/15 light:border-slate-200 shadow-2xl space-y-2 text-xs animate-in fade-in">
                  <div className="p-3 rounded-2xl bg-white/5 light:bg-slate-50 space-y-1">
                    <p className="font-bold text-white light:text-slate-900 truncate">{currentUser.name}</p>
                    <p className="text-[11px] text-slate-400 light:text-slate-600 truncate">{currentUser.email}</p>
                    <div className="pt-1 flex items-center justify-between text-[10px] text-brand-pink font-semibold">
                      <span>Level {currentUser.level} Scholar</span>
                      <span>{currentUser.xp} XP</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      handleNavClick('vault');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-emerald-400 hover:bg-emerald-500/10 font-bold cursor-pointer"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Private Vault</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsSecurityModalOpen(true);
                      setUserDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sky-400 hover:bg-sky-500/10 font-bold cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>256-bit Security Audit</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsAuthModalOpen(true);
                      setUserDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-brand-pink hover:bg-brand-pink/10 font-bold cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Switch Profile / Account</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2.5 rounded-xl bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 text-slate-300 light:text-slate-700 hover:text-white light:hover:text-slate-900 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>

        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-[#0c0a15]/95 light:bg-white/95 backdrop-blur-2xl border-b border-white/10 light:border-slate-200 p-4 space-y-2 animate-in slide-in-from-top duration-200">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`p-3 rounded-2xl text-xs font-semibold flex items-center gap-2.5 transition-all ${
                  currentTab === item.id
                    ? 'bg-gradient-to-r from-brand-purple to-brand-pink text-white font-bold'
                    : 'bg-white/5 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-white/10 light:hover:bg-slate-200'
                }`}
              >
                {item.icon}
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
