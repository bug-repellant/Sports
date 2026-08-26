import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSports } from '../context/SportsContext';
import { downloadICS, getGoogleCalendarUrl } from '../utils/icsExport';
import { 
  Users, 
  MapPin, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  Plus, 
  X, 
  Share2, 
  CalendarPlus, 
  Download, 
  Shuffle, 
  ShieldAlert,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export default function SportCard({ session, onOpenRoster }) {
  const { currentUser, isAdmin } = useAuth();
  const { signupForSession, cancelSession, weekType } = useSports();
  const [isHovered, setIsHovered] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const isSignedUp = session.participants?.some(
    p => p.email?.toLowerCase() === currentUser?.email?.toLowerCase()
  );

  const participantCount = session.participants?.length || 0;
  const isSubsequentWeek = weekType === 'next';

  const handleToggleSignup = async (e) => {
    e.stopPropagation();
    setIsActionLoading(true);
    if (isSignedUp) {
      await cancelSession(session.id);
    } else {
      await signupForSession(session.id);
    }
    setIsActionLoading(false);
  };

  const getStatusBadge = () => {
    switch (session.status) {
      case 'venue_confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            Venue Confirmed
          </span>
        );
      case 'open':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <Sparkles className="w-3 h-3" />
            Signups Open
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
            Completed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            Booking in Progress
          </span>
        );
    }
  };

  return (
    <div 
      className={`relative rounded-3xl overflow-hidden glass-panel glass-panel-hover border transition-all duration-300 flex flex-col justify-between ${
        isSignedUp ? 'border-emerald-500/50 ring-1 ring-emerald-500/20' : 'border-slate-800 hover:border-slate-700'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Top Banner Gradient */}
      <div className={`h-2.5 w-full bg-gradient-to-r ${session.gradient || 'from-emerald-500 to-teal-500'}`} />

      {/* Main Content */}
      <div className="p-5 sm:p-6 space-y-4 flex-1">
        
        {/* Header: Sport Name, Icon, Date Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700/80 flex items-center justify-center text-2xl shadow-inner shrink-0">
              {session.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg text-white tracking-tight">{session.sportName}</h3>
                {isSignedUp && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950">
                    YOU'RE IN
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">{session.courtType || session.category}</p>
            </div>
          </div>

          {getStatusBadge()}
        </div>

        {/* Date and Day Row */}
        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs">
          <div className="flex items-center gap-2 text-slate-200 font-semibold">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>{session.dayName}, {session.displayDate}</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {session.isWeekend ? '⚡ Weekend' : 'Weekday Run'}
          </span>
        </div>

        {/* Venue & Timing Details */}
        <div className="space-y-2 text-xs">
          
          {/* Timing */}
          <div className="flex items-start gap-2.5 text-slate-300">
            <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-400 font-medium">Timing: </span>
              <strong className="text-white">{session.timing || '18:30 – 20:30'}</strong>
            </div>
          </div>

          {/* Venue */}
          <div className="flex items-start gap-2.5 text-slate-300">
            <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-400 font-medium">Venue: </span>
              <strong className="text-white">{session.venue || 'TBD (Admin will update)'}</strong>
            </div>
          </div>

          {/* Equipment rule */}
          {session.gearRequired && (
            <p className="text-[11px] text-slate-400 italic bg-slate-900/50 p-2 rounded-xl border border-slate-800/50">
              👟 {session.gearRequired}
            </p>
          )}
        </div>

        {/* Participants Roster & Avatars */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>{participantCount} Players Signed Up</span>
              <span className="text-[10px] text-slate-500 font-normal">(Unlimited)</span>
            </div>

            <button
              onClick={() => onOpenRoster(session)}
              className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 hover:underline"
            >
              <span>View Roster & Teams</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {/* Avatar stack */}
          {participantCount > 0 ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              <div className="flex -space-x-2 overflow-hidden py-1">
                {session.participants.slice(0, 5).map((p, idx) => (
                  <img
                    key={p.email || idx}
                    src={p.avatar}
                    alt={p.name}
                    title={`${p.name} (${p.department})`}
                    className="inline-block h-8 w-8 rounded-full ring-2 ring-slate-900 object-cover"
                  />
                ))}
              </div>
              {participantCount > 5 && (
                <span className="text-xs font-bold text-slate-400 bg-slate-900 px-2 py-1 rounded-full border border-slate-800">
                  +{participantCount - 5} more
                </span>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic py-1">No signups yet. Be the first to join!</p>
          )}
        </div>

      </div>

      {/* Action Footer */}
      <div className="p-4 bg-slate-950/70 border-t border-slate-800/80 flex items-center justify-between gap-2">
        
        {/* Calendar Quick Sync */}
        <div className="flex items-center gap-1">
          <a
            href={getGoogleCalendarUrl(session)}
            target="_blank"
            rel="noopener noreferrer"
            title="Add to Google Calendar"
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all text-xs flex items-center gap-1"
          >
            <CalendarPlus className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">GCal</span>
          </a>

          <button
            onClick={() => downloadICS(session, currentUser)}
            title="Download .ics Calendar File"
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all text-xs flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">.ics</span>
          </button>
        </div>

        {/* Main Join / Leave Button */}
        {isSubsequentWeek ? (
          <button
            onClick={handleToggleSignup}
            disabled={isActionLoading}
            className={`px-4 py-2.5 rounded-xl font-black text-xs transition-all duration-200 flex items-center gap-2 shadow-lg disabled:opacity-50 ${
              isSignedUp
                ? 'bg-rose-500/15 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/20 hover:scale-[1.02]'
            }`}
          >
            {isSignedUp ? (
              <>
                <X className="w-4 h-4" />
                <span>Leave Session</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Join Game</span>
              </>
            )}
          </button>
        ) : (
          <button
            onClick={() => onOpenRoster(session)}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-800 transition-all"
          >
            View Roster
          </button>
        )}
      </div>

    </div>
  );
}
