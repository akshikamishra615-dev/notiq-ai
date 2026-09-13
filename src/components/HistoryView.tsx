import React, { useState } from 'react';
import { 
  Clock, 
  FileText, 
  Trash2, 
  Download, 
  Search, 
  Calendar, 
  ArrowRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { exportAsJSON } from '../utils/exportUtils';

export const HistoryView: React.FC = () => {
  const { 
    sessions, 
    loadSession, 
    deleteSession, 
    setCurrentTab, 
    currentSession, 
    showToast, 
    resetAllData 
  } = useApp();

  const [search, setSearch] = useState('');

  const filteredSessions = sessions.filter(s => 
    s.fileName.toLowerCase().includes(search.toLowerCase()) ||
    s.summaryMode.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenSession = (sessionId: string) => {
    loadSession(sessionId);
    setCurrentTab('notes');
  };

  const handleExportBackup = (session: typeof sessions[0]) => {
    exportAsJSON(session, session.notes);
    showToast(`Exported backup for "${session.fileName}"`, 'success');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 sm:py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white light:text-slate-900 tracking-tight">
              Document <span className="gradient-text">History</span>
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-purple/20 text-brand-pink font-bold border border-brand-purple/30">
              {sessions.length} Saved
            </span>
          </div>
          <p className="text-xs text-slate-400 light:text-slate-600 mt-1">
            Access, restore, or export previously generated sticky notes sessions.
          </p>
        </div>

        {sessions.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to clear all history?')) {
                resetAllData();
              }
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Search Input */}
      {sessions.length > 0 && (
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 light:text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search past document sessions by title or mode..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/5 light:bg-white border border-white/10 light:border-slate-200 text-xs sm:text-sm text-white light:text-slate-900 placeholder-slate-400 light:placeholder-slate-500 focus:outline-none focus:border-brand-pink transition-colors"
          />
        </div>
      )}

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl border border-white/10 light:border-slate-200 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-purple/10 border border-brand-purple/30 mx-auto flex items-center justify-center">
            <Clock className="w-8 h-8 text-brand-purple" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white light:text-slate-900">No Previous Sessions</h3>
            <p className="text-xs text-slate-400 light:text-slate-600 max-w-sm mx-auto">
              Your generated documents and sticky notes will automatically be saved here.
            </p>
          </div>
          <button
            onClick={() => setCurrentTab('upload')}
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-purple to-brand-pink shadow-md hover:opacity-95 cursor-pointer"
          >
            Upload a Document
          </button>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="text-center py-12 text-slate-400 light:text-slate-600 text-xs">
          No sessions matching "{search}"
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSessions.map((session) => {
            const isActive = currentSession?.id === session.id;

            return (
              <div
                key={session.id}
                className={`glass-card p-5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isActive
                    ? 'border-brand-pink/60 light:border-purple-400 bg-gradient-to-r from-brand-purple/10 to-brand-pink/10 light:from-purple-50 light:to-pink-50 shadow-lg shadow-brand-purple/10'
                    : 'border-white/10 light:border-slate-200 hover:border-white/20 light:hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-purple/20 to-brand-pink/20 light:from-purple-100 light:to-pink-100 border border-brand-pink/30 light:border-purple-200 flex items-center justify-center text-brand-pink light:text-purple-700 shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-white light:text-slate-900 line-clamp-1">
                        {session.fileName}
                      </h4>
                      {isActive && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 light:bg-emerald-100 text-emerald-400 light:text-emerald-800 border border-emerald-500/30 light:border-emerald-200">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-400 light:text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(session.uploadedAt).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span className="font-semibold capitalize text-brand-pink light:text-purple-700">
                        {session.summaryMode} Mode
                      </span>
                      <span>•</span>
                      <span>{session.notes.length} Sticky Notes</span>
                      <span>•</span>
                      <span className="uppercase">{session.language}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handleExportBackup(session)}
                    title="Export JSON backup"
                    className="p-2.5 rounded-xl bg-white/5 light:bg-slate-100 hover:bg-white/10 light:hover:bg-slate-200 text-slate-300 light:text-slate-700 hover:text-white light:hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteSession(session.id)}
                    title="Delete session"
                    className="p-2.5 rounded-xl bg-white/5 light:bg-slate-100 hover:bg-rose-500/20 light:hover:bg-rose-100 text-slate-400 light:text-slate-600 hover:text-rose-400 light:hover:text-rose-700 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenSession(session.id)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-purple to-brand-pink hover:opacity-95 shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Open</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
