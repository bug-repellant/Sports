import React, { useState } from 'react';
import { useSports } from '../context/SportsContext';
import { Bell, AlertTriangle, Info, X, ChevronRight } from 'lucide-react';

export default function BroadcastBanner() {
  const { announcements } = useSports();
  const [dismissed, setDismissed] = useState({});

  const activeAnnouncements = announcements.filter(a => a.active && !dismissed[a.id]);

  if (activeAnnouncements.length === 0) return null;

  return (
    <div className="space-y-2 mb-6">
      {activeAnnouncements.slice(0, 2).map((ann) => (
        <div
          key={ann.id}
          className={`p-3.5 sm:p-4 rounded-2xl flex items-start justify-between gap-3 text-xs shadow-lg transition-all animate-in fade-in ${
            ann.priority === 'high'
              ? 'bg-gradient-to-r from-rose-950/80 to-slate-900 border border-rose-500/40 text-rose-200'
              : 'bg-gradient-to-r from-blue-950/80 to-slate-900 border border-blue-500/40 text-blue-200'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
              ann.priority === 'high' ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'
            }`}>
              {ann.priority === 'high' ? <AlertTriangle className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-xs">{ann.title}</span>
                <span className="text-[10px] text-slate-400">({ann.author})</span>
              </div>
              <p className="text-slate-300 mt-0.5">{ann.content}</p>
            </div>
          </div>

          <button
            onClick={() => setDismissed(prev => ({ ...prev, [ann.id]: true }))}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all shrink-0"
            title="Dismiss announcement"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
