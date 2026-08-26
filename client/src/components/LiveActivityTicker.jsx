import React from 'react';
import { useSports } from '../context/SportsContext';
import { Activity, Clock, Sparkles, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';

export default function LiveActivityTicker() {
  const { activities, wsConnected } = useSports();

  const formatTimeAgo = (dateStr) => {
    try {
      const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
      if (diff < 60) return 'Just now';
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return `${Math.floor(diff / 86400)}d ago`;
    } catch {
      return 'Recently';
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'SIGNUP':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'CANCEL':
        return <XCircle className="w-4 h-4 text-rose-400 shrink-0" />;
      case 'ADMIN_UPDATE':
        return <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />;
      default:
        return <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-400 live-dot' : 'bg-amber-400'}`} />
                Live WebSocket Stream
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Live Activity Feed</h1>
            <p className="text-xs text-slate-400 mt-1">Real-time office signup feed and admin court announcements.</p>
          </div>
        </div>
      </div>

      {/* Activity List */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Recent Sports Activity</span>
          </div>
          <span className="text-xs text-slate-500 font-mono">Updates automatically</span>
        </div>

        {activities.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No recent activity recorded yet. Sign up for a sport to start the stream!
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {activities.map((act) => (
              <div
                key={act.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all text-xs"
              >
                <div className="flex items-center gap-3">
                  {getIcon(act.type)}
                  <div>
                    <p className="font-semibold text-slate-200">{act.text}</p>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {act.sport ? `${act.sport} • ` : ''}{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <span className="text-[11px] text-slate-500 font-mono shrink-0 ml-2">
                  {formatTimeAgo(act.timestamp)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
