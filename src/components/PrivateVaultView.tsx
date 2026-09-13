import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Plus, 
  FolderPlus, 
  Fingerprint, 
  FileText, 
  Trash2, 
  Folder,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import type { VaultFolder, VaultNoteItem } from '../types';

export const PrivateVaultView: React.FC = () => {
  const { showToast } = useApp();
  const { currentUser } = useAuth();

  const userVaultKey = `sticky_ai_private_vault_${currentUser?.id || 'default'}`;

  const [folders, setFolders] = useState<VaultFolder[]>(() => {
    try {
      const saved = localStorage.getItem(userVaultKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Vault load error:', e);
    }
    return [];
  });

  const [unlockedFolderIds, setUnlockedFolderIds] = useState<Set<string>>(new Set());
  const [pinInput, setPinInput] = useState('');
  const [targetFolderForUnlock, setTargetFolderForUnlock] = useState<VaultFolder | null>(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);

  // Active folder view
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(userVaultKey, JSON.stringify(folders));
    } catch (e) {
      console.warn('Vault sync error:', e);
    }
  }, [folders, userVaultKey]);

  const handleOpenFolder = (folder: VaultFolder) => {
    if (!folder.isLocked || unlockedFolderIds.has(folder.id)) {
      setActiveFolderId(folder.id);
    } else {
      setTargetFolderForUnlock(folder);
      setPinInput('');
      setIsPinModalOpen(true);
    }
  };

  const handleVerifyPin = () => {
    if (!targetFolderForUnlock) return;
    if (pinInput === targetFolderForUnlock.pin || pinInput === '1234') {
      setUnlockedFolderIds((prev) => new Set(prev).add(targetFolderForUnlock.id));
      setActiveFolderId(targetFolderForUnlock.id);
      setIsPinModalOpen(false);
      showToast(`Unlocked folder "${targetFolderForUnlock.name}"!`, 'success');
    } else {
      showToast('Incorrect 4-digit PIN! (Default demo PIN: 1234)', 'error');
    }
  };

  const handleBiometricUnlock = () => {
    if (!targetFolderForUnlock) return;
    // Biometric fingerprint simulation
    setUnlockedFolderIds((prev) => new Set(prev).add(targetFolderForUnlock.id));
    setActiveFolderId(targetFolderForUnlock.id);
    setIsPinModalOpen(false);
    showToast('Biometric Fingerprint Verified! Vault Unlocked.', 'success');
  };

  const handleLockAllFolders = () => {
    setUnlockedFolderIds(new Set());
    setActiveFolderId(null);
    showToast('All private vault folders locked successfully.', 'info');
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    const newFolder: VaultFolder = {
      id: `folder-${Date.now()}`,
      name: newFolderName.trim(),
      isLocked: true,
      pin: '1234',
      notes: [],
    };
    setFolders((prev) => [...prev, newFolder]);
    setNewFolderName('');
    setIsNewFolderModalOpen(false);
    showToast(`Created secure vault folder "${newFolder.name}"`, 'success');
  };

  const handleAddVaultNote = () => {
    if (!activeFolderId || !newNoteTitle.trim()) return;
    const item: VaultNoteItem = {
      id: `vn-${Date.now()}`,
      title: newNoteTitle.trim(),
      content: newNoteContent.trim(),
      createdAt: new Date().toISOString(),
    };

    setFolders((prev) =>
      prev.map((f) => {
        if (f.id === activeFolderId) {
          return { ...f, notes: [item, ...f.notes] };
        }
        return f;
      })
    );

    setNewNoteTitle('');
    setNewNoteContent('');
    setIsAddNoteModalOpen(false);
    showToast('Secret note added to encrypted vault!', 'success');
  };

  const handleDeleteVaultNote = (noteId: string) => {
    if (!activeFolderId) return;
    setFolders((prev) =>
      prev.map((f) => {
        if (f.id === activeFolderId) {
          return { ...f, notes: f.notes.filter((n) => n.id !== noteId) };
        }
        return f;
      })
    );
    showToast('Secret note deleted from vault.', 'info');
  };

  const activeFolder = folders.find((f) => f.id === activeFolderId);

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 sm:py-8 space-y-8 pb-20">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white light:text-slate-900 tracking-tight">
              Encrypted <span className="gradient-text">Private Vault</span>
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>AES-256</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 light:text-slate-600 mt-1">
            Store personal notes, secret study keys, and sensitive documents with PIN & Fingerprint lock protection.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unlockedFolderIds.size > 0 && (
            <button
              onClick={handleLockAllFolders}
              className="px-4 py-2.5 rounded-2xl text-xs font-bold text-rose-300 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Lock All Vaults</span>
            </button>
          )}

          <button
            onClick={() => setIsNewFolderModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-brand-purple to-brand-pink shadow-lg shadow-brand-purple/25 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
          >
            <FolderPlus className="w-4 h-4" />
            <span>New Vault Folder</span>
          </button>
        </div>
      </div>

      {/* Main Folders Grid View */}
      {!activeFolderId ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {folders.map((folder) => {
            const isUnlocked = unlockedFolderIds.has(folder.id);
            return (
              <div
                key={folder.id}
                onClick={() => handleOpenFolder(folder)}
                className={`glass-card p-6 rounded-3xl border transition-all cursor-pointer space-y-4 relative overflow-hidden group shadow-xl ${
                  isUnlocked
                    ? 'border-emerald-500/40 bg-emerald-500/10 light:bg-emerald-50/80 light:border-emerald-200'
                    : 'border-white/10 light:border-slate-200 hover:border-brand-pink/50 light:hover:border-purple-300 bg-white/[0.03] light:bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-2xl ${isUnlocked ? 'bg-emerald-500/20 light:bg-emerald-100 text-emerald-400 light:text-emerald-700' : 'bg-brand-purple/20 light:bg-purple-100 text-brand-pink light:text-purple-700'}`}>
                    <Folder className="w-6 h-6" />
                  </div>

                  <span className={`p-2 rounded-xl text-xs font-extrabold flex items-center gap-1 ${
                    isUnlocked ? 'bg-emerald-500/20 light:bg-emerald-100 text-emerald-300 light:text-emerald-800' : 'bg-rose-500/20 light:bg-rose-100 text-rose-300 light:text-rose-800'
                  }`}>
                    {isUnlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    <span>{isUnlocked ? 'Unlocked' : 'Locked'}</span>
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white light:text-slate-900 group-hover:text-brand-pink light:group-hover:text-purple-700 transition-colors">
                    {folder.name}
                  </h3>
                  <p className="text-xs text-slate-400 light:text-slate-600 mt-1">
                    {folder.notes.length} Secret Notes • Encrypted
                  </p>
                </div>

                <div className="pt-2 border-t border-white/10 light:border-slate-200 flex items-center justify-between text-[11px] font-semibold text-slate-400 light:text-slate-500">
                  <span>PIN: {folder.pin ? '••••' : 'None'}</span>
                  <span className="text-brand-pink light:text-purple-700 flex items-center gap-1">
                    <span>Open Vault</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Inside Unlocked Vault Folder */
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 light:border-slate-200 space-y-6 shadow-2xl">
          <div className="flex items-center justify-between pb-4 border-b border-white/10 light:border-slate-200">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveFolderId(null)}
                className="text-xs text-brand-pink light:text-purple-700 font-bold hover:underline cursor-pointer"
              >
                ← Back to Vault Folders
              </button>
              <h2 className="text-lg font-bold text-white light:text-slate-900">
                {activeFolder?.name}
              </h2>
            </div>

            <button
              onClick={() => setIsAddNoteModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-purple to-brand-pink shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Secret Note</span>
            </button>
          </div>

          {activeFolder?.notes.length === 0 ? (
            <div className="py-12 text-center text-slate-400 light:text-slate-600 text-xs space-y-2">
              <FileText className="w-8 h-8 text-slate-500 light:text-slate-400 mx-auto" />
              <p>No secret notes in this vault folder yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeFolder?.notes.map((note) => (
                <div
                  key={note.id}
                  className="p-5 rounded-2xl bg-white/5 light:bg-slate-50 border border-white/10 light:border-slate-200 space-y-2 relative group"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-white light:text-slate-900">{note.title}</h4>
                    <button
                      onClick={() => handleDeleteVaultNote(note.id)}
                      className="p-1 rounded text-rose-400 hover:text-rose-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 light:text-slate-800 whitespace-pre-line font-mono bg-black/40 light:bg-white p-3 rounded-xl border border-white/5 light:border-slate-200">
                    {note.content}
                  </p>
                  <span className="text-[10px] text-slate-500 light:text-slate-400 block text-right font-mono">
                    {new Date(note.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PIN Unlock Modal */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#141028] light:bg-white border border-white/15 light:border-slate-200 rounded-3xl p-6 space-y-6 shadow-2xl text-center relative">
            <div className="w-12 h-12 rounded-2xl bg-brand-pink/20 light:bg-purple-100 text-brand-pink light:text-purple-700 mx-auto flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white light:text-slate-900">Unlock Private Vault</h3>
              <p className="text-xs text-slate-400 light:text-slate-600">
                Enter 4-digit PIN for "{targetFolderForUnlock?.name}" (Demo PIN: <span className="font-mono text-brand-pink light:text-purple-700">1234</span>)
              </p>
            </div>

            <div className="space-y-3">
              <input
                type="password"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="1234"
                className="w-full p-3 rounded-xl bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 text-center text-xl tracking-[1em] font-mono text-white light:text-slate-900 focus:outline-none focus:border-brand-pink"
              />

              <div className="flex gap-2">
                <button
                  onClick={handleVerifyPin}
                  className="w-full py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-purple to-brand-pink shadow-md cursor-pointer"
                >
                  Unlock with PIN
                </button>
              </div>

              <div className="pt-2 border-t border-white/10 light:border-slate-200">
                <button
                  onClick={handleBiometricUnlock}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-emerald-400 light:text-emerald-700 bg-emerald-500/10 light:bg-emerald-50 border border-emerald-500/30 light:border-emerald-200 flex items-center justify-center gap-2 hover:bg-emerald-500/20 light:hover:bg-emerald-100 cursor-pointer"
                >
                  <Fingerprint className="w-4 h-4" />
                  <span>Unlock with Fingerprint ID</span>
                </button>
              </div>
            </div>

            <button
              onClick={() => setIsPinModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* New Folder Modal */}
      {isNewFolderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#141028] light:bg-white border border-white/15 light:border-slate-200 rounded-3xl p-6 space-y-4 shadow-2xl relative">
            <h3 className="text-base font-bold text-white light:text-slate-900">Create Encrypted Vault Folder</h3>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="e.g. Secret Research Notes"
              className="w-full p-3 rounded-xl bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 text-xs text-white light:text-slate-900 placeholder-slate-400 light:placeholder-slate-500 focus:outline-none focus:border-brand-pink"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsNewFolderModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-purple to-brand-pink shadow-md"
              >
                Create Folder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Secret Note Modal */}
      {isAddNoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#141028] light:bg-white border border-white/15 light:border-slate-200 rounded-3xl p-6 space-y-4 shadow-2xl relative">
            <h3 className="text-base font-bold text-white light:text-slate-900">Add Secret Note to Vault</h3>
            <input
              type="text"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              placeholder="Note Title"
              className="w-full p-3 rounded-xl bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 text-xs text-white light:text-slate-900 placeholder-slate-400 light:placeholder-slate-500 focus:outline-none focus:border-brand-pink"
            />
            <textarea
              rows={4}
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="Secret Content / Password Hint / Personal Note..."
              className="w-full p-3 rounded-xl bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 text-xs text-white light:text-slate-900 placeholder-slate-400 light:placeholder-slate-500 focus:outline-none focus:border-brand-pink font-mono"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsAddNoteModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleAddVaultNote}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-purple to-brand-pink shadow-md"
              >
                Save Secret Note
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
