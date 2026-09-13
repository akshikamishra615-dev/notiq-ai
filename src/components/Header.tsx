import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  Search, 
  Sun, 
  Moon, 
  ChevronDown, 
  Lock, 
  Settings as SettingsIcon, 
  LogOut
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const { 
    settings, 
    updateSettings, 
    setCurrentTab
  } = useApp();
  
  const { currentUser, logout } = useAuth();
  
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const userDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    if (userDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userDropdownOpen]);

  const toggleTheme = () => {
    updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setCurrentTab('notes');
    }
  };

  return (
    <header className="sticky top-0 z-[45] w-full backdrop-blur-xl bg-[#0c0a15]/85 light:bg-white/85 border-b border-white/10 light:border-slate-200 transition-colors h-16 sm:h-20 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
      
      {/* Left Area: Hamburger + Search Bar */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-xl bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 text-slate-300 light:text-slate-700 hover:text-white cursor-pointer"
          title="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Notiq AI notes, PDFs, topics..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-2xl bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 text-white light:text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-brand-pink transition-colors"
          />
        </form>
      </div>

      {/* Right Area: Workspace Pill, Theme, User Avatar */}
      <div className="flex items-center gap-2 sm:gap-3">
        
        {/* User Profile Badge & Dropdown */}
        <div className="relative" ref={userDropdownRef}>
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-brand-purple/25 to-brand-pink/20 light:from-brand-purple/15 light:to-brand-pink/15 border border-brand-pink/30 hover:border-brand-pink text-xs font-extrabold text-white light:text-slate-900 transition-all cursor-pointer shadow-md"
          >
            <span>{currentUser?.avatar || '🎓'}</span>
            <span className="max-w-[110px] sm:max-w-[150px] truncate">{currentUser?.name || 'My Profile'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-brand-pink" />
          </button>

          {userDropdownOpen && (
            <div className="absolute right-0 top-12 z-50 w-72 p-3.5 rounded-3xl bg-[#141028] light:bg-white border border-white/15 light:border-slate-200 shadow-2xl space-y-3 text-xs">
              
              {/* User Account Header Info */}
              <div className="p-3 rounded-2xl bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 light:text-slate-600">
                  <span>AUTHENTICATED ACCOUNT</span>
                  <span className="text-emerald-400 light:text-emerald-600 font-semibold">Active</span>
                </div>
                <p className="font-extrabold text-white light:text-slate-900 text-sm truncate">{currentUser?.name || 'User Account'}</p>
                <p className="text-[11px] text-slate-400 light:text-slate-600 truncate">{currentUser?.email}</p>
                {(currentUser?.userType || currentUser?.course || currentUser?.classGrade) && (
                  <div className="pt-1 flex items-center gap-1.5 text-[10px] text-brand-pink light:text-brand-purple font-semibold">
                    <span className="px-2 py-0.5 rounded-md bg-brand-pink/15 light:bg-brand-purple/10 border border-brand-pink/30 light:border-brand-purple/20">
                      {currentUser.userType || 'Student'}
                    </span>
                    {currentUser.classGrade && <span className="light:text-slate-700">• {currentUser.classGrade}</span>}
                    {currentUser.course && <span className="light:text-slate-700">• {currentUser.course}</span>}
                  </div>
                )}
              </div>

              {/* Navigation Actions */}
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setCurrentTab('settings');
                    setUserDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-200 light:text-slate-800 hover:bg-white/10 light:hover:bg-slate-100 font-medium cursor-pointer transition-colors"
                >
                  <SettingsIcon className="w-4 h-4 text-brand-pink light:text-brand-purple" />
                  <span>Profile & Academic Settings</span>
                </button>

                <button
                  onClick={() => {
                    setCurrentTab('vault');
                    setUserDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-emerald-400 light:text-emerald-700 hover:bg-emerald-500/10 light:hover:bg-emerald-50 font-medium cursor-pointer transition-colors"
                >
                  <Lock className="w-4 h-4 text-emerald-400 light:text-emerald-600" />
                  <span>Encrypted Private Vault</span>
                </button>

                <button
                  onClick={() => {
                    logout();
                    setUserDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-400 light:text-rose-600 hover:bg-rose-500/10 light:hover:bg-rose-50 font-bold cursor-pointer transition-colors pt-1"
                >
                  <LogOut className="w-4 h-4 text-rose-400 light:text-rose-600" />
                  <span>Logout</span>
                </button>
              </div>

            </div>
          )}
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 text-slate-300 light:text-slate-700 hover:text-white transition-colors cursor-pointer"
          title="Toggle Dark / Light Theme"
        >
          {settings.theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
        </button>

      </div>
    </header>
  );
};
