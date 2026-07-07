import React, { useState } from 'react';
import { useAppState } from '../../store/index';
import { BookOpen, Sparkles, Plus, X, Search } from 'lucide-react';

export default function KEDBLibrary() {
  const { state, dispatch } = useAppState();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newArticle, setNewArticle] = useState({ id: '', title: '', category: 'General' as const, content: '', steps: '' });

  const filtered = state.kbArticles.filter(a =>
    a.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/kb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newArticle.id,
          title: newArticle.title,
          category: newArticle.category,
          content: newArticle.content,
          steps: newArticle.steps.split('\n').filter(s => s.trim()),
        }),
      });
      if (res.ok) {
        const created = await res.json();
        dispatch({ type: 'SET_KB_ARTICLES', payload: [...state.kbArticles, created] });
        setIsAdding(false);
        setNewArticle({ id: '', title: '', category: 'General', content: '', steps: '' });
      }
    } catch { /* ignore */ }
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">KEDB Library</h2>
          <p className="text-xs text-slate-500 mt-1">Known Error Database — {state.kbArticles.length} articles</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 font-medium shadow transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
        >
          <Plus size={14} />Add Article
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
        <input
          type="text"
          placeholder="Search KEDB..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-400"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(article => (
          <div key={article.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs font-bold text-slate-500">{article.id}</span>
              <span className={`text-[9px] px-2 py-0.5 rounded-full border font-medium ${
                article.category === 'Known Error' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                article.category === 'Technical' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                'bg-slate-50 text-slate-600 border-slate-200'
              }`}>{article.category}</span>
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-2">{article.title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">{article.content}</p>
            {article.steps && article.steps.length > 0 && (
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Resolution Steps:</span>
                <ol className="list-decimal pl-4 text-[11px] text-slate-600 space-y-1 mt-1">
                  {article.steps.map((step, i) => <li key={i}>{step}</li>)}
                </ol>
              </div>
            )}
          </div>
        ))}
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2"><BookOpen size={16} />New KB Article</h3>
              <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-white"><X size={16} /></button>
            </div>
            <form onSubmit={handleAdd} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Article ID</label>
                  <input type="text" placeholder="KB-XXX" value={newArticle.id} onChange={e => setNewArticle({ ...newArticle, id: e.target.value })} className="w-full p-2 border border-slate-200 rounded focus:ring-1 focus:ring-slate-900" required />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Category</label>
                  <select value={newArticle.category} onChange={e => setNewArticle({ ...newArticle, category: e.target.value as any })} className="w-full p-2 border border-slate-200 rounded focus:ring-1 focus:ring-slate-900">
                    <option value="General">General</option>
                    <option value="Technical">Technical</option>
                    <option value="Known Error">Known Error</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Title</label>
                <input type="text" value={newArticle.title} onChange={e => setNewArticle({ ...newArticle, title: e.target.value })} className="w-full p-2 border border-slate-200 rounded focus:ring-1 focus:ring-slate-900" required />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Content</label>
                <textarea rows={4} value={newArticle.content} onChange={e => setNewArticle({ ...newArticle, content: e.target.value })} className="w-full p-2 border border-slate-200 rounded focus:ring-1 focus:ring-slate-900" required />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Steps (one per line)</label>
                <textarea rows={3} value={newArticle.steps} onChange={e => setNewArticle({ ...newArticle, steps: e.target.value })} className="w-full p-2 border border-slate-200 rounded focus:ring-1 focus:ring-slate-900" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 border border-slate-300 rounded hover:bg-slate-100">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded font-semibold shadow hover:bg-slate-800 transition-colors">Create Article</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
