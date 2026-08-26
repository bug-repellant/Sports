import React from 'react';
import { useSports } from '../context/SportsContext';
import { 
  BarChart3, 
  Trophy, 
  Users, 
  Flame, 
  TrendingUp, 
  Sparkles, 
  Award, 
  Briefcase 
} from 'lucide-react';

export default function AnalyticsView() {
  const { analytics, sportsConfig } = useSports();

  if (!analytics) {
    return (
      <div className="p-12 text-center glass-panel rounded-3xl border border-slate-800">
        <p className="text-slate-400">Loading office sports analytics...</p>
      </div>
    );
  }

  const { totalRegistrations, uniquePlayers, topSports = [], departmentBreakdown = {}, topPlayers = [], weekLabel } = analytics;

  const maxSportSignups = Math.max(...topSports.map(s => s.totalSignups), 1);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5" />
                Office Sports Intelligence
              </span>
              <span className="text-xs text-slate-400">{weekLabel}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Participation & Leaderboard</h1>
            <p className="text-xs text-slate-400 mt-1">Real-time stats across all 7 sports for Gameopedia employees.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center min-w-28">
              <span className="text-3xl font-black text-emerald-400">{totalRegistrations}</span>
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mt-0.5">
                Total Signups
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center min-w-28">
              <span className="text-3xl font-black text-blue-400">{uniquePlayers}</span>
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mt-0.5">
                Active Players
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Most Popular Sports & Top Players */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Most Popular Sports Bar Chart (2 cols) */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              <h2 className="text-base font-extrabold text-white">Sport Popularity Ranking</h2>
            </div>
            <span className="text-xs text-slate-400">By total registrations</span>
          </div>

          <div className="space-y-3 pt-2">
            {topSports.map((sport, index) => {
              const percentage = Math.round((sport.totalSignups / maxSportSignups) * 100);
              return (
                <div key={sport.name} className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-[11px] text-slate-500 font-bold w-4">#{index + 1}</span>
                      <span className="text-lg">{sport.icon}</span>
                      <span className="font-bold text-white text-sm">{sport.name}</span>
                      <span className="text-[10px] text-slate-400">({sport.sessionsCount} sessions)</span>
                    </div>
                    <span className="font-extrabold text-emerald-400 text-xs">
                      {sport.totalSignups} players
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2.5 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                      style={{ width: `${Math.max(percentage, 5)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Active MVPs (1 col) */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h2 className="text-base font-extrabold text-white">Top Active Athletes</h2>
          </div>

          <div className="space-y-2.5 pt-1">
            {topPlayers.map((player, idx) => (
              <div
                key={player.email}
                className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800/80"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <span className="font-mono text-xs font-black text-amber-400 w-4">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                  </span>
                  <img src={player.avatar} alt={player.name} className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700" />
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-white truncate">{player.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{player.email}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-emerald-400 block">{player.count} games</span>
                  <span className="text-[9px] text-slate-500">booked</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Department Breakdown */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-purple-400" />
          <h2 className="text-base font-extrabold text-white">Department Participation</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Object.entries(departmentBreakdown).map(([dept, count]) => (
            <div key={dept} className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
              <span className="text-xs font-bold text-slate-300 block truncate">{dept}</span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-black text-purple-400">{count}</span>
                <span className="text-[10px] text-slate-500">signups</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
