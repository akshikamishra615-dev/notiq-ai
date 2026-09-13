import React, { useState } from 'react';
import { 
  LogOut, 
  ShieldCheck, 
  X, 
  RefreshCw, 
  Globe 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

export const LogoutConfirmationModal: React.FC = () => {
  const { 
    currentUser, 
    isLogoutModalOpen, 
    setIsLogoutModalOpen, 
    logoutConfirmed, 
    logoutAllDevices 
  } = useAuth();

  const { showToast } = useApp();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutAll, setLogoutAll] = useState(false);

  if (!isLogoutModalOpen) return null;

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);

    // Simulate 1.2s secure session cleanup & progress synchronization
    setTimeout(() => {
      if (logoutAll) {
        logoutAllDevices();
        showToast('Successfully signed out from all devices.', 'info');
      } else {
        logoutConfirmed();
        showToast('Successfully signed out.', 'info');
      }
      setIsLoggingOut(false);
      setIsLogoutModalOpen(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#141028] light:bg-white border border-rose-500/30 light:border-rose-300 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 light:text-slate-900 relative overflow-hidden">
        
        {/* Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-52 h-52 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-52 h-52 bg-brand-purple/25 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        {!isLoggingOut && (
          <button
            onClick={() => setIsLogoutModalOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 light:bg-slate-100 hover:bg-white/10 light:hover:bg-slate-200 text-slate-400 light:text-slate-500 hover:text-white light:hover:text-slate-900 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {isLoggingOut ? (
          <div className="text-center space-y-4 py-8 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-purple to-brand-pink p-0.5 mx-auto shadow-xl flex items-center justify-center">
              <RefreshCw className="w-8 h-8 text-white animate-spin" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white light:text-slate-900">Logging you out securely...</h3>
              <p className="text-xs text-slate-400 light:text-slate-600 mt-1">Syncing study notes, vault data & clearing session tokens.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 relative z-10">
            {/* Header Icon */}
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-md">
              <LogOut className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-xl font-black text-white light:text-slate-900">Log out of Sticky AI?</h3>
              <p className="text-xs text-slate-400 light:text-slate-600 mt-1.5 leading-relaxed">
                You will be signed out of account <span className="font-bold text-white light:text-slate-900">"{currentUser?.name || 'Student'}"</span> on this device. Your notes, chats, vault, streak, and progress are safely saved in your account.
              </p>
            </div>

            {/* Safety Verification Box */}
            <div className="p-3.5 rounded-2xl bg-white/5 light:bg-slate-50 border border-white/10 light:border-slate-200 space-y-2 text-xs text-slate-300 light:text-slate-700">
              <div className="flex items-center gap-2 text-emerald-400 light:text-emerald-600 font-bold text-[11px]">
                <ShieldCheck className="w-4 h-4" />
                <span>Zero Data Loss Guaranteed</span>
              </div>
              <p className="text-[11px] text-slate-400 light:text-slate-600 leading-relaxed">
                Your encrypted vault notes, flashcards, quiz history, and streak days will load automatically when you sign in again.
              </p>
            </div>

            {/* Option: Logout from all devices */}
            <label className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 light:bg-slate-50 border border-white/10 light:border-slate-200 cursor-pointer text-xs text-slate-300 light:text-slate-700 hover:border-white/20 transition-all">
              <input
                type="checkbox"
                checked={logoutAll}
                onChange={e => setLogoutAll(e.target.checked)}
                className="mt-0.5 rounded bg-white/10 border-white/20 text-brand-pink focus:ring-0"
              />
              <div>
                <span className="font-bold text-white light:text-slate-900 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-brand-pink" />
                  Sign out from all devices
                </span>
                <p className="text-[10px] text-slate-400 light:text-slate-600 mt-0.5">End all active sessions on other phones, laptops, and tablets.</p>
              </div>
            </label>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(false)}
                className="w-1/2 py-3 rounded-2xl bg-white/5 light:bg-slate-100 hover:bg-white/10 light:hover:bg-slate-200 border border-white/10 light:border-slate-200 text-xs font-bold text-slate-300 light:text-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="w-1/2 py-3 rounded-2xl bg-gradient-to-r from-rose-600 via-brand-purple to-rose-600 text-white font-extrabold text-xs hover:opacity-95 shadow-lg shadow-rose-900/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
