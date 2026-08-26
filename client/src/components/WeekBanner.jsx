import React, { useState, useEffect } from 'react';
import { useSports } from '../context/SportsContext';
import { Calendar, Clock, Flame, Info, Search, Filter, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';

export default function WeekBanner({ 
  selectedDay, 
  setSelectedDay, 
  selectedSport, 
  setSelectedSport, 
  searchQuery, 
  setSearchQuery 
}) {
  const { weekInfo, weekType, setWeekType, sportsConfig, sessions } = useSports();
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Calculate live countdown to Sunday midnight (deadline for next week signups)
  useEffect(() => {
    const calculateCountdown = () => {
      if (!weekInfo?.signupDeadline) return;
      const target = new Date(weekInfo.signupDeadline).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeLeft({ days, hours, minutes, seconds });
      }
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, [weekInfo]);

  const daysList = [
    { key: 'all', label: 'All Days' },
    { key: 'Monday', label: 'Mon' },
    { key: 'Tuesday', label: 'Tue' },
    { key: 'Wednesday', label: 'Wed' },
    { key: 'Thursday', label: 'Thu' },
    { key: 'Friday', label: 'Fri' },
    { key: 'Saturday', label: 'Sat' },
    { key: 'Sunday', label: 'Sun' }
  ];

  const totalSignupsNextWeek = sessions.reduce((acc, s) => acc + (s.participants?.length || 0), 0);

  return (
    <div className="space-y-6 mb-8">
      
      {/* Main Banner Hero */}
      <div className="relative rounded-3xl overflow-hidden glass-panel p-6 sm:p-8 border border-slate-700/60 shadow-2xl">
        
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-96 h-96 rounded-full bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-80 h-80 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          
          {/* Left Hero Content */}
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                {weekType === 'next' ? 'ACTIVE SIGNUP WINDOW' : 'SCHEDULE OVERVIEW'}
              </span>
              
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800/80 text-slate-300 border border-slate-700">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {weekInfo?.label || 'Loading dates...'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              {weekType === 'next' ? (
                <>Signups for <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">Subsequent Week</span></>
              ) : (
                <>Current Week <span className="bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">Sports Schedule</span></>
              )}
            </h1>

            <p className="text-sm text-slate-300 flex items-center gap-2">
              <Info className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Unlimited slots:</strong> Any number of players can register. Signups are open exclusively for the subsequent week so venues & timings can be finalized by admins.
              </span>
            </p>
          </div>

          {/* Right Card: Countdown Timer & Week Switcher */}
          <div className="w-full lg:w-auto flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            
            {/* Week Toggle */}
            <div className="flex items-center p-1 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs font-semibold">
              <button
                onClick={() => setWeekType('next')}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  weekType === 'next'
                    ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                Subsequent Week (Signups Open)
              </button>
              
              <button
                onClick={() => setWeekType('current')}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  weekType === 'current'
                    ? 'bg-blue-500 text-white font-extrabold shadow-md shadow-blue-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Current Week
              </button>
            </div>

            {/* Countdown Box */}
            {weekType === 'next' && (
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Signup Window Closes</p>
                    <p className="text-xs font-semibold text-slate-200">Sunday 11:59 PM</p>
                  </div>
                </div>

                {/* Numbers */}
                <div className="flex items-center gap-1 text-center font-mono">
                  <div className="bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                    <span className="text-sm font-black text-amber-400">{timeLeft.days}</span>
                    <span className="text-[9px] text-slate-500 block">d</span>
                  </div>
                  <span className="text-slate-600 font-bold">:</span>
                  <div className="bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                    <span className="text-sm font-black text-amber-400">{String(timeLeft.hours).padStart(2, '0')}</span>
                    <span className="text-[9px] text-slate-500 block">h</span>
                  </div>
                  <span className="text-slate-600 font-bold">:</span>
                  <div className="bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                    <span className="text-sm font-black text-amber-400">{String(timeLeft.minutes).padStart(2, '0')}</span>
                    <span className="text-[9px] text-slate-500 block">m</span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Stat */}
            <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center justify-between">
              <span className="text-slate-400">Total signups this week:</span>
              <span className="font-extrabold text-emerald-300">{totalSignupsNextWeek} players registered</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="space-y-3">
        
        {/* Day Pills & Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Day Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {daysList.map((day) => (
              <button
                key={day.key}
                onClick={() => setSelectedDay(day.key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  selectedDay === day.key
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                    : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72 shrink-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sport, venue, or colleague..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
            />
          </div>
        </div>

        {/* Sports Icon Filter Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedSport('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              selectedSport === 'all'
                ? 'bg-slate-100 text-slate-950 font-bold'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <span>⚡ All 7 Sports</span>
          </button>

          {sportsConfig.map((sport) => (
            <button
              key={sport.id}
              onClick={() => setSelectedSport(sport.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap border ${
                selectedSport === sport.id
                  ? 'bg-slate-800 text-white border-emerald-500 shadow-sm'
                  : 'bg-slate-900/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border-slate-800'
              }`}
            >
              <span>{sport.icon}</span>
              <span>{sport.name}</span>
            </button>
          ))}
        </div>

      </div>

    </div>
  );
}
