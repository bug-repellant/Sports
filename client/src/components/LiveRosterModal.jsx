import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSports } from '../context/SportsContext';
import { downloadICS, getGoogleCalendarUrl } from '../utils/icsExport';
import { 
  X, 
  Users, 
  MapPin, 
  Clock, 
  Calendar, 
  Shuffle, 
  Copy, 
  Check, 
  CheckCircle2, 
  UserCheck, 
  Download, 
  CalendarPlus, 
  ShieldAlert, 
  Sparkles, 
  AlertCircle,
  Plus,
  Trash2
} from 'lucide-react';

export default function LiveRosterModal({ session, onClose }) {
  const { currentUser, isAdmin } = useAuth();
  const { signupForSession, cancelSession, markAttendance, showToast, weekType } = useSports();
  
  const [numTeams, setNumTeams] = useState(2);
  const [generatedTeams, setGeneratedTeams] = useState(null);
  const [copiedRoster, setCopiedRoster] = useState(false);
  const [copiedTeams, setCopiedTeams] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  if (!session) return null;

  const isSignedUp = session.participants?.some(
    p => p.email?.toLowerCase() === currentUser?.email?.toLowerCase()
  );

  const participants = session.participants || [];

  // Team Generator / Randomizer
  const handleShuffleTeams = () => {
    if (participants.length === 0) {
      showToast('Need at least 1 player to generate teams!', 'error');
      return;
    }

    const shuffled = [...participants].sort(() => 0.5 - Math.random());
    const teams = [];
    const teamColors = [
      { name: 'Team Red', color: 'border-red-500 bg-red-500/10 text-red-400', badge: '🔴 Team Red' },
      { name: 'Team Blue', color: 'border-blue-500 bg-blue-500/10 text-blue-400', badge: '🔵 Team Blue' },
      { name: 'Team Green', color: 'border-emerald-500 bg-emerald-500/10 text-emerald-400', badge: '🟢 Team Green' },
      { name: 'Team Gold', color: 'border-amber-500 bg-amber-500/10 text-amber-400', badge: '🟡 Team Gold' }
    ];

    for (let i = 0; i < numTeams; i++) {
      teams.push({
        ...teamColors[i % teamColors.length],
        players: []
      });
    }

    shuffled.forEach((player, index) => {
      teams[index % numTeams].players.push(player);
    });

    setGeneratedTeams(teams);
    showToast('🎲 Teams randomized successfully!', 'success');
  };

  const handleCopyRosterText = () => {
    const lines = [
      `🏆 Gameopedia Sports: ${session.sportName} (${session.dayName}, ${session.displayDate})`,
      `📍 Venue: ${session.venue || 'TBD'}`,
      `⏰ Timing: ${session.timing}`,
      `👥 Total Players Registered: ${participants.length}`,
      '',
      ...participants.map((p, i) => `${i + 1}. ${p.name} (${p.department}) - ${p.email}`)
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedRoster(true);
    setTimeout(() => setCopiedRoster(false), 2000);
    showToast('Copied roster to clipboard!', 'info');
  };

  const handleCopyTeamsText = () => {
    if (!generatedTeams) return;
    const lines = [
      `🎲 Gameopedia Team Lineups: ${session.sportName} (${session.dayName})`,
      '',
      ...generatedTeams.flatMap(t => [
        `=== ${t.name} (${t.players.length} Players) ===`,
        ...t.players.map((p, i) => `  ${i + 1}. ${p.name} (${p.department})`),
        ''
      ])
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedTeams(true);
    setTimeout(() => setCopiedTeams(false), 2000);
    showToast('Copied team lineups to clipboard!', 'info');
  };

  const handleToggleSignup = async () => {
    setIsActionLoading(true);
    if (isSignedUp) {
      await cancelSession(session.id);
    } else {
      await signupForSession(session.id);
    }
    setIsActionLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Top Header Banner */}
        <div className={`p-6 bg-gradient-to-r ${session.gradient || 'from-emerald-600 to-teal-700'} text-white relative`}>
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-3xl border border-white/20 shadow-inner">
              {session.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black">{session.sportName} Roster</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white border border-white/30">
                  {participants.length} Players
                </span>
              </div>
              <p className="text-xs text-white/80 mt-0.5">
                {session.dayName}, {session.displayDate} • {session.timing}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200 text-xs">
          
          {/* Venue and Instructions Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                Venue Location
              </span>
              <p className="text-xs font-bold text-white">{session.venue || 'TBD (Admin setting up)'}</p>
              <p className="text-[11px] text-slate-400">{session.courtType || 'Office Reserved Court'}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Gear & Guidelines
              </span>
              <p className="text-xs text-slate-300">{session.gearRequired || 'Standard sports clothing'}</p>
              <p className="text-[11px] text-emerald-400">{session.notes}</p>
            </div>
          </div>

          {/* Participant Roster Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">
                  Colleagues Registered ({participants.length})
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyRosterText}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-all border border-slate-700"
                >
                  {copiedRoster ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedRoster ? 'Copied' : 'Copy List'}</span>
                </button>
              </div>
            </div>

            {participants.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800">
                <p className="text-slate-400">No one has signed up for this session yet.</p>
                <p className="text-slate-500 text-[11px] mt-1">Be the first player to register!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                {participants.map((p, idx) => (
                  <div
                    key={p.email || idx}
                    className={`flex items-center justify-between p-2.5 rounded-2xl bg-slate-950/60 border transition-all ${
                      p.email === currentUser?.email
                        ? 'border-emerald-500/50 bg-emerald-950/20'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <span className="font-mono text-[10px] text-slate-500 w-4">{idx + 1}.</span>
                      <img src={p.avatar} alt={p.name} className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700" />
                      <div className="overflow-hidden">
                        <p className="font-bold text-white text-xs truncate flex items-center gap-1">
                          {p.name}
                          {p.email === currentUser?.email && (
                            <span className="text-[9px] bg-emerald-500 text-slate-950 px-1.5 py-0.2 rounded font-black">
                              YOU
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">{p.department}</p>
                      </div>
                    </div>

                    {/* Attendance check for admin */}
                    {isAdmin && (
                      <button
                        onClick={() => markAttendance(session.id, p.email, !p.attended)}
                        className={`p-1.5 rounded-lg border text-[10px] font-bold transition-all ${
                          p.attended
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                            : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                        }`}
                        title="Toggle attendance check-in"
                      >
                        {p.attended ? '✓ Attended' : 'Check-in'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Interactive Team Splitter Section */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                  <Shuffle className="w-4 h-4 text-blue-400" />
                  Smart Team Generator / Randomizer
                </h4>
                <p className="text-[11px] text-slate-400">
                  Auto-balance signed up players into balanced squads with 1 click.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={numTeams}
                  onChange={(e) => setNumTeams(Number(e.target.value))}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-white focus:outline-none"
                >
                  <option value={2}>2 Teams (Red vs Blue)</option>
                  <option value={3}>3 Teams (Tri-Series)</option>
                  <option value={4}>4 Teams (Tournament)</option>
                </select>

                <button
                  onClick={handleShuffleTeams}
                  disabled={participants.length === 0}
                  className="px-3 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  Shuffle Teams
                </button>
              </div>
            </div>

            {/* Generated Teams Grid */}
            {generatedTeams && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Generated Lineups
                  </span>
                  <button
                    onClick={handleCopyTeamsText}
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
                  >
                    {copiedTeams ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedTeams ? 'Copied' : 'Copy Teams to Clipboard'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {generatedTeams.map((team, tIdx) => (
                    <div key={tIdx} className={`p-3 rounded-2xl border ${team.color} space-y-2`}>
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs">{team.badge}</span>
                        <span className="text-[10px] font-bold bg-slate-900/80 px-2 py-0.5 rounded-full border border-slate-700">
                          {team.players.length} Players
                        </span>
                      </div>
                      <div className="space-y-1">
                        {team.players.map((pl, pIdx) => (
                          <div key={pl.email || pIdx} className="flex items-center gap-2 text-slate-200">
                            <span className="text-slate-500 font-mono text-[10px]">{pIdx + 1}.</span>
                            <span className="font-semibold text-xs">{pl.name}</span>
                            <span className="text-[10px] text-slate-400">({pl.department.split(' ')[0]})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          
          <div className="flex items-center gap-2">
            <a
              href={getGoogleCalendarUrl(session)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <CalendarPlus className="w-3.5 h-3.5 text-blue-400" />
              <span>Google Calendar</span>
            </a>

            <button
              onClick={() => downloadICS(session, currentUser)}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-teal-400" />
              <span>Download .ics</span>
            </button>
          </div>

          {weekType === 'next' ? (
            <button
              onClick={handleToggleSignup}
              disabled={isActionLoading}
              className={`px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-2 shadow-lg disabled:opacity-50 ${
                isSignedUp
                  ? 'bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/40'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
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
                  <span>Sign Up For This Game</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
            >
              Close
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
