import React, { useState } from 'react';
import { 
  Bookmark, 
  Copy, 
  Check, 
  GitBranch, 
  Zap, 
  Calendar, 
  BookOpen, 
  Lightbulb, 
  Key,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { HighlightType, AIHighlight } from '../types';

export const HighlightsMindMapView: React.FC = () => {
  const { highlights, mindMap, showToast, loadSampleDocument } = useApp();
  const [activeTab, setActiveTab] = useState<'highlights' | 'mindmap'>('highlights');
  const [filterType, setFilterType] = useState<HighlightType | 'all'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'mm-root': true,
    'mm-topic-0': true,
    'mm-topic-1': true,
  });

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const handleCopyHighlight = (item: AIHighlight) => {
    navigator.clipboard.writeText(`${item.title}: ${item.text}`);
    setCopiedId(item.id);
    showToast('Copied to clipboard!', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const typeConfig: Record<HighlightType, { label: string; icon: React.ReactNode; color: string; badge: string }> = {
    definition: { label: 'Definitions', icon: <BookOpen className="w-3.5 h-3.5" />, color: 'text-sky-400', badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
    formula: { label: 'Formulas & Laws', icon: <Zap className="w-3.5 h-3.5" />, color: 'text-pink-400', badge: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
    date: { label: 'Dates & Timeline', icon: <Calendar className="w-3.5 h-3.5" />, color: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    keyword: { label: 'Key Terminology', icon: <Key className="w-3.5 h-3.5" />, color: 'text-purple-400', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
    example: { label: 'Examples & Cases', icon: <Lightbulb className="w-3.5 h-3.5" />, color: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  };

  const filteredHighlights = highlights.filter(h => filterType === 'all' || h.type === filterType);

  if (highlights.length === 0 && !mindMap) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-brand-pink/10 border border-brand-pink/30 mx-auto flex items-center justify-center">
          <Bookmark className="w-8 h-8 text-brand-pink" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-white light:text-slate-900">No Highlights or Mind Map Yet</h3>
          <p className="text-xs sm:text-sm text-slate-400 light:text-slate-600 max-w-md mx-auto">
            Upload a document or explore our interactive demo to view AI-extracted formulas, definitions, and visual mind maps.
          </p>
        </div>
        <button
          onClick={() => loadSampleDocument('sample-quantum')}
          className="px-6 py-3 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-brand-purple to-brand-pink shadow-lg shadow-brand-purple/25"
        >
          Load Interactive Demo
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 sm:py-8 space-y-8">
      
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white light:text-slate-900 tracking-tight">
            AI Highlights & <span className="gradient-text">Mind Map</span>
          </h1>
          <p className="text-xs text-slate-400 light:text-slate-600 mt-1">
            Formulas, definitions, dates, and structured hierarchical knowledge tree.
          </p>
        </div>

        {/* View Tabs */}
        <div className="flex items-center p-1 rounded-2xl bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200">
          <button
            onClick={() => setActiveTab('highlights')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'highlights'
                ? 'bg-gradient-to-r from-brand-purple to-brand-pink text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>AI Highlights ({highlights.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('mindmap')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'mindmap'
                ? 'bg-gradient-to-r from-brand-purple to-brand-pink text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <GitBranch className="w-4 h-4" />
            <span>Interactive Mind Map</span>
          </button>
        </div>
      </div>

      {activeTab === 'highlights' ? (
        <div className="space-y-6">
          
          {/* Category Filter Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterType === 'all'
                  ? 'bg-gradient-to-r from-brand-purple to-brand-pink text-white shadow-sm'
                  : 'bg-white/5 light:bg-slate-100 text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900'
              }`}
            >
              All Highlights ({highlights.length})
            </button>
            {(['definition', 'formula', 'date', 'keyword', 'example'] as HighlightType[]).map((type) => {
              const cfg = typeConfig[type];
              const count = highlights.filter(h => h.type === type).length;
              return (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    filterType === type
                      ? 'bg-brand-pink/20 text-brand-pink light:text-purple-700 border border-brand-pink/50'
                      : 'bg-white/5 light:bg-slate-100 text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900'
                  }`}
                >
                  {cfg.icon}
                  <span>{cfg.label}</span>
                  <span className="text-[10px] opacity-70">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Highlights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredHighlights.map((item) => {
              const cfg = typeConfig[item.type] || typeConfig.definition;
              const isCopied = copiedId === item.id;

              return (
                <div
                  key={item.id}
                  className="glass-card p-5 rounded-2xl border border-white/10 light:border-slate-200 space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${cfg.badge}`}>
                        {cfg.icon}
                        <span>{cfg.label}</span>
                      </span>
                      <button
                        onClick={() => handleCopyHighlight(item)}
                        className="p-1.5 rounded-lg text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900 hover:bg-white/10 light:hover:bg-slate-100 transition-colors"
                        title="Copy highlight text"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400 light:text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <h4 className="font-bold text-sm text-white light:text-slate-900 mb-1">
                      {item.title}
                    </h4>

                    <p className="text-xs text-slate-300 light:text-slate-700 leading-relaxed font-mono bg-black/20 light:bg-slate-100 p-2.5 rounded-xl border border-white/5 light:border-slate-200">
                      {item.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      ) : (
        /* Mind Map Visual View */
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 light:border-slate-200 shadow-2xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-white/10 light:border-slate-200">
            <div>
              <h3 className="text-base font-bold text-white light:text-slate-900">
                Hierarchical Knowledge Tree
              </h3>
              <p className="text-xs text-slate-400 light:text-slate-600">
                Click on chapters and topics to expand or collapse sub-concepts.
              </p>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-brand-purple/20 light:bg-purple-100 text-brand-pink light:text-purple-700 font-bold border border-brand-purple/30 light:border-purple-200">
              Future-Ready Mind Map Graph
            </span>
          </div>

          {mindMap && (
            <div className="space-y-4 pt-2">
              
              {/* Root Document Node */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-purple/30 to-brand-pink/30 light:from-purple-100 light:to-pink-100 border-2 border-brand-pink/50 light:border-purple-300 flex items-center gap-3 shadow-lg">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-purple to-brand-pink flex items-center justify-center text-white font-bold">
                  📄
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-brand-pink light:text-purple-700 uppercase">DOCUMENT ROOT</span>
                  <h4 className="text-base font-extrabold text-white light:text-slate-900">
                    {mindMap.label}
                  </h4>
                </div>
              </div>

              {/* Chapters & Children */}
              <div className="pl-6 space-y-4 border-l-2 border-dashed border-brand-purple/40 light:border-purple-300 ml-5">
                {mindMap.children?.map((chapterNode) => {
                  const isExpanded = expandedNodes[chapterNode.id] !== false;

                  return (
                    <div key={chapterNode.id} className="space-y-3">
                      {/* Chapter Header */}
                      <button
                        onClick={() => toggleNode(chapterNode.id)}
                        className="w-full text-left p-3.5 rounded-2xl bg-white/5 light:bg-white border border-white/10 light:border-slate-200 hover:border-brand-purple/40 flex items-center justify-between transition-all"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-brand-pink light:text-purple-700">
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </span>
                          <span className="text-xs font-bold text-white light:text-slate-900">
                            {chapterNode.label}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-purple/20 light:bg-purple-100 text-brand-pink light:text-purple-700">
                          {chapterNode.notesCount || chapterNode.children?.length || 0} Subtopics
                        </span>
                      </button>

                      {/* Subtopics Nodes */}
                      {isExpanded && chapterNode.children && (
                        <div className="pl-6 space-y-2 border-l border-white/10 light:border-slate-200 ml-4">
                          {chapterNode.children.map((subNode) => (
                            <div
                              key={subNode.id}
                              className="p-3 rounded-xl bg-white/[0.03] light:bg-slate-50 border border-white/5 light:border-slate-200 text-xs space-y-1.5"
                            >
                              <p className="font-bold text-brand-pink light:text-purple-700">📌 {subNode.label}</p>
                              {subNode.children && subNode.children.length > 0 && (
                                <div className="space-y-1 pl-3 text-[11px] text-slate-400 light:text-slate-600">
                                  {subNode.children.map((leaf) => (
                                    <div key={leaf.id} className="flex items-center gap-1.5">
                                      <span className="text-brand-purple light:text-purple-600">•</span>
                                      <span>{leaf.label}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          )}
        </div>
      )}

    </div>
  );
};
