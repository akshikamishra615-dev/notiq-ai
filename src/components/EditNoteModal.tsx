import React, { useState, useEffect } from 'react';
import { X, Check, Plus, Trash2, BookOpen } from 'lucide-react';
import type { StickyNote, StickyColor, Priority } from '../types';

interface EditNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (noteData: Partial<StickyNote>) => void;
  initialNote?: StickyNote | null;
}

const COLORS: { id: StickyColor; name: string; bg: string }[] = [
  { id: 'purple', name: 'Purple', bg: 'bg-[#DDD6FE]' },
  { id: 'pink', name: 'Pink', bg: 'bg-[#FBCFE8]' },
  { id: 'yellow', name: 'Yellow', bg: 'bg-[#FEF08A]' },
  { id: 'blue', name: 'Blue', bg: 'bg-[#BAE6FD]' },
  { id: 'green', name: 'Green', bg: 'bg-[#BBF7D0]' },
  { id: 'orange', name: 'Orange', bg: 'bg-[#FED7AA]' },
];

export const EditNoteModal: React.FC<EditNoteModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialNote,
}) => {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [bullets, setBullets] = useState<string[]>(['']);
  const [keywords, setKeywords] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [topic, setTopic] = useState('General');
  const [color, setColor] = useState<StickyColor>('purple');

  useEffect(() => {
    if (initialNote) {
      setTitle(initialNote.title || '');
      setSummary(initialNote.summary || '');
      setBullets(initialNote.bullets?.length > 0 ? initialNote.bullets : ['']);
      setKeywords(initialNote.keywords?.join(', ') || '');
      setPriority(initialNote.priority || 'medium');
      setTopic(initialNote.topic || 'General');
      setColor(initialNote.color || 'purple');
    } else {
      setTitle('');
      setSummary('');
      setBullets(['', '']);
      setKeywords('');
      setPriority('medium');
      setTopic('General');
      setColor('purple');
    }
  }, [initialNote, isOpen]);

  if (!isOpen) return null;

  const handleAddBullet = () => {
    setBullets([...bullets, '']);
  };

  const handleUpdateBullet = (index: number, val: string) => {
    const updated = [...bullets];
    updated[index] = val;
    setBullets(updated);
  };

  const handleRemoveBullet = (index: number) => {
    setBullets(bullets.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanBullets = bullets.map(b => b.trim()).filter(Boolean);
    const cleanKeywords = keywords.split(',').map(k => k.trim()).filter(Boolean);

    onSave({
      title: title.trim() || 'Untitled Note',
      summary: summary.trim() || 'Summary note details.',
      bullets: cleanBullets,
      keywords: cleanKeywords,
      priority,
      topic: topic.trim() || 'General',
      color,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#141028] light:bg-white border border-white/15 light:border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-brand-purple/20 text-slate-100 light:text-slate-900 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 light:border-slate-200 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-purple/20 light:bg-purple-100 text-brand-pink light:text-purple-700">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white light:text-slate-900">
                {initialNote ? 'Edit Sticky Note' : 'Create New Sticky Note'}
              </h3>
              <p className="text-xs text-slate-400 light:text-slate-600">Customize card title, summary, points, and theme</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 light:bg-slate-100 hover:bg-white/10 light:hover:bg-slate-200 text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 light:text-slate-700 mb-1.5">
              Note Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Quantum Superposition"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 light:bg-slate-100 border border-white/15 light:border-slate-200 text-white light:text-slate-900 placeholder-slate-500 light:placeholder-slate-400 focus:outline-none focus:border-brand-pink transition-colors text-sm"
            />
          </div>

          {/* Topic & Priority Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 light:text-slate-700 mb-1.5">
                Topic / Chapter
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Physics Unit 1"
                className="w-full px-4 py-2 rounded-xl bg-white/5 light:bg-slate-100 border border-white/15 light:border-slate-200 text-white light:text-slate-900 placeholder-slate-500 light:placeholder-slate-400 focus:outline-none focus:border-brand-pink text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 light:text-slate-700 mb-1.5">
                Priority
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['high', 'medium', 'low'] as Priority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-2 px-1 rounded-lg text-xs font-bold capitalize transition-all ${
                      priority === p
                        ? p === 'high'
                          ? 'bg-rose-500/30 text-rose-300 border border-rose-500/60'
                          : p === 'medium'
                          ? 'bg-amber-500/30 text-amber-300 border border-amber-500/60'
                          : 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/60'
                        : 'bg-white/5 light:bg-slate-100 text-slate-400 light:text-slate-600 hover:bg-white/10 light:hover:bg-slate-200'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 light:text-slate-700 mb-1.5">
              AI Summary / Main Idea
            </label>
            <textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Core takeaway sentence..."
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 light:bg-slate-100 border border-white/15 light:border-slate-200 text-white light:text-slate-900 placeholder-slate-500 light:placeholder-slate-400 focus:outline-none focus:border-brand-pink text-xs leading-relaxed resize-none"
            />
          </div>

          {/* Bullet Points */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 light:text-slate-700">
                Key Bullet Points
              </label>
              <button
                type="button"
                onClick={handleAddBullet}
                className="text-xs text-brand-pink light:text-purple-700 font-semibold flex items-center gap-1 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Bullet</span>
              </button>
            </div>
            <div className="space-y-2">
              {bullets.map((bullet, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-brand-purple light:text-purple-600 text-xs font-mono">•</span>
                  <input
                    type="text"
                    value={bullet}
                    onChange={(e) => handleUpdateBullet(idx, e.target.value)}
                    placeholder={`Point ${idx + 1}...`}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 light:bg-slate-100 border border-white/15 light:border-slate-200 text-white light:text-slate-900 text-xs focus:outline-none focus:border-brand-pink"
                  />
                  {bullets.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveBullet(idx)}
                      className="p-1.5 text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Keywords / Tags */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 light:text-slate-700 mb-1.5">
              Keywords / Tags (Comma separated)
            </label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="Qubit, Superposition, Entanglement"
              className="w-full px-4 py-2 rounded-xl bg-white/5 light:bg-slate-100 border border-white/15 light:border-slate-200 text-white light:text-slate-900 placeholder-slate-500 light:placeholder-slate-400 focus:outline-none focus:border-brand-pink text-xs"
            />
          </div>

          {/* Color Theme */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 light:text-slate-700 mb-2">
              Sticky Note Paper Color
            </label>
            <div className="flex items-center gap-3">
              {COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColor(c.id)}
                  aria-label={c.name}
                  className={`w-8 h-8 rounded-full ${c.bg} flex items-center justify-center transition-all ${
                    color === c.id ? 'ring-4 ring-brand-purple scale-110 shadow-lg' : 'hover:scale-105'
                  }`}
                >
                  {color === c.id && <Check className="w-4 h-4 text-slate-900" />}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10 light:border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-white/5 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-white/10 light:hover:bg-slate-200 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-purple to-brand-pink hover:opacity-95 shadow-md shadow-brand-purple/25"
            >
              Save Note
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
