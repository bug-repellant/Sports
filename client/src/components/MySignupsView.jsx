import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useSports } from '../context/SportsContext';
import { downloadICS, getGoogleCalendarUrl } from '../utils/icsExport';
import { 
  UserCheck, 
  Calendar, 
  Clock, 
  MapPin, 
  CalendarPlus, 
  Download, 
  X, 
  Sparkles, 
  Trophy, 
  Users, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export default function MySignupsView({ onOpenRoster, onGoToSchedule }) {
  const { currentUser } = useAuth();
  const { sessions, weekInfo, cancelSession, weekType } = useSports();

  if (!currentUser) {
    return (
      <div className="p-12 text-center glass-panel rounded-3xl border border-slate-800 space-y-4">
        <UserCheck className="w-12 h-12 text-emerald-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Sign In to View Your Schedule</h2>
        <p className="text-xs text-slate-400">Please sign in with your @gameopedia.com email to access your personal sports signups.</p>
      </div>
    );
  }

  // Filter sessions where the current user is a participant
  const mySessions = sessions.filter(s =>
    s.participants?.some(p => p.email?.toLowerCase() === currentUser.email.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-emerald-400 shadow-xl"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white">{currentUser.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {currentUser.badge || 'Active Player'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {currentUser.email} • <span className="text-slate-300 font-semibold">{currentUser.department}</span>
              </p>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center flex-1 md:w-32">
              <span className="text-2xl font-black text-emerald-400">{mySessions.length}</span>
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mt-0.5">
                Games Booked
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center flex-1 md:w-36">
              <span className="text-2xl font-black text-blue-400">
                {new Set(mySessions.map(s => s.sportId)).size}
              </span>
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mt-0.5">
                Sports Selected
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <h2 className="text-base font-extrabold text-white">
              Your Registered Matches for {weekInfo?.label}
            </h2>
          </div>

          {mySessions.length > 0 && (
            <span className="text-xs text-emerald-400 font-bold">
              {mySessions.length} sessions active
            </span>
          )}
        </div>

        {mySessions.length === 0 ? (
          <div className="p-12 text-center glass-panel rounded-3xl border border-slate-800/80 space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-900 mx-auto flex items-center justify-center text-3xl">
              🏸
            </div>
            <h3 className="text-lg font-bold text-white">No Signups for this Week Yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              You haven't signed up for any sports sessions in {weekInfo?.label}. Signups are open for all 7 sports with unlimited slots!
            </p>
            <button
              onClick={onGoToSchedule}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/20 inline-flex items-center gap-2"
            >
              <span>Browse Weekly Sports</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mySessions.map((session) => (
              <div
                key={session.id}
                className="glass-panel p-5 rounded-3xl border border-emerald-500/30 hover:border-emerald-500/60 transition-all flex flex-col justify-between space-y-4 relative overflow-hidden"
              >
                <div className={`h-1.5 w-full absolute top-0 left-0 bg-gradient-to-r ${session.gradient}`} />

                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-2xl">
                        {session.icon}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-base">{session.sportName}</h4>
                        <p className="text-xs text-emerald-400 font-semibold">{session.dayName}, {session.displayDate}</p>
                      </div>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950">
                      CONFIRMED
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>{session.timing}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" />
                      <span>{session.venue || 'TBD (Admin finalizing court)'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Users className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{session.participants.length} players attending with you</span>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <a
                      href={getGoogleCalendarUrl(session)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      <CalendarPlus className="w-3 h-3 text-blue-400" />
                      <span>Add to Calendar</span>
                    </a>

                    <button
                      onClick={() => downloadICS(session, currentUser)}
                      className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs transition-all"
                      title="Download .ics"
                    >
                      <Download className="w-3.5 h-3.5 text-teal-400" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenRoster(session)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                    >
                      Roster & Teams
                    </button>

                    {weekType === 'next' && (
                      <button
                        onClick={() => cancelSession(session.id)}
                        className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all"
                        title="Leave this session"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
